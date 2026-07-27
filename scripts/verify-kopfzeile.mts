import { chromium, webkit, devices } from "@playwright/test";

/**
 * Prueft den gelben Streifen in der Kopfzeile und die dunkle Tafel darunter.
 *
 * WARUM DAS EINE PRUEFUNG BRAUCHT
 *
 * Der Streifen liegt an der Unterkante der Kopfzeile und kreuzt das Logo auf
 * der Hoehe des gelben Untertitels "Fahrschule Verkehrszentrum". Der
 * Untertitel ist selbst gelb — laege der Streifen sichtbar hinter ihm, bliebe
 * nur die dunkle Kontur. Lesbar bleibt er, weil das Logo auf einer dunklen
 * Tafel steht und der Streifen dahinter durchlaeuft.
 *
 * Zwei Dinge koennen das unbemerkt zerstoeren: die Tafel verliert ihren
 * dunklen Grund oder ihre Deckung (dann steht Gelb auf Gelb), und das Logo
 * rutscht in der Zeile nach oben (dann kreuzt der Streifen den roten
 * Schriftzug statt des Untertitels, und das H waere durchgestrichen).
 * Ausloesen wuerde das keine Aenderung am Streifen, sondern eine an etwas
 * anderem: eine andere Logohoehe, ein Innenabstand, ein zusaetzlicher Knopf.
 * Deshalb wird hier nicht der CSS-Wert geprueft, sondern die Geometrie im
 * Browser.
 *
 * Die Grenzen im Bild stammen aus dem Bild selbst, zeilenweise ausgezaehlt am
 * Original public/haudis-logo.png (993x586): der rote Schriftzug endet auf
 * 68% der Bildhoehe, der gelbe Untertitel belegt 72,5% bis 95%.
 *
 * Aufruf: pnpm verify:kopfzeile   (Server muss laufen)
 */

const BASIS = process.env.PRUEF_BASIS ?? "http://localhost:3000";

/** Anteil der Bildhoehe, bis zu dem der rote Schriftzug reicht. */
const ROT_BIS = 0.68;

/** Anteil der Bildhoehe, ab dem der gelbe Untertitel beginnt. */
const UNTERTITEL_AB = 0.725;

/** Anteil der Bildhoehe, bis zu dem der gelbe Untertitel reicht. */
const UNTERTITEL_BIS = 0.95;

/**
 * Kleinste Logohoehe in Pixeln. Der Untertitel belegt gut ein Fuenftel der
 * Bildhoehe und traegt darin zwei Zeilen; darunter sind sie nur noch zu
 * erahnen.
 */
const LOGO_MIN = 64;

/** Mindestabstand zwischen Streifen und Bedienelementen, in Pixeln. */
const ABSTAND_MIN = 4;

/** Mindestabstand zwischen Logotafel und dem naechsten Bedienelement. */
const TAFEL_ABSTAND_MIN = 16;

