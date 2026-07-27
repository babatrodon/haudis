"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  aboAnlegen,
  aboZahlstatusSetzen,
  pruefungEintragen,
  schuelerAendern,
  schuelerAnlegen,
} from "@/lib/admin/schueler";
import { requireInstruktorProfil, requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { telefonSchema } from "@/lib/buchung-schema";
import { lektionPlanen, lektionStatusSetzen } from "@/lib/schueler";
import { wabErinnerungWiederholen, wabLaufAusfuehren } from "@/lib/wab";
import type { LessonStatus } from "@/lib/generated/prisma/enums";

/**
 * Server Actions der Schuelerkartei.
 *
 * Jede Action prueft die Rolle selbst. Das Panel blendet Knoepfe aus, die
 * jemand nicht braucht — aber ein ausgeblendeter Knopf ist keine Zugangssperre,
 * und diese Daten sind Personendaten.
 *
 * Die Trennung ist scharf: Anlegen, Aendern, Abos und das Planen von Lektionen
 * gehoeren der Admin. Ein Fahrlehrer hakt ab und traegt das Pruefungsdatum ein,
 * beides nur bei seinen eigenen Schuelern.
 */

export type SchuelerMeldung =
  | { fehler: string }
  | { erledigt: string }
  | null;

const KATEGORIEN = ["AUTO", "TAXI", "MOTORRAD", "LKW", "ANHAENGER_BE"] as const;
const STATUS = ["GEPLANT", "ABSOLVIERT", "STORNIERT", "NO_SHOW"] as const;

const personSchema = z.object({
  vorname: z.string().trim().min(1, "Vorname fehlt").max(80),
  nachname: z.string().trim().min(1, "Nachname fehlt").max(80),
  telefon: telefonSchema,
  email: z
    .string()
    .trim()
    .max(160)
    .email("E-Mail-Adresse prüfen")
    .optional()
    .or(z.literal("")),
  notiz: z.string().trim().max(2000).optional().or(z.literal("")),
});

function auffrischen(studentId?: string) {
  revalidatePath("/admin/schueler");
  if (studentId) revalidatePath(`/admin/schueler/${studentId}`);
  revalidatePath("/portal/schueler");
}

export async function schuelerAnlegenAktion(
  _bisher: SchuelerMeldung,
  formular: FormData,
): Promise<SchuelerMeldung> {
  await requireRole("ADMIN");

  const geprueft = personSchema.safeParse({
    vorname: formular.get("vorname"),
    nachname: formular.get("nachname"),
    telefon: formular.get("telefon"),
    email: formular.get("email") ?? "",
    notiz: formular.get("notiz") ?? "",
  });
  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  const id = await schuelerAnlegen(geprueft.data);
  auffrischen(id);
  redirect(`/admin/schueler/${id}`);
}

export async function schuelerAendernAktion(
  _bisher: SchuelerMeldung,
  formular: FormData,
): Promise<SchuelerMeldung> {
  await requireRole("ADMIN");

  const studentId = String(formular.get("studentId") ?? "");
  if (!studentId) return { fehler: "Schüler nicht gefunden." };

  const geprueft = personSchema.safeParse({
    vorname: formular.get("vorname"),
    nachname: formular.get("nachname"),
    telefon: formular.get("telefon"),
    email: formular.get("email") ?? "",
    notiz: formular.get("notiz") ?? "",
  });
  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  await schuelerAendern(studentId, geprueft.data);
  auffrischen(studentId);
  return { erledigt: "Gespeichert." };
}

/**
 * Praktische Pruefung eintragen.
 *
 * Darf die Admin und der zustaendige Fahrlehrer (PLAN.md Abschnitt 14 Spec 4).
 * Der Fahrlehrer nur bei seinen eigenen Schuelern — geprueft ueber eine
 * zugewiesene Lektion, dieselbe Zuordnung wie "Meine Schüler".
 */
export async function pruefungEintragenAktion(
  _bisher: SchuelerMeldung,
  formular: FormData,
): Promise<SchuelerMeldung> {
  const studentId = String(formular.get("studentId") ?? "");
  if (!studentId) return { fehler: "Schüler nicht gefunden." };

  const alsPortal = formular.get("portal") === "true";
  if (alsPortal) {
    const { profil } = await requireInstruktorProfil();
    if (!profil) return { fehler: "Kein Fahrlehrer-Profil hinterlegt." };
    const eigene = await prisma.lesson.count({
      where: { studentId, instructorId: profil.id },
    });
    if (eigene === 0) {
      return { fehler: "Dieser Schüler ist Dir nicht zugewiesen." };
    }
  } else {
    await requireRole("ADMIN");
  }

  const roh = String(formular.get("pruefungAm") ?? "").trim();
  if (roh && Number.isNaN(Date.parse(roh))) {
    return { fehler: "Datum prüfen." };
  }

  await pruefungEintragen(studentId, roh || null);
  auffrischen(studentId);
  return {
    erledigt: roh
      ? "Prüfungsdatum gespeichert. Die WAB-Erinnerung geht 11 Monate danach raus."
      : "Prüfungsdatum entfernt.",
  };
}

export async function aboAnlegenAktion(
  _bisher: SchuelerMeldung,
  formular: FormData,
): Promise<SchuelerMeldung> {
  await requireRole("ADMIN");

  const studentId = String(formular.get("studentId") ?? "");
  const kategorie = String(formular.get("kategorie") ?? "");
  const groesse = Number(formular.get("groesse"));
  const preis = String(formular.get("preisProLektion") ?? "").trim();
  const zahlart = String(formular.get("zahlart") ?? "BAR");

  if (!studentId) return { fehler: "Schüler nicht gefunden." };
  if (!KATEGORIEN.includes(kategorie as (typeof KATEGORIEN)[number])) {
    return { fehler: "Kategorie wählen." };
  }
  if (![1, 5, 10].includes(groesse)) {
    return { fehler: "Grösse muss 1, 5 oder 10 sein." };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(preis) || Number(preis) <= 0) {
    return { fehler: "Preis pro Lektion prüfen." };
  }

  await aboAnlegen({
    studentId,
    kategorie: kategorie as (typeof KATEGORIEN)[number],
    groesse,
    preisProLektion: preis,
    zahlart: zahlart as "BAR" | "TWINT" | "KARTE",
    bezahlt: formular.get("bezahlt") === "on",
  });
  auffrischen(studentId);
  return { erledigt: `${groesse}er-Abo erfasst.` };
}

export async function aboZahlstatusAktion(
  _bisher: SchuelerMeldung,
  formular: FormData,
): Promise<SchuelerMeldung> {
  await requireRole("ADMIN");

  const aboId = String(formular.get("aboId") ?? "");
  if (!aboId) return { fehler: "Abo nicht gefunden." };

  const bezahlt = formular.get("bezahlt") === "true";
  await aboZahlstatusSetzen(aboId, bezahlt);
  auffrischen(String(formular.get("studentId") ?? "") || undefined);
  return { erledigt: bezahlt ? "Als bezahlt vermerkt." : "Als offen vermerkt." };
}

export async function lektionPlanenAktion(
  _bisher: SchuelerMeldung,
  formular: FormData,
): Promise<SchuelerMeldung> {
  await requireRole("ADMIN");

  const studentId = String(formular.get("studentId") ?? "");
  const instructorId = String(formular.get("instructorId") ?? "");
  const kategorie = String(formular.get("kategorie") ?? "");
  const datum = String(formular.get("datum") ?? "");
  const startzeit = String(formular.get("startzeit") ?? "");
  const dauer = Number(formular.get("dauerMinuten"));

  if (!studentId) return { fehler: "Schüler nicht gefunden." };
  // Geschaeftsregel 10, hier auf die Lektion uebertragen: die Zuweisung macht
  // die Admin, und ohne Fahrlehrer gibt es keine Lektion.
  if (!instructorId) return { fehler: "Fahrlehrer zuweisen." };
  if (!KATEGORIEN.includes(kategorie as (typeof KATEGORIEN)[number])) {
    return { fehler: "Kategorie wählen." };
  }
  if (!datum || Number.isNaN(Date.parse(datum))) {
    return { fehler: "Datum prüfen." };
  }
  if (!/^\d{2}:\d{2}$/.test(startzeit)) return { fehler: "Startzeit prüfen." };
  if (!Number.isFinite(dauer) || dauer < 15 || dauer > 480) {
    return { fehler: "Dauer prüfen (15 bis 480 Minuten)." };
  }

  const ergebnis = await lektionPlanen({
    studentId,
    instructorId,
    kategorie: kategorie as (typeof KATEGORIEN)[number],
    datum,
    startzeit,
    dauerMinuten: dauer,
    abholort: String(formular.get("abholort") ?? ""),
    packageId: String(formular.get("packageId") ?? "") || undefined,
  });

  if (!ergebnis.erfolg) {
    const meldungen: Record<string, string> = {
      "abo-nicht-gefunden": "Das gewählte Abo gibt es nicht mehr.",
      "abo-erschoepft":
        "Dieses Abo hat keine offene Lektion mehr. Erfasse ein neues Abo oder plane die Lektion ohne Abo.",
      "falscher-schueler": "Dieses Abo gehört einem anderen Schüler.",
      "lektion-nicht-gefunden": "Lektion nicht gefunden.",
      "nicht-zugewiesen": "Nicht zugewiesen.",
    };
    return { fehler: meldungen[ergebnis.fehler] ?? "Nicht möglich." };
  }

  auffrischen(studentId);
  return { erledigt: "Lektion geplant." };
}

/**
 * Status einer Lektion setzen.
 *
 * Aus dem Portal mit `portal=true`: dann wird auf den angemeldeten Fahrlehrer
 * eingeschraenkt, und eine fremde Lektion wird abgewiesen, egal was im
 * Formular steht.
 */
export async function lektionStatusAktion(
  _bisher: SchuelerMeldung,
  formular: FormData,
): Promise<SchuelerMeldung> {
  const lessonId = String(formular.get("lessonId") ?? "");
  const status = String(formular.get("status") ?? "");
  if (!lessonId) return { fehler: "Lektion nicht gefunden." };
  if (!STATUS.includes(status as LessonStatus)) {
    return { fehler: "Status prüfen." };
  }

  let nurFuer: string | undefined;
  if (formular.get("portal") === "true") {
    const { profil } = await requireInstruktorProfil();
    if (!profil) return { fehler: "Kein Fahrlehrer-Profil hinterlegt." };
    nurFuer = profil.id;
  } else {
    await requireRole("ADMIN");
  }

  const ergebnis = await lektionStatusSetzen(
    lessonId,
    status as LessonStatus,
    nurFuer,
  );
  if (!ergebnis.erfolg) {
    return {
      fehler:
        ergebnis.fehler === "nicht-zugewiesen"
          ? "Diese Lektion ist Dir nicht zugewiesen."
          : "Lektion nicht gefunden.",
    };
  }

  auffrischen(String(formular.get("studentId") ?? "") || undefined);
  const texte: Record<string, string> = {
    ABSOLVIERT: "Als absolviert vermerkt, das Abo ist um eine Lektion weiter.",
    GEPLANT: "Zurückgesetzt auf geplant, die Lektion zählt wieder zum Abo.",
    STORNIERT: "Storniert. Die Lektion verbraucht nichts.",
    NO_SHOW: "Als nicht erschienen vermerkt. Die Lektion verbraucht nichts.",
  };
  return { erledigt: texte[status] };
}

/** WAB-Lauf von Hand auslösen, für die Abnahme und wenn eine Mail hängt. */
// Ohne Parameter: der Lauf braucht weder den vorherigen Zustand noch
// Formulardaten. useActionState nimmt eine Funktion mit weniger Parametern an.
export async function wabLaufAktion(): Promise<SchuelerMeldung> {
  await requireRole("ADMIN");

  const lauf = await wabLaufAusfuehren();
  auffrischen();

  if (lauf.benachrichtigt === 0 && lauf.ohneAdresse === 0) {
    return { erledigt: "Niemand ist fällig. Es ging keine Erinnerung raus." };
  }

  const teile = [`${lauf.benachrichtigt} angeschrieben`];
  if (lauf.nurProtokolliert > 0) {
    teile.push(
      `davon ${lauf.nurProtokolliert} nur protokolliert, weil kein Versandschlüssel gesetzt ist`,
    );
  }
  if (lauf.fehler > 0) teile.push(`${lauf.fehler} mit Fehler`);
  if (lauf.ohneAdresse > 0) {
    teile.push(`${lauf.ohneAdresse} ohne E-Mail-Adresse, bitte anrufen`);
  }
  return { erledigt: `${teile.join(", ")}.` };
}

/** Eine einzelne Erinnerung noch einmal verschicken. */
export async function wabWiederholenAktion(
  _bisher: SchuelerMeldung,
  formular: FormData,
): Promise<SchuelerMeldung> {
  await requireRole("ADMIN");

  const studentId = String(formular.get("studentId") ?? "");
  if (!studentId) return { fehler: "Schüler nicht gefunden." };

  const ergebnis = await wabErinnerungWiederholen(studentId);
  if (!ergebnis.erfolg) return { fehler: ergebnis.grund ?? "Nicht möglich." };

  auffrischen(studentId);
  return {
    erledigt: process.env.RESEND_API_KEY
      ? "Erinnerung noch einmal verschickt."
      : "Nicht verschickt: es ist kein Versandschlüssel gesetzt. Bitte anrufen.",
  };
}
