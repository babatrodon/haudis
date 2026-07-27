import Link from "next/link";
import { AmpelChip } from "@/components/ampel-chip";
import { chf, datum } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { KursOeffentlich } from "@/lib/kurse";

/**
 * Karte fuer einen konkreten Kurs, nach design/haudis-design.dc.html Screen 02.
 *
 * Aufbau von oben nach unten: Kursart und Anzahl Termine, Titel, Ampelchip,
 * die Termine als Liste, unten der Preis und der Knopf. Der Knopf sitzt am
 * Fuss der Karte (mt-auto), damit er in einer Reihe nebeneinander stehender
 * Karten auf gleicher Hoehe liegt, auch wenn ein Kurs mehr Termine hat.
 *
 * Geschaeftsregel 2: bei null freien Plaetzen verschwindet der Anmelden-Knopf.
 * An seiner Stelle steht, was stattdessen geht.
 */
export function Kurskarte({ kurs }: { kurs: KursOeffentlich }) {
  const rabattiert = kurs.naechsterPreis.lt(kurs.gesamtpreis);
  const ausgebucht = !kurs.verfuegbarkeit.buchbar;

  return (
    <article
      className={cn(
        "flex flex-col border border-flaeche-3",
        // Ausgebuchte Kurse treten zurueck: gedaempfte Flaeche statt weiss.
        // Bewusst keine Transparenz auf der ganzen Karte, das wuerde auch den
        // roten Chip aufhellen, der die eigentliche Information traegt.
        ausgebucht ? "bg-flaeche-2" : "bg-card",
      )}
    >
      <div className="p-6 pb-0">
        <p className="text-[13px] text-grau-text-hell">
          {kurs.kursart.code} · {kurs.termine.length}{" "}
          {kurs.termine.length === 1 ? "Termin" : "Termine"}
        </p>
        <h3
          lang="de"
          className="mt-1.5 font-heading text-[22px] font-semibold leading-tight tracking-[-0.01em]"
        >
          {kurs.kursart.name}
        </h3>
      </div>

      <div className="px-6 pt-4">
        <AmpelChip
          zustand={kurs.verfuegbarkeit.zustand}
          text={kurs.verfuegbarkeit.text}
          className="px-2.5 py-1.5 text-[13px]"
        />
      </div>

      <ul className="px-6 pt-5">
        {kurs.termine.map((termin, index) => (
          <li
            key={`${termin.datum.toISOString()}-${termin.von}-${index}`}
            className="flex justify-between gap-4 border-t border-flaeche-2 py-2 text-sm tabular-nums text-grau-text"
          >
            <span className="text-foreground">{datum(termin.datum)}</span>
            <span>
              {termin.von}–{termin.bis}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto p-6 pt-5">
        {rabattiert ? (
          <p className="mb-3.5">
            <span className="inline-flex items-center bg-brand-gelb px-2.5 py-1.5 text-xs font-semibold text-brand-schwarz">
              Frühbucherrabatt, noch {kurs.fruehbucherPlaetzeFrei}{" "}
              {kurs.fruehbucherPlaetzeFrei === 1 ? "Platz" : "Plätze"}
            </span>
          </p>
        ) : null}

        <div className="mb-4 flex items-baseline justify-between gap-3 border-t border-brand-schwarz pt-4">
          <span className="font-heading text-[26px] font-semibold tabular-nums">
            {chf(kurs.naechsterPreis)}
          </span>
          <span className="max-w-[130px] text-right text-xs text-grau-text-hell">
            {kurs.materialpreis.gt(0)
              ? `Kursgebühr ${chf(kurs.preis)}, Lehrmittel ${chf(kurs.materialpreis)}`
              : "inkl. Kursmaterial"}
          </span>
        </div>

        {ausgebucht ? (
          <p className="flex min-h-12 items-center justify-center border border-linie-stark bg-card px-4 text-center text-sm font-semibold text-grau-text">
            Ausgebucht, ruf uns an
          </p>
        ) : (
          <Link
            href={`/anmeldung/${kurs.id}`}
            className="flex min-h-12 items-center justify-center bg-brand-schwarz px-4 font-semibold text-flaeche-1 transition-colors hover:bg-brand-schwarz-weich"
          >
            Anmelden
          </Link>
        )}
      </div>
    </article>
  );
}
