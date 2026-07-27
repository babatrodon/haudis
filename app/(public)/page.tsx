import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Bildplatzhalter } from "@/components/bildplatzhalter";
import { GoogleBewertung } from "@/components/google-bewertung";
import {
  Abschnitt,
  AbschnittTitel,
  Bezeichnung,
} from "@/components/oeffentlich/abschnitt";
import { Diagonalstreifen } from "@/components/oeffentlich/diagonalstreifen";
import { FaqListe } from "@/components/oeffentlich/faq-liste";
import { KontaktKarte } from "@/components/oeffentlich/kontakt-karte";
import { Kurskarte } from "@/components/oeffentlich/kurskarte";
import { VorteilSymbol } from "@/components/oeffentlich/vorteil-symbole";
import { einstellungenLesen, whatsappLink } from "@/lib/einstellungen";
import { chf } from "@/lib/format";
import { googleProfilLesen } from "@/lib/google";
import { SCHRITTE_KURZ } from "@/lib/inhalte/fuehrerausweis";
import { VORTEILE } from "@/lib/inhalte/warum-uns";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { kommendeKurse } from "@/lib/kurse";

export const metadata: Metadata = {
  title: "Haudi's Fahrschule & Verkehrsschule Baden",
  description:
    "Fahrschule in Baden: VKU, Nothelferkurs, Theorieunterricht und Fahrstunden. Montag bis Samstag von 07:00 bis 21:00 Uhr. Gratis Probelektion vereinbaren.",
};

/**
 * Startseite, nach design/haudis-design.dc.html Screen 02.
 *
 * Reihenfolge der Vorlage: Hero, naechste Kurse, warum uns, Fahrstundenpreise,
 * der Weg zum Fuehrerausweis, Bewertungen, haeufige Fragen, Kontakt. Die
 * Kurse stehen weit oben, weil sie der Grund sind, aus dem die Seite
 * aufgerufen wird.
 */
