import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { SchuelerKarteiAnsicht } from "@/components/admin/schueler-kartei";
import { Button } from "@/components/ui/button";
import { schuelerLesen } from "@/lib/admin/schueler";
import { requireRole } from "@/lib/auth-guard";
import { einstellungenLesen } from "@/lib/einstellungen";
import { aktiveInstruktoren } from "@/lib/instruktoren";

/**
 * Die Kartei eines Schuelers.
 *
 * Preisvorschlaege kommen aus den Einstellungen, damit ein Abo nicht von Hand
 * bepreist werden muss. Fuer Motorrad und Anhaenger BE steht dort nichts —
 * dann bleibt das Feld leer, statt eine erfundene Zahl vorzuschlagen.
 */
export default async function SchuelerKarteiSeite({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireRole("ADMIN");
  const { studentId } = await params;

  const [kartei, instruktoren, werte] = await Promise.all([
    schuelerLesen(studentId),
    aktiveInstruktoren(),
    einstellungenLesen(),
  ]);

  if (!kartei) notFound();

  // Der 5er-Ansatz als Vorschlag: das ist das haeufigste Abo. Ausilia
  // ueberschreibt ihn, wenn es ein anderes ist.
  const preisVorschlag: Record<string, string> = {
    AUTO: werte["fahrstunden.auto.abo5"],
    TAXI: werte["fahrstunden.taxi.abo5"],
    MOTORRAD: werte["fahrstunden.motorrad.abo5"],
    LKW: werte["fahrstunden.lkw.praktisch"],
    ANHAENGER_BE: werte["fahrstunden.anhaenger.abo5"],
  };

  return (
    <>
      <SeitenKopf
        titel={`${kartei.nachname} ${kartei.vorname}`}
        beschreibung={kartei.email ?? "keine E-Mail hinterlegt"}
        aktionen={
          <>
            <Button asChild variant="outline">
              <a href={`tel:${kartei.telefon.replace(/\s/g, "")}`}>
                <Phone aria-hidden="true" className="size-4" />
                {kartei.telefon}
              </a>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/schueler">Zur Liste</Link>
            </Button>
          </>
        }
      />

      <SchuelerKarteiAnsicht
        kartei={kartei}
        instruktoren={instruktoren}
        preisVorschlag={preisVorschlag}
        versandAktiv={Boolean(process.env.RESEND_API_KEY)}
      />
    </>
  );
}
