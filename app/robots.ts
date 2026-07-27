import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seite";

/**
 * robots.txt (PLAN.md Abschnitt 11).
 *
 * Gesperrt wird alles, was entweder Personendaten zeigt oder nur einem
 * angemeldeten Menschen etwas nuetzt:
 *
 *   /admin, /portal, /team   Anmeldung und Panel
 *   /druck                   Teilnehmerlisten und Abrechnungen
 *   /anmeldung               der Buchungsablauf, inklusive Bestaetigungsseite
 *                            mit Namen und Betrag
 *   /api                     keine Seite, sondern Endpunkte
 *
 * Das ist eine Bitte an gutwillige Crawler und kein Zugangsschutz — der sitzt
 * in lib/auth-guard.ts. Die Sperre hier verhindert, dass eine
 * Bestaetigungsseite in einem Suchergebnis landet, nicht dass jemand sie
 * aufruft.
 *
 * Die Rechtstexte stehen bewusst NICHT hier: sie tragen ihr noindex im
 * Metadata-Objekt (RECHTSTEXT_ROBOTS), solange sie Entwuerfe sind. Eine Regel
 * in robots.txt wuerde den Crawler am Lesen hindern und damit auch am Sehen
 * des noindex — die Seiten blieben im Index, wenn sie je darin waren.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/portal", "/team", "/druck", "/anmeldung", "/api"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
