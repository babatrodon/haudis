import { TELEFONNUMMERN } from "@/lib/kontakt";

/**
 * Ein Konto mit der Rolle INSTRUCTOR, dem kein Instruktoren-Profil zugeordnet
 * ist.
 *
 * Gueltiger Zustand (Geschaeftsregel 11), aber ohne Profil gibt es weder
 * Einsatzplan noch Provision. Deshalb steht hier, was fehlt, statt einer
 * leeren Seite, die wie ein Fehler aussieht.
 */
export function ProfilFehlt({ name }: { name: string }) {
  return (
    <div className="border border-border bg-card p-6 sm:p-8">
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
            className="inline-flex min-h-12 items-center border border-border bg-secondary px-4 font-heading font-semibold tabular-nums transition-colors hover:bg-accent"
          >
            {nummer.anzeige}
          </a>
        ))}
      </div>
    </div>
  );
}
