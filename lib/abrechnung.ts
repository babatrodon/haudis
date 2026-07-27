import "server-only";
import { prisma } from "@/lib/db";
import { Decimal } from "@/lib/decimal";
import { zuercherMitternacht } from "@/lib/admin/zeitraum";

/**
 * Abrechnung und Accounting, PLAN.md Abschnitt 6 Punkte 5 und 6.
 *
 * Das Erfolgskriterium des Sprints ist ungewoehnlich scharf: der
 * Provisionsreport muss mit dem uebereinstimmen, was Ausilia von Hand rechnet.
 * Sie tut das seit Jahren und wird die ersten Monate gegenpruefen. Daraus
 * folgt, wie diese Datei gebaut ist:
 *
 *   Jede Zahl traegt ihre Herkunft mit. Das Ergebnis enthaelt nicht nur die
 *   Provisionssumme, sondern die Rechnung dahinter: wie viele Anmeldungen zu
 *   welchem Satz. Eine Zahl, die man nicht nachrechnen kann, ist im Zweifel
 *   falsch.
 *
 *   Gerechnet wird ausschliesslich mit Decimal, von der Datenbank bis zum
 *   letzten Renderschritt. Der Kopf von lib/format.ts erklaert, warum: eine
 *   Provisionssumme, die um Rappen abweicht, kostet mehr Vertrauen als ein
 *   fehlendes Feature.
 *
 *   Stornierte Anmeldungen zaehlen nie. Was wegfaellt, wird gezaehlt und
 *   ausgewiesen, damit eine niedrige Zahl eine Erklaerung hat.
 *
 * Dieselbe Datei bedient die Abrechnung im Panel, das Accounting und "Meine
 * Provisionen" im Portal. Zwei Implementierungen derselben Regel laufen
 * frueher oder spaeter auseinander.
 */

/**
 * Nach welchem Datum der Zeitraum eingegrenzt wird.
 *
 * Ein im Januar gebuchter Maerzkurs steht in der einen Sicht im Januar, in der
 * anderen im Maerz. Beide sind richtig, deshalb steht die gewaehlte Basis auf
 * jedem Ausdruck.
 */
export type Basis = "anmeldung" | "kurs";

/**
 * Kundenentscheid 27.07.2026: abgerechnet wird nach dem Kursdatum.
 *
 * Das Geld fliesst bar am ersten Kurstag, also faellt die Provision in denselben
 * Monat wie die Einnahme. Der Weg ueber das Anmeldedatum bleibt waehlbar; wer
 * ihn nimmt, sieht das auf dem Ausdruck.
 */
export const BASIS_STANDARD: Basis = "kurs";

export const BASIS_TEXT: Record<Basis, string> = {
  anmeldung: "Anmeldedatum",
  kurs: "Kursdatum",
};

/**
 * Basis aus einem Suchparameter, mit dem Standard als Rueckfall.
 *
 * An einer Stelle, damit der Standard eine Entscheidung ist und nicht vier
 * gleichlautende Zeilen, die beim naechsten Wechsel auseinanderlaufen.
 */
export function basisAus(wert: string | undefined): Basis {
  return wert === "anmeldung" || wert === "kurs" ? wert : BASIS_STANDARD;
}

export type Zeitfenster = {
  von: Date;
  /** Exklusiv: der erste Moment NACH dem gewaehlten Zeitraum. */
  bis: Date;
  basis: Basis;
  /** Die gewaehlten Tage, wie sie im Formular und auf dem Ausdruck stehen. */
  vonTag: string;
  bisTag: string;
};

/**
 * Baut aus zwei Tagesangaben das Zeitfenster.
 *
 * Zwei Fallen stecken darin, und beide wuerden die Zahlen still verfaelschen:
 *
 *   Der gewaehlte Endtag ist einschliesslich gemeint. "01.08. bis 31.08."
 *   heisst inklusive des 31., also endet das Fenster erst am 1. September.
 *   Ohne den zusaetzlichen Tag fehlte jede Anmeldung des letzten Tages.
 *
 *   Die Grenzen liegen je nach Basis woanders. createdAt ist ein echter
 *   Zeitstempel und braucht Zuercher Mitternacht; CourseSession.date ist ein
 *   Kalenderdatum und braucht Mitternacht UTC. Die beiden zu verwechseln
 *   verschiebt die Grenze um zwei Stunden — im Sommer genau eine Nacht.
 */
