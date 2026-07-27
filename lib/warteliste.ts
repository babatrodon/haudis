import "server-only";
import { randomBytes } from "node:crypto";
import { prisma, type PrismaTx } from "@/lib/db";

/**
 * Warteliste eines ausgebuchten Kurses (PLAN.md Abschnitt 14).
 *
 * Kundenentscheid 26.07.2026: Wird ein Platz frei, bekommt die naechste Person
 * eine Benachrichtigung mit Buchungslink. Es rueckt niemand automatisch nach —
 * wer sich vor drei Wochen eingetragen hat, hat womoeglich laengst einen
 * anderen Kurs besucht, und eine Buchung ohne Zutun waere eine Rechnung ohne
 * Zutun.
 *
 * DER RESERVIERTE PLATZ
 *
 * Eine Einladung haelt den Platz fuer EINLADUNG_STUNDEN. Solange sie laeuft,
 * zaehlt sie gegen die Kapazitaet wie eine Buchung. Ohne das koennte ein
 * beliebiger Besucher den Platz nehmen, bevor die eingeladene Person ihre Mail
 * geoeffnet hat, und die Einladung waere ein Versprechen, das die Fahrschule
 * nicht halten kann.
 *
 * Laeuft die Frist ab, wird der Platz von selbst wieder frei: es gibt keinen
 * Aufraeum-Job, sondern die Frist wird bei jeder Zaehlung ausgewertet. Ein
 * abgelaufener Eintrag bleibt auf EINGELADEN stehen — das ist die Wahrheit
 * ueber das, was passiert ist, und die Admin sieht im Panel, dass die Person
 * nicht reagiert hat.
 */

/** Wie lange ein frei gewordener Platz reserviert bleibt. */
export const EINLADUNG_STUNDEN = 48;

/**
 * Where-Bedingung fuer Einladungen, deren Frist noch laeuft.
 *
 * An einer Stelle, weil sie an drei Orten gebraucht wird: beim Zaehlen fuer die
 * Ampel, beim Zaehlen in der Buchungstransaktion und beim Pruefen eines Tokens.
 * Drei Fassungen davon liefen frueher oder spaeter auseinander, und die Folge
 * waere ein ueberbuchter Kurs.
 */
export function offeneEinladung(jetzt: Date = new Date()) {
  return { status: "EINGELADEN" as const, invitedUntil: { gt: jetzt } };
}

/** Reservierte Plaetze eines Kurses. */
export async function offeneEinladungenZaehlen(
  db: PrismaTx | typeof prisma,
  kursId: string,
  jetzt: Date = new Date(),
): Promise<number> {
  return db.waitlistEntry.count({
    where: { courseId: kursId, ...offeneEinladung(jetzt) },
  });
}

/** Reservierte Plaetze fuer mehrere Kurse auf einmal, fuer Listenansichten. */
export async function offeneEinladungenProKurs(
  kursIds: string[],
  jetzt: Date = new Date(),
): Promise<Map<string, number>> {
  if (kursIds.length === 0) return new Map();

  const gruppen = await prisma.waitlistEntry.groupBy({
    by: ["courseId"],
    where: { courseId: { in: kursIds }, ...offeneEinladung(jetzt) },
    _count: { _all: true },
  });

  return new Map(gruppen.map((g) => [g.courseId, g._count._all]));
}

/**
 * Einladungstoken.
 *
 * randomBytes aus node:crypto, nicht Math.random: der Token ist der einzige
 * Nachweis, dass jemand eingeladen wurde, und wer ihn erraet, nimmt einen
 * reservierten Platz weg. 32 Byte als Hex sind 64 Zeichen — lang genug, dass
 * Raten aussichtslos ist, und kurz genug fuer eine Adresszeile.
 */
