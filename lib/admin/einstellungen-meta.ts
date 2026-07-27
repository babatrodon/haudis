import type { EinstellungSchluessel } from "@/lib/einstellungen-defaults";

/**
 * Beschriftungen und Feldtypen der Einstellungen.
 *
 * Steht bewusst neben lib/einstellungen-defaults.ts und nicht darin: dort
 * stehen die Werte, hier ihre Bedeutung. Wer einen Schluessel hinzufuegt,
 * traegt ihn an beiden Stellen ein — fehlt er hier, erscheint er in der
 * Verwaltung als schlichtes Textfeld mit dem Schluessel als Beschriftung,
 * statt zu verschwinden.
 *
 * Der Feldtyp entscheidet nur ueber die Darstellung. Gespeichert wird immer
 * eine Zeichenkette, weil Setting ein Schluessel-Wert-Speicher ist.
 */

export type Feldtyp = "text" | "zahl" | "betrag" | "schalter" | "lang";

export type EinstellungMeta = {
  beschriftung: string;
  typ: Feldtyp;
  hinweis?: string;
};

export type Gruppe = {
  id: string;
  titel: string;
  beschreibung: string;
  schluessel: EinstellungSchluessel[];
};

export const META: Partial<Record<EinstellungSchluessel, EinstellungMeta>> = {
  "kontakt.telefon1": {
    beschriftung: "Telefon 1",
    typ: "text",
    hinweis: "Erscheint überall auf der Website (Geschäftsregel 6).",
  },
  "kontakt.telefon1Tel": {
    beschriftung: "Telefon 1 als Link",
    typ: "text",
    hinweis: "Internationale Form, zum Beispiel +41796044444.",
  },
  "kontakt.telefon2": { beschriftung: "Telefon 2", typ: "text" },
  "kontakt.telefon2Tel": {
    beschriftung: "Telefon 2 als Link",
    typ: "text",
    hinweis: "Internationale Form.",
  },
  "kontakt.email": { beschriftung: "E-Mail-Adresse", typ: "text" },

  "oeffnungszeiten.tage": {
    beschriftung: "Tage",
    typ: "text",
    hinweis: "Format wie Mo-Sa, wird auch für die strukturierten Daten benutzt.",
  },
  "oeffnungszeiten.von": { beschriftung: "Von", typ: "text" },
  "oeffnungszeiten.bis": { beschriftung: "Bis", typ: "text" },
  "oeffnungszeiten.hinweis": { beschriftung: "Hinweis", typ: "text" },

  "google.placeId": { beschriftung: "Google Place ID", typ: "text" },
  "google.bewertung": {
    beschriftung: "Bewertung",
    typ: "zahl",
    hinweis: "Leer lassen blendet die Bewertungsanzeige aus.",
  },
  "google.anzahlBewertungen": { beschriftung: "Anzahl Bewertungen", typ: "zahl" },
  "google.zitate": {
    beschriftung: "Zitate aus Bewertungen",
    typ: "lang",
    hinweis:
      "JSON-Liste. Nur eintragen, wofür eine Zustimmung vorliegt — Rezensionstexte gehören ihren Verfassern.",
  },
  "geo.breitengrad": { beschriftung: "Breitengrad", typ: "text" },
  "geo.laengengrad": { beschriftung: "Längengrad", typ: "text" },

  "whatsapp.nummer": {
    beschriftung: "WhatsApp-Nummer",
    typ: "text",
    hinweis: "Ohne Plus, zum Beispiel 41796044444.",
  },
  "whatsapp.text.auto": { beschriftung: "Text Auto", typ: "lang" },
  "whatsapp.text.taxi": { beschriftung: "Text Taxi", typ: "lang" },
  "whatsapp.text.motorrad": { beschriftung: "Text Motorrad", typ: "lang" },
  "whatsapp.text.lkw": { beschriftung: "Text Lastwagen", typ: "lang" },
  "whatsapp.text.anhaenger": { beschriftung: "Text Anhänger", typ: "lang" },
  "whatsapp.text.buchung": { beschriftung: "Text Buchung", typ: "lang" },
  "whatsapp.text.allgemein": { beschriftung: "Text allgemein", typ: "lang" },

  "ampel.schwelleGruen": {
    beschriftung: "Grün ab freien Plätzen",
    typ: "zahl",
    hinweis: "Ab so vielen freien Plätzen ist die Ampel grün.",
  },
  "ampel.schwelleGelb": {
    beschriftung: "Gelb ab freien Plätzen",
    typ: "zahl",
    hinweis: "Darunter ist der Kurs ausgebucht und der Anmeldeknopf verschwindet.",
  },

  "fahrstunden.auto.einzel": { beschriftung: "Auto, einzeln", typ: "betrag" },
  "fahrstunden.auto.abo5": { beschriftung: "Auto, 5er-Abo", typ: "betrag" },
  "fahrstunden.auto.abo10": { beschriftung: "Auto, 10er-Abo", typ: "betrag" },
  "fahrstunden.taxi.einzel": { beschriftung: "Taxi, einzeln", typ: "betrag" },
  "fahrstunden.taxi.abo5": { beschriftung: "Taxi, 5er-Abo", typ: "betrag" },
  "fahrstunden.taxi.abo10": { beschriftung: "Taxi, 10er-Abo", typ: "betrag" },
  "fahrstunden.adminGebuehr": {
    beschriftung: "Administrationsgebühr",
    typ: "betrag",
    hinweis: "Einmalig bei der ersten Lektion.",
  },
  "fahrstunden.lkw.praktisch": {
    beschriftung: "Lastwagen, praktisch",
    typ: "betrag",
  },
  "fahrstunden.lkw.theorie": {
    beschriftung: "Lastwagen, Theorie",
    typ: "betrag",
  },
  "fahrstunden.motorrad.einzel": {
    beschriftung: "Motorrad, einzeln",
    typ: "betrag",
    hinweis: "Leer bedeutet: die Seite zeigt „auf Anfrage“.",
  },
  "fahrstunden.motorrad.abo5": { beschriftung: "Motorrad, 5er-Abo", typ: "betrag" },
  "fahrstunden.motorrad.abo10": {
    beschriftung: "Motorrad, 10er-Abo",
    typ: "betrag",
  },
  "fahrstunden.anhaenger.einzel": {
    beschriftung: "Anhänger BE, einzeln",
    typ: "betrag",
    hinweis: "Leer bedeutet: die Seite zeigt „auf Anfrage“.",
  },
  "fahrstunden.anhaenger.abo5": {
    beschriftung: "Anhänger BE, 5er-Abo",
    typ: "betrag",
  },
  "fahrstunden.anhaenger.abo10": {
    beschriftung: "Anhänger BE, 10er-Abo",
    typ: "betrag",
  },

  "wab.gutscheincode": {
    beschriftung: "WAB-Gutscheincode",
    typ: "text",
    hinweis: "Für den Weiterausbildungskurs beim TCS.",
  },

  "mail.absender": { beschriftung: "Absenderadresse", typ: "text" },
  "mail.internKopie": {
    beschriftung: "Interne Kopie pro Buchung",
    typ: "schalter",
  },
  "sms.aktiv": {
    beschriftung: "SMS-Erinnerungen",
    typ: "schalter",
    hinweis: "Bleibt aus, bis ASPSMS angebunden ist.",
  },
  "aktion.btuBoegleGratis": {
    beschriftung: "Aktion: 8 Stunden Bögle gratis zum BTU",
    typ: "schalter",
  },
};

