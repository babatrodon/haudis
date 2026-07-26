/**
 * Kursarten mit den Standardwerten, Quelle PLAN.md Abschnitt 5.
 *
 * Preise, die der Kunde noch nicht bestaetigt hat, stehen auf 0.00 und die
 * Kursart ist inaktiv. So kann keine erfundene Zahl auf die oeffentliche Seite
 * geraten. Ausilia traegt den Preis ein und setzt aktiv auf true.
 *
 * Die Beschreibungen sind kurze Sachangaben. Die Marketing-Texte entstehen in
 * Sprint 2 zusammen mit den Kursseiten.
 */

export type KursartSaat = {
  code: string;
  name: string;
  slug: string;
  beschreibung: string;
  grundpreis: string;
  materialpreis: string;
  onlineLimit: number;
  lernfahrausweisNoetig: boolean;
  buchbar: boolean;
  aktiv: boolean;
  reihenfolge: number;
};

export const KURSARTEN: KursartSaat[] = [
  {
    code: "VKU",
    name: "Verkehrskundeunterricht",
    slug: "vku",
    beschreibung:
      "Vier Doppellektionen an typischerweise zwei Tagen. Der Lernfahrausweis ist obligatorisch und am ersten Kurstag mitzubringen. Der Betrag ist bar am ersten Kurstag zu bezahlen.",
    grundpreis: "140.00",
    materialpreis: "30.00",
    onlineLimit: 12,
    lernfahrausweisNoetig: true,
    buchbar: true,
    aktiv: true,
    reihenfolge: 10,
  },
  {
    code: "BTU",
    name: "Basis-Theorieunterricht",
    slug: "btu",
    beschreibung:
      "Vorbereitung auf die Theorieprüfung, Dienstag und Mittwoch von 19 bis 21 Uhr. Preis inklusive Lehrmittel.",
    grundpreis: "200.00",
    materialpreis: "0.00",
    onlineLimit: 12,
    lernfahrausweisNoetig: false,
    buchbar: true,
    aktiv: true,
    reihenfolge: 20,
  },
  {
    code: "BOEGLE",
    name: "Bögle",
    slug: "boegle",
    beschreibung:
      "Betreutes Bearbeiten der Theorieprüfungsfragen, Montag von 19 bis 21 Uhr. Gratis und ohne Anmeldung, einfach vorbeikommen.",
    grundpreis: "0.00",
    materialpreis: "0.00",
    onlineLimit: 0,
    lernfahrausweisNoetig: false,
    // Walk-in, deshalb kein Anmelden-Button und keine Kursdaten-Karte.
    buchbar: false,
    aktiv: true,
    reihenfolge: 30,
  },

  {
    code: "NHI",
    name: "Nothelferkurs Intensiv",
    slug: "nothelfer-intensiv",
    beschreibung:
      "Nothelferkurs am Freitagabend und Samstag, ein Tag mit vorbereitendem eLearning. Der Ausweis ist sechs Jahre gültig und dem Gesuch um den Lernfahrausweis beizulegen.",
    // Preis von der Kundin bestätigt am 26.07.2026.
    grundpreis: "120.00",
    materialpreis: "0.00",
    onlineLimit: 12,
    lernfahrausweisNoetig: false,
    buchbar: true,
    aktiv: true,
    reihenfolge: 40,
  },
  {
    code: "NH",
    name: "Nothelferkurs Abendkurs",
    slug: "nothelfer",
    beschreibung:
      "Nothelferkurs über mehrere Abende verteilt. Der Ausweis ist sechs Jahre gültig und dem Gesuch um den Lernfahrausweis beizulegen.",
    // Preis von der Kundin bestätigt am 26.07.2026.
    grundpreis: "120.00",
    materialpreis: "0.00",
    onlineLimit: 12,
    lernfahrausweisNoetig: false,
    buchbar: true,
    aktiv: true,
    reihenfolge: 50,
  },
  {
    code: "MOT_A1_A",
    name: "Motorrad-Grundkurs A1 zu A",
    slug: "motorrad-a1-zu-a",
    beschreibung:
      "Aufsteigerkurs von der Kategorie A1 auf A, rund vier Stunden. Für die Anmeldung ist kein Lernfahrausweis nötig.",
    // Preis von der Kundin bestätigt am 26.07.2026.
    grundpreis: "120.00",
    materialpreis: "0.00",
    onlineLimit: 12,
    // Kundin bestätigt 26.07.2026: Motorrad-Grundkurse verlangen keinen
    // Lernfahrausweis zur Anmeldung.
    lernfahrausweisNoetig: false,
    buchbar: true,
    aktiv: true,
    reihenfolge: 60,
  },

  // ---------------------------------------------------------------------
  // Preis widersprüchlich, deshalb inaktiv und nicht öffentlich sichtbar.
  //
  // Die Kundin nannte zuerst rund CHF 480, in der zweiten Antwort CHF 120 für
  // zwölf Stunden praktische Grundschulung. Das wären CHF 10 pro Stunde.
  // Ein publizierter Preis mit Onlinebuchung ist ein verbindliches Angebot,
  // deshalb bleiben diese beiden Kursarten aus, bis die Kundin den Preis
  // schriftlich bestätigt (PLAN.md Abschnitt 5 und Abschnitt 12, offener
  // Punkt 1). Danach genügt: Preis eintragen, aktiv auf true.
  // ---------------------------------------------------------------------
  {
    code: "MOT_A1",
    name: "Motorrad-Grundkurs A1",
    slug: "motorrad-a1",
    beschreibung:
      "Zwölf Stunden Grundschulung für die Kategorie A1. Für die Anmeldung ist kein Lernfahrausweis nötig.",
    // TODO Preis schriftlich bestätigen lassen, siehe Kommentar oben.
    grundpreis: "0.00",
    materialpreis: "0.00",
    onlineLimit: 12,
    lernfahrausweisNoetig: false,
    buchbar: true,
    aktiv: false,
    reihenfolge: 70,
  },
  {
    code: "MOT_A",
    name: "Motorrad-Grundkurs A",
    slug: "motorrad-a",
    beschreibung:
      "Zwölf Stunden Grundschulung für die Kategorie A, verteilt auf mehrere Kurstage. Für die Anmeldung ist kein Lernfahrausweis nötig.",
    // TODO Preis schriftlich bestätigen lassen, siehe Kommentar oben.
    grundpreis: "0.00",
    materialpreis: "0.00",
    onlineLimit: 12,
    lernfahrausweisNoetig: false,
    buchbar: true,
    aktiv: false,
    reihenfolge: 80,
  },
];
