import "server-only";
import { randomInt } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/db";
import type { Decimal } from "@/lib/decimal";

/**
 * Team-Konten und Instruktoren-Profile (PLAN.md Abschnitt 15.1).
 *
 * Zwei Dinge, die hier zusammenkommen und trotzdem getrennt bleiben:
 *
 *   Ein Instruktoren-Profil ist ein Mensch, der Kurse gibt. Es existiert auch
 *   ohne Login.
 *   Ein Konto ist ein Zugang zum Portal. Es haengt optional an einem Profil.
 *
 * Geschaeftsregel 11 verlangt genau diese Trennung: ein User ist nie
 * automatisch Instruktor.
 *
 * Passwoerter werden mit hashPassword aus better-auth/crypto gehasht, derselben
 * Funktion, die Better Auth beim Login zur Pruefung benutzt. prisma/seed-lib.ts
 * macht dasselbe fuer die Startkonten; wird der Algorithmus in lib/auth.ts je
 * umgestellt, muessen beide Stellen mitziehen. Geteilt wird der Code nicht,
 * weil der Seed unter tsx laeuft und das "server-only" dieser Datei dort
 * ausbricht.
 */

/**
 * Zeichen ohne Verwechslungsgefahr.
 *
 * Ohne I, l, 1, O und 0: das Passwort wird auf Papier oder muendlich
 * weitergegeben, und ein O statt einer Null kostet einen zweiten Anruf.
 */
const ZEICHEN = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const GRUPPEN = 4;
const ZEICHEN_PRO_GRUPPE = 4;

/**
 * Erzeugt ein Startpasswort wie "Kfrt-9Wqa-Hm3x-Pd7t".
 *
 * randomInt aus node:crypto statt Math.random: ein vorhersagbares Passwort
 * waere hier ein echtes Problem, weil es zusammen mit einer bekannten
 * E-Mail-Adresse den Portalzugang oeffnet.
 */
export function passwortErzeugen(): string {
  const gruppen: string[] = [];
  for (let g = 0; g < GRUPPEN; g += 1) {
    let gruppe = "";
    for (let i = 0; i < ZEICHEN_PRO_GRUPPE; i += 1) {
      gruppe += ZEICHEN[randomInt(ZEICHEN.length)];
    }
    gruppen.push(gruppe);
  }
  return gruppen.join("-");
}

export type InstruktorZeile = {
  id: string;
  vorname: string;
  nachname: string;
  kuerzel: string;
  telefon: string | null;
  provision: Decimal;
  aktiv: boolean;
  konto: {
    userId: string;
    email: string;
    aktiv: boolean;
    passwortWechselOffen: boolean;
    hatPasswort: boolean;
  } | null;
  /** Zaehlt die Provisionsgrundlage, hilft beim Deaktivieren. */
  zugewieseneBuchungen: number;
};

