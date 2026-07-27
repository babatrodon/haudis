import type { Metadata } from "next";
import Link from "next/link";
import { Bezeichnung } from "@/components/oeffentlich/abschnitt";
import { Kurszeile } from "@/components/oeffentlich/kurszeile";
import { einstellungenLesen } from "@/lib/einstellungen";
import { KURSGRUPPEN } from "@/lib/inhalte/kursgruppen";
import { ADRESSE } from "@/lib/kontakt";
import { cn } from "@/lib/utils";
import { aktiveKursarten, kommendeKurse } from "@/lib/kurse";

export const metadata: Metadata = {
  title: "Kursdaten | Haudi's Fahrschule Baden",
  description:
    "Alle ausgeschriebenen Kursdaten mit Terminen, Preis und freien Plätzen. VKU, Nothelferkurs, Basis-Theorieunterricht und Motorrad-Grundkurse in Baden.",
};

/**
 * Kursdaten, nach design/haudis-design.dc.html Screen 03.
 *
 * Eine Zeile pro Kurs statt der Karten der Startseite: hier sucht jemand ein
 * Datum, das ihm passt, und vergleicht dafuer Termine untereinander.
 *
 * Der Filter laeuft ueber einen Suchparameter und normale Links, nicht ueber
 * JavaScript. Damit funktioniert er ohne Client-Bundle, jede Auswahl hat eine
 * eigene Adresse zum Teilen, und die Suchmaschine sieht alle Varianten.
 */
export default async function KursdatenSeite({
  searchParams,
}: {
  searchParams: Promise<{ art?: string }>;
}) {
  const { art } = await searchParams;
  const kursarten = await aktiveKursarten();

  /**
   * Eine Gruppe erscheint, sobald mindestens eine ihrer Kursarten aktiv ist.
   * Kursarten ohne bestaetigten Preis stehen auf inaktiv, deshalb fehlt heute
   * zum Beispiel ein Teil des Motorrad-Programms — und sobald Ausilia den Preis
   * eintraegt, steht die Gruppe ohne Codeaenderung da.
   */
  const gruppen = KURSGRUPPEN.filter((gruppe) =>
    kursarten.some(
      (kursart) => kursart.buchbar && gruppe.codes.includes(kursart.code),
    ),
  );
  const gewaehlt = gruppen.find((gruppe) => gruppe.slug === art);

  const [kurse, werte] = await Promise.all([
    kommendeKurse(gewaehlt ? { kursartCodes: gewaehlt.codes } : {}),
    einstellungenLesen(),
  ]);

  const boegleGratis = werte["aktion.btuBoegleGratis"] === "true";
  const boegle = kursarten.find((kursart) => kursart.code === "BOEGLE");

  /**
   * Bögle ist ein Walk-in ohne Termine und ohne Anmeldung, deshalb keine
   * Kurszeile, sondern eine eigene am Fuss der Liste. Sie steht nur unter
   * "Alle" und unter der Gruppe, zu der Bögle inhaltlich gehoert — beim Filter
   * "Motorrad" waere sie eine Antwort auf eine Frage, die niemand gestellt hat.
   */
  const zeigeBoegle = Boolean(boegle) && (!gewaehlt || gewaehlt.slug === "btu");

  return (
    /* Weisse Flaeche wie im Rahmen der Vorlage. Nur so hebt sich die
       Bögle-Zeile darunter ab, die auf der hellen Flaeche liegt. */
    <div className="bg-card">
    <div className="mx-auto w-full max-w-[1344px] px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
      <div className="mb-9 grid grid-cols-1 items-end gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        <div>
          <Bezeichnung>Kursdaten {new Date().getFullYear()}</Bezeichnung>
          <h1
            lang="de"
            className="font-heading text-[32px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[44px] lg:text-[56px] lg:leading-none"
          >
            Alle Kurse auf einen Blick
          </h1>
        </div>
        <p className="leading-[1.6] text-grau-text lg:text-[15px]">
          Jeder Kurs zeigt alle Termine mit Zeiten. Die Ampel sagt Dir, wie
          viele Plätze noch frei sind. Bei ausgebuchten Kursen kannst Du Dich
          auf die Warteliste setzen.
        </p>
      </div>

      {/* Filterleiste. Ab Desktop ein zusammenhaengendes Schaltfeld wie in der
          Vorlage, darunter einzelne Knoepfe, damit sie umbrechen koennen. */}
      <div className="flex flex-col gap-4 border-t border-brand-schwarz py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <nav aria-label="Nach Kursart filtern">
          <ul className="flex flex-wrap gap-2 lg:w-max lg:gap-0 lg:divide-x lg:divide-brand-schwarz lg:border lg:border-brand-schwarz">
            <li>
              <FilterKnopf href="/kursdaten" aktiv={!gewaehlt}>
                Alle
              </FilterKnopf>
            </li>
            {gruppen.map((gruppe) => (
              <li key={gruppe.slug}>
                <FilterKnopf
                  href={`/kursdaten?art=${gruppe.slug}`}
                  aktiv={gewaehlt?.slug === gruppe.slug}
                >
                  {gruppe.name}
                </FilterKnopf>
              </li>
            ))}
          </ul>
        </nav>

        <p
          aria-live="polite"
          className="text-sm tabular-nums text-grau-text-hell"
        >
          {kurse.length} {kurse.length === 1 ? "Kurs" : "Kurse"}
          {gewaehlt ? ` unter ${gewaehlt.name}` : ""}
        </p>
      </div>

      <section
        aria-labelledby="ergebnis-titel"
        // Auf dem Handy stehen die Kurse als Karten mit Abstand, ab lg als
        // Zeilen ohne Abstand direkt untereinander.
        className="flex flex-col gap-4 lg:block lg:border-t lg:border-flaeche-3"
      >
        {/* Ueberschrift nur fuer Screenreader: sichtbar traegt die Zaehlzeile
            darueber dieselbe Information. Ohne sie spraenge die Gliederung von
            h1 direkt auf die h3 der Kurszeilen. */}
        <h2 id="ergebnis-titel" className="sr-only">
          Ausgeschriebene Kurse
        </h2>

        {kurse.length > 0 ? (
          kurse.map((kurs) => (
            <Kurszeile
              key={kurs.id}
              kurs={kurs}
              boegleGratis={boegleGratis}
            />
          ))
        ) : (
          <div className="border-b border-flaeche-3 py-10">
            <h3 className="font-heading text-xl font-semibold">
              Keine Daten ausgeschrieben
            </h3>
            <p className="mt-3 max-w-prose leading-[1.6] text-grau-text">
              {gewaehlt
                ? `Für ${gewaehlt.name} ist zurzeit kein Termin ausgeschrieben.`
                : "Zurzeit ist kein Kurs ausgeschrieben."}{" "}
              Ruf uns an, wir sagen Dir, wann der nächste startet, und merken
              Dich vor.
            </p>
            {gewaehlt ? (
              <p className="mt-4">
                <Link
                  href="/kursdaten"
                  className="inline-flex min-h-11 items-center border-b-[3px] border-brand-gelb pb-0.5 font-semibold"
                >
                  Alle Kursdaten ansehen
                </Link>
              </p>
            ) : null}
          </div>
        )}

        {zeigeBoegle && boegle ? <BoegleZeile name={boegle.name} /> : null}
      </section>
    </div>
    </div>
  );
}

