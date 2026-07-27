import { chf } from "@/lib/format";
import type { Decimal } from "@/lib/decimal";

/**
 * "Deine Buchung": Kurs, Termine, Preise, Total.
 *
 * Nach design/haudis-design.dc.html Screen 04. Der Kasten ist schwarz
 * umrandet, nicht grau: er ist das einzige Element auf der Seite, das den
 * verbindlichen Betrag nennt.
 *
 * Die Betraege kommen als Decimal herein und gehen erst hier durch chf().
 * Gerechnet wird nirgends in dieser Datei, siehe den Kopf von lib/format.ts.
 */

export type BuchungsPosten = {
  kursName: string;
  termine: string;
  kursgebuehr: Decimal;
  lehrmittel: Decimal;
  total: Decimal;
  /** Steht nur da, wenn ein Rabatt greift. */
  regulaer?: Decimal;
  fruehbucher?: boolean;
  /** Auf Schritt 2 steht die gewaehlte Zahlungsart mit im Kasten. */
  zahlung?: string;
};

export function Buchungskarte({ posten }: { posten: BuchungsPosten }) {
  return (
    <div className="border border-brand-schwarz bg-card p-5 lg:p-6">
      <p className="text-[13px] text-grau-text-hell">Deine Buchung</p>
      <p className="mt-1.5 font-heading text-[22px] font-semibold leading-tight">
        {posten.kursName}
      </p>
      <p className="mt-1 text-sm tabular-nums text-grau-text">{posten.termine}</p>

      <dl className="mt-4.5">
        <Zeile bezeichnung="Kursgebühr" wert={chf(posten.kursgebuehr)} />
        {posten.lehrmittel.gt(0) ? (
          <Zeile bezeichnung="Kursmaterial" wert={chf(posten.lehrmittel)} />
        ) : null}
        {posten.fruehbucher && posten.regulaer ? (
          <Zeile
            bezeichnung="Frühbucherrabatt"
            wert={`− ${chf(posten.regulaer.minus(posten.total))}`}
          />
        ) : null}

        <div className="mt-1.5 flex items-baseline justify-between gap-4 border-t border-brand-schwarz pt-3.5">
          <dt className="font-semibold">Total</dt>
          <dd className="font-heading text-[26px] font-semibold tabular-nums">
            {chf(posten.total)}
          </dd>
        </div>

        {posten.zahlung ? (
          <div className="mt-3 flex items-baseline justify-between gap-4 text-[15px]">
            <dt className="text-grau-text">Zahlung</dt>
            <dd className="font-semibold">{posten.zahlung}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function Zeile({ bezeichnung, wert }: { bezeichnung: string; wert: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-flaeche-3 py-2.5 text-[15px] tabular-nums">
      <dt>{bezeichnung}</dt>
      <dd className="font-semibold">{wert}</dd>
    </div>
  );
}

/**
 * Zahlungsart.
 *
 * Die Vorlage zeigt Bar, TWINT und Karte. Payrexx ist nicht angebunden, also
 * steht hier nur Bar — ein Knopf, der eine Zahlung verspricht, die niemand
 * abschliessen kann, ist schlimmer als eine fehlende Auswahl. Die Liste bleibt
 * eine Liste, damit die beiden anderen ohne Umbau dazukommen (PLAN.md
 * Abschnitt 14, Welle 2).
 */
export function Zahlungsarten() {
  return (
    <div>
      <p className="mb-2.5 text-sm font-semibold lg:mb-3">Zahlungsart</p>
      <ul className="flex flex-col gap-2 lg:gap-2.5">
        <li className="flex min-h-12 items-center border border-brand-schwarz bg-brand-gelb px-3.5 py-3 font-semibold text-brand-schwarz lg:px-4">
          Bar am ersten Kurstag
        </li>
      </ul>
      <p className="mt-2.5 text-[13px] text-grau-text-hell">
        Der Betrag wird am ersten Kurstag bar bezahlt.
      </p>
    </div>
  );
}
