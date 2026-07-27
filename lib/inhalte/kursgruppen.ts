/**
 * Kursgruppen fuer die Filterleiste auf /kursdaten, nach
 * design/haudis-design.dc.html Screen 03.
 *
 * Die Vorlage filtert nach vier Begriffen: VKU, Nothelfer, BTU, Motorrad. Das
 * sind nicht unsere Kursart-Codes. Zu "Nothelfer" gehoeren zwei Kursarten (NHI
 * und NH), zu "Motorrad" drei. Wer einen Nothelferkurs sucht, denkt nicht in
 * "Intensiv" und "Abendkurs" — die Unterscheidung interessiert erst, wenn die
 * Termine dastehen.
 *
 * Nur Anzeige und Filter, keine Geschaeftsregel. Preise, Kapazitaet und
 * Buchbarkeit haengen weiterhin allein an der Kursart in der Datenbank.
 */

export type Kursgruppe = {
  /** Wert des Suchparameters, zum Beispiel /kursdaten?art=nothelfer */
  slug: string;
  /** Beschriftung auf dem Filterknopf. Kurz, die Leiste hat wenig Platz. */
  name: string;
  /** Kursart-Codes aus prisma/seed-data/kursarten.ts. */
  codes: string[];
};

export const KURSGRUPPEN: Kursgruppe[] = [
  { slug: "vku", name: "VKU", codes: ["VKU"] },
  { slug: "nothelfer", name: "Nothelfer", codes: ["NHI", "NH"] },
  { slug: "btu", name: "BTU", codes: ["BTU"] },
  { slug: "motorrad", name: "Motorrad", codes: ["MOT_A1_A", "MOT_A1", "MOT_A"] },
];

/**
 * Kurzer Zusatz hinter dem Gruppennamen, zum Beispiel
 * "VKU · 4 Lektionen à 2 Stunden".
 *
 * Steht hier und nicht in der Datenbank, weil es eine Sachangabe ueber die
 * Kursart ist und kein Wert, den Ausilia pflegt. Die lange Beschreibung in der
 * Kursart bleibt die Quelle fuer die Kursseiten; das hier ist die Kurzform fuer
 * eine Zeile in der Liste.
 *
 * Fehlt ein Code, steht nur der Gruppenname da. Eine neue Kursart bricht die
 * Seite also nicht, sie zeigt nur eine Zeile weniger.
 */
export const KURZHINWEIS: Record<string, string> = {
  VKU: "4 Lektionen à 2 Stunden",
  BTU: "inkl. Lehrmittel",
  NHI: "Ausweis 6 Jahre gültig",
  NH: "Ausweis 6 Jahre gültig",
  MOT_A1_A: "Kategorie A1 zu A",
  MOT_A1: "Kategorie A1",
  MOT_A: "Kategorie A",
};

export function gruppeFuerCode(code: string): Kursgruppe | undefined {
  return KURSGRUPPEN.find((gruppe) => gruppe.codes.includes(code));
}

/** "VKU · 4 Lektionen à 2 Stunden", oder nur "VKU" ohne hinterlegten Zusatz. */
export function kursartZeile(code: string): string {
  const gruppe = gruppeFuerCode(code);
  const hinweis = KURZHINWEIS[code];
  const kopf = gruppe?.name ?? code;
  return hinweis ? `${kopf} · ${hinweis}` : kopf;
}
