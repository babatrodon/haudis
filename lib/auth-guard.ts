import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AngemeldeterBenutzer } from "@/lib/auth";
import { prisma, type Role } from "@/lib/db";
import { instruktorProfilZuBenutzer } from "@/lib/instruktoren";

export const LOGIN_PFAD = "/team/login";
export const PASSWORT_PFAD = "/team/passwort";

/**
 * Serverseitige Autorisierung. Hier und nur hier faellt die Entscheidung, ob
 * jemand eine geschuetzte Seite sehen darf. proxy.ts leitet zwar frueher um,
 * prueft aber nur die Existenz eines Cookies und ist deshalb kein Schutz.
 *
 * Jedes Layout unter app/admin und app/portal ruft requireRole auf.
 */

export async function sitzungLesen() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Verlangt eine gueltige Sitzung. Deaktivierte Konten gelten als abgemeldet:
 * setzt die Admin active auf false, verliert das Konto sofort den Zugriff,
 * auch wenn das Session-Cookie noch gueltig waere.
 */
export async function requireSession(): Promise<AngemeldeterBenutzer> {
  const sitzung = await sitzungLesen();

  if (!sitzung || !sitzung.user.active) {
    redirect(LOGIN_PFAD);
  }

  // Erzwungener Passwortwechsel. Ausilia gibt Startpasswoerter persoenlich
  // weiter (PLAN.md Abschnitt 15.1); ein solches Passwort darf nicht dauerhaft
  // gelten. Bis zum Wechsel ist kein geschuetzter Bereich erreichbar.
  //
  // Die Passwortseite selbst ruft diese Funktion nicht auf, sondern
  // requireSessionOhnePasswortzwang, sonst entstuende eine Endlosschleife.
  //
  // Der Wert aus der Sitzung steckt im Cookie-Cache und ist bis zu fuenf
  // Minuten alt. Direkt nach einem Wechsel stuende dort noch true und die
  // Person bliebe ausgesperrt, obwohl sie laengst ein neues Passwort hat.
  // Deshalb im Verdachtsfall in der Datenbank nachsehen. Das kostet nur eine
  // Abfrage, wenn das Flag gesetzt scheint, also praktisch nie.
  if (sitzung.user.mustChangePassword && (await wechselNochOffen(sitzung.user.id))) {
    redirect(PASSWORT_PFAD);
  }

  return sitzung.user;
}

/** Steht der Passwortwechsel laut Datenbank wirklich noch aus? */
async function wechselNochOffen(benutzerId: string): Promise<boolean> {
  const benutzer = await prisma.user.findUnique({
    where: { id: benutzerId },
    select: { mustChangePassword: true },
  });
  return benutzer?.mustChangePassword ?? false;
}

/**
 * Wie requireSession, aber ohne die Weiterleitung auf die Passwortseite.
 * Ausschliesslich fuer diese Seite selbst gedacht.
 */
export async function requireSessionOhnePasswortzwang(): Promise<AngemeldeterBenutzer> {
  const sitzung = await sitzungLesen();

  if (!sitzung || !sitzung.user.active) {
    redirect(LOGIN_PFAD);
  }

  return sitzung.user;
}

export async function requireRole(rolle: Role): Promise<AngemeldeterBenutzer> {
  const benutzer = await requireSession();

  if (benutzer.role !== rolle) {
    redirect(startseiteFuerRolle(benutzer.role));
  }

  return benutzer;
}

/**
 * Wohin ein Konto nach dem Login gehoert. ADMIN und INSTRUCTOR haben getrennte
 * Bereiche, ein Admin ist nicht automatisch im Fahrlehrer-Portal.
 */
export function startseiteFuerRolle(rolle: string): string {
  return rolle === "ADMIN" ? "/admin" : "/portal";
}

/**
 * Loest das angemeldete Konto auf sein Instruktoren-Profil auf.
 *
 * Geschaeftsregel 11: Ein User ist nie automatisch Instruktor. Ein Konto mit
 * der Rolle INSTRUCTOR kann deshalb ohne Profil existieren. Das Portal zeigt
 * dann keinen leeren Einsatzplan, sondern sagt, was fehlt: Die Admin muss das
 * Konto einem Profil zuordnen.
 */
export async function requireInstruktorProfil() {
  const benutzer = await requireRole("INSTRUCTOR");
  const profil = await instruktorProfilZuBenutzer(benutzer.id);

  return { benutzer, profil };
}