/**
 * Bögle als Abschluss der Liste, auf abgesetzter Flaeche.
 *
 * Kein Anmelden-Knopf und keine Ampel: der Kurs ist gratis, laeuft jede Woche
 * und kennt keine Kapazitaet. Ein Knopf wuerde eine Anmeldung versprechen, die
 * es nicht gibt.
 */
function BoegleZeile({ name }: { name: string }) {
  return (
    <article className="grid grid-cols-1 gap-5 border border-flaeche-3 bg-flaeche-1 p-4 lg:mt-2 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10 lg:border-x-0 lg:border-t-0 lg:px-6 lg:py-8">
      <div>
        <p className="text-[13px] text-grau-text-hell">
          {name} · Theorie-Lernstunde
        </p>
        <h3 className="mb-3.5 mt-1.5 font-heading text-[20px] font-semibold leading-[1.15] lg:text-[26px]">
          Jeden Montag, gratis
        </h3>
        <span className="inline-flex items-center border border-ampel-gruen-linie bg-ampel-gruen-bg px-3 py-2 text-[13px] font-semibold text-ampel-gruen">
          Gratis, keine Anmeldung nötig
        </span>
      </div>

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center lg:gap-10">
        <p className="max-w-[520px] leading-[1.6] text-grau-text lg:text-[15px]">
          Komm einfach vorbei und lerne mit uns für die Theorieprüfung. Jeden
          Montag von{" "}
          <span className="font-semibold tabular-nums text-foreground">
            19.00 bis 21.00
          </span>{" "}
          an der {ADRESSE.strasse}.{" "}
          <Link
            href="/boegle"
            className="font-semibold text-foreground underline decoration-brand-gelb decoration-[3px] underline-offset-4"
          >
            Mehr zum Bögle
          </Link>
        </p>
        <p className="font-heading text-[26px] font-semibold lg:text-[32px]">
          Gratis
        </p>
      </div>
    </article>
  );
}

function FilterKnopf({
  href,
  aktiv,
  children,
}: {
  href: string;
  aktiv: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={aktiv ? "page" : undefined}
      className={cn(
        // Unterhalb von lg traegt jeder Knopf seinen eigenen Rahmen. Ab lg
        // uebernimmt die Leiste den Rahmen und divide-x die Trennlinien
        // dazwischen, sonst staende am linken Rand eine doppelte Linie.
        "inline-flex min-h-11 items-center border border-brand-schwarz px-4 text-sm font-semibold transition-colors lg:border-0 lg:px-5 lg:text-[15px]",
        aktiv
          ? "bg-brand-schwarz text-flaeche-1"
          : "bg-card hover:bg-flaeche-2",
      )}
    >
      {children}
    </Link>
  );
}
