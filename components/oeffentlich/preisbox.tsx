import { chf } from "@/lib/format";
import type { Decimal } from "@/lib/decimal";

/**
 * Preisaufstellung fuer die Anmeldung (PLAN.md Abschnitt 5, Buchungsflow).
 *
 * Zeigt Kursgebuehr und Lehrmittel getrennt, den Fruehbucherabzug wenn er
 * greift, und den Hinweis auf die Barzahlung. Der angezeigte Betrag ist
 * derselbe, der gespeichert und per Mail bestaetigt wird: beides stammt aus
 * lib/preis.ts.
 */
export function Preisbox({
  kursgebuehr,
  lehrmittel,
  regulaer,
  total,
  fruehbucher,
  fruehbucherPlaetzeFrei,
  lernfahrausweisNoetig,
}: {
  kursgebuehr: Decimal;
  lehrmittel: Decimal;
  regulaer: Decimal;
  total: Decimal;
  fruehbucher: boolean;
  fruehbucherPlaetzeFrei: number;
  lernfahrausweisNoetig: boolean;
}) {
  return (
    <div className="border border-border bg-card">
      <div className="border-b border-flaeche-3 p-5">
        <h2 className="font-heading text-lg font-bold">Kosten</h2>
      </div>

      <dl className="p-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-flaeche-3 pb-3">
          <dt className="text-muted-foreground">Kursgebühr</dt>
          <dd className="tabular-nums">{chf(kursgebuehr)}</dd>
        </div>

        {lehrmittel.gt(0) ? (
          <div className="flex items-baseline justify-between gap-4 border-b border-flaeche-3 py-3">
            <dt className="text-muted-foreground">Kursmaterial</dt>
            <dd className="tabular-nums">{chf(lehrmittel)}</dd>
          </div>
        ) : null}

        {fruehbucher ? (
          <div className="flex items-baseline justify-between gap-4 border-b border-flaeche-3 py-3">
            <dt className="text-muted-foreground">Frühbucherrabatt</dt>
            <dd className="tabular-nums text-ampel-gruen">
              −{chf(regulaer.minus(total))}
            </dd>
          </div>
        ) : null}

        <div className="flex items-baseline justify-between gap-4 pt-4">
          <dt className="font-heading text-lg font-bold">Total</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums">
            {chf(total)}
          </dd>
        </div>
      </dl>

      <div className="space-y-3 border-t border-flaeche-3 p-5">
        {fruehbucher ? (
          <p className="bg-brand-gelb px-3 py-2 text-sm font-semibold text-brand-schwarz">
            Frühbucherpreis: Du bist unter den ersten Anmeldungen. Noch{" "}
            {fruehbucherPlaetzeFrei}{" "}
            {fruehbucherPlaetzeFrei === 1 ? "Platz" : "Plätze"} zu diesem Preis.
          </p>
        ) : null}

        <p className="text-sm text-muted-foreground">
          Betrag bitte bar am ersten Kurstag mitbringen.
        </p>

        {lernfahrausweisNoetig ? (
          <p className="border-l-4 border-brand-gelb pl-3 text-sm">
            <strong className="font-heading">Wichtig:</strong> Lernfahrausweis am
            ersten Kurstag mitbringen.
          </p>
        ) : null}
      </div>
    </div>
  );
}
