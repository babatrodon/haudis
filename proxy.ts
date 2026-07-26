import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Frueher Redirect fuer nicht angemeldete Besucher.
 *
 * Das ist reine Bequemlichkeit: geprueft wird nur, ob ueberhaupt ein
 * Sitzungs-Cookie mitgeschickt wurde, nicht ob es gueltig ist. Ein Cookie kann
 * jeder selbst setzen. Die echte Pruefung passiert serverseitig in
 * lib/auth-guard.ts, aufgerufen aus den Layouts von /admin und /portal.
 *
 * Next.js 16: Die Datei heisst proxy.ts, frueher middleware.ts.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) {
    return NextResponse.next();
  }

  const ziel = new URL("/team/login", request.url);
  ziel.searchParams.set("weiter", request.nextUrl.pathname);
  return NextResponse.redirect(ziel);
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
