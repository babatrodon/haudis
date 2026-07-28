import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";

/**
 * Baut Favicon, Tab-Symbol und iOS-Symbol aus dem Schriftlogo.
 *
 * WARUM EIN SKRIPT UND NICHT VON HAND
 *
 * Die drei Dateien sind Ausschnitte desselben Bildes. Der Ausschnitt ist am
 * Original ausgemessen und nicht mit dem Auge zu treffen: das H haengt links
 * am Schriftzug, rechts daneben beginnt das a, und der rote Schwung streift
 * die untere rechte Ecke seines Kastens. Wer das Logo austauscht, misst neu
 * und aendert die vier Zahlen unten, statt in einem Bildprogramm zu suchen.
 *
 * Gemessen an public/haudis-logo.png (1600x1073): das H ist die
 * zusammenhaengende Flaeche links oben, x 6-404, y 326-774. Der Kasten wird
 * unten bei 720 abgeschnitten, weil ab 721 der Schwung hineinragt; das kostet
 * die unterste Spitze des H und drei Prozent seiner Flaeche.
 *
 * Der Buchstabe steht weiss auf dem Rot des Logos. Gelb mit schwarzem H waere
 * die zweite Moeglichkeit, ist aber im Tab-Balken schlechter zu unterscheiden
 * als die Rot-Flaeche.
 *
 * Aufruf: pnpm symbole:bauen
 */

/** Das H im Bild, in Bildpunkten des Originals. */
const BILD_BREITE = 1600;
const AUSSCHNITT = { x: 6, y: 326, breite: 398, hoehe: 394 };

/** Rot des Logos, aus der Datei abgelesen. */
const ROT = "#e2385a";

/**
 * Je Datei: Kantenlaenge und Anteil, den der Buchstabe davon einnimmt.
 * Das iOS-Symbol bekommt mehr Luft, weil iOS die Ecken abrundet.
 */
const DATEIEN = [
  { pfad: "app/icon.png", groesse: 512, anteil: 0.72 },
  { pfad: "app/apple-icon.png", groesse: 180, anteil: 0.62 },
];

/** Groessen im .ico. Klein heisst weniger Luft, sonst zerfaellt der Strich. */
const ICO = [
  { groesse: 16, anteil: 0.82 },
  { groesse: 32, anteil: 0.8 },
  { groesse: 48, anteil: 0.78 },
  { groesse: 256, anteil: 0.72 },
];

const svg = readFileSync("public/haudis-logo-weiss.svg", "utf8");
const quelle =
  "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

function kachel(groesse: number, anteil: number) {
  const s = (groesse * anteil) / Math.max(AUSSCHNITT.breite, AUSSCHNITT.hoehe);
  return `<body style="margin:0"><div style="width:${groesse}px;height:${groesse}px;background:${ROT};display:flex;align-items:center;justify-content:center;overflow:hidden">
    <div style="width:${AUSSCHNITT.breite * s}px;height:${AUSSCHNITT.hoehe * s}px;overflow:hidden;position:relative;flex:none">
      <img src="${quelle}" style="position:absolute;width:${BILD_BREITE * s}px;left:${-AUSSCHNITT.x * s}px;top:${-AUSSCHNITT.y * s}px">
    </div></div></body>`;
}

/**
 * Chromium liefert ein deckendes Bild ohne Alphakanal (Farbtyp 2). Der
 * Bilddekoder von Next verlangt in einem .ico aber RGBA und bricht sonst den
 * Seitenaufbau ab, nicht nur das Symbol. Deshalb wird der Alphakanal hier
 * ergaenzt: entpacken, je Zeile den Filterbyte lesen, jedem Bildpunkt 255
 * anhaengen, neu packen. Nur Farbtyp 2 kommt vor, andere Faelle waeren
 * ungenutzter Code.
 */
