import { einstellungenLesen } from "@/lib/einstellungen";

/**
 * Verfuegbarkeits-Ampel, Geschaeftsregel 2 aus PLAN.md.
 *
 *   frei = onlineLimit - Anzahl bestaetigter Buchungen
 *   frei >= 4  gruen  "Noch viele Plätze frei"
 *   frei 1-3   gelb   "Nur noch wenige Plätze frei"
 *   frei 0     rot    "Kurs ausgebucht", Anmelden-Button verschwindet
 *
 * Die Schwellen stehen in den Einstellungen und sind im Admin aenderbar.
 *
 * Nur CONFIRMED belegt einen Platz. Stornierte Buchungen geben ihren Platz
 * frei, Wartelisteneintraege haben nie einen belegt.
 */

export type AmpelZustand = "gruen" | "gelb" | "rot";

export type Verfuegbarkeit = {
  frei: number;
  belegt: number;
  /** Reservierte Plaetze aus offenen Wartelisten-Einladungen. */
  reserviert: number;
  limit: number;
  zustand: AmpelZustand;
  text: string;
  /** Geschaeftsregel 2: bei 0 freien Plaetzen verschwindet der Button. */
  buchbar: boolean;
};

export type AmpelSchwellen = { gruen: number; gelb: number };

export async function ampelSchwellenLesen(): Promise<AmpelSchwellen> {
  const werte = await einstellungenLesen();
  return {
    gruen: Number(werte["ampel.schwelleGruen"]) || 4,
    gelb: Number(werte["ampel.schwelleGelb"]) || 1,
  };
}

/**
 * Reine Rechnung, damit sie ohne Datenbank und ohne Einstellungen pruefbar
 * bleibt. Die Aufrufer holen die Schwellen einmal und reichen sie durch.
 *
 * @param offeneEinladungen Wartelisten-Einladungen, deren Frist noch laeuft.
 *   Sie belegen einen Platz wie eine Buchung. Ohne das koennte ein beliebiger
 *   Besucher der Website den Platz nehmen, bevor die eingeladene Person ihre
 *   Mail ueberhaupt gelesen hat — und die Einladung waere ein Versprechen, das
 *   die Fahrschule nicht halten kann. Laeuft die Frist ab, faellt der Wert von
 *   selbst weg; abgelaufene Einladungen zaehlt der Aufrufer gar nicht erst mit.
 */
export function verfuegbarkeitBerechnen(
  limit: number,
  bestaetigteBuchungen: number,
  schwellen: AmpelSchwellen,
  offeneEinladungen = 0,
): Verfuegbarkeit {
  const frei = Math.max(0, limit - bestaetigteBuchungen - offeneEinladungen);
  const gemeinsam = {
    belegt: bestaetigteBuchungen,
    reserviert: offeneEinladungen,
    limit,
  };

  if (frei <= 0) {
    return {
      ...gemeinsam,
      frei: 0,
      zustand: "rot",
      text: "Kurs ausgebucht",
      buchbar: false,
    };
  }

  if (frei >= schwellen.gruen) {
    return {
      ...gemeinsam,
      frei,
      zustand: "gruen",
      text: "Noch viele Plätze frei",
      buchbar: true,
    };
  }

  return {
    ...gemeinsam,
    frei,
    zustand: "gelb",
    text: "Nur noch wenige Plätze frei",
    buchbar: true,
  };
}
