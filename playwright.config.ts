// Laedt .env, damit Tests und globalSetup dieselbe Datenbank sehen wie die
// Anwendung. Playwright liest .env nicht von sich aus.
import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright fuer den Buchungs-Smoketest (PLAN.md Abschnitt 2:
 * "Der eine Test, der den Client-GAU verhindert").
 *
 * Getestet wird gegen den Produktionsbuild, nicht gegen den Entwicklungsserver.
 * Server Actions, Caching und Weiterleitungen verhalten sich dort anders, und
 * genau die stecken im Buchungsablauf.
 *
 * globalSetup schreibt die Demodaten neu. Ohne das wuerde jeder Lauf eine
 * Buchung hinterlassen: der gruene Kurs waere nach ein paar Durchgaengen gelb,
 * dann rot, und der Test schluege ohne echten Fehler fehl.
 */
const PORT = Number(process.env.E2E_PORT ?? 3210);
const BASIS = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // Der Kapazitaetsschutz sperrt pro Kurs. Parallele Tests auf denselben
  // Demokursen wuerden sich gegenseitig die Plaetze wegnehmen.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASIS,
    locale: "de-CH",
    timezoneId: "Europe/Zurich",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: BASIS,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
