import Link from "next/link";
import { AmpelChip } from "@/components/ampel-chip";
import { Button } from "@/components/ui/button";
import { chf, datumLang } from "@/lib/format";
import { cn } from "@/lib/utils";
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
  const ausgebucht = !kurs.verfuegbarkeit.buchbar;

  return (
    <article
      className={cn(
        "flex flex-col border border-border",
        // Ausgebuchte Kurse treten zurueck: gedaempfte Flaeche statt weiss.
        // Bewusst keine Transparenz auf der ganzen Karte, das wuerde auch den
        // roten Chip aufhellen, der die eigentliche Information traegt.
        ausgebucht ? "bg-flaeche-2" : "bg-card",
      )}
    >
      {/*
        Chip auf eigener Zeile ueber dem Titel. Nebeneinander gestellt haben
        sich beide um dieselbe Breite gestritten: "Verkehrskundeunterricht" ist
        ein einziges langes Wort und laesst sich nicht umbrechen, also wurde der
        Chip aus der Karte gedraengt und abgeschnitten.
      */}
      <div className="border-b border-flaeche-3 p-5">
        <AmpelChip
          zustand={kurs.verfuegbarkeit.zustand}
          text={kurs.verfuegbarkeit.text}
        />
        <h3 className="mt-3 font-heading text-lg font-bold hyphens-auto" lang="de">
          {kurs.kursart.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {kurs.termine.length}{" "}
          {kurs.termine.length === 1 ? "Termin" : "Termine"}
        </p>
      </div>

      <div className="flex-1 p-5">
        <ul className="space-y-2 text-sm">
          {kurs.termine.map((termin, index) => (
            <li
              key={`${termin.datum.toISOString()}-${termin.von}-${index}`}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-flaeche-3 pb-2 last:border-b-0 last:pb-0"
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

      <div className="border-t border-flaeche-3 p-5">
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
              <span
                className={cn(
                  "font-heading text-2xl font-bold",
                  // Beim ausgebuchten Kurs ist der Preis nicht mehr die
                  // Information, auf die es ankommt.
                  ausgebucht && "text-muted-foreground",
                )}
              >
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
            // bg-card statt bg-flaeche-2: die Karte selbst ist beim
            // ausgebuchten Kurs schon gedaempft, ein Hinweis in derselben
            // Farbe waere darauf nicht mehr zu sehen.
            <p className="border border-flaeche-3 bg-card p-3 text-center text-sm text-muted-foreground">
              Dieser Kurs ist ausgebucht. Ruf uns an, wir sagen Dir, wann der
              nächste startet.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
