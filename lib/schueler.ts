import "server-only";
import { prisma, type PrismaTx } from "@/lib/db";
import type { Decimal } from "@/lib/decimal";
import type { LessonCategory, LessonStatus } from "@/lib/generated/prisma/enums";

/**
 * Schuelerkartei und Lektionen (PLAN.md Abschnitt 14).
 *
 * Rein internes Werkzeug: es gibt kein Schueler-Login und kein Kundenkonto
 * (Kundenentscheid 26.07.2026). Wer hier steht, hat nie eine Zugangsmoeglichkeit
 * zu diesen Daten — sie existieren fuer Ausilia und die Fahrlehrer.
 *
 * DER ABO-STAND WIRD GEZAEHLT, NICHT GEFUEHRT
 *
 * Verbraucht ist die Anzahl Lektionen mit Status ABSOLVIERT auf dem Abo. Kein
 * Feld, kein Hoch- und Runterzaehlen. Die Folgen sind angenehm: das
 * Rueckgaengigmachen einer abgehakten Lektion korrigiert den Stand von selbst,
 * doppeltes Abhaken zaehlt nicht doppelt, und der angezeigte Stand kann nicht
 * von der Wirklichkeit abweichen — es gibt nur eine Wirklichkeit.
 */

/** Nur dieser Status verbraucht eine Lektion aus dem Abo. */
export const VERBRAUCHT: LessonStatus = "ABSOLVIERT";

/**
 * Beschriftungen und Abo-Groessen stehen in lib/inhalte/lektionen.ts.
 *
 * Diese Datei ist server-only; eine Client-Komponente, die sie fuer eine
 * Beschriftung anzieht, bricht den Build ab. Dieselbe Trennung wie zwischen
 * lib/preis.ts und lib/inhalte/kursmuster.ts.
 */

export type AboStand = {
  id: string;
  kategorie: LessonCategory;
  groesse: number;
  preisProLektion: Decimal;
  /** Lektionen mit Status ABSOLVIERT auf diesem Abo. */
  verbraucht: number;
  /** Nie negativ: ein überzogenes Abo zeigt 0 offen, nicht minus eins. */
  offen: number;
  zahlart: string;
  zahlstatus: string;
  bezahltAm: Date | null;
  angelegtAm: Date;
};

/**
 * Abos eines Schuelers mit ihrem Stand.
 *
 * Zaehlt in einer Abfrage ueber alle Abos statt einer pro Abo — bei einem
 * Schueler mit vier Abos waeren das sonst fuenf Rundreisen fuer eine Ansicht.
 */
export async function abosMitStand(studentId: string): Promise<AboStand[]> {
  const abos = await prisma.lessonPackage.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  if (abos.length === 0) return [];

  const verbrauch = await prisma.lesson.groupBy({
    by: ["packageId"],
    where: { packageId: { in: abos.map((a) => a.id) }, status: VERBRAUCHT },
    _count: { _all: true },
  });
  const nachAbo = new Map(
    verbrauch.map((v) => [v.packageId as string, v._count._all]),
  );

  return abos.map((abo) => {
    const verbraucht = nachAbo.get(abo.id) ?? 0;
    return {
      id: abo.id,
      kategorie: abo.category,
      groesse: abo.size,
      preisProLektion: abo.pricePerLesson,
      verbraucht,
      offen: Math.max(0, abo.size - verbraucht),
      zahlart: abo.paymentMethod,
      zahlstatus: abo.paymentStatus,
      bezahltAm: abo.paidAt,
      angelegtAm: abo.createdAt,
    };
  });
}

/** Offene Lektionen ueber alle Abos, fuer die Listenansicht. */
export async function offeneLektionenProSchueler(
  studentIds: string[],
): Promise<Map<string, number>> {
  if (studentIds.length === 0) return new Map();

  const abos = await prisma.lessonPackage.findMany({
    where: { studentId: { in: studentIds } },
    select: { id: true, studentId: true, size: true },
  });
  if (abos.length === 0) return new Map();

  const verbrauch = await prisma.lesson.groupBy({
    by: ["packageId"],
    where: { packageId: { in: abos.map((a) => a.id) }, status: VERBRAUCHT },
    _count: { _all: true },
  });
  const nachAbo = new Map(
    verbrauch.map((v) => [v.packageId as string, v._count._all]),
  );

  const summe = new Map<string, number>();
  for (const abo of abos) {
    const offen = Math.max(0, abo.size - (nachAbo.get(abo.id) ?? 0));
    summe.set(abo.studentId, (summe.get(abo.studentId) ?? 0) + offen);
  }
  return summe;
}

export type LektionFehler =
  | "lektion-nicht-gefunden"
  | "abo-nicht-gefunden"
  | "abo-erschoepft"
  | "falscher-schueler"
  | "nicht-zugewiesen";

export type LektionErgebnis =
  | { erfolg: true }
  | { erfolg: false; fehler: LektionFehler };

