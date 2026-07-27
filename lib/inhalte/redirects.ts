/**
 * Weiterleitungen vom alten haudi.ch (PLAN.md Abschnitt 11).
 *
 * DIE ALTE SEITE IST EINE ASP-ANWENDUNG
 *
 * Der Crawl vom 27.07.2026 zeigt ein durchgehendes Muster: jeder Bereich hat
 * eine eigene `default.asp`, und welche Seite sie ausgibt, entscheidet ein
 * `nav`-Parameter.
 *
 *     /kontakt/default.asp?nav=10
 *     /kurse/default.asp?nav=23
 *
 * Daraus folgt fuer diese Liste:
 *
 *   - Der Pfad allein identifiziert nur den Bereich, nicht die Seite. Fast
 *     jeder Eintrag braucht deshalb `nav`.
 *   - Mehrere `nav`-Werte im selben Bereich zeigen auf verschiedene neue
 *     Seiten. Ohne `nav` landeten sie alle auf derselben.
 *   - Ein Bereichsaufruf ohne `nav` ist trotzdem moeglich und sollte einen
 *     Auffang-Eintrag bekommen, der auf die passende neue Bereichsseite zeigt.
 *
 * DER ADMINBEREICH BLEIBT AUSSEN VOR
 *
 * Die Adressen der Form `kurse.asp?id=...` gehoeren zum alten Adminpanel, nicht
 * zur oeffentlichen Seite. Sie bekommen keine Weiterleitung: sie stehen in
 * keinem Index, hinter ihnen lag ein Login, und eine Regel von dort auf das
 * neue Panel waere eine Einladung, es zu suchen.
 *
 * Ohne Regel greift, was fuer jede Adresse unter /admin gilt: proxy.ts schickt
 * sie auf /team/login. Kein Leck — die Anmeldeseite ist oeffentlich —, aber
 * auch kein 404.
 *
 * SO WIRD DIE LISTE GEFUELLT
 *
 * 1. Aus dem Crawl die Paare (Bereich, nav) zusammenstellen
 * 2. In der Google Search Console pruefen, welche davon indexiert sind — die
 *    zuerst, der Rest schadet aber auch nicht
 * 3. Jedem Paar eine neue Adresse zuordnen; was kein Gegenstueck hat, geht auf
 *    die passende Bereichsseite oder auf die Startseite
 * 4. Hier eintragen. next.config.ts liest diese Liste, mehr braucht es nicht.
 *
 * Danach `pnpm build` und stichprobenweise pruefen, dass jede alte Adresse mit
 * 301 auf eine Seite zeigt, die 200 antwortet.
 */

/**
 * Der Hostname, unter dem die Seite kuenftig laeuft.
 *
 * WARUM DAS HIER STEHT UND NICHT NUR IM DNS
 *
 * Das alte haudi.ch ist auf **www.haudi.ch** indexiert. Sind beide Hostnamen
 * erreichbar und keiner leitet weiter, teilt Google die Signale auf zwei
 * Adressen auf: die alte Seite hat sie auf www gesammelt, die neue sammelt sie
 * unter dem, was gerade verlinkt wird. Beide Haelften sind dann schwaecher als
 * eine ganze.
 *
 * Deshalb genau ein kanonischer Hostname. Alles andere leitet mit 301 dorthin,
 * und derselbe Name steht in der Sitemap, im canonical und in OpenGraph — die
 * kommen alle aus lib/seite.ts, das BETTER_AUTH_URL liest.
 *
 * WICHTIG BEIM EINRICHTEN: `BETTER_AUTH_URL` muss denselben Hostnamen tragen
 * wie dieser Wert. Stehen dort verschiedene, widersprechen sich Weiterleitung
 * und canonical, und das ist schlimmer als gar keine Kanonisierung.
 */
export const KANONISCHER_HOST = "haudi.ch";

/** Der jeweils andere, der weitergeleitet wird. */
const ZWEITER_HOST = KANONISCHER_HOST.startsWith("www.")
  ? KANONISCHER_HOST.slice(4)
  : `www.${KANONISCHER_HOST}`;

