import type { Metadata } from "next";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { GoogleBewertung } from "@/components/google-bewertung";
import { Button } from "@/components/ui/button";
import { einstellungenLesen, whatsappLink } from "@/lib/einstellungen";
import { googleProfilLesen } from "@/lib/google";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

export const metadata: Metadata = {
  title: "Kontakt | Haudi's Fahrschule Baden",
  description:
    "Haselstrasse 33, 5400 Baden, 350 m vom Bahnhof. Telefon 079 604 44 44 und 079 202 97 97, info@haudi.ch. Montag bis Samstag von 07:00 bis 21:00 Uhr.",
};

export default async function KontaktSeite() {
  const [zeiten, profil, werte, whatsappUrl] = await Promise.all([
    oeffnungszeitenLesen(),
    googleProfilLesen(),
    einstellungenLesen(),
    whatsappLink("whatsapp.text.allgemein"),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <header className="max-w-3xl">
        <p className="inline-block border-b-4 border-brand-gelb pb-1 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          So erreichst Du uns
        </p>
        <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
          Kontakt
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Am schnellsten geht es telefonisch. Beide Nummern führen zu uns, ruf
          einfach an.
        </p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="telefon-titel"
          className="border border-border bg-card p-6 sm:p-8"
        >
          <h2 id="telefon-titel" className="font-heading text-2xl font-bold">
            Telefon und Nachricht
          </h2>

          <ul className="mt-6 space-y-3">
            {TELEFONNUMMERN.map((nummer) => (
              <li key={nummer.tel}>
                <a
                  href={`tel:${nummer.tel}`}
                  className="flex min-h-14 items-center justify-between gap-4 border border-border px-5 font-heading text-xl font-bold transition-colors hover:bg-accent"
                >
                  <span className="flex items-center gap-3">
                    <Phone aria-hidden="true" className="size-5" />
                    {nummer.anzeige}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    anrufen
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="akzent">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp schreiben
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:${ADRESSE.email}`}>
                <Mail aria-hidden="true" className="size-4" />
                {ADRESSE.email}
              </a>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            WhatsApp läuft über {TELEFONNUMMERN[0].anzeige}.
          </p>

          <div className="mt-6 border-t border-border pt-6">
            <h3 className="font-heading font-bold">Öffnungszeiten</h3>
            <p className="mt-2 text-muted-foreground">
              {zeiten.anzeige}
              {zeiten.hinweis ? (
                <>
                  <br />
                  {zeiten.hinweis}
                </>
              ) : null}
            </p>
          </div>
        </section>

        {/*
          Bewusst kein eingebetteter Kartendienst: eine Karte im iframe laedt
          bei jedem Aufruf Daten zu einem Dritten und muesste in der
          Datenschutzerklaerung als Auftragsverarbeiter stehen. Der Knopf
          oeffnet die Navigation erst auf Klick, mit den exakten Koordinaten.
        */}
        <section
          aria-labelledby="adresse-titel"
          className="border border-border bg-card p-6 sm:p-8"
        >
          <h2 id="adresse-titel" className="font-heading text-2xl font-bold">
            Standort
          </h2>

          <address className="mt-6 flex gap-3 not-italic">
            <MapPin
              aria-hidden="true"
              className="mt-1 size-5 shrink-0 text-muted-foreground"
            />
            <span className="text-lg">
              <span className="font-heading font-bold">{ADRESSE.firma}</span>
              <br />
              {ADRESSE.strasse}
              <br />
              {ADRESSE.plz} {ADRESSE.ort}
            </span>
          </address>

          <p className="mt-5 border-l-4 border-brand-gelb pl-4 text-muted-foreground">
            350 m vom Bahnhof Baden, rund fünf Minuten zu Fuss. Du brauchst kein
            Auto, um zu uns zu kommen.
          </p>

          <div className="mt-6">
            <Button asChild className="w-full sm:w-auto">
              <a
                href={profil.routeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Route planen
                <ExternalLink aria-hidden="true" className="size-4" />
                <span className="sr-only">
                  (öffnet Google Maps in neuem Tab)
                </span>
              </a>
            </Button>
          </div>

          <dl className="mt-6 border-t border-border pt-6 text-sm">
            <dt className="text-muted-foreground">Koordinaten</dt>
            <dd className="mt-1 tabular-nums">
              {werte["geo.breitengrad"]}, {werte["geo.laengengrad"]}
            </dd>
          </dl>
        </section>
      </div>

      <section aria-labelledby="bewertungen-titel" className="mt-6">
        <h2 id="bewertungen-titel" className="sr-only">
          Bewertungen
        </h2>
        <GoogleBewertung profil={profil} />
      </section>
    </div>
  );
}