export async function instruktorenMitKonten(): Promise<InstruktorZeile[]> {
  const profile = await prisma.instructor.findMany({
    orderBy: [{ active: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      shortCode: true,
      phone: true,
      provisionPerBooking: true,
      active: true,
      user: {
        select: {
          id: true,
          email: true,
          active: true,
          mustChangePassword: true,
          accounts: {
            where: { providerId: "credential" },
            select: { id: true },
          },
        },
      },
      _count: { select: { referredBookings: true } },
    },
  });

  return profile.map((profil) => ({
    id: profil.id,
    vorname: profil.firstName,
    nachname: profil.lastName,
    kuerzel: profil.shortCode,
    telefon: profil.phone,
    provision: profil.provisionPerBooking,
    aktiv: profil.active,
    konto: profil.user
      ? {
          userId: profil.user.id,
          email: profil.user.email,
          aktiv: profil.user.active,
          passwortWechselOffen: profil.user.mustChangePassword,
          hatPasswort: profil.user.accounts.length > 0,
        }
      : null,
    zugewieseneBuchungen: profil._count.referredBookings,
  }));
}

export type KontoErgebnis =
  | { erfolg: true; passwort: string }
  | { erfolg: false; fehler: "profil-fehlt" | "email-vergeben" | "hat-konto" };

/**
 * Legt ein Portal-Konto fuer ein Instruktoren-Profil an.
 *
 * Das erzeugte Passwort wird genau einmal zurueckgegeben und nirgends
 * gespeichert — in der Datenbank steht nur der Hash. Wer es verliert, setzt es
 * zurueck; wiederherstellen kann es niemand, auch die Admin nicht.
 *
 * mustChangePassword ist immer gesetzt: das Startpasswort wird von Hand
 * weitergegeben und darf nicht in Umlauf bleiben.
 */
export async function kontoAnlegen(
  instruktorId: string,
  email: string,
): Promise<KontoErgebnis> {
  const profil = await prisma.instructor.findUnique({
    where: { id: instruktorId },
    select: { id: true, firstName: true, lastName: true, userId: true },
  });
  if (!profil) return { erfolg: false, fehler: "profil-fehlt" };
  if (profil.userId) return { erfolg: false, fehler: "hat-konto" };

  const adresse = email.trim().toLowerCase();
  const vergeben = await prisma.user.findUnique({
    where: { email: adresse },
    select: { id: true },
  });
  if (vergeben) return { erfolg: false, fehler: "email-vergeben" };

  const passwort = passwortErzeugen();

  await prisma.$transaction(async (tx) => {
    const benutzer = await tx.user.create({
      data: {
        email: adresse,
        name: `${profil.firstName} ${profil.lastName}`,
        role: "INSTRUCTOR",
        emailVerified: true,
        mustChangePassword: true,
      },
      select: { id: true },
    });

    await tx.account.create({
      data: {
        userId: benutzer.id,
        accountId: benutzer.id,
        providerId: "credential",
        password: await hashPassword(passwort),
      },
    });

    await tx.instructor.update({
      where: { id: instruktorId },
      data: { userId: benutzer.id },
    });
  });

  return { erfolg: true, passwort };
}

/**
 * Neues Startpasswort. Auch dieses wird nur einmal angezeigt.
 *
 * Der bestehende Zugang wird ueberschrieben statt geloescht und neu angelegt:
 * so bleibt die Kontozeile dieselbe und mit ihr alles, was daran haengt.
 */
export async function passwortZuruecksetzen(
  userId: string,
): Promise<KontoErgebnis> {
  const zugang = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { id: true },
  });

  const passwort = passwortErzeugen();
  const hash = await hashPassword(passwort);

  await prisma.$transaction(async (tx) => {
    if (zugang) {
      await tx.account.update({
        where: { id: zugang.id },
        data: { password: hash },
      });
    } else {
      await tx.account.create({
        data: {
          userId,
          accountId: userId,
          providerId: "credential",
          password: hash,
        },
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: { mustChangePassword: true },
    });

    // Alle offenen Sitzungen beenden. Wer ein Passwort zuruecksetzt, tut das
    // meist, weil es in falsche Haende geraten ist.
    await tx.session.deleteMany({ where: { userId } });
  });

  return { erfolg: true, passwort };
}

export async function emailAendern(
  userId: string,
  email: string,
): Promise<{ erfolg: boolean; fehler?: "email-vergeben" }> {
  const adresse = email.trim().toLowerCase();
  const vergeben = await prisma.user.findUnique({
    where: { email: adresse },
    select: { id: true },
  });
  if (vergeben && vergeben.id !== userId) {
    return { erfolg: false, fehler: "email-vergeben" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { email: adresse },
  });
  return { erfolg: true };
}

/**
 * Konto stilllegen statt loeschen.
 *
 * requireSession prueft active bei jeder Anfrage, der Zugriff ist also sofort
 * weg. Die Zeile bleibt, damit vergangene Zuweisungen nachvollziehbar sind.
 */
export async function kontoAktivSetzen(
  userId: string,
  aktiv: boolean,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { active: aktiv } });
    if (!aktiv) {
      await tx.session.deleteMany({ where: { userId } });
    }
  });
}

/**
 * Profil aktiv oder inaktiv.
 *
 * Ein inaktives Profil verschwindet aus den Kursleiter-Auswahlen
 * (aktiveInstruktoren), bleibt aber an bestehenden Terminen und Buchungen
 * stehen.
 */
export async function instruktorAktivSetzen(
  instruktorId: string,
  aktiv: boolean,
): Promise<void> {
  await prisma.instructor.update({
    where: { id: instruktorId },
    data: { active: aktiv },
  });
}

/** Provisionssatz pro zugewiesener Buchung (Geschaeftsregel 5). */
export async function provisionSetzen(
  instruktorId: string,
  betrag: string,
): Promise<void> {
  await prisma.instructor.update({
    where: { id: instruktorId },
    data: { provisionPerBooking: betrag },
  });
}
