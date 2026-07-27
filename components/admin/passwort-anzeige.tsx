"use client";

import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Das Startpasswort, einmalig.
 *
 * Gespeichert wird nur der Hash; dieser Text hier ist die einzige Gelegenheit,
 * das Passwort zu sehen. Ausilia legt 36 Konten an, und jedes verlorene
 * Passwort bedeutet Zuruecksetzen und ein zweites Telefonat.
 *
 * Deshalb: gross gesetzt, in Schreibmaschinenschrift, damit sich Null und O
 * nicht verwechseln lassen (die Erzeugung meidet solche Zeichen ohnehin), mit
 * Kopierknopf und mit dem Satz, dass es nicht wieder erscheint. Der gelbe
 * Rahmen ist hier am Platz: das ist der eine Moment im Panel, in dem etwas
 * verloren gehen kann.
 */
export function PasswortAnzeige({
  passwort,
  name,
  onFertig,
}: {
  passwort: string;
  name: string;
  onFertig: () => void;
}) {
  const [kopiert, setKopiert] = useState(false);

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(passwort);
      setKopiert(true);
    } catch {
      // Ohne sicheren Kontext gibt es keine Zwischenablage. Das Passwort steht
      // sichtbar da und laesst sich von Hand uebernehmen.
      setKopiert(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-brand-gelb bg-ampel-gelb-bg p-4">
        <p className="flex items-center gap-2 font-heading font-bold">
          <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
          Jetzt notieren
        </p>
        <p className="mt-1 text-sm">
          Dieses Passwort wird <strong>nicht wieder angezeigt</strong>.
          Gespeichert ist nur eine verschlüsselte Fassung. Geht es verloren,
          muss es zurückgesetzt werden.
        </p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Startpasswort für {name}</p>
        <p
          // select-all: ein Fingertipp markiert alles, auch ohne Zwischenablage.
          className="mt-1 select-all break-all border border-border bg-card px-4 py-4 font-mono text-2xl font-bold tracking-wider sm:text-3xl"
        >
          {passwort}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={kopieren} variant="outline">
          {kopiert ? (
            <>
              <Check aria-hidden="true" className="size-4" />
              Kopiert
            </>
          ) : (
            <>
              <Copy aria-hidden="true" className="size-4" />
              Kopieren
            </>
          )}
        </Button>
        <span role="status" className="text-sm text-muted-foreground">
          {kopiert ? "In der Zwischenablage." : ""}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Beim ersten Login muss ein eigenes Passwort gesetzt werden. Bis dahin
        kommt niemand über dieses Konto in den geschützten Bereich.
      </p>

      <div className="flex justify-end">
        <Button type="button" onClick={onFertig}>
          Ich habe es notiert
        </Button>
      </div>
    </div>
  );
}
