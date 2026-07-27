import { z } from "zod";
import { buchungSchema } from "@/lib/buchung-schema";

/**
 * Validierung der Buchungsformulare im Panel.
 *
 * Die telefonische Anmeldung erbt die Regeln der Onlineanmeldung, laesst aber
 * das AGB-Haekchen weg: am Telefon setzt niemand ein Haekchen, und eine
 * behauptete Zustimmung waere schlechter als keine. Die Buchung wird dafuer
 * mit source PHONE gespeichert, wo genau das nachlesbar ist.
 */

export const telefonAnmeldungSchema = buchungSchema
  .omit({ agb: true, webseite: true })
  .extend({
    kursId: z.string().min(1, "Kurs wählen"),
    lfaNummer: z.string().trim().max(40).optional().default(""),
    /** Leer heisst: keine Zuweisung, also keine Provision. */
    fahrlehrerId: z.string().trim().optional().default(""),
  });

export type TelefonAnmeldung = z.infer<typeof telefonAnmeldungSchema>;

export const buchungAendernSchema = buchungSchema
  .omit({ agb: true, webseite: true })
  .extend({
    buchungId: z.string().min(1),
    lfaNummer: z.string().trim().max(40).optional().default(""),
    fahrlehrerId: z.string().trim().optional().default(""),
  });

export const lfaSchema = z.object({
  buchungId: z.string().min(1),
  lfaNummer: z.string().trim().max(40),
});
