import { hashPassword } from "better-auth/crypto";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";
import type { Role } from "../lib/generated/prisma/enums";

/**
 * Gemeinsame Bausteine der Seed-Skripte.
 */

const MIN_PASSWORT_LAENGE = 12;

export function prismaOeffnen() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL fehlt in .env");
  }
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });
}

export type PrismaSeedClient = ReturnType<typeof prismaOeffnen>;

/**
 * Legt ein Team-Konto an oder aktualisiert es.
 *
 * Warum von Hand und nicht ueber die Auth-API: Die Registrierung ist bewusst
 * abgeschaltet (disableSignUp in lib/auth.ts), es gibt keine Kundenkonten.
 * Deshalb schreibt der Seed die beiden Zeilen direkt und hasht mit derselben
 * Funktion, die Better Auth beim Login zur Pruefung verwendet.
 *
 * Achtung: Das gilt, solange in lib/auth.ts kein eigener Hash-Algorithmus
 * konfiguriert ist (emailAndPassword.password.hash). Wird der gesetzt, muss
 * dieser Seed dieselbe Funktion benutzen, sonst schlaegt der Login fehl.
 *
 * Ein bestehendes Passwort wird nie ueberschrieben. Wer eines zuruecksetzen
 * will, loescht die account-Zeile und laesst den Seed erneut laufen.
 */
export async function kontoAnlegen(
  prisma: PrismaSeedClient,
  konto: { email: string; name: string; rolle: Role; passwortEnv: string },
): Promise<{ userId: string; neu: boolean }> {
  const passwort = process.env[konto.passwortEnv];

  const benutzer = await prisma.user.upsert({
    where: { email: konto.email },
    update: { role: konto.rolle, active: true },
    create: {
      email: konto.email,
      name: konto.name,
      role: konto.rolle,
      emailVerified: true,
    },
  });

  const vorhandenerZugang = await prisma.account.findFirst({
    where: { userId: benutzer.id, providerId: "credential" },
  });

  if (vorhandenerZugang) {
    return { userId: benutzer.id, neu: false };
  }

  if (!passwort) {
    throw new Error(
      `${konto.passwortEnv} fehlt in .env. Ohne Passwort kann sich ${konto.email} nicht anmelden.`,
    );
  }
  if (passwort.length < MIN_PASSWORT_LAENGE) {
    throw new Error(
      `${konto.passwortEnv} braucht mindestens ${MIN_PASSWORT_LAENGE} Zeichen.`,
    );
  }

  await prisma.account.create({
    data: {
      userId: benutzer.id,
      accountId: benutzer.id,
      providerId: "credential",
      password: await hashPassword(passwort),
    },
  });

  return { userId: benutzer.id, neu: true };
}

/**
 * Prueft vorab, ob fuer jedes noch nicht existierende Konto ein Startpasswort
 * in der Umgebung steht, und meldet alle fehlenden auf einmal.
 *
 * Ohne diese Vorpruefung liefe der Seed los, schriebe die Haelfte der Profile
 * und braeche dann beim ersten Konto ohne Passwort ab.
 */
export async function passwoerterVorpruefen(
  prisma: PrismaSeedClient,
  logins: { email: string; passwortEnv: string }[],
) {
  const fehlend: string[] = [];

  for (const login of logins) {
    if (process.env[login.passwortEnv]) {
      continue;
    }

    const benutzer = await prisma.user.findUnique({
      where: { email: login.email },
      select: { id: true },
    });
    const hatZugang =
      benutzer !== null &&
      (await prisma.account.findFirst({
        where: { userId: benutzer.id, providerId: "credential" },
        select: { id: true },
      })) !== null;

    // Bestehende Konten brauchen kein Passwort in der Umgebung, ihres bleibt
    // ohnehin unangetastet.
    if (!hatZugang) {
      fehlend.push(`${login.passwortEnv} (fuer ${login.email})`);
    }
  }

  if (fehlend.length > 0) {
    throw new Error(
      `Startpasswoerter fehlen in .env:\n  ${fehlend.join("\n  ")}\n` +
        "Mindestens 12 Zeichen. Es wurde nichts geschrieben.",
    );
  }
}

/**
 * Bricht ab, wenn eine Liste doppelte Werte enthaelt.
 *
 * Die Instruktoren-Liste ist provisorisch und wird von Hand korrigiert. Ein
 * versehentlich doppeltes Kuerzel soll hier auffallen und nicht mitten im
 * Schreiben an der Datenbank-Bedingung scheitern.
 */
export function aufDublettenPruefen(werte: string[], bezeichnung: string) {
  const gesehen = new Set<string>();
  const doppelt = new Set<string>();

  for (const wert of werte) {
    if (gesehen.has(wert)) {
      doppelt.add(wert);
    }
    gesehen.add(wert);
  }

  if (doppelt.size > 0) {
    throw new Error(
      `${bezeichnung} doppelt vergeben: ${[...doppelt].join(", ")}`,
    );
  }
}
