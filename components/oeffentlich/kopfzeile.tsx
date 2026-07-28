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
 * An der Unterkante der zweiten Zeile liegt der gelbe Streifen der alten
 * Seite (Kundenwunsch 27.07.2026). Er ist kein Schmuck, sondern ein
 * Wiedererkennungsmerkmal, und er ersetzt die Trennlinie zur Hero-Flaeche.
 * Das Logo steht auf einer dunklen Tafel, hinter der er durchlaeuft.
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

      {/* Keine Trennlinie zur Hero-Flaeche: das Band ist die Kante der
          Kopfzeile, eine graue Linie darunter waere eine zweite. */}
      <div className="relative bg-card">
        {/*
          Der gelbe Streifen der alten Seite (Kundenwunsch 27.07.2026, Bild der
          alten Kopfzeile vom 28.07.2026).

          DIE SCHICHTUNG IST DER PUNKT

          Der Streifen ist ein durchgehendes Band von Kante zu Kante. Es liegt
          hinter dem Logo, nicht daneben und nicht davor: das Bild ist
          durchsichtig, der Schriftzug steht darauf und das Band laeuft
          zwischen seinen Zuegen hindurch. Von oben nach unten: roter
          Schriftzug, darin das Band auf seinem unteren Drittel, darunter der
          gelbe Untertitel "Fahrschule Verkehrszentrum" auf freiem Grund.

          DIE LAGE IST NICHT FREI WAEHLBAR

          Nach unten begrenzt sie der Untertitel: der ist selbst gelb und
          beginnt auf 71,5% der Bildhoehe (zeilenweise ausgezaehlt am Original
          public/haudis-logo.png, 993x586). Laege das Band darauf, bliebe von
          der Schrift nur die dunkle Kontur. Nach oben begrenzt es die
          Navigation, die sonst waagrecht geteilt wuerde.

          Das Band liegt deshalb auf 48% bis 70% der Bildhoehe: es kreuzt das
          untere Drittel der Buchstaben, der Schwung darunter haengt frei. In
          der Zeile gerechnet, vom unteren Rand aus: 0,29 mal Logohoehe
          Abstand, 0,22 mal Logohoehe dick. Daraus stammen die vier Pixelwerte
          unten; wer die Logohoehe aendert, rechnet sie nach. pnpm
          verify:kopfzeile schlaegt sonst an.

          Ein Feld hinter dem Logo gibt es bewusst nicht: es wuerde das Band
          unterbrechen. Der Untertitel steht auf dem Grund der Kopfzeile, wie
          das Logo es ueberall sonst auch tut.

          Nicht der Diagonalstreifen aus diagonalstreifen.tsx: der ist das
          Element auf den Flaechen, dieser hier ist eine gerade Linie.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-6 h-[18px] bg-brand-gelb xl:bottom-[29px] xl:h-[21px]"
        />

        {/* items-end: das Logo steht mit seiner Unterkante auf der
            Zeilenunterkante, damit das Band im gerechneten Abstand darueber
            liegt. relative: die Zeile liegt ueber dem Band, sonst liefe es
            ueber den Schriftzug statt dahinter. */}
        <div className="relative mx-auto flex w-full max-w-[1344px] items-end justify-between gap-4 px-4 sm:px-6">
          <Link href="/" onClick={() => setOffen(false)} className="flex pt-6 xl:pt-4">
            {/*
              Das Schriftlogo der Fahrschule, unveraendert uebernommen
              (Vorlage, Style Tile: "Bestehendes Schriftlogo bleibt
              unveraendert"). width und height sind die echten Bildmasse, damit
              der Platz vor dem Laden reserviert ist und nichts springt.
              priority nur hier: es ist das erste Bild ueber der Falz.

              Kein Grund hinter dem Bild: das Band soll durch die
              durchsichtigen Stellen des Schriftzugs zu sehen sein.
            */}
            <Image
              src="/haudis-logo.png"
              alt="Haudi's Fahrschule & Verkehrsschule"
              width={993}
              height={586}
              priority
              className="h-20 w-auto xl:h-24"
            />
          </Link>

          {/*
            Navigation rechts statt mittig (Kundenwunsch 27.07.2026, wie auf
            der alten Seite). Sie steht mit dem Probelektion-Knopf in einer
            Gruppe, damit zwischen Logo und erstem Menuepunkt eine freie
            Strecke bleibt, auf der das Band sichtbar durchlaeuft.

            self-start: die Bedienung sitzt oben in der Zeile, das Band laeuft
            darunter durch. Zentriert waere sie darauf zu liegen gekommen, und
            ein Wort, durch das eine Kante laeuft, liest sich schlechter.
          */}
          <div className="flex items-center gap-2 self-start pt-2.5 lg:gap-8">
            <nav aria-label="Hauptnavigation" className="hidden lg:block">
              {/*
                Die aktive Seite ist gelb unterstrichen wie in der Vorlage. Der
                gelbe Strich steht auf Weiss, das Band liegt tiefer und
                beruehrt ihn nicht.
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
                            ? "border-brand-gelb font-semibold"
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
              Die Knoepfe stehen wieder auf Weiss, nicht mehr auf dem
              Streifen: der gelbe Knopf braucht deshalb keinen Rand, der ihn
              vom Grund abhebt, und die beiden Symbolknoepfe tragen wieder die
              hellgraue Linie der Vorlage statt einer schwarzen.
            */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-11 items-center gap-2 bg-brand-gelb px-4.5 font-semibold text-brand-schwarz transition-colors hover:bg-brand-gelb-dunkel sm:inline-flex"
            >
              <MessageCircle aria-hidden="true" className="size-[18px]" />
              Probelektion
            </a>

            <a
              href={`tel:${TELEFONNUMMERN[0].tel}`}
              aria-label={`Anrufen: ${TELEFONNUMMERN[0].anzeige}`}
              className="inline-flex size-11 items-center justify-center border border-flaeche-3 sm:hidden"
            >
              <Phone aria-hidden="true" className="size-5" />
            </a>

            <button
              type="button"
              onClick={() => setOffen((zustand) => !zustand)}
              aria-expanded={offen}
              aria-controls="hauptmenue"
              aria-label={offen ? "Menü schliessen" : "Menü öffnen"}
              className="inline-flex size-11 items-center justify-center border border-flaeche-3 lg:hidden"
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