export function tokenErzeugen(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Vollstaendige Adresse fuer die Mail.
 *
 * Relative Links funktionieren in einer E-Mail nicht, also braucht es den
 * Ursprung. BETTER_AUTH_URL steht ohnehin schon in der Umgebung und zeigt auf
 * dieselbe Anwendung; ein zweiter Schluessel fuer denselben Wert waere eine
 * Gelegenheit, ihn beim Umzug zu vergessen.
 */
export function einladungsLink(kursId: string, token: string): string {
  const basis = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  return `${basis}/anmeldung/${kursId}?einladung=${token}`;
}

export type WartelisteEingabe = {
  vorname: string;
  nachname: string;
  telefon: string;
  email: string;
};

export type WartelisteFehler =
  | "kurs-nicht-buchbar"
  | "noch-plaetze-frei"
  | "schon-eingetragen";

export type WartelisteErgebnis =
  | { erfolg: true; eintragId: string; position: number }
  | { erfolg: false; fehler: WartelisteFehler };

/**
 * Eintragen auf die Warteliste.
 *
 * Laeuft unter derselben Kurssperre wie eine Buchung. Der Grund ist nicht die
 * Kapazitaet — eine Warteliste hat keine —, sondern die Pruefung "ist der Kurs
 * ueberhaupt voll". Ohne Sperre koennte zwischen Zaehlen und Schreiben ein
 * Platz frei werden, und die Person stuende auf der Warteliste eines Kurses,
 * den sie haette buchen koennen.
 */
export async function wartelisteEintragen(
  kursId: string,
  eingabe: WartelisteEingabe,
): Promise<WartelisteErgebnis> {
  const email = eingabe.email.trim().toLowerCase();

  return prisma.$transaction(async (tx) => {
    const gesperrt = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM course WHERE id = ${kursId} FOR UPDATE
    `;
    if (gesperrt.length === 0) {
      return { erfolg: false, fehler: "kurs-nicht-buchbar" as const };
    }

    const kurs = await tx.course.findUnique({
      where: { id: kursId },
      include: { courseType: true },
    });
    if (
      !kurs ||
      kurs.status !== "PUBLISHED" ||
      !kurs.courseType.active ||
      !kurs.courseType.bookable
    ) {
      return { erfolg: false, fehler: "kurs-nicht-buchbar" as const };
    }

    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const kuenftige = await tx.courseSession.count({
      where: { courseId: kursId, date: { gte: heute } },
    });
    if (kuenftige === 0) {
      return { erfolg: false, fehler: "kurs-nicht-buchbar" as const };
    }

    // Eine Warteliste auf einem Kurs mit freien Plaetzen waere Unsinn: die
    // Person soll buchen. Der oeffentliche Weg zeigt das Formular ohnehin nur
    // bei Rot, hier steht die Regel noch einmal fuer den Fall, dass in der
    // Zwischenzeit jemand storniert hat.
    const belegt = await tx.booking.count({
      where: { courseId: kursId, status: "CONFIRMED" },
    });
    const reserviert = await offeneEinladungenZaehlen(tx, kursId);
    if (belegt + reserviert < kurs.onlineLimit) {
      return { erfolg: false, fehler: "noch-plaetze-frei" as const };
    }

    // Doppelte Eintraege derselben Adresse bringen niemandem etwas: die Person
    // steht schon in der Schlange, ein zweiter Eintrag wuerde sie nur nach
    // hinten kopieren. ENTFERNT zaehlt nicht mit — wer gestrichen wurde und
    // sich neu eintraegt, darf das.
    const schonDa = await tx.waitlistEntry.findFirst({
      where: {
        courseId: kursId,
        email,
        status: { in: ["WARTET", "EINGELADEN"] },
      },
      select: { id: true },
    });
    if (schonDa) {
      return { erfolg: false, fehler: "schon-eingetragen" as const };
    }

    const eintrag = await tx.waitlistEntry.create({
      data: {
        courseId: kursId,
        firstName: eingabe.vorname.trim(),
        lastName: eingabe.nachname.trim(),
        phone: eingabe.telefon.trim(),
        email,
      },
      select: { id: true },
    });

    const position = await tx.waitlistEntry.count({
      where: { courseId: kursId, status: { in: ["WARTET", "EINGELADEN"] } },
    });

    return { erfolg: true as const, eintragId: eintrag.id, position };
  });
}

/**
 * Laedt die naechste wartende Person ein und reserviert ihr den Platz.
 *
 * Erwartet, dass der Aufrufer die Kurszeile bereits gesperrt hat: sonst
 * koennten zwei gleichzeitige Stornos dieselbe Person zweimal einladen oder
 * zwei Personen fuer denselben Platz.
 *
 * Gibt null zurueck, wenn niemand wartet oder kein Platz frei ist. Der
 * Mailversand gehoert NICHT hierher — er steht ausserhalb der Transaktion,
 * damit ein Ausfall von Resend den Storno nicht zurueckrollt.
 */
export async function naechstePersonEinladen(
  tx: PrismaTx,
  kursId: string,
  jetzt: Date = new Date(),
): Promise<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  invitedUntil: Date;
} | null> {
  const kurs = await tx.course.findUnique({
    where: { id: kursId },
    select: { onlineLimit: true, status: true },
  });
  // Ein abgesagter Kurs hat keinen Platz zu vergeben.
  if (!kurs || kurs.status !== "PUBLISHED") return null;

  const belegt = await tx.booking.count({
    where: { courseId: kursId, status: "CONFIRMED" },
  });
  const reserviert = await offeneEinladungenZaehlen(tx, kursId, jetzt);
  if (belegt + reserviert >= kurs.onlineLimit) return null;

  const naechste = await tx.waitlistEntry.findFirst({
    where: { courseId: kursId, status: "WARTET" },
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (!naechste) return null;

  const token = tokenErzeugen();
  const invitedUntil = new Date(
    jetzt.getTime() + EINLADUNG_STUNDEN * 60 * 60 * 1000,
  );

  await tx.waitlistEntry.update({
    where: { id: naechste.id },
    data: { status: "EINGELADEN", token, invitedAt: jetzt, invitedUntil },
  });

  return { ...naechste, token, invitedUntil };
}

/**
 * Prueft einen Einladungstoken, ohne etwas zu veraendern.
 *
 * Fuer die Anzeige: das Formular soll sagen, bis wann der Platz reserviert ist,
 * und eine abgelaufene Einladung soll das auch so nennen. Verbraucht wird der
 * Token erst in der Buchungstransaktion.
 */
export async function einladungLesen(
  token: string,
  kursId: string,
  jetzt: Date = new Date(),
): Promise<
  | { gueltig: true; vorname: string; nachname: string; email: string; frist: Date }
  | { gueltig: false; grund: "unbekannt" | "abgelaufen" | "verbraucht" }
> {
  const eintrag = await prisma.waitlistEntry.findUnique({
    where: { token },
    select: {
      courseId: true,
      status: true,
      invitedUntil: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!eintrag || eintrag.courseId !== kursId) {
    return { gueltig: false, grund: "unbekannt" };
  }
  if (eintrag.status === "GEBUCHT") {
    return { gueltig: false, grund: "verbraucht" };
  }
  if (eintrag.status !== "EINGELADEN" || !eintrag.invitedUntil) {
    return { gueltig: false, grund: "unbekannt" };
  }
  if (eintrag.invitedUntil <= jetzt) {
    return { gueltig: false, grund: "abgelaufen" };
  }

  return {
    gueltig: true,
    vorname: eintrag.firstName,
    nachname: eintrag.lastName,
    email: eintrag.email,
    frist: eintrag.invitedUntil,
  };
}
