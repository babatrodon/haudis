/**
 * Weiterleitungen vom alten haudi.ch (PLAN.md Abschnitt 11).
 *
 * WAS HIER FEHLT UND WARUM
 *
 * Die Liste ist bis auf einen Eintrag leer, und das ist kein Versehen. Das
 * alte haudi.ch ist eine PHP-Seite von rund 2005; welche Adressen dort
 * existieren und welche davon bei Google im Index stehen, laesst sich nur an
 * der laufenden Seite feststellen — durch einen Crawl und einen Blick in die
 * Search Console. Geratene Weiterleitungen waeren schlimmer als keine: eine
 * 301 auf eine falsche Seite ist dauerhaft im Browser-Cache und
 * vererbt der neuen Adresse die Signale der alten.
 *
 * SO WIRD SIE GEFUELLT
 *
 * 1. Altes haudi.ch crawlen (Screaming Frog, wget --spider oder die
 *    Sitemap der alten Seite, falls vorhanden)
 * 2. In der Google Search Console die tatsaechlich indexierten Adressen holen
 * 3. Jede alte Adresse einer neuen zuordnen; was kein Gegenstueck hat, geht
 *    auf die Startseite
 * 4. Hier eintragen — mehr braucht es nicht, next.config.ts liest diese Liste
 *
 * Danach `pnpm build` und stichprobenweise pruefen, dass jede alte Adresse
 * mit 301 auf eine Seite zeigt, die 200 antwortet.
 */

export type Weiterleitung = {
  /** Adresse auf der alten Seite, ohne Domain. */
  von: string;
  /** Ziel in der neuen Anwendung. */
  nach: string;
};

export const WEITERLEITUNGEN: Weiterleitung[] = [
  /**
   * Der einzige Eintrag, der ohne Crawl sicher ist: eine PHP-Seite dieser
   * Bauart liefert ihre Startseite immer auch unter /index.php aus, und das
   * Ziel ist zweifelsfrei die neue Startseite.
   *
   * Alles Weitere kommt aus dem Crawl. Beispiele, wie die Eintraege aussehen:
   *   { von: "/kurse.php", nach: "/kurse" },
   *   { von: "/vku.php", nach: "/kurse/vku" },
   *   { von: "/kontakt.php", nach: "/kontakt" },
   */
  { von: "/index.php", nach: "/" },
];

/**
 * Uebersetzt die Liste in das Format von next.config.ts.
 *
 * Ausdruecklich 301 und nicht `permanent: true`. Letzteres erzeugt in Next eine
 * 308, und die ist zwar fuer Google gleichwertig, wird aber von aelteren
 * Crawlern und manchen SEO-Werkzeugen nicht als dauerhafte Umleitung gewertet.
 * Hier geht es um Adressen einer PHP-Seite von 2005; was sie einliest, ist
 * nicht bekannt. 301 ist der Standard, den alles versteht, und bei einem
 * reinen Seitenumzug per GET gibt es keinen Grund fuer 308.
 */
export function alsNextRedirects() {
  return WEITERLEITUNGEN.map((eintrag) => ({
    source: eintrag.von,
    destination: eintrag.nach,
    statusCode: 301 as const,
  }));
}
