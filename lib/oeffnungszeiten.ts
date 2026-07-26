import { einstellungenLesen } from "@/lib/einstellungen";

/**
 * Öffnungszeiten, von der Kundin bestätigt: Montag bis Samstag 07:00 bis 21:00,
 * Sonntag geschlossen.
 *
 * Die Einstellung haelt die Tage im schema.org-Kuerzel ("Mo-Sa"). Anzeige und
 * strukturierte Daten entstehen daraus, damit eine Aenderung im Admin beides
 * gleichzeitig richtigstellt.
 */

const TAG_NAMEN: Record<string, string> = {
  Mo: "Montag",
  Tu: "Dienstag",
  We: "Mittwoch",
  Th: "Donnerstag",
  Fr: "Freitag",
  Sa: "Samstag",
  Su: "Sonntag",
};

export type Oeffnungszeiten = {
  /** "Montag bis Samstag" */
  tageLang: string;
  /** "07:00" */
  von: string;
  /** "21:00" */
  bis: string;
  /** "Sonntag geschlossen", leer wenn nicht gepflegt. */
  hinweis: string;
  /** "Montag bis Samstag, 07:00 bis 21:00 Uhr" */
  anzeige: string;
  /** schema.org openingHours, zum Beispiel "Mo-Sa 07:00-21:00". */
  schemaOrg: string;
};

export async function oeffnungszeitenLesen(): Promise<Oeffnungszeiten> {
  const werte = await einstellungenLesen();
  const tage = werte["oeffnungszeiten.tage"].trim();
  const von = werte["oeffnungszeiten.von"].trim();
  const bis = werte["oeffnungszeiten.bis"].trim();
  const hinweis = werte["oeffnungszeiten.hinweis"].trim();
  const tageLang = tageAusschreiben(tage);

  return {
    tageLang,
    von,
    bis,
    hinweis,
    anzeige: `${tageLang}, ${von} bis ${bis} Uhr`,
    schemaOrg: `${tage} ${von}-${bis}`,
  };
}

/** "Mo-Sa" wird zu "Montag bis Samstag", "Mo" bleibt "Montag". */
function tageAusschreiben(tage: string): string {
  const [von, bis] = tage.split("-");
  const vonLang = TAG_NAMEN[von] ?? von;
  if (!bis) {
    return vonLang;
  }
  return `${vonLang} bis ${TAG_NAMEN[bis] ?? bis}`;
}
