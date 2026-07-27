import Link from "next/link";
import { AmpelChip } from "@/components/ampel-chip";
import { chf, datum } from "@/lib/format";
import { kursartZeile } from "@/lib/inhalte/kursgruppen";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";
import { cn } from "@/lib/utils";
import type { KursOeffentlich } from "@/lib/kurse";

/**
 * Ein Kurs als Zeile, nach design/haudis-design.dc.html Screen 03.
 *
 * Drei Spalten ab Desktop: links die Kursart mit Ampel, in der Mitte alle
 * Termine, rechts Preis und Knopf. Darunter stapeln sich dieselben drei Bloecke
 * zu einer Karte — dasselbe Markup, kein zweiter Satz Ueberschriften. Die
 * Vorlage zeichnet fuer Mobile eine eigene Karte; die Unterschiede sind
 * Abstaende und Schriftgroessen, und die traegt hier der Umbruch.
 *
 * Anders als auf der Startseite steht hier jeder Termin einzeln. Wer auf
 * /kursdaten landet, sucht ein Datum, das ihm passt, und nicht den naechsten
 * freien Kurs.
 *
 * Geschaeftsregel 2: bei null freien Plaetzen verschwindet der Anmelden-Knopf.
 */
export function Kurszeile({
  kurs,
  boegleGratis,
}: {
  kurs: KursOeffentlich;
  /** Aktion "8 Stunden Bögle gratis", nur beim BTU und nur wenn eingeschaltet. */
  boegleGratis: boolean;
}) {
  const rabattiert = kurs.naechsterPreis.lt(kurs.gesamtpreis);
  const ausgebucht = !kurs.verfuegbarkeit.buchbar;
  const rabattBetrag = kurs.gesamtpreis.minus(kurs.naechsterPreis);
  const zeigeBoegle = boegleGratis && kurs.kursart.code === "BTU";

  return (
    /* Unterhalb von lg eine Karte mit Rahmen, wie in der Vorlage; ab lg eine
       Zeile, die nur unten eine Trennlinie traegt. */
    <article className="grid grid-cols-1 gap-5 border border-flaeche-3 p-4 lg:grid-cols-[320px_minmax(0,1fr)_290px] lg:items-start lg:gap-10 lg:border-0 lg:border-b lg:p-0 lg:py-8">
      <div>
        <p className="text-[13px] text-grau-text-hell">
          {kursartZeile(kurs.kursart.code)}
        </p>
        <h3
          lang="de"
          className="mb-3.5 mt-1.5 font-heading text-[20px] font-semibold leading-[1.15] tracking-[-0.01em] lg:text-[26px]"
        >
          {kurs.kursart.name}
        </h3>

        <AmpelChip
          zustand={kurs.verfuegbarkeit.zustand}
          text={kurs.verfuegbarkeit.text}
          className="px-3 py-2 text-[13px]"
        />

        {rabattiert ? (
          <p className="mt-3">
            <span className="inline-flex items-center bg-brand-gelb px-2.5 py-1.5 text-xs font-semibold text-brand-schwarz">
              Frühbucherrabatt {chf(rabattBetrag)}
            </span>
          </p>
        ) : null}

        {zeigeBoegle ? (
          <p className="mt-3">
            <span className="inline-flex items-center bg-brand-gelb px-2.5 py-1.5 text-xs font-semibold text-brand-schwarz">
              8 Stunden Bögle gratis dazu
            </span>
          </p>
        ) : null}

        {/* Ort nur ab Desktop, wie in der Vorlage. Auf dem Handy waere es in
            jeder Karte dieselbe Zeile; die Adresse steht im Fuss und auf der
            Anmeldeseite. */}
        <p className="mt-3.5 hidden text-[13px] text-grau-text-hell lg:block">
          {ADRESSE.strasse}, {ADRESSE.ort}
        </p>
      </div>

      <div>
        <p className="mb-2 text-[13px] text-grau-text-hell">
          {kurs.termine.length}{" "}
          {kurs.termine.length === 1 ? "Termin" : "Termine"}
        </p>
        <ul>
          {kurs.termine.map((termin, index) => (
            <li
              key={`${termin.datum.toISOString()}-${termin.von}-${index}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-5 border-t border-flaeche-2 py-2.5 text-sm tabular-nums lg:text-[15px]"
            >
              <span className="font-medium">{datum(termin.datum)}</span>
              <span className="text-grau-text">
                {termin.von}–{termin.bis}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-brand-schwarz pt-4 lg:border-l lg:border-t-0 lg:border-flaeche-3 lg:pl-8 lg:pt-0">
        <div className="flex items-baseline justify-between gap-3 lg:block">
          <p className="font-heading text-[22px] font-semibold leading-none tabular-nums lg:text-[32px]">
            {chf(kurs.naechsterPreis)}
          </p>
          <p className="max-w-[140px] text-right text-[11px] text-grau-text-hell lg:mt-1.5 lg:max-w-none lg:text-left lg:text-[13px]">
            {kurs.materialpreis.gt(0)
              ? `Kursgebühr ${chf(kurs.preis)} + Lehrmittel ${chf(kurs.materialpreis)}`
              : "inkl. Lehrmittel"}
          </p>
        </div>

        <div className="mt-3.5 lg:mt-5">
          {ausgebucht ? (
            // Vorlage Zeile 151: bei Rot ersetzt die Warteliste den
            // Anmelde-Knopf. Seit Sprint 7 fuehrt er auch irgendwohin.
            <Link
              href={`/anmeldung/${kurs.id}`}
              className="flex min-h-12 items-center justify-center bg-brand-schwarz px-4 text-center font-semibold text-flaeche-1 transition-colors hover:bg-brand-schwarz-weich lg:min-h-[52px]"
            >
              Auf Warteliste eintragen
              <span className="sr-only"> für den {kurs.kursart.name}</span>
            </Link>
          ) : (
            <Link
              href={`/anmeldung/${kurs.id}`}
              className="flex min-h-12 items-center justify-center bg-brand-schwarz px-4 font-semibold text-flaeche-1 transition-colors hover:bg-brand-schwarz-weich lg:min-h-[52px]"
            >
              Anmelden
              <span className="sr-only"> zum {kurs.kursart.name}</span>
            </Link>
          )}
        </div>

        {/* Ab Desktop steht die Nummer unter jedem Knopf, wie in der Vorlage.
            Auf dem Handy waere das in jeder Zeile dieselbe Wiederholung — ausser
            bei einem ausgebuchten Kurs: dort sagt der Knopf "ruf uns an", und
            dann muss die Nummer daneben stehen und nicht im Fuss. */}
        <p
          className={cn(
            "mt-3 text-center text-[13px] text-grau-text-hell",
            ausgebucht ? "block" : "hidden lg:block",
          )}
        >
          Telefonisch:{" "}
          <a
            href={`tel:${TELEFONNUMMERN[0].tel}`}
            className="font-semibold tabular-nums text-foreground underline-offset-4 hover:underline"
          >
            {TELEFONNUMMERN[0].anzeige}
          </a>
        </p>
      </div>
    </article>
  );
}
