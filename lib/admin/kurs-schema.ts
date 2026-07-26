import { z } from "zod";

/**
 * Validierung der Kursformulare. Wie bei der Anmeldung gilt: eine Fassung,
 * benutzt von Browser und Server, und serverseitig immer erneut geprueft.
 *
 * Betraege bleiben Zeichenketten und wandern so zu Prisma. Ein Umweg ueber
 * Number wuerde die Rappen antasten, und genau das verbietet der Kopf von
 * lib/format.ts.
 */

const betrag = z
  .string()
  .trim()
  .regex(/^\d{1,6}([.,]\d{1,2})?$/, "Betrag wie 140 oder 140.00 eingeben")
  // Komma ist auf Schweizer Tastaturen naheliegend, Prisma will einen Punkt.
  .transform((wert) => wert.replace(",", "."));

const datum = z
  .string()
  .min(1, "Datum wählen")
  .refine((wert) => !Number.isNaN(Date.parse(wert)), "Gültiges Datum");

const uhrzeit = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Zeit wie 18:00 eingeben");

export const terminSchema = z.object({
  datum,
  von: uhrzeit,
  bis: uhrzeit,
});

export type TerminEingabe = z.infer<typeof terminSchema>;

export const kursSchema = z
  .object({
    kursartId: z.string().min(1, "Kursart wählen"),
    termine: z
      .array(terminSchema)
      .min(1, "Mindestens ein Termin")
      .max(20, "Höchstens 20 Termine"),
    preis: betrag,
    materialpreis: betrag,
    onlineLimit: z.coerce
      .number()
      .int()
      .min(1, "Mindestens ein Platz")
      .max(100, "Höchstens 100 Plätze"),
    /** Leer heisst: kein Frühbucherrabatt für diesen Kurs. */
    fruehbucherProzent: z
      .string()
      .trim()
      .optional()
      .transform((wert) => (wert ? wert.replace(",", ".") : "")),
    fruehbucherPlaetze: z
      .string()
      .trim()
      .optional()
      .transform((wert) => wert ?? ""),
    notizen: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((wert) => wert ?? ""),
    veroeffentlichen: z.boolean(),
  })
  .refine(
    (daten) =>
      daten.termine.every((termin) => termin.bis > termin.von),
    { path: ["termine"], message: "Jeder Block muss später enden als beginnen" },
  )
  .refine(
    (daten) =>
      // Beides oder keines. Ein Prozentsatz ohne Plaetze rabattiert unbegrenzt,
      // Plaetze ohne Prozentsatz rabattieren nichts.
      (daten.fruehbucherProzent === "" && !daten.fruehbucherPlaetze) ||
      (daten.fruehbucherProzent !== "" && Boolean(daten.fruehbucherPlaetze)),
    {
      path: ["fruehbucherProzent"],
      message: "Frühbucher braucht Prozentsatz und Anzahl Plätze, oder beides leer",
    },
  );

export type KursEingabe = z.infer<typeof kursSchema>;

export const duplizierenSchema = z.object({
  kursId: z.string().min(1),
  /** Neuer erster Kurstag. Alle Termine verschieben sich um dieselbe Spanne. */
  neuerStart: datum,
});

export const absagenSchema = z.object({
  kursId: z.string().min(1),
  benachrichtigen: z.boolean(),
  grund: z.string().trim().max(300).optional(),
});
