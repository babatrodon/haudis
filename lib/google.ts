import { einstellungenLesen } from "@/lib/einstellungen";

/**
 * Links und Daten rund um das Google Business Profile.
 *
 * Alles wird aus der Place ID und den Koordinaten gebaut, die in den
 * Einstellungen stehen. Kein API-Schlüssel, kein Skript von Google, keine
 * Anfrage an Google beim Seitenaufruf: die Seite bleibt frei von
 * Drittanbieter-Requests, und Google muss nicht als Auftragsverarbeiter in die
 * Datenschutzerklärung.
 */

export type GoogleProfil = {
  /** Kartenposition, für den Button "Route planen". */
  routeUrl: string;
  /** Das Profil mit allen Bewertungen. */
  profilUrl: string;
  /** Formular "Bewertung schreiben". */
  bewertungSchreibenUrl: string;
  /** Durchschnitt, null wenn nicht gepflegt. */
  bewertung: number | null;
  /** Anzahl Bewertungen, null wenn nicht gepflegt. */
  anzahlBewertungen: number | null;
  zitate: GoogleZitat[];
};

export type GoogleZitat = {
  name: string;
  sterne: number;
  text: string;
  datum?: string;
};

export async function googleProfilLesen(): Promise<GoogleProfil> {
  const werte = await einstellungenLesen();
  const placeId = werte["google.placeId"].trim();
  const breite = werte["geo.breitengrad"].trim();
  const laenge = werte["geo.laengengrad"].trim();

  return {
    // Zielkoordinaten statt Adresstext: die Navigation landet damit exakt am
    // Gebäude und nicht an einer ähnlich lautenden Strasse.
    routeUrl: `https://www.google.com/maps/dir/?api=1&destination=${breite},${laenge}`,
    profilUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    bewertungSchreibenUrl: `https://search.google.com/local/writereview?placeid=${placeId}`,
    bewertung: zahlOderNull(werte["google.bewertung"]),
    anzahlBewertungen: zahlOderNull(werte["google.anzahlBewertungen"]),
    zitate: zitateLesen(werte["google.zitate"]),
  };
}

function zahlOderNull(roh: string): number | null {
  const wert = roh.trim();
  if (wert === "") {
    return null;
  }
  const zahl = Number(wert);
  return Number.isFinite(zahl) ? zahl : null;
}

/**
 * Liest die optionalen Zitate. Fehlerhaftes JSON fuehrt zu einer leeren Liste
 * statt zu einem Absturz: eine kaputte Einstellung darf die Startseite nicht
 * abschiessen.
 */
function zitateLesen(roh: string): GoogleZitat[] {
  const wert = roh.trim();
  if (wert === "") {
    return [];
  }

  try {
    const geparst: unknown = JSON.parse(wert);
    if (!Array.isArray(geparst)) {
      return [];
    }
    return geparst.filter(istZitat);
  } catch {
    return [];
  }
}

function istZitat(kandidat: unknown): kandidat is GoogleZitat {
  if (typeof kandidat !== "object" || kandidat === null) {
    return false;
  }
  const zitat = kandidat as Record<string, unknown>;
  return (
    typeof zitat.name === "string" &&
    typeof zitat.text === "string" &&
    typeof zitat.sterne === "number"
  );
}
