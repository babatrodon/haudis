import { z } from "zod";

/**
 * Validierung der Anmeldung. Eine Fassung fuer Browser und Server.
 *
 * react-hook-form nutzt dieses Schema fuer die sofortige Rueckmeldung im
 * Formular, die Server Action prueft damit erneut. Zwei getrennte Fassungen
 * derselben Regeln laufen frueher oder spaeter auseinander, und dann gilt im
 * Zweifel die schwaechere.
 *
 * Geschaeftsregel 1 aus PLAN.md: genau diese Felder. Kein Kanton-Feld, kein
 * Konto, kein Passwort. Telefon und E-Mail sind Pflicht.
 */

/** Aelteste plausible anmeldende Person. */
const MAX_ALTER_JAHRE = 100;

const pflicht = (feld: string) => `${feld} ausfüllen`;

/**
 * Schweizer Postleitzahlen sind vierstellig und beginnen nicht mit 0.
 * Bewusst keine Pruefung gegen ein Ortsverzeichnis: eine falsch getippte PLZ
 * faellt der Admin auf, eine abgewiesene gueltige Anmeldung kostet einen Platz.
 */
const plzSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{3}$/, "Vierstellige Postleitzahl eingeben");

/**
 * Telefonnummern kommen in allen Schreibweisen: 079 604 44 44, 0796044444,
 * +41 79 604 44 44. Geprueft wird die Ziffernzahl, nicht die Formatierung.
 * Wer eine gueltige Nummer wegen eines Leerzeichens nicht eingeben kann,
 * ruft nicht an, sondern geht.
 */
export const telefonSchema = z
  .string()
  .trim()
  .min(1, pflicht("Telefonnummer"))
  .refine(
    (wert) => {
      const ziffern = wert.replace(/[^\d]/g, "");
      return ziffern.length >= 9 && ziffern.length <= 13;
    },
    { message: "Telefonnummer prüfen, zum Beispiel 079 604 44 44" },
  );

/**
 * Das Geburtsdatum kommt aus einem date-Feld, also als "2008-03-12".
 * Geprueft wird nur auf Plausibilitaet, nicht auf ein Mindestalter: welches
 * Alter eine Kursart verlangt, entscheidet die Fahrschule, nicht das Formular.
 */
const geburtsdatumSchema = z
  .string()
  .min(1, pflicht("Geburtsdatum"))
  .refine((wert) => !Number.isNaN(Date.parse(wert)), "Gültiges Datum eingeben")
  .refine((wert) => {
    const datum = new Date(wert);
    const heute = new Date();
    const aeltesteMoeglich = new Date();
    aeltesteMoeglich.setFullYear(heute.getFullYear() - MAX_ALTER_JAHRE);
    return datum <= heute && datum >= aeltesteMoeglich;
  }, "Geburtsdatum prüfen");

export const buchungSchema = z.object({
  anrede: z.enum(["Frau", "Herr"], { message: "Anrede wählen" }),
  nachname: z.string().trim().min(1, pflicht("Nachname")).max(80),
  vorname: z.string().trim().min(1, pflicht("Vorname")).max(80),
  strasse: z.string().trim().min(1, pflicht("Strasse")).max(120),
  plz: plzSchema,
  ort: z.string().trim().min(1, pflicht("Ort")).max(80),
  geburtsdatum: geburtsdatumSchema,
  telefon: telefonSchema,
  email: z
    .string()
    .trim()
    .min(1, pflicht("E-Mail-Adresse"))
    .email("E-Mail-Adresse prüfen")
    .max(160),
  agb: z.literal(true, { message: "Bitte die AGB akzeptieren" }),
  /**
   * Honigtopf. Fuer Menschen unsichtbar, deshalb bleibt das Feld leer.
   *
   * Bewusst OHNE Laengenbegrenzung: waere hier max(0) hinterlegt, wuerde Zod
   * die Eingabe abweisen und die Action zeigte eine Fehlermeldung. Ein Bot
   * lernte daraus, dass an diesem Feld etwas haengt, und liesse es beim
   * naechsten Versuch weg. Die Entscheidung faellt deshalb in der Action, die
   * nach aussen Erfolg meldet und trotzdem nichts speichert.
   */
  webseite: z.string().optional(),
});

export type BuchungEingabe = z.infer<typeof buchungSchema>;

/**
 * Warteliste eines ausgebuchten Kurses.
 *
 * Nur die vier Felder, die es braucht, um jemanden zu erreichen. Adresse und
 * Geburtsdatum fragt niemand ab, solange gar kein Platz da ist — das waeren
 * Daten auf Vorrat, und wer den Platz nimmt, gibt sie ohnehin im
 * Anmeldeformular an.
 *
 * E-Mail ist hier Pflicht, anders als auf der Buchung: der ganze Zweck des
 * Eintrags ist die Benachrichtigung.
 */
export const wartelisteSchema = z.object({
  vorname: z.string().trim().min(1, pflicht("Vorname")).max(80),
  nachname: z.string().trim().min(1, pflicht("Nachname")).max(80),
  telefon: telefonSchema,
  email: z
    .string()
    .trim()
    .min(1, pflicht("E-Mail-Adresse"))
    .email("E-Mail-Adresse prüfen")
    .max(160),
  /** Honigtopf, siehe buchungSchema. */
  webseite: z.string().optional(),
});

export type WartelisteEingabe = z.infer<typeof wartelisteSchema>;

/**
 * Schritt 2. Beides freiwillig, deshalb darf hier nichts blockieren.
 * Die Handynummer wird nur verlangt, wenn die Erinnerung gewuenscht ist.
 */
export const ergaenzungSchema = z
  .object({
    lfaNummer: z.string().trim().max(40).optional().or(z.literal("")),
    smsErinnerung: z.boolean().optional(),
    smsTelefon: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .refine(
    (daten) =>
      !daten.smsErinnerung ||
      (daten.smsTelefon ?? "").replace(/[^\d]/g, "").length >= 9,
    {
      path: ["smsTelefon"],
      message: "Für die Erinnerung brauchen wir eine Handynummer",
    },
  );

export type ErgaenzungEingabe = z.infer<typeof ergaenzungSchema>;
