import Link from "next/link";
import { AmpelChip } from "@/components/ampel-chip";
import { Button } from "@/components/ui/button";
import { chf, datumLang } from "@/lib/format";
import type { KursOeffentlich } from "@/lib/kurse";

/**
 * Karte fuer einen konkreten Kurs mit Terminen, Preis und Ampel.
 * Wird auf der Startseite und spaeter auf /kursdaten verwendet.
 *
 * Geschaeftsregel 2: bei null freien Plaetzen verschwindet der
 * Anmelden-Button. An seiner Stelle steht, warum.
 */
export function Kurskarte({ kurs }: { kurs: KursOeffentlich }) {
  const rabattiert = kurs.naechsterPreis.lt(kurs.gesamtpreis);

  return (
    <article className="flex flex-col border border-border bg-card">
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <h3 className="font-heading text-lg font-bold">{kurs.kursart.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {kurs.termine.length}{" "}
            {kurs.termine.length === 1 ? "Termin" : "Termine"}
          </p>
        </div>
        <AmpelChip
          zustand={kurs.verfuegbarkeit.zustand}
          text={kurs.verfuegbarkeit.text}
          className="shrink-0"
        />
      </div>

      <div className="flex-1 p-5">
        <ul className="space-y-2 text-sm">
          {kurs.termine.map((termin, index) => (
            <li
              key={`${termin.datum.toISOString()}-${termin.von}-${index}`}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2 last:border-b-0 last:pb-0"
            >
              <span className="font-medium">{datumLang(termin.datum)}</span>
              <span className="tabular-nums text-muted-foreground">
                {termin.von} bis {termin.bis} Uhr
              </span>
            </li>
          ))}
        </ul>

        {kurs.kursart.lernfahrausweisNoetig ? (
          <p className="mt-4 border-l-4 border-brand-gelb pl-3 text-sm text-muted-foreground">
            Lernfahrausweis am ersten Kurstag mitbringen.
          </p>
        ) : null}
      </div>

      <div className="border-t border-border p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            {rabattiert ? (
              <>
                <span className="font-heading text-2xl font-bold">
                  {chf(kurs.naechsterPreis)}
                </span>
                <span className="ml-2 text-sm text-muted-foreground line-through">
                  {chf(kurs.gesamtpreis)}
                </span>
              </>
            ) : (
              <span className="font-heading text-2xl font-bold">
                {chf(kurs.gesamtpreis)}
              </span>
            )}
            <p className="text-sm text-muted-foreground">
              inklusive Lehrmittel, bar am ersten Kurstag
            </p>
          </div>
        </div>

        {rabattiert ? (
          <p className="mt-3 inline-block bg-brand-gelb px-2 py-1 text-sm font-semibold text-brand-schwarz">
            Frühbucher: noch {kurs.fruehbucherPlaetzeFrei}{" "}
            {kurs.fruehbucherPlaetzeFrei === 1 ? "Platz" : "Plätze"}
          </p>
        ) : kurs.fruehbucherProzent !== null ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Frühbucherrabatte ausgeschöpft
          </p>
        ) : null}

        <div className="mt-4">
          {kurs.verfuegbarkeit.buchbar ? (
            <Button asChild className="w-full">
              {/* Der Buchungsflow entsteht in Sprint 3. */}
              <Link href={`/anmeldung/${kurs.id}`}>Jetzt anmelden</Link>
            </Button>
          ) : (
            <p className="border border-border bg-flaeche-2 p-3 text-center text-sm text-muted-foreground">
              Dieser Kurs ist ausgebucht. Ruf uns an, wir sagen Dir, wann der
              nächste startet.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