export type Weiterleitung = {
  /** Pfad auf der alten Seite, ohne Domain und ohne Query. */
  von: string;
  /** Ziel in der neuen Anwendung. */
  nach: string;
  /**
   * Query-Parameter, die zusaetzlich stimmen muessen — bei dieser alten Seite
   * der Normalfall, weil `nav` die Seite bestimmt.
   *
   * Ohne Angabe greift die Weiterleitung fuer jeden Aufruf des Pfades,
   * unabhaengig von der Query. Das ist der Auffang-Eintrag pro Bereich.
   */
  query?: Record<string, string>;
};

export const WEITERLEITUNGEN: Weiterleitung[] = [
  /**
   * Der einzige Eintrag, der ohne die vollstaendige nav-Liste sicher ist: die
   * Startseite der alten Anwendung.
   *
   * Alles Weitere kommt aus dem Crawl. So sehen die Eintraege aus:
   *
   *   // Eine bestimmte Seite eines Bereichs
   *   { von: "/kontakt/default.asp", nach: "/kontakt", query: { nav: "10" } },
   *   { von: "/kurse/default.asp", nach: "/kurse/vku", query: { nav: "23" } },
   *   { von: "/kurse/default.asp", nach: "/kurse/btu", query: { nav: "24" } },
   *
   *   // Auffang fuer denselben Bereich ohne nav — steht NACH den nav-Regeln,
   *   // darum kuemmert sich alsNextRedirects
   *   { von: "/kurse/default.asp", nach: "/kurse" },
   */
  { von: "/default.asp", nach: "/" },
];

/**
 * Uebersetzt die Liste in das Format von next.config.ts.
 *
 * Ausdruecklich 301 und nicht `permanent: true`. Letzteres erzeugt in Next eine
 * 308, und die ist zwar fuer Google gleichwertig, wird aber von aelteren
 * Crawlern und manchen SEO-Werkzeugen nicht als dauerhafte Umleitung gewertet.
 * Hier geht es um die Adressen einer ASP-Seite; was sie einliest, ist nicht
 * bekannt. 301 ist der Standard, den alles versteht, und bei einem reinen
 * Seitenumzug per GET gibt es keinen Grund fuer 308.
 */
export function alsNextRedirects(liste: Weiterleitung[] = WEITERLEITUNGEN) {
  // Eintraege mit Query zuerst: Next nimmt die erste passende Regel. Stuende
  // der Auffang-Eintrag fuer /kurse/default.asp vorne, kaeme die Regel fuer
  // ?nav=23 nie zum Zug und alle Kursarten landeten auf derselben Seite. Die
  // Sortierung hier erspart es, beim Eintragen daran zu denken.
  //
  // Die Liste ist ein Parameter, damit sich Sortierung und Umrechnung nach
  // `has` pruefen lassen, ohne Testeintraege in die echte Karte zu schreiben.
  const sortiert = [...liste].sort(
    (a, b) => (b.query ? 1 : 0) - (a.query ? 1 : 0),
  );

  const pfade = sortiert.map((eintrag) => ({
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

  return [...hostWeiterleitung(), ...pfade];
}

/**
 * Zwingt alle Aufrufe auf den kanonischen Hostnamen.
 *
 * Steht VOR den Pfadregeln, damit eine alte Adresse auf dem falschen Host in
 * einem Schritt auf den richtigen Host kommt und die Pfadregel danach greift.
 *
 * `:pfad*` uebernimmt den ganzen Pfad, die Query haengt Next von selbst an.
 * Localhost ist nicht betroffen: die Regel greift nur, wenn der Host exakt der
 * zweite Name ist.
 *
 * Auf Vercel laesst sich dasselbe im Dashboard einstellen. Beides zusammen ist
 * unschaedlich, solange beide in dieselbe Richtung zeigen — zeigen sie
 * gegeneinander, entsteht eine Schleife. Diese Regel hier ist die
 * verbindliche, weil sie im Code steht und beim Hosterwechsel mitgeht.
 */
export function hostWeiterleitung() {
  return [
    {
      source: "/:pfad*",
      has: [{ type: "host" as const, value: ZWEITER_HOST }],
      destination: `https://${KANONISCHER_HOST}/:pfad*`,
      statusCode: 301 as const,
    },
  ];
}
