import "server-only";
import { prisma } from "@/lib/db";
import { abosMitStand, offeneLektionenProSchueler } from "@/lib/schueler";
import { erinnerungFaellig } from "@/lib/wab";
import type { LessonCategory, LessonStatus } from "@/lib/generated/prisma/enums";

/**
 * Schuelerkartei im Panel.
 *
 * Lesen fuer die Liste und die Einzelansicht. Das Rechnen am Abo-Stand steht in
 * lib/schueler.ts und wird hier nur benutzt — eine zweite Zaehlung waere eine
 * zweite Wahrheit.
 */

export type SchuelerZeile = {
  id: string;
  vorname: string;
  nachname: string;
  telefon: string;
  email: string | null;
  offeneLektionen: number;
  pruefungAm: Date | null;
  wabGesendetAm: Date | null;
  wabMailStatus: string | null;
  /** Faellig fuer die WAB-Erinnerung, aber ohne Adresse: anrufen. */
  wabOhneAdresse: boolean;
};

/**
 * Schuelerliste, wahlweise gefiltert.
 *
 * Sucht in Nachname, Vorname und Telefon, wie die Buchungssuche. Die
 * Telefonsuche ignoriert Leerzeichen: im Panel steht "079 604 44 44", getippt
 * wird "0796044444".
 */
export async function schuelerSuchen(suche?: string): Promise<SchuelerZeile[]> {
  const begriff = suche?.trim() ?? "";
  const ziffern = begriff.replace(/\s/g, "");

  const gefunden = await prisma.studentRecord.findMany({
    where: begriff
      ? {
          OR: [
            { lastName: { contains: begriff, mode: "insensitive" } },
            { firstName: { contains: begriff, mode: "insensitive" } },
            { phone: { contains: begriff } },
            ...(ziffern !== begriff ? [{ phone: { contains: ziffern } }] : []),
          ],
        }
      : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 200,
  });

  const offen = await offeneLektionenProSchueler(gefunden.map((s) => s.id));

  return gefunden.map((person) => ({
    id: person.id,
    vorname: person.firstName,
    nachname: person.lastName,
    telefon: person.phone,
    email: person.email,
    offeneLektionen: offen.get(person.id) ?? 0,
    pruefungAm: person.practicalExamPassedAt,
    wabGesendetAm: person.wabReminderSentAt,
    wabMailStatus: person.wabMailStatus,
    wabOhneAdresse:
      erinnerungFaellig(person).grund === "keine E-Mail-Adresse hinterlegt",
  }));
}

export type LektionZeile = {
  id: string;
  kategorie: LessonCategory;
  datum: Date;
  startzeit: string;
  dauerMinuten: number;
  abholort: string | null;
  status: LessonStatus;
  instruktor: string;
  instruktorId: string;
  aboId: string | null;
};

/** Eine Kartei mit allem, was die Detailansicht braucht. */
export async function schuelerLesen(studentId: string) {
  const person = await prisma.studentRecord.findUnique({
    where: { id: studentId },
    include: {
      lessons: {
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true, shortCode: true },
          },
        },
      },
    },
  });
  if (!person) return null;

  const abos = await abosMitStand(studentId);

  const lektionen: LektionZeile[] = person.lessons.map((lektion) => ({
    id: lektion.id,
    kategorie: lektion.category,
    datum: lektion.date,
    startzeit: lektion.startTime,
    dauerMinuten: lektion.durationMin,
    abholort: lektion.pickupNote,
    status: lektion.status,
    instruktorId: lektion.instructor.id,
    instruktor: `${lektion.instructor.lastName} ${lektion.instructor.firstName}`,
    aboId: lektion.packageId,
  }));

  return {
    id: person.id,
    vorname: person.firstName,
    nachname: person.lastName,
    telefon: person.phone,
    email: person.email,
    notiz: person.notes,
    pruefungAm: person.practicalExamPassedAt,
    wabGesendetAm: person.wabReminderSentAt,
    wabMailStatus: person.wabMailStatus,
    wabMailGrund: person.wabMailGrund,
    abos,
    lektionen,
  };
}

