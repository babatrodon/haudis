"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  BUCHUNG_COOKIE,
  buchungAnlegen,
  buchungErgaenzen,
  buchungLesen,
} from "@/lib/buchung";
import {
  buchungSchema,
  ergaenzungSchema,
  wartelisteSchema,
} from "@/lib/buchung-schema";
import { bestaetigungSenden, interneBenachrichtigungSenden } from "@/lib/mail";
import { ipAusHeadern, rateLimit } from "@/lib/rate-limit";
import { wartelisteEintragen } from "@/lib/warteliste";

/**
 * Server Actions des Buchungsablaufs.
 *
 * Jede Action validiert selbst mit Zod. Was der Browser gemeldet hat, zaehlt
 * hier nicht: die Formularpruefung ist Komfort, diese Pruefung ist die
 * verbindliche.
 */

const COOKIE_MINUTEN = 30;

/** Ein Mensch fuellt in zehn Minuten keine fuenf Anmeldungen aus. */
const LIMIT = { maximum: 5, fensterSekunden: 600 };

export type AnmeldeErgebnis = { fehler: string } | null;

export async function anmeldenAktion(
  _bisher: AnmeldeErgebnis,
  formular: FormData,
): Promise<AnmeldeErgebnis> {
  const kursId = String(formular.get("kursId") ?? "");
  if (!kursId) {
    return { fehler: "Kurs nicht gefunden." };
  }

  const kopfzeilen = await headers();
  const grenze = rateLimit(`anmeldung:${ipAusHeadern(kopfzeilen)}`, LIMIT);
  if (!grenze.erlaubt) {
    return {
      fehler:
        "Zu viele Anmeldeversuche in kurzer Zeit. Bitte warte einen Moment oder ruf uns an.",
    };
  }

  const geprueft = buchungSchema.safeParse({
    anrede: formular.get("anrede"),
    nachname: formular.get("nachname"),
    vorname: formular.get("vorname"),
    strasse: formular.get("strasse"),
    plz: formular.get("plz"),
    ort: formular.get("ort"),
    geburtsdatum: formular.get("geburtsdatum"),
    telefon: formular.get("telefon"),
    email: formular.get("email"),
    agb: formular.get("agb") === "on" || formular.get("agb") === "true",
    webseite: formular.get("webseite") ?? "",
  });

  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  // Honigtopf. Das Feld ist fuer Menschen unsichtbar; ist es gefuellt, war ein
  // Bot am Werk. Bewusst dieselbe Antwort wie bei Erfolg nach aussen, aber
  // ohne Schreibvorgang: ein Bot soll nicht lernen, woran er gescheitert ist.
  if (geprueft.data.webseite) {
    redirect(`/anmeldung/${kursId}/bestaetigung`);
  }

  const einladungsToken = String(formular.get("einladungsToken") ?? "").trim();
  const ergebnis = await buchungAnlegen(kursId, geprueft.data, {
    einladungsToken: einladungsToken || undefined,
  });

  if (!ergebnis.erfolg) {
    const meldungen: Record<typeof ergebnis.fehler, string> = {
      "kurs-nicht-buchbar":
        "Dieser Kurs kann nicht mehr online gebucht werden. Ruf uns an, wir finden einen Platz.",
      ausgebucht:
        "Dieser Kurs ist inzwischen ausgebucht. Ruf uns an, wir sagen Dir, wann der nächste startet.",
      doppelbuchung:
        "Für diese E-Mail-Adresse liegt schon eine Anmeldung zu diesem Kurs vor. Ruf uns an, wenn etwas nicht stimmt.",
    };
    return { fehler: meldungen[ergebnis.fehler] };
  }

  // Ab hier ist der Platz vergeben. Alles Weitere darf die Buchung nicht mehr
  // umwerfen, deshalb steht der Mailversand ausserhalb der Transaktion und
  // seine Fehler werden nur protokolliert.
  const buchung = await buchungLesen(ergebnis.buchungId);
  if (buchung) {
    const [bestaetigung, intern] = await Promise.all([
      bestaetigungSenden(buchung),
      interneBenachrichtigungSenden(buchung),
    ]);
    if (!bestaetigung.gesendet) {
      console.warn(
        `[Buchung ${ergebnis.buchungId}] Bestätigung nicht versendet: ${bestaetigung.grund}`,
      );
    }
    if (!intern.gesendet && intern.grund !== "in den Einstellungen abgeschaltet") {
      console.warn(
        `[Buchung ${ergebnis.buchungId}] interne Kopie nicht versendet: ${intern.grund}`,
      );
    }
  }

  const kekse = await cookies();
  kekse.set(BUCHUNG_COOKIE, ergebnis.buchungId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MINUTEN * 60,
  });

  redirect(`/anmeldung/${kursId}/schritt-2`);
}