/**
 * Status einer Lektion setzen — abhaken, rueckgaengig, stornieren, No-Show.
 *
 * @param nurFuerInstruktor Aus dem Portal mitgegeben. Ein Fahrlehrer darf nur
 *   Lektionen anfassen, die ihm zugewiesen sind. Die Pruefung sitzt hier und
 *   nicht bloss in der Oberflaeche: ein weggelassener Knopf ist kein Schutz.
 */
export async function lektionStatusSetzen(
  lessonId: string,
  status: LessonStatus,
  nurFuerInstruktor?: string,
): Promise<LektionErgebnis> {
  const lektion = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, instructorId: true },
  });
  if (!lektion) {
    return { erfolg: false, fehler: "lektion-nicht-gefunden" };
  }
  if (nurFuerInstruktor && lektion.instructorId !== nurFuerInstruktor) {
    return { erfolg: false, fehler: "nicht-zugewiesen" };
  }

  await prisma.lesson.update({ where: { id: lessonId }, data: { status } });
  return { erfolg: true };
}

/**
 * Freie Plaetze eines Abos, innerhalb einer Transaktion.
 *
 * Erwartet, dass der Aufrufer die Abozeile gesperrt hat.
 */
async function offenImAbo(tx: PrismaTx, packageId: string): Promise<number> {
  const abo = await tx.lessonPackage.findUnique({
    where: { id: packageId },
    select: { size: true },
  });
  if (!abo) return 0;

  const verbraucht = await tx.lesson.count({
    where: { packageId, status: VERBRAUCHT },
  });
  return Math.max(0, abo.size - verbraucht);
}

export type LektionEingabe = {
  studentId: string;
  instructorId: string;
  kategorie: LessonCategory;
  datum: string;
  startzeit: string;
  dauerMinuten: number;
  abholort?: string;
  /** Leer heisst: Lektion ohne Abo, zum Beispiel die Probelektion. */
  packageId?: string;
};

/**
 * Eine Lektion planen.
 *
 * Haengt eine Abo-Zuordnung dran, laeuft das unter einer Zeilensperre auf dem
 * Abo — sonst koennten zwei gleichzeitig erfasste Lektionen dieselbe letzte
 * offene Lektion belegen, und das 5er-Abo haette sechs. Dieselbe Mechanik wie
 * die Kapazitaetssperre in lib/buchung.ts.
 */
export async function lektionPlanen(
  eingabe: LektionEingabe,
): Promise<LektionErgebnis & { lessonId?: string }> {
  return prisma.$transaction(async (tx) => {
    if (eingabe.packageId) {
      const gesperrt = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM lesson_package WHERE id = ${eingabe.packageId} FOR UPDATE
      `;
      if (gesperrt.length === 0) {
        return { erfolg: false as const, fehler: "abo-nicht-gefunden" as const };
      }

      const abo = await tx.lessonPackage.findUnique({
        where: { id: eingabe.packageId },
        select: { studentId: true },
      });
      // Ein Abo gehoert einem Schueler. Die Lektion eines anderen darauf zu
      // buchen waere eine stille Umbuchung von fremdem Guthaben.
      if (!abo || abo.studentId !== eingabe.studentId) {
        return { erfolg: false as const, fehler: "falscher-schueler" as const };
      }

      const offen = await offenImAbo(tx, eingabe.packageId);
      // Geplante Lektionen zaehlen mit: sonst liessen sich zehn Lektionen auf
      // ein 5er-Abo planen und erst beim Abhaken faellt es auf.
      const schonGeplant = await tx.lesson.count({
        where: { packageId: eingabe.packageId, status: "GEPLANT" },
      });
      if (offen - schonGeplant <= 0) {
        return { erfolg: false as const, fehler: "abo-erschoepft" as const };
      }
    }

    const lektion = await tx.lesson.create({
      data: {
        studentId: eingabe.studentId,
        instructorId: eingabe.instructorId,
        category: eingabe.kategorie,
        date: new Date(eingabe.datum),
        startTime: eingabe.startzeit,
        durationMin: eingabe.dauerMinuten,
        pickupNote: eingabe.abholort?.trim() || null,
        packageId: eingabe.packageId || null,
      },
      select: { id: true },
    });

    return { erfolg: true as const, lessonId: lektion.id };
  });
}

/**
 * Schueler, denen dem Fahrlehrer mindestens eine Lektion zugewiesen ist.
 *
 * Die Zuordnung haengt an den Lektionen und nicht an einem eigenen Feld: wer
 * die Stunden faehrt, hat den Schueler. Ein zweites Feld muesste gepflegt
 * werden und koennte den Lektionen widersprechen.
 */
export async function schuelerDesInstruktors(instructorId: string) {
  return prisma.studentRecord.findMany({
    where: { lessons: { some: { instructorId } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      lessons: {
        where: { instructorId },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        include: { package: { select: { id: true, size: true, category: true } } },
      },
    },
  });
}
