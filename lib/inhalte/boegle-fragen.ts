/**
 * Zwanzig Uebungsfragen fuer das Boegle-Quiz.
 *
 * WICHTIG: Das sind eigene Formulierungen, keine Originalfragen der
 * Theoriepruefung. Die offiziellen Fragen der asa sind lizenziert und werden
 * hier weder abgebildet noch nachgebaut (PLAN.md Abschnitt 5).
 *
 * Die Fragen decken Regeln ab, die im Boegle ohnehin besprochen werden:
 * Geschwindigkeiten, Vortritt, Alkohol, Ausweise und Verhalten im Verkehr.
 * Alle Angaben sind auf dem Stand nach der Revision vom 1. Januar 2021.
 *
 * Vor dem Launch fachlich von Ausilia gegenlesen lassen.
 */

export type QuizFrage = {
  frage: string;
  antworten: string[];
  /** Index der richtigen Antwort in "antworten". */
  richtig: number;
  erklaerung: string;
};

export const BOEGLE_FRAGEN: QuizFrage[] = [
  {
    frage: "Wie schnell darfst Du innerorts höchstens fahren, wenn kein Signal etwas anderes sagt?",
    antworten: ["50 km/h", "60 km/h", "40 km/h"],
    richtig: 0,
    erklaerung:
      "Innerorts gilt generell 50 km/h. Tempo-30-Zonen und Begegnungszonen sind signalisiert.",
  },
  {
    frage: "Welche Höchstgeschwindigkeit gilt ausserorts auf einer normalen Hauptstrasse?",
    antworten: ["100 km/h", "80 km/h", "70 km/h"],
    richtig: 1,
    erklaerung: "Ausserorts sind es 80 km/h, sofern nichts anderes signalisiert ist.",
  },
  {
    frage: "Wie schnell darfst Du auf der Autobahn höchstens fahren?",
    antworten: ["130 km/h", "100 km/h", "120 km/h"],
    richtig: 2,
    erklaerung:
      "Auf der Autobahn gilt 120 km/h, auf der Autostrasse 100 km/h.",
  },
  {
    frage: "Wie hoch ist die allgemeine Promillegrenze in der Schweiz?",
    antworten: ["0,5 Promille", "0,8 Promille", "0,3 Promille"],
    richtig: 0,
    erklaerung:
      "Ab 0,5 Promille giltst Du als fahrunfähig. Für einzelne Gruppen gelten strengere Werte.",
  },
  {
    frage: "Welcher Alkoholwert gilt für Fahrerinnen und Fahrer mit Führerausweis auf Probe?",
    antworten: [
      "Derselbe wie für alle, 0,5 Promille",
      "Nulltoleranz, praktisch 0,1 Promille",
      "0,3 Promille",
    ],
    richtig: 1,
    erklaerung:
      "In der Probezeit gilt das Alkoholverbot. Auch für Fahrlehrer, Berufschauffeure und Begleitpersonen.",
  },
  {
    frage: "Wie lange dauert die Probezeit nach der bestandenen praktischen Prüfung?",
    antworten: ["Ein Jahr", "Zwei Jahre", "Drei Jahre"],
    richtig: 2,
    erklaerung:
      "Der Führerausweis auf Probe gilt drei Jahre. Danach folgt der definitive Ausweis.",
  },
  {
    frage: "Innert welcher Frist muss der WAB-Kurs absolviert sein?",
    antworten: [
      "Innert zwölf Monaten nach der praktischen Prüfung",
      "Innert drei Jahren",
      "Vor der praktischen Prüfung",
    ],
    richtig: 0,
    erklaerung:
      "Der WAB-Kurs ist obligatorisch und Voraussetzung für den definitiven Führerausweis.",
  },
  {
    frage: "Wer hat im Kreisel Vortritt?",
    antworten: [
      "Wer einfährt",
      "Wer sich bereits im Kreisel befindet",
      "Wer von rechts kommt",
    ],
    richtig: 1,
    erklaerung:
      "Beim Einfahren in den Kreisel musst Du den Fahrzeugen im Kreisel den Vortritt lassen.",
  },
  {
    frage: "Zwei gleichwertige Strassen kreuzen sich, es steht kein Signal. Wer hat Vortritt?",
    antworten: [
      "Wer von rechts kommt",
      "Wer von links kommt",
      "Wer zuerst da war",
    ],
    richtig: 0,
    erklaerung:
      "Es gilt der Rechtsvortritt, solange kein Signal oder keine Markierung etwas anderes regelt.",
  },
  {
    frage: "Ab welchem Alter kannst Du den Lernfahrausweis der Kategorie B lösen?",
    antworten: ["Ab 16 Jahren", "Ab 17 Jahren", "Ab 18 Jahren"],
    richtig: 1,
    erklaerung:
      "Seit 2021 ab 17 Jahren. Die praktische Prüfung darfst Du erst ab 18 ablegen.",
  },
  {
    frage: "Welche Anforderungen muss die Begleitperson bei einer Lernfahrt erfüllen?",
    antworten: [
      "Mindestens 20 Jahre alt und seit einem Jahr im Besitz des Ausweises",
      "Mindestens 23 Jahre alt, seit drei Jahren Kategorie B und nicht mehr in der Probezeit",
      "Nur ein gültiger Führerausweis, sonst nichts",
    ],
    richtig: 1,
    erklaerung:
      "Alle drei Bedingungen müssen erfüllt sein. Sonst ist die Fahrt nicht zulässig.",
  },
  {
    frage: "Was gehört bei jeder Lernfahrt ans Fahrzeug?",
    antworten: [
      "Das blaue L-Schild hinten",
      "Ein Warndreieck auf dem Dach",
      "Nichts Besonderes",
    ],
    richtig: 0,
    erklaerung:
      "Das L-Schild macht die anderen Verkehrsteilnehmenden auf die Lernfahrt aufmerksam.",
  },
  {
    frage: "Wie lange ist der Lernfahrausweis der Kategorie B gültig?",
    antworten: ["12 Monate", "24 Monate", "Unbefristet"],
    richtig: 1,
    erklaerung:
      "24 Monate. Die bestandene Theorieprüfung dagegen verfällt seit 2021 nicht mehr.",
  },
  {
    frage: "Welche Faustregel hilft Dir beim Abstand zum vorderen Fahrzeug?",
    antworten: [
      "Ein Sekunde reicht immer",
      "Mindestens zwei Sekunden, bei schlechten Verhältnissen mehr",
      "Zwei Fahrzeuglängen genügen",
    ],
    richtig: 1,
    erklaerung:
      "Die Zwei-Sekunden-Regel funktioniert bei jedem Tempo. Bei Nässe, Nebel oder Schnee verdoppelst Du sie.",
  },
  {
    frage: "Darfst Du während der Fahrt das Mobiltelefon in der Hand halten?",
    antworten: [
      "Nein, nur mit Freisprecheinrichtung",
      "Ja, wenn Du langsam fährst",
      "Ja, an der roten Ampel",
    ],
    richtig: 0,
    erklaerung:
      "Das Telefon in der Hand ist während der Fahrt verboten. Auch kurzes Tippen im Stau zählt dazu.",
  },
  {
    frage: "Wann musst Du am Tag mit Licht fahren?",
    antworten: [
      "Nur bei Regen oder Nebel",
      "Immer, Tagfahrlicht ist obligatorisch",
      "Nur ausserorts",
    ],
    richtig: 1,
    erklaerung:
      "Seit 2014 gilt in der Schweiz die Lichtpflicht am Tag für alle Motorfahrzeuge.",
  },
  {
    frage: "Was machst Du auf der Autobahn, wenn der Verkehr stockt?",
    antworten: [
      "Möglichst weit rechts fahren",
      "Zwischen der linken und der benachbarten Spur eine Rettungsgasse bilden",
      "Den Pannenstreifen frei lassen und sonst nichts",
    ],
    richtig: 1,
    erklaerung:
      "Die Rettungsgasse entsteht zwischen der äussersten linken Spur und der Spur daneben. Sofort, nicht erst wenn das Blaulicht kommt.",
  },
  {
    frage: "Aus wie vielen Fragen besteht die Basis-Theorieprüfung?",
    antworten: ["30 Fragen", "50 Fragen", "80 Fragen"],
    richtig: 1,
    erklaerung:
      "50 Fragen mit je drei Antwortmöglichkeiten, zu lösen in 45 Minuten.",
  },
  {
    frage: "Ein Tram und Du wollen gleichzeitig in dieselbe Lücke. Wer fährt zuerst?",
    antworten: [
      "Das Tram, es hat grundsätzlich Vortritt",
      "Wer von rechts kommt",
      "Das schnellere Fahrzeug",
    ],
    richtig: 0,
    erklaerung:
      "Schienenfahrzeuge haben Vortritt, auch von links. Sie können nicht ausweichen.",
  },
  {
    frage: "Du parkierst in einer blauen Zone. Was brauchst Du?",
    antworten: [
      "Nichts, blaue Zonen sind gratis und unbeschränkt",
      "Eine Parkscheibe, korrekt eingestellt",
      "Ein Ticket am Automaten",
    ],
    richtig: 1,
    erklaerung:
      "In der blauen Zone gilt die Parkscheibe. Die Uhrzeit rundest Du auf die nächste halbe Stunde auf.",
  },
];
