import { EXTERNE_LINKS } from "@/lib/inhalte/links";

/**
 * Rechtliche Grundlagen fuer /vorschriften/auto und /vorschriften/motorrad.
 *
 * Alle Angaben am 26.07.2026 gegen ag.ch, ch.ch und bfu.ch geprueft und auf
 * dem Stand nach der Revision vom 1. Januar 2021. Die alten haudi.ch-Seiten
 * beschrieben diese Aenderungen noch als "neu", das ist hier bereinigt.
 *
 * Wer hier etwas aendert, prueft die Quelle nach und passt das Datum an.
 * Eine falsche Rechtsangabe auf der Seite einer Fahrschule ist teuer.
 */

export const VORSCHRIFTEN_GEPRUEFT_AM = "26.07.2026";

export type Regel = {
  titel: string;
  text: string;
};

export type Vorschriftenseite = {
  titel: string;
  einleitung: string;
  abschnitte: { ueberschrift: string; regeln: Regel[] }[];
  quellen: { text: string; href: string }[];
};

export const VORSCHRIFTEN_AUTO: Vorschriftenseite = {
  titel: "Vorschriften Auto",
  einleitung:
    "Das Wichtigste zur Kategorie B auf einen Blick: was Du für den Lernfahrausweis brauchst, wer Dich begleiten darf und was nach der Prüfung gilt. Massgebend ist immer die Auskunft des Strassenverkehrsamts.",
  abschnitte: [
    {
      ueberschrift: "Lernfahrausweis",
      regeln: [
        {
          titel: "Ab 17 Jahren",
          text: "Den Lernfahrausweis der Kategorie B bekommst Du ab dem 17. Geburtstag. Voraussetzung sind der Nothelferkurs, der Sehtest und die bestandene Theorieprüfung.",
        },
        {
          titel: "24 Monate gültig",
          text: "Der Lernfahrausweis gilt 24 Monate. In dieser Zeit solltest Du die praktische Prüfung ablegen.",
        },
        {
          titel: "Lernphase von zwölf Monaten",
          text: "Wer den Lernfahrausweis vor dem 20. Geburtstag erhält, muss ihn mindestens zwölf Monate besitzen, bevor er zur praktischen Prüfung zugelassen wird. Ab dem 20. Geburtstag entfällt diese Wartefrist.",
        },
        {
          titel: "Praktische Prüfung ab 18",
          text: "Antreten darfst Du frühestens am 18. Geburtstag, unabhängig davon, wann Du den Lernfahrausweis gelöst hast.",
        },
      ],
    },
    {
      ueberschrift: "Lernfahrten mit Begleitperson",
      regeln: [
        {
          titel: "Anforderungen an die Begleitperson",
          text: "Die Begleitperson muss mindestens 23 Jahre alt sein, den Führerausweis der Kategorie B seit mindestens drei Jahren besitzen und darf sich nicht mehr in der Probezeit befinden.",
        },
        {
          titel: "L-Schild",
          text: "Bei jeder Lernfahrt gehört das blaue L-Schild gut sichtbar ans Heck des Fahrzeugs.",
        },
        {
          titel: "Platz der Begleitperson",
          text: "Die Begleitperson sitzt auf dem Beifahrersitz und muss jederzeit eingreifen können.",
        },
      ],
    },
    {
      ueberschrift: "Nach der Prüfung",
      regeln: [
        {
          titel: "Führerausweis auf Probe, drei Jahre",
          text: "Nach bestandener praktischer Prüfung erhältst Du den Führerausweis auf Probe. Die Probezeit dauert drei Jahre.",
        },
        {
          titel: "WAB-Kurs innert zwölf Monaten",
          text: "Innerhalb von zwölf Monaten nach der praktischen Prüfung absolvierst Du den obligatorischen WAB-Kurs. Er ist Voraussetzung für den definitiven Führerausweis.",
        },
        {
          titel: "Theorie und VKU bleiben gültig",
          text: "Die bestandene Theorieprüfung und der Verkehrskundeunterricht verfallen nicht mehr. Beides gilt unbefristet.",
        },
      ],
    },
  ],
  quellen: [
    { text: "ch.ch: Autofahren lernen", href: EXTERNE_LINKS.chFuehrerausweis },
    {
      text: "ch.ch: Führerausweis auf Probe",
      href: EXTERNE_LINKS.chProbefuehrerausweis,
    },
    {
      text: "Strassenverkehrsamt Aargau",
      href: EXTERNE_LINKS.strassenverkehrsamtAargau,
    },
  ],
};

export const VORSCHRIFTEN_MOTORRAD: Vorschriftenseite = {
  titel: "Vorschriften Motorrad",
  einleitung:
    "Welche Kategorie passt zu Dir, ab wann Du fahren darfst und warum der Grundkurs so wichtig ist. Die Angaben gelten seit der Revision vom 1. Januar 2021.",
  abschnitte: [
    {
      ueberschrift: "Die Kategorien",
      regeln: [
        {
          titel: "Kategorie A1, ab 16 Jahren",
          text: "Die 125er-Klasse. Seit dem 1. Januar 2021 gilt das Mindestalter 16 statt 18 Jahre.",
        },
        {
          titel: "Kategorie A beschränkt auf 35 kW, ab 18 Jahren",
          text: "Motorräder bis 35 kW Leistung. Der Einstieg für alle, die mit 18 auf ein grösseres Motorrad wollen.",
        },
        {
          titel: "Kategorie A unbeschränkt",
          text: "Ohne Leistungsbegrenzung. Entweder ab 25 Jahren oder nach zwei Jahren Fahrpraxis mit der Kategorie A beschränkt auf 35 kW.",
        },
      ],
    },
    {
      ueberschrift: "Der Grundkurs",
      regeln: [
        {
          titel: "Zwölf Stunden, nur einmal",
          text: "Die praktische Grundschulung dauert zwölf Stunden, aufgeteilt in drei Teile zu je vier Stunden an verschiedenen Tagen. Wer sie einmal absolviert hat, muss sie für eine weitere Kategorie nicht wiederholen.",
        },
        {
          titel: "Obligatorisch vor der praktischen Prüfung",
          text: "Ohne absolvierten Grundkurs wirst Du nicht zur praktischen Prüfung zugelassen.",
        },
        {
          titel: "Kein Lernfahrausweis für die Anmeldung nötig",
          text: "Zur Anmeldung bei uns brauchst Du den Lernfahrausweis noch nicht. Für den Kurs selbst und für Fahrten im Verkehr brauchst Du ihn.",
        },
      ],
    },
    {
      ueberschrift: "Lernfahrausweis Motorrad",
      regeln: [
        {
          titel: "Vier Monate, danach zwölf",
          text: "Der Lernfahrausweis für die Motorradkategorien gilt zunächst vier Monate. Nach dem besuchten Grundkurs verlängert er sich um zwölf Monate.",
        },
        {
          titel: "Fahren ohne Begleitung",
          text: "Anders als beim Auto darfst Du mit dem Lernfahrausweis alleine fahren, allerdings ohne Mitfahrer und nicht auf Autobahnen und Autostrassen.",
        },
      ],
    },
  ],
  quellen: [
    { text: "BFU: Führerausweis Kategorie A1", href: EXTERNE_LINKS.bfuKategorieA1 },
    { text: "ch.ch: Autofahren lernen", href: EXTERNE_LINKS.chFuehrerausweis },
    {
      text: "Strassenverkehrsamt Aargau",
      href: EXTERNE_LINKS.strassenverkehrsamtAargau,
    },
  ],
};
