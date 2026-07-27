/**
 * Telefonnummern der Kundschaft in klickbare Links verwandeln.
 *
 * Die Nummern werden so gespeichert, wie sie eingegeben wurden: 079 604 44 44,
 * 0796044444, +41 79 604 44 44. Das Buchungsformular prueft absichtlich nur die
 * Ziffernzahl, denn eine abgewiesene gueltige Nummer kostet einen Kursplatz.
 * Fuer einen Link muss daraus aber eine eindeutige Form werden.
 *
 * Nicht zu verwechseln mit lib/kontakt.ts: dort stehen die beiden Nummern der
 * Fahrschule, hier wird die Nummer eines Gastes aufbereitet.
 */

/** Schweizer Landesvorwahl ohne Plus. */
const SCHWEIZ = "41";

/**
 * Ziffernfolge im internationalen Format, ohne Plus.
 *
 * "079 604 44 44" wird zu "41796044444". Eine Nummer, die bereits mit 00 oder
 * einer Landesvorwahl beginnt, bleibt bei ihrem Land: eine deutsche Nummer
 * darf nicht als Schweizer Nummer verlinkt werden.
 */
export function international(nummer: string): string {
  const ziffern = nummer.replace(/\D/g, "");

  if (nummer.trim().startsWith("+")) return ziffern;
  if (ziffern.startsWith("00")) return ziffern.slice(2);
  if (ziffern.startsWith("0")) return SCHWEIZ + ziffern.slice(1);
  if (ziffern.startsWith(SCHWEIZ)) return ziffern;
  return ziffern;
}

/** tel:-Link. Funktioniert auf dem iPad und dem Handy als Anruf. */
export function telLink(nummer: string): string {
  return `tel:+${international(nummer)}`;
}

/**
 * wa.me-Link mit optionalem Text.
 *
 * WhatsApp erwartet die Nummer ohne Plus und ohne Trennzeichen. Ob unter der
 * Nummer wirklich ein WhatsApp-Konto liegt, laesst sich nicht wissen; das
 * merkt man erst beim Oeffnen.
 */
export function whatsappLink(nummer: string, text?: string): string {
  const basis = `https://wa.me/${international(nummer)}`;
  return text ? `${basis}?text=${encodeURIComponent(text)}` : basis;
}
