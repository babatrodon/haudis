/**
 * CSV fuer Excel unter Windows.
 *
 * Zwei Eigenheiten, ohne die die Datei beim Kunden unbrauchbar ankommt:
 *
 *   Semikolon statt Komma. Excel richtet sich nach dem Listentrennzeichen des
 *   Systems, und das ist in der deutschsprachigen Schweiz das Semikolon. Mit
 *   Komma landet jede Zeile in einer einzigen Spalte.
 *
 *   BOM am Anfang. Ohne die drei Bytes liest Excel die Datei als Windows-1252,
 *   und aus "Müller" wird "MÃ¼ller".
 *
 * Beides ist kein Fehler von Excel, den man ignorieren koennte: die Datei wird
 * dort geoeffnet, also muss sie dort stimmen.
 */

const TRENNER = ";";
const BOM = "﻿";

/**
 * Ein Feld fuer CSV aufbereiten.
 *
 * Anfuehrungszeichen immer: dann ist es gleichgueltig, ob im Wert ein
 * Semikolon, ein Zeilenumbruch oder ein Anfuehrungszeichen steckt.
 *
 * Fuehrende Sonderzeichen werden entschaerft. Eine Zelle, die mit =, +, - oder
 * @ beginnt, fuehrt Excel als Formel aus; eine Adresse wie "-Weg 3" wuerde so
 * zu einem Rechenfehler, und im schlimmeren Fall laesst sich damit Schaden
 * anrichten. Ein vorangestelltes Apostroph macht daraus wieder Text.
 */
function feld(wert: string | number | null | undefined): string {
  const text = wert === null || wert === undefined ? "" : String(wert);
  const entschaerft = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${entschaerft.replace(/"/g, '""')}"`;
}

export function csvErzeugen(
  kopf: string[],
  zeilen: (string | number | null | undefined)[][],
): string {
  const alle = [kopf, ...zeilen].map((zeile) =>
    zeile.map(feld).join(TRENNER),
  );
  // CRLF, weil die Datei unter Windows geoeffnet wird.
  return BOM + alle.join("\r\n") + "\r\n";
}

/** Dateiname ohne Zeichen, die Windows im Dateisystem nicht mag. */
export function dateiname(teile: string[]): string {
  return (
    teile
      .join("-")
      .replace(/[^\wäöüÄÖÜ.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "export"
  );
}
