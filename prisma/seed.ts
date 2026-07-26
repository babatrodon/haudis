import "dotenv/config";
import { EINSTELLUNG_DEFAULTS } from "../lib/einstellungen-defaults";
import { INSTRUKTOREN } from "./seed-data/instruktoren";
import { KURSARTEN } from "./seed-data/kursarten";
import {
  aufDublettenPruefen,
  kontoAnlegen,
  passwoerterVorpruefen,
  prismaOeffnen,
  type PrismaSeedClient,
} from "./seed-lib";

/**
 * Referenzdaten: Kursarten, Instruktoren-Pool, Team-Logins, Einstellungen.
 *
 * Dieser Seed ist gegen die Produktivdatenbank ungefaehrlich. Alles wird ueber
 * einen natuerlichen Schluessel aktualisiert, mehrfaches Ausfuehren aendert
 * nichts. Es entstehen hier keine Kurse und keine Buchungen, die stehen im
 * Demo-Seed (prisma/seed-demo.ts).
 */

async function main() {
  const prisma = prismaOeffnen();

  try {
    // Erst pruefen, dann schreiben: ein fehlendes Startpasswort soll den Seed
    // stoppen, bevor die Haelfte der Profile in der Datenbank steht.
    await passwoerterVorpruefen(prisma, [
      ...INSTRUKTOREN.flatMap((i) => (i.login ? [i.login] : [])),
      ...(process.env.SEED_ADMIN_EMAIL
        ? [
            {
              email: process.env.SEED_ADMIN_EMAIL,
              passwortEnv: "SEED_ADMIN_PASSWORD",
            },
          ]
        : []),
    ]);

    await kursartenSchreiben(prisma);
    await instruktorenSchreiben(prisma);
    await einstellungenSchreiben(prisma);
    await devAdminSchreiben(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function kursartenSchreiben(prisma: PrismaSeedClient) {
  aufDublettenPruefen(
    KURSARTEN.map((k) => k.code),
    "Kursart-Code",
  );
  aufDublettenPruefen(
    KURSARTEN.map((k) => k.slug),
    "Kursart-Slug",
  );

  for (const kursart of KURSARTEN) {
    const werte = {
      name: kursart.name,
      slug: kursart.slug,
      description: kursart.beschreibung,
      basePrice: kursart.grundpreis,
      materialPrice: kursart.materialpreis,
      onlineLimit: kursart.onlineLimit,
      requiresLfa: kursart.lernfahrausweisNoetig,
      bookable: kursart.buchbar,
      sortOrder: kursart.reihenfolge,
      active: kursart.aktiv,
    };

    await prisma.courseType.upsert({
      where: { code: kursart.code },
      update: werte,
      create: { code: kursart.code, ...werte },
    });
  }

  const offen = KURSARTEN.filter((k) => !k.aktiv).map((k) => k.code);
  console.log(`Kursarten: ${KURSARTEN.length} geschrieben.`);
  if (offen.length > 0) {
    console.log(`  inaktiv bis der Preis feststeht: ${offen.join(", ")}`);
  }
}

/**
 * Schreibt alle Instruktoren-Profile und legt fuer die wenigen Personen mit
 * Login zusaetzlich ein Konto an.
 *
 * Geschaeftsregel 11: Die Richtung ist immer Instruktor -> optionaler User.
 * Ein Konto allein macht niemanden zum Instruktor, deshalb entsteht ein
 * Instruktoren-Profil ausschliesslich aus dieser Liste.
 */
async function instruktorenSchreiben(prisma: PrismaSeedClient) {
  aufDublettenPruefen(
    INSTRUKTOREN.map((i) => i.kuerzel),
    "Kuerzel",
  );
  aufDublettenPruefen(
    INSTRUKTOREN.flatMap((i) => (i.login ? [i.login.email] : [])),
    "Login-E-Mail",
  );

  let mitLogin = 0;

  for (const person of INSTRUKTOREN) {
    let userId: string | null = null;

    if (person.login) {
      const konto = await kontoAnlegen(prisma, {
        email: person.login.email,
        name: person.login.anzeigename,
        rolle: person.login.rolle,
        passwortEnv: person.login.passwortEnv,
      });
      userId = konto.userId;
      mitLogin += 1;
    }

    const werte = {
      firstName: person.vorname,
      lastName: person.nachname,
      active: true,
      // Provision bleibt beim Default aus dem Schema (CHF 50). Abweichungen
      // pflegt die Admin ab Sprint 4 pro Person, der Seed ueberschreibt sie
      // deshalb nicht.
      ...(userId ? { userId } : {}),
    };

    await prisma.instructor.upsert({
      where: { shortCode: person.kuerzel },
      update: werte,
      create: { shortCode: person.kuerzel, ...werte },
    });
  }

  console.log(
    `Instruktoren: ${INSTRUKTOREN.length} Profile, davon ${mitLogin} mit Login.`,
  );
}

async function einstellungenSchreiben(prisma: PrismaSeedClient) {
  const eintraege = Object.entries(EINSTELLUNG_DEFAULTS);

  for (const [key, value] of eintraege) {
    // Nur anlegen, nie ueberschreiben: was die Admin einmal angepasst hat,
    // darf ein erneuter Seed nicht zuruecksetzen.
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  console.log(`Einstellungen: ${eintraege.length} Schluessel sichergestellt.`);
}

/**
 * Entwickler-Admin aus Sprint 0. Gehoert zu keinem Instruktoren-Profil und
 * darf deshalb nie in einem Kursleiter-Dropdown erscheinen - genau der Fehler
 * des Altsystems mit dem Konto "LOLIT".
 */
async function devAdminSchreiben(prisma: PrismaSeedClient) {
  const email = process.env.SEED_ADMIN_EMAIL;
  if (!email) {
    console.log("Dev-Admin: SEED_ADMIN_EMAIL nicht gesetzt, uebersprungen.");
    return;
  }

  const konto = await kontoAnlegen(prisma, {
    email,
    name: process.env.SEED_ADMIN_NAME ?? "Administration",
    rolle: "ADMIN",
    passwortEnv: "SEED_ADMIN_PASSWORD",
  });

  console.log(
    `Dev-Admin: ${email} ${konto.neu ? "angelegt" : "vorhanden, Passwort unveraendert"}.`,
  );
}

main().catch((fehler) => {
  console.error(fehler);
  process.exit(1);
});
