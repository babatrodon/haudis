import { SeitenKopf } from "@/components/admin/admin-huelle";
import { KontoDialog } from "@/components/admin/konto-dialog";
import { ProvisionFeld } from "@/components/admin/provision-feld";
import { instruktorenMitKonten } from "@/lib/admin/konten";
import { requireRole } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";

/**
 * Fahrlehrer: Profile, Konten, Provisionssaetze.
 *
 * Ein Profil ist ein Mensch, der Kurse gibt; ein Konto ist ein Zugang zum
 * Portal. Die beiden haengen zusammen, sind aber nicht dasselbe
 * (Geschaeftsregel 11), und die Liste zeigt genau das: jede Zeile ein Profil,
 * mit oder ohne Konto.
 */
export default async function FahrlehrerSeite() {
  await requireRole("ADMIN");
  const instruktoren = await instruktorenMitKonten();

  const mitKonto = instruktoren.filter((eintrag) => eintrag.konto).length;

  return (
    <>
      <SeitenKopf
        titel="Fahrlehrer"
        beschreibung={`${instruktoren.length} Profile, ${mitKonto} mit Zugang zum Portal`}
      />

      <ul className="flex flex-col gap-3">
        {instruktoren.map((instruktor) => (
          <li
            key={instruktor.id}
            className={cn(
              "border border-border bg-card p-4 sm:p-5",
              !instruktor.aktiv && "border-dashed opacity-70",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-bold">
                  {instruktor.nachname} {instruktor.vorname}{" "}
                  <span className="font-normal tabular-nums text-muted-foreground">
                    {instruktor.kuerzel}
                  </span>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {instruktor.konto ? (
                    <>
                      {instruktor.konto.email}
                      {!instruktor.konto.aktiv ? " · Konto stillgelegt" : ""}
                      {instruktor.konto.passwortWechselOffen
                        ? " · Passwortwechsel offen"
                        : ""}
                    </>
                  ) : (
                    "Kein Konto"
                  )}
                  {instruktor.zugewieseneBuchungen > 0
                    ? ` · ${instruktor.zugewieseneBuchungen} zugewiesene ${instruktor.zugewieseneBuchungen === 1 ? "Buchung" : "Buchungen"}`
                    : ""}
                </p>
              </div>

              {!instruktor.aktiv ? (
                <span className="border border-flaeche-3 bg-flaeche-2 px-2 py-1 text-xs font-semibold text-muted-foreground">
                  Profil inaktiv
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-flaeche-3 pt-4">
              <ProvisionFeld
                instruktorId={instruktor.id}
                provision={instruktor.provision.toString()}
                aktiv={instruktor.aktiv}
              />
              <KontoDialog instruktor={instruktor} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
