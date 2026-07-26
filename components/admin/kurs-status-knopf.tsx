"use client";

import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  kursVeroeffentlichenAktion,
  kursZurueckziehenAktion,
  type StatusErgebnis,
} from "@/app/admin/kurse/aktionen";

/**
 * Veroeffentlichen oder zurueckziehen.
 *
 * Eigene Komponente, weil beides eine Rueckmeldung braucht: ein Entwurf ohne
 * Termine laesst sich nicht veroeffentlichen, und das muss dastehen statt
 * stillschweigend nichts zu tun.
 */
export function KursStatusKnopf({
  kursId,
  veroeffentlicht,
}: {
  kursId: string;
  veroeffentlicht: boolean;
}) {
  const [ergebnis, absenden, laeuft] = useActionState<StatusErgebnis, FormData>(
    veroeffentlicht ? kursZurueckziehenAktion : kursVeroeffentlichenAktion,
    null,
  );

  return (
    <>
      <form action={absenden}>
        <input type="hidden" name="kursId" value={kursId} />
        <Button
          type="submit"
          variant={veroeffentlicht ? "outline" : "default"}
          disabled={laeuft}
        >
          {veroeffentlicht ? (
            <>
              <EyeOff aria-hidden="true" className="size-4" />
              Zurückziehen
            </>
          ) : (
            <>
              <Eye aria-hidden="true" className="size-4" />
              Veröffentlichen
            </>
          )}
        </Button>
      </form>

      {ergebnis?.fehler ? (
        <Alert variant="destructive" className="basis-full">
          <AlertDescription>{ergebnis.fehler}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