export function zeitfensterAus(
  vonTag: string,
  bisTag: string,
  basis: Basis,
): Zeitfenster {
  const alsTag = (iso: string) => {
    const [jahr, monat, tag] = iso.split("-").map(Number);
    return new Date(Date.UTC(jahr, monat - 1, tag));
  };

  const von = alsTag(vonTag);
  const bis = alsTag(bisTag);
  bis.setUTCDate(bis.getUTCDate() + 1);

  return basis === "anmeldung"
    ? {
        von: zuercherMitternacht(von),
        bis: zuercherMitternacht(bis),
        basis,
        vonTag,
        bisTag,
      }
    : { von, bis, basis, vonTag, bisTag };
}

/** Erster und letzter Tag des laufenden Monats, als Vorbelegung. */
export function monatsVorgabe(jetzt = new Date()): {
  von: string;
  bis: string;
} {
  const jahr = jetzt.getUTCFullYear();
  const monat = jetzt.getUTCMonth();
  const alsWert = (tag: Date) => tag.toISOString().slice(0, 10);
  return {
    von: alsWert(new Date(Date.UTC(jahr, monat, 1))),
    bis: alsWert(new Date(Date.UTC(jahr, monat + 1, 0))),
  };
}

export type AbrechnungZeile = {
  buchungId: string;
  anrede: string;
  vorname: string;
  nachname: string;
  ort: string;
  angemeldetAm: Date;
  kursdatum: Date | null;
  kursId: string;
  betrag: Decimal;
  fruehbucher: boolean;
};

export type KursartGruppe = {
  code: string;
  name: string;
  zeilen: AbrechnungZeile[];
  anzahl: number;
  umsatz: Decimal;
};

/** Eine Zeile der Provisionsrechnung: "4 × CHF 50.00 = CHF 200.00". */
export type Provisionsposten = {
  satz: Decimal;
  anzahl: number;
  betrag: Decimal;
};

export type InstruktorBlock = {
  /** null steht fuer den Block "Ohne Zuweisung". */
  instruktorId: string | null;
  kuerzel: string;
  name: string;
  kursarten: KursartGruppe[];
  anzahl: number;
  umsatz: Decimal;
  /** Leer, wenn keine Provision anfaellt. */
  posten: Provisionsposten[];
  provision: Decimal;
};

export type Ausgeschlossen = {
  anzahl: number;
  umsatz: Decimal;
};

export type Abrechnung = {
  zeitfenster: Zeitfenster;
  bloecke: InstruktorBlock[];
  anzahl: number;
  umsatz: Decimal;
  provision: Decimal;
  /** Stornierte Anmeldungen im Zeitraum, damit die Zahl erklaerbar bleibt. */
  ausgeschlossen: Ausgeschlossen;
};

const NULL = () => new Decimal(0);

/**
 * Kurse, deren erster Termin im Zeitraum liegt.
 *
 * Prisma kann nicht nach dem fruehesten Termin einer Relation filtern, deshalb
 * erst holen, dann pruefen. Bei der Groessenordnung dieser Fahrschule ist das
 * nichts, und der Weg steht so schon in lib/admin/dashboard.ts.
 */
async function kursIdsImZeitraum(
  von: Date,
  bis: Date,
  auchAbgesagte = false,
): Promise<string[]> {
  const kandidaten = await prisma.course.findMany({
    where: {
      ...(auchAbgesagte ? {} : { status: { not: "CANCELLED" } }),
      sessions: { some: { date: { gte: von, lt: bis } } },
    },
    select: {
      id: true,
      sessions: { orderBy: { date: "asc" }, take: 1, select: { date: true } },
    },
  });

  return kandidaten
    .filter((kurs) => {
      const erster = kurs.sessions[0]?.date;
      return erster !== undefined && erster >= von && erster < bis;
    })
    .map((kurs) => kurs.id);
}

/**
 * Filter fuer den gewaehlten Zeitraum, je nach Basis.
 *
 * auchAbgesagte gilt nur fuer die Ausschlussliste: dort sollen auch die
 * Buchungen eines abgesagten Kurses auftauchen. Sie sind der haeufigste Grund
 * dafuer, dass ein Monat magerer ausfaellt als erwartet, und duerfen deshalb
 * nicht mit dem Kurs aus der Sicht verschwinden.
 */
