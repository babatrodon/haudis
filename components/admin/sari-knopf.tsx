"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SARI-Knopf.
 *
 * Er tut genau zwei Dinge: die Ausweisnummer in die Zwischenablage legen und
 * das Portal der asa oeffnen. Mehr geht nicht — SARI hat keine Schnittstelle
 * und keine Verknuepfung pro Kurs, eingetragen wird dort von Hand.
 *
 * Deshalb sagt die Rueckmeldung auch nur, dass die Nummer kopiert ist. Ein
 * "Eingetragen" oder ein gruener Haken waere eine Behauptung ueber etwas, das
 * diese Anwendung nicht wissen kann; wer sich darauf verliesse, verpasste die
 * 24-Stunden-Frist im Glauben, es sei erledigt. Was in SARI wirklich passiert
 * ist, vermerkt Ausilia auf der Kursseite selbst.
 */

const SARI_PORTAL = "https://www.vku-pgs.asa.ch";

export function SariKnopf({
  lfaNummer,
  name,
}: {
  lfaNummer: string | null;
  name: string;
}) {
  const [meldung, setMeldung] = useState("");

  if (!lfaNummer) {
    return (
      <Button variant="outline" size="sm" disabled title="Ohne Ausweisnummer nicht möglich">
        SARI
      </Button>
    );
  }

  async function oeffnen() {
    let kopiert = false;
    try {
      await navigator.clipboard.writeText(lfaNummer as string);
      kopiert = true;
    } catch {
      // Ohne sicheren Kontext oder ohne Berechtigung gibt es keine
      // Zwischenablage. Dann bleibt die Nummer sichtbar stehen, damit sie von
      // Hand uebernommen werden kann, statt still zu scheitern.
      kopiert = false;
    }

    setMeldung(
      kopiert
        ? `${lfaNummer} kopiert`
        : `Bitte selbst kopieren: ${lfaNummer}`,
    );
    window.open(SARI_PORTAL, "_blank", "noopener,noreferrer");
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={oeffnen}
        aria-label={`Ausweisnummer von ${name} kopieren und SARI öffnen`}
      >
        SARI
        <ExternalLink aria-hidden="true" className="size-4" />
      </Button>
      {meldung ? (
        <span role="status" className="text-sm tabular-nums text-muted-foreground">
          {meldung}
        </span>
      ) : null}
    </span>
  );
}
