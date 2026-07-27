import { cn } from "@/lib/utils";

/**
 * Der schwarz-gelbe Schrägstreifen aus design/haudis-design.dc.html.
 *
 * Die Vorlage setzt ihn als Abschluss unter Bildern und als Kopfkante der
 * hervorgehobenen Preiskarte. Er stand an drei Stellen mit drei verschiedenen
 * Strichbreiten im Code; hier ist eine, damit er ueberall gleich aussieht.
 *
 * Rein dekorativ, deshalb aria-hidden — der Streifen sagt nichts, was nicht
 * schon im Text daneben steht.
 */
export function Diagonalstreifen({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-1.5 w-full shrink-0", className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(115deg,#121212 0 12px,#121212 12px,#FFE500 12px,#FFE500 24px)",
      }}
    />
  );
}
