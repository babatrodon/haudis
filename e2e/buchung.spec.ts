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
  // Am Wortanfang verankert: "Ort" steckt sonst auch in der Beschriftung
  // "Fortschritt der Anmeldung" der Schrittleiste, und Playwright bricht bei
  // zwei Treffern ab. Die Pflichtfelder tragen zusaetzlich ein verstecktes
  // "Pflichtfeld" im Namen, deshalb kein exakter Vergleich.
  await page.getByLabel(/^Anrede/).selectOption("Frau");
  await page.getByLabel(/^Nachname/).fill("Testerin");
  await page.getByLabel(/^Vorname/).fill("Petra");
  await page.getByLabel(/^Strasse und Nummer/).fill("Haselstrasse 33");
  await page.getByLabel(/^PLZ/).fill("5400");
  await page.getByLabel(/^Ort/).fill("Baden");
  await page.getByLabel(/^Geburtsdatum/).fill("2008-03-12");
  await page.getByLabel(/^Telefon/).fill("079 604 44 44");
  await page.getByLabel(/^E-Mail/).fill(email);
  // Das Kaestchen liegt unsichtbar unter dem gezeichneten (Vorlage Screen
  // 04). Ein Mensch tippt auf die Beschriftung, der Test tut dasselbe.
  await page.getByText("Ich akzeptiere die").click();
}

test("Anmeldung von den Kursdaten bis zur Bestaetigung", async ({ page }) => {
  await page.goto("/kursdaten");
  await expect(
    page.getByRole("heading", { name: "Alle Kurse auf einen Blick", level: 1 }),
  ).toBeVisible();

  // Ueber die Kurskarte gehen, nicht direkt auf die Adresse: der Weg der
  // Kundin ist der, der getestet gehoert.
  await page.goto(`/anmeldung/${KURS_GRUEN}`);
  await expect(
    page.getByRole("heading", { name: "Deine Angaben", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("Verkehrskundeunterricht").first(),
  ).toBeVisible();

  // Der gruene Kurs hat 5 von 12 belegt, der Fruehbucherrabatt ist mit fuenf
  // Plaetzen ausgeschoepft, also gilt der volle Preis.
  await expect(page.getByText("CHF 170.00").first()).toBeVisible();
  // Nur Bar: TWINT und Karte zeigt die Vorlage, Payrexx haengt aber nicht
  // dran, und eine Zahlart ohne Abschluss gehoert nicht auf die Seite.
  await expect(
    page.getByText(/Bar am ersten Kurstag/i).first(),
  ).toBeVisible();
  await expect(page.getByText("TWINT")).toHaveCount(0);

  // Geschaeftsregel 1: kein Kanton-Feld, kein Konto, kein Passwort.
  await expect(page.getByLabel(/Kanton/i)).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);

  await schritt1Ausfuellen(page, testEmail("volllauf"));
  await page.getByRole("button", { name: "Weiter zu Schritt 2" }).click();

  await expect(page).toHaveURL(new RegExp(`/anmeldung/${KURS_GRUEN}/schritt-2`));
  await expect(
    page.getByRole("heading", { name: "Lernfahrausweis und Erinnerung" }),
  ).toBeVisible();

  await page.getByLabel(/^Lernfahrausweis-Nummer/).fill("AG 654321");
  await page.getByRole("button", { name: "Anmeldung abschicken" }).click();

  await expect(page).toHaveURL(
    new RegExp(`/anmeldung/${KURS_GRUEN}/bestaetigung`),
  );
  await expect(
    page.getByRole("heading", { name: /Du bist angemeldet/ }),
  ).toBeVisible();
  await expect(page.getByText("CHF 170.00")).toBeVisible();
  await expect(
    page.getByText(/Bring am ersten Abend/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Frage zur Buchung/ }),
  ).toBeVisible();

  // Geschaeftsregel 6: beide Nummern erreichbar.
  await expect(page.getByRole("link", { name: /079 604 44 44/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /079 202 97 97/ }).first()).toBeVisible();
});

