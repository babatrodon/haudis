"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { GRUPPEN } from "@/lib/admin/einstellungen-meta";
import { requireRole } from "@/lib/auth-guard";
import { EINSTELLUNG_DEFAULTS } from "@/lib/einstellungen-defaults";
import type { EinstellungSchluessel } from "@/lib/einstellungen-defaults";

/**
 * Einstellungen speichern.
 *
 * Gespeichert wird gruppenweise, nicht alles auf einmal: wer die Ampel
 * anpasst, soll nicht versehentlich einen halb getippten Preis mitschreiben.
 *
 * Nach dem Speichern wird die oeffentliche Seite neu erzeugt. Ohne das zeigte
 * sie bis zu eine Stunde den alten Preis oder die alte Telefonnummer, weil das
 * Layout unter app/(public) auf revalidate = 3600 steht — und genau dann ruft
 * jemand die alte Nummer an.
 */

export type EinstellungenMeldung =
  | { fehler: string }
  | { erledigt: string }
  | null;

function istSchluessel(wert: string): wert is EinstellungSchluessel {
  return wert in EINSTELLUNG_DEFAULTS;
}

export async function einstellungenSpeichernAktion(
  _bisher: EinstellungenMeldung,
  formular: FormData,
): Promise<EinstellungenMeldung> {
  await requireRole("ADMIN");

  const gruppenId = String(formular.get("gruppe") ?? "");
  const gruppe = GRUPPEN.find((eintrag) => eintrag.id === gruppenId);
  if (!gruppe) return { fehler: "Unbekannte Gruppe." };

  const zuSchreiben: { key: EinstellungSchluessel; value: string }[] = [];

  for (const schluessel of gruppe.schluessel) {
    if (!istSchluessel(schluessel)) continue;

    // Schalter senden nichts, wenn sie aus sind. Ein fehlendes Feld heisst
    // deshalb "false" und nicht "unveraendert".
    const roh = formular.get(schluessel);
    const wert =
      formular.get(`${schluessel}__schalter`) === "1"
        ? roh === "on" || roh === "true"
          ? "true"
          : "false"
        : String(roh ?? "").trim();

    zuSchreiben.push({ key: schluessel, value: wert });
  }

  await prisma.$transaction(
    zuSchreiben.map((eintrag) =>
      prisma.setting.upsert({
        where: { key: eintrag.key },
        update: { value: eintrag.value },
        create: { key: eintrag.key, value: eintrag.value },
      }),
    ),
  );

  revalidatePath("/admin/einstellungen");
  revalidatePath("/", "layout");

  return {
    erledigt: `${gruppe.titel} gespeichert. Die Website zeigt den neuen Stand sofort.`,
  };
}