async function zeitraumFilter(fenster: Zeitfenster, auchAbgesagte = false) {
  if (fenster.basis === "anmeldung") {
    return { createdAt: { gte: fenster.von, lt: fenster.bis } };
  }
  return {
    courseId: {
      in: await kursIdsImZeitraum(fenster.von, fenster.bis, auchAbgesagte),
    },
  };
}

const ABRECHNUNG_FELDER = {
  id: true,
  salutation: true,
  firstName: true,
  lastName: true,
  city: true,
  createdAt: true,
  priceCharged: true,
  earlyBird: true,
  commissionRate: true,
  referredBy: {
    select: { id: true, shortCode: true, firstName: true, lastName: true },
  },
  course: {
    select: {
      id: true,
      courseType: { select: { code: true, name: true, sortOrder: true } },
      sessions: { orderBy: { date: "asc" }, take: 1, select: { date: true } },
    },
  },
} as const;

/**
 * Die Abrechnung eines Zeitraums, gruppiert nach Fahrlehrer und Kursart.
 *
 * instruktorId schraenkt auf eine Person ein. Ohne Einschraenkung erscheinen
 * alle, samt einem Block "Ohne Zuweisung": die Summe der Bloecke ergibt dann
 * den Periodenumsatz, sonst saehe es aus, als fehle Geld.
 */
