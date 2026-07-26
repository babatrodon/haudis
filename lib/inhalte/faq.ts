/**
 * Haeufige Fragen fuer die Startseite, Fragen aus PLAN.md Abschnitt 5.
 *
 * Die Antworten sind neu redigiert, die Tippfehler der WordPress-Fassung
 * ("Fahrnterricht", "Lernen?A") bleiben draussen.
 *
 * Die rechtlichen Angaben sind am 26.07.2026 gegen ag.ch und ch.ch geprueft:
 * Lernfahrausweis ab 17, praktische Pruefung ab 18, Theoriepruefung und VKU
 * unbefristet gueltig, zwoelf Monate Lernphase bei Erwerb vor dem
 * 20. Geburtstag. Alles seit der Revision vom 1. Januar 2021.
 */

export type FaqEintrag = {
  frage: string;
  antwort: string;
};

export const FAQ: FaqEintrag[] = [
  {
    frage: "In welchen Sprachen wird der Fahrunterricht angeboten?",
    antwort:
      "Unsere Fahrlehrerinnen und Fahrlehrer unterrichten auf Deutsch, Italienisch, Spanisch, Englisch und Französisch. Sag uns bei der Anmeldung, welche Sprache Dir am liebsten ist, dann teilen wir Dich passend ein.",
  },
  {
    frage: "Gibt es Abos oder Rabatte?",
    antwort:
      "Ja. Beim 5er-Abo kostet die Lektion CHF 90.00 statt CHF 95.00, beim 10er-Abo CHF 88.00. Dazu kommt einmalig CHF 100.00 als Anteil an Versicherung und Administration. Für Geschwister und Familien haben wir einen Familienrabatt, frag uns einfach danach.",
  },
  {
    frage: "Wo finden die Fahrstunden statt?",
    antwort:
      "Wir sind in Baden und der ganzen Region unterwegs. Der Treffpunkt lässt sich absprechen, viele starten beim Bahnhof Baden oder bei unserem Schulungsraum an der Haselstrasse 33, nur 350 m vom Bahnhof entfernt.",
  },
  {
    // TODO Mit Ausilia klären, welche Fahrzeuge zur Verfügung stehen. Die
    // Antwort nennt bewusst keine Getriebeart und keine Prüfungsfolgen, weil
    // beides ungeprüft wäre.
    frage: "Fahre ich mit Schaltgetriebe oder Automat?",
    antwort:
      "Das besprechen wir in der Gratis-Probelektion. Wir schauen zusammen an, was zu Dir passt, und Du entscheidest danach. Ruf uns an, wenn Du es vorher schon wissen möchtest.",
  },
  {
    frage: "Ab welchem Alter kann ich mit dem Autofahren beginnen?",
    antwort:
      "Den Lernfahrausweis der Kategorie B bekommst Du ab 17 Jahren. Die praktische Prüfung darfst Du ab dem 18. Geburtstag ablegen. Fang früh genug mit dem Nothelferkurs und dem Gesuch an, das Strassenverkehrsamt braucht für die Bearbeitung vier bis sechs Wochen.",
  },
  {
    frage: "Wie lange ist die Theorieprüfung gültig?",
    antwort:
      "Unbefristet. Seit der Revision vom 1. Januar 2021 verfällt die bestandene Theorieprüfung nicht mehr, ebenso wenig der Verkehrskundeunterricht.",
  },
  {
    frage:
      "Wie lange muss ich den Lernfahrausweis besitzen, bevor ich die praktische Prüfung ablegen darf?",
    antwort:
      "Wenn Du den Lernfahrausweis vor Deinem 20. Geburtstag erhältst, gilt eine Lernphase von zwölf Monaten. Erst danach wirst Du zur praktischen Prüfung zugelassen. Wer den Ausweis ab dem 20. Geburtstag löst, hat diese Wartefrist nicht.",
  },
];