export type SchuelerKartei = NonNullable<
  Awaited<ReturnType<typeof schuelerLesen>>
>;

export async function schuelerAnlegen(daten: {
  vorname: string;
  nachname: string;
  telefon: string;
  email?: string;
  notiz?: string;
}): Promise<string> {
  const person = await prisma.studentRecord.create({
    data: {
      firstName: daten.vorname.trim(),
      lastName: daten.nachname.trim(),
      phone: daten.telefon.trim(),
      email: daten.email?.trim() || null,
      notes: daten.notiz?.trim() || null,
    },
    select: { id: true },
  });
  return person.id;
}

export async function schuelerAendern(
  studentId: string,
  daten: {
    vorname: string;
    nachname: string;
    telefon: string;
    email?: string;
    notiz?: string;
  },
): Promise<void> {
  await prisma.studentRecord.update({
    where: { id: studentId },
    data: {
      firstName: daten.vorname.trim(),
      lastName: daten.nachname.trim(),
      phone: daten.telefon.trim(),
      email: daten.email?.trim() || null,
      notes: daten.notiz?.trim() || null,
    },
  });
}

/**
 * Praktische Pruefung eintragen oder loeschen.
 *
 * Darf auch ein Fahrlehrer, deshalb hier ohne Rollenpruefung — die sitzt in der
 * Action. Wird das Datum entfernt, geht der WAB-Vermerk mit: sonst stuende dort
 * eine Erinnerung zu einer Pruefung, die es nicht mehr gibt.
 */
export async function pruefungEintragen(
  studentId: string,
  datum: string | null,
): Promise<void> {
  await prisma.studentRecord.update({
    where: { id: studentId },
    data: datum
      ? { practicalExamPassedAt: new Date(datum) }
      : {
          practicalExamPassedAt: null,
          wabReminderSentAt: null,
          wabMailStatus: null,
          wabMailGrund: null,
        },
  });
}

export async function aboAnlegen(daten: {
  studentId: string;
  kategorie: LessonCategory;
  groesse: number;
  preisProLektion: string;
  zahlart: "BAR" | "TWINT" | "KARTE";
  bezahlt: boolean;
}): Promise<void> {
  await prisma.lessonPackage.create({
    data: {
      studentId: daten.studentId,
      category: daten.kategorie,
      size: daten.groesse,
      pricePerLesson: daten.preisProLektion,
      paymentMethod: daten.zahlart,
      paymentStatus: daten.bezahlt ? "BEZAHLT" : "OFFEN",
      paidAt: daten.bezahlt ? new Date() : null,
    },
  });
}

/** Zahlstatus eines Abos umstellen. */
export async function aboZahlstatusSetzen(
  aboId: string,
  bezahlt: boolean,
): Promise<void> {
  await prisma.lessonPackage.update({
    where: { id: aboId },
    data: {
      paymentStatus: bezahlt ? "BEZAHLT" : "OFFEN",
      paidAt: bezahlt ? new Date() : null,
    },
  });
}

/**
 * Faellige WAB-Erinnerungen fuer die Uebersicht.
 *
 * Zwei Zahlen, weil sie zu verschiedenen Handlungen fuehren: die einen bekommen
 * eine Mail, die anderen muss jemand anrufen.
 */
export async function wabUebersicht(jetzt: Date = new Date()) {
  const faellige = await prisma.studentRecord.findMany({
    where: { practicalExamPassedAt: { not: null }, wabReminderSentAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      practicalExamPassedAt: true,
      wabReminderSentAt: true,
    },
  });

  const bewertet = faellige.map((person) => ({
    person,
    entscheidung: erinnerungFaellig(person, jetzt),
  }));

  return {
    mitAdresse: bewertet.filter((e) => e.entscheidung.faellig).map((e) => e.person),
    ohneAdresse: bewertet
      .filter(
        (e) => e.entscheidung.grund === "keine E-Mail-Adresse hinterlegt",
      )
      .map((e) => e.person),
  };
}
