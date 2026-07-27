import { z } from "zod";
import { buchungSchema } from "@/lib/buchung-schema";

/**
 * Validierung der Buchungsformulare im Panel.
 *
 * Die telefonische Anmeldung erbt die Regeln der Onlineanmeldung, mit zwei
 * Abweichungen:
 *
 *   Kein AGB-Haekchen. Am Telefon setzt niemand eines, und eine behauptete
 *   Zustimmung waere schlechter als keine. Die Buchung wird mit source PHONE
 *   gespeichert, wo genau das nachlesbar ist.
 *
 *   Die E-Mail-Adresse ist freiwillig. Am Schalter und am Telefon gibt es
 *   Leute ohne Adresse, vor allem bei den Nothelferkursen. Im oeffentlichen
 *   Formular bleibt sie Pflicht — dort ist sie der Weg zur Bestaetigung.
 */

/** Leer erlaubt, aber wenn etwas dasteht, muss es eine Adresse sein. */
const emailFreiwillig = z
  .union([z.literal(""), z.string().trim().email("E-Mail-Adresse prüfen").max(160)])
  .optional()
  .default("");

export const telefonAnmeldungSchema = buchungSchema
  .omit({ agb: true, webseite: true })
  .extend({
    kursId: z.string().min(1, "Kurs wählen"),
    email: emailFreiwillig,
    lfaNummer: z.string().trim().max(40).optional().default(""),
    /** Leer heisst: keine Zuweisung, also keine Provision. */
    fahrlehrerId: z.string().trim().optional().default(""),
  });

export type TelefonAnmeldung = z.infer<typeof telefonAnmeldungSchema>;

export const buchungAendernSchema = buchungSchema
  .omit({ agb: true, webseite: true })
  .extend({
    buchungId: z.string().min(1),
    email: emailFreiwillig,
    lfaNummer: z.string().trim().max(40).optional().default(""),
    fahrlehrerId: z.string().trim().optional().default(""),
  });

export const lfaSchema = z.object({
  buchungId: z.string().min(1),
  lfaNummer: z.string().trim().max(40),
});
