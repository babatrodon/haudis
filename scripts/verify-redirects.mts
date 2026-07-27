import "dotenv/config";
import {
  KANONISCHER_HOST,
  WEITERLEITUNGEN,
  alsNextRedirects,
} from "../lib/inhalte/redirects";

/**
 * Prueft, welche Adresse jede Seite als die richtige ausgibt.
 *
 * Zwei Mechanismen beantworten diese Frage, und beide gehoeren zusammen:
 * die Weiterleitungen vom alten haudi.ch und das canonical auf den neuen
 * Seiten. Stimmt eines von beiden nicht, verteilen sich die Signale der alten
 * Seite auf mehrere Adressen — bei einer Fahrschule, die von der lokalen
 * Suche lebt, der teuerste stille Fehler.
 *
 * WEITERLEITUNGEN
 *
 *   1. Die alte Adresse antwortet mit 301 auf das erwartete Ziel. Ein 404
 *      verliert die Signale der alten Seite, ein 200 hiesse, die Regel greift
 *      gar nicht.
 *   2. Das Ziel antwortet mit 200. Eine 301 auf eine Seite, die es nicht gibt,
 *      ist schlimmer als keine Weiterleitung: sie sieht richtig aus.
 *   3. Die Reihenfolge stimmt. Das ist der subtile Teil: steht der Platzhalter
 *      zu weit vorne, gehen alle alten Adressen auf die Startseite, und jede
 *      einzelne Pruefung wuerde trotzdem eine 301 sehen.
 *
 * CANONICAL
 *
 * app/(public)/layout.tsx setzt `alternates.canonical` auf "./" — Next loest
 * das gegen den vollstaendigen aktuellen Pfad auf, nicht nach den Regeln
 * relativer URLs. Verschachtelte Seiten zeigen deshalb auf sich selbst und
 * nicht auf ihren Elternpfad.
 *
 * Genau das wird hier geprueft, und zwar an verschachtelten Routen. Wuerde
 * "./" je auf das Elternsegment aufloesen — durch ein Next-Update oder weil
 * jemand die Zeile im Layout anfasst —, zeigten alle Kursseiten auf /kurse und
 * fielen aus dem Index. Eine einstufige Seite wie /kontakt wuerde denselben
 * Fehler nicht zeigen.
 *
 * Aufruf: pnpm verify:redirects   (Server muss laufen)
 */

const BASIS = process.env.PRUEF_BASIS ?? "http://localhost:3000";

let fehler = 0;

function pruefe(bedingung: boolean, text: string, ist?: string) {
  console.log(
    `  ${bedingung ? "OK   " : "FEHLT"} ${text}${bedingung || !ist ? "" : ` -> ${ist}`}`,
  );
  if (!bedingung) fehler += 1;
}

/** Baut die alte Adresse inklusive Query. */
function alteAdresse(eintrag: (typeof WEITERLEITUNGEN)[number]): string {
  // Platzhalter lassen sich nicht woertlich aufrufen. Ein erfundener Bereich
  // ist hier genau richtig: er steht fuer die indexierten Adressen, die nicht
  // in der Navigation standen.
  const pfad = eintrag.von.replace(/:[^/]+/g, "eine-alte-seite");
  const query = eintrag.query
    ? `?${new URLSearchParams(eintrag.query).toString()}`
    : "";
  return `${pfad}${query}`;
}

async function reihenfolgePruefen() {
  console.log("Reihenfolge der Regeln");

  const regeln = alsNextRedirects();
  // Die erste Regel ist die Host-Kanonisierung, danach die Pfadregeln.
  const pfade = regeln.slice(1);

  const platzhalterAb = pfade.findIndex((r) => r.source.includes(":"));
  const letzteGenaue = pfade.reduce(
    (letzte, regel, index) => (regel.source.includes(":") ? letzte : index),
    -1,
  );
  pruefe(
    platzhalterAb === -1 || platzhalterAb > letzteGenaue,
    "der Platzhalter steht hinter allen festen Pfaden",
    `Platzhalter bei ${platzhalterAb}, letzter fester Pfad bei ${letzteGenaue}`,
  );

  const letzteMitQuery = pfade.reduce(
    (letzte, regel, index) => ("has" in regel ? index : letzte),
    -1,
  );
  const ersteOhneQuery = pfade.findIndex((r) => !("has" in r));
  pruefe(
    ersteOhneQuery === -1 || ersteOhneQuery > letzteMitQuery,
    "Regeln mit nav stehen vor den Auffang-Regeln",
    `erste ohne Query bei ${ersteOhneQuery}, letzte mit Query bei ${letzteMitQuery}`,
  );

  pruefe(
    regeln.every((r) => r.statusCode === 301),
    "alle Regeln liefern 301",
  );

  pruefe(
    regeln[0].source === "/:pfad*" &&
      regeln[0].destination.includes(KANONISCHER_HOST),
    `die Host-Regel auf ${KANONISCHER_HOST} steht ganz vorne`,
    regeln[0].destination,
  );
}

