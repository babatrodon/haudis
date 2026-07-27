import "server-only";
import { prisma } from "@/lib/db";
import { datumLang, datumZeit } from "@/lib/format";
import { versandVermerk, wartelistenEinladungSenden } from "@/lib/mail";
import { einladungsLink, naechstePersonEinladen } from "@/lib/warteliste";
import type { BookingSource, BookingStatus } from "@/lib/generated/prisma/enums";
import type { Decimal } from "@/lib/decimal";

/**
 * Buchungen im Panel.
 *
 * Die Kurs-Buchungsansicht ist der Bildschirm, den Ausilia am haeufigsten
 * oeffnet, oft im Stehen und mit dem Handy in einer Hand. Was sie dort
 * braucht, steht deshalb ganz vorne im Datensatz: Name, Nummer, Ausweis.
 */

export type BuchungZeile = {
  id: string;
  anrede: string;
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  geburtsdatum: Date;
  telefon: string;
  email: string | null;
  /** null heisst: Ausweisnummer fehlt, und das muss auffallen. */
  lfaNummer: string | null;
  quelle: BookingSource;
  status: BookingStatus;
  preis: Decimal;
  fruehbucher: boolean;
  angemeldetAm: Date;
  smsErinnerung: boolean;
  /** Kuerzel des zuweisenden Fahrlehrers, Grundlage der Provision. */
  fahrlehrer: { id: string; kuerzel: string; name: string } | null;
};

export type Zaehler = {
  online: number;
  telefon: number;
  /** Ueber das Fahrlehrer-Portal angemeldet. */
  fahrlehrer: number;
  total: number;
  /** Storniert, zaehlt nicht zur Kapazitaet, bleibt aber sichtbar. */
  storniert: number;
  ohneAusweis: number;
};

const ZEILEN_FELDER = {
  id: true,
  salutation: true,
  firstName: true,
  lastName: true,
  street: true,
  zip: true,
  city: true,
  birthDate: true,
  phone: true,
  email: true,
  lfaNumber: true,
  source: true,
  status: true,
  priceCharged: true,
  earlyBird: true,
  createdAt: true,
  smsReminder: true,
  referredBy: { select: { id: true, shortCode: true, firstName: true, lastName: true } },
} as const;

type RohZeile = {
  id: string;
  salutation: string;
  firstName: string;
  lastName: string;
  street: string;
  zip: string;
  city: string;
  birthDate: Date;
  phone: string;
  email: string | null;
  lfaNumber: string | null;
  source: BookingSource;
  status: BookingStatus;
  priceCharged: Decimal;
  earlyBird: boolean;
  createdAt: Date;
  smsReminder: boolean;
  referredBy: {
    id: string;
    shortCode: string;
    firstName: string;
    lastName: string;
  } | null;
};

function zeile(roh: RohZeile): BuchungZeile {
  return {
    id: roh.id,
    anrede: roh.salutation,
    vorname: roh.firstName,
    nachname: roh.lastName,
    strasse: roh.street,
    plz: roh.zip,
    ort: roh.city,
    geburtsdatum: roh.birthDate,
    telefon: roh.phone,
    email: roh.email,
    lfaNummer: roh.lfaNumber,
    quelle: roh.source,
    status: roh.status,
    preis: roh.priceCharged,
    fruehbucher: roh.earlyBird,
    angemeldetAm: roh.createdAt,
    smsErinnerung: roh.smsReminder,
    fahrlehrer: roh.referredBy
      ? {
          id: roh.referredBy.id,
          kuerzel: roh.referredBy.shortCode,
          name: `${roh.referredBy.firstName} ${roh.referredBy.lastName}`,
        }
      : null,
  };
}

/**
 * Alle Buchungen eines Kurses, sortiert nach Nachname.
 *
 * Nach Nachname und nicht nach Anmeldedatum: am Kurstag sucht man einen Namen
 * in der Liste, nicht die siebte Anmeldung.
 */
