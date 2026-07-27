import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { Bildplatzhalter } from "@/components/bildplatzhalter";
import { Bezeichnung } from "@/components/oeffentlich/abschnitt";
import { Diagonalstreifen } from "@/components/oeffentlich/diagonalstreifen";
import { einstellungenLesen, whatsappLink } from "@/lib/einstellungen";
import { chf } from "@/lib/format";
import {
  fahrstundenPreiseLesen,
  type FahrstundenPreise,
} from "@/lib/fahrstunden";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fahrstunden und Preise | Haudi's Fahrschule Baden",
  description:
    "Fahrlektionen für Auto, Taxi, Motorrad, Lastwagen und Anhänger BE. Preise, Abos und die gratis Probelektion.",
};

/**
 * Fahrstunden, nach design/haudis-design.dc.html Screen 05.
 *
 * Aufbau: Hero mit Bild, danach die Preiskarten, zum Schluss "Gut zu wissen".
 *
 * Die Karten teilen sich nach dem, was in den Einstellungen steht: Kategorien
 * mit hinterlegten Preisen bekommen die grossen Karten, Kategorien ohne die
 * kleinen. Das ist keine feste Liste, sondern folgt den Daten — traegt Ausilia
 * den Motorradpreis ein, rueckt Motorrad ohne Codeaenderung nach oben. Heute
 * ergibt das genau die Aufteilung der Vorlage: Auto und Taxi gross, Motorrad,
 * Lastwagen und Anhänger BE klein.
 *
 * Jede Karte traegt zwei Wege zum Kontakt, WhatsApp und Telefon. Wer eine
 * Fahrschule sucht, will fragen, nicht formulieren.
 */
