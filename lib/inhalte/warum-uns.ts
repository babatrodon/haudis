/**
 * "Warum uns wählen?" fuer die Startseite, aus PLAN.md Abschnitt 5.
 *
 * Die Oeffnungszeiten sind bewusst als Verkaufsargument dabei: die alte Seite
 * hat sie nie gezeigt, dabei sind Montag bis Samstag von 07:00 bis 21:00 fuer
 * Berufstaetige und Schuelerinnen genau das Argument.
 *
 * Der Zeitentext wird zur Laufzeit aus den Einstellungen eingesetzt, damit er
 * nicht doppelt gepflegt werden muss.
 */

export type Vorteil = {
  titel: string;
  text: string;
  /** Platzhalter, den die Seite durch die Oeffnungszeiten ersetzt. */
  zeitenPlatzhalter?: boolean;
};

export const VORTEILE: Vorteil[] = [
  {
    titel: "Sechs Tage die Woche für Dich da",
    text: "{{zeiten}} Früh vor der Arbeit, spät nach der Schule oder am Samstag: wir finden einen Termin, der in Deinen Alltag passt.",
    zeitenPlatzhalter: true,
  },
  {
    titel: "Schritt für Schritt statt Druck",
    text: "Wir gehen in Deinem Tempo vor und bauen auf dem auf, was Du schon kannst. Geduldige, persönliche Betreuung von der ersten Lektion bis zur Prüfung.",
  },
  {
    titel: "Moderne Fahrzeuge mit Doppelsteuerung",
    text: "Unsere Ausbildungsfahrzeuge sind aktuell gewartet und haben eine Doppelsteuerung. Du sitzt vom ersten Moment an sicher am Steuer.",
  },
  {
    titel: "Fahrlehrer in fünf Sprachen",
    text: "Deutsch, Italienisch, Spanisch, Englisch und Französisch. Du lernst in der Sprache, in der Du am besten denkst.",
  },
  {
    titel: "Abos und Familienrabatt",
    text: "Mit dem 5er- oder 10er-Abo sinkt der Preis pro Lektion. Für Geschwister und Familien gibt es zusätzlich einen Rabatt.",
  },
  {
    titel: "350 m vom Bahnhof Baden",
    text: "Unser Schulungsraum an der Haselstrasse 33 ist zu Fuss in fünf Minuten vom Bahnhof erreichbar. Kein Umweg, kein Parkplatzsuchen.",
  },
];