async function weiterleitungenPruefen() {
  console.log("Weiterleitungen");

  for (const eintrag of WEITERLEITUNGEN) {
    const alt = alteAdresse(eintrag);

    const antwort = await fetch(`${BASIS}${alt}`, { redirect: "manual" });
    const ziel = antwort.headers.get("location");

    if (antwort.status !== 301) {
      pruefe(false, `${alt} antwortet mit 301`, `${antwort.status}`);
      continue;
    }

    // Next liefert das Ziel je nach Regel absolut oder relativ.
    const zielPfad = ziel ? new URL(ziel, BASIS).pathname : "";
    if (zielPfad !== eintrag.nach) {
      pruefe(false, `${alt} zeigt auf ${eintrag.nach}`, zielPfad || "kein Ziel");
      continue;
    }

    const seite = await fetch(`${BASIS}${eintrag.nach}`);
    pruefe(
      seite.status === 200,
      `${alt} -> ${eintrag.nach} (Seite antwortet)`,
      `Ziel antwortet mit ${seite.status}`,
    );
  }
}

/**
 * Erwartetes canonical je Route.
 *
 * Die verschachtelten Routen sind der Kern: /kurse/vku muss auf sich selbst
 * zeigen und nicht auf /kurse. Die Query-Varianten daneben zeigen, dass
 * Parameter wegfallen.
 */
const CANONICAL_FAELLE: { route: string; erwartet: string }[] = [
  { route: "/", erwartet: "/" },
  { route: "/kontakt", erwartet: "/kontakt" },

  // Zwei Ebenen: hier faellt auf, wenn "./" auf den Elternpfad aufloest.
  { route: "/kurse/vku", erwartet: "/kurse/vku" },
  { route: "/kurse/btu", erwartet: "/kurse/btu" },
  { route: "/vorschriften/auto", erwartet: "/vorschriften/auto" },
  { route: "/vorschriften/motorrad", erwartet: "/vorschriften/motorrad" },

  /**
   * Gefilterte Kursdaten zeigen auf die ungefilterte Liste, und das ist
   * gewollt: /kursdaten?art=vku enthaelt eine Teilmenge derselben Kurse wie
   * /kursdaten. Zwei Adressen mit weitgehend demselben Inhalt konkurrieren
   * sonst gegeneinander, und keine rankt.
   *
   * Wer das je aendern will, braucht eigene Seiten mit eigenem Text — die
   * Filter selbst gehoeren nicht in den Index.
   */
  { route: "/kursdaten?art=vku", erwartet: "/kursdaten" },
  { route: "/kursdaten?art=nothelfer", erwartet: "/kursdaten" },

  // Kampagnen- und Klick-Parameter duerfen ebenso wenig eine eigene Adresse
  // erzeugen.
  { route: "/fahrstunden?utm_source=inserat", erwartet: "/fahrstunden" },
];

async function canonicalPruefen() {
  console.log("Canonical");

  for (const fall of CANONICAL_FAELLE) {
    const antwort = await fetch(`${BASIS}${fall.route}`);
    if (antwort.status !== 200) {
      pruefe(false, `${fall.route} laedt`, `${antwort.status}`);
      continue;
    }

    const html = await antwort.text();
    const treffer = html.match(
      /<link rel="canonical" href="([^"]*)"/,
    )?.[1];

    if (!treffer) {
      pruefe(false, `${fall.route} hat ein canonical`, "keines gefunden");
      continue;
    }

    const pfad = new URL(treffer, BASIS).pathname;
    pruefe(
      pfad === fall.erwartet,
      `${fall.route} zeigt auf ${fall.erwartet}`,
      pfad,
    );
  }
}

async function main() {
  console.log(`Basis: ${BASIS}\n`);
  await reihenfolgePruefen();
  await weiterleitungenPruefen();
  await canonicalPruefen();

  console.log("");
  if (fehler > 0) {
    console.error(`${fehler} Pruefung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log(
    `Alle ${WEITERLEITUNGEN.length} Weiterleitungen zeigen mit 301 auf eine Seite, ` +
      `die antwortet. ${CANONICAL_FAELLE.length} Routen nennen die richtige ` +
      `kanonische Adresse.`,
  );
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
