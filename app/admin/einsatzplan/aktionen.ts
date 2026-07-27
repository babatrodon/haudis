"use server";

import { revalidatePath } from "next/cache";
import { instruktorZuweisen } from "@/lib/admin/einsatzplan";
import { requireRole } from "@/lib/auth-guard";

/**
 * Zuweisung eines Kursleiters.
 *
 * Gewoehnliches Formular ohne JavaScript: eine Auswahl, ein Knopf. Auf dem
 * iPad ist das zuverlaessiger als eine Auswahl, die beim Loslassen sofort
 * speichert und dabei den falschen Eintrag erwischt.
 */
export async function zuweisenAktion(formular: FormData): Promise<void> {
  await requireRole("ADMIN");

  const terminId = String(formular.get("terminId") ?? "");
  if (!terminId) return;

  // Leerer Wert heisst "Noch nicht bestimmt" und ist ein gueltiger Zustand.
  const instruktorId = String(formular.get("instruktorId") ?? "") || null;
  await instruktorZuweisen(terminId, instruktorId);

  revalidatePath("/admin/einsatzplan");
  revalidatePath("/admin");
  // Der Kurs zeigt die Zuweisung ebenfalls an.
  const kursId = String(formular.get("kursId") ?? "");
  if (kursId) {
    revalidatePath(`/admin/kurse/${kursId}`);
    revalidatePath(`/admin/kurse/${kursId}/buchungen`);
  }
}
