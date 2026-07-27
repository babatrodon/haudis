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

      <div className="relative bg-card">
        {/*
          Der gelbe Streifen der alten Seite (Kundenwunsch 27.07.2026). Er
          liegt an der Unterkante der Kopfzeile und ersetzt dort die
          Trennlinie zur Hero-Flaeche.

          WARUM GENAU DORT

          Auf der alten Seite laeuft er durch den unteren Teil des Logos, auf
          der Hoehe des gelben Untertitels "Fahrschule Verkehrszentrum" — nicht
          durch den roten Schriftzug darueber. Das H des Schriftzugs bleibt
          frei.

          Gemessen am Original public/haudis-logo.png (993x586): der rote
          Schriftzug endet auf 68% der Bildhoehe, der gelbe Untertitel belegt
          72,5% bis 95%. Weil das Logo mit seiner Unterkante auf der
          Zeilenunterkante steht, faellt der Streifen von selbst in dieses
          Band: bei 96px Logo und 10px Streifen kreuzt er die unteren 10% des
          Bildes. Die Zeilenhoehe ergibt sich aus dem Logo, sie ist nicht
          gesetzt — wer das Logo skaliert, verschiebt beides zusammen.

          GELB AUF GELB

          Der Untertitel ist selbst gelb. Laege der Streifen sichtbar hinter
          ihm, bliebe von der Schrift nur die dunkle Kontur. Deshalb steht das
          Logo auf einer dunklen Tafel (wie auf der alten Seite), und der
          Streifen laeuft hinter der Tafel durch: der Untertitel steht auf
          Schwarz, so wie im Fuss der Seite auch. Rechts der Tafel tritt der
          Streifen auf der Hoehe des Untertitels wieder hervor.

          Wer daran etwas aendert, laesst pnpm verify:kopfzeile laufen. Nicht
          der Diagonalstreifen aus diagonalstreifen.tsx: der ist das Element
          auf den Flaechen, dieser hier ist eine gerade Linie.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-brand-gelb lg:h-2.5"
        />

        {/* items-stretch: die dunkle Tafel reicht von der Oberkante der Zeile
            bis auf den Streifen hinunter. relative: die Zeile liegt ueber dem
            Streifen, sonst liefe er ueber die Tafel statt dahinter. */}
        <div className="relative mx-auto flex w-full max-w-[1344px] items-stretch justify-between gap-4 px-4 sm:px-6">
          {/*
            Die dunkle Tafel. Sie schliesst oben an den Kontaktstreifen an und
            unten an die Hero-Flaeche; das Logo steht mit seiner Unterkante auf
            der Zeilenunterkante, damit der Streifen es auf der Hoehe des
            Untertitels kreuzt.
          */}
          <Link
            href="/"
            onClick={() => setOffen(false)}
            className="flex items-end bg-brand-schwarz px-4 pt-3 lg:px-6 lg:pt-4"
          >
            {/*
              Das Schriftlogo der Fahrschule, unveraendert uebernommen
              (Vorlage, Style Tile: "Bestehendes Schriftlogo bleibt
              unveraendert"). width und height sind die echten Bildmasse, damit
              der Platz vor dem Laden reserviert ist und nichts springt.
              priority nur hier: es ist das erste Bild ueber der Falz.

              Die Hoehe steigt in drei Stufen. Nach unten begrenzt sie der
              Untertitel: unter 64px sind die beiden Zeilen im Bild nur noch
              zu erahnen. Nach oben begrenzt sie auf dem Handy die Zeile — das
              Logo darf den Menueknopf nicht bedraengen — und ab 1024px die
              Navigation, die daneben Platz braucht.
            */}
            <Image
              src="/haudis-logo.png"
              alt="Haudi's Fahrschule & Verkehrsschule"
              width={993}
              height={586}
              priority
              className="h-16 w-auto lg:h-20 xl:h-24"
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
                Die aktive Seite ist gelb unterstrichen wie in der Vorlage. Der
                Streifen liegt an der Unterkante der Zeile und beruehrt die
                Beschriftungen nicht mehr, also steht der gelbe Strich wieder
                auf Weiss und ist als Hinweis lesbar.
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
