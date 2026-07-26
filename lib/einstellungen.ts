import { cache } from "react";
import { prisma } from "@/lib/db";
import {
  EINSTELLUNG_DEFAULTS,
  type EinstellungSchluessel,
} from "@/lib/einstellungen-defaults";

/**
 * Liest die Einstellungen aus der Datenbank und faellt auf die Startwerte in
 * lib/einstellungen-defaults.ts zurueck.
 *
 * Damit funktioniert die Anwendung auch, bevor der Seed gelaufen ist oder wenn
 * die Admin einen Schluessel geloescht hat. Ein neuer Schluessel wird im Code
 * definiert und ist sofort nutzbar, auch ohne Migration.
 *
 * cache() sorgt dafuer, dass pro Anfrage nur einmal gelesen wird, egal wie
 * viele Server Components die Werte brauchen.
 */

export type Einstellungen = Record<EinstellungSchluessel, string>;

export const einstellungenLesen = cache(async (): Promise<Einstellungen> => {
  const zeilen = await prisma.setting.findMany();

  const werte: Einstellungen = { ...EINSTELLUNG_DEFAULTS };
  for (const zeile of zeilen) {
    // Nur bekannte Schluessel uebernehmen. Ein Altbestand in der Tabelle soll
    // nicht als Einstellung durchschlagen.
    if (zeile.key in werte) {
      werte[zeile.key as EinstellungSchluessel] = zeile.value;
    }
  }
  return werte;
});

export async function einstellung(
  schluessel: EinstellungSchluessel,
): Promise<string> {
  return (await einstellungenLesen())[schluessel];
}

/** Leere Werte gelten als "nicht gesetzt", etwa bei den offenen TBD-Preisen. */
export async function einstellungZahl(
  schluessel: EinstellungSchluessel,
): Promise<number | null> {
  const roh = (await einstellung(schluessel)).trim();
  if (roh === "") {
    return null;
  }
  const zahl = Number(roh);
  return Number.isFinite(zahl) ? zahl : null;
}

export async function einstellungJa(
  schluessel: EinstellungSchluessel,
): Promise<boolean> {
  return (await einstellung(schluessel)).trim().toLowerCase() === "true";
}

/**
 * Baut einen wa.me-Link mit vorbefuelltem Text.
 * Der Text steht als Klartext in den Einstellungen, kodiert wird erst hier.
 */
export async function whatsappLink(
  textSchluessel: Extract<EinstellungSchluessel, `whatsapp.text.${string}`>,
): Promise<string> {
  const werte = await einstellungenLesen();
  return `https://wa.me/${werte["whatsapp.nummer"]}?text=${encodeURIComponent(werte[textSchluessel])}`;
}
