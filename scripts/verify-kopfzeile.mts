import { chromium, webkit, devices } from "@playwright/test";

/**
 * Prueft das gelbe Band in der Kopfzeile.
 *
 * WARUM DAS EINE PRUEFUNG BRAUCHT
 *
 * Das Band laeuft von Kante zu Kante hinter dem Logo durch. Von oben nach
 * unten liegen: der rote Schriftzug, darin das Band auf seinem unteren
 * Drittel, darunter der gelbe Untertitel "Fahrschule Verkehrszentrum" auf
 * freiem Grund (Bild der alten Kopfzeile, 28.07.2026).
 *
 * Zwei Kanten begrenzen die Lage. Rutscht das Band nach unten, kommt es auf
 * den Untertitel zu liegen — der ist selbst gelb, und von der Schrift bliebe
 * nur die dunkle Kontur. Rutscht es nach oben, teilt es die
 * Navigationsbeschriftungen waagrecht. Ausloesen wuerde beides keine
 * Aenderung am Band, sondern eine an etwas anderem: eine andere Logohoehe,
 * ein anderer Innenabstand, ein zusaetzlicher Knopf. Deshalb wird hier nicht
 * der CSS-Wert geprueft, sondern die Geometrie im Browser.
 *
 * Dazu kommt die Schichtung: bekaeme das Logo einen deckenden Grund, waere
 * das Band an dieser Stelle unterbrochen statt dahinter.
 *
 * Die Grenzen im Bild stammen aus dem Bild selbst, zeilenweise ausgezaehlt am
 * Original public/haudis-logo.png (993x586).
 *
 * Aufruf: pnpm verify:kopfzeile   (Server muss laufen)
 */

const BASIS = process.env.PRUEF_BASIS ?? "http://localhost:3000";

/**
 * Anteil der Bildhoehe, ab dem das untere Drittel des roten Schriftzugs
 * beginnt. Hoeher darf das Band nicht ansetzen, sonst kreuzt es die Mitte des
 * Schriftzugs statt seines Fusses.
 */
const SCHRIFTZUG_DRITTEL = 0.45;

/**
 * Anteil der Bildhoehe, bis zu dem der rote Schriftzug reicht (Hauptkoerper
 * rechts des Schwungs). Bis dorthin muss das Band hineinreichen, sonst kreuzt
 * es den Schriftzug gar nicht.
 */
const SCHRIFTZUG_BIS = 0.68;

/** Anteil der Bildhoehe, ab dem der gelbe Untertitel beginnt. */
const UNTERTITEL_AB = 0.715;

/**
 * Kleinste Logohoehe in Pixeln. Der Untertitel belegt gut ein Fuenftel der
 * Bildhoehe und traegt darin zwei Zeilen; darunter sind sie nur noch zu
 * erahnen.
 */
const LOGO_MIN = 72;

/** Mindestabstand zwischen Band und Bedienelementen, in Pixeln. */
const ABSTAND_MIN = 4;

/** Mindestabstand zwischen Logo und dem naechsten Knopf. */
const LOGO_ABSTAND_MIN = 16;

