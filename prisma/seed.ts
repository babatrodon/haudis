import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";

/**
 * Sprint-0-Seed: genau ein Admin-Konto.
 *
 * Der komplette Seed (Kursarten, Instruktoren-Pool aus PLAN.md Abschnitt 4,
 * Beispielkurse, Settings) folgt in Sprint 1.
 *
 * Warum von Hand und nicht ueber die Auth-API: Die Registrierung ist bewusst
 * abgeschaltet (disableSignUp in lib/auth.ts), es gibt keine Kundenkonten.
 * Deshalb schreibt der Seed die beiden Zeilen direkt und hasht mit derselben
 * Funktion, die Better Auth beim Login zur Pruefung verwendet.
 *
 * Achtung: Das gilt, solange in lib/auth.ts kein eigener Hash-Algorithmus
 * konfiguriert ist (emailAndPassword.password.hash). Wird der gesetzt, muss
 * dieser Seed dieselbe Funktion benutzen, sonst schlaegt der Login fehl.
 */

const MIN_PASSWORT_LAENGE = 12;

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const passwort = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Administration";

  if (!email) {
    throw new Error("SEED_ADMIN_EMAIL fehlt in .env");
  }
  if (!passwort) {
    throw new Error("SEED_ADMIN_PASSWORD fehlt in .env");
  }
  if (passwort.length < MIN_PASSWORT_LAENGE) {
    throw new Error(
      `SEED_ADMIN_PASSWORD braucht mindestens ${MIN_PASSWORT_LAENGE} Zeichen.`,
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL fehlt in .env");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  try {
    const benutzer = await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN", active: true },
      create: { email, name, role: "ADMIN", emailVerified: true },
    });

    const vorhandenerZugang = await prisma.account.findFirst({
      where: { userId: benutzer.id, providerId: "credential" },
    });

    if (vorhandenerZugang) {
      // Ein bestehendes Passwort wird nicht ueberschrieben. Wer es zuruecksetzen
      // will, loescht die account-Zeile und laesst den Seed erneut laufen.
      console.log(`Admin ${email} existiert bereits, Passwort unveraendert.`);
      return;
    }

    await prisma.account.create({
      data: {
        userId: benutzer.id,
        accountId: benutzer.id,
        providerId: "credential",
        password: await hashPassword(passwort),
      },
    });

    console.log(`Admin ${email} angelegt.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((fehler) => {
  console.error(fehler);
  process.exit(1);
});
