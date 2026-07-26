import { cn } from "@/lib/utils";

/**
 * Platzhalter fuer ein noch fehlendes Foto.
 *
 * Die Galerie und die Fotos der Fahrzeuge und Schulungsraeume kommen von der
 * Kundin, vor dem Launch werden sie eingesetzt. PLAN.md Abschnitt 10 schliesst
 * KI-generierte Bilder im ganzen Projekt aus, deshalb steht hier ein sichtbar
 * markierter Platz statt eines erfundenen Bildes.
 *
 * Das feste Seitenverhaeltnis ist kein Detail: es reserviert den Platz schon
 * vor dem Austausch, damit spaeter kein Layoutsprung entsteht und der
 * Lighthouse-Wert fuer Layout Shift stabil bleibt.
 *
 * Austausch spaeter: diese Komponente durch next/image ersetzen, das
 * Seitenverhaeltnis und der beschreibende Text bleiben.
 */
export function Bildplatzhalter({
  beschreibung,
  seitenverhaeltnis = "4/3",
  className,
}: {
  /** Was auf dem Foto zu sehen sein soll. Wird spaeter zum alt-Text. */
  beschreibung: string;
  /** CSS aspect-ratio, zum Beispiel "16/9" oder "1/1". */
  seitenverhaeltnis?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`Bild folgt: ${beschreibung}`}
      style={{ aspectRatio: seitenverhaeltnis }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 border border-dashed border-linie-stark bg-flaeche-3 p-6 text-center",
        className,
      )}
    >
      {/* Bewusst --grau-text und nicht --grau-text-hell: das hellere Grau
          erreicht auf dieser Flaeche nur einen Kontrast von 2.86 und faellt
          damit unter die geforderten 4.5 fuer kleine Schrift. */}
      <span className="font-heading text-xs font-semibold uppercase tracking-widest text-grau-text">
        Bild folgt
      </span>
      <span className="max-w-[28ch] text-sm text-grau-text">
        {beschreibung}
      </span>
    </div>
  );
}
