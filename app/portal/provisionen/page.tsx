import Link from "next/link";
import { Printer } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import {
  AbrechnungBericht,
  AbrechnungKopf,
} from "@/components/admin/abrechnung-bericht";
import { ZeitraumFilter } from "@/components/admin/zeitraum-filter";
import { ProfilFehlt } from "@/components/portal/profil-fehlt";
import { Button } from "@/components/ui/button";
import {
  abrechnungLesen,
  basisAus,
  monatsVorgabe,
  zeitfensterAus,
} from "@/lib/abrechnung";
import { requireInstruktorProfil } from "@/lib/auth-guard";

/**
 * Meine Provisionen.
 *
 * Derselbe Bericht wie im Panel, nur ohne Fahrlehrer-Filter: die
 * Einschraenkung kommt aus der Sitzung und nicht aus der Adresse. Wer die
 * Adresse manipuliert, sieht trotzdem nur die eigenen Zahlen.
 */
export default async function ProvisionenSeite({
  searchParams,
}: {
  searchParams: Promise<{ von?: string; bis?: string; basis?: string }>;
}) {
  const { benutzer, profil } = await requireInstruktorProfil();
  if (!profil) return <ProfilFehlt name={benutzer.name} />;

  const parameter = await searchParams;
  const vorgabe = monatsVorgabe();
  const von = gueltigerTag(parameter.von) ?? vorgabe.von;
  const bis = gueltigerTag(parameter.bis) ?? vorgabe.bis;
  const basis = basisAus(parameter.basis);

  const abrechnung = await abrechnungLesen(
    zeitfensterAus(von, bis, basis),
    profil.id,
  );

  return (
    <>
      <SeitenKopf
        titel="Meine Provisionen"
        aktionen={
          <Button asChild variant="outline">
            <Link
              href={`/druck/abrechnung?von=${von}&bis=${bis}&basis=${basis}`}
              target="_blank"
            >
              <Printer aria-hidden="true" className="size-4" />
              Drucken
            </Link>
          </Button>
        }
      />

      <div className="mb-4">
        <AbrechnungKopf abrechnung={abrechnung} />
      </div>

      <ZeitraumFilter
        von={von}
        bis={bis}
        basis={basis}
        ziel="/portal/provisionen"
      />

      <AbrechnungBericht abrechnung={abrechnung} />
    </>
  );
}

function gueltigerTag(wert: string | undefined): string | undefined {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return undefined;
  return Number.isNaN(Date.parse(wert)) ? undefined : wert;
}
