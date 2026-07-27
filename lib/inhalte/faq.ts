/**
 * Haeufige Fragen fuer die Startseite.
 *
 * Fragen und Antworten stammen aus design/haudis-design.dc.html Screen 02.
 * Wo die Vorlage fertige Copy liefert, gilt sie.
 *
 * Die rechtlichen Angaben sind am 26.07.2026 gegen ag.ch und ch.ch geprueft:
 * VKU vier Lektionen à zwei Stunden waehrend der Gueltigkeit des
 * Lernfahrausweises, Nothelferausweis sechs Jahre gueltig, WAB-Kurs innert
 * zwoelf Monaten nach der praktischen Pruefung.
 *
 * Preise und Gutscheincode stehen bewusst auch hier im Text: eine Antwort, die
 * auf eine andere Seite verweist, beantwortet die Frage nicht. Aendert sich
 * ein Preis, aendert er sich in den Einstellungen und hier — deshalb steht der
 * Betrag als Platzhalter, den die Seite ersetzt.
 */

export type FaqEintrag = {
  frage: string;
  antwort: string;
};

export const FAQ: FaqEintrag[] = [
  {
    frage: "Ist der VKU obligatorisch?",
    antwort:
      "Ja. Der Verkehrskundeunterricht umfasst 4 Lektionen à 2 Stunden und muss besucht werden, solange Dein Lernfahrausweis gültig ist. Bei uns gibt es Abend- und Wochenendkurse.",
  },
  {
    frage: "Wie lange ist der Nothelferausweis gültig?",
    antwort:
      "Sechs Jahre. Wir führen den Nothelferkurs als Intensivkurs am Freitagabend und Samstag durch.",
  },
  {
    frage: "Was kostet eine Fahrlektion?",
    antwort:
      "Eine Lektion kostet {{einzel}}, im 5er-Abo {{abo5}} und im 10er-Abo {{abo10}} pro Lektion. Einmalig kommen {{admin}} als Anteil für Versicherung und Administration dazu.",
  },
  {
    frage: "Gibt es einen Familienrabatt?",
    antwort:
      "Ja. Wenn Geschwister oder Eltern ebenfalls bei uns fahren oder einen Kurs buchen, gibt es einen Rabatt. Schreib uns per WhatsApp, wir rechnen es Dir aus.",
  },
  {
    frage: "In welchen Sprachen unterrichtet ihr?",
    antwort:
      "Deutsch, Italienisch, Spanisch, Englisch und Französisch. Sag bei der Anmeldung, welche Sprache Dir am besten passt.",
  },
  {
    frage: "Muss ich den WAB-Kurs machen?",
    antwort:
      "Ja, innert 12 Monaten nach der praktischen Prüfung. Die Buchung läuft über den TCS. Mit dem Gutscheincode {{gutschein}} bekommst Du CHF 20 Rabatt.",
  },
];
