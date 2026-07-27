import "dotenv/config";
import {
  KANONISCHER_HOST,
  WEITERLEITUNGEN,
  alsNextRedirects,
} from "../lib/inhalte/redirects";

/**
 * Prueft jede Weiterleitung vom alten haudi.ch gegen die laufende Anwendung.
 *
 * Zwei Dinge muessen stimmen, und beide fallen ohne Pruefung erst auf, wenn
 * jemand aus einem Suchergebnis kommt:
 *
 *   1. Die alte Adresse antwortet mit 301 auf das erwartete Ziel. Ein 404
 *      verliert die Signale der alten Seite, ein 200 hiesse, die Regel greift
 *      gar nicht.
 *   2. Das Ziel antwortet mit 200. Eine 301 auf eine Seite, die es nicht gibt,
 *      ist schlimmer als keine Weiterleitung: sie sieht richtig aus.
 *
 * Zusaetzlich wird die Reihenfolge geprueft. Sie ist der subtile Teil: steht
 * der Platzhalter zu weit vorne, gehen alle alten Adressen auf die Startseite,
 * und jede einzelne Pruefung unten wuerde trotzdem eine 301 sehen.
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

async function main() {
  console.log(`Basis: ${BASIS}\n`);
  await reihenfolgePruefen();
  await weiterleitungenPruefen();

  console.log("");
  if (fehler > 0) {
    console.error(`${fehler} Pruefung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log(
    `Alle ${WEITERLEITUNGEN.length} Weiterleitungen zeigen mit 301 auf eine Seite, die antwortet.`,
  );
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