export async function abrechnungLesen(
  fenster: Zeitfenster,
  instruktorId?: string,
): Promise<Abrechnung> {
  const filter = await zeitraumFilter(fenster);

  const buchungen = await prisma.booking.findMany({
    where: {
      ...filter,
      status: "CONFIRMED",
      // Ein abgesagter Kurs hat nie stattgefunden und traegt weder Umsatz
      // noch Provision.
      course: { status: { not: "CANCELLED" } },
      ...(instruktorId ? { referredById: instruktorId } : {}),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: ABRECHNUNG_FELDER,
  });

  // Was im Zeitraum weggefallen ist. Ohne diese Zahl wirkt ein magerer Monat
  // wie ein Fehler im Report.
  const storniert = await prisma.booking.aggregate({
    _sum: { priceCharged: true },
    _count: true,
    where: {
      ...(await zeitraumFilter(fenster, true)),
      status: "CANCELLED",
      ...(instruktorId ? { referredById: instruktorId } : {}),
    },
  });

  const bloecke = new Map<string, InstruktorBlock>();
  const OHNE = "__ohne__";

  for (const buchung of buchungen) {
    const schluessel = buchung.referredBy?.id ?? OHNE;
    let block = bloecke.get(schluessel);

    if (!block) {
      block = {
        instruktorId: buchung.referredBy?.id ?? null,
        kuerzel: buchung.referredBy?.shortCode ?? "—",
        name: buchung.referredBy
          ? `${buchung.referredBy.lastName} ${buchung.referredBy.firstName}`
          : "Ohne Zuweisung",
        kursarten: [],
        anzahl: 0,
        umsatz: NULL(),
        posten: [],
        provision: NULL(),
      };
      bloecke.set(schluessel, block);
    }

    const art = buchung.course.courseType;
    let gruppe = block.kursarten.find((eintrag) => eintrag.code === art.code);
    if (!gruppe) {
      gruppe = {
        code: art.code,
        name: art.name,
        zeilen: [],
        anzahl: 0,
        umsatz: NULL(),
      };
      block.kursarten.push(gruppe);
    }

    gruppe.zeilen.push({
      buchungId: buchung.id,
      anrede: buchung.salutation,
      vorname: buchung.firstName,
      nachname: buchung.lastName,
      ort: buchung.city,
      angemeldetAm: buchung.createdAt,
      kursdatum: buchung.course.sessions[0]?.date ?? null,
      kursId: buchung.course.id,
      betrag: buchung.priceCharged,
      fruehbucher: buchung.earlyBird,
    });
    gruppe.anzahl += 1;
    gruppe.umsatz = gruppe.umsatz.plus(buchung.priceCharged);

    block.anzahl += 1;
    block.umsatz = block.umsatz.plus(buchung.priceCharged);

    // Provision nur, wo eine Zuweisung samt Satz vorliegt. Nach Satz
    // gebuendelt: sobald zwei verschiedene Saetze vorkommen, stehen zwei
    // Rechenzeilen da statt einer falschen Multiplikation.
    if (buchung.referredBy && buchung.commissionRate) {
      const satz = buchung.commissionRate;
      const posten = block.posten.find((eintrag) => eintrag.satz.eq(satz));
      if (posten) {
        posten.anzahl += 1;
        posten.betrag = satz.mul(posten.anzahl);
      } else {
        block.posten.push({ satz, anzahl: 1, betrag: satz });
      }
    }
  }

  for (const block of bloecke.values()) {
    block.kursarten.sort((a, b) => a.code.localeCompare(b.code));
    block.posten.sort((a, b) => b.satz.comparedTo(a.satz));
    block.provision = block.posten.reduce(
      (summe, posten) => summe.plus(posten.betrag),
      NULL(),
    );
  }

  const sortiert = [...bloecke.values()].sort((a, b) => {
    // "Ohne Zuweisung" ganz nach unten: es ist kein Fahrlehrer.
    if (a.instruktorId === null) return 1;
    if (b.instruktorId === null) return -1;
    return a.name.localeCompare(b.name, "de-CH");
  });

  return {
    zeitfenster: fenster,
    bloecke: sortiert,
    anzahl: sortiert.reduce((summe, block) => summe + block.anzahl, 0),
    umsatz: sortiert.reduce((summe, block) => summe.plus(block.umsatz), NULL()),
    provision: sortiert.reduce(
      (summe, block) => summe.plus(block.provision),
      NULL(),
    ),
    ausgeschlossen: {
      anzahl: storniert._count,
      umsatz: storniert._sum.priceCharged ?? NULL(),
    },
  };
}

export type AccountingKursart = {
  code: string;
  name: string;
  anzahl: number;
  umsatz: Decimal;
  /** Motorrad-Kurse werden im Altsystem getrennt ausgewiesen. */
  motorrad: boolean;
};

export type Accounting = {
  zeitfenster: Zeitfenster;
  kursarten: AccountingKursart[];
  anzahl: number;
  umsatz: Decimal;
  /** Total ohne die Motorrad-Grundkurse, wie im Altsystem. */
  umsatzOhneMotorrad: Decimal;
  anzahlOhneMotorrad: number;
  ausgeschlossen: Ausgeschlossen;
};

/** Kursart-Codes der Motorrad-Grundkurse. */
const MOTORRAD = "MOT_";

/**
 * Periodensummen pro Kursart.
 *
 * Rechnet auf denselben Buchungen wie die Abrechnung, nur anders gebuendelt.
 * Deshalb steht es hier und nicht in einer eigenen Datei: waeren es zwei
 * Abfragen mit zwei Filtern, koennten Umsatz und Accounting auseinanderlaufen,
 * und niemand wuesste, welche der beiden Zahlen stimmt.
 */
export async function accountingLesen(
  fenster: Zeitfenster,
): Promise<Accounting> {
  const abrechnung = await abrechnungLesen(fenster);

  const nachCode = new Map<string, AccountingKursart>();
  for (const block of abrechnung.bloecke) {
    for (const gruppe of block.kursarten) {
      const vorhanden = nachCode.get(gruppe.code);
      if (vorhanden) {
        vorhanden.anzahl += gruppe.anzahl;
        vorhanden.umsatz = vorhanden.umsatz.plus(gruppe.umsatz);
      } else {
        nachCode.set(gruppe.code, {
          code: gruppe.code,
          name: gruppe.name,
          anzahl: gruppe.anzahl,
          umsatz: gruppe.umsatz,
          motorrad: gruppe.code.startsWith(MOTORRAD),
        });
      }
    }
  }

  const kursarten = [...nachCode.values()].sort((a, b) =>
    a.code.localeCompare(b.code),
  );
  const ohneMotorrad = kursarten.filter((eintrag) => !eintrag.motorrad);

  return {
    zeitfenster: fenster,
    kursarten,
    anzahl: abrechnung.anzahl,
    umsatz: abrechnung.umsatz,
    umsatzOhneMotorrad: ohneMotorrad.reduce(
      (summe, eintrag) => summe.plus(eintrag.umsatz),
      NULL(),
    ),
    anzahlOhneMotorrad: ohneMotorrad.reduce(
      (summe, eintrag) => summe + eintrag.anzahl,
      0,
    ),
    ausgeschlossen: abrechnung.ausgeschlossen,
  };
}
