import { Bezeichnung } from "@/components/oeffentlich/abschnitt";
import { cn } from "@/lib/utils";

/**
 * Kopf einer oeffentlichen Seite, in der Typo von
 * design/haudis-design.dc.html.
 *
 * Die Vorlage zeichnet nur sechs Screens. Die uebrigen Seiten — Bögle,
 * Vorschriften, Galerie, Kursuebersicht, Rechtstexte — bekommen denselben
 * Kopf, damit der Wechsel von einer gezeichneten auf eine ungezeichnete Seite
 * nicht wie ein Sprung in eine andere Website wirkt. Inhalt und Reihenfolge
 * dieser Seiten bleiben, wie sie waren.
 *
 * Masse aus der Vorlage: Bezeichnung mit gelbem Strich, dann 56px auf dem
 * Desktop, darunter der Lauftext auf 620 Pixel begrenzt.
 */
export function SeitenKopf({
  bezeichnung,
  titel,
  children,
  className,
}: {
  bezeichnung: string;
  titel: string;
  /** Lauftext unter der Ueberschrift. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("max-w-[760px]", className)}>
      <Bezeichnung>{bezeichnung}</Bezeichnung>
      <h1
        lang="de"
        className="font-heading text-[32px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[44px] lg:text-[56px] lg:leading-none"
      >
        {titel}
      </h1>
      {children ? (
        <div className="mt-5 max-w-[620px] leading-[1.55] text-grau-text lg:text-lg">
          {children}
        </div>
      ) : null}
    </header>
  );
}
