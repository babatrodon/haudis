import type { LessonCategory, LessonStatus } from "@/lib/generated/prisma/enums";

/**
 * Beschriftungen und Masse der Lektionsverwaltung.
 *
 * Alles hier laeuft auch im Browser. Deshalb keine Importe aus lib/schueler.ts
 * oder lib/db.ts: beide sind server-only, und eine Client-Komponente, die sie
 * anzieht, bricht den Build ab. Dieselbe Trennung wie bei
 * lib/inhalte/kursmuster.ts und lib/preis.ts.
 */

export const KATEGORIE_TEXT: Record<LessonCategory, string> = {
  AUTO: "Auto",
  TAXI: "Taxi",
  MOTORRAD: "Motorrad",
  LKW: "Lastwagen",
  ANHAENGER_BE: "Anhänger BE",
};

export const STATUS_TEXT: Record<LessonStatus, string> = {
  GEPLANT: "Geplant",
  ABSOLVIERT: "Absolviert",
  STORNIERT: "Storniert",
  NO_SHOW: "Nicht erschienen",
};

/** Abo-Groessen aus PLAN.md Abschnitt 5. */
export const ABO_GROESSEN = [1, 5, 10] as const;