export async function buchungenFuerKurs(kursId: string): Promise<{
  zeilen: BuchungZeile[];
  zaehler: Zaehler;
}> {
  const roh = await prisma.booking.findMany({
    where: { courseId: kursId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: ZEILEN_FELDER,
  });

  const zeilen = roh.map(zeile);
  const bestaetigt = zeilen.filter((eintrag) => eintrag.status === "CONFIRMED");

  return {
    zeilen,
    zaehler: {
      online: bestaetigt.filter((eintrag) => eintrag.quelle === "ONLINE").length,
      telefon: bestaetigt.filter((eintrag) => eintrag.quelle === "PHONE").length,
      fahrlehrer: bestaetigt.filter((eintrag) => eintrag.quelle === "INSTRUCTOR")
        .length,
      total: bestaetigt.length,
      storniert: zeilen.filter((eintrag) => eintrag.status === "CANCELLED").length,
      ohneAusweis: bestaetigt.filter((eintrag) => !eintrag.lfaNummer).length,
    },
  };
}

/**
 * Globale Suche ueber Name, Telefon und E-Mail.
 *
 * Der Fall dahinter: jemand ruft an und sagt nur seinen Namen. Ohne diese
 * Suche muesste Ausilia raten, in welchem Kurs die Person steht.
 */
export async function buchungenSuchen(suche: string): Promise<
  (BuchungZeile & {
    kurs: { id: string; name: string; ersterTermin: Date | null };
  })[]
> {
  const begriff = suche.trim();
  if (begriff.length < 2) return [];

  // Ziffern getrennt behandeln: "079 604 44 44" und "0796044444" sollen
  // dieselbe Person finden, unabhaengig davon, wie sie erfasst wurde.
  const ziffern = begriff.replace(/\D/g, "");

  const roh = await prisma.booking.findMany({
    where: {
      OR: [
        { lastName: { contains: begriff, mode: "insensitive" } },
        { firstName: { contains: begriff, mode: "insensitive" } },
        { email: { contains: begriff, mode: "insensitive" } },
        { phone: { contains: begriff } },
        ...(ziffern.length >= 3 ? [{ phone: { contains: ziffern } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      ...ZEILEN_FELDER,
      course: {
        select: {
          id: true,
          courseType: { select: { name: true } },
          sessions: {
            orderBy: { date: "asc" },
            take: 1,
            select: { date: true },
          },
        },
      },
    },
  });

  return roh.map((eintrag) => ({
    ...zeile(eintrag),
    kurs: {
      id: eintrag.course.id,
      name: eintrag.course.courseType.name,
      ersterTermin: eintrag.course.sessions[0]?.date ?? null,
    },
  }));
}

/** Kopf der Kurs-Buchungsansicht: welcher Kurs, welche Termine. */
export async function kursKopfLesen(kursId: string) {
  return prisma.course.findUnique({
    where: { id: kursId },
    select: {
      id: true,
      status: true,
      onlineLimit: true,
      price: true,
      materialPrice: true,
      courseType: { select: { name: true, code: true, requiresLfa: true } },
      sessions: {
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          instructor: { select: { shortCode: true, firstName: true, lastName: true } },
        },
      },
    },
  });
}

export type KursKopf = NonNullable<Awaited<ReturnType<typeof kursKopfLesen>>>;

/** Ausweisnummer nachtragen. Kommt oft erst am Kurstag. */
export async function lfaSetzen(
  buchungId: string,
  nummer: string,
): Promise<void> {
  await prisma.booking.update({
    where: { id: buchungId },
    data: { lfaNumber: nummer.trim() || null },
  });
}

export type BuchungAenderung = {
  anrede: string;
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  geburtsdatum: string;
  telefon: string;
  /** Leer heisst: keine Adresse hinterlegt, dann geht auch keine Mail hinaus. */
  email: string;
  lfaNummer: string;
  /** Leer heisst: keine Zuweisung, also keine Provision. */
  fahrlehrerId: string;
};

/**
 * Buchung aendern.
 *
 * Der festgehaltene Provisionssatz wird nur angefasst, wenn sich die Zuweisung
 * aendert. Bleibt derselbe Fahrlehrer stehen, bleibt auch sein damaliger Satz
 * stehen — sonst wuerde das Korrigieren einer Telefonnummer nebenbei die
 * Abrechnung eines vergangenen Monats neu schreiben.
 */
export async function buchungAendern(
  buchungId: string,
  daten: BuchungAenderung,
): Promise<void> {
  const bisher = await prisma.booking.findUnique({
    where: { id: buchungId },
    select: { referredById: true, commissionRate: true },
  });

  const neuerFahrlehrer = daten.fahrlehrerId || null;
  const satz =
    bisher && bisher.referredById === neuerFahrlehrer
      ? bisher.commissionRate
      : neuerFahrlehrer
        ? ((
            await prisma.instructor.findUnique({
              where: { id: neuerFahrlehrer },
              select: { provisionPerBooking: true },
            })
          )?.provisionPerBooking ?? null)
        : null;

  await prisma.booking.update({
    where: { id: buchungId },
    data: {
      commissionRate: satz,
      salutation: daten.anrede,
      firstName: daten.vorname,
      lastName: daten.nachname,
      street: daten.strasse,
      zip: daten.plz,
      city: daten.ort,
      birthDate: new Date(daten.geburtsdatum),
      phone: daten.telefon,
      email: daten.email.trim() || null,
      lfaNumber: daten.lfaNummer.trim() || null,
      referredById: daten.fahrlehrerId || null,
    },
  });
}

/**
 * Stornieren statt loeschen.
 *
 * Der Platz wird frei, die Zeile bleibt. Sonst verschwaende eine Absage
 * spurlos, und es fehlte der Beleg dafuer, dass die Anmeldung je bestand.
 *
 * Mit dem frei gewordenen Platz wird die naechste Person von der Warteliste
 * eingeladen (Kundenentscheid 26.07.2026). Das laeuft unter derselben
 * Kurssperre wie eine Anmeldung: ohne sie koennten zwei gleichzeitige Stornos
 * zwei Personen fuer denselben Platz einladen.
 *
 * Der Mailversand steht ausserhalb der Transaktion. Der Platz ist frei, auch
 * wenn Resend ausfaellt — und ein Storno, der an einem Mailserver scheitert,
 * waere eine Buchung, die Ausilia nicht loswird.
 */
export async function buchungStornieren(buchungId: string): Promise<void> {
  const eingeladen = await prisma.$transaction(async (tx) => {
    const buchung = await tx.booking.findUnique({
      where: { id: buchungId },
      select: { courseId: true, status: true },
    });
    if (!buchung || buchung.status === "CANCELLED") return null;

    await tx.$queryRaw`SELECT id FROM course WHERE id = ${buchung.courseId} FOR UPDATE`;

    await tx.booking.update({
      where: { id: buchungId },
      data: { status: "CANCELLED" },
    });

    return naechstePersonEinladen(tx, buchung.courseId);
  });

  if (eingeladen) {
    await einladungVerschicken(eingeladen);
  }
}

/**
 * Verschickt eine Einladung und haelt auf dem Eintrag fest, was dabei
 * herauskam.
 *
 * Ohne diesen Vermerk stuende im Panel eine eingeladene Person, von der
 * niemand weiss, ob sie je eine Mail bekommen hat. Solange kein
 * RESEND_API_KEY gesetzt ist, ist die Antwort naemlich: nein.
 */
export async function einladungVerschicken(eingeladen: {
  id: string;
  firstName: string;
  email: string;
  token: string;
  invitedUntil: Date;
}): Promise<void> {
  const eintrag = await prisma.waitlistEntry.findUnique({
    where: { id: eingeladen.id },
    select: {
      courseId: true,
      course: {
        select: {
          courseType: { select: { name: true } },
          sessions: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
        },
      },
    },
  });
  if (!eintrag) return;

  const ergebnis = await wartelistenEinladungSenden({
    an: eingeladen.email,
    vorname: eingeladen.firstName,
    kursName: eintrag.course.courseType.name,
    termine: eintrag.course.sessions.map((termin) => ({
      datum: datumLang(termin.date),
      von: termin.startTime,
      bis: termin.endTime,
    })),
    buchungsLink: einladungsLink(eintrag.courseId, eingeladen.token),
    frist: datumZeit(eingeladen.invitedUntil),
  });

  const vermerk = versandVermerk(ergebnis);
  await prisma.waitlistEntry.update({
    where: { id: eingeladen.id },
    data: { mailStatus: vermerk.status, mailGrund: vermerk.grund },
  });
}

/**
 * Eine stornierte Buchung wieder aufnehmen — aber nur, wenn noch Platz ist.
 *
 * Dieselbe Sperre wie beim Anlegen: sonst koennte ein Widerruf einen Platz
 * belegen, den zeitgleich jemand online gebucht hat.
 */
export async function buchungReaktivieren(
  buchungId: string,
): Promise<{ erfolg: boolean; fehler?: "ausgebucht" | "nicht-gefunden" }> {
  return prisma.$transaction(async (tx) => {
    const buchung = await tx.booking.findUnique({
      where: { id: buchungId },
      select: { courseId: true, status: true },
    });
    if (!buchung) return { erfolg: false, fehler: "nicht-gefunden" as const };

    await tx.$queryRaw`SELECT id FROM course WHERE id = ${buchung.courseId} FOR UPDATE`;

    const kurs = await tx.course.findUnique({
      where: { id: buchung.courseId },
      select: { onlineLimit: true },
    });
    const belegt = await tx.booking.count({
      where: { courseId: buchung.courseId, status: "CONFIRMED" },
    });
    if (!kurs || belegt >= kurs.onlineLimit) {
      return { erfolg: false, fehler: "ausgebucht" as const };
    }

    await tx.booking.update({
      where: { id: buchungId },
      data: { status: "CONFIRMED" },
    });
    return { erfolg: true };
  });
}

/**
 * Endgueltig loeschen. Nur fuer Fehleingaben gedacht und deshalb im Panel
 * deutlich vom Stornieren getrennt.
 */
export async function buchungLoeschen(buchungId: string): Promise<void> {
  await prisma.booking.delete({ where: { id: buchungId } });
}

/** Kurse fuer die Kursauswahl der telefonischen Anmeldung. */
export async function buchbareKurse() {
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);

  const kurse = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      sessions: { some: { date: { gte: heute } } },
    },
    select: {
      id: true,
      onlineLimit: true,
      courseType: { select: { name: true } },
      sessions: { orderBy: { date: "asc" }, take: 1, select: { date: true } },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });

  return kurse
    .map((kurs) => ({
      id: kurs.id,
      name: kurs.courseType.name,
      ersterTermin: kurs.sessions[0]?.date ?? null,
      frei: Math.max(0, kurs.onlineLimit - kurs._count.bookings),
    }))
    .sort(
      (a, b) =>
        (a.ersterTermin?.getTime() ?? 0) - (b.ersterTermin?.getTime() ?? 0),
    );
}
