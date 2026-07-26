import { expect, test } from "@playwright/test";

/**
 * Smoketest fuer die Onlineanmeldung.
 *
 * Die Testdaten laufen auf @example.invalid, eine nach RFC 2606 reservierte
 * Domain. Damit sind sie von echten Anmeldungen unterscheidbar und werden von
 * pnpm db:seed:demo:purge zuverlaessig wieder entfernt.
 */

const KURS_GRUEN = "demo-vku-gruen";
const KURS_ROT = "demo-vku-rot";
const KURS_FRUEHBUCHER = "demo-vku-weekend-fruehbucher";

/** Eindeutige Adresse pro Lauf, sonst greift der Doppelbuchungsschutz. */
function testEmail(kennung: string): string {
  return `e2e.${kennung}.${Date.now()}@example.invalid`;
}

async function schritt1Ausfuellen(
  page: import("@playwright/test").Page,
  email: string,
) {
  await page.getByLabel("Anrede").selectOption("Frau");
  await page.getByLabel("Nachname").fill("Testerin");
  await page.getByLabel("Vorname").fill("Petra");
  await page.getByLabel("Strasse und Nummer").fill("Haselstrasse 33");
  await page.getByLabel("PLZ").fill("5400");
  await page.getByLabel("Ort").fill("Baden");
  await page.getByLabel("Geburtsdatum").fill("2008-03-12");
  await page.getByLabel("Telefonnummer").fill("079 604 44 44");
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.getByRole("checkbox").check();
}

test("Anmeldung von den Kursdaten bis zur Bestaetigung", async ({ page }) => {
  await page.goto("/kursdaten");
  await expect(
    page.getByRole("heading", { name: "Kursdaten", level: 1 }),
  ).toBeVisible();

  // Ueber die Kurskarte gehen, nicht direkt auf die Adresse: der Weg der
  // Kundin ist der, der getestet gehoert.
  await page.goto(`/anmeldung/${KURS_GRUEN}`);
  await expect(
    page.getByRole("heading", { name: /Anmeldung Verkehrskundeunterricht/ }),
  ).toBeVisible();

  // Der gruene Kurs hat 5 von 12 belegt, der Fruehbucherrabatt ist mit fuenf
  // Plaetzen ausgeschoepft, also gilt der volle Preis.
  await expect(page.getByText("CHF 170.00").first()).toBeVisible();
  await expect(page.getByText("bar am ersten Kurstag").first()).toBeVisible();
  await expect(
    page.getByText("Lernfahrausweis am ersten Kurstag mitbringen").first(),
  ).toBeVisible();

  // Geschaeftsregel 1: kein Kanton-Feld, kein Konto, kein Passwort.
  await expect(page.getByLabel(/Kanton/i)).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);

  await schritt1Ausfuellen(page, testEmail("volllauf"));
  await page.getByRole("button", { name: "Anmeldung abschicken" }).click();

  await expect(page).toHaveURL(new RegExp(`/anmeldung/${KURS_GRUEN}/schritt-2`));
  await expect(
    page.getByRole("heading", { name: "Fast geschafft" }),
  ).toBeVisible();
  await expect(page.getByText(/Anmeldung .* ist\s+eingegangen/)).toBeVisible();

  await page.getByLabel("Lernfahrausweis-Nummer").fill("AG 654321");
  await page.getByRole("button", { name: "Speichern und abschliessen" }).click();

  await expect(page).toHaveURL(
    new RegExp(`/anmeldung/${KURS_GRUEN}/bestaetigung`),
  );
  await expect(
    page.getByRole("heading", { name: "Anmeldung bestätigt" }),
  ).toBeVisible();
  await expect(page.getByText("CHF 170.00")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Frage zur Buchung/ }),
  ).toBeVisible();

  // Geschaeftsregel 6: beide Nummern erreichbar.
  await expect(page.getByRole("link", { name: /079 604 44 44/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /079 202 97 97/ }).first()).toBeVisible();
});

test("ausgebuchter Kurs laesst sich nicht anmelden", async ({ page }) => {
  // Auf den Kursdaten fehlt der Knopf.
  await page.goto("/kursdaten");
  const ausgebuchteKarte = page
    .locator("article")
    .filter({ hasText: "Kurs ausgebucht" })
    .first();
  await expect(ausgebuchteKarte).toBeVisible();
  await expect(
    ausgebuchteKarte.getByRole("link", { name: "Jetzt anmelden" }),
  ).toHaveCount(0);

  // Und auch der Direktlink fuehrt nicht in ein Formular.
  await page.goto(`/anmeldung/${KURS_ROT}`);
  await expect(
    page.getByRole("heading", { name: "Dieser Kurs ist ausgebucht" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Anmeldung abschicken" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /079 604 44 44/ }).first()).toBeVisible();
});

test("Honigtopf: ausgefuelltes Falle-Feld legt keine Buchung an", async ({
  page,
}) => {
  await page.goto(`/anmeldung/${KURS_GRUEN}`);

  const falle = page.locator('input[name="webseite"]');

  // Das Feld muss im HTML stehen und darf NICHT display:none sein, sonst
  // ueberspringen es Bots und die Falle greift nie. Es wird stattdessen aus
  // dem Sichtfeld geschoben, aus der Tabreihenfolge genommen und fuer
  // Screenreader ausgeblendet. Genau das wird hier geprueft.
  await expect(falle).toHaveAttribute("tabindex", "-1");
  await expect(page.locator('[aria-hidden="true"] input[name="webseite"]')).toHaveCount(1);

  const kasten = await falle.boundingBox();
  expect(kasten, "Falle muss gerendert sein, sonst überspringen Bots sie").not.toBeNull();
  expect(
    kasten!.x + kasten!.width,
    "Falle muss ausserhalb des Sichtfelds liegen",
  ).toBeLessThan(0);

  await schritt1Ausfuellen(page, testEmail("honigtopf"));
  // Genau das, was ein Bot tut: jedes Feld ausfuellen, auch das weggeschobene.
  await falle.fill("https://spam.example", { force: true });
  await page.getByRole("button", { name: "Anmeldung abschicken" }).click();

  // Nach aussen sieht es aus wie Erfolg, damit der Bot nichts lernt.
  await expect(page).toHaveURL(
    new RegExp(`/anmeldung/${KURS_GRUEN}/bestaetigung`),
  );
  await expect(
    page.getByRole("heading", { name: "Anmeldung bestätigt" }),
  ).toBeVisible();

  // Der Unterschied zur echten Anmeldung: es wurde nichts gespeichert, also
  // gibt es keine Buchung zum Anzeigen. Bei einer echten Anmeldung stuenden
  // hier Kursname, Termine und Total.
  await expect(page.getByRole("heading", { level: 2 })).not.toContainText(
    "Verkehrskundeunterricht",
  );
  await expect(page.getByText("Bitte bar am ersten Kurstag")).toHaveCount(0);
});

test("Fruehbucherrabatt ausgeschoepft: voller Preis", async ({ page }) => {
  // Der Weekend-Kurs hat sechs Anmeldungen bei fuenf Rabattplaetzen.
  await page.goto(`/anmeldung/${KURS_FRUEHBUCHER}`);

  // 180 Kursgebuehr + 30 Lehrmittel = 210, ohne Abzug.
  await expect(page.getByText("CHF 210.00")).toBeVisible();
  await expect(page.getByText("CHF 189.00")).toHaveCount(0);
  await expect(page.getByText("Frühbucherpreis")).toHaveCount(0);
});
