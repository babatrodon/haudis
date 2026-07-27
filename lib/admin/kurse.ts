import "server-only";
import { prisma } from "@/lib/db";
import {
  ampelSchwellenLesen,
  verfuegbarkeitBerechnen,
  type Verfuegbarkeit,
} from "@/lib/verfuegbarkeit";
import { offeneEinladungenProKurs } from "@/lib/warteliste";
import { kalendertag } from "@/lib/admin/zeitraum";
import type { CourseStatus } from "@/lib/generated/prisma/enums";
import type { Decimal } from "@/lib/decimal";

/**
 * Kursverwaltung fuer das Panel.
 *
 * Anders als lib/kurse.ts zeigt das hier alles: Entwuerfe, abgesagte und
 * vergangene Kurse. Die Trennung ist Absicht und verhindert, dass ein Entwurf
 * ueber eine oeffentliche Abfrage nach draussen geraet.
 */

export type KursZeile = {
  id: string;
  kursart: string;
  kursartCode: string;
  status: CourseStatus;
  ersterTermin: Date | null;
  letzterTermin: Date | null;
  anzahlTermine: number;
  /**
   * Termine als "2026-08-04", nicht als Date: sie gehen an den
   * Duplizieren-Dialog, der im Browser laeuft und dort Tage verschiebt.
   */
  termine: { datum: string; von: string; bis: string }[];
  preis: Decimal;
  materialpreis: Decimal;
  gesamtpreis: Decimal;
  belegt: number;
  limit: number;
  verfuegbarkeit: Verfuegbarkeit;
  sariAngemeldet: boolean;
  sariBestaetigt: boolean;
};

export type KursFilter = {
  kursartCode?: string;
  status?: CourseStatus;
  /** "kommend" blendet Kurse aus, deren Termine alle vorbei sind. */
  zeitraum?: "kommend" | "vergangen" | "alle";
};

