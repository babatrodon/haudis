"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  instruktorAktivAktion,
  provisionAktion,
  type KontoMeldung,
} from "@/app/admin/fahrlehrer/aktionen";

/**
 * Provisionssatz und Profilstatus.
 *
 * Der Satz gilt pro zugewiesener Buchung (Geschaeftsregel 5, Default CHF 50)
 * und ist die Grundlage der Abrechnung in Sprint 5. Er wird als Zeichenkette
 * gespeichert und nie durch Number gerechnet.
 */
export function ProvisionFeld({
  instruktorId,
  provision,
  aktiv,
}: {
  instruktorId: string;
  provision: string;
  aktiv: boolean;
}) {
  const id = useId();
  const [ergebnis, speichern, laeuft] = useActionState<KontoMeldung, FormData>(
    provisionAktion,
    null,
  );
  const [, aktivSetzen, aktivLaeuft] = useActionState<KontoMeldung, FormData>(
    instruktorAktivAktion,
    null,
  );

  return (
    <>
      <form action={speichern} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="instruktorId" value={instruktorId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id} className="text-xs uppercase tracking-wide text-muted-foreground">
            Provision je Buchung
          </Label>
          <Input
            id={id}
            name="provision"
            defaultValue={provision}
            inputMode="decimal"
            className="w-28 tabular-nums"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={laeuft}>
          Speichern
        </Button>
      </form>

      <form action={aktivSetzen}>
        <input type="hidden" name="instruktorId" value={instruktorId} />
        <input type="hidden" name="aktiv" value={aktiv ? "false" : "true"} />
        <Button type="submit" variant="ghost" size="sm" disabled={aktivLaeuft}>
          {aktiv ? "Profil deaktivieren" : "Profil aktivieren"}
        </Button>
      </form>

      {ergebnis && "fehler" in ergebnis ? (
        <p className="basis-full text-sm text-destructive">{ergebnis.fehler}</p>
      ) : null}
    </>
  );
}