export type ErgaenzungErgebnis = { fehler: string } | null;

export async function ergaenzenAktion(
  _bisher: ErgaenzungErgebnis,
  formular: FormData,
): Promise<ErgaenzungErgebnis> {
  const kursId = String(formular.get("kursId") ?? "");
  const kekse = await cookies();
  const buchungId = kekse.get(BUCHUNG_COOKIE)?.value;

  if (!buchungId) {
    // Cookie abgelaufen oder Schritt 2 direkt aufgerufen. Die Anmeldung selbst
    // steht bereits, deshalb geht es ohne Fehlermeldung zur Bestaetigung.
    redirect(`/anmeldung/${kursId}/bestaetigung`);
  }

  const geprueft = ergaenzungSchema.safeParse({
    lfaNummer: formular.get("lfaNummer") ?? "",
    smsErinnerung: formular.get("smsErinnerung") === "on",
    smsTelefon: formular.get("smsTelefon") ?? "",
  });

  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  await buchungErgaenzen(buchungId, {
    lfaNummer: geprueft.data.lfaNummer || undefined,
    smsErinnerung: geprueft.data.smsErinnerung,
    smsTelefon: geprueft.data.smsTelefon || undefined,
  });

  redirect(`/anmeldung/${kursId}/bestaetigung`);
}

export type WartelisteErgebnis =
  | { fehler: string }
  | { erfolg: true; position: number }
  | null;

/**
 * Eintragen auf die Warteliste eines ausgebuchten Kurses.
 *
 * Kein Redirect, anders als bei der Anmeldung: es entsteht keine Buchung, auf
 * deren Bestaetigungsseite man weiterleiten koennte. Die Rueckmeldung steht
 * an Ort und Stelle, mit der Position in der Schlange — die ist das Einzige,
 * was die Person jetzt wissen will.
 */
export async function wartelisteEintragenAktion(
  _bisher: WartelisteErgebnis,
  formular: FormData,
): Promise<WartelisteErgebnis> {
  const kursId = String(formular.get("kursId") ?? "");
  if (!kursId) {
    return { fehler: "Kurs nicht gefunden." };
  }

  const kopfzeilen = await headers();
  const grenze = rateLimit(`warteliste:${ipAusHeadern(kopfzeilen)}`, LIMIT);
  if (!grenze.erlaubt) {
    return {
      fehler:
        "Zu viele Versuche in kurzer Zeit. Bitte warte einen Moment oder ruf uns an.",
    };
  }

  const geprueft = wartelisteSchema.safeParse({
    vorname: formular.get("vorname"),
    nachname: formular.get("nachname"),
    telefon: formular.get("telefon"),
    email: formular.get("email"),
    webseite: formular.get("webseite") ?? "",
  });

  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  // Honigtopf wie bei der Anmeldung: nach aussen Erfolg, ohne zu schreiben.
  if (geprueft.data.webseite) {
    return { erfolg: true, position: 1 };
  }

  const ergebnis = await wartelisteEintragen(kursId, geprueft.data);

  if (!ergebnis.erfolg) {
    const meldungen: Record<typeof ergebnis.fehler, string> = {
      "kurs-nicht-buchbar":
        "Dieser Kurs nimmt keine Anmeldungen mehr entgegen. Ruf uns an, wir finden einen Platz.",
      "noch-plaetze-frei":
        "Gute Nachricht: es ist wieder ein Platz frei. Lade die Seite neu, dann kannst Du Dich direkt anmelden.",
      "schon-eingetragen":
        "Du stehst mit dieser E-Mail-Adresse bereits auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.",
    };
    return { fehler: meldungen[ergebnis.fehler] };
  }

  return { erfolg: true, position: ergebnis.position };
}
