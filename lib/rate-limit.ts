/**
 * Einfaches gleitendes Fenster pro Schluessel, im Arbeitsspeicher.
 *
 * WAS DAS LEISTET UND WAS NICHT
 *
 * Auf Vercel laeuft jede Serverless-Instanz mit eigenem Speicher. Dieser
 * Zaehler wirkt deshalb pro Instanz, nicht global. Wer gezielt viele parallele
 * Anfragen schickt, verteilt sich auf mehrere Instanzen und umgeht ihn zum
 * Teil.
 *
 * Das ist bewusst so gewaehlt: bei rund 30 Buchungen im Monat ist der
 * realistische Fall ein Bot oder ein doppelt geklickter Knopf, nicht ein
 * verteilter Angriff. Die beiden anderen Ebenen wirken instanzuebergreifend,
 * weil sie in der Datenbank sitzen:
 *
 *   - Honigtopf-Feld im Formular
 *   - Doppelbuchungsschutz: gleiche E-Mail, gleicher Kurs, 10 Minuten
 *
 * Wenn hier je echter Missbrauch auftritt, ist der naechste Schritt eine Regel
 * in der Vercel-Firewall (Konfiguration, kein Code) und nicht ein groesserer
 * Zaehler an dieser Stelle.
 */

type Fenster = { zeitpunkte: number[] };

const speicher = new Map<string, Fenster>();

/** Verhindert, dass die Map bei vielen verschiedenen IPs unbegrenzt waechst. */
const MAX_SCHLUESSEL = 5000;

export type RateLimitErgebnis = {
  erlaubt: boolean;
  /** Sekunden bis zum naechsten freien Versuch, 0 wenn erlaubt. */
  wartenSekunden: number;
};

export function rateLimit(
  schluessel: string,
  { maximum, fensterSekunden }: { maximum: number; fensterSekunden: number },
): RateLimitErgebnis {
  const jetzt = Date.now();
  const fensterMs = fensterSekunden * 1000;

  if (speicher.size > MAX_SCHLUESSEL) {
    speicher.clear();
  }

  const eintrag = speicher.get(schluessel) ?? { zeitpunkte: [] };
  const aktuell = eintrag.zeitpunkte.filter((z) => jetzt - z < fensterMs);

  if (aktuell.length >= maximum) {
    const aeltester = Math.min(...aktuell);
    return {
      erlaubt: false,
      wartenSekunden: Math.ceil((fensterMs - (jetzt - aeltester)) / 1000),
    };
  }

  aktuell.push(jetzt);
  speicher.set(schluessel, { zeitpunkte: aktuell });
  return { erlaubt: true, wartenSekunden: 0 };
}

/**
 * Ermittelt die Absender-IP hinter dem Vercel-Proxy.
 * x-forwarded-for kann eine Kette sein, die erste Adresse ist der Client.
 */
export function ipAusHeadern(headerListe: Headers): string {
  const weitergeleitet = headerListe.get("x-forwarded-for");
  if (weitergeleitet) {
    const erste = weitergeleitet.split(",")[0]?.trim();
    if (erste) {
      return erste;
    }
  }
  return headerListe.get("x-real-ip") ?? "unbekannt";
}
