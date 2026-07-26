/**
 * Kontaktdaten der Fahrschule. Einzige Quelle der Wahrheit im Code.
 *
 * Geschaeftsregel 6 aus PLAN.md: Beide Telefonnummern erscheinen ueberall
 * (Header, Footer, Kontakt), immer als klickbarer tel:-Link. Wer eine Nummer
 * anzeigt, nimmt sie aus TELEFONNUMMERN und rendert nie nur eine davon.
 *
 * Ab Sprint 4 werden diese Werte in den Einstellungen gepflegt (PLAN.md 6.8);
 * bis dahin sind sie hier fixiert.
 */

export const TELEFONNUMMERN = [
  { anzeige: "079 604 44 44", tel: "+41796044444" },
  { anzeige: "079 202 97 97", tel: "+41792029797" },
] as const;

/**
 * WhatsApp laeuft ausschliesslich ueber 079 604 44 44 (Entscheidung 3 vom
 * 26.07.2026). Fuer 079 202 97 97 gibt es bis auf Weiteres nur tel:.
 */
export const WHATSAPP_NUMMER = "41796044444";

export const ADRESSE = {
  firma: "Haudi's Fahrschule & Verkehrsschule",
  strasse: "Haselstrasse 33",
  plz: "5400",
  ort: "Baden",
  email: "info@haudi.ch",
} as const;