export async function kurseFuerListe(
  filter: KursFilter = {},
): Promise<KursZeile[]> {
  const stichtag = kalendertag();

  const kurse = await prisma.course.findMany({
    where: {
      ...(filter.kursartCode
        ? { courseType: { code: filter.kursartCode } }
        : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.zeitraum === "kommend"
        ? { sessions: { some: { date: { gte: stichtag } } } }
        : {}),
      ...(filter.zeitraum === "vergangen"
        ? { sessions: { every: { date: { lt: stichtag } } } }
        : {}),
    },
    include: {
      courseType: true,
      sessions: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });

  const schwellen = await ampelSchwellenLesen();
  const reserviert = await offeneEinladungenProKurs(kurse.map((k) => k.id));

  return kurse
    .map((kurs) => ({
      id: kurs.id,
      kursart: kurs.courseType.name,
      kursartCode: kurs.courseType.code,
      status: kurs.status,
      ersterTermin: kurs.sessions[0]?.date ?? null,
      letzterTermin: kurs.sessions.at(-1)?.date ?? null,
      anzahlTermine: kurs.sessions.length,
      termine: kurs.sessions.map((termin) => ({
        datum: alsFeldwert(termin.date),
        von: termin.startTime,
        bis: termin.endTime,
      })),
      preis: kurs.price,
      materialpreis: kurs.materialPrice,
      gesamtpreis: kurs.price.plus(kurs.materialPrice),
      belegt: kurs._count.bookings,
      limit: kurs.onlineLimit,
      verfuegbarkeit: verfuegbarkeitBerechnen(
        kurs.onlineLimit,
        kurs._count.bookings,
        schwellen,
        reserviert.get(kurs.id) ?? 0,
      ),
      sariAngemeldet: kurs.sariAngemeldetAm !== null,
      sariBestaetigt: kurs.sariBestaetigtAm !== null,
    }))
    // Kommende zuerst, innerhalb dessen nach Datum. Kurse ohne Termine ganz
    // nach vorne: die sind unfertig und brauchen Aufmerksamkeit.
    .sort((a, b) => {
      if (a.ersterTermin === null) return -1;
      if (b.ersterTermin === null) return 1;
      return a.ersterTermin.getTime() - b.ersterTermin.getTime();
    });
}

/** Ein Kurs mit allem, was die Detailseite braucht. */
export async function kursLesen(kursId: string) {
  return prisma.course.findUnique({
    where: { id: kursId },
    include: {
      courseType: true,
      sessions: {
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        include: { instructor: true },
      },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });
}

export type KursMitAllem = NonNullable<Awaited<ReturnType<typeof kursLesen>>>;

const BETROFFENE_FELDER = {
  id: true,
  salutation: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
} as const;

export type Betroffene = {
  id: string;
  salutation: string;
  firstName: string;
  lastName: string;
  phone: string;
  /** Kann fehlen: telefonisch Angemeldete haben nicht immer eine Adresse. */
  email: string | null;
};

/**
 * Wer ist von einer Absage betroffen, und wie erreicht man sie?
 *
 * Die Nummern stehen bewusst dabei: PLAN.md sieht eine Benachrichtigung per
 * Mail vor, aber bei einer kurzfristigen Absage ruft Ausilia lieber an. Dafuer
 * muss sie die Nummern sehen, bevor sie bestaetigt, nicht danach.
 */
export async function betroffeneBeiAbsage(
  kursId: string,
): Promise<Betroffene[]> {
  return prisma.booking.findMany({
    where: { courseId: kursId, status: "CONFIRMED" },
    orderBy: { lastName: "asc" },
    select: BETROFFENE_FELDER,
  });
}

/** Kursarten fuer Auswahllisten. Nur buchbare, denn Boegle hat keine Kurse. */
export async function kursartenFuerAuswahl() {
  return prisma.courseType.findMany({
    where: { bookable: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      basePrice: true,
      materialPrice: true,
      onlineLimit: true,
      active: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Schreibzugriffe
// ---------------------------------------------------------------------------

/**
 * "2026-08-04" als Mitternacht UTC.
 *
 * CourseSession.date ist @db.Date. Der Umweg ueber new Date("2026-08-04")
 * fuehrt zwar zum selben Ergebnis, aber nur weil der Browser ISO-Datumsangaben
 * ohne Zeitzone als UTC liest — bei "04.08.2026" waere es lokale Zeit. Hier
 * steht es explizit, damit die Regel nicht von der Schreibweise abhaengt.
 */
function alsKalendertag(iso: string): Date {
  const [jahr, monat, tag] = iso.split("-").map(Number);
  return new Date(Date.UTC(jahr, monat - 1, tag));
}

/** Umgekehrt, fuer die Vorbelegung von <input type="date">. */
export function alsFeldwert(tag: Date): string {
  return tag.toISOString().slice(0, 10);
}

export type KursDaten = {
  kursartId: string;
  termine: { datum: string; von: string; bis: string }[];
  preis: string;
  materialpreis: string;
  onlineLimit: number;
  /** Leerer String heisst: kein Fruehbucherrabatt fuer diesen Kurs. */
  fruehbucherProzent: string;
  fruehbucherPlaetze: string;
  notizen?: string;
  veroeffentlichen: boolean;
};

function rabattFelder(daten: KursDaten) {
  return {
    earlyBirdPercent: daten.fruehbucherProzent || null,
    earlyBirdSlots: daten.fruehbucherPlaetze
      ? Number(daten.fruehbucherPlaetze)
      : null,
  };
}

export async function kursAnlegen(daten: KursDaten): Promise<string> {
  const kurs = await prisma.course.create({
    data: {
      courseTypeId: daten.kursartId,
      price: daten.preis,
      materialPrice: daten.materialpreis,
      onlineLimit: daten.onlineLimit,
      ...rabattFelder(daten),
      status: daten.veroeffentlichen ? "PUBLISHED" : "DRAFT",
      notes: daten.notizen || null,
      sessions: {
        create: daten.termine.map((termin) => ({
          date: alsKalendertag(termin.datum),
          startTime: termin.von,
          endTime: termin.bis,
        })),
      },
    },
    select: { id: true },
  });

  return kurs.id;
}

/**
 * Kurs aendern.
 *
 * Die Termine werden nach Position abgeglichen statt geloescht und neu
 * angelegt: sonst verloere jede Preisaenderung die Kursleiter-Zuweisungen aus
 * dem Einsatzplan. Wer den zweiten Block um eine halbe Stunde verschiebt, will
 * nicht, dass Luca aus dem Plan faellt.
 */
export async function kursAktualisieren(
  kursId: string,
  daten: KursDaten,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const bestehende = await tx.courseSession.findMany({
      where: { courseId: kursId },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      select: { id: true },
    });

    await tx.course.update({
      where: { id: kursId },
      data: {
        courseTypeId: daten.kursartId,
        price: daten.preis,
        materialPrice: daten.materialpreis,
        onlineLimit: daten.onlineLimit,
        ...rabattFelder(daten),
        status: daten.veroeffentlichen ? "PUBLISHED" : "DRAFT",
        notes: daten.notizen || null,
      },
    });

    for (const [index, termin] of daten.termine.entries()) {
      const vorhanden = bestehende[index];
      const werte = {
        date: alsKalendertag(termin.datum),
        startTime: termin.von,
        endTime: termin.bis,
      };

      if (vorhanden) {
        await tx.courseSession.update({
          where: { id: vorhanden.id },
          data: werte,
        });
      } else {
        await tx.courseSession.create({ data: { courseId: kursId, ...werte } });
      }
    }

    const ueberzaehlig = bestehende.slice(daten.termine.length);
    if (ueberzaehlig.length > 0) {
      await tx.courseSession.deleteMany({
        where: { id: { in: ueberzaehlig.map((termin) => termin.id) } },
      });
    }
  });
}

export type DuplikatErgebnis =
  | { erfolg: true; kursId: string; verschobenUm: number }
  | { erfolg: false; fehler: "nicht-gefunden" | "keine-termine" };

/**
 * Kurs duplizieren und dabei alle Termine um dieselbe Spanne verschieben.
 *
 * Der haeufigere Weg zu einem neuen Kurs als der Wizard: Ausilias Kurse
 * wiederholen sich, nur das Datum aendert. Sie waehlt den neuen ersten
 * Kurstag, der Rest ruecht mit — vier Daten von Hand einzutippen waere vier
 * Gelegenheiten, sich zu vertippen.
 *
 * Der Versatz wird in ganzen Tagen gerechnet. Beide Daten sind Mitternacht
 * UTC, deshalb ist die Division exakt und die Sommerzeit spielt keine Rolle.
 *
 * Das Duplikat ist immer ein Entwurf. Ein versehentlich veroeffentlichter
 * Kurs waere sofort oeffentlich buchbar.
 */
export async function kursDuplizieren(
  kursId: string,
  neuerStart: string,
): Promise<DuplikatErgebnis> {
  const quelle = await prisma.course.findUnique({
    where: { id: kursId },
    include: {
      sessions: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
    },
  });

  if (!quelle) return { erfolg: false, fehler: "nicht-gefunden" };
  if (quelle.sessions.length === 0) {
    return { erfolg: false, fehler: "keine-termine" };
  }

  const ziel = alsKalendertag(neuerStart);
  const versatz = Math.round(
    (ziel.getTime() - quelle.sessions[0].date.getTime()) / 86_400_000,
  );

  // Zuweisungen werden mitgenommen, aber nur von Personen, die noch aktiv
  // sind. Ein ausgeschiedener Kursleiter im neuen Kurs faellt sonst erst am
  // Kurstag auf.
  const aktive = new Set(
    (
      await prisma.instructor.findMany({
        where: { active: true },
        select: { id: true },
      })
    ).map((instruktor) => instruktor.id),
  );

  const duplikat = await prisma.course.create({
    data: {
      courseTypeId: quelle.courseTypeId,
      price: quelle.price,
      materialPrice: quelle.materialPrice,
      onlineLimit: quelle.onlineLimit,
      earlyBirdPercent: quelle.earlyBirdPercent,
      earlyBirdSlots: quelle.earlyBirdSlots,
      status: "DRAFT",
      notes: quelle.notes,
      sessions: {
        create: quelle.sessions.map((termin) => ({
          date: new Date(termin.date.getTime() + versatz * 86_400_000),
          startTime: termin.startTime,
          endTime: termin.endTime,
          instructorId:
            termin.instructorId && aktive.has(termin.instructorId)
              ? termin.instructorId
              : null,
        })),
      },
    },
    select: { id: true },
  });

  return { erfolg: true, kursId: duplikat.id, verschobenUm: versatz };
}

export type AbsageErgebnis =
  | {
      erfolg: true;
      betroffene: Betroffene[];
      kursName: string;
      termine: { datum: Date; von: string; bis: string }[];
    }
  | { erfolg: false; fehler: "nicht-gefunden" | "bereits-abgesagt" };

/**
 * Kurs absagen.
 *
 * Die Buchungen werden mit abgesagt, sonst zaehlte die Abrechnung in Sprint 5
 * Umsatz und Provision fuer einen Kurs, der nie stattgefunden hat. Beides in
 * einer Transaktion, damit kein Zustand entsteht, in dem der Kurs abgesagt ist
 * und die Buchungen noch stehen.
 *
 * Die Kurszeile wird gesperrt wie beim Buchen. Ohne die Sperre koennte genau
 * zwischen dem Lesen der Betroffenen und dem Absagen noch jemand buchen: die
 * Buchung wuerde storniert, die Person aber nie benachrichtigt. Dieselbe
 * Sperre wie in lib/buchung.ts heisst, dass sich Buchen und Absagen
 * gegenseitig ausschliessen.
 *
 * Der Grund wandert in die Notizen. Ohne Benachrichtigung waere er sonst
 * verloren, und in zwei Monaten weiss niemand mehr, warum der Kurs ausfiel.
 */
export async function kursAbsagen(
  kursId: string,
  grund: string,
): Promise<AbsageErgebnis> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM course WHERE id = ${kursId} FOR UPDATE`;

    const kurs = await tx.course.findUnique({
      where: { id: kursId },
      include: {
        courseType: { select: { name: true } },
        sessions: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
      },
    });

    if (!kurs) return { erfolg: false, fehler: "nicht-gefunden" };
    if (kurs.status === "CANCELLED") {
      return { erfolg: false, fehler: "bereits-abgesagt" };
    }

    const betroffene = await tx.booking.findMany({
      where: { courseId: kursId, status: "CONFIRMED" },
      orderBy: { lastName: "asc" },
      select: BETROFFENE_FELDER,
    });

    await tx.booking.updateMany({
      where: { courseId: kursId, status: "CONFIRMED" },
      data: { status: "CANCELLED" },
    });

    const vermerk = `Abgesagt am ${new Date().toLocaleDateString("de-CH")}${grund ? `: ${grund}` : ""}`;
    await tx.course.update({
      where: { id: kursId },
      data: {
        status: "CANCELLED",
        notes: kurs.notes ? `${kurs.notes}\n${vermerk}` : vermerk,
      },
    });

    return {
      erfolg: true,
      betroffene,
      kursName: kurs.courseType.name,
      termine: kurs.sessions.map((termin) => ({
        datum: termin.date,
        von: termin.startTime,
        bis: termin.endTime,
      })),
    };
  });
}

/** Entwurf veroeffentlichen. Ohne Termine gibt es nichts zu buchen. */
export async function kursVeroeffentlichen(
  kursId: string,
): Promise<{ erfolg: boolean; fehler?: "keine-termine" }> {
  const anzahl = await prisma.courseSession.count({ where: { courseId: kursId } });
  if (anzahl === 0) return { erfolg: false, fehler: "keine-termine" };

  await prisma.course.update({
    where: { id: kursId },
    data: { status: "PUBLISHED" },
  });
  return { erfolg: true };
}

/** Zurueck in den Entwurf. Bestehende Buchungen bleiben unberuehrt. */
export async function kursZurueckziehen(kursId: string): Promise<void> {
  await prisma.course.update({
    where: { id: kursId },
    data: { status: "DRAFT" },
  });
}

/**
 * SARI-Vermerk setzen oder loeschen.
 *
 * Fristen laut asa: der Kurs muss 24 Stunden vor Beginn eingetragen und 24
 * Stunden nach dem letzten Termin bestaetigt sein. Hier wird nur festgehalten,
 * wann es geschehen ist; die Erinnerung daran kommt spaeter.
 */
export async function sariVermerken(
  kursId: string,
  feld: "angemeldet" | "bestaetigt",
  gesetzt: boolean,
): Promise<void> {
  const wert = gesetzt ? new Date() : null;
  await prisma.course.update({
    where: { id: kursId },
    data:
      feld === "angemeldet"
        ? { sariAngemeldetAm: wert }
        : { sariBestaetigtAm: wert },
  });
}
