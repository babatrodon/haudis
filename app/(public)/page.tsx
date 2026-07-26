import type { Metadata } from "next";
import Link from "next/link";
import { Bildplatzhalter } from "@/components/bildplatzhalter";
import { GoogleBewertung } from "@/components/google-bewertung";
import { FaqListe } from "@/components/oeffentlich/faq-liste";
import { KontaktStreifen } from "@/components/oeffentlich/kontakt-streifen";
import { Kurskarte } from "@/components/oeffentlich/kurskarte";
import { Button } from "@/components/ui/button";
import { einstellungZahl, whatsappLink } from "@/lib/einstellungen";
import { chf } from "@/lib/format";
import { googleProfilLesen } from "@/lib/google";
import { VORTEILE } from "@/lib/inhalte/warum-uns";
import { kommendeKurse, type KursOeffentlich } from "@/lib/kurse";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

export const metadata: Metadata = {
  title: "Haudi's Fahrschule & Verkehrsschule Baden",
  description:
    "Fahrschule in Baden: VKU, Nothelferkurs, Theorieunterricht und Fahrstunden. Montag bis Samstag von 07:00 bis 21:00 Uhr. Gratis Probelektion vereinbaren.",
};

export default async function StartSeite() {
  const [kurse, profil, zeiten, probelektionUrl, buchungsfrageUrl, autoPreis] =
    await Promise.all([
      kommendeKurse({ limit: 3 }),
      googleProfilLesen(),
      oeffnungszeitenLesen(),
      whatsappLink("whatsapp.text.auto"),
      whatsappLink("whatsapp.text.buchung"),
      einstellungZahl("fahrstunden.auto.einzel"),
    ]);

  return (
    <>
      <Hero probelektionUrl={probelektionUrl} zeitenText={zeiten.anzeige} />

      <div className="mx-auto w-full max-w-6xl space-y-20 px-4 py-16 sm:px-6 sm:py-20">
        <WarumUns zeitenText={zeiten.anzeige} />
        <NaechsteKurse kurse={kurse} />
        <FahrstundenTeaser
          probelektionUrl={probelektionUrl}
          einzelpreis={autoPreis}
        />

        <section aria-labelledby="bewertungen-titel">
          <h2 id="bewertungen-titel" className="sr-only">
            Bewertungen
          </h2>
          <GoogleBewertung profil={profil} />
        </section>

        <section aria-labelledby="faq-titel">
          <h2
            id="faq-titel"
            className="font-heading text-3xl font-bold sm:text-4xl"
          >
            Häufige Fragen
          </h2>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Und wenn Deine Frage hier fehlt: ruf uns an, wir nehmen uns Zeit.
          </p>
          <div className="mt-8">
            <FaqListe />
          </div>
        </section>

        <KontaktStreifen zeiten={zeiten} whatsappUrl={buchungsfrageUrl} />
      </div>
    </>
  );
}

function Hero({
  probelektionUrl,
  zeitenText,
}: {
  probelektionUrl: string;
  zeitenText: string;
}) {
  return (
    <section className="border-b border-border bg-flaeche-2">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="inline-block border-b-4 border-brand-gelb pb-1 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Fahrschule in Baden
          </p>
          <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
            Sicher ans Steuer, in Deinem Tempo.
          </h1>
          <p className="mt-5 max-w-prose text-lg text-muted-foreground">
            Verkehrskundeunterricht, Nothelferkurs, Theorie und Fahrstunden aus
            einer Hand. {zeitenText}, damit die Ausbildung in Deinen Alltag
            passt.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a
                href={probelektionUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Gratis Probelektion buchen
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/kursdaten">Kursdaten ansehen</Link>
            </Button>
          </div>
        </div>

        <Bildplatzhalter
          seitenverhaeltnis="4/3"
          beschreibung="Ausbildungsfahrzeug von Haudi's Fahrschule vor dem Bahnhof Baden"
        />
      </div>
    </section>
  );
}

function WarumUns({ zeitenText }: { zeitenText: string }) {
  return (
    <section aria-labelledby="warum-titel">
      <h2
        id="warum-titel"
        className="font-heading text-3xl font-bold sm:text-4xl"
      >
        Warum uns wählen?
      </h2>

      <ul className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {VORTEILE.map((vorteil) => (
          <li key={vorteil.titel} className="bg-card p-6">
            <h3 className="font-heading text-lg font-bold">{vorteil.titel}</h3>
            <p className="mt-2 text-muted-foreground">
              {vorteil.zeitenPlatzhalter
                ? vorteil.text.replace("{{zeiten}}", `${zeitenText}.`)
                : vorteil.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NaechsteKurse({ kurse }: { kurse: KursOeffentlich[] }) {
  return (
    <section aria-labelledby="kurse-titel">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="kurse-titel"
            className="font-heading text-3xl font-bold sm:text-4xl"
          >
            Die nächsten Kurse
          </h2>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Alle Daten auf einen Blick, mit freien Plätzen und Preis.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/kursdaten">Alle Kursdaten</Link>
        </Button>
      </div>

      {kurse.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kurse.map((kurs) => (
            <Kurskarte key={kurs.id} kurs={kurs} />
          ))}
        </div>
      ) : (
        <p className="mt-8 border border-border bg-card p-6 text-muted-foreground">
          Aktuell sind keine Kursdaten ausgeschrieben. Ruf uns an, wir sagen Dir
          gerne, wann der nächste Kurs startet.
        </p>
      )}
    </section>
  );
}

function FahrstundenTeaser({
  probelektionUrl,
  einzelpreis,
}: {
  probelektionUrl: string;
  einzelpreis: number | null;
}) {
  return (
    <section
      aria-labelledby="fahrstunden-titel"
      className="grid gap-10 border border-border bg-card p-8 sm:p-12 lg:grid-cols-2 lg:items-center"
    >
      <div>
        <h2
          id="fahrstunden-titel"
          className="font-heading text-3xl font-bold sm:text-4xl"
        >
          Die erste Lektion geht auf uns
        </h2>
        <p className="mt-4 max-w-prose text-muted-foreground">
          Lern uns kennen, ohne etwas zu zahlen. In der Gratis-Probelektion
          fährst Du mit uns und siehst, ob die Chemie stimmt. Erst danach
          entscheidest Du.
        </p>

        {einzelpreis !== null ? (
          <p className="mt-6 font-heading text-lg">
            Danach ab {chf(einzelpreis)} pro Lektion,
            <span className="text-muted-foreground"> im Abo günstiger.</span>
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="akzent">
            <a href={probelektionUrl} target="_blank" rel="noopener noreferrer">
              Gratis Probelektion buchen
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/fahrstunden">Preise ansehen</Link>
          </Button>
        </div>
      </div>

      <Bildplatzhalter
        seitenverhaeltnis="3/2"
        beschreibung="Fahrlehrerin und Fahrschülerin im Ausbildungsfahrzeug"
      />
    </section>
  );
}
