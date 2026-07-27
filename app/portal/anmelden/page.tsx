import { SeitenKopf } from "@/components/admin/admin-huelle";
import { ProfilFehlt } from "@/components/portal/profil-fehlt";
import { SchuelerFormular } from "@/components/portal/schueler-formular";
import { buchbareKurse } from "@/lib/admin/buchungen";
import { requireInstruktorProfil } from "@/lib/auth-guard";
import { datum } from "@/lib/format";

export default async function SchuelerAnmeldenSeite() {
  const { benutzer, profil } = await requireInstruktorProfil();
  if (!profil) return <ProfilFehlt name={benutzer.name} />;

  const kurse = await buchbareKurse();

  return (
    <>
      <SeitenKopf
        titel="Schüler anmelden"
        beschreibung="Die Anmeldung wird Dir zugewiesen und zählt für Deine Provision."
      />

      <SchuelerFormular
        kuerzel={profil.shortCode}
        kurse={kurse.map((kurs) => ({
          id: kurs.id,
          name: kurs.name,
          frei: kurs.frei,
          beschriftung: `${kurs.name}${kurs.ersterTermin ? `, ${datum(kurs.ersterTermin)}` : ""} — ${kurs.frei === 0 ? "voll" : `${kurs.frei} frei`}`,
        }))}
      />
    </>
  );
}