export default async function StartSeite() {
  const [kurse, profil, werte, probelektionUrl] = await Promise.all([
    kommendeKurse({ limit: 3 }),
    googleProfilLesen(),
    einstellungenLesen(),
    whatsappLink("whatsapp.text.auto"),
  ]);

  /** Betraege fuer die Antworttexte. Leer heisst "auf Anfrage". */
  const preise = {
    einzel: preisOderNichts(werte["fahrstunden.auto.einzel"]),
    abo5: preisOderNichts(werte["fahrstunden.auto.abo5"]),
    abo10: preisOderNichts(werte["fahrstunden.auto.abo10"]),
    admin: preisOderNichts(werte["fahrstunden.adminGebuehr"]),
    gutschein: werte["wab.gutscheincode"],
  };

  return (
    <>
      <Hero probelektionUrl={probelektionUrl} />

      <Abschnitt aria-labelledby="kurse-titel">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 lg:mb-10">
          <div>
            <Bezeichnung>Kurse</Bezeichnung>
            <AbschnittTitel id="kurse-titel">Nächste Kurse</AbschnittTitel>
          </div>
          <Link
            href="/kursdaten"
            className="inline-flex min-h-11 items-center border-b-[3px] border-brand-gelb pb-0.5 font-semibold"
          >
            Alle Kursdaten
          </Link>
        </div>

        {kurse.length === 0 ? (
          <p className="border border-flaeche-3 bg-flaeche-1 p-6 text-grau-text">
            Zurzeit ist kein Kurs ausgeschrieben. Ruf uns an, wir sagen Dir,
            wann der nächste startet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {kurse.map((kurs) => (
              <Kurskarte key={kurs.id} kurs={kurs} />
            ))}
          </div>
        )}
      </Abschnitt>

      <Abschnitt aria-labelledby="warum-titel">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
          <div>
            <Bezeichnung>Fahrschule Baden</Bezeichnung>
            <AbschnittTitel id="warum-titel">Warum uns wählen?</AbschnittTitel>
            <p className="mt-4 leading-[1.6] text-grau-text">
              Sechs Gründe, die unsere Schülerinnen und Schüler am häufigsten
              nennen.
            </p>
          </div>

          {/* Raster mit durchgehenden Linien: die Zellen teilen sich die
              Trennlinien, deshalb Rahmen oben und links am Container und
              rechts und unten an jeder Zelle. */}
          <ul className="grid grid-cols-1 border-l border-t border-flaeche-3 sm:grid-cols-2 lg:grid-cols-3">
            {VORTEILE.map((vorteil) => (
              <li
                key={vorteil.titel}
                className="border-b border-r border-flaeche-3 p-6 lg:p-7"
              >
                <VorteilSymbol name={vorteil.symbol} />
                <h3
                  lang="de"
                  className="mb-2 font-heading text-lg font-semibold"
                >
                  {vorteil.titel}
                </h3>
                <p className="text-sm leading-[1.55] text-grau-text">
                  {vorteil.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Abschnitt>

      <Abschnitt hell aria-labelledby="preise-titel">
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Bezeichnung>Fahrstunden</Bezeichnung>
            <AbschnittTitel id="preise-titel">
              Preise, ohne Kleingedrucktes.
            </AbschnittTitel>
            <p className="mt-5 max-w-[440px] leading-[1.6] text-grau-text">
              Für Auto und Taxi. Je grösser das Abo, desto günstiger die
              Lektion. Fahrstunden nach Vereinbarung.
            </p>
            <Link
              href="/fahrstunden"
              className="mt-7 inline-flex min-h-12 items-center bg-brand-schwarz px-6 font-semibold text-flaeche-1 transition-colors hover:bg-brand-schwarz-weich"
            >
              Alle Preise ansehen
            </Link>
          </div>

          <div>
            <Preiszeile
              titel="1 Lektion"
              zusatz="einzeln"
              betrag={preise.einzel}
              erste
            />
            <Preiszeile
              titel="5er-Abo"
              zusatz="pro Lektion"
              betrag={preise.abo5}
            />
            <Preiszeile
              titel="10er-Abo"
              zusatz="pro Lektion"
              betrag={preise.abo10}
              letzte
            />
            {preise.admin ? (
              <p className="mt-4 flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-[7px] block size-2 shrink-0 bg-brand-gelb"
                />
                <span className="text-sm leading-[1.5] text-grau-text">
                  Einmalig {preise.admin} als Anteil für Versicherung und
                  Administration.
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </Abschnitt>

      <Abschnitt aria-labelledby="weg-titel">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6 lg:mb-11">
          <div className="max-w-[560px]">
            <Bezeichnung>Ablauf</Bezeichnung>
            <AbschnittTitel id="weg-titel">
              Der Weg zum Führerausweis
            </AbschnittTitel>
          </div>
          <p className="max-w-[420px] leading-[1.6] text-grau-text">
            Sieben Schritte, vom Sehtest bis zum WAB-Kurs. Wir sagen Dir bei
            jedem Schritt, was als Nächstes dran ist.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-x-12 border-t border-flaeche-3 lg:grid-cols-2">
          {SCHRITTE_KURZ.map((schritt, index) => (
            <li
              key={schritt.titel}
              className="flex gap-5 border-b border-flaeche-3 py-5"
            >
              <span
                aria-hidden="true"
                className="w-6 shrink-0 font-heading text-lg font-semibold tabular-nums text-linie-stark"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">
                  <span className="sr-only">Schritt {index + 1}: </span>
                  {schritt.titel}
                </h3>
                <p className="mt-1 text-sm leading-[1.55] text-grau-text">
                  {schritt.text.replace("{{gutschein}}", preise.gutschein)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Abschnitt>

      <Abschnitt aria-labelledby="bewertungen-titel">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
          <div>
            <Bezeichnung>Bewertungen</Bezeichnung>
            <AbschnittTitel id="bewertungen-titel">
              Das sagen unsere Schüler
            </AbschnittTitel>
          </div>
          <GoogleBewertung profil={profil} />
        </div>
      </Abschnitt>

      <Abschnitt aria-labelledby="faq-titel">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
          <div>
            <Bezeichnung>Häufige Fragen</Bezeichnung>
            <AbschnittTitel id="faq-titel">Gut zu wissen</AbschnittTitel>
            <p className="mt-4 text-sm text-grau-text">
              Fehlt etwas? Ruf uns an:{" "}
              <a
                href={`tel:${TELEFONNUMMERN[0].tel}`}
                className="font-semibold tabular-nums text-foreground underline-offset-4 hover:underline"
              >
                {TELEFONNUMMERN[0].anzeige}
              </a>
            </p>
          </div>
          <FaqListe preise={preise} />
        </div>
      </Abschnitt>

      <section
        aria-labelledby="kontakt-titel"
        className="border-b border-flaeche-3 bg-card"
      >
        <KontaktKarte titelId="kontakt-titel" whatsappUrl={probelektionUrl} />
      </section>
    </>
  );
}

/** Hero mit Bildspalte, nach der Vorlage 1fr neben 620px. */
function Hero({ probelektionUrl }: { probelektionUrl: string }) {
  return (
    <section
      aria-labelledby="hero-titel"
      className="border-b border-flaeche-3 bg-card"
    >
      <div className="mx-auto grid w-full max-w-[1344px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_520px]">
        <div className="flex flex-col justify-center px-4 py-10 sm:px-6 lg:py-20 lg:pl-12 lg:pr-14">
          <Bezeichnung>Fahrschule und Verkehrszentrum in Baden</Bezeichnung>
          <h1
            id="hero-titel"
            lang="de"
            className="font-heading text-[34px] font-semibold leading-[0.98] tracking-[-0.03em] text-pretty sm:text-[46px] lg:text-[60px]"
          >
            Sicher unterwegs. Von der ersten Lektion bis zur Prüfung.
          </h1>
          <p className="mt-5 max-w-[520px] leading-[1.55] text-grau-text sm:text-lg">
            Fahrstunden nach Vereinbarung, Kurse am Abend und am Wochenende.
            VKU, Nothelfer, BTU und Bögle bei uns im Haus, 350 m vom Bahnhof
            Baden.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={probelektionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-13 items-center gap-2.5 bg-brand-gelb px-6 text-[17px] font-semibold text-brand-schwarz transition-colors hover:bg-brand-gelb-dunkel"
            >
              <MessageCircle aria-hidden="true" className="size-5" />
              Gratis Probelektion
            </a>
            <Link
              href="/kursdaten"
              className="inline-flex min-h-13 items-center border border-brand-schwarz px-6 text-[17px] font-semibold transition-colors hover:bg-flaeche-2"
            >
              Kurse ansehen
            </Link>
          </div>

          <ul className="mt-8 flex max-w-[520px] flex-wrap gap-x-7 gap-y-1 border-t border-flaeche-3 pt-5 text-sm text-grau-text">
            <li>5 Unterrichtssprachen</li>
            <li>Alle Kategorien</li>
            <li>Familienrabatt</li>
          </ul>
        </div>

        <div className="relative border-flaeche-3 lg:border-l">
          <Bildplatzhalter
            beschreibung="Echtes Foto: Fahrschulauto"
            seitenverhaeltnis="4/3"
            className="lg:h-full"
          />
          {/* Diagonalstreifen als Referenz an die Fahrzeugbeklebung. */}
          <Diagonalstreifen className="absolute bottom-0 left-0 h-2.5 w-45" />
        </div>
      </div>
    </section>
  );
}

function Preiszeile({
  titel,
  zusatz,
  betrag,
  erste = false,
  letzte = false,
}: {
  titel: string;
  zusatz: string;
  betrag: string;
  erste?: boolean;
  letzte?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-4 ${
        erste ? "border-t border-brand-schwarz" : "border-t border-flaeche-3"
      } ${letzte ? "border-b border-flaeche-3" : ""}`}
    >
      <div>
        <p className="font-heading text-xl font-semibold">{titel}</p>
        <p className="text-[13px] text-grau-text-hell">{zusatz}</p>
      </div>
      <p className="font-heading text-2xl font-semibold tabular-nums lg:text-[30px]">
        {betrag || "auf Anfrage"}
      </p>
    </div>
  );
}

/**
 * Ein leerer Preis heisst nicht null, sondern "noch nicht bestaetigt". Die
 * Seite zeigt dann "auf Anfrage" statt CHF 0.00.
 */
function preisOderNichts(wert: string): string {
  const roh = wert.trim();
  return roh === "" ? "" : chf(roh);
}
