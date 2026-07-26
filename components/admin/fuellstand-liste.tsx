import Link from "next/link";
import { datum } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Fuellstand } from "@/lib/admin/dashboard";
import type { AmpelZustand } from "@/lib/verfuegbarkeit";

/**
 * Fuellstand je Kurs als Balken.
 *
 * Dieselben Ampelschwellen wie auf der oeffentlichen Seite, damit Ausilia und
 * die Kundin dasselbe sehen. Die Zahl steht neben dem Balken: ein Balken
 * allein sagt "ziemlich voll", die Zahl sagt, ob noch zwei Plaetze frei sind.
 */

const BALKEN: Record<AmpelZustand, string> = {
  gruen: "bg-ampel-gruen-punkt",
  gelb: "bg-brand-gelb",
  rot: "bg-ampel-rot-punkt",
};

export function FuellstandListe({ kurse }: { kurse: Fuellstand[] }) {
  if (kurse.length === 0) {
    return (
      <p className="border border-border bg-card p-5 text-muted-foreground">
        Zurzeit ist kein Kurs ausgeschrieben.
      </p>
    );
  }

  return (
    <ul className="border border-border bg-card">
      {kurse.map((kurs) => {
        const anteil =
          kurs.limit > 0 ? Math.min(100, (kurs.belegt / kurs.limit) * 100) : 0;

        return (
          <li key={kurs.kursId} className="border-b border-flaeche-3 last:border-b-0">
            <Link
              href={`/admin/kurse/${kurs.kursId}/buchungen`}
              className="block px-5 py-4 transition-colors hover:bg-flaeche-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-medium">
                  {kurs.kursart}
                  {kurs.entwurf ? (
                    <span className="ml-2 bg-flaeche-3 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      Entwurf
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-muted-foreground">
                  ab {datum(kurs.ersterTermin)}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div
                  className="h-2 flex-1 bg-flaeche-3"
                  role="img"
                  aria-label={`${kurs.belegt} von ${kurs.limit} Plätzen belegt`}
                >
                  <div
                    className={cn("h-full", BALKEN[kurs.verfuegbarkeit.zustand])}
                    style={{ width: `${anteil}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-sm tabular-nums">
                  {kurs.belegt}/{kurs.limit}
                </span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {kurs.verfuegbarkeit.frei === 0
                  ? "Ausgebucht"
                  : `Noch ${kurs.verfuegbarkeit.frei} ${kurs.verfuegbarkeit.frei === 1 ? "Platz" : "Plätze"} frei`}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
