/**
 * Der oeffentliche Ursprung der Anwendung.
 *
 * Sitemap, robots.txt, OpenGraph und der Einladungslink der Warteliste brauchen
 * alle eine absolute Adresse. Es gibt genau eine Quelle dafuer: die Umgebung.
 *
 * BETTER_AUTH_URL steht ohnehin schon dort und zeigt auf dieselbe Anwendung.
 * Ein zweiter Schluessel fuer denselben Wert waere eine Gelegenheit, beim
 * Umzug auf haudi.ch nur einen von beiden nachzuziehen — und dann stuenden in
 * der Sitemap Adressen, die es nicht gibt.
 *
 * Bewusst kein Fallback auf eine haudi.ch-Adresse: bevor die DNS umgestellt
 * ist, waere das eine Behauptung ueber eine Seite, die dort noch nicht liegt.
 * Ohne gesetzte Variable gilt localhost, und das faellt beim ersten Blick in
 * die Sitemap auf.
 */
export const SEITEN_URL = (
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/** Absolute Adresse zu einem Pfad, ohne doppelte Schraegstriche. */
export function absoluteUrl(pfad: string): string {
  return `${SEITEN_URL}${pfad.startsWith("/") ? pfad : `/${pfad}`}`;
}
