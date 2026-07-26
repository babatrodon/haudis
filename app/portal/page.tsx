import { requireInstruktorProfil } from "@/lib/auth-guard";
import { chf } from "@/lib/format";
import { TELEFONNUMMERN } from "@/lib/kontakt";

/**
 * Platzhalter. Einsatzplan, Schueler anmelden und Provisionen entstehen in
 * Sprint 5, PLAN.md Abschnitt 7.
 *
 * Was hier schon zaehlt: Das Portal arbeitet mit dem Instruktoren-Profil, nicht
 * mit dem Konto. Provision und Einsatzplan haengen am Profil
 * (Geschaeftsregel 11).
 */
export default async function PortalStart() {
  const { benutzer, profil } = await requireInstruktorProfil();

  if (!profil) {
    return <ProfilFehlt name={benutzer.name} />;
  }

  return (
    <div className="border border-border bg-card p-8">
      <h1 className="font-heading text-2xl font-bold">
        Hoi {profil.firstName}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Das Fahrlehrer-Portal wird in Sprint 5 gebaut.
      </p>

      <dl className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
        <div className="bg-card p-4">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Kürzel
          </dt>
          <dd className="mt-1 font-heading text-lg font-bold">
            {profil.shortCode}
          </dd>
        </div>
        <div className="bg-card p-4">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Name
          </dt>
          <dd className="mt-1 font-medium">
            {profil.lastName} {profil.firstName}
          </dd>
        </div>
        <div className="bg-card p-4">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Provision pro Buchung
          </dt>
          <dd className="mt-1 font-medium">
            {chf(profil.provisionPerBooking)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Ein Konto mit der Rolle INSTRUCTOR, dem kein Instruktoren-Profil zugeordnet
 * ist. Gueltiger Zustand, aber ohne Profil gibt es weder Einsatzplan noch
 * Provision, also wird das klar gesagt statt eine leere Seite zu zeigen.
 */
function ProfilFehlt({ name }: { name: string }) {
  return (
    <div className="border border-border bg-card p-8">
      <h1 className="font-heading text-2xl font-bold">
        Konto noch nicht zugeordnet
      </h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        Hoi {name}, Dein Login funktioniert, aber es ist noch keinem
        Fahrlehrer-Profil zugeordnet. Ohne Profil gibt es keinen Einsatzplan und
        keine Provisionsabrechnung. Bitte melde Dich bei der Administration.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {TELEFONNUMMERN.map((nummer) => (
          <a
            key={nummer.tel}
            href={`tel:${nummer.tel}`}
            className="inline-flex min-h-11 items-center border border-border bg-secondary px-4 font-heading font-semibold transition-colors hover:bg-accent"
          >
            {nummer.anzeige}
          </a>
        ))}
      </div>
    </div>
  );
}
