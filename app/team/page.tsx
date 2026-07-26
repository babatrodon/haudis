import { redirect } from "next/navigation";
import { requireSession, startseiteFuerRolle } from "@/lib/auth-guard";

/**
 * Weiche nach dem Login: schickt jedes Konto in seinen Bereich.
 * Ein ADMIN landet im Admin-Panel, ein INSTRUCTOR im Fahrlehrer-Portal.
 */
export default async function TeamWeiche() {
  const benutzer = await requireSession();
  redirect(startseiteFuerRolle(benutzer.role));
}
