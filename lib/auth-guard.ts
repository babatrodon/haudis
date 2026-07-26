import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AngemeldeterBenutzer } from "@/lib/auth";
import type { Role } from "@/lib/db";

export const LOGIN_PFAD = "/team/login";

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
