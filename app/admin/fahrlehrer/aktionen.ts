"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  emailAendern,
  instruktorAktivSetzen,
  kontoAktivSetzen,
  kontoAnlegen,
  passwortZuruecksetzen,
  provisionSetzen,
} from "@/lib/admin/konten";
import { requireRole } from "@/lib/auth-guard";

/**
 * Server Actions der Kontoverwaltung.
 *
 * Das erzeugte Passwort wandert als Rueckgabewert der Action einmal an den
 * Browser und wird nirgends abgelegt. Es steht damit genau so lange auf dem
 * Bildschirm, wie die Seite offen ist.
 */

function auffrischen(): void {
  revalidatePath("/admin/fahrlehrer");
  // Kursleiter-Auswahlen lesen aktiveInstruktoren().
  revalidatePath("/admin/einsatzplan");
}

export type KontoMeldung =
  | { fehler: string }
  | { erledigt: string }
  | { passwort: string; name: string }
  | null;

const emailSchema = z
  .string()
  .trim()
  .min(1, "E-Mail-Adresse eingeben")
  .email("E-Mail-Adresse prüfen")
  .max(160);

export async function kontoAnlegenAktion(
  _bisher: KontoMeldung,
  formular: FormData,
): Promise<KontoMeldung> {
  await requireRole("ADMIN");

  const instruktorId = String(formular.get("instruktorId") ?? "");
  const name = String(formular.get("name") ?? "");
  const geprueft = emailSchema.safeParse(formular.get("email"));
  if (!instruktorId || !geprueft.success) {
    return { fehler: geprueft.success ? "Profil nicht gefunden." : geprueft.error.issues[0].message };
  }

  const ergebnis = await kontoAnlegen(instruktorId, geprueft.data);
  if (!ergebnis.erfolg) {
    const meldungen = {
      "profil-fehlt": "Profil nicht gefunden.",
      "email-vergeben": "Diese E-Mail-Adresse gehört bereits zu einem Konto.",
      "hat-konto": "Dieses Profil hat schon ein Konto.",
    };
    return { fehler: meldungen[ergebnis.fehler] };
  }

  auffrischen();
  return { passwort: ergebnis.passwort, name };
}

export async function passwortZuruecksetzenAktion(
  _bisher: KontoMeldung,
  formular: FormData,
): Promise<KontoMeldung> {
  await requireRole("ADMIN");

  const userId = String(formular.get("userId") ?? "");
  const name = String(formular.get("name") ?? "");
  if (!userId) return { fehler: "Konto nicht gefunden." };

  const ergebnis = await passwortZuruecksetzen(userId);
  if (!ergebnis.erfolg) return { fehler: "Zurücksetzen fehlgeschlagen." };

  auffrischen();
  return { passwort: ergebnis.passwort, name };
}

export async function emailAendernAktion(
  _bisher: KontoMeldung,
  formular: FormData,
): Promise<KontoMeldung> {
  await requireRole("ADMIN");

  const userId = String(formular.get("userId") ?? "");
  const geprueft = emailSchema.safeParse(formular.get("email"));
  if (!userId) return { fehler: "Konto nicht gefunden." };
  if (!geprueft.success) return { fehler: geprueft.error.issues[0].message };

  const ergebnis = await emailAendern(userId, geprueft.data);
  if (!ergebnis.erfolg) {
    return { fehler: "Diese E-Mail-Adresse gehört bereits zu einem Konto." };
  }

  auffrischen();
  return { erledigt: "Adresse geändert." };
}

export async function kontoAktivAktion(
  _bisher: KontoMeldung,
  formular: FormData,
): Promise<KontoMeldung> {
  await requireRole("ADMIN");

  const userId = String(formular.get("userId") ?? "");
  const aktiv = formular.get("aktiv") === "true";
  if (!userId) return { fehler: "Konto nicht gefunden." };

  await kontoAktivSetzen(userId, aktiv);
  auffrischen();
  return {
    erledigt: aktiv
      ? "Konto ist wieder aktiv."
      : "Konto stillgelegt. Der Zugang ist sofort gesperrt.",
  };
}

export async function instruktorAktivAktion(
  _bisher: KontoMeldung,
  formular: FormData,
): Promise<KontoMeldung> {
  await requireRole("ADMIN");

  const instruktorId = String(formular.get("instruktorId") ?? "");
  const aktiv = formular.get("aktiv") === "true";
  if (!instruktorId) return { fehler: "Profil nicht gefunden." };

  await instruktorAktivSetzen(instruktorId, aktiv);
  auffrischen();
  return {
    erledigt: aktiv
      ? "Profil ist wieder wählbar."
      : "Profil deaktiviert. Es erscheint in keiner Kursleiter-Auswahl mehr.",
  };
}

const betragSchema = z
  .string()
  .trim()
  .regex(/^\d{1,5}([.,]\d{1,2})?$/, "Betrag wie 50 oder 50.00 eingeben")
  .transform((wert) => wert.replace(",", "."));

export async function provisionAktion(
  _bisher: KontoMeldung,
  formular: FormData,
): Promise<KontoMeldung> {
  await requireRole("ADMIN");

  const instruktorId = String(formular.get("instruktorId") ?? "");
  const geprueft = betragSchema.safeParse(formular.get("provision"));
  if (!instruktorId) return { fehler: "Profil nicht gefunden." };
  if (!geprueft.success) return { fehler: geprueft.error.issues[0].message };

  await provisionSetzen(instruktorId, geprueft.data);
  auffrischen();
  return { erledigt: "Provisionssatz gespeichert." };
}
