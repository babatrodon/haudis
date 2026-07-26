import { einstellungenLesen, einstellungZahl } from "@/lib/einstellungen";
import type { EinstellungSchluessel } from "@/lib/einstellungen-defaults";

/**
 * Fahrstunden-Kategorien fuer die oeffentliche Seite (PLAN.md Abschnitt 5).
 *
 * Zwei Kartenformen, weil der Lastwagen keine Abo-Staffel hat:
 *   abo:  Einzellektion, 5er-Abo, 10er-Abo, dazu die einmalige Gebuehr
 *   lkw:  praktische Lektion und Theorielektion
 *
 * Preise stehen nicht hier, sondern in den Einstellungen. Fehlt ein Wert, wird
 * die Kategorie als "auf Anfrage" ausgegeben statt mit einer erfundenen Zahl.
 * Ausilia traegt den Preis spaeter im Admin nach, ohne Codeaenderung.
 */

type AboKategorie = {
  slug: string;
  name: string;
  beschreibung: string;
  preisform: "abo";
  schluessel: {
    einzel: EinstellungSchluessel;
    abo5: EinstellungSchluessel;
    abo10: EinstellungSchluessel;
  };
  whatsappText: EinstellungSchluessel;
};

type LkwKategorie = {
  slug: string;
  name: string;
  beschreibung: string;
  preisform: "lkw";
  schluessel: {
    praktisch: EinstellungSchluessel;
    theorie: EinstellungSchluessel;
  };
  whatsappText: EinstellungSchluessel;
};

export type FahrstundenKategorie = AboKategorie | LkwKategorie;

export const FAHRSTUNDEN_KATEGORIEN: FahrstundenKategorie[] = [
  {
    slug: "auto",
    name: "Auto",
    beschreibung:
      "Fahrlektionen in der Kategorie B, im modernen Schulungsfahrzeug mit Doppelsteuerung.",
    preisform: "abo",
    schluessel: {
      einzel: "fahrstunden.auto.einzel",
      abo5: "fahrstunden.auto.abo5",
      abo10: "fahrstunden.auto.abo10",
    },
    whatsappText: "whatsapp.text.auto",
  },
  {
    slug: "motorrad",
    name: "Motorrad",
    beschreibung: "Fahrlektionen für die Kategorien A1 und A.",
    preisform: "abo",
    schluessel: {
      einzel: "fahrstunden.motorrad.einzel",
      abo5: "fahrstunden.motorrad.abo5",
      abo10: "fahrstunden.motorrad.abo10",
    },
    whatsappText: "whatsapp.text.motorrad",
  },
  {
    slug: "anhaenger-be",
    name: "Anhänger BE",
    beschreibung: "Ausbildung für das Fahren mit Anhänger, Kategorie BE.",
    preisform: "abo",
    schluessel: {
      einzel: "fahrstunden.anhaenger.einzel",
      abo5: "fahrstunden.anhaenger.abo5",
      abo10: "fahrstunden.anhaenger.abo10",
    },
    whatsappText: "whatsapp.text.anhaenger",
  },
  {
    slug: "lastwagen",
    name: "Lastwagen",
    beschreibung:
      "Fahrlektionen für die Kategorie C, praktisch und theoretisch.",
    preisform: "lkw",
    schluessel: {
      praktisch: "fahrstunden.lkw.praktisch",
      theorie: "fahrstunden.lkw.theorie",
    },
    whatsappText: "whatsapp.text.lkw",
  },
  {
    slug: "taxi",
    name: "Taxi",
    beschreibung:
      "Fahrlektionen für den Taxiausweis, gleiche Ansätze wie beim Auto.",
    preisform: "abo",
    schluessel: {
      einzel: "fahrstunden.taxi.einzel",
      abo5: "fahrstunden.taxi.abo5",
      abo10: "fahrstunden.taxi.abo10",
    },
    whatsappText: "whatsapp.text.taxi",
  },
];

/** Eine Kategorie mit aufgeloesten Preisen, bereit zum Rendern. */
export type FahrstundenPreise =
  | {
      kategorie: FahrstundenKategorie;
      /** Kein einziger Preis hinterlegt: die Karte zeigt "auf Anfrage". */
      aufAnfrage: true;
    }
  | {
      kategorie: AboKategorie;
      aufAnfrage: false;
      preisform: "abo";
      einzel: number | null;
      abo5: number | null;
      abo10: number | null;
      adminGebuehr: number | null;
    }
  | {
      kategorie: LkwKategorie;
      aufAnfrage: false;
      preisform: "lkw";
      praktisch: number | null;
      theorie: number | null;
    };

/**
 * Liest die Preise aller Kategorien. Eine Kategorie ohne einen einzigen
 * hinterlegten Wert gilt als "auf Anfrage".
 */
export async function fahrstundenPreiseLesen(): Promise<FahrstundenPreise[]> {
  // Einmal lesen, damit nicht jede Kategorie einzeln die Einstellungen holt.
  await einstellungenLesen();

  const ergebnis: FahrstundenPreise[] = [];

  for (const kategorie of FAHRSTUNDEN_KATEGORIEN) {
    if (kategorie.preisform === "lkw") {
      const praktisch = await einstellungZahl(kategorie.schluessel.praktisch);
      const theorie = await einstellungZahl(kategorie.schluessel.theorie);

      ergebnis.push(
        praktisch === null && theorie === null
          ? { kategorie, aufAnfrage: true }
          : { kategorie, aufAnfrage: false, preisform: "lkw", praktisch, theorie },
      );
      continue;
    }

    const einzel = await einstellungZahl(kategorie.schluessel.einzel);
    const abo5 = await einstellungZahl(kategorie.schluessel.abo5);
    const abo10 = await einstellungZahl(kategorie.schluessel.abo10);

    ergebnis.push(
      einzel === null && abo5 === null && abo10 === null
        ? { kategorie, aufAnfrage: true }
        : {
            kategorie,
            aufAnfrage: false,
            preisform: "abo",
            einzel,
            abo5,
            abo10,
            adminGebuehr: await einstellungZahl("fahrstunden.adminGebuehr"),
          },
    );
  }

  return ergebnis;
}
