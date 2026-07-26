import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { datumLang } from "@/lib/format";
import type { TerminMitKurs } from "@/lib/admin/dashboard";

/**
 * Die naechsten Termine, nach Tag gruppiert.
 *
 * Diese Liste wird im Stehen zwischen zwei Lektionen gelesen. Deshalb steht
 * pro Zeile nur, was in dem Moment zaehlt: wann, welcher Kurs, wer unterrichtet.
 *
 * Fehlt der Kursleiter, ist das kein leeres Feld, sondern der eigentliche
 * Grund, warum man hinschaut. Es wird deshalb ausgeschrieben und markiert.
 */
export function TerminListe({ termine }: { termine: TerminMitKurs[] }) {
  if (termine.length === 0) {
    return (
      <p className="border border-border bg-card p-5 text-muted-foreground">
        In den nächsten sieben Tagen findet kein Kurs statt.
      </p>
    );
  }

  // Nach Kalendertag buendeln, damit das Datum nicht in jeder Zeile steht.
  const nachTag = new Map<string, TerminMitKurs[]>();
  for (const termin of termine) {
    const schluessel = termin.datum.toISOString().slice(0, 10);
    nachTag.set(schluessel, [...(nachTag.get(schluessel) ?? []), termin]);
  }

  const ohneKursleiter = termine.filter((t) => t.kursleiter === null).length;

  return (
    <div className="border border-border bg-card">
      {ohneKursleiter > 0 ? (
        <p className="flex items-center gap-2 border-b border-flaeche-3 bg-ampel-gelb-bg px-5 py-3 text-sm font-medium text-ampel-gelb">
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          {ohneKursleiter}{" "}
          {ohneKursleiter === 1 ? "Termin hat" : "Termine haben"} noch keinen
          Kursleiter
        </p>
      ) : null}

      <ul>
        {[...nachTag.entries()].map(([schluessel, tagesTermine]) => (
          <li key={schluessel} className="border-b border-flaeche-3 last:border-b-0">
            <p className="bg-flaeche-2 px-5 py-2 font-heading text-sm font-bold">
              {datumLang(tagesTermine[0].datum)}
            </p>
            <ul>
              {tagesTermine.map((termin) => (
                <li key={termin.id}>
                  <Link
                    href={`/admin/kurse/${termin.kursId}`}
                    className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 border-b border-flaeche-3 px-5 py-3 transition-colors last:border-b-0 hover:bg-flaeche-2"
                  >
                    <span className="w-28 shrink-0 tabular-nums text-sm text-muted-foreground">
                      {termin.von}–{termin.bis}
                    </span>
                    <span className="min-w-0 flex-1 font-medium">
                      {termin.kursart}
                    </span>
                    {termin.kursleiter ? (
                      <span className="flex items-center gap-2 text-sm">
                        <span className="bg-flaeche-3 px-2 py-1 font-heading text-xs font-bold">
                          {termin.kursleiter.kuerzel}
                        </span>
                        <span className="hidden text-muted-foreground sm:inline">
                          {termin.kursleiter.name}
                        </span>
                      </span>
                    ) : (
                      <span className="bg-ampel-gelb-bg px-2 py-1 text-xs font-semibold text-ampel-gelb">
                        Noch nicht bestimmt
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