export default async function FahrstundenSeite() {
  const [kategorien, werte, probelektionUrl] = await Promise.all([
    fahrstundenPreiseLesen(),
    einstellungenLesen(),
    whatsappLink("whatsapp.text.auto"),
  ]);

  const whatsappNummer = werte["whatsapp.nummer"];
  const linkFuer = (schluessel: string) =>
    `https://wa.me/${whatsappNummer}?text=${encodeURIComponent(
      werte[schluessel as keyof typeof werte],
    )}`;

  const adminGebuehr = werte["fahrstunden.adminGebuehr"];
  // Die ersten beiden Kategorien gross, der Rest klein. Welche das sind, steht
  // in der Reihenfolge in lib/fahrstunden.ts und nicht hier.
  const gross = kategorien.slice(0, 2);
  const klein = kategorien.slice(2);

  return (
    <div className="bg-card">
      <section className="border-b border-flaeche-3">
        <div className="mx-auto grid w-full max-w-[1344px] grid-cols-1 items-stretch lg:grid-cols-[minmax(0,1fr)_520px]">
          <div className="px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
            <Bezeichnung>Fahrstunden</Bezeichnung>
            <h1
              lang="de"
              className="max-w-[620px] font-heading text-[32px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[44px] lg:text-[56px] lg:leading-none"
            >
              Fahren lernen bei uns
            </h1>
            <p className="mt-5 max-w-[520px] leading-[1.55] text-grau-text lg:text-lg">
              Auto, Taxi, Motorrad, Lastwagen und Anhänger BE. Fahrstunden nach
              Vereinbarung, auch abends. Die erste Probelektion ist gratis.
            </p>

            <div className="mt-7 flex flex-col items-start gap-3.5">
              <a
                href={probelektionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center gap-2.5 bg-brand-gelb px-6 font-semibold text-brand-schwarz transition-colors hover:bg-brand-gelb-dunkel lg:text-[17px]"
              >
                <MessageCircle aria-hidden="true" className="size-5" />
                Gratis Probelektion (WhatsApp)
              </a>
              <RufUnsAn className="lg:text-base" />
            </div>
          </div>

          {/* Auf dem Handy steht das Bild oben, wie in der Vorlage: es traegt
              die Seite an, bevor der Text anfaengt. Ab lg sitzt es rechts
              neben der Ueberschrift. */}
          <div className="relative order-first border-flaeche-3 lg:order-none lg:border-l">
            <Bildplatzhalter
              beschreibung="Echtes Foto: Auto"
              seitenverhaeltnis="16/9"
              className="lg:h-full"
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="preise-titel"
        className="mx-auto w-full max-w-[1344px] px-4 py-12 sm:px-6 lg:px-12 lg:py-16"
      >
        <h2
          id="preise-titel"
          className="font-heading text-[26px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[32px] lg:text-[38px]"
        >
          Preise pro Kategorie
        </h2>
        <p className="mb-8 mt-2 max-w-[560px] leading-[1.6] text-grau-text lg:mb-8 lg:text-[15px]">
          {adminGebuehr
            ? `Einmalig kommen ${chf(Number(adminGebuehr))} als Anteil für Versicherung und Administration dazu. Diesen Betrag zahlst Du nur beim ersten Mal.`
            : "Alle Beträge pro Lektion. Je grösser das Abo, desto günstiger die Lektion."}
        </p>

        {gross.length > 0 ? (
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {gross.map((eintrag, index) => (
              <Preiskarte
                key={eintrag.kategorie.slug}
                eintrag={eintrag}
                whatsappUrl={linkFuer(eintrag.kategorie.whatsappText)}
                // Die Vorlage hebt die erste Karte hervor: schwarzer Rahmen
                // und Schrägstreifen. Das ist das Angebot, das die meisten
                // suchen.
                hervorgehoben={index === 0}
              />
            ))}
          </div>
        ) : null}

        {klein.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {klein.map((eintrag) => (
              <Preiskarte
                key={eintrag.kategorie.slug}
                eintrag={eintrag}
                whatsappUrl={linkFuer(eintrag.kategorie.whatsappText)}
                klein
              />
            ))}
          </div>
        ) : null}
      </section>

      <section
        aria-labelledby="gutzuwissen-titel"
        className="mx-auto w-full max-w-[1344px] px-4 pb-14 sm:px-6 lg:px-12 lg:pb-16"
      >
        <div className="grid grid-cols-1 gap-8 border-t border-brand-schwarz pt-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2
              id="gutzuwissen-titel"
              className="mb-3 font-heading text-[22px] font-semibold"
            >
              Gut zu wissen
            </h2>
            <p className="leading-[1.6] text-grau-text lg:text-[15px]">
              Fahrstunden nach Vereinbarung, auch am Abend. Wir unterrichten auf
              Deutsch, Italienisch, Spanisch, Englisch und Französisch.
              Familienrabatt für Geschwister und Eltern — frag uns kurz per
              WhatsApp.
            </p>
          </div>

          <dl className="grid grid-cols-[100px_minmax(0,1fr)] gap-x-5 gap-y-2.5 leading-[1.5] lg:grid-cols-[120px_minmax(0,1fr)] lg:text-[15px]">
            <dt className="text-grau-text-hell">Treffpunkt</dt>
            <dd>
              {ADRESSE.strasse}, {ADRESSE.plz} {ADRESSE.ort}, oder nach
              Absprache
            </dd>

            <dt className="text-grau-text-hell">Telefon</dt>
            <dd className="flex flex-wrap items-center gap-x-2">
              {TELEFONNUMMERN.map((nummer, index) => (
                <span key={nummer.tel} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-linie-stark">
                      ·
                    </span>
                  ) : null}
                  <a
                    href={`tel:${nummer.tel}`}
                    className="font-semibold tabular-nums underline-offset-4 hover:underline"
                  >
                    {nummer.anzeige}
                  </a>
                </span>
              ))}
            </dd>

            <dt className="text-grau-text-hell">E-Mail</dt>
            <dd>
              <a
                href={`mailto:${ADRESSE.email}`}
                className="underline-offset-4 hover:underline"
              >
                {ADRESSE.email}
              </a>
            </dd>
          </dl>
        </div>
      </section>
    </div>
  );
}

/**
 * Eine Kategorie mit ihren Preiszeilen.
 *
 * Fehlt ein Preis, steht in der Zeile ein Gedankenstrich und darunter "Preis
 * folgt". Die Zeilen bleiben trotzdem stehen: sie zeigen, dass es auch hier
 * eine Abostaffel gibt, und eine leere Karte saehe aus wie ein Fehler.
 */
