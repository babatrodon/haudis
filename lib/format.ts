/**
 * Anzeigeformate. Konventionen aus PLAN.md Abschnitt 2:
 * Betraege in CHF nach de-CH, Zeiten in Europe/Zurich.
 *
 * Wer Geld oder Datum ausgibt, nimmt diese Funktionen. Damit steht das Format
 * an einer Stelle und nicht verstreut in den Seiten.
 *
 * ============================================================================
 * NUR FUER DIE ANZEIGE. Hier wird nicht gerechnet.
 * ============================================================================
 *
 * chf() wandelt intern in Number um, und Number ist ein Gleitkommatyp. Sobald
 * ein Betrag da durchgelaufen ist, darf damit nicht mehr weitergerechnet
 * werden: 0.1 + 0.2 ergibt in Gleitkomma nicht 0.3, und bei summierten
 * Provisionen faellt genau das als Rappendifferenz auf.
 *
 * Also: Provisionen, Abrechnungssummen und Kurstotale bleiben Decimal, von der
 * Datenbank bis zum letzten Schritt. Summiert und multipliziert wird mit
 * Decimal-Methoden oder in der Datenbank. chf() kommt erst ganz am Schluss,
 * auf den fertigen Wert.
 *
 * Falsch:  chf(buchungen.reduce((s, b) => s + Number(b.priceCharged), 0))
 * Richtig: chf(buchungen.reduce((s, b) => s.plus(b.priceCharged), new Decimal(0)))
 *
 * Das wird in Sprint 5 wichtig, wo der Provisionsreport mit der von Hand
 * erstellten Rechnung uebereinstimmen muss (PLAN.md Abschnitt 10, DoD).
 */

/** Prisma liefert Decimal, das eine toString-Methode hat. */
type Betrag = { toString(): string } | number | string;

const CHF_FORMAT = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  minimumFractionDigits: 2,
});

/**
 * Formatiert einen Betrag als "CHF 170.00".
 *
 * Decimal wird ueber toString in eine Zahl gewandelt und nicht vorher in einen
 * Float gerechnet, damit unterwegs nichts gerundet wird.
 */
export function chf(betrag: Betrag): string {
  const zahl = typeof betrag === "number" ? betrag : Number(betrag.toString());
  return CHF_FORMAT.format(zahl);
}

const DATUM_FORMAT = new Intl.DateTimeFormat("de-CH", {
  timeZone: "Europe/Zurich",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATUM_LANG_FORMAT = new Intl.DateTimeFormat("de-CH", {
  timeZone: "Europe/Zurich",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "26.07.2026" */
export function datum(wert: Date): string {
  return DATUM_FORMAT.format(wert);
}

/** "Di, 26.07.2026" */
export function datumLang(wert: Date): string {
  return DATUM_LANG_FORMAT.format(wert);
}

const DATUM_ZEIT_FORMAT = new Intl.DateTimeFormat("de-CH", {
  timeZone: "Europe/Zurich",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * "Di, 26.07.2026, 14:30" — fuer Fristen.
 *
 * Eine Frist ohne Uhrzeit ist keine Frist. Die Wartelisten-Einladung laeuft
 * nach 48 Stunden ab, also mitten am Tag; "bis Donnerstag" waere eine halbe
 * Auskunft.
 */
export function datumZeit(wert: Date): string {
  return DATUM_ZEIT_FORMAT.format(wert);
}
