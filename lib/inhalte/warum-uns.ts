/**
 * "Warum uns wählen?" fuer die Startseite.
 *
 * Text und Reihenfolge stammen aus design/haudis-design.dc.html Screen 02.
 * Die Vorlage liefert hier fertige Copy, und wo sie das tut, gilt sie: PLAN.md
 * bestimmt die Regeln, die Vorlage alles Sichtbare.
 *
 * Sechs Zellen in einem Raster von drei Spalten. Das Symbol steht als Name
 * hier und wird erst in der Komponente aufgeloest, damit diese Datei ohne
 * Oberflaechen-Abhaengigkeit bleibt.
 */

export type Vorteil = {
  titel: string;
  text: string;
  symbol: "bahnhof" | "sprachen" | "dach" | "kategorien" | "familie" | "probe";
};

export const VORTEILE: Vorteil[] = [
  {
    titel: "350 m vom Bahnhof Baden",
    text: "Kurse und Theorie an der Haselstrasse 33. Du kommst mit dem Zug direkt hin.",
    symbol: "bahnhof",
  },
  {
    titel: "Fünf Unterrichtssprachen",
    text: "Deutsch, Italienisch, Spanisch, Englisch, Französisch – im Kurs und in der Fahrstunde.",
    symbol: "sprachen",
  },
  {
    titel: "Alles unter einem Dach",
    text: "Fahrstunden, VKU, Nothelfer, BTU und Bögle. Du musst nichts zusammensuchen.",
    symbol: "dach",
  },
  {
    titel: "Alle Kategorien",
    text: "Auto, Taxi, Motorrad, LKW und Anhänger BE.",
    symbol: "kategorien",
  },
  {
    titel: "Familienrabatt",
    text: "Für Geschwister und Eltern. Frag uns kurz per WhatsApp.",
    symbol: "familie",
  },
  {
    titel: "Gratis Probelektion",
    text: "Erste Lektion kostenlos. Termin per WhatsApp in zwei Minuten.",
    symbol: "probe",
  },
];
