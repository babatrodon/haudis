import { Phone } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { LektionZeile } from "@/components/admin/lektion-zeile";
import { ProfilFehlt } from "@/components/portal/profil-fehlt";
import { PruefungEintragen } from "@/components/portal/pruefung-eintragen";
import { requireInstruktorProfil } from "@/lib/auth-guard";
import { schuelerDesInstruktors } from "@/lib/schueler";

/**
 * Meine Schüler, PLAN.md Abschnitt 14.
 *
 * Ein Fahrlehrer sieht die Schueler, zu denen ihm eine Lektion zugewiesen ist,
 * und nur seine eigenen Lektionen dazu. Die Zuordnung haengt an den Lektionen:
 * wer die Stunden faehrt, hat den Schueler.
 *
 * Was er hier NICHT kann: Schueler anlegen, Abos erfassen, Lektionen planen
 * oder sich selbst zuweisen. Das macht die Admin (Geschaeftsregel 10, auf die
 * Lektion uebertragen). Er hakt ab und traegt die bestandene Pruefung ein —
 * beides Dinge, die er als Erster weiss.
 *
 * Der Abo-Stand steht bewusst nicht hier: was der Schueler bezahlt hat, ist
 * eine Sache zwischen ihm und der Fahrschule.
 */
export default async function PortalSchuelerSeite() {
  const { benutzer, profil } = await requireInstruktorProfil();
  if (!profil) return <ProfilFehlt name={benutzer.name} />;

  const schueler = await schuelerDesInstruktors(profil.id);

  return (
    <>
      <SeitenKopf
        titel="Meine Schüler"
        beschreibung="Alle, denen Du eine Lektion fährst"
      />

      {schueler.length === 0 ? (
        <p className="border border-border bg-card p-5 text-muted-foreground">
          Dir ist noch keine Lektion zugewiesen. Sobald Ausilia Dir eine
          einträgt, erscheint der Schüler hier.
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {schueler.map((person) => (
            <li key={person.id}>
              <section className="border border-border bg-card">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-flaeche-3 px-4 py-4 sm:px-5">
                  <div>
                    <h2 className="font-heading text-lg font-bold">
                      {person.lastName} {person.firstName}
                    </h2>
                    <p className="mt-1">
                      <a
                        href={`tel:${person.phone.replace(/\s/g, "")}`}
                        className="inline-flex min-h-11 items-center gap-2 font-semibold tabular-nums"
                      >
                        <Phone aria-hidden="true" className="size-4" />
                        {person.phone}
                      </a>
                    </p>
                    {person.notes ? (
                      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                        {person.notes}
                      </p>
                    ) : null}
                  </div>

                  <PruefungEintragen
                    studentId={person.id}
                    pruefungAm={person.practicalExamPassedAt}
                  />
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Meine Lektionen
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {person.lessons.map((lektion) => (
                      <li key={lektion.id}>
                        <LektionZeile
                          portal
                          zeigeInstruktor={false}
                          studentId={person.id}
                          lektion={{
                            id: lektion.id,
                            kategorie: lektion.category,
                            datum: lektion.date,
                            startzeit: lektion.startTime,
                            dauerMinuten: lektion.durationMin,
                            abholort: lektion.pickupNote,
                            status: lektion.status,
                            instruktorId: lektion.instructorId,
                            instruktor: "",
                            aboId: lektion.packageId,
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 max-w-prose text-sm text-muted-foreground">
        Lektionen plant und Abos erfasst Ausilia. Wenn etwas fehlt oder ein
        Termin sich verschiebt, meldest Du Dich bei ihr.
      </p>
    </>
  );
}
