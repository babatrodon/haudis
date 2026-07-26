/**
 * Externe Links, alle am 26.07.2026 geprueft (PLAN.md Abschnitt 10 verlangt
 * das ausdruecklich fuer TCS und Strassenverkehrsamt Aargau).
 *
 * Wer hier etwas aendert, ruft die Adresse vorher auf. Ein toter Link auf der
 * Seite einer Fahrschule kostet Anmeldungen.
 */

export const GEPRUEFT_AM = "26.07.2026";

export const EXTERNE_LINKS = {
  /**
   * Gesuch um Erteilung eines Lernfahrausweises, Kanton Aargau.
   *
   * Es gibt kein PDF zum Herunterladen, nur dieses interaktive Onlineformular.
   * Der Button heisst deshalb "Gesuch online ausfüllen" und nicht
   * "Formular herunterladen", wie in PLAN.md skizziert: sonst verspricht die
   * Seite einen Download, den es nicht gibt.
   */
  gesuchLernfahrausweis:
    "https://www.ag.ch/app/aem/forms/VZFU_2024_Lernfahrgesuch?mode=prod&afAcceptLang=de-ch",

  /** Uebersicht des Strassenverkehrsamts inklusive Merkblatt. */
  strassenverkehrsamtAargau:
    "https://www.ag.ch/de/themen/mobilitaet-verkehr/strassenverkehr/lernfahrausweis-beantragen",

  /**
   * WAB-Kurs beim TCS. Frick (AG) ist einer der Standorte, die Buchung laeuft
   * direkt ueber diese Seite.
   */
  tcsWabKurs:
    "https://www.tcs.ch/de/kurse-fahrzeugchecks/kurse-fahrtrainings/auto/wab-kurs.php",
} as const;
