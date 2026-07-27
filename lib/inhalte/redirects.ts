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

/**
 * Die Bereiche der alten Seite mit ihrer nav-Nummer und ihrem neuen Ziel.
 *
 * Quelle: die Navigation der alten Seite, geliefert am 27.07.2026. Daraus
 * entstehen je zwei Regeln — eine mit nav und ein Auffang ohne, weil ein
 * verirrter Link die Query weglassen kann.
 *
 * ZUM EINTRAG "anmeldung"
 *
 * Auf der alten Seite heisst der Bereich "Anmeldung" und zeigt Kursdaten mit
 * Anmeldemoeglichkeit. In der neuen Anwendung ist das `/kursdaten`.
 * NICHT `/anmeldung/[courseId]`: das ist der Buchungsablauf fuer einen
 * einzelnen Kurs und braucht eine Kurs-ID. Ein Link ohne ID liefe dort ins
 * Leere, und mit einer erfundenen ID auf den falschen Kurs.
 */
const BEREICHE: { ordner: string; nav: string; ziel: string }[] = [
  { ordner: "/weg", nav: "2", ziel: "/fuehrerausweis" },
  { ordner: "/kursangebot", nav: "3", ziel: "/kurse" },
  { ordner: "/anmeldung", nav: "4", ziel: "/kursdaten" },
  { ordner: "/vorschriften_auto", nav: "5", ziel: "/vorschriften/auto" },
  { ordner: "/vorschriften_motorrad", nav: "6", ziel: "/vorschriften/motorrad" },
  { ordner: "/boegle", nav: "7", ziel: "/boegle" },
  { ordner: "/kontakt", nav: "10", ziel: "/kontakt" },
  { ordner: "/bilder", nav: "11", ziel: "/galerie" },
];

export const WEITERLEITUNGEN: Weiterleitung[] = [
  // Je Bereich die genaue nav-Regel und der Auffang ohne Query. Die
  // Reihenfolge im Array spielt keine Rolle, alsNextRedirects sortiert.
  ...BEREICHE.flatMap((bereich) => [
    {
      von: `${bereich.ordner}/default.asp`,
      nach: bereich.ziel,
      query: { nav: bereich.nav },
    },
    { von: `${bereich.ordner}/default.asp`, nach: bereich.ziel },
  ]),

  // Startseite der alten Anwendung.
  { von: "/default.asp", nach: "/" },

  /**
   * Auffang fuer alles Uebrige.
   *
   * Die Liste oben stammt aus der Navigation, nicht aus der Search Console.
   * Es kann also indexierte Adressen geben, die im Menue nie standen — eine
   * alte Aktionsseite, ein Direktlink aus einem Inserat. Die landen hier
   * statt auf einem 404.
   *
   * Die Startseite ist nicht das beste Ziel, aber das ehrlichste: welche neue
   * Seite gemeint war, weiss niemand. Ein 404 verliert die Signale ganz, eine
   * geratene Zuordnung schickt Leute auf die falsche Seite.
   *
   * Steht dank `:bereich` automatisch zuletzt, siehe alsNextRedirects.
   */
  { von: "/:bereich/default.asp", nach: "/" },
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
  /**
   * Next nimmt die erste passende Regel, also entscheidet die Reihenfolge.
   * Drei Stufen, von genau nach allgemein:
   *
   *   0  mit Query   /kontakt/default.asp?nav=10
   *   1  fester Pfad /kontakt/default.asp
   *   2  Platzhalter /:bereich/default.asp
   *
   * Stuende Stufe 1 vor Stufe 0, landete jeder nav-Wert eines Bereichs auf
   * demselben Ziel. Stuende Stufe 2 vorne, fingen sie alle ab und die ganze
   * Karte waere wirkungslos — jede alte Adresse ginge auf die Startseite.
   *
   * Der Platzhalter wird an `:` erkannt statt an einer Markierung im Eintrag:
   * so kann man ihn nicht vergessen zu setzen. Innerhalb einer Stufe bleibt
   * die Reihenfolge des Arrays erhalten, weil Array.sort stabil ist.
   *
   * Die Liste ist ein Parameter, damit sich Sortierung und Umrechnung nach
   * `has` pruefen lassen, ohne Testeintraege in die echte Karte zu schreiben.
   */
  const stufe = (eintrag: Weiterleitung) =>
    eintrag.query ? 0 : eintrag.von.includes(":") ? 2 : 1;

  const sortiert = [...liste].sort((a, b) => stufe(a) - stufe(b));

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
