"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";

/**
 * Kopfzeile der oeffentlichen Website.
 *
 * Geschaeftsregel 6: beide Telefonnummern erscheinen hier, als tel:-Links.
 * Auf schmalen Screens steckt die Navigation hinter einem Menue, die
 * Telefonnummern bleiben aber immer mit einem Griff erreichbar - wer eine
 * Fahrschule sucht, ruft an.
 *
 * Der Schriftzug ist gesetzt statt gezeichnet: eine Logodatei liegt noch nicht
 * vor. Sobald das SVG kommt, wird nur diese eine Stelle ersetzt.
 */

const NAVIGATION = [
  { href: "/kurse", text: "Kurse" },
  { href: "/kursdaten", text: "Kursdaten" },
  { href: "/fahrstunden", text: "Fahrstunden" },
  { href: "/fuehrerausweis", text: "Führerausweis" },
  { href: "/kontakt", text: "Kontakt" },
];

export function Kopfzeile() {
  const [offen, setOffen] = useState(false);
  const pfad = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-heading text-xl font-bold tracking-tight"
          onClick={() => setOffen(false)}
        >
          Haudi&apos;s
          <span className="ml-2 hidden text-sm font-medium text-muted-foreground sm:inline">
            Fahrschule Baden
          </span>
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAVIGATION.map((eintrag) => (
              <li key={eintrag.href}>
                <Link
                  href={eintrag.href}
                  aria-current={pfad === eintrag.href ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center px-3 text-sm font-medium transition-colors hover:text-brand-rot",
                    pfad === eintrag.href &&
                      "border-b-2 border-brand-gelb text-foreground",
                  )}
                >
                  {eintrag.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 md:flex">
            {TELEFONNUMMERN.map((nummer) => (
              <a
                key={nummer.tel}
                href={`tel:${nummer.tel}`}
                className="inline-flex min-h-11 items-center gap-2 px-3 font-heading text-sm font-semibold transition-colors hover:text-brand-rot"
              >
                <Phone aria-hidden="true" className="size-4" />
                {nummer.anzeige}
              </a>
            ))}
          </div>

          <a
            href={`tel:${TELEFONNUMMERN[0].tel}`}
            aria-label={`Anrufen: ${TELEFONNUMMERN[0].anzeige}`}
            className="inline-flex size-11 items-center justify-center border border-border md:hidden"
          >
            <Phone aria-hidden="true" className="size-5" />
          </a>

          <button
            type="button"
            onClick={() => setOffen((zustand) => !zustand)}
            aria-expanded={offen}
            aria-controls="hauptmenue"
            aria-label={offen ? "Menü schliessen" : "Menü öffnen"}
            className="inline-flex size-11 items-center justify-center border border-border lg:hidden"
          >
            {offen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {offen ? (
        <nav
          id="hauptmenue"
          aria-label="Hauptnavigation"
          className="border-t border-border lg:hidden"
        >
          <ul className="mx-auto w-full max-w-6xl px-4 py-2 sm:px-6">
            {NAVIGATION.map((eintrag) => (
              <li key={eintrag.href}>
                <Link
                  href={eintrag.href}
                  onClick={() => setOffen(false)}
                  aria-current={pfad === eintrag.href ? "page" : undefined}
                  className="flex min-h-12 items-center border-b border-border font-medium last:border-b-0"
                >
                  {eintrag.text}
                </Link>
              </li>
            ))}
            {/* Auf dem Handy ist im Kopf nur eine Nummer sichtbar, hier stehen
                beide (Geschaeftsregel 6). */}
            <li className="border-t border-border pt-2 md:hidden">
              {TELEFONNUMMERN.map((nummer) => (
                <a
                  key={nummer.tel}
                  href={`tel:${nummer.tel}`}
                  className="flex min-h-12 items-center gap-2 font-heading font-semibold"
                >
                  <Phone aria-hidden="true" className="size-4" />
                  {nummer.anzeige}
                </a>
              ))}
              <a
                href={`mailto:${ADRESSE.email}`}
                className="flex min-h-12 items-center text-sm text-muted-foreground"
              >
                {ADRESSE.email}
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
