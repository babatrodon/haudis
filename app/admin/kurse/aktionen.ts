"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  kursAbsagen,
  kursAktualisieren,
  kursAnlegen,
  kursDuplizieren,
  kursVeroeffentlichen,
  kursZurueckziehen,
  sariVermerken,
} from "@/lib/admin/kurse";
import {
  absagenSchema,
  duplizierenSchema,
  kursSchema,
} from "@/lib/admin/kurs-schema";
import { requireRole } from "@/lib/auth-guard";
import { datumLang } from "@/lib/format";
import { absageSenden } from "@/lib/mail";

/**
 * Server Actions der Kursverwaltung.
 *
 * Jede prueft zuerst die Rolle. Eine Action ist ein oeffentlicher Endpunkt,
 * auch wenn sie nur von einer geschuetzten Seite aus aufgerufen wird — der
 * Schutz der Seite schuetzt die Action nicht mit.
 *
 * Danach validiert jede selbst mit Zod. Was der Browser gemeldet hat, zaehlt
 * hier nicht.
 */

/**
 * Kurse sind oeffentlich sichtbar, und die Website liegt eine Stunde im Cache
 * (siehe app/(public)/layout.tsx). Ohne das hier sieht die Kundin einen neuen
 * Kurs erst nach bis zu einer Stunde — und einen abgesagten genauso lange
 * weiter.
 */
function oeffentlichAuffrischen(): void {
  revalidatePath("/", "layout");
}

function adminAuffrischen(kursId?: string): void {
  revalidatePath("/admin/kurse");
  revalidatePath("/admin");
  if (kursId) revalidatePath(`/admin/kurse/${kursId}`);
}

export type KursErgebnis = { fehler: string } | null;

/** Termine kommen als JSON, weil ihre Anzahl erst im Formular feststeht. */
function termineLesen(formular: FormData): unknown {
  const roh = String(formular.get("termine") ?? "[]");
  try {
    return JSON.parse(roh);
  } catch {
    return [];
  }
}

function formularLesen(formular: FormData) {
  return {
    kursartId: formular.get("kursartId"),
    termine: termineLesen(formular),
    preis: formular.get("preis"),
    materialpreis: formular.get("materialpreis"),
    onlineLimit: formular.get("onlineLimit"),
    fruehbucherProzent: formular.get("fruehbucherProzent") ?? "",
    fruehbucherPlaetze: formular.get("fruehbucherPlaetze") ?? "",
    notizen: formular.get("notizen") ?? "",
    veroeffentlichen: formular.get("veroeffentlichen") === "true",
  };
}

export async function kursAnlegenAktion(
  _bisher: KursErgebnis,
  formular: FormData,
): Promise<KursErgebnis> {
  await requireRole("ADMIN");

  const geprueft = kursSchema.safeParse(formularLesen(formular));
  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  const kursId = await kursAnlegen(geprueft.data);

  adminAuffrischen(kursId);
  if (geprueft.data.veroeffentlichen) oeffentlichAuffrischen();

  redirect(`/admin/kurse/${kursId}`);
}

export async function kursAktualisierenAktion(
  _bisher: KursErgebnis,
  formular: FormData,
): Promise<KursErgebnis> {
  await requireRole("ADMIN");

  const kursId = String(formular.get("kursId") ?? "");
  if (!kursId) return { fehler: "Kurs nicht gefunden." };

  const geprueft = kursSchema.safeParse(formularLesen(formular));
  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  await kursAktualisieren(kursId, geprueft.data);

  adminAuffrischen(kursId);
  // Immer, nicht nur beim Veroeffentlichen: auch ein zurueckgezogener oder im
  // Preis geaenderter Kurs muss draussen stimmen.
  oeffentlichAuffrischen();

  redirect(`/admin/kurse/${kursId}`);
}

export async function kursDuplizierenAktion(
  _bisher: KursErgebnis,
  formular: FormData,
): Promise<KursErgebnis> {
  await requireRole("ADMIN");

  const geprueft = duplizierenSchema.safeParse({
    kursId: formular.get("kursId"),
    neuerStart: formular.get("neuerStart"),
  });
  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  const ergebnis = await kursDuplizieren(
    geprueft.data.kursId,
    geprueft.data.neuerStart,
  );

  if (!ergebnis.erfolg) {
    return {
      fehler:
        ergebnis.fehler === "keine-termine"
          ? "Dieser Kurs hat keine Termine, es gibt nichts zu verschieben."
          : "Kurs nicht gefunden.",
    };
  }

  // Das Duplikat ist ein Entwurf, die oeffentliche Seite aendert sich nicht.
  adminAuffrischen(ergebnis.kursId);
  redirect(`/admin/kurse/${ergebnis.kursId}`);
}

