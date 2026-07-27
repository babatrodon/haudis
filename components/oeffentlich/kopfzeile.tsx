"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";

/**
 * Kopfzeile der oeffentlichen Website, nach design/haudis-design.dc.html
 * Screen 02.
 *
 * Zwei Zeilen: oben ein dunkler Streifen mit Adresse und Kontakt, darunter
 * Logo links, Navigation und der Knopf fuer die Probelektion rechts.
 *
 * Durch die untere Zeile laeuft der gelbe Streifen der alten Seite. Er ist
 * kein Schmuck, sondern ein Wiedererkennungsmerkmal (Kundenwunsch
 * 27.07.2026), und er bestimmt drei Details weiter unten: seine Hoehe, die
 * Raender der Knoepfe und die Farbe der aktiven Unterstreichung.
 *
 * Geschaeftsregel 6: beide Telefonnummern erscheinen hier, als tel:-Links. Auf
 * schmalen Screens steckt die Navigation hinter einem Menue, die Nummern
 * bleiben aber immer mit einem Griff erreichbar — wer eine Fahrschule sucht,
 * ruft an.
 *
 * Der Sprachumschalter aus der Vorlage fehlt bewusst: die Seite gibt es nur
 * auf Deutsch, und ein Umschalter ohne Uebersetzung waere ein Versprechen.
 */

const NAVIGATION = [
  { href: "/", text: "Startseite" },
  { href: "/fahrstunden", text: "Fahrstunden" },
  { href: "/kurse", text: "Kurse" },
  { href: "/fuehrerausweis", text: "Weg zum Führerausweis" },
  { href: "/kontakt", text: "Kontakt" },
];

