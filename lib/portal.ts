import "server-only";
import { prisma } from "@/lib/db";
import { kalendertag } from "@/lib/admin/zeitraum";

/**
 * Abfragen des Fahrlehrer-Portals, PLAN.md Abschnitt 7.
 *
 * Alles hier haengt am Instruktoren-Profil, nicht am Konto (Geschaeftsregel
 * 11). Ein Konto ohne Profil ist gueltig, sieht aber nichts — dafuer gibt es
 * die Hinweisseite.
 */

export type EigenerTermin = {
  id: string;
  datum: Date;
  von: string;
  bis: string;
  kursId: string;
  kursName: string;
  /** Wie viele Personen bisher angemeldet sind. */
  belegt: number;
  limit: number;
};

/**
 * Meine kommenden Termine.
 *
 * Ab heute, nicht ab jetzt: wer am Kurstag morgens nachschaut, will den Termin
 * von heute Abend noch sehen.
 */
export async function eigeneTermine(
  instruktorId: string,
  tage = 60,
): Promise<EigenerTermin[]> {
  const von = kalendertag();
  const bis = new Date(von);
  bis.setUTCDate(bis.getUTCDate() + tage);

  const termine = await prisma.courseSession.findMany({
    where: {
      instructorId: instruktorId,
      date: { gte: von, lt: bis },
      course: { status: { not: "CANCELLED" } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      courseId: true,
      course: {
        select: {
          onlineLimit: true,
          courseType: { select: { name: true } },
          _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
        },
      },
    },
  });

  return termine.map((termin) => ({
    id: termin.id,
    datum: termin.date,
    von: termin.startTime,
    bis: termin.endTime,
    kursId: termin.courseId,
    kursName: termin.course.courseType.name,
    belegt: termin.course._count.bookings,
    limit: termin.course.onlineLimit,
  }));
}
