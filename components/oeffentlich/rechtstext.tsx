import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Rahmen fuer AGB, Datenschutzerklaerung und Impressum.
 *
 * Alle drei sind Entwuerfe. Der Hinweis steht sichtbar oben und nicht im
 * Kleingedruckten: diese Texte brauchen vor dem Go-Live eine juristische
 * Freigabe und die fehlenden Firmenangaben der Kundin. Ein Entwurf, der wie
 * ein fertiges Dokument aussieht, ist gefaehrlicher als gar keiner.
 */
export function Rechtstext({
  titel,
  stand,
  children,
}: {
  titel: string;
  stand: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
        {titel}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">Stand: {stand}</p>

      <div
        role="note"
        className="mt-8 flex gap-3 border-l-4 border-brand-rot bg-flaeche-2 p-5"
      >
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-brand-rot"
        />
        <div>
          <p className="font-heading font-bold">Entwurf, noch nicht freigegeben</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dieser Text ist ein Arbeitsstand. Vor der Aufschaltung muss er
            juristisch geprüft und um die fehlenden Angaben der Fahrschule
            ergänzt werden. Stellen in eckigen Klammern sind offen.
          </p>
        </div>
      </div>

      <div className="mt-10 space-y-8">{children}</div>
    </div>
  );
}

export function Abschnitt({
  titel,
  children,
}: {
  titel: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-heading text-2xl font-bold">{titel}</h2>
      <div className="mt-3 space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}

/** Offene Stelle, die die Kundin oder die Juristin fuellen muss. */
export function Offen({ children }: { children: ReactNode }) {
  return (
    <mark className="bg-brand-gelb px-1 font-medium text-brand-schwarz">
      [{children}]
    </mark>
  );
}
