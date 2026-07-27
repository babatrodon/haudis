import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { ProfilFehlt } from "@/components/portal/profil-fehlt";
import { Button } from "@/components/ui/button";
import { requireInstruktorProfil } from "@/lib/auth-guard";
import { datumLang } from "@/lib/format";
import { eigeneTermine } from "@/lib/portal";

/**
 * Mein Einsatzplan.
 *
 * Die Startseite des Portals, weil sie die haeufigste Frage beantwortet: wann
 * muss ich wo sein. Der Fuellstand steht dabei, damit man vorher weiss, wie
 * viele Leute im Raum sitzen.
 */
export default async function PortalStart() {
  const { benutzer, profil } = await requireInstruktorProfil();
  if (!profil) return <ProfilFehlt name={benutzer.name} />;

  const termine = await eigeneTermine(profil.id);

  // Nach Kurstag buendeln: ein VKU-Abend besteht aus zwei Bloecken, und zwei
  // Zeilen mit demselben Datum liest man zweimal.
  const tage = [
    ...termine
      .reduce((sammlung, termin) => {
        const schluessel = termin.datum.toISOString();
        const bisher = sammlung.get(schluessel) ?? [];
        bisher.push(termin);
        sammlung.set(schluessel, bisher);
        return sammlung;
      }, new Map<string, typeof termine>())
      .entries(),
  ];

  return (
    <>
      <SeitenKopf
        titel={`Hoi ${profil.firstName}`}
        beschreibung={
          termine.length === 0
            ? "Für Dich ist zurzeit kein Termin eingeteilt."
            : `${termine.length} ${termine.length === 1 ? "Termin" : "Termine"} in den nächsten Wochen`
        }
      />

      {termine.length === 0 ? (
        <p className="border border-border bg-card p-5 text-muted-foreground">
          Sobald Dich die Administration einem Kurstermin zuweist, erscheint er
          hier.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tage.map(([schluessel, bloecke]) => (
            <li key={schluessel} className="border border-border bg-card">
              <h2 className="flex items-center gap-2 border-b border-flaeche-3 px-4 py-3 font-heading font-bold sm:px-5">
                <CalendarDays
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                {datumLang(bloecke[0].datum)}
              </h2>

              <ul>
                {bloecke.map((termin) => (
                  <li
                    key={termin.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-flaeche-3 px-4 py-3 last:border-b-0 sm:px-5"
                  >
                    <span className="font-medium tabular-nums">
                      {termin.von}–{termin.bis}
                    </span>
                    <span className="min-w-0 flex-1 text-muted-foreground">
                      {termin.kursName}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {termin.belegt}/{termin.limit} angemeldet
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap gap-2 border-t border-flaeche-3 pt-6">
        <Button asChild variant="outline">
          <Link href="/portal/anmelden">Schüler anmelden</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/portal/provisionen">Meine Provisionen</Link>
        </Button>
      </div>
    </>
  );
}
