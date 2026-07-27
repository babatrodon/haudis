import "server-only";
import { prisma } from "@/lib/db";
import { einladungVerschicken } from "@/lib/admin/buchungen";
import { naechstePersonEinladen, offeneEinladung } from "@/lib/warteliste";

/**
 * Warteliste im Panel.
 *
 * Ausilia sieht pro Kurs, wer wartet, wer eingeladen ist und bis wann, und ob
 * die Benachrichtigung tatsaechlich rausging. Der letzte Punkt ist der Grund,
 * warum hier ueberhaupt etwas angezeigt wird: solange kein RESEND_API_KEY
 * gesetzt ist, wird jede Einladung nur protokolliert, und ohne diesen Hinweis
 * saehe die Liste aus, als sei alles unterwegs.
 */

export type WartelisteZeile = {
  id: string;
  position: number;
  vorname: string;
  nachname: string;
  telefon: string;
  email: string;
  status: "WARTET" | "EINGELADEN" | "GEBUCHT" | "ENTFERNT";
  /** Nur bei EINGELADEN gesetzt. */
  frist: Date | null;
  /** Frist verstrichen, ohne dass jemand gebucht hat. */
  abgelaufen: boolean;
  mailStatus: string | null;
  mailGrund: string | null;
  eingetragenAm: Date;
};

export type WartelisteAnsicht = {
  zeilen: WartelisteZeile[];
  /** Wartende und Eingeladene, also alle, die noch auf einen Platz hoffen. */
  offen: number;
  reserviert: number;
};

export async function wartelisteFuerKurs(
  kursId: string,
): Promise<WartelisteAnsicht> {
  const jetzt = new Date();
  const eintraege = await prisma.waitlistEntry.findMany({
    where: { courseId: kursId },
    orderBy: { createdAt: "asc" },
  });

  // Die Position zaehlt nur die, die noch in der Schlange stehen. Wer gebucht
  // hat oder gestrichen wurde, bekommt keine Nummer — sonst waere Position 4
  // die vierte Zeile und nicht die vierte Person, die drankommt.
  let laufend = 0;
  const zeilen = eintraege.map((eintrag) => {
    const inSchlange =
      eintrag.status === "WARTET" || eintrag.status === "EINGELADEN";
    if (inSchlange) laufend += 1;

    return {
      id: eintrag.id,
      position: inSchlange ? laufend : 0,
      vorname: eintrag.firstName,
      nachname: eintrag.lastName,
      telefon: eintrag.phone,
      email: eintrag.email,
      status: eintrag.status,
      frist: eintrag.invitedUntil,
      abgelaufen:
        eintrag.status === "EINGELADEN" &&
        eintrag.invitedUntil !== null &&
        eintrag.invitedUntil <= jetzt,
      mailStatus: eintrag.mailStatus,
      mailGrund: eintrag.mailGrund,
      eingetragenAm: eintrag.createdAt,
    };
  });

  return {
    zeilen,
    offen: zeilen.filter((z) => z.position > 0).length,
    reserviert: await prisma.waitlistEntry.count({
      where: { courseId: kursId, ...offeneEinladung(jetzt) },
    }),
  };
}

/**
 * Von Hand benachrichtigen.
 *
 * Braucht es, wenn die automatische Mail nicht ankam — und solange kein
 * RESEND_API_KEY gesetzt ist, ist das jedes Mal. Laedt dieselbe naechste
 * Person ein wie ein Storno, unter derselben Kurssperre.
 */
export async function naechstenBenachrichtigen(
  kursId: string,
): Promise<{ erfolg: boolean; grund?: string }> {
  const eingeladen = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM course WHERE id = ${kursId} FOR UPDATE`;
    return naechstePersonEinladen(tx, kursId);
  });

  if (!eingeladen) {
    return {
      erfolg: false,
      grund:
        "Zurzeit ist kein Platz frei oder es wartet niemand mehr. Storniere zuerst eine Buchung.",
    };
  }

  await einladungVerschicken(eingeladen);
  return { erfolg: true };
}

/**
 * Eine Einladung noch einmal verschicken, ohne eine neue Person einzuladen.
 *
 * Fuer den Fall, dass die Mail im Spam lag. Frist und Token bleiben, wie sie
 * sind: eine neue Frist waere eine stillschweigende Verlaengerung, und die
 * naechste Person in der Schlange wartete laenger, ohne es zu erfahren.
 */
export async function einladungErneutSenden(
  eintragId: string,
): Promise<{ erfolg: boolean; grund?: string }> {
  const eintrag = await prisma.waitlistEntry.findUnique({
    where: { id: eintragId },
    select: {
      id: true,
      firstName: true,
      email: true,
      token: true,
      invitedUntil: true,
      status: true,
    },
  });

  if (!eintrag || eintrag.status !== "EINGELADEN" || !eintrag.token) {
    return { erfolg: false, grund: "Für diesen Eintrag gibt es keine offene Einladung." };
  }
  if (!eintrag.invitedUntil || eintrag.invitedUntil <= new Date()) {
    return {
      erfolg: false,
      grund:
        "Die Frist ist abgelaufen. Der Platz gehört wieder allen; lade die nächste Person ein.",
    };
  }

  await einladungVerschicken({
    id: eintrag.id,
    firstName: eintrag.firstName,
    email: eintrag.email,
    token: eintrag.token,
    invitedUntil: eintrag.invitedUntil,
  });
  return { erfolg: true };
}

/**
 * Streichen statt loeschen, wie beim Stornieren einer Buchung.
 *
 * Die Zeile bleibt stehen: sie ist der Beleg dafuer, dass jemand gewartet hat.
 * War die Person eingeladen, wird der reservierte Platz damit frei — das
 * Einladen der naechsten bleibt aber eine bewusste Handlung und passiert nicht
 * nebenbei beim Streichen.
 */
export async function wartendenEntfernen(eintragId: string): Promise<void> {
  await prisma.waitlistEntry.update({
    where: { id: eintragId },
    data: { status: "ENTFERNT", token: null, invitedUntil: null },
  });
}