const AUSWERTUNG = `(() => {
  const zeile = document.querySelector("body > header > div:nth-of-type(2)");
  const r = zeile.getBoundingClientRect();
  const bild = zeile.querySelector("img");
  const logo = bild.getBoundingClientRect();
  const feldEl = bild.closest("a");
  const feldGrund = getComputedStyle(feldEl).backgroundColor;
  const bandEl = zeile.querySelector(':scope > [aria-hidden="true"]');
  const band = bandEl.getBoundingClientRect();

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
  // das ist die Kante, unter der das Band bleiben muss.
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
    zeilenBreite: r.width,
    logoOben: logo.top - r.top,
    logoHoehe: logo.height,
    logoRechts: logo.right,
    feldGrund: feldGrund,
    band: [band.top - r.top, band.bottom - r.top],
    bandKanten: [band.left - r.left, band.right - r.left],
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
  zeilenBreite: number;
  logoOben: number;
  logoHoehe: number;
  logoRechts: number;
  feldGrund: string;
  band: [number, number];
  bandKanten: [number, number];
  bedienUnten: number;
  bedienLinks: number | null;
  glyphenUnten: number | null;
};

/** Alphakanal eines rgb()- oder rgba()-Werts des Browsers. */
function deckung(farbe: string): number {
  const teile = farbe.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
  return teile[3] ?? 1;
}

async function pruefeBreite(
  seite: { evaluate: (s: string) => Promise<unknown> },
  name: string,
) {
  console.log(`\n${name}`);
  const m = (await seite.evaluate(AUSWERTUNG)) as Mass;

  const drittelAb = m.logoOben + SCHRIFTZUG_DRITTEL * m.logoHoehe;
  const schriftzugBis = m.logoOben + SCHRIFTZUG_BIS * m.logoHoehe;
  const untertitelAb = m.logoOben + UNTERTITEL_AB * m.logoHoehe;
  const [oben, unten] = m.band;
  const [bandLinks, bandRechts] = m.bandKanten;

  pruefe(unten - oben > 0, "das Band ist sichtbar", `${(unten - oben).toFixed(1)}px dick`);

  pruefe(
    bandLinks <= 0.5 && bandRechts >= m.zeilenBreite - 0.5,
    "das Band laeuft von Kante zu Kante",
    `${bandLinks.toFixed(1)}-${bandRechts.toFixed(1)} von ${m.zeilenBreite.toFixed(1)}`,
  );

  // Ohne diese Pruefung wuerde ein Grund hinter dem Logo das Band
  // unterbrechen, statt es dahinter durchlaufen zu lassen.
  pruefe(
    deckung(m.feldGrund) === 0,
    "das Logo hat keinen Grund, das Band laeuft dahinter durch",
    `Grund ${m.feldGrund}`,
  );

  pruefe(
    oben >= drittelAb && oben < schriftzugBis,
    "das Band kreuzt das untere Drittel des roten Schriftzugs",
    `Band beginnt bei ${oben.toFixed(1)}, unteres Drittel ${drittelAb.toFixed(1)}-${schriftzugBis.toFixed(1)}`,
  );

  // Der Untertitel ist selbst gelb: auf dem Band bliebe nur seine Kontur.
  pruefe(
    unten <= untertitelAb,
    "das Band bleibt ueber dem gelben Untertitel",
    `Band endet bei ${unten.toFixed(1)}, Untertitel beginnt bei ${untertitelAb.toFixed(1)}`,
  );

  pruefe(
    m.logoHoehe >= LOGO_MIN,
    `das Logo ist mindestens ${LOGO_MIN}px hoch, der Untertitel also lesbar`,
    `${m.logoHoehe.toFixed(1)}px`,
  );

  if (m.bedienLinks !== null) {
    pruefe(
      m.bedienLinks - m.logoRechts >= LOGO_ABSTAND_MIN,
      `zwischen Logo und Bedienelementen bleiben ${LOGO_ABSTAND_MIN}px`,
      `${(m.bedienLinks - m.logoRechts).toFixed(1)}px`,
    );
  }

  pruefe(
    oben >= m.bedienUnten + ABSTAND_MIN,
    "das Band laeuft unter den Knoepfen durch, nicht hinter ihnen",
    `Band beginnt bei ${oben.toFixed(1)}, tiefstes Bedienelement endet bei ${m.bedienUnten.toFixed(1)}`,
  );

  if (m.glyphenUnten !== null) {
    pruefe(
      oben >= m.glyphenUnten + ABSTAND_MIN,
      "das Band laeuft unter den Beschriftungen durch, nicht hindurch",
      `Band beginnt bei ${oben.toFixed(1)}, Buchstaben enden bei ${m.glyphenUnten.toFixed(1)}`,
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
    "Das Band laeuft hinter dem Schriftzug durch und laesst den Untertitel frei.",
  );
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
