import "server-only";
import { prisma } from "@/lib/db";
import { Decimal } from "@/lib/decimal";
import {
  ampelSchwellenLesen,
  verfuegbarkeitBerechnen,
  type Verfuegbarkeit,
} from "@/lib/verfuegbarkeit";
import {
  dieseWoche,
  dieserMonatKalender,
  dieserMonat,
  heute,
  kalendertag,
  tagePlus,
} from "@/lib/admin/zeitraum";

/**
 * Abfragen der Uebersicht.
 *
 * Getrennt von lib/kurse.ts: die oeffentlichen Abfragen zeigen bewusst nur
 * veroeffentlichte Kurse mit kuenftigen Terminen. Das Panel braucht auch
 * Entwuerfe und Vergangenes, und die beiden Sichten auseinanderzuhalten ist
 * das, was verhindert, dass ein Entwurf versehentlich oeffentlich wird.
 *
 * Alle Betraege bleiben Decimal. Erst die Anzeige macht daraus Text.
 */

export type TerminMitKurs = {
  id: string;
  datum: Date;
  von: string;
  bis: string;
  kursId: string;
  kursart: string;
  /** null bedeutet "Noch nicht bestimmt" und faellt in der Liste auf. */
  kursleiter: { kuerzel: string; name: string } | null;
};

