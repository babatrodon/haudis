import { cn } from "@/lib/utils";
import type { AmpelZustand } from "@/lib/verfuegbarkeit";

/**
 * Verfuegbarkeits-Ampel (Geschaeftsregel 2).
 *
 * Farben und Punkt stammen eins zu eins aus der Designvorlage. Das Team kennt
 * das mentale Modell aus dem Altsystem, deshalb bleibt es erhalten.
 *
 * Die Farbe allein traegt die Aussage nicht: der Text steht daneben, damit die
 * Information auch ohne Farbwahrnehmung ankommt.
 */

const CHIP_STIL: Record<AmpelZustand, { rahmen: string; punkt: string }> = {
  gruen: {
    rahmen: "bg-ampel-gruen-bg text-ampel-gruen border-ampel-gruen-linie",
    punkt: "bg-ampel-gruen-punkt",
  },
  gelb: {
    rahmen: "bg-ampel-gelb-bg text-ampel-gelb border-ampel-gelb-linie",
    punkt: "bg-ampel-gelb",
  },
  rot: {
    rahmen: "bg-ampel-rot-bg text-ampel-rot border-ampel-rot-linie",
    punkt: "bg-ampel-rot-punkt",
  },
};

export function AmpelChip({
  zustand,
  text,
  className,
}: {
  zustand: AmpelZustand;
  text: string;
  className?: string;
}) {
  const stil = CHIP_STIL[zustand];

  return (
    <span
      className={cn(
        // max-w-full ist keine Kosmetik: ohne die Begrenzung waechst ein
        // inline-flex ueber seinen Container hinaus, statt umzubrechen. In
        // einer schmalen Kurskarte ragte der Chip dadurch aus der Karte heraus
        // und wurde am Rand abgeschnitten.
        "inline-flex max-w-full items-center gap-2 border px-3 py-2 text-sm font-semibold",
        stil.rahmen,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("block size-[9px] shrink-0", stil.punkt)}
      />
      {text}
    </span>
  );
}
