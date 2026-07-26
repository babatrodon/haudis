import { execSync } from "node:child_process";

/**
 * Setzt die Demodaten vor jedem Testlauf zurueck.
 *
 * prisma/seed-demo.ts loescht Termine und Buchungen jedes Demokurses und legt
 * sie neu an. Damit startet jeder Lauf beim selben Stand: der gruene Kurs bei
 * 5 von 12, der rote voll, der Weekend-Kurs mit ausgeschoepftem
 * Fruehbucherrabatt. Ohne diesen Schritt haengt das Ergebnis davon ab, wie oft
 * die Tests vorher liefen.
 */
export default function globalSetup() {
  console.log("[e2e] Demodaten werden zurueckgesetzt ...");
  execSync("pnpm db:seed:demo", { stdio: "inherit" });
}