const AUSWERTUNG = `(() => {
  const zeile = document.querySelector("body > header > div:nth-of-type(2)");
  const r = zeile.getBoundingClientRect();
  const bild = zeile.querySelector("img");
  const logo = bild.getBoundingClientRect();
  const tafel = bild.closest("a").getBoundingClientRect();
  const grund = getComputedStyle(bild.closest("a")).backgroundColor;
  const streifen = zeile
    .querySelector(':scope > [aria-hidden="true"]')
    .getBoundingClientRect();

  // Alles, was bedient wird, ausser dem Logo selbst: Menuepunkte, der
  // Probelektion-Knopf, die beiden Symbolknoepfe.
  let bedienUnten = 0;
  let bedienLinks = Infinity;
  for (const el of zeile.querySelectorAll("nav a, a, button")) {
    if (el.contains(bild)) continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    bedienUnten = Math.max(bedienUnten, b.bottom - r.top);
    bedienLinks = Math.min(bedienLinks, b.left);
  }

  // Der Bereichskasten einer Beschriftung ist der Zeilenkasten und enthaelt
  // den Durchschuss. Die Buchstaben stehen im Geviert um die Mitte herum —
  // das ist die Kante, die der Streifen nicht ueberschreiten darf.
  const link = zeile.querySelector("nav a");
  let glyphenUnten = null;
  if (link && link.getBoundingClientRect().width > 0) {
    const bereich = document.createRange();
    bereich.selectNodeContents(link);
    const t = bereich.getBoundingClientRect();
    const groesse = parseFloat(getComputedStyle(link).fontSize);
    glyphenUnten = (t.top + t.bottom) / 2 + groesse / 2 - r.top;
  }

  return {
    zeilenHoehe: r.height,
    logoOben: logo.top - r.top,
    logoHoehe: logo.height,
    tafel: [tafel.left, tafel.right, tafel.top - r.top, tafel.bottom - r.top],
    tafelGrund: grund,
    logoKanten: [logo.left, logo.right],
    streifen: [streifen.top - r.top, streifen.bottom - r.top],
    bedienUnten: bedienUnten,
    bedienLinks: bedienLinks === Infinity ? null : bedienLinks,
    glyphenUnten: glyphenUnten,
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
  zeilenHoehe: number;
  logoOben: number;
  logoHoehe: number;
  tafel: [number, number, number, number];
  tafelGrund: string;
  logoKanten: [number, number];
  streifen: [number, number];
  bedienUnten: number;
  bedienLinks: number | null;
  glyphenUnten: number | null;
};

/** Relative Helligkeit nach WCAG, aus einem rgb()-Wert des Browsers. */
function helligkeit(farbe: string): number {
  const teile = farbe.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255];
  const [r, g, b] = teile.map((wert) => {
    const anteil = wert / 255;
    return anteil <= 0.03928
      ? anteil / 12.92
      : ((anteil + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

async function pruefeBreite(
  seite: { evaluate: (s: string) => Promise<unknown> },
  name: string,
) {
  console.log(`\n${name}`);
  const m = (await seite.evaluate(AUSWERTUNG)) as Mass;

  const rotBis = m.logoOben + ROT_BIS * m.logoHoehe;
  const untertitelAb = m.logoOben + UNTERTITEL_AB * m.logoHoehe;
  const untertitelBis = m.logoOben + UNTERTITEL_BIS * m.logoHoehe;
  const [oben, unten] = m.streifen;
  const [tafelLinks, tafelRechts, , tafelUnten] = m.tafel;
  const [logoLinks, logoRechts] = m.logoKanten;

  pruefe(
    unten - oben > 0,
    "der Streifen ist sichtbar",
    `${(unten - oben).toFixed(1)}px hoch`,
  );

  pruefe(
    Math.abs(unten - m.zeilenHoehe) < 0.5,
    "der Streifen liegt an der Unterkante der Kopfzeile",
    `Streifen endet bei ${unten.toFixed(1)}, Zeile bei ${m.zeilenHoehe.toFixed(1)}`,
  );

  pruefe(
    oben < untertitelBis && unten > untertitelAb,
    "der Streifen kreuzt das Logo auf der Hoehe des Untertitels",
    `Streifen ${oben.toFixed(1)}-${unten.toFixed(1)}, Untertitel ${untertitelAb.toFixed(1)}-${untertitelBis.toFixed(1)}`,
  );

  pruefe(
    oben >= rotBis,
    "der Streifen laesst den roten Schriftzug frei (das H wird nicht gekreuzt)",
    `Streifen beginnt bei ${oben.toFixed(1)}, roter Schriftzug endet bei ${rotBis.toFixed(1)}`,
  );

  // Ohne diese drei steht der gelbe Untertitel auf gelbem Grund.
  pruefe(
    helligkeit(m.tafelGrund) < 0.05,
    "das Logo steht auf einer dunklen Tafel",
    `Grund ${m.tafelGrund}`,
  );

  pruefe(
    tafelLinks <= logoLinks && tafelRechts >= logoRechts,
    "die Tafel reicht ueber die ganze Breite des Logos",
    `Tafel ${tafelLinks.toFixed(1)}-${tafelRechts.toFixed(1)}, Logo ${logoLinks.toFixed(1)}-${logoRechts.toFixed(1)}`,
  );

  pruefe(
    tafelUnten >= unten - 0.5,
    "die Tafel reicht bis unter den Streifen, er laeuft dahinter durch",
    `Tafel endet bei ${tafelUnten.toFixed(1)}, Streifen bei ${unten.toFixed(1)}`,
  );

  pruefe(
    m.logoHoehe >= LOGO_MIN,
    `das Logo ist mindestens ${LOGO_MIN}px hoch, der Untertitel also lesbar`,
    `${m.logoHoehe.toFixed(1)}px`,
  );

  if (m.bedienLinks !== null) {
    pruefe(
      m.bedienLinks - tafelRechts >= TAFEL_ABSTAND_MIN,
      `zwischen Tafel und Bedienelementen bleiben ${TAFEL_ABSTAND_MIN}px`,
      `${(m.bedienLinks - tafelRechts).toFixed(1)}px`,
    );
  }

  pruefe(
    oben >= m.bedienUnten - 0.5,
    "der Streifen liegt unter den Knoepfen, nicht hinter ihnen",
    `Streifen beginnt bei ${oben.toFixed(1)}, tiefstes Bedienelement endet bei ${m.bedienUnten.toFixed(1)}`,
  );

  if (m.glyphenUnten !== null) {
    pruefe(
      oben >= m.glyphenUnten + ABSTAND_MIN,
      "der Streifen laeuft unter den Beschriftungen durch, nicht hindurch",
      `Streifen beginnt bei ${oben.toFixed(1)}, Buchstaben enden bei ${m.glyphenUnten.toFixed(1)}`,
    );
  } else {
    console.log("  —     keine sichtbare Navigation (Menue hinter dem Knopf)");
  }
}

async function main() {
  console.log(`Basis: ${BASIS}`);

  const chrom = await chromium.launch();
  for (const breite of [1440, 1024]) {
    const seite = await chrom.newPage({
      viewport: { width: breite, height: 900 },
    });
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
  console.log(
    "Der Streifen liegt an der Unterkante und kreuzt den Untertitel auf dunklem Grund.",
  );
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
