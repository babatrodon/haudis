import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { GoogleBewertung } from "@/components/google-bewertung";
import { Abschnitt, AbschnittTitel, Bezeichnung } from "@/components/oeffentlich/abschnitt";
import { KontaktKarte } from "@/components/oeffentlich/kontakt-karte";
import { einstellungenLesen, whatsappLink } from "@/lib/einstellungen";
import { googleProfilLesen } from "@/lib/google";
import { ADRESSE } from "@/lib/kontakt";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

export const metadata: Metadata = {
  title: "Kontakt | Haudi's Fahrschule Baden",
  description:
    "Haselstrasse 33, 5400 Baden, 350 m vom Bahnhof. Telefon 079 604 44 44 und 079 202 97 97, info@haudi.ch. Montag bis Samstag von 07:00 bis 21:00 Uhr.",
};

/**
 * Kontakt.
 *
 * Traegt denselben Block wie der Fuss der Startseite, nur mit der Ueberschrift
 * als h1. Darunter das, was nur hierher gehoert: Oeffnungszeiten, der Weg vom
 * Bahnhof mit dem Knopf zur Navigation, und die Bewertungen.
 */
export default async function KontaktSeite() {
  const [zeiten, profil, werte, whatsappUrl] = await Promise.all([
    oeffnungszeitenLesen(),
    googleProfilLesen(),
    einstellungenLesen(),
    whatsappLink("whatsapp.text.allgemein"),
  ]);

  return (
    <div className="bg-card">
      <section className="border-b border-flaeche-3">
        <KontaktKarte
          alsUeberschrift="h1"
          titelId="kontakt-titel"
          whatsappUrl={whatsappUrl}
          einleitung="Am schnellsten geht es telefonisch. Beide Nummern führen zu uns, ruf einfach an."
        />
      </section>

      <Abschnitt aria-labelledby="hierher-titel">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <Bezeichnung>Anfahrt</Bezeichnung>
            <AbschnittTitel id="hierher-titel">
              350 m vom Bahnhof Baden
            </AbschnittTitel>
            <p className="mt-5 max-w-[520px] leading-[1.6] text-grau-text">
              Rund fünf Minuten zu Fuss. Du brauchst kein Auto, um zu uns zu
              kommen. Wer trotzdem fährt: in der Umgebung gibt es
              Parkmöglichkeiten.
            </p>

            <p className="mt-7">
              <a
                href={profil.routeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 bg-brand-schwarz px-5 font-semibold text-flaeche-1 transition-colors hover:bg-brand-schwarz-weich"
              >
                Route planen
                <ExternalLink aria-hidden="true" className="size-4" />
                <span className="sr-only">(öffnet Google Maps in neuem Tab)</span>
              </a>
            </p>
          </div>

          <dl className="border-t border-flaeche-3">
            <Angabe bezeichnung="Öffnungszeiten">
              {zeiten.anzeige}
              {zeiten.hinweis ? (
                <>
                  <br />
                  {zeiten.hinweis}
                </>
              ) : null}
            </Angabe>
            <Angabe bezeichnung="Anschrift">
              {ADRESSE.firma}
              <br />
              {ADRESSE.strasse}
              <br />
              {ADRESSE.plz} {ADRESSE.ort}
            </Angabe>
            <Angabe bezeichnung="Koordinaten">
              <span className="tabular-nums">
                {werte["geo.breitengrad"]}, {werte["geo.laengengrad"]}
              </span>
            </Angabe>
          </dl>
        </div>
      </Abschnitt>

      <Abschnitt aria-labelledby="bewertungen-titel">
        <h2 id="bewertungen-titel" className="sr-only">
          Bewertungen
        </h2>
        <GoogleBewertung profil={profil} />
      </Abschnitt>
    </div>
  );
}

function Angabe({
  bezeichnung,
  children,
}: {
  bezeichnung: string;
  children: React.ReactNode;
}) {
  return (
    // Auf dem Handy uebereinander: "Öffnungszeiten" passt in keine Spalte, die
    // neben sich noch Platz fuer die Angabe laesst, und wurde mitten im Wort
    // umgebrochen.
    <div className="grid grid-cols-1 gap-x-5 border-b border-flaeche-3 py-3.5 leading-[1.5] sm:grid-cols-[140px_minmax(0,1fr)]">
      <dt className="text-grau-text-hell">{bezeichnung}</dt>
      <dd>{children}</dd>
    </div>
  );
}
