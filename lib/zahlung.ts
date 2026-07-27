/**
 * Welche Zahlungsarten die Anmeldung anbietet (PLAN.md Abschnitt 14).
 *
 * Die Designvorlage zeigt Bar, TWINT und Karte. TWINT und Karte laufen ueber
 * Payrexx, und die Abklaerung dazu ist kundenseitig offen. Eine Zahlart, die
 * sich nicht abschliessen laesst, gehoert nicht auf die Seite: wer sie waehlt,
 * landet in einer Sackgasse und ruft an.
 *
 * Deshalb dieser Schalter. Ohne PAYREXX_API_KEY liefert er genau das, was die
 * Seite heute zeigt — Bar allein. Kommt der Schluessel, erscheinen die anderen
 * beiden, ohne dass jemand Markup anfassen muss.
 *
 * Bewusst kein Eintrag in den Einstellungen: ein Knopf im Panel wuerde eine
 * Zahlart einschalten, hinter der keine Anbindung steht. Der Schluessel ist
 * die ehrlichere Bedingung, denn er existiert erst, wenn die Anbindung steht.
 */

export type Zahlungsart = "BAR" | "TWINT" | "KARTE";

export const ZAHLUNGSART_TEXT: Record<Zahlungsart, string> = {
  BAR: "Bar am ersten Kurstag",
  TWINT: "TWINT",
  KARTE: "Karte",
};

/** Ist die Online-Zahlung angebunden? */
export function onlineZahlungAktiv(): boolean {
  return Boolean(process.env.PAYREXX_API_KEY);
}

/**
 * Bar steht immer zuerst und bleibt immer waehlbar (PLAN.md Abschnitt 14):
 * am Schalter und im Kursraum wird bar bezahlt, daran aendert Payrexx nichts.
 */
export function zahlungsartenVerfuegbar(): Zahlungsart[] {
  return onlineZahlungAktiv() ? ["BAR", "TWINT", "KARTE"] : ["BAR"];
}
