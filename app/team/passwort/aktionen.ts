"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireSessionOhnePasswortzwang } from "@/lib/auth-guard";

/**
 * Passwortwechsel fuer angemeldete Team-Konten.
 *
 * mustChangePassword wird hier NICHT zurueckgesetzt. Das erledigt der
 * after-Hook in lib/auth.ts, der bei jedem erfolgreichen Wechsel greift, also
 * auch wenn jemand den Endpunkt direkt aufruft. Zwei Stellen, die dasselbe
 * Flag loeschen, wuerden frueher oder spaeter auseinanderlaufen.
 */

const MIN_LAENGE = 12;

const passwortSchema = z
  .object({
    aktuell: z.string().min(1, "Aktuelles Passwort eingeben"),
    neu: z
      .string()
      .min(MIN_LAENGE, `Mindestens ${MIN_LAENGE} Zeichen`)
      .max(128, "Höchstens 128 Zeichen"),
    wiederholung: z.string().min(1, "Passwort wiederholen"),
  })
  .refine((daten) => daten.neu === daten.wiederholung, {
    path: ["wiederholung"],
    message: "Die beiden Passwörter stimmen nicht überein",
  })
  .refine((daten) => daten.neu !== daten.aktuell, {
    path: ["neu"],
    message: "Das neue Passwort muss sich vom aktuellen unterscheiden",
  });

export type PasswortErgebnis = { fehler: string } | { erfolg: true };

export async function passwortAendern(
  _bisher: PasswortErgebnis | null,
  formular: FormData,
): Promise<PasswortErgebnis> {
  // Nur Angemeldete duerfen hier ueberhaupt landen.
  await requireSessionOhnePasswortzwang();

  const geprueft = passwortSchema.safeParse({
    aktuell: formular.get("aktuell"),
    neu: formular.get("neu"),
    wiederholung: formular.get("wiederholung"),
  });

  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: geprueft.data.aktuell,
        newPassword: geprueft.data.neu,
        // Andere Sitzungen beenden: wer das Startpasswort kannte, soll nach
        // dem Wechsel nicht weiter angemeldet bleiben.
        revokeOtherSessions: true,
      },
    });
  } catch {
    // Better Auth unterscheidet hier nicht weiter, in der Praxis ist es das
    // falsche aktuelle Passwort.
    return { fehler: "Das aktuelle Passwort stimmt nicht." };
  }

  return { erfolg: true };
}