function Preiskarte({
  eintrag,
  whatsappUrl,
  hervorgehoben = false,
  klein = false,
}: {
  eintrag: FahrstundenPreise;
  whatsappUrl: string;
  hervorgehoben?: boolean;
  klein?: boolean;
}) {
  const { kategorie } = eintrag;
  const zeilen = preiszeilen(eintrag);
  const adminGebuehr = !eintrag.aufAnfrage && eintrag.preisform === "abo"
    ? eintrag.adminGebuehr
    : null;

  return (
    <article
      className={cn(
        "flex flex-col",
        hervorgehoben
          ? "border border-brand-schwarz"
          : "border border-flaeche-3",
      )}
    >
      {hervorgehoben ? <Diagonalstreifen /> : null}

      <div
        className={cn(
          "flex flex-1 flex-col",
          klein ? "p-6" : "px-6 pb-6 pt-7 lg:px-7",
          hervorgehoben ? "lg:pt-7" : null,
        )}
      >
        <h3
          className={cn(
            "font-heading font-semibold tracking-[-0.01em]",
            klein ? "text-[22px] lg:text-2xl" : "text-2xl lg:text-[30px]",
          )}
        >
          {kategorie.name}
        </h3>
        <p
          className={cn(
            "text-grau-text-hell",
            klein ? "mb-4 text-[13px] lg:text-sm" : "mb-5 text-sm",
          )}
        >
          {kategorie.untertitel}
        </p>

        <dl>
          {zeilen.map((zeile, index) => (
            <div
              key={zeile.text}
              className={cn(
                "flex items-baseline justify-between gap-4 border-t py-2.5 lg:py-3",
                index === 0 ? "border-brand-schwarz" : "border-flaeche-3",
                index === zeilen.length - 1
                  ? "border-b border-b-flaeche-3"
                  : null,
              )}
            >
              <dt className={klein ? "text-sm lg:text-[15px]" : "font-semibold lg:text-base"}>
                {zeile.text}
              </dt>
              <dd
                className={cn(
                  "font-heading font-semibold tabular-nums",
                  klein ? "text-[19px] lg:text-xl" : "text-xl lg:text-2xl",
                  zeile.preis === null ? "text-grau-text-hell" : null,
                )}
              >
                {zeile.preis === null ? "—" : chf(zeile.preis)}
              </dd>
            </div>
          ))}
        </dl>

        {eintrag.aufAnfrage ? (
          <p className="mt-3 text-[13px] leading-[1.5] text-grau-text-hell">
            Preis folgt. Ruf uns an, wir sagen Dir, was die Lektion kostet.
          </p>
        ) : adminGebuehr !== null ? (
          <p className="mt-4 flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[7px] block size-2 shrink-0 bg-brand-gelb"
            />
            <span className="text-sm leading-[1.5] text-grau-text">
              Einmalig {chf(adminGebuehr)} Anteil Versicherung und
              Administration.
            </span>
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center gap-2 bg-brand-gelb px-4 font-semibold text-brand-schwarz transition-colors hover:bg-brand-gelb-dunkel",
              klein ? "min-h-12 text-[15px]" : "min-h-[52px] lg:text-base",
            )}
          >
            <MessageCircle aria-hidden="true" className="size-[18px]" />
            Gratis Probelektion
            <span className="sr-only"> {kategorie.name} über WhatsApp</span>
          </a>
          <RufUnsAn className="text-center" />
        </div>
      </div>
    </article>
  );
}

/** "Oder ruf uns an: 079 604 44 44" — in der Vorlage unter jedem gelben Knopf. */
function RufUnsAn({ className }: { className?: string }) {
  return (
    <p className={cn("text-sm text-grau-text", className)}>
      Oder ruf uns an:{" "}
      <a
        href={`tel:${TELEFONNUMMERN[0].tel}`}
        className="font-semibold tabular-nums text-foreground underline-offset-4 hover:underline"
      >
        {TELEFONNUMMERN[0].anzeige}
      </a>
    </p>
  );
}

/**
 * Die Zeilen einer Karte, unabhaengig davon ob Preise hinterlegt sind.
 *
 * Der Lastwagen hat keine Abostaffel, sondern praktische und theoretische
 * Lektionen (PLAN.md Abschnitt 5). Die Vorlage zeichnet ihn mit der Staffel;
 * bei einem Widerspruch ueber eine Regel gilt PLAN.md.
 */
function preiszeilen(
  eintrag: FahrstundenPreise,
): { text: string; preis: number | null }[] {
  if (eintrag.aufAnfrage) {
    return eintrag.kategorie.preisform === "lkw"
      ? [
          { text: "Praktische Lektion", preis: null },
          { text: "Theorielektion", preis: null },
        ]
      : [
          { text: "1 Lektion", preis: null },
          { text: "5er-Abo, pro Lektion", preis: null },
          { text: "10er-Abo, pro Lektion", preis: null },
        ];
  }

  if (eintrag.preisform === "lkw") {
    return [
      { text: "Praktische Lektion", preis: eintrag.praktisch },
      { text: "Theorielektion", preis: eintrag.theorie },
    ];
  }

  return [
    { text: "1 Lektion", preis: eintrag.einzel },
    { text: "5er-Abo, pro Lektion", preis: eintrag.abo5 },
    { text: "10er-Abo, pro Lektion", preis: eintrag.abo10 },
  ];
}