export type AbsageAktionErgebnis =
  | { fehler: string }
  | { erledigt: true; benachrichtigt: number; nichtErreicht: number }
  | null;

export async function kursAbsagenAktion(
  _bisher: AbsageAktionErgebnis,
  formular: FormData,
): Promise<AbsageAktionErgebnis> {
  await requireRole("ADMIN");

  const geprueft = absagenSchema.safeParse({
    kursId: formular.get("kursId"),
    benachrichtigen: formular.get("benachrichtigen") === "on",
    grund: formular.get("grund") ?? "",
  });
  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  const ergebnis = await kursAbsagen(
    geprueft.data.kursId,
    geprueft.data.grund ?? "",
  );

  if (!ergebnis.erfolg) {
    return {
      fehler:
        ergebnis.fehler === "bereits-abgesagt"
          ? "Dieser Kurs ist bereits abgesagt."
          : "Kurs nicht gefunden.",
    };
  }

  adminAuffrischen(geprueft.data.kursId);
  oeffentlichAuffrischen();

  if (!geprueft.data.benachrichtigen) {
    return { erledigt: true, benachrichtigt: 0, nichtErreicht: 0 };
  }

  // Ab hier ist der Kurs abgesagt. Ein Fehler beim Mailversand darf daran
  // nichts mehr aendern; er wird gezaehlt und gemeldet, damit Ausilia weiss,
  // wen sie anrufen muss.
  const termine = ergebnis.termine.map((termin) => ({
    datum: datumLang(termin.datum),
    von: termin.von,
    bis: termin.bis,
  }));

  const versand = await Promise.all(
    ergebnis.betroffene.map((person) =>
      absageSenden({
        an: person.email,
        vorname: person.firstName,
        kursName: ergebnis.kursName,
        termine,
        grund: geprueft.data.grund ?? "",
      }),
    ),
  );

  const gesendet = versand.filter((eintrag) => eintrag.gesendet).length;
  const gescheitert = versand.length - gesendet;
  if (gescheitert > 0) {
    console.warn(
      `[Absage ${geprueft.data.kursId}] ${gescheitert} von ${versand.length} Benachrichtigungen nicht versendet.`,
    );
  }

  return {
    erledigt: true,
    benachrichtigt: gesendet,
    nichtErreicht: gescheitert,
  };
}

export type StatusErgebnis = { fehler: string } | null;

export async function kursVeroeffentlichenAktion(
  _bisher: StatusErgebnis,
  formular: FormData,
): Promise<StatusErgebnis> {
  await requireRole("ADMIN");

  const kursId = String(formular.get("kursId") ?? "");
  if (!kursId) return { fehler: "Kurs nicht gefunden." };

  const ergebnis = await kursVeroeffentlichen(kursId);
  if (!ergebnis.erfolg) {
    return { fehler: "Ohne Termine lässt sich der Kurs nicht veröffentlichen." };
  }

  adminAuffrischen(kursId);
  oeffentlichAuffrischen();
  return null;
}

export async function kursZurueckziehenAktion(
  _bisher: StatusErgebnis,
  formular: FormData,
): Promise<StatusErgebnis> {
  await requireRole("ADMIN");

  const kursId = String(formular.get("kursId") ?? "");
  if (!kursId) return { fehler: "Kurs nicht gefunden." };

  await kursZurueckziehen(kursId);

  adminAuffrischen(kursId);
  oeffentlichAuffrischen();
  return null;
}

export async function sariVermerkenAktion(formular: FormData): Promise<void> {
  await requireRole("ADMIN");

  const kursId = String(formular.get("kursId") ?? "");
  const feld = String(formular.get("feld") ?? "");
  if (!kursId || (feld !== "angemeldet" && feld !== "bestaetigt")) return;

  await sariVermerken(kursId, feld, formular.get("gesetzt") === "true");
  adminAuffrischen(kursId);
}
