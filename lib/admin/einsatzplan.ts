import "server-only";
import { prisma } from "@/lib/db";
import { kalenderWoche, tagePlus } from "@/lib/admin/zeitraum";

/**
 * Einsatzplan der Instruktoren.
 *
 * Der Teil, der sich auszahlt, ist die Konfliktwarnung. Ein doppelt
 * eingeteilter Kursleiter faellt sonst am Abend des Kurses auf, vor den
 * Teilnehmenden, und dann ist es zu spaet. Deshalb wird nicht nur gemeldet,
 * DASS etwas kollidiert, sondern was: wer, an welchem Tag, welche zwei Kurse
 * und welche Uhrzeiten.
 *
 * Die Zeiten stehen als "HH:MM" in der Datenbank. In diesem Format ist der
 * Zeichenkettenvergleich derselbe wie der Zeitvergleich, deshalb genuegt
 * a.von < b.bis && b.von < a.bis. Aneinandergrenzende Bloecke wie 18:00-20:00
 * und 20:00-22:00 ueberschneiden sich damit korrekt nicht.
 */

export type PlanTermin = {
  id: string;
  datum: Date;
  von: string;
  bis: string;
  kursId: string;
  kursName: string;
  instruktor: { id: string; kuerzel: string; name: string } | null;
  /** Ob dieser Termin an einem Konflikt beteiligt ist. */
  imKonflikt: boolean;
};

export type Konflikt = {
  instruktor: { id: string; kuerzel: string; name: string };
  datum: Date;
  erster: { von: string; bis: string; kursName: string; kursId: string };
  zweiter: { von: string; bis: string; kursName: string; kursId: string };
};

export type PlanTag = {
  datum: Date;
  termine: PlanTermin[];
};

export type Einsatzplan = {
  montag: Date;
  tage: PlanTag[];
  konflikte: Konflikt[];
  /** Termine ohne Zuweisung in dieser Woche. */
  offen: number;
};

export async function einsatzplanWoche(montag: Date): Promise<Einsatzplan> {
  const tage = kalenderWoche(montag);
  const bis = tagePlus(montag, 7);

  const termine = await prisma.courseSession.findMany({
    where: {
      date: { gte: montag, lt: bis },
      // Abgesagte Kurse brauchen keine Kursleitung, und ihre Termine wuerden
      // sonst Konflikte melden, die es gar nicht gibt.
      course: { status: { not: "CANCELLED" } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      courseId: true,
      course: { select: { courseType: { select: { name: true } } } },
      instructor: { select: { id: true, shortCode: true, firstName: true, lastName: true } },
    },
  });

  const aufbereitet = termine.map((termin) => ({
    id: termin.id,
    datum: termin.date,
    von: termin.startTime,
    bis: termin.endTime,
    kursId: termin.courseId,
    kursName: termin.course.courseType.name,
    instruktor: termin.instructor
      ? {
          id: termin.instructor.id,
          kuerzel: termin.instructor.shortCode,
          // Nachname zuerst, wie in der Instruktoren-Auswahl und in der
          // Teilnehmerliste. Eine Liste, in der die Namen mal so und mal so
          // herum stehen, laesst sich nicht ueberfliegen.
          name: `${termin.instructor.lastName} ${termin.instructor.firstName}`,
        }
      : null,
    imKonflikt: false,
  }));

  const { konflikte, betroffene } = konflikteFinden(aufbereitet);
  for (const termin of aufbereitet) {
    termin.imKonflikt = betroffene.has(termin.id);
  }

  return {
    montag,
    tage: tage.map((tag) => ({
      datum: tag,
      termine: aufbereitet.filter(
        (termin) => termin.datum.getTime() === tag.getTime(),
      ),
    })),
    konflikte,
    offen: aufbereitet.filter((termin) => termin.instruktor === null).length,
  };
}

/**
 * Findet Ueberschneidungen derselben Person am selben Tag.
 *
 * Reine Funktion ohne Datenbank, damit sie sich pruefen laesst.
 */
export function konflikteFinden(termine: PlanTermin[]): {
  konflikte: Konflikt[];
  betroffene: Set<string>;
} {
  const konflikte: Konflikt[] = [];
  const betroffene = new Set<string>();

  // Nach Person und Tag buendeln: nur dort kann es ueberhaupt kollidieren.
  const gruppen = new Map<string, PlanTermin[]>();
  for (const termin of termine) {
    if (!termin.instruktor) continue;
    const schluessel = `${termin.instruktor.id}|${termin.datum.toISOString()}`;
    const bisher = gruppen.get(schluessel) ?? [];
    bisher.push(termin);
    gruppen.set(schluessel, bisher);
  }

  for (const gruppe of gruppen.values()) {
    for (let i = 0; i < gruppe.length; i += 1) {
      for (let j = i + 1; j < gruppe.length; j += 1) {
        const a = gruppe[i];
        const b = gruppe[j];
        if (!(a.von < b.bis && b.von < a.bis)) continue;

        konflikte.push({
          instruktor: a.instruktor!,
          datum: a.datum,
          erster: {
            von: a.von,
            bis: a.bis,
            kursName: a.kursName,
            kursId: a.kursId,
          },
          zweiter: {
            von: b.von,
            bis: b.bis,
            kursName: b.kursName,
            kursId: b.kursId,
          },
        });
        betroffene.add(a.id);
        betroffene.add(b.id);
      }
    }
  }

  return { konflikte, betroffene };
}

/**
 * Kursleiter zuweisen oder entfernen.
 *
 * Geschaeftsregel 10: ausschliesslich durch die Admin. null bedeutet "Noch
 * nicht bestimmt" und ist ein gueltiger Zustand, kein Fehler.
 */
export async function instruktorZuweisen(
  terminId: string,
  instruktorId: string | null,
): Promise<void> {
  await prisma.courseSession.update({
    where: { id: terminId },
    data: { instructorId: instruktorId },
  });
}
