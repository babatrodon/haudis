import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/lib/generated/prisma/enums";

/**
 * Kursstatus als Chip.
 *
 * "Veröffentlicht" ist der Normalfall und bleibt deshalb dezent. Entwurf und
 * Absage sind das, was auffallen muss: ein Entwurf ist unsichtbar fuer die
 * Kundschaft, eine Absage betrifft Leute.
 */

const STIL: Record<CourseStatus, { text: string; klasse: string }> = {
  PUBLISHED: {
    text: "Veröffentlicht",
    klasse: "border-flaeche-3 bg-flaeche-2 text-muted-foreground",
  },
  DRAFT: {
    text: "Entwurf",
    klasse: "border-ampel-gelb-linie bg-ampel-gelb-bg text-ampel-gelb",
  },
  CANCELLED: {
    text: "Abgesagt",
    klasse: "border-ampel-rot-linie bg-ampel-rot-bg text-ampel-rot",
  },
  ARCHIVED: {
    text: "Archiviert",
    klasse: "border-flaeche-3 bg-flaeche-2 text-muted-foreground",
  },
};

export function StatusChip({
  status,
  className,
}: {
  status: CourseStatus;
  className?: string;
}) {
  const stil = STIL[status];

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center border px-2 py-1 text-xs font-semibold",
        stil.klasse,
        className,
      )}
    >
      {stil.text}
    </span>
  );
}
