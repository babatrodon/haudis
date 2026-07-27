"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  pruefungEintragenAktion,
  type SchuelerMeldung,
} from "@/app/admin/schueler/aktionen";

/**
 * Bestandene praktische Pruefung eintragen, aus dem Portal.
 *
 * Der Fahrlehrer erfaehrt es als Erster — meistens noch am Pruefungstag.
 * Deshalb steht das Feld hier und nicht nur im Panel: je frueher das Datum
 * drin ist, desto verlaesslicher laeuft die WAB-Erinnerung elf Monate spaeter.
 *
 * Die Action prueft serverseitig, dass dieser Schueler dem angemeldeten
 * Fahrlehrer zugewiesen ist. Das `portal`-Feld hier ist nur die Ansage, unter
 * welcher Regel gepruefte werden soll.
 */
export function PruefungEintragen({
  studentId,
  pruefungAm,
}: {
  studentId: string;
  pruefungAm: Date | null;
}) {
  const [meldung, eintragen, laeuft] = useActionState<
    SchuelerMeldung,
    FormData
  >(pruefungEintragenAktion, null);

  return (
    <div>
      <form action={eintragen} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="studentId" value={studentId} />
        <input type="hidden" name="portal" value="true" />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`pruefung-${studentId}`}
            className="text-sm font-medium"
          >
            Praktische Prüfung bestanden am
          </label>
          <Input
            id={`pruefung-${studentId}`}
            name="pruefungAm"
            type="date"
            defaultValue={
              pruefungAm ? pruefungAm.toISOString().slice(0, 10) : ""
            }
            className="w-44"
          />
        </div>
        <Button type="submit" variant="outline" disabled={laeuft}>
          {laeuft ? "Speichert …" : "Speichern"}
        </Button>
      </form>

      {meldung ? (
        <Alert
          variant={"fehler" in meldung ? "destructive" : "default"}
          className="mt-2"
        >
          <AlertDescription>
            {"fehler" in meldung ? meldung.fehler : meldung.erledigt}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