test("ausgebuchter Kurs fuehrt auf die Warteliste", async ({ page }) => {
  // Geschaeftsregel 2: bei Rot verschwindet der Anmelden-Knopf. Seit Sprint 7
  // steht an seiner Stelle die Warteliste (Vorlage Zeile 151).
  await page.goto("/kursdaten");
  const ausgebuchteZeile = page
    .locator("article")
    .filter({ hasText: "Kurs ausgebucht" })
    .first();
  await expect(ausgebuchteZeile).toBeVisible();
  await expect(
    ausgebuchteZeile.getByRole("link", { name: "Anmelden" }),
  ).toHaveCount(0);
  await expect(
    ausgebuchteZeile.getByRole("link", { name: /Auf Warteliste eintragen/ }),
  ).toBeVisible();

  // Gegenprobe: ohne sie wuerde die Zaehlung oben auch dann null ergeben, wenn
  // der Knopf schlicht anders hiesse und auf keiner Zeile mehr auftauchte.
  await expect(
    page
      .locator("article")
      .filter({ hasText: "Noch viele Plätze frei" })
      .first()
      .getByRole("link", { name: "Anmelden" }),
  ).toBeVisible();

  // Der Direktlink fuehrt nicht in ein Buchungsformular, sondern auf die
  // Warteliste.
  await page.goto(`/anmeldung/${KURS_ROT}`);
  await expect(
    page.getByRole("heading", { name: "Dieser Kurs ist ausgebucht" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Weiter zu Schritt 2" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /079 604 44 44/ }).first()).toBeVisible();

  // Eintragen: danach steht die Position in der Schlange da, und zwar ohne
  // Behauptung, die Person sei angemeldet.
  await page.getByLabel(/^Vorname/).fill("Testperson");
  await page.getByLabel(/^Nachname/).fill("Warteliste");
  await page.getByLabel(/^Telefon/).fill("079 604 44 44");
  await page.getByLabel(/^E-Mail/).fill(testEmail("warteliste"));
  await page.getByRole("button", { name: "Auf Warteliste eintragen" }).click();

  await expect(
    page.getByRole("heading", { name: "Du stehst auf der Warteliste" }),
  ).toBeVisible();
  await expect(page.getByText(/Angemeldet bist Du damit noch nicht/)).toBeVisible();
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
  await page.getByRole("button", { name: "Weiter zu Schritt 2" }).click();

  // Nach aussen sieht es aus wie Erfolg, damit der Bot nichts lernt.
  await expect(page).toHaveURL(
    new RegExp(`/anmeldung/${KURS_GRUEN}/bestaetigung`),
  );
  await expect(
    page.getByRole("heading", { name: /Du bist angemeldet/ }),
  ).toBeVisible();

  // Der Unterschied zur echten Anmeldung: es wurde nichts gespeichert, also
  // gibt es keine Buchung zum Anzeigen. Bei einer echten Anmeldung stuenden
  // hier Kursname, Termine und Total.
  await expect(page.getByText("Verkehrskundeunterricht")).toHaveCount(0);
  await expect(page.getByText("CHF 170.00")).toHaveCount(0);
});

test("Fruehbucherrabatt ausgeschoepft: voller Preis", async ({ page }) => {
  // Der Weekend-Kurs hat sechs Anmeldungen bei fuenf Rabattplaetzen.
  await page.goto(`/anmeldung/${KURS_FRUEHBUCHER}`);

  // 180 Kursgebuehr + 30 Lehrmittel = 210, ohne Abzug.
  await expect(page.getByText("CHF 210.00")).toBeVisible();
  await expect(page.getByText("CHF 189.00")).toHaveCount(0);
  await expect(page.getByText("Frühbucherpreis")).toHaveCount(0);
});
