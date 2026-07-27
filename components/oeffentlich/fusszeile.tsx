import Image from "next/image";
import Link from "next/link";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";
import type { Oeffnungszeiten } from "@/lib/oeffnungszeiten";

/**
 * Fusszeile der oeffentlichen Website.
 *
 * Geschaeftsregel 6: beide Telefonnummern als tel:-Links.
 * Geschaeftsregel 9: der einzige Login des Projekts steht hier als kleiner
 * "Team-Login". Kunden haben kein Konto, es gibt nichts zu registrieren.
 */
export function Fusszeile({ zeiten }: { zeiten: Oeffnungszeiten }) {
  return (
    <footer className="mt-20 border-t border-border bg-flaeche-2">
      <div className="mx-auto grid grid-cols-1 w-full max-w-[1344px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          {/* Kein priority: die Fusszeile steht unter der Falz und soll die
              erste Anzeige nicht ausbremsen. */}
          <Image
            src="/haudis-logo.png"
            alt="Haudi's Fahrschule & Verkehrsschule"
            width={993}
            height={586}
            className="h-11 w-auto"
          />
          <p className="sr-only">{ADRESSE.firma}</p>
          <address className="mt-3 not-italic text-sm text-muted-foreground">
            {ADRESSE.strasse}
            <br />
            {ADRESSE.plz} {ADRESSE.ort}
          </address>
          <p className="mt-3 text-sm text-muted-foreground">
            350 m vom Bahnhof Baden
          </p>
        </div>

        <div>
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Kontakt
          </p>
          <ul className="mt-3 space-y-1">
            {TELEFONNUMMERN.map((nummer) => (
              <li key={nummer.tel}>
                <a
                  href={`tel:${nummer.tel}`}
                  className="inline-flex min-h-11 items-center font-heading font-semibold transition-colors hover:text-brand-rot"
                >
                  {nummer.anzeige}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${ADRESSE.email}`}
                className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
              >
                {ADRESSE.email}
              </a>
            </li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            {zeiten.anzeige}
            {zeiten.hinweis ? (
              <>
                <br />
                {zeiten.hinweis}
              </>
            ) : null}
          </p>
        </div>

        <div>
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Angebot
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <Link href="/kurse" className="inline-flex min-h-9 items-center hover:text-brand-rot">
                Kurse
              </Link>
            </li>
            <li>
              <Link href="/kursdaten" className="inline-flex min-h-9 items-center hover:text-brand-rot">
                Kursdaten
              </Link>
            </li>
            <li>
              <Link href="/fahrstunden" className="inline-flex min-h-9 items-center hover:text-brand-rot">
                Fahrstunden
              </Link>
            </li>
            <li>
              <Link href="/fuehrerausweis" className="inline-flex min-h-9 items-center hover:text-brand-rot">
                Weg zum Führerausweis
              </Link>
            </li>
            <li>
              <Link href="/galerie" className="inline-flex min-h-9 items-center hover:text-brand-rot">
                Galerie
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1344px] flex-wrap items-center justify-between gap-4 px-4 py-5 text-sm text-muted-foreground sm:px-6">
          <p>
            © {new Date().getFullYear()} {ADRESSE.firma}
          </p>
          <nav aria-label="Rechtliches">
            <ul className="flex flex-wrap items-center gap-4">
              <li>
                <Link href="/agb" className="underline underline-offset-4 hover:text-foreground">
                  AGB
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="underline underline-offset-4 hover:text-foreground">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="underline underline-offset-4 hover:text-foreground">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/team/login" className="hover:text-foreground">
                  Team-Login
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
