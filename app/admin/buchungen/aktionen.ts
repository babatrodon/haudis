"use server";

import { revalidatePath } from "next/cache";
import {
  buchungAendern,
  buchungLoeschen,
  buchungReaktivieren,
  buchungStornieren,
  lfaSetzen,
} from "@/lib/admin/buchungen";
import {
  buchungAendernSchema,
  lfaSchema,
  telefonAnmeldungSchema,
} from "@/lib/admin/buchung-schema";
import { requireRole } from "@/lib/auth-guard";
import {
  einladungErneutSenden,
  naechstenBenachrichtigen,
  wartendenEntfernen,
} from "@/lib/admin/warteliste";
import { buchungAnlegen } from "@/lib/buchung";

/**
 * Server Actions der Buchungsverwaltung.
 *
 * Jede prueft zuerst die Rolle und validiert danach selbst. Eine Action ist ein
 * oeffentlicher Endpunkt, auch wenn sie nur von einer geschuetzten Seite aus
 * aufgerufen wird.
 */

function auffrischen(kursId?: string): void {
  revalidatePath("/admin/buchungen");
  revalidatePath("/admin");
  if (kursId) {
    revalidatePath(`/admin/kurse/${kursId}/buchungen`);
    revalidatePath(`/admin/kurse/${kursId}`);
  }
  // Eine Stornierung gibt einen Platz frei, eine Anmeldung nimmt einen weg.
  // Beides aendert die Ampel auf der oeffentlichen Seite.
  revalidatePath("/", "layout");
}

export type BuchungErgebnisMeldung =
  | { fehler: string }
  | { erledigt: string }
  | null;

/**
 * Telefonische Anmeldung.
 *
 * Laeuft durch dieselbe Funktion wie die Onlineanmeldung, also mit derselben
 * Zeilensperre und derselben Preisberechnung. Der einzige Unterschied steht in
 * der Quelle: PHONE loest kein Bestaetigungsmail aus (Geschaeftsregel 4).
 */
export async function telefonAnmeldungAktion(
  _bisher: BuchungErgebnisMeldung,
  formular: FormData,
): Promise<BuchungErgebnisMeldung> {
  await requireRole("ADMIN");

  const geprueft = telefonAnmeldungSchema.safeParse({
    kursId: formular.get("kursId"),
    anrede: formular.get("anrede"),
    nachname: formular.get("nachname"),
    vorname: formular.get("vorname"),
    strasse: formular.get("strasse"),
    plz: formular.get("plz"),
    ort: formular.get("ort"),
    geburtsdatum: formular.get("geburtsdatum"),
    telefon: formular.get("telefon"),
    email: formular.get("email"),
    lfaNummer: formular.get("lfaNummer") ?? "",
    fahrlehrerId: formular.get("fahrlehrerId") ?? "",
  });

  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  const daten = geprueft.data;
  const ergebnis = await buchungAnlegen(
    daten.kursId,
    { ...daten, agb: true, webseite: "" },
    {
      quelle: "PHONE",
      lfaNummer: daten.lfaNummer,
      referredById: daten.fahrlehrerId || null,
    },
  );

  if (!ergebnis.erfolg) {
    const meldungen = {
      "kurs-nicht-buchbar": "Dieser Kurs nimmt keine Anmeldungen mehr an.",
      ausgebucht: "Dieser Kurs ist voll. Für einen Zusatzplatz das Limit erhöhen.",
      doppelbuchung: "Für diese Adresse liegt bereits eine Anmeldung vor.",
    };
    return { fehler: meldungen[ergebnis.fehler] };
  }

  auffrischen(daten.kursId);
  return {
    erledigt: `${daten.vorname} ${daten.nachname} ist angemeldet. Es wurde kein Bestätigungsmail verschickt.`,
  };
}

export async function lfaSetzenAktion(
  _bisher: BuchungErgebnisMeldung,
  formular: FormData,
): Promise<BuchungErgebnisMeldung> {
  await requireRole("ADMIN");

  const geprueft = lfaSchema.safeParse({
    buchungId: formular.get("buchungId"),
    lfaNummer: formular.get("lfaNummer") ?? "",
  });
  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  await lfaSetzen(geprueft.data.buchungId, geprueft.data.lfaNummer);
  auffrischen(String(formular.get("kursId") ?? "") || undefined);
  return { erledigt: "Ausweisnummer gespeichert." };
}

export async function buchungAendernAktion(
  _bisher: BuchungErgebnisMeldung,
  formular: FormData,
): Promise<BuchungErgebnisMeldung> {
  await requireRole("ADMIN");

  const geprueft = buchungAendernSchema.safeParse({
    buchungId: formular.get("buchungId"),
    anrede: formular.get("anrede"),
    nachname: formular.get("nachname"),
    vorname: formular.get("vorname"),
    strasse: formular.get("strasse"),
    plz: formular.get("plz"),
    ort: formular.get("ort"),
    geburtsdatum: formular.get("geburtsdatum"),
    telefon: formular.get("telefon"),
    email: formular.get("email"),
    lfaNummer: formular.get("lfaNummer") ?? "",
    fahrlehrerId: formular.get("fahrlehrerId") ?? "",
  });

  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  await buchungAendern(geprueft.data.buchungId, geprueft.data);
  auffrischen(String(formular.get("kursId") ?? "") || undefined);
  return { erledigt: "Änderung gespeichert." };
}