export const GRUPPEN: Gruppe[] = [
  {
    id: "kontakt",
    titel: "Kontakt",
    beschreibung:
      "Beide Nummern erscheinen überall auf der Website. Wer eine ändert, ändert sie an jeder Stelle.",
    schluessel: [
      "kontakt.telefon1",
      "kontakt.telefon1Tel",
      "kontakt.telefon2",
      "kontakt.telefon2Tel",
      "kontakt.email",
    ],
  },
  {
    id: "oeffnungszeiten",
    titel: "Öffnungszeiten",
    beschreibung: "Erscheinen im Fuss der Website und in den strukturierten Daten.",
    schluessel: [
      "oeffnungszeiten.tage",
      "oeffnungszeiten.von",
      "oeffnungszeiten.bis",
      "oeffnungszeiten.hinweis",
    ],
  },
  {
    id: "kurse",
    titel: "Kurse und Ampel",
    beschreibung:
      "Ab wie vielen freien Plätzen die Ampel grün oder gelb zeigt (Geschäftsregel 2).",
    schluessel: ["ampel.schwelleGruen", "ampel.schwelleGelb"],
  },
  {
    id: "fahrstunden",
    titel: "Fahrstunden",
    beschreibung:
      "Ein leerer Preis heisst nicht null, sondern „auf Anfrage“: die Seite zeigt dann den Kontakthinweis statt einer Preiskarte.",
    schluessel: [
      "fahrstunden.auto.einzel",
      "fahrstunden.auto.abo5",
      "fahrstunden.auto.abo10",
      "fahrstunden.taxi.einzel",
      "fahrstunden.taxi.abo5",
      "fahrstunden.taxi.abo10",
      "fahrstunden.adminGebuehr",
      "fahrstunden.lkw.praktisch",
      "fahrstunden.lkw.theorie",
      "fahrstunden.motorrad.einzel",
      "fahrstunden.motorrad.abo5",
      "fahrstunden.motorrad.abo10",
      "fahrstunden.anhaenger.einzel",
      "fahrstunden.anhaenger.abo5",
      "fahrstunden.anhaenger.abo10",
    ],
  },
  {
    id: "whatsapp",
    titel: "WhatsApp",
    beschreibung:
      "Die Texte stehen als Klartext und werden beim Rendern kodiert. WhatsApp läuft nur über die erste Nummer.",
    schluessel: [
      "whatsapp.nummer",
      "whatsapp.text.auto",
      "whatsapp.text.taxi",
      "whatsapp.text.motorrad",
      "whatsapp.text.lkw",
      "whatsapp.text.anhaenger",
      "whatsapp.text.buchung",
      "whatsapp.text.allgemein",
    ],
  },
  {
    id: "google",
    titel: "Google und Karte",
    beschreibung:
      "Bewertung und Anzahl sind eine Momentaufnahme und veralten. Zitate nur mit Zustimmung.",
    schluessel: [
      "google.placeId",
      "google.bewertung",
      "google.anzahlBewertungen",
      "google.zitate",
      "geo.breitengrad",
      "geo.laengengrad",
    ],
  },
  {
    id: "benachrichtigungen",
    titel: "Benachrichtigungen",
    beschreibung:
      "Ohne RESEND_API_KEY wird jede Mail nur protokolliert statt verschickt.",
    schluessel: ["mail.absender", "mail.internKopie", "sms.aktiv"],
  },
  {
    id: "aktionen",
    titel: "Aktionen",
    beschreibung: "Erscheinen auf den Kursseiten, solange sie eingeschaltet sind.",
    schluessel: ["wab.gutscheincode", "aktion.btuBoegleGratis"],
  },
];
