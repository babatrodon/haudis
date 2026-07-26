import { requireRole } from "@/lib/auth-guard";

/**
 * Platzhalter. Das Dashboard mit Kursen, Buchungen, Einsatzplan und Abrechnung
 * entsteht in Sprint 4, PLAN.md Abschnitt 6.
 */
export default async function AdminStart() {
  const benutzer = await requireRole("ADMIN");

  return (
    <div className="border border-border bg-card p-8">
      <h1 className="font-heading text-2xl font-bold">Angemeldet</h1>
      <p className="mt-2 text-muted-foreground">
        Das Admin-Panel wird in Sprint 4 gebaut.
      </p>

      <dl className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
        <div className="bg-card p-4">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Name
          </dt>
          <dd className="mt-1 font-medium">{benutzer.name}</dd>
        </div>
        <div className="bg-card p-4">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            E-Mail
          </dt>
          <dd className="mt-1 font-medium break-all">{benutzer.email}</dd>
        </div>
        <div className="bg-card p-4">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Rolle
          </dt>
          <dd className="mt-1 font-medium">{benutzer.role}</dd>
        </div>
      </dl>
    </div>
  );
}
