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

  // ---------------------------------------------------------------------
  // Ab hier: Preis noch offen (PLAN.md Entscheidung 2), deshalb inaktiv.
  // ---------------------------------------------------------------------
  {
    code: "NHI",
    name: "Nothelferkurs Intensiv",
    slug: "nothelfer-intensiv",
    beschreibung:
      "Nothelferkurs am Freitagabend und Samstag. Der Ausweis ist sechs Jahre gültig und dem Gesuch beizulegen.",
    // TODO Preis mit Ausilia klären. Offen ist auch, ob die Fahrschule den
    // Nothelferkurs selbst durchführt (PLAN.md Entscheidung 6).
    grundpreis: "0.00",
    materialpreis: "0.00",
    onlineLimit: 12,
    lernfahrausweisNoetig: false,
    buchbar: true,
    aktiv: false,
    reihenfolge: 40,
  },
  {
    code: "NH",
    name: "Nothelferkurs Abendkurs",
    slug: "nothelfer",
    beschreibung:
      "Nothelferkurs über mehrere Abende verteilt. Der Ausweis ist sechs Jahre gültig und dem Gesuch beizulegen.",
    // TODO Preis mit Ausilia klären, siehe NHI.
    grundpreis: "0.00",
    materialpreis: "0.00",
    onlineLimit: 12,
    lernfahrausweisNoetig: false,
    buchbar: true,
    aktiv: false,
    reihenfolge: 50,
  },
  {
    code: "MOT_A1_A",
    name: "Motorrad-Grundkurs A1 zu A",
    slug: "motorrad-a1-zu-a",
    beschreibung: "Motorrad-Grundschulung für den Umstieg von A1 auf A.",
    // TODO Preis mit Ausilia klären. Ebenfalls offen: ob für die
    // Motorrad-Grundkurse ein Lernfahrausweis verlangt wird. PLAN.md nennt
    // diese Pflicht nur beim VKU, deshalb steht hier false.
    grundpreis: "0.00",
    materialpreis: "0.00",
    onlineLimit: 12,
    lernfahrausweisNoetig: false,
    buchbar: true,
    aktiv: false,
    reihenfolge: 60,
  },
  {
    code: "MOT_A1",
    name: "Motorrad-Grundkurs A1",
    slug: "motorrad-a1",
    beschreibung: "Motorrad-Grundschulung für die Kategorie A1.",
    // TODO Preis mit Ausilia klären, siehe MOT_A1_A.
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
      "Zwölf Stunden Grundschulung für die Kategorie A, verteilt auf mehrere Kurstage.",
    // TODO Preis mit Ausilia klären, siehe MOT_A1_A.
    grundpreis: "0.00",
    materialpreis: "0.00",
    onlineLimit: 12,
    lernfahrausweisNoetig: false,
    buchbar: true,
    aktiv: false,
    reihenfolge: 80,
  },
];
