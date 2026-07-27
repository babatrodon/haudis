import Link from "next/link";
import { Calculator, Printer } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import {
  AbrechnungBericht,
  AbrechnungKopf,
} from "@/components/admin/abrechnung-bericht";
import { ZeitraumFilter } from "@/components/admin/zeitraum-filter";
import { Button } from "@/components/ui/button";
import {
  abrechnungLesen,
  monatsVorgabe,
  zeitfensterAus,
  type Basis,
} from "@/lib/abrechnung";
import { requireRole } from "@/lib/auth-guard";
import { aktiveInstruktoren } from "@/lib/instruktoren";

/**
 * Abrechnung, PLAN.md Abschnitt 6 Punkt 5.
 *
 * Der Bericht zeigt die Rechnung und nicht nur das Ergebnis. Ausilia hat die
 * Provisionen jahrelang von Hand gerechnet und wird die ersten Monate
 * gegenpruefen; eine Zahl ohne nachvollziehbaren Weg dorthin waere in diesem
 * Moment wertlos.
 */
export default async function AbrechnungSeite({
  searchParams,
}: {
  searchParams: Promise<{
    von?: string;
    bis?: string;
    basis?: string;
    fahrlehrer?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const parameter = await searchParams;
  const vorgabe = monatsVorgabe();

  const von = gueltigerTag(parameter.von) ?? vorgabe.von;
  const bis = gueltigerTag(parameter.bis) ?? vorgabe.bis;
  const basis: Basis = parameter.basis === "kurs" ? "kurs" : "anmeldung";
  const fahrlehrer = parameter.fahrlehrer || undefined;

  const [abrechnung, instruktoren] = await Promise.all([
    abrechnungLesen(zeitfensterAus(von, bis, basis), fahrlehrer),
    aktiveInstruktoren(),
  ]);

  const druckAdresse = `/druck/abrechnung?von=${von}&bis=${bis}&basis=${basis}${
    fahrlehrer ? `&fahrlehrer=${fahrlehrer}` : ""
  }`;

  return (
    <>
      <SeitenKopf
        titel="Abrechnung"
        aktionen={
          <>
            <Button asChild variant="outline">
              <Link href={druckAdresse} target="_blank">
                <Printer aria-hidden="true" className="size-4" />
                Drucken
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/accounting?von=${von}&bis=${bis}&basis=${basis}`}>
                <Calculator aria-hidden="true" className="size-4" />
                Accounting
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <AbrechnungKopf abrechnung={abrechnung} />
      </div>

      <ZeitraumFilter
        von={von}
        bis={bis}
        basis={basis}
        instruktoren={instruktoren}
        instruktorId={fahrlehrer}
        ziel="/admin/abrechnung"
      />

      <AbrechnungBericht abrechnung={abrechnung} />
    </>
  );
}

/** Nimmt nur ein sauberes Tagesdatum an, sonst gilt die Vorgabe. */
function gueltigerTag(wert: string | undefined): string | undefined {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return undefined;
  return Number.isNaN(Date.parse(wert)) ? undefined : wert;
}
