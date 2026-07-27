import { cn } from "@/lib/utils";

/**
 * Bausteine, die sich auf allen oeffentlichen Seiten wiederholen, nach
 * design/haudis-design.dc.html.
 *
 * Die Vorlage baut jeden Abschnitt gleich auf: eine kleine Bezeichnung mit
 * gelbem Strich darunter, dann die Ueberschrift, dann der Inhalt. Diese Datei
 * haelt die Masse an einer Stelle fest, damit die Abschnitte nicht Seite fuer
 * Seite auseinanderlaufen.
 */

/** Kleine Bezeichnung mit gelbem Strich, 13px, ueber jeder Ueberschrift. */
export function Bezeichnung({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 inline-block border-b-[3px] border-brand-gelb pb-1 text-[13px] font-semibold text-grau-text">
      {children}
    </p>
  );
}

/**
 * Abschnitt mit Innenabstand und Trennlinie.
 *
 * Die Vorlage setzt 80px oben und unten auf dem Desktop. Auf dem Handy waere
 * das zu viel Leerraum zwischen zu wenig Inhalt, dort sind es 48px.
 */
export function Abschnitt({
  children,
  hell = false,
  className,
  ...rest
}: {
  children: React.ReactNode;
  /** Abgesetzte Flaeche wie beim Preisblock der Vorlage. */
  hell?: boolean;
  className?: string;
} & React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "border-b border-flaeche-3",
        hell ? "bg-flaeche-1" : "bg-card",
        className,
      )}
      {...rest}
    >
      <div className="mx-auto w-full max-w-[1344px] px-4 py-12 sm:px-6 lg:px-12 lg:py-20">
        {children}
      </div>
    </section>
  );
}

/** Ueberschrift zweiter Ordnung im Mass der Vorlage: 44px auf dem Desktop. */
export function AbschnittTitel({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <h2
      id={id}
      lang="de"
      className={cn(
        "font-heading text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[36px] lg:text-[44px]",
        className,
      )}
    >
      {children}
    </h2>
  );
}
