import { requireRole } from "@/lib/auth-guard";

/**
 * Platzhalter. Einsatzplan, Schueler anmelden und Provisionen entstehen in
 * Sprint 5, PLAN.md Abschnitt 7.
 *
 * Hinweis fuer spaeter: Wer hier angemeldet ist, hat ein Login. Ob dazu ein
 * Instruktoren-Profil existiert, ist eine getrennte Frage (Geschaeftsregel 11).
 * Das Portal muss ab Sprint 5 auf das Profil aufloesen, nicht auf den User.
 */
export default async function PortalStart() {
  const benutzer = await requireRole("INSTRUCTOR");

  return (
    <div className="border border-border bg-card p-8">
      <h1 className="font-heading text-2xl font-bold">Angemeldet</h1>
      <p className="mt-2 text-muted-foreground">
        Das Fahrlehrer-Portal wird in Sprint 5 gebaut.
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
