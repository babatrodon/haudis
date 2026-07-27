import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { SeitenKopf } from "@/components/oeffentlich/seiten-kopf";

/**
 * Rahmen fuer AGB, Datenschutzerklaerung und Impressum.
 *
 * Alle drei sind Entwuerfe. Der Hinweis steht sichtbar oben und nicht im
 * Kleingedruckten: diese Texte brauchen vor dem Go-Live eine juristische
 * Freigabe und die fehlenden Firmenangaben der Kundin. Ein Entwurf, der wie
 * ein fertiges Dokument aussieht, ist gefaehrlicher als gar keiner.
 */
/**
 * Entwuerfe gehoeren nicht in den Suchindex. Ein ungeprueftes AGB- oder
 * Datenschutz-Dokument, das ueber Google auffindbar ist, wirkt verbindlich,
 * obwohl es niemand freigegeben hat.
 *
 * Lighthouse zieht dafuer den SEO-Wert dieser drei Seiten auf 60. Das ist der
 * gewollte Preis, kein Fehler.
 *
 * ENTFERNEN, sobald die Texte juristisch freigegeben sind: dann sollen AGB,
 * Datenschutzerklaerung und Impressum ganz normal auffindbar sein.
 */
export const RECHTSTEXT_ROBOTS = { index: false, follow: true } as const;

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
    /* Rechtstexte bleiben schmal. Auf der Breite der uebrigen Seiten waeren
       die Zeilen zu lang zum Lesen, und gelesen werden sollen sie. */
    <div className="bg-card">
      <div className="mx-auto w-full max-w-[760px] px-4 py-12 sm:px-6 lg:py-16">
      <SeitenKopf bezeichnung={`Stand: ${stand}`} titel={titel} />

      <div
        role="note"
        className="mt-8 flex gap-3 border-l-4 border-brand-rot bg-flaeche-2 p-5"
      >
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-brand-rot"
        />
        <div>
          <p className="font-heading font-semibold">
            Entwurf, noch nicht freigegeben
          </p>
          <p className="mt-1 text-sm text-grau-text">
            Dieser Text ist ein Arbeitsstand. Vor der Aufschaltung muss er
            juristisch geprüft und um die fehlenden Angaben der Fahrschule
            ergänzt werden. Stellen in eckigen Klammern sind offen.
          </p>
        </div>
      </div>

      <div className="mt-10 space-y-8">{children}</div>
      </div>
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
      <h2 className="font-heading text-2xl font-semibold">{titel}</h2>
      <div className="mt-3 space-y-3 leading-[1.6] text-grau-text">{children}</div>
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