/** Termine der naechsten Tage, inklusive heute. */
export async function naechsteTermine(tage = 7): Promise<TerminMitKurs[]> {
  const von = kalendertag();
  const bis = tagePlus(von, tage);

  const termine = await prisma.courseSession.findMany({
    where: {
      date: { gte: von, lt: bis },
      // Abgesagte Kurse stehen nicht mehr im Plan.
      course: { status: { in: ["PUBLISHED", "DRAFT"] } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: {
      course: { include: { courseType: true } },
      instructor: true,
    },
  });

  return termine.map((termin) => ({
    id: termin.id,
    datum: termin.date,
    von: termin.startTime,
    bis: termin.endTime,
    kursId: termin.courseId,
    kursart: termin.course.courseType.name,
    kursleiter: termin.instructor
      ? {
          kuerzel: termin.instructor.shortCode,
          name: `${termin.instructor.lastName} ${termin.instructor.firstName}`,
        }
      : null,
  }));
}

export type Fuellstand = {
  kursId: string;
  kursart: string;
  ersterTermin: Date;
  belegt: number;
  limit: number;
  verfuegbarkeit: Verfuegbarkeit;
  entwurf: boolean;
};

/** Fuellstand aller ausgeschriebenen Kurse mit kuenftigen Terminen. */
export async function fuellstaende(): Promise<Fuellstand[]> {
  const stichtag = kalendertag();

  const kurse = await prisma.course.findMany({
    where: {
      status: { in: ["PUBLISHED", "DRAFT"] },
      sessions: { some: { date: { gte: stichtag } } },
    },
    include: {
      courseType: true,
      sessions: { orderBy: [{ date: "asc" }, { startTime: "asc" }], take: 1 },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });

  const schwellen = await ampelSchwellenLesen();

  return kurse
    .map((kurs) => ({
      kursId: kurs.id,
      kursart: kurs.courseType.name,
      ersterTermin: kurs.sessions[0]?.date ?? stichtag,
      belegt: kurs._count.bookings,
      limit: kurs.onlineLimit,
      verfuegbarkeit: verfuegbarkeitBerechnen(
        kurs.onlineLimit,
        kurs._count.bookings,
        schwellen,
      ),
      entwurf: kurs.status === "DRAFT",
    }))
    .sort((a, b) => a.ersterTermin.getTime() - b.ersterTermin.getTime());
}

export type AnmeldeZahlen = {
  heuteGesamt: number;
  heuteOnline: number;
  heuteTelefon: number;
  wocheGesamt: number;
  wocheOnline: number;
  wocheTelefon: number;
};

/** Anmeldungen heute und diese Woche, getrennt nach Weg. */
export async function anmeldeZahlen(): Promise<AnmeldeZahlen> {
  const tag = heute();
  const woche = dieseWoche();

  const zaehle = (von: Date, bis: Date, quelle?: "ONLINE" | "PHONE") =>
    prisma.booking.count({
      where: {
        createdAt: { gte: von, lt: bis },
        status: { not: "CANCELLED" },
        ...(quelle ? { source: quelle } : {}),
      },
    });

  const [
    heuteGesamt,
    heuteOnline,
    heuteTelefon,
    wocheGesamt,
    wocheOnline,
    wocheTelefon,
  ] = await Promise.all([
    zaehle(tag.von, tag.bis),
    zaehle(tag.von, tag.bis, "ONLINE"),
    zaehle(tag.von, tag.bis, "PHONE"),
    zaehle(woche.von, woche.bis),
    zaehle(woche.von, woche.bis, "ONLINE"),
    zaehle(woche.von, woche.bis, "PHONE"),
  ]);

  return {
    heuteGesamt,
    heuteOnline,
    heuteTelefon,
    wocheGesamt,
    wocheOnline,
    wocheTelefon,
  };
}

export type UmsatzMonat = {
  /** Summe der Anmeldungen, die in diesem Monat eingegangen sind. */
  nachAnmeldedatum: Decimal;
  anzahlNachAnmeldedatum: number;
  /** Summe der Anmeldungen zu Kursen, die in diesem Monat starten. */
  nachKursdatum: Decimal;
  anzahlNachKursdatum: number;
};

/**
 * Zwei Umsatzzahlen, weil sie zwei verschiedene Fragen beantworten.
 *
 * Nach Anmeldedatum zeigt, wie das Geschaeft gerade laeuft, und deckt sich mit
 * der Provision, die pro Anmeldung anfaellt. Nach Kursdatum liegt naeher an
 * der Buchhaltung, weil das Geld bar am ersten Kurstag fliesst. Ein im Januar
 * gebuchter Maerzkurs steht in der einen Zahl im Januar, in der anderen im
 * Maerz. Beide sind richtig, deshalb stehen beide da.
 *
 * Abgesagte Kurse und stornierte Buchungen zaehlen in keiner der beiden.
 */
export async function umsatzMonat(): Promise<UmsatzMonat> {
  const monat = dieserMonat();
  const monatKalender = dieserMonatKalender();

  const nachAnmeldung = await prisma.booking.aggregate({
    _sum: { priceCharged: true },
    _count: true,
    where: {
      createdAt: { gte: monat.von, lt: monat.bis },
      status: "CONFIRMED",
      course: { status: { not: "CANCELLED" } },
    },
  });

  // Kurse, deren erster Termin in diesem Monat liegt. Prisma kann nicht nach
  // dem fruehesten Termin einer Relation filtern, deshalb zuerst holen und
  // dann pruefen. Bei der Groessenordnung dieser Fahrschule ist das nichts.
  const kandidaten = await prisma.course.findMany({
    where: {
      status: { not: "CANCELLED" },
      sessions: { some: { date: { gte: monatKalender.von, lt: monatKalender.bis } } },
    },
    select: {
      id: true,
      sessions: { orderBy: [{ date: "asc" }], take: 1, select: { date: true } },
    },
  });

  const kursIds = kandidaten
    .filter((kurs) => {
      const erster = kurs.sessions[0]?.date;
      return (
        erster !== undefined &&
        erster >= monatKalender.von &&
        erster < monatKalender.bis
      );
    })
    .map((kurs) => kurs.id);

  const nachKurs = await prisma.booking.aggregate({
    _sum: { priceCharged: true },
    _count: true,
    where: { courseId: { in: kursIds }, status: "CONFIRMED" },
  });

  return {
    nachAnmeldedatum: nachAnmeldung._sum.priceCharged ?? new Decimal(0),
    anzahlNachAnmeldedatum: nachAnmeldung._count,
    nachKursdatum: nachKurs._sum.priceCharged ?? new Decimal(0),
    anzahlNachKursdatum: nachKurs._count,
  };
}
