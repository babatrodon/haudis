/**
 * Vorlagen fuer neue Kurse: Terminmuster (PLAN.md Abschnitt 6.2) und die
 * Fruehbucher-Vorbelegung.
 *
 * Alles hier laeuft auch im Browser. Deshalb keine Importe aus lib/preis.ts
 * oder lib/db.ts — beide ziehen ueber Decimal den Prisma-Client mit, und der
 * gehoert nicht ins Browser-Bundle.
 *
 * Der Versatz zaehlt Tage ab dem gewaehlten ersten Kurstag. Ein VKU beginnt
 * typischerweise an einem Dienstag und laeuft am Mittwoch weiter, also 0, 0,
 * 1, 1. Damit muss Ausilia nur ein Datum waehlen statt vier.
 *
 * Bewusst nur dort ein Muster, wo PLAN.md die Zeiten wirklich nennt. Fuer den
 * Nothelfer-Abendkurs und die Motorrad-Grundkurse sind keine Zeiten
 * dokumentiert; dort erfundene Vorschlaege waeren schlimmer als keine, weil
 * ein falscher Vorschlag unbemerkt uebernommen wird.
 */

/**
 * Fruehbucherrabatt fuer einen neuen Kurs, Kundenentscheid 26.07.2026: 10 %
 * fuer die ersten 5 Anmeldungen. Die Regel selbst steht in lib/preis.ts.
 *
 * Als Zeichenkette, weil der Wert direkt in ein Formularfeld geht und von dort
 * unveraendert zu Prisma weiterwandert.
 */
export const FRUEHBUCHER_STANDARD = { prozent: "10", plaetze: "5" } as const;

export type MusterBlock = {
  /** Tage ab dem ersten Kurstag. */
  versatz: number;
  von: string;
  bis: string;
};

export type Kursmuster = {
  id: string;
  name: string;
  /** Passt zu dieser Kursart, leer heisst: fuer alle waehlbar. */
  kursartCode: string;
  /** Kurzer Hinweis, welcher Wochentag gemeint ist. */
  hinweis: string;
  bloecke: MusterBlock[];
};

export const KURSMUSTER: Kursmuster[] = [
  {
    id: "vku-standard-18",
    kursartCode: "VKU",
    name: "Standard, 18 bis 22 Uhr",
    hinweis: "Zwei Abende, üblicherweise Dienstag und Mittwoch",
    bloecke: [
      { versatz: 0, von: "18:00", bis: "20:00" },
      { versatz: 0, von: "20:00", bis: "22:00" },
      { versatz: 1, von: "18:00", bis: "20:00" },
      { versatz: 1, von: "20:00", bis: "22:00" },
    ],
  },
  {
    id: "vku-standard-1745",
    kursartCode: "VKU",
    name: "Standard, 17.45 bis 21.45 Uhr",
    hinweis: "Zwei Abende, früherer Beginn",
    bloecke: [
      { versatz: 0, von: "17:45", bis: "19:45" },
      { versatz: 0, von: "19:45", bis: "21:45" },
      { versatz: 1, von: "17:45", bis: "19:45" },
      { versatz: 1, von: "19:45", bis: "21:45" },
    ],
  },
  {
    id: "vku-weekend",
    kursartCode: "VKU",
    name: "Weekend, Freitag und Samstag",
    hinweis: "Fr abends, Sa vormittags",
    bloecke: [
      { versatz: 0, von: "18:00", bis: "20:00" },
      { versatz: 0, von: "20:00", bis: "22:00" },
      { versatz: 1, von: "08:30", bis: "10:30" },
      { versatz: 1, von: "10:30", bis: "12:30" },
    ],
  },
  {
    id: "nhi-intensiv",
    kursartCode: "NHI",
    name: "Intensiv, Freitag und Samstag",
    hinweis: "Fr abends, Sa ganztags",
    bloecke: [
      { versatz: 0, von: "19:00", bis: "22:00" },
      { versatz: 1, von: "09:00", bis: "12:00" },
      { versatz: 1, von: "13:00", bis: "17:00" },
    ],
  },
  {
    id: "btu-di-mi",
    kursartCode: "BTU",
    name: "Dienstag und Mittwoch, 19 bis 21 Uhr",
    hinweis: "Zwei Abende",
    bloecke: [
      { versatz: 0, von: "19:00", bis: "21:00" },
      { versatz: 1, von: "19:00", bis: "21:00" },
    ],
  },
];

export function musterFuerKursart(kursartCode: string): Kursmuster[] {
  return KURSMUSTER.filter((muster) => muster.kursartCode === kursartCode);
}

/**
 * Rechnen mit "2026-08-04".
 *
 * Bewusst als Zeichenkette statt ueber Date: das Formular liefert und erwartet
 * dieses Format, und Date wuerde beim Hin- und Herwandeln die Zeitzone des
 * Browsers ins Spiel bringen. Ein Kurstag ist ein Kalendertag, keine Uhrzeit.
 */
export function tageVerschieben(iso: string, tage: number): string {
  const [jahr, monat, tag] = iso.split("-").map(Number);
  const verschoben = new Date(Date.UTC(jahr, monat - 1, tag + tage));
  return verschoben.toISOString().slice(0, 10);
}

/** Abstand in ganzen Tagen, negativ wenn "bis" vor "von" liegt. */
export function tageZwischen(von: string, bis: string): number {
  const alsZahl = (iso: string) => {
    const [jahr, monat, tag] = iso.split("-").map(Number);
    return Date.UTC(jahr, monat - 1, tag);
  };
  return Math.round((alsZahl(bis) - alsZahl(von)) / 86_400_000);
}

/** "18:00" plus zwei Stunden. Ueber Mitternacht hinaus bleibt es bei 23:59. */
export function stundenPlus(zeit: string, stunden: number): string {
  const [h, m] = zeit.split(":").map(Number);
  const minuten = h * 60 + m + stunden * 60;
  if (minuten >= 24 * 60) return "23:59";
  return `${String(Math.floor(minuten / 60)).padStart(2, "0")}:${String(minuten % 60).padStart(2, "0")}`;
}

export type Terminvorschlag = { datum: string; von: string; bis: string };

/** Muster plus erster Kurstag ergibt die vorgeschlagenen Bloecke. */
export function termineAusMuster(
  muster: Kursmuster,
  erstesDatum: string,
): Terminvorschlag[] {
  return muster.bloecke.map((block) => ({
    datum: tageVerschieben(erstesDatum, block.versatz),
    von: block.von,
    bis: block.bis,
  }));
}
