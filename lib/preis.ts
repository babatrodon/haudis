import { Decimal } from "@/lib/decimal";

/**
 * Preisberechnung fuer Kursbuchungen.
 *
 * Geschaeftsregel 3 aus PLAN.md (Kundenentscheid 26.07.2026):
 * Frühbucherrabatt von 10 % auf den Gesamtbetrag inklusive Lehrmittel, fuer die
 * ersten 5 Anmeldungen eines Kurses. Mengenbasiert wie im Altsystem, nicht
 * datumsbasiert. Beispiel VKU: 140 + 30 = 170, minus 10 % = 153.00.
 *
 * Diese Datei ist die einzige Stelle, an der ein Buchungspreis entsteht. Sprint 3
 * schreibt das Ergebnis nach Booking.priceCharged, Sprint 5 rechnet die
 * Abrechnung daraus. Zwei Implementierungen derselben Regel wuerden frueher oder
 * spaeter auseinanderlaufen.
 *
 * Gerechnet wird ausschliesslich mit Decimal. Number kommt hier nicht vor, siehe
 * die Warnung im Kopf von lib/format.ts.
 */

/** Kaufmaennische Rundung, halbe Rappen werden aufgerundet. */
const AUFRUNDEN = Decimal.ROUND_HALF_UP;

/**
 * In der Schweiz ist die kleinste Muenze 5 Rappen. Ein Betrag wie 153.27 laesst
 * sich bar nicht bezahlen, und der Betrag wird bar am ersten Kurstag faellig.
 *
 * Trick: auf Zwanzigstel runden. 20 Zwanzigstel eines Frankens sind genau die
 * 5-Rappen-Schritte.
 */
export function aufFuenfRappen(betrag: Decimal): Decimal {
  return betrag.mul(20).toDecimalPlaces(0, AUFRUNDEN).div(20);
}

export type KursPreisDaten = {
  price: Decimal;
  materialPrice: Decimal;
  earlyBirdPercent: Decimal | null;
  earlyBirdSlots: number | null;
};

export type PreisErgebnis = {
  /** Kursgebuehr ohne Lehrmittel. */
  kursgebuehr: Decimal;
  /** Lehrmittel, bei BTU zum Beispiel 0. */
  lehrmittel: Decimal;
  /** Summe vor Rabatt. */
  regulaer: Decimal;
  /** Abgezogener Betrag, 0 wenn kein Rabatt greift. */
  rabatt: Decimal;
  /** Tatsaechlich zu zahlen. Gehoert nach Booking.priceCharged. */
  total: Decimal;
  /** Ob diese Buchung den Frühbucherrabatt bekommt. */
  fruehbucher: boolean;
};

/**
 * Berechnet den Preis fuer die naechste Buchung eines Kurses.
 *
 * bisherigeBuchungen zaehlt die bereits bestaetigten Anmeldungen. Die Buchung
 * Nummer 6 bekommt bei 5 Plaetzen keinen Rabatt mehr, dann zeigt die Kursseite
 * "Frühbucherrabatte ausgeschoepft".
 */
export function preisBerechnen(
  kurs: KursPreisDaten,
  bisherigeBuchungen: number,
): PreisErgebnis {
  const kursgebuehr = new Decimal(kurs.price);
  const lehrmittel = new Decimal(kurs.materialPrice);
  const regulaer = kursgebuehr.plus(lehrmittel);

  if (!fruehbucherMoeglich(kurs, bisherigeBuchungen)) {
    return {
      kursgebuehr,
      lehrmittel,
      regulaer,
      rabatt: new Decimal(0),
      total: regulaer,
      fruehbucher: false,
    };
  }

  const prozent = new Decimal(kurs.earlyBirdPercent as Decimal);
  const total = aufFuenfRappen(
    regulaer.mul(new Decimal(100).minus(prozent)).div(100),
  );

  return {
    kursgebuehr,
    lehrmittel,
    regulaer,
    rabatt: regulaer.minus(total),
    total,
    fruehbucher: true,
  };
}

/**
 * Ob die naechste Buchung noch einen Frühbucherplatz bekommt.
 * Beides muss gesetzt sein: ohne Prozentsatz oder ohne Plaetze gibt es keinen
 * Rabatt, ein halb konfigurierter Kurs rechnet nichts ab.
 */
export function fruehbucherMoeglich(
  kurs: Pick<KursPreisDaten, "earlyBirdPercent" | "earlyBirdSlots">,
  bisherigeBuchungen: number,
): boolean {
  if (kurs.earlyBirdPercent === null || kurs.earlyBirdSlots === null) {
    return false;
  }
  if (kurs.earlyBirdSlots <= 0 || new Decimal(kurs.earlyBirdPercent).lte(0)) {
    return false;
  }
  return bisherigeBuchungen < kurs.earlyBirdSlots;
}

/** Verbleibende Frühbucherplaetze, fuer das Badge auf der Kursseite. */
export function fruehbucherPlaetzeFrei(
  kurs: Pick<KursPreisDaten, "earlyBirdPercent" | "earlyBirdSlots">,
  bisherigeBuchungen: number,
): number {
  if (kurs.earlyBirdPercent === null || kurs.earlyBirdSlots === null) {
    return 0;
  }
  return Math.max(0, kurs.earlyBirdSlots - bisherigeBuchungen);
}
