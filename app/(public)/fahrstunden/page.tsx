import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { KontaktStreifen } from "@/components/oeffentlich/kontakt-streifen";
import { Button } from "@/components/ui/button";
import { einstellungenLesen, whatsappLink } from "@/lib/einstellungen";
import { chf } from "@/lib/format";
import {
  fahrstundenPreiseLesen,
  type FahrstundenPreise,
} from "@/lib/fahrstunden";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

export const metadata: Metadata = {
  title: "Fahrstunden und Preise | Haudi's Fahrschule Baden",
  description:
    "Fahrlektionen für Auto, Motorrad, Anhänger BE, Lastwagen und Taxi. Preise, Abos und die gratis Probelektion.",
};

export default async function FahrstundenSeite() {
  const [kategorien, werte, zeiten, kontaktUrl] = await Promise.all([
    fahrstundenPreiseLesen(),
    einstellungenLesen(),
    oeffnungszeitenLesen(),
    whatsappLink("whatsapp.text.allgemein"),
  ]);

  // Die WhatsApp-Links pro Kategorie einmal vorbereiten.
  const whatsappNummer = werte["whatsapp.nummer"];
  const linkFuer = (textSchluessel: string) =>
    `https://wa.me/${whatsappNummer}?text=${encodeURIComponent(
      werte[textSchluessel as keyof typeof werte],
    )}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <header className="max-w-3xl">
        <p className="inline-block border-b-4 border-brand-gelb pb-1 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Praktische Ausbildung
        </p>
        <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
          Fahrstunden
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Die erste Lektion ist gratis. Danach entscheidest Du, ob Du einzeln
          buchst oder mit einem Abo günstiger fährst.
        </p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {kategorien.map((eintrag) => (
          <KategorieKarte
            key={eintrag.kategorie.slug}
            eintrag={eintrag}
            whatsappUrl={linkFuer(eintrag.kategorie.whatsappText)}
          />
        ))}
      </div>

      <p className="mt-8 border border-border bg-flaeche-2 p-5 text-sm text-muted-foreground">
        Alle Preise in Schweizer Franken pro Lektion. Bei den Kategorien Auto
        und Taxi kommt einmalig ein Anteil an Versicherung und
        Administrationsaufwand dazu, fällig mit der ersten Lektion.
      </p>

      <div className="mt-16">
        <KontaktStreifen zeiten={zeiten} whatsappUrl={kontaktUrl} />
      </div>
    </div>
  );
}

function KategorieKarte({
  eintrag,
  whatsappUrl,
}: {
  eintrag: FahrstundenPreise;
  whatsappUrl: string;
}) {
  const { kategorie } = eintrag;

  return (
    <article className="flex flex-col border border-border bg-card">
      <div className="border-b border-border p-6">
        <h2 className="font-heading text-2xl font-bold">{kategorie.name}</h2>
        <p className="mt-2 text-muted-foreground">{kategorie.beschreibung}</p>
      </div>

      <div className="flex-1 p-6">
        {eintrag.aufAnfrage ? (
          <AufAnfrage />
        ) : eintrag.preisform === "abo" ? (
          <AboPreise eintrag={eintrag} />
        ) : (
          <LkwPreise eintrag={eintrag} />
        )}
      </div>

      <div className="border-t border-border p-6">
        <Button asChild variant="akzent" className="w-full">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            {eintrag.aufAnfrage
              ? "Preis anfragen"
              : "Gratis Probelektion buchen"}
          </a>
        </Button>
      </div>
    </article>
  );
}

/**
 * Kategorien ohne bestaetigten Preis. Statt einer erfundenen Zahl steht hier
 * der direkte Weg zum Gespraech (PLAN.md Abschnitt 12, offener Punkt 2).
 */
function AufAnfrage() {
  return (
    <div>
      <p className="font-heading text-2xl font-bold">Auf Anfrage</p>
      <p className="mt-2 text-muted-foreground">
        Für diese Kategorie stellen wir den Preis individuell zusammen. Ruf uns
        an oder schreib uns, wir melden uns gleich mit einer Offerte.
      </p>
      <ul className="mt-4 space-y-2">
        {TELEFONNUMMERN.map((nummer) => (
          <li key={nummer.tel}>
            <a
              href={`tel:${nummer.tel}`}
              className="inline-flex min-h-11 items-center gap-2 font-heading font-semibold transition-colors hover:text-brand-rot"
            >
              <Phone aria-hidden="true" className="size-4" />
              {nummer.anzeige}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AboPreise({
  eintrag,
}: {
  eintrag: Extract<FahrstundenPreise, { preisform: "abo" }>;
}) {
  const zeilen = [
    { text: "Einzellektion", preis: eintrag.einzel },
    { text: "5er-Abo, pro Lektion", preis: eintrag.abo5 },
    { text: "10er-Abo, pro Lektion", preis: eintrag.abo10 },
  ].filter((zeile) => zeile.preis !== null);

  return (
    <div>
      <dl className="space-y-3">
        {zeilen.map((zeile) => (
          <div
            key={zeile.text}
            className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0"
          >
            <dt className="text-muted-foreground">{zeile.text}</dt>
            <dd className="font-heading text-xl font-bold tabular-nums">
              {chf(zeile.preis as number)}
            </dd>
          </div>
        ))}
      </dl>

      {eintrag.adminGebuehr !== null ? (
        <p className="mt-4 border-l-4 border-brand-gelb pl-3 text-sm text-muted-foreground">
          Einmalig {chf(eintrag.adminGebuehr)} Anteil an Versicherung und
          Administration, fällig mit der ersten Lektion.
        </p>
      ) : null}
    </div>
  );
}

function LkwPreise({
  eintrag,
}: {
  eintrag: Extract<FahrstundenPreise, { preisform: "lkw" }>;
}) {
  const zeilen = [
    { text: "Praktische Lektion", preis: eintrag.praktisch },
    { text: "Theorielektion", preis: eintrag.theorie },
  ].filter((zeile) => zeile.preis !== null);

  return (
    <dl className="space-y-3">
      {zeilen.map((zeile) => (
        <div
          key={zeile.text}
          className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0"
        >
          <dt className="text-muted-foreground">{zeile.text}</dt>
          <dd className="font-heading text-xl font-bold tabular-nums">
            {chf(zeile.preis as number)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
