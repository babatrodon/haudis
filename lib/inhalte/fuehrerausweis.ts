import { EXTERNE_LINKS } from "@/lib/inhalte/links";

/**
 * Die sieben Schritte zum Fuehrerausweis, finale Copy aus PLAN.md Abschnitt 5.
 *
 * Abweichung von der Skizze: Schritt 2 heisst "Gesuch online ausfuellen" statt
 * "Formular herunterladen". Das Strassenverkehrsamt Aargau bietet kein PDF an,
 * sondern nur ein interaktives Onlineformular (geprueft 26.07.2026).
 */

export const FUEHRERAUSWEIS_EINLEITUNG =
  "Hier sind die sieben Schritte zum Führerausweis. Solltest Du mit einem Formular oder den gesetzlichen Bestimmungen nicht klarkommen, ruf uns einfach an! Wir bieten Dir alle erforderlichen Kurse an.";

export type SchrittAktion = {
  text: string;
  href: string;
  /** Oeffnet in einem neuen Tab, fuer Ziele ausserhalb der Website. */
  extern?: boolean;
  /** Hebt die wichtigste Aktion eines Schritts hervor. */
  betont?: boolean;
};

export type Schritt = {
  nummer: number;
  titel: string;
  text: string;
  badge?: string;
  aktionen?: SchrittAktion[];
  /** Zusatzblock, aktuell nur der WAB-Gutschein. */
  gutschein?: { text: string; code: string };
};

export const SCHRITTE: Schritt[] = [
  {
    nummer: 1,
    titel: "Nothelferkurs absolvieren",
    text: "Absolviere zuerst den obligatorischen Nothelferkurs. Du erhältst danach einen Ausweis, der dem Gesuch beizulegen ist.",
    aktionen: [
      { text: "Zum Nothelferkurs", href: "/kurse/nothelfer", betont: true },
    ],
  },
  {
    nummer: 2,
    titel: "Gesuch ausfüllen",
    text: "Fülle das «Gesuch um Erteilung eines Lernfahr- bzw. Führerausweises» aus. Sehtest, Foto und Nothelferausweis beilegen. Das Strassenverkehrsamt braucht für die Bearbeitung vier bis sechs Wochen, plane das ein.",
    aktionen: [
      {
        text: "Gesuch online ausfüllen",
        href: EXTERNE_LINKS.gesuchLernfahrausweis,
        extern: true,
        betont: true,
      },
      {
        text: "Merkblatt des Strassenverkehrsamts",
        href: EXTERNE_LINKS.strassenverkehrsamtAargau,
        extern: true,
      },
    ],
  },
  {
    nummer: 3,
    titel: "Einwohnerkontrolle",
    text: "Persönlicher Identitätscheck bei der Einwohnerkontrolle zur Kontrolle der Personalien. Identitätskarte oder Pass sowie Formular mitbringen, inklusive Nothelfer-Bestätigung und Foto.",
  },
  {
    nummer: 4,
    titel: "Theorieprüfung und Lernfahrausweis",
    text: "Das Strassenverkehrsamt stellt den Anmeldetalon für die Theorieprüfung zu. Nach bestandener Prüfung wird der Lernfahrausweis ausgestellt. Die bestandene Theorieprüfung ist unbefristet gültig.",
    aktionen: [
      { text: "Theorie-Unterstützung", href: "/kurse/btu", betont: true },
      { text: "Gratis Bögle besuchen", href: "/boegle" },
    ],
  },
  {
    nummer: 5,
    titel: "Fahrstunden und VKU",
    text: "Melde Dich für den Verkehrskundeunterricht (VKU) und die praktischen Fahrstunden an. Wir begleiten Dich kompetent und geduldig.",
    aktionen: [
      { text: "VKU-Daten ansehen", href: "/kursdaten", betont: true },
      { text: "Zu den Fahrstunden", href: "/fahrstunden" },
    ],
  },
  {
    nummer: 6,
    titel: "Praktische Prüfung",
    text: "Lege die praktische Fahrprüfung beim Strassenverkehrsamt ab und erhalte nach bestandener Prüfung Deinen Führerausweis. Wenn Du den Lernfahrausweis vor dem 20. Geburtstag erhalten hast, gilt vorher eine Lernphase von zwölf Monaten.",
  },
  {
    nummer: 7,
    titel: "WAB-Kurs (Weiterausbildung)",
    badge: "Abschluss",
    text: "Der WAB-Kurs ist obligatorisch und muss innerhalb von 12 Monaten nach der praktischen Prüfung absolviert werden. Er ist Voraussetzung für den definitiven Führerausweis. Den Kurs buchst Du direkt beim TCS, zum Beispiel im Fahrzentrum Frick.",
    gutschein: {
      text: "Als unser Fahrschüler profitierst Du von einem exklusiven Rabatt von CHF 20.00.",
      code: "Ausilia20",
    },
    aktionen: [
      {
        text: "Jetzt beim TCS buchen",
        href: EXTERNE_LINKS.tcsWabKurs,
        extern: true,
        betont: true,
      },
    ],
  },
];

/**
 * Kurzfassung der sieben Schritte fuer die Startseite.
 *
 * Text und Reihenfolge aus design/haudis-design.dc.html Screen 02. Bewusst
 * eine eigene Liste und nicht die gekuerzten SCHRITTE von oben: die
 * Startseite fasst zusammen, die Seite /fuehrerausweis fuehrt durch. Sie
 * beginnen deshalb sogar unterschiedlich — die Uebersicht mit dem Sehtest, die
 * Anleitung mit dem Nothelferkurs, weil dort die Reihenfolge der Formulare
 * zaehlt.
 *
 * Der Gutscheincode steht als Platzhalter, damit er aus den Einstellungen
 * kommt und nicht an zwei Stellen gepflegt werden muss.
 */
export const SCHRITTE_KURZ: { titel: string; text: string }[] = [
  {
    titel: "Sehtest machen",
    text: "Beim Optiker oder Arzt. Das Formular nimmst Du zur Anmeldung mit.",
  },
  {
    titel: "Nothelferkurs besuchen",
    text: "Bei uns als Intensivkurs an einem Wochenende. Der Ausweis ist 6 Jahre gültig.",
  },
  {
    titel: "Antrag einreichen",
    text: "Formular bei der Wohngemeinde abgeben, danach folgt die Zulassung zur Theorieprüfung.",
  },
  {
    titel: "Theorieprüfung bestehen",
    text: "Vorbereitung im BTU oder gratis am Bögle-Abend, jeden Montag von 19.00 bis 21.00.",
  },
  {
    titel: "Lernfahrausweis erhalten",
    text: "Damit startest Du mit den Fahrstunden. Wir üben von Anfang an im Verkehr.",
  },
  {
    titel: "VKU besuchen und Prüfung fahren",
    text: "Der VKU ist obligatorisch, 4 Lektionen à 2 Stunden. Danach die praktische Prüfung.",
  },
  {
    titel: "WAB-Kurs",
    text: "Obligatorisch innert 12 Monaten nach der Prüfung. Buchung beim TCS. Mit Code {{gutschein}} erhältst Du CHF 20 Rabatt.",
  },
];
