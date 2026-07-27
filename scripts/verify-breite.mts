import "dotenv/config";
import { devices, webkit } from "@playwright/test";

/**
 * Prueft jede oeffentliche Seite auf waagrechten Ueberhang — in WebKit.
 *
 * Warum WebKit und nicht die Geraetesimulation von Chrome: der gemeldete
 * Fehler auf dem iPhone (Kopfleiste, Fusszeile und AGB-Block enden bei rund
 * 71 % der Fensterbreite) war in Chrome nicht zu sehen. WebKit ist dieselbe
 * Engine wie Safari, und nur dort zeigt sich, was Safari wirklich rechnet.
 *
 * Die Ursache eines solchen Fehlers ist immer dieselbe: ein einziges Element
 * ist breiter als das Fenster. Die Seite waechst dadurch in der Scrollbreite,
 * aber alles, was sich auf die Breite des Containers streckt — Kopfzeile,
 * Fusszeile, jeder Block mit vollflaechigem Hintergrund — bleibt bei
 * Fensterbreite stehen. Der Hintergrund endet dann mitten im Bild.
 *
 * Deshalb meldet dieses Skript nicht nur, DASS es Ueberhang gibt, sondern
 * welches Element ihn verursacht.
 *
 * Aufruf: pnpm verify:breite   (Server muss laufen)
 */

const BASIS = process.env.PRUEF_BASIS ?? "http://localhost:3000";

/** Alle oeffentlichen Routen. Der Buchungsablauf braucht eine Kurs-ID. */
const ROUTEN = [
  "/",
  "/kurse",
  "/kurse/vku",
  "/kursdaten",
  "/fahrstunden",
  "/fuehrerausweis",
  "/vorschriften/auto",
  "/vorschriften/motorrad",
  "/boegle",
  "/galerie",
  "/kontakt",
  "/agb",
  "/datenschutz",
  "/impressum",
];

let fehler = 0;

function pruefe(bedingung: boolean, text: string, ist?: string) {
  console.log(
    `  ${bedingung ? "OK   " : "FEHLT"} ${text}${bedingung || !ist ? "" : ` -> ${ist}`}`,
  );
  if (!bedingung) fehler += 1;
}

type Ueberhang = {
  scrollbreite: number;
  fenster: number;
  taeter: { pfad: string; breite: number; rechts: number; text: string }[];
};

async function main() {
  const browser = await webkit.launch();
  const kontext = await browser.newContext({
    ...devices["iPhone 14"],
    locale: "de-CH",
  });
  const seite = await kontext.newPage();

  // Je eine Kurs-ID fuer den Buchungsablauf und fuer die Warteliste. Beide
  // Ansichten leben unter derselben Adresse und sehen voellig verschieden aus,
  // also muessen beide geprueft werden.
  const kursSeite = await (await kontext.request.get(`${BASIS}/kursdaten`)).text();
  const kursIds = [
    ...new Set(
      [...kursSeite.matchAll(/\/anmeldung\/([a-z0-9-]+)/g)].map((t) => t[1]),
    ),
  ];
  const routen = [...ROUTEN, ...kursIds.map((id) => `/anmeldung/${id}`)];
  if (kursIds.length === 0) {
    console.log("  Hinweis: kein Kurs gefunden, Anmeldung übersprungen.");
  }

  for (const route of routen) {
    const antwort = await seite.goto(`${BASIS}${route}`, {
      waitUntil: "load",
    });
    if (!antwort || antwort.status() >= 400) {
      pruefe(false, `${route} lädt`, `${antwort?.status()}`);
      continue;
    }
    await seite.waitForTimeout(150);

    const messung = (await seite.evaluate(`(() => {
      var fenster = document.documentElement.clientWidth;
      var taeter = [];
      function beschreibe(el) {
        var pfad = el.tagName.toLowerCase();
        if (el.id) pfad += "#" + el.id;
        if (el.className && typeof el.className === "string") {
          pfad += "." + el.className.trim().split(/\\s+/).slice(0, 4).join(".");
        }
        return pfad.slice(0, 120);
      }
      document.querySelectorAll("body *").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;

        // Fall 1: der Kasten selbst ragt hinaus.
        // Ein Toleranzpixel: gerundete Layouts melden sonst Rauschen.
        if (r.right > fenster + 1) {
          // Nur das aeusserste Element je Kette melden, sonst steht die ganze
          // Ahnenreihe in der Liste.
          if (el.parentElement && el.parentElement.getBoundingClientRect().right > fenster + 1) return;
          taeter.push({
            pfad: beschreibe(el),
            breite: Math.round(r.width),
            rechts: Math.round(r.right),
            text: (el.textContent || "").trim().slice(0, 40)
          });
          return;
        }

        // Fall 2: der Kasten passt, sein Inhalt nicht. Das ist der Fall bei
        // einem langen Wort ohne Trennmoeglichkeit — eine URL, eine
        // E-Mail-Adresse. Der Kasten meldet dann die richtige Breite, und
        // trotzdem scrollt die Seite waagrecht.
        var stil = getComputedStyle(el);
        if (stil.overflowX !== "visible") return;
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
          taeter.push({
            pfad: beschreibe(el) + " (Inhalt)",
            breite: el.scrollWidth,
            rechts: Math.round(r.left) + el.scrollWidth,
            text: (el.textContent || "").trim().slice(0, 40)
          });
        }
      });
      return {
        scrollbreite: document.documentElement.scrollWidth,
        fenster: fenster,
        taeter: taeter.slice(0, 5)
      };
    })()`)) as Ueberhang;

    const ueberhang = messung.scrollbreite - messung.fenster;
    pruefe(
      ueberhang <= 0 && messung.taeter.length === 0,
      `${route} passt ins Fenster`,
      ueberhang > 0
        ? `${ueberhang}px Überhang · ${messung.taeter
            .map((t) => `${t.pfad} (${t.breite}px)`)
            .join(" · ")}`
        : messung.taeter.map((t) => `${t.pfad} (${t.breite}px)`).join(" · "),
    );
  }

  await browser.close();

  console.log("");
  if (fehler > 0) {
    console.error(`${fehler} Seite(n) mit Überhang.`);
    process.exit(1);
  }
  console.log("Keine Seite ist breiter als das Fenster.");
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
