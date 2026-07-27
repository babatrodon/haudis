/**
 * Weiterleitungen vom alten haudi.ch (PLAN.md Abschnitt 11).
 *
 * DIE ALTE SEITE IST EINE ASP-ANWENDUNG
 *
 * Die Adressen enden auf `.asp` und tragen ihre Parameter in der Query, etwa
 * `/kurse.asp` oder `/kurse.asp?id=3`. Das hat zwei Folgen fuer diese Liste:
 *
 *   - Der Pfad allein genuegt fuer eine Seite ohne Parameter.
 *   - Sobald verschiedene `id`-Werte auf verschiedene neue Seiten zeigen,
 *     braucht jeder Wert einen eigenen Eintrag mit `query`. Ohne diese
 *     Unterscheidung landen alle Kursarten auf derselben Seite.
 *
 * Der Adminbereich der alten Seite (`/admin/*.asp`) bekommt KEINE
 * Weiterleitung. Diese Adressen stehen in keinem Index, hinter ihnen lag ein
 * Login, und eine Regel von dort auf das neue Panel waere eine Einladung, es
 * zu suchen.
 *
 * Ohne Regel greift, was fuer jede Adresse unter /admin gilt: proxy.ts
 * schickt sie auf /team/login. Kein Leck — die Anmeldeseite ist oeffentlich —,
 * aber auch kein 404. Wer eine alte Admin-Adresse aufruft, landet vor der
 * Anmeldung und kommt ohne Konto nicht weiter.
 *
 * WAS HIER FEHLT UND WARUM
 *
 * Bis auf einen Eintrag ist die Liste leer, und das ist kein Versehen. Welche
 * Adressen die alte Seite hat und welche davon bei Google im Index stehen,
 * laesst sich nur an der laufenden Seite feststellen. Geratene Weiterleitungen
 * waeren schlimmer als keine: eine 301 auf eine falsche Seite bleibt dauerhaft
 * im Browser-Cache und vererbt der neuen Adresse die Signale der alten.
 *
 * SO WIRD SIE GEFUELLT
 *
 * 1. Altes haudi.ch crawlen (Screaming Frog, wget --spider oder die Sitemap
 *    der alten Seite, falls vorhanden)
 * 2. In der Google Search Console die tatsaechlich indexierten Adressen holen
 * 3. Jede alte Adresse einer neuen zuordnen; was kein Gegenstueck hat, geht
 *    auf die Startseite
 * 4. Hier eintragen — mehr braucht es nicht, next.config.ts liest diese Liste
 *
 * Danach `pnpm build` und stichprobenweise pruefen, dass jede alte Adresse mit
 * 301 auf eine Seite zeigt, die 200 antwortet.
 */

export type Weiterleitung = {
  /** Pfad auf der alten Seite, ohne Domain und ohne Query. */
  von: string;
  /** Ziel in der neuen Anwendung. */
  nach: string;
  /**
   * Query-Parameter, die zusaetzlich stimmen muessen — der Normalfall bei ASP.
   * Ohne Angabe greift die Weiterleitung fuer jeden Aufruf des Pfades,
   * unabhaengig von der Query.
   *
   * Beispiel: `{ von: "/kurse.asp", nach: "/kurse/vku", query: { id: "3" } }`
   * leitet nur `/kurse.asp?id=3` um.
   */
  query?: Record<string, string>;
};

export const WEITERLEITUNGEN: Weiterleitung[] = [
  /**
   * Der einzige Eintrag, der ohne Crawl sicher ist: eine ASP-Anwendung dieser
   * Bauart liefert ihre Startseite immer auch unter /index.asp aus, und das
   * Ziel ist zweifelsfrei die neue Startseite.
   *
   * Alles Weitere kommt aus dem Crawl. So sehen die Eintraege aus:
   *
   *   // Seite ohne Parameter
   *   { von: "/kurse.asp", nach: "/kurse" },
   *   { von: "/kontakt.asp", nach: "/kontakt" },
   *   { von: "/preise.asp", nach: "/fahrstunden" },
   *
   *   // Dieselbe Datei, verschiedene Ziele je nach id
   *   { von: "/kurse.asp", nach: "/kurse/vku", query: { id: "3" } },
   *   { von: "/kurse.asp", nach: "/kurse/btu", query: { id: "7" } },
   *
   * Die Eintraege mit `query` gehoeren VOR den gleichnamigen ohne, sonst
   * greift der allgemeine zuerst und der spezielle kommt nie zum Zug.
   * alsNextRedirects sortiert deshalb selbst.
   */
  { von: "/index.asp", nach: "/" },
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
export function alsNextRedirects(liste: Weiterleitung[] = WEITERLEITUNGEN) {
  // Eintraege mit Query zuerst: Next nimmt die erste passende Regel. Stuende
  // die allgemeine Regel fuer /kurse.asp vorne, kaeme die Regel fuer
  // /kurse.asp?id=3 nie zum Zug und alle Kursarten landeten auf derselben
  // Seite. Die Sortierung hier erspart es, beim Eintragen daran zu denken.
  //
  // Die Liste ist ein Parameter, damit sich die Sortierung und die Umrechnung
  // nach `has` pruefen lassen, ohne Testeintraege in die echte Karte zu
  // schreiben.
  const sortiert = [...liste].sort(
    (a, b) => (b.query ? 1 : 0) - (a.query ? 1 : 0),
  );

  return sortiert.map((eintrag) => ({
    source: eintrag.von,
    destination: eintrag.nach,
    statusCode: 301 as const,
    ...(eintrag.query
      ? {
          has: Object.entries(eintrag.query).map(([key, value]) => ({
            type: "query" as const,
            key,
            value,
          })),
        }
      : {}),
  }));
}
