import { SeitenKopf } from "@/components/admin/admin-huelle";
import { EinstellungenGruppe } from "@/components/admin/einstellungen-gruppe";
import { GRUPPEN } from "@/lib/admin/einstellungen-meta";
import { requireRole } from "@/lib/auth-guard";
import { einstellungenLesen } from "@/lib/einstellungen";

/**
 * Einstellungen, gruppiert.
 *
 * Jede Gruppe speichert fuer sich. Nach dem Speichern wird die oeffentliche
 * Seite neu erzeugt, sonst zeigt sie bis zu eine Stunde den alten Wert.
 */
export default async function EinstellungenSeite() {
  await requireRole("ADMIN");
  const werte = await einstellungenLesen();

  return (
    <>
      <SeitenKopf
        titel="Einstellungen"
        beschreibung="Änderungen erscheinen sofort auf der Website."
      />

      <div className="flex flex-col gap-4">
        {GRUPPEN.map((gruppe) => (
          <EinstellungenGruppe key={gruppe.id} gruppe={gruppe} werte={werte} />
        ))}
      </div>
    </>
  );
}
