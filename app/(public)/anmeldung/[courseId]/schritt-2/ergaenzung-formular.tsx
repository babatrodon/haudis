"use client";

import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ergaenzenAktion, type ErgaenzungErgebnis } from "../aktionen";

/**
 * Schritt 2. Beide Angaben sind freiwillig, deshalb steht der Weg zum
 * Ueberspringen gleichwertig neben dem Absenden. Die Anmeldung ist zu diesem
 * Zeitpunkt bereits gueltig.
 */
export function ErgaenzungFormular({
  kursId,
  smsMoeglich,
}: {
  kursId: string;
  /** Nur true, wenn die Einstellung sms.aktiv gesetzt ist. */
  smsMoeglich: boolean;
}) {
  const [ergebnis, absenden, laeuft] = useActionState<
    ErgaenzungErgebnis,
    FormData
  >(ergaenzenAktion, null);
  const [smsGewaehlt, setSmsGewaehlt] = useState(false);

  return (
    <form action={absenden} className="flex flex-col gap-6">
      <input type="hidden" name="kursId" value={kursId} />

      {ergebnis?.fehler ? (
        <Alert variant="destructive">
          <AlertDescription>{ergebnis.fehler}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="lfaNummer">Lernfahrausweis-Nummer</Label>
        <Input
          id="lfaNummer"
          name="lfaNummer"
          type="text"
          autoComplete="off"
          placeholder="zum Beispiel AG 123456"
        />
        <p className="text-sm text-muted-foreground">
          Freiwillig. Du kannst sie auch später nachreichen oder am ersten
          Kurstag mitbringen.
        </p>
      </div>

      {smsMoeglich ? (
        <div className="border border-border bg-flaeche-2 p-4">
          <div className="flex items-start gap-3">
            <input
              id="smsErinnerung"
              name="smsErinnerung"
              type="checkbox"
              checked={smsGewaehlt}
              onChange={(e) => setSmsGewaehlt(e.target.checked)}
              className="mt-1 size-5 shrink-0 accent-brand-schwarz"
            />
            <Label htmlFor="smsErinnerung" className="text-sm font-normal">
              Erinnere mich am Kurstag per SMS.
            </Label>
          </div>

          {smsGewaehlt ? (
            <div className="mt-4 flex flex-col gap-2">
              <Label htmlFor="smsTelefon">Handynummer für die Erinnerung</Label>
              <Input
                id="smsTelefon"
                name="smsTelefon"
                type="tel"
                autoComplete="tel"
                placeholder="079 123 45 67"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" disabled={laeuft} className="sm:flex-1">
          {laeuft ? "Wird gespeichert ..." : "Speichern und abschliessen"}
        </Button>
        <Button
          type="submit"
          name="ueberspringen"
          value="ja"
          size="lg"
          variant="outline"
          disabled={laeuft}
        >
          Überspringen
        </Button>
      </div>
    </form>
  );
}
