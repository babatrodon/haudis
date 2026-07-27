import { chromium, webkit, devices } from "@playwright/test";

/**
 * Prueft den gelben Streifen in der Kopfzeile.
 *
 * WARUM DAS EINE PRUEFUNG BRAUCHT
 *
 * Der Streifen laeuft durch das Logo hindurch, und im Logo ist der Untertitel
 * "Fahrschule Verkehrszentrum" selbst gelb. Rutscht der Streifen dorthin,
 * steht Gelb auf Gelb und vom Untertitel bleibt nur die dunkle Kontur. Das
 * sieht auf einem beilaeufigen Blick nicht kaputt aus — es sieht bloss aus,
 * als waere die Fahrschule namenlos.
 *
 * Ausloesen wuerde das keine Aenderung am Streifen, sondern eine an etwas
 * anderem: eine andere Logohoehe, eine andere Zeilenhoehe, ein zusaetzlicher
 * Knopf, der die Zeile waschsen laesst. Deshalb wird hier nicht der CSS-Wert
 * geprueft, sondern die Geometrie im Browser.
 *
 * Die Grenzen des gelben Untertitels stammen aus dem Bild selbst: er belegt
 * 72,5% bis 93,9% der Bildhoehe (zeilenweise ausgezaehlt am Original
 * public/haudis-logo.png, 993x586).
 *
 * Aufruf: pnpm verify:kopfzeile   (Server muss laufen)
 */

const BASIS = process.env.PRUEF_BASIS ?? "http://localhost:3000";

/** Anteil der Bildhoehe, ab dem der gelbe Untertitel beginnt. */
const UNTERTITEL_AB = 0.725;

/** Mindestabstand zwischen Streifenunterkante und Untertitel, in Pixeln. */
const ABSTAND_MIN = 4;

const AUSWERTUNG = `(() => {
  const zeile = document.querySelector("body > header > div:nth-of-type(2)");
  const r = zeile.getBoundingClientRect();
  const logo = zeile.querySelector("img").getBoundingClientRect();
  const streifen = zeile.querySelector('[aria-hidden="true"]').getBoundingClientRect();
  const link = zeile.querySelector("nav a");
  let glyphenOben = null;
  if (link && link.getBoundingClientRect().width > 0) {
    // Der Bereichskasten ist der Zeilenkasten und enthaelt den Durchschuss.
    // Die Buchstaben selbst stehen im Geviert um die Mitte herum — das ist die
    // Kante, die der Streifen nicht unterschreiten darf.
    const bereich = document.createRange();
    bereich.selectNodeContents(link);
    const t = bereich.getBoundingClientRect();
    const groesse = parseFloat(getComputedStyle(link).fontSize);
    glyphenOben = (t.top + t.bottom) / 2 - groesse / 2 - r.top;
  }
  return {
    logoOben: logo.top - r.top,
    logoHoehe: logo.height,
    streifen: [streifen.top - r.top, streifen.bottom - r.top],
    glyphenOben: glyphenOben,
  };
})()`;

let fehler = 0;

function pruefe(bedingung: boolean, text: string, ist?: string) {
  console.log(
    `  ${bedingung ? "OK   " : "FEHLT"} ${text}${bedingung || !ist ? "" : ` -> ${ist}`}`,
  );
  if (!bedingung) fehler += 1;
}

type Mass = {
  logoOben: number;
  logoHoehe: number;
  streifen: [number, number];
  glyphenOben: number | null;
};

async function pruefeBreite(seite: { evaluate: (s: string) => Promise<unknown> }, name: string) {
  console.log(`\n${name}`);
  const m = (await seite.evaluate(AUSWERTUNG)) as Mass;

  const untertitelAb = m.logoOben + UNTERTITEL_AB * m.logoHoehe;
  const [oben, unten] = m.streifen;

  pruefe(unten - oben > 0, "der Streifen ist sichtbar", `${unten - oben}px hoch`);

  pruefe(
    unten <= untertitelAb - ABSTAND_MIN,
    `der Streifen bleibt ${ABSTAND_MIN}px ueber dem gelben Untertitel`,
    `Streifen endet bei ${unten.toFixed(1)}, Untertitel beginnt bei ${untertitelAb.toFixed(1)}`,
  );

  pruefe(
    unten > m.logoOben,
    "der Streifen kreuzt das Logo (er laeuft nicht darueber hinweg)",
    `Streifen endet bei ${unten.toFixed(1)}, Logo beginnt bei ${m.logoOben.toFixed(1)}`,
  );

  if (m.glyphenOben !== null) {
    pruefe(
      unten <= m.glyphenOben - ABSTAND_MIN / 4,
      "der Streifen laeuft ueber den Beschriftungen durch, nicht hindurch",
      `Streifen endet bei ${unten.toFixed(1)}, Buchstaben beginnen bei ${m.glyphenOben.toFixed(1)}`,
    );
  } else {
    console.log("  —     keine sichtbare Navigation (Menue hinter dem Knopf)");
  }
}

async function main() {
  console.log(`Basis: ${BASIS}`);

  const chrom = await chromium.launch();
  for (const breite of [1440, 1024]) {
    const seite = await chrom.newPage({ viewport: { width: breite, height: 900 } });
    await seite.goto(`${BASIS}/kurse`, { waitUntil: "networkidle" });
    await pruefeBreite(seite, `${breite}px`);
    await seite.close();
  }
  await chrom.close();

  // WebKit bei 390px, aus demselben Grund wie in verify-breite.mts: Safari auf
  // dem iPhone ist der Browser, in dem sich Layoutfehler zuerst zeigen.
  const wk = await webkit.launch();
  const ctx = await wk.newContext(devices["iPhone 14"]);
  const seite = await ctx.newPage();
  await seite.goto(`${BASIS}/kurse`, { waitUntil: "networkidle" });
  await pruefeBreite(seite, "390px (WebKit)");
  await wk.close();

  console.log("");
  if (fehler > 0) {
    console.error(`${fehler} Pruefung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log("Der Streifen kreuzt das Logo und laesst den gelben Untertitel frei.");
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