export function Kopfzeile({ whatsappUrl }: { whatsappUrl: string }) {
  const [offen, setOffen] = useState(false);
  const pfad = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-card">
      {/* Dunkler Streifen. Auf dem Handy zu schmal fuer Adresse und Kontakt
          nebeneinander, dort bleibt die Adresse weg — sie steht im Fuss. */}
      <div className="bg-brand-schwarz text-flaeche-1">
        <div className="mx-auto flex w-full max-w-[1344px] items-center justify-between gap-4 px-4 py-2 text-[13px] sm:px-6 lg:h-11 lg:py-0">
          <p className="hidden items-center gap-5 text-linie-stark md:flex">
            <span>
              {ADRESSE.strasse}, {ADRESSE.plz} {ADRESSE.ort}
            </span>
            <span aria-hidden="true" className="text-grau-text">
              |
            </span>
            <span>350 m vom Bahnhof Baden</span>
          </p>

          <div className="flex flex-1 items-center justify-between gap-4 md:flex-none md:justify-end md:gap-5">
            {TELEFONNUMMERN.map((nummer) => (
              <a
                key={nummer.tel}
                href={`tel:${nummer.tel}`}
                className="font-semibold tabular-nums underline-offset-4 hover:underline"
              >
                {nummer.anzeige}
              </a>
            ))}
            <a
              href={`mailto:${ADRESSE.email}`}
              className="hidden text-linie-stark underline-offset-4 hover:underline lg:inline"
            >
              {ADRESSE.email}
            </a>
          </div>
        </div>
      </div>

      <div className="relative border-b border-flaeche-3">
        {/*
          Der gelbe Streifen der alten Seite (Kundenwunsch 27.07.2026). Er
          laeuft durch die ganze Kopfzeile und durch das Logo hindurch — ein
          Erkennungsmerkmal, das die Kundschaft von frueher kennt.

          DIE HOEHE IST NICHT FREI WAEHLBAR

          Im Logo ist der Untertitel "Fahrschule Verkehrszentrum" selbst gelb.
          Laege der Streifen dort, stuende Gelb auf Gelb und vom Untertitel
          bliebe nur die dunkle Kontur. Er kreuzt deshalb den roten Schriftzug
          darueber, genau wie auf der alten Seite.

          Gemessen: der gelbe Untertitel belegt 72,5% bis 93,9% der Bildhoehe.
          Bei 58px Logo in einer 89px hohen Zeile beginnt er auf 57px.

          Nach unten begrenzt ihn ausserdem die Navigation. Lag er tiefer, teilte
          er jede Beschriftung waagrecht in eine Haelfte auf Gelb und eine auf
          Weiss. Beide Haelften haben fuer sich genug Kontrast — Schwarz auf
          Gelb liegt bei 15,9:1 —, aber ein Wort, durch das eine Kante laeuft,
          liest sich schlechter als eines ohne, und die Zeile sah aus, als waere
          sie durchgestrichen.

          top-[31%] loest beides: der Streifen liegt auf 23 bis 33px, kreuzt den
          roten Schriftzug und laeuft knapp ueber den Beschriftungen durch. Wer
          die Logohoehe, die Schriftgroesse oder die Zeilenhoehe aendert,
          rechnet den Wert nach — scripts/verify-kopfzeile.mts schlaegt sonst
          an.

          Nicht der Diagonalstreifen aus diagonalstreifen.tsx: der ist das
          Element auf den Flaechen, dieser hier ist eine gerade Linie.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[31%] h-2 -translate-y-1/2 bg-brand-gelb lg:h-2.5"
        />

        {/* relative: die Zeile liegt ueber dem Streifen, sonst deckte er das
            Logo zur Haelfte zu. */}
        <div className="relative mx-auto flex w-full max-w-[1344px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:h-22 lg:py-0">
          <Link href="/" onClick={() => setOffen(false)}>
            {/*
              Das Schriftlogo der Fahrschule, unveraendert uebernommen
              (Vorlage, Style Tile: "Bestehendes Schriftlogo bleibt
              unveraendert"). width und height sind die echten Bildmasse, damit
              der Platz vor dem Laden reserviert ist und nichts springt.
              priority nur hier: es ist das erste Bild ueber der Falz.
            */}
            <Image
              src="/haudis-logo.png"
              alt="Haudi's Fahrschule & Verkehrsschule"
              width={993}
              height={586}
              priority
              className="h-10 w-auto lg:h-[58px]"
            />
          </Link>

          {/*
            Navigation rechts statt mittig (Kundenwunsch 27.07.2026, wie auf
            der alten Seite). Sie steht mit dem Probelektion-Knopf in einer
            Gruppe, damit zwischen Logo und erstem Menuepunkt eine freie
            Strecke bleibt, auf der der Streifen sichtbar durchlaeuft.
          */}
          <div className="flex items-center gap-2 lg:gap-8">
            <nav aria-label="Hauptnavigation" className="hidden lg:block">
              {/*
                Die aktive Seite ist schwarz unterstrichen, nicht mehr gelb:
                seit der Streifen durch die Zeile laeuft, waere ein gelber
                Strich auf gelbem Grund kein Hinweis mehr, sondern nichts.
              */}
              <ul className="flex items-center gap-8">
                {NAVIGATION.map((eintrag) => {
                  const aktiv = pfad === eintrag.href;
                  return (
                    <li key={eintrag.href}>
                      <Link
                        href={eintrag.href}
                        aria-current={aktiv ? "page" : undefined}
                        className={cn(
                          "inline-flex min-h-11 items-center border-b-[3px] text-[15px] transition-colors",
                          aktiv
                            ? "border-brand-schwarz font-semibold"
                            : "border-transparent hover:text-brand-rot",
                        )}
                      >
                        {eintrag.text}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/*
              Die Raender sind schwarz statt flaeche-3: alle drei Knoepfe
              stehen auf dem gelben Streifen, und eine hellgraue Linie ist dort
              nicht mehr zu sehen. Beim Probelektion-Knopf verschwaende ohne
              Rand die Form ganz, weil er dieselbe Farbe hat wie der Streifen.
            */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-11 items-center gap-2 border border-brand-schwarz bg-brand-gelb px-4.5 font-semibold text-brand-schwarz transition-colors hover:bg-brand-gelb-dunkel sm:inline-flex"
            >
              <MessageCircle aria-hidden="true" className="size-[18px]" />
              Probelektion
            </a>

            <a
              href={`tel:${TELEFONNUMMERN[0].tel}`}
              aria-label={`Anrufen: ${TELEFONNUMMERN[0].anzeige}`}
              className="inline-flex size-11 items-center justify-center border border-brand-schwarz bg-card sm:hidden"
            >
              <Phone aria-hidden="true" className="size-5" />
            </a>

            <button
              type="button"
              onClick={() => setOffen((zustand) => !zustand)}
              aria-expanded={offen}
              aria-controls="hauptmenue"
              aria-label={offen ? "Menü schliessen" : "Menü öffnen"}
              className="inline-flex size-11 items-center justify-center border border-brand-schwarz bg-card lg:hidden"
            >
              {offen ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {offen ? (
        <nav
          id="hauptmenue"
          aria-label="Hauptnavigation"
          className="border-b border-flaeche-3 bg-card lg:hidden"
        >
          <ul className="mx-auto w-full max-w-[1344px] px-4 py-2 sm:px-6">
            {NAVIGATION.map((eintrag) => (
              <li key={eintrag.href}>
                <Link
                  href={eintrag.href}
                  onClick={() => setOffen(false)}
                  aria-current={pfad === eintrag.href ? "page" : undefined}
                  className="flex min-h-12 items-center border-b border-flaeche-3 font-medium last:border-b-0"
                >
                  {eintrag.text}
                </Link>
              </li>
            ))}
            <li className="border-t border-flaeche-3 py-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 bg-brand-gelb px-4 font-semibold text-brand-schwarz"
              >
                <MessageCircle aria-hidden="true" className="size-[18px]" />
                Gratis Probelektion
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
