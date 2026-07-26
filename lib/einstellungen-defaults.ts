// Relativ statt @/-Alias, weil der Seed diese Datei unter tsx importiert.
import { ADRESSE, TELEFONNUMMERN, WHATSAPP_NUMMER } from "./kontakt";

/**
 * Schluessel und Startwerte aller Einstellungen (PLAN.md Abschnitt 6.8).
 *
 * Diese Datei ist reine Datenhaltung ohne Datenbankzugriff, damit sowohl der
 * Seed als auch die Anwendung sie importieren koennen. Gelesen wird zur
 * Laufzeit ueber lib/einstellungen.ts, das auf diese Werte zurueckfaellt,
 * solange in der Setting-Tabelle nichts steht.
 *
 * Alle Werte sind Strings, weil Setting ein Schluessel-Wert-Speicher ist.
 * Betraege stehen als "95.00", Wahrheitswerte als "true" oder "false".
 *
 * Die Telefonnummern kommen aus lib/kontakt.ts. Dort stehen sie einmal im
 * Code, hier werden sie nur in die Datenbank uebernommen, damit die Admin sie
 * ab Sprint 4 selbst aendern kann.
 */

const [telefon1, telefon2] = TELEFONNUMMERN;

export const EINSTELLUNG_DEFAULTS = {
  "kontakt.telefon1": telefon1.anzeige,
  "kontakt.telefon1Tel": telefon1.tel,
  "kontakt.telefon2": telefon2.anzeige,
  "kontakt.telefon2Tel": telefon2.tel,
  "kontakt.email": ADRESSE.email,

  // WhatsApp laeuft nur ueber 079 604 44 44 (Entscheidung 3 vom 26.07.2026).
  // Die Texte stehen als Klartext, die URL-Kodierung passiert beim Rendern.
  "whatsapp.nummer": WHATSAPP_NUMMER,
  "whatsapp.text.auto":
    "Hoi Ausilia! Ich möchte gerne eine gratis Probelektion (Auto) vereinbaren. Mein Name: ",
  "whatsapp.text.taxi":
    "Hoi Ausilia! Ich möchte gerne eine gratis Probelektion (Taxi) vereinbaren. Mein Name: ",
  "whatsapp.text.motorrad":
    "Hoi Ausilia! Ich möchte gerne eine gratis Probelektion (Motorrad) vereinbaren. Mein Name: ",
  "whatsapp.text.lkw":
    "Hoi Ausilia! Ich möchte gerne eine gratis Probelektion (Lastwagen) vereinbaren. Mein Name: ",
  "whatsapp.text.anhaenger":
    "Hoi Ausilia! Ich interessiere mich für die Anhänger-Ausbildung BE. Mein Name: ",
  "whatsapp.text.buchung":
    "Hoi Ausilia! Ich habe eine Frage zu meiner Buchung. Mein Name: ",
  "whatsapp.text.allgemein": "Hoi Ausilia! Ich habe eine Frage. Mein Name: ",

  // Geschaeftsregel 2: frei >= 4 gruen, 1 bis 3 gelb, 0 rot.
  "ampel.schwelleGruen": "4",
  "ampel.schwelleGelb": "1",

  // Fahrstunden, PLAN.md Abschnitt 5.
  //
  // Ein leerer Wert bedeutet "auf Anfrage": die Seite zeigt dann statt einer
  // Preiskarte den Hinweis mit Telefon- und WhatsApp-Kontakt. So kann Ausilia
  // einen Preis nachtragen, ohne dass jemand Code anfassen muss.

  // Auto und Taxi, bestätigt 26.07.2026.
  "fahrstunden.auto.einzel": "95.00",
  "fahrstunden.auto.abo5": "90.00",
  "fahrstunden.auto.abo10": "88.00",
  "fahrstunden.taxi.einzel": "95.00",
  "fahrstunden.taxi.abo5": "90.00",
  "fahrstunden.taxi.abo10": "88.00",
  // Einmalig bei der ersten Lektion, Anteil Versicherung und Administration.
  "fahrstunden.adminGebuehr": "100.00",

  // Lastwagen, bestätigt 26.07.2026. Eigene Kartenform ohne Abo-Staffel.
  "fahrstunden.lkw.praktisch": "140.00",
  "fahrstunden.lkw.theorie": "25.00",

  // TODO Motorrad und Anhänger BE: Preise werden von der Kundin abgeklärt
  // (PLAN.md Abschnitt 12, offener Punkt 2). Abschnitt 5 nennt zwar dieselben
  // Ansätze wie Auto und Taxi, der spätere Eintrag vom 27.07.2026 stellt beide
  // aber auf "auf Anfrage". Bis zur Bestätigung bleibt das hier leer.
  "fahrstunden.motorrad.einzel": "",
  "fahrstunden.motorrad.abo5": "",
  "fahrstunden.motorrad.abo10": "",
  "fahrstunden.anhaenger.einzel": "",
  "fahrstunden.anhaenger.abo5": "",
  "fahrstunden.anhaenger.abo10": "",

  // Gutscheincode für den WAB-Kurs beim TCS, PLAN.md Abschnitt 5 Schritt 7.
  "wab.gutscheincode": "Ausilia20",

  "mail.absender": ADRESSE.email,
  // Interne Kopie an die Admin pro Buchung (PLAN.md Abschnitt 8).
  "mail.internKopie": "true",

  // SMS-Versand ist aus, bis ASPSMS in Sprint 6 angebunden ist.
  "sms.aktiv": "false",

  // Aktion "+ 8 Stunden Bögle gratis" zum BTU.
  "aktion.btuBoegleGratis": "true",
} as const satisfies Record<string, string>;

export type EinstellungSchluessel = keyof typeof EINSTELLUNG_DEFAULTS;
