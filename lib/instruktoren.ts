import { prisma } from "@/lib/db";

/**
 * Zugriff auf die Instruktoren-Profile.
 *
 * Geschaeftsregel 11: Kursleiter-Dropdowns und der Einsatzplan lesen
 * ausschliesslich das Instructor-Modell, nie die User-Tabelle. Im Altsystem
 * erschien sonst der Admin-Account "LOLIT" als waehlbarer Kursleiter.
 *
 * Wer eine Auswahlliste fuer Kursleiter baut, nimmt aktiveInstruktoren() und
 * fragt nicht selbst die Datenbank ab.
 */

export type InstruktorAuswahl = {
  id: string;
  vorname: string;
  nachname: string;
  kuerzel: string;
  anzeige: string;
};

/**
 * Alle aktiven Instruktoren, sortiert nach Nachname. Das ist die einzige
 * zulaessige Quelle fuer Kursleiter-Auswahlen.
 */
export async function aktiveInstruktoren(): Promise<InstruktorAuswahl[]> {
  const profile = await prisma.instructor.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, shortCode: true },
  });

  return profile.map((profil) => ({
    id: profil.id,
    vorname: profil.firstName,
    nachname: profil.lastName,
    kuerzel: profil.shortCode,
    anzeige: `${profil.lastName} ${profil.firstName} (${profil.shortCode})`,
  }));
}

/**
 * Das Instruktoren-Profil zu einem Login, falls es eines gibt.
 *
 * Gibt null zurueck, wenn das Konto kein Profil hat. Das ist ein gueltiger
 * Zustand: ein User ist nie automatisch Instruktor.
 */
export async function instruktorProfilZuBenutzer(userId: string) {
  return prisma.instructor.findUnique({ where: { userId } });
}