export async function buchungStornierenAktion(
  _bisher: BuchungErgebnisMeldung,
  formular: FormData,
): Promise<BuchungErgebnisMeldung> {
  await requireRole("ADMIN");

  const buchungId = String(formular.get("buchungId") ?? "");
  if (!buchungId) return { fehler: "Buchung nicht gefunden." };

  await buchungStornieren(buchungId);
  auffrischen(String(formular.get("kursId") ?? "") || undefined);
  return { erledigt: "Storniert. Der Platz ist wieder frei." };
}

export async function buchungReaktivierenAktion(
  _bisher: BuchungErgebnisMeldung,
  formular: FormData,
): Promise<BuchungErgebnisMeldung> {
  await requireRole("ADMIN");

  const buchungId = String(formular.get("buchungId") ?? "");
  if (!buchungId) return { fehler: "Buchung nicht gefunden." };

  const ergebnis = await buchungReaktivieren(buchungId);
  if (!ergebnis.erfolg) {
    return {
      fehler:
        ergebnis.fehler === "ausgebucht"
          ? "Der Kurs ist inzwischen voll. Erst einen Platz freimachen oder das Limit erhöhen."
          : "Buchung nicht gefunden.",
    };
  }

  auffrischen(String(formular.get("kursId") ?? "") || undefined);
  return { erledigt: "Wieder angemeldet." };
}

/**
 * Endgueltig loeschen. Nur fuer Fehleingaben, deshalb getrennt vom
 * Stornieren und mit eigener Rueckfrage im Panel.
 */
export async function buchungLoeschenAktion(
  _bisher: BuchungErgebnisMeldung,
  formular: FormData,
): Promise<BuchungErgebnisMeldung> {
  await requireRole("ADMIN");

  const buchungId = String(formular.get("buchungId") ?? "");
  if (!buchungId) return { fehler: "Buchung nicht gefunden." };

  await buchungLoeschen(buchungId);
  auffrischen(String(formular.get("kursId") ?? "") || undefined);
  return { erledigt: "Gelöscht." };
}

/**
 * Naechste Person von der Warteliste einladen.
 *
 * Von Hand, wenn die automatische Mail beim Stornieren nicht ankam oder wenn
 * ein Platz auf anderem Weg frei wurde — etwa weil Ausilia das Limit erhoeht
 * hat.
 */
export async function wartelisteBenachrichtigenAktion(
  _bisher: BuchungErgebnisMeldung,
  formular: FormData,
): Promise<BuchungErgebnisMeldung> {
  await requireRole("ADMIN");

  const kursId = String(formular.get("kursId") ?? "");
  if (!kursId) return { fehler: "Kurs nicht gefunden." };

  const ergebnis = await naechstenBenachrichtigen(kursId);
  if (!ergebnis.erfolg) return { fehler: ergebnis.grund ?? "Nicht möglich." };

  auffrischen(kursId);
  return {
    erledigt: process.env.RESEND_API_KEY
      ? "Eingeladen. Der Platz ist 48 Stunden reserviert."
      : "Eingeladen, aber ohne E-Mail: es ist kein Versandschlüssel gesetzt. Bitte anrufen.",
  };
}

/** Dieselbe Einladung noch einmal verschicken, Frist und Link bleiben gleich. */
export async function einladungErneutSendenAktion(
  _bisher: BuchungErgebnisMeldung,
  formular: FormData,
): Promise<BuchungErgebnisMeldung> {
  await requireRole("ADMIN");

  const eintragId = String(formular.get("eintragId") ?? "");
  if (!eintragId) return { fehler: "Eintrag nicht gefunden." };

  const ergebnis = await einladungErneutSenden(eintragId);
  if (!ergebnis.erfolg) return { fehler: ergebnis.grund ?? "Nicht möglich." };

  auffrischen(String(formular.get("kursId") ?? "") || undefined);
  return {
    erledigt: process.env.RESEND_API_KEY
      ? "Einladung noch einmal verschickt."
      : "Nicht verschickt: es ist kein Versandschlüssel gesetzt. Bitte anrufen.",
  };
}

/** Von der Warteliste streichen. Die Zeile bleibt als Beleg stehen. */
export async function wartendenEntfernenAktion(
  _bisher: BuchungErgebnisMeldung,
  formular: FormData,
): Promise<BuchungErgebnisMeldung> {
  await requireRole("ADMIN");

  const eintragId = String(formular.get("eintragId") ?? "");
  if (!eintragId) return { fehler: "Eintrag nicht gefunden." };

  await wartendenEntfernen(eintragId);
  auffrischen(String(formular.get("kursId") ?? "") || undefined);
  return { erledigt: "Von der Warteliste gestrichen." };
}