function alphaErgaenzen(png: Buffer) {
  const stuecke: { typ: string; daten: Buffer }[] = [];
  let versatz = 8;
  while (versatz < png.length) {
    const laenge = png.readUInt32BE(versatz);
    stuecke.push({
      typ: png.toString("ascii", versatz + 4, versatz + 8),
      daten: png.subarray(versatz + 8, versatz + 8 + laenge),
    });
    versatz += 12 + laenge;
  }
  const kopf = stuecke.find((s) => s.typ === "IHDR")!.daten;
  if (kopf[9] === 6) return png;

  const breite = kopf.readUInt32BE(0);
  const hoehe = kopf.readUInt32BE(4);
  const roh = zlib.inflateSync(
    Buffer.concat(stuecke.filter((s) => s.typ === "IDAT").map((s) => s.daten)),
  );

  const neu = Buffer.alloc(hoehe * (1 + breite * 4));
  for (let y = 0; y < hoehe; y++) {
    const alt = y * (1 + breite * 3);
    const ziel = y * (1 + breite * 4);
    neu[ziel] = roh[alt];
    for (let x = 0; x < breite; x++) {
      roh.copy(neu, ziel + 1 + x * 4, alt + 1 + x * 3, alt + 4 + x * 3);
      neu[ziel + 4 + x * 4] = 255;
    }
  }

  const ihdr = Buffer.from(kopf);
  ihdr[9] = 6;
  return Buffer.concat([
    png.subarray(0, 8),
    stueck("IHDR", ihdr),
    stueck("IDAT", zlib.deflateSync(neu)),
    stueck("IEND", Buffer.alloc(0)),
  ]);
}

/** Ein PNG-Stueck mit Laenge, Typ und CRC. */
function stueck(typ: string, daten: Buffer) {
  const laenge = Buffer.alloc(4);
  laenge.writeUInt32BE(daten.length);
  const inhalt = Buffer.concat([Buffer.from(typ, "ascii"), daten]);
  const pruef = Buffer.alloc(4);
  pruef.writeUInt32BE(crc32(inhalt) >>> 0);
  return Buffer.concat([laenge, inhalt, pruef]);
}

const CRC_TABELLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(daten: Buffer) {
  let c = 0xffffffff;
  for (const byte of daten) c = CRC_TABELLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

/**
 * .ico mit PNG-Eintraegen. Der Kopf ist 6 Bytes, danach je Groesse 16 Bytes
 * Verzeichnis, danach die Bilder. 0 im Groessenfeld heisst 256.
 */
function icoBauen(bilder: { groesse: number; daten: Buffer }[]) {
  const kopf = Buffer.alloc(6);
  kopf.writeUInt16LE(0, 0);
  kopf.writeUInt16LE(1, 2);
  kopf.writeUInt16LE(bilder.length, 4);

  let versatz = 6 + bilder.length * 16;
  const verzeichnis = bilder.map((b) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(b.groesse >= 256 ? 0 : b.groesse, 0);
    e.writeUInt8(b.groesse >= 256 ? 0 : b.groesse, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(b.daten.length, 8);
    e.writeUInt32LE(versatz, 12);
    versatz += b.daten.length;
    return e;
  });

  return Buffer.concat([kopf, ...verzeichnis, ...bilder.map((b) => b.daten)]);
}

async function main() {
  const browser = await chromium.launch();
  const seite = await browser.newPage({ viewport: { width: 600, height: 600 } });

  async function malen(groesse: number, anteil: number) {
    await seite.setViewportSize({ width: groesse, height: groesse });
    await seite.setContent(kachel(groesse, anteil));
    return seite.screenshot({ clip: { x: 0, y: 0, width: groesse, height: groesse } });
  }

  for (const { pfad, groesse, anteil } of DATEIEN) {
    writeFileSync(pfad, await malen(groesse, anteil));
    console.log(`  ${pfad}  ${groesse}x${groesse}`);
  }

  const bilder = [];
  for (const { groesse, anteil } of ICO) {
    bilder.push({ groesse, daten: alphaErgaenzen(await malen(groesse, anteil)) });
  }
  writeFileSync("app/favicon.ico", icoBauen(bilder));
  console.log(`  app/favicon.ico  ${ICO.map((i) => i.groesse).join(", ")}`);

  await browser.close();
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
