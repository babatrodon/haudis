import Link from "next/link";
import { Coins } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { ZeitraumFilter } from "@/components/admin/zeitraum-filter";
import { Button } from "@/components/ui/button";
import {
  accountingLesen,
  monatsVorgabe,
  zeitfensterAus,
  BASIS_TEXT,
  type Basis,
} from "@/lib/abrechnung";
import { requireRole } from "@/lib/auth-guard";
import { chf, datum } from "@/lib/format";

/**
 * Accounting, PLAN.md Abschnitt 6 Punkt 6.
 *
 * Periodensummen pro Kursart, dazu das Total und das Total ohne die
 * Motorrad-Grundkurse. Die zweite Zahl kommt aus dem Altsystem und wird dort
 * getrennt gefuehrt; sie steht hier, weil Ausilia sie so kennt.
 *
 * Gerechnet wird auf denselben Buchungen wie in der Abrechnung, ueber
 * dieselbe Funktion. Zwei Abfragen mit zwei Filtern koennten auseinander-
 * laufen, und dann wuesste niemand, welche Zahl gilt.
 */
export default async function AccountingSeite({
  searchParams,
}: {
  searchParams: Promise<{ von?: string; bis?: string; basis?: string }>;
}) {
  await requireRole("ADMIN");
  const parameter = await searchParams;
  const vorgabe = monatsVorgabe();

  const von = gueltigerTag(parameter.von) ?? vorgabe.von;
  const bis = gueltigerTag(parameter.bis) ?? vorgabe.bis;
  const basis: Basis = parameter.basis === "kurs" ? "kurs" : "anmeldung";

  const accounting = await accountingLesen(zeitfensterAus(von, bis, basis));
  const motorrad = accounting.kursarten.filter((eintrag) => eintrag.motorrad);

  return (
    <>
      <SeitenKopf
        titel="Accounting"
        aktionen={
          <Button asChild variant="outline">
            <Link href={`/admin/abrechnung?von=${von}&bis=${bis}&basis=${basis}`}>
              <Coins aria-hidden="true" className="size-4" />
              Abrechnung
            </Link>
          </Button>
        }
      />

      <p className="mb-4 text-muted-foreground">
        {datum(new Date(`${von}T00:00:00Z`))} bis{" "}
        {datum(new Date(`${bis}T00:00:00Z`))} · Basis {BASIS_TEXT[basis]}
      </p>

      <ZeitraumFilter
        von={von}
        bis={bis}
        basis={basis}
        ziel="/admin/accounting"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Karte
          titel="Total Umsatz"
          wert={chf(accounting.umsatz)}
          zusatz={`${accounting.anzahl} ${accounting.anzahl === 1 ? "Anmeldung" : "Anmeldungen"}`}
          betont
        />
        <Karte
          titel="Ohne Motorradkurse"
          wert={chf(accounting.umsatzOhneMotorrad)}
          zusatz={
            motorrad.length === 0
              ? "Keine Motorradkurse im Zeitraum"
              : `${accounting.anzahlOhneMotorrad} ${accounting.anzahlOhneMotorrad === 1 ? "Anmeldung" : "Anmeldungen"}`
          }
        />
        <Karte
          titel="Nicht mitgezählt"
          wert={chf(accounting.ausgeschlossen.umsatz)}
          zusatz={`${accounting.ausgeschlossen.anzahl} storniert`}
        />
      </div>

      <section aria-labelledby="kursarten-titel" className="mt-8">
        <h2 id="kursarten-titel" className="mb-3 font-heading text-lg font-bold">
          Nach Kursart
        </h2>

        {accounting.kursarten.length === 0 ? (
          <p className="border border-border bg-card p-5 text-muted-foreground">
            In diesem Zeitraum gibt es keine Anmeldung.
          </p>
        ) : (
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[28rem] border-collapse">
              <thead>
                <tr className="border-b border-flaeche-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold sm:px-5">Kursart</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Anmeldungen
                  </th>
                  <th className="px-4 py-3 text-right font-semibold sm:px-5">
                    Umsatz
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounting.kursarten.map((eintrag) => (
                  <tr
                    key={eintrag.code}
                    className="border-b border-flaeche-3 last:border-b-0"
                  >
                    <td className="px-4 py-3 sm:px-5">
                      {eintrag.name}
                      {eintrag.motorrad ? (
                        <span className="ml-2 bg-flaeche-2 px-1.5 py-0.5 text-xs text-muted-foreground">
                          Motorrad
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {eintrag.anzahl}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums sm:px-5">
                      {chf(eintrag.umsatz)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-linie-stark font-heading font-bold">
                  <td className="px-4 py-3 sm:px-5">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {accounting.anzahl}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums sm:px-5">
                    {chf(accounting.umsatz)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Karte({
  titel,
  wert,
  zusatz,
  betont = false,
}: {
  titel: string;
  wert: string;
  zusatz: string;
  betont?: boolean;
}) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {titel}
      </p>
      <p
        className={`mt-2 font-heading font-bold tabular-nums ${betont ? "text-3xl" : "text-2xl"}`}
      >
        {wert}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{zusatz}</p>
    </div>
  );
}

function gueltigerTag(wert: string | undefined): string | undefined {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return undefined;
  return Number.isNaN(Date.parse(wert)) ? undefined : wert;
}
