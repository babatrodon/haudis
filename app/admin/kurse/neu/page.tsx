import { SeitenKopf } from "@/components/admin/admin-huelle";
import { KursFormular } from "@/components/admin/kurs-formular";
import { kursartenFuerAuswahl } from "@/lib/admin/kurse";
import { requireRole } from "@/lib/auth-guard";
import { kursAnlegenAktion } from "../aktionen";

/**
 * Neuer Kurs.
 *
 * Erfolgskriterium aus PLAN.md Abschnitt 1: ein VKU in unter 60 Sekunden auf
 * dem iPad. Die Kursart ist vorgewaehlt, das Muster ebenfalls; damit bleibt
 * ein Datum zu waehlen und ein Knopf zu druecken.
 */
export default async function NeuerKursSeite() {
  await requireRole("ADMIN");
  const kursarten = await kursartenFuerAuswahl();

  return (
    <>
      <SeitenKopf
        titel="Neuer Kurs"
        beschreibung="Kursart und erster Kurstag genügen, alles andere ist vorbelegt."
      />

      <KursFormular
        kursarten={kursarten.map((kursart) => ({
          id: kursart.id,
          code: kursart.code,
          name: kursart.name,
          // Decimal ueberlebt die Grenze zum Client nicht, deshalb hier als
          // Zeichenkette. Gerechnet wird damit ohnehin nicht, siehe den Kopf
          // von lib/format.ts.
          grundpreis: kursart.basePrice.toString(),
          materialpreis: kursart.materialPrice.toString(),
          onlineLimit: kursart.onlineLimit,
        }))}
        aktion={kursAnlegenAktion}
        zurueck="/admin/kurse"
      />
    </>
  );
}
