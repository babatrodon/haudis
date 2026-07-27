"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  wabLaufAktion,
  type SchuelerMeldung,
} from "@/app/admin/schueler/aktionen";

/**
 * Loest den WAB-Lauf von Hand aus.
 *
 * Der Lauf ist monatlich, aber niemand wartet auf den Monatswechsel, um zu
 * sehen ob er funktioniert. Der Knopf tut genau dasselbe wie der Cron.
 *
 * Ohne Versandschluessel steht das vorher da und nicht erst hinterher: wer hier
 * drueckt, loest sonst einen Lauf aus, der Personen als benachrichtigt
 * markiert, ohne dass eine Mail rausgeht.
 */
export function WabLaufKnopf({ versandAktiv }: { versandAktiv: boolean }) {
  const [meldung, ausloesen, laeuft] = useActionState<
    SchuelerMeldung,
    FormData
  >(wabLaufAktion, null);

  return (
    <div>
      <form action={ausloesen}>
        <Button type="submit" variant="outline" disabled={laeuft}>
          <Send aria-hidden="true" className="size-4" />
          {laeuft ? "Läuft …" : "Erinnerungen jetzt verschicken"}
        </Button>
      </form>

      {!versandAktiv ? (
        <p className="mt-2 max-w-prose text-sm font-medium text-ampel-rot">
          Es ist kein Versandschlüssel gesetzt. Der Lauf markiert die Personen
          als angeschrieben, aber es geht keine E-Mail raus — sie müssen
          angerufen werden.
        </p>
      ) : null}

      {meldung ? (
        <Alert
          variant={"fehler" in meldung ? "destructive" : "default"}
          className="mt-3"
        >
          <AlertDescription>
            {"fehler" in meldung ? meldung.fehler : meldung.erledigt}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
