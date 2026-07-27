"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { datum } from "@/lib/format";
import { KATEGORIE_TEXT, STATUS_TEXT } from "@/lib/inhalte/lektionen";
import { cn } from "@/lib/utils";
import type { LektionZeile as Zeile } from "@/lib/admin/schueler";
import {
  lektionStatusAktion,
  type SchuelerMeldung,
} from "@/app/admin/schueler/aktionen";

/**
 * Eine Lektion mit den Knoepfen, die ihren Status setzen.
 *
 * Dieselbe Zeile im Panel und im Portal. Der Unterschied ist `portal`: damit
 * schraenkt die Action auf den angemeldeten Fahrlehrer ein und weist fremde
 * Lektionen ab. Die Knoepfe hier sind Bequemlichkeit, die Sperre sitzt auf dem
 * Server.
 */
export function LektionZeile({
  lektion,
  studentId,
  portal = false,
  zeigeInstruktor = true,
}: {
  lektion: Zeile;
  studentId: string;
  portal?: boolean;
  zeigeInstruktor?: boolean;
}) {
  const [meldung, setzen, laeuft] = useActionState<SchuelerMeldung, FormData>(
    lektionStatusAktion,
    null,
  );

  const stil: Record<Zeile["status"], string> = {
    GEPLANT: "bg-flaeche-2 text-grau-text border-flaeche-3",
    ABSOLVIERT: "bg-ampel-gruen-bg text-ampel-gruen border-ampel-gruen-linie",
    STORNIERT: "bg-flaeche-2 text-grau-text border-flaeche-3",
    NO_SHOW: "bg-ampel-rot-bg text-ampel-rot border-ampel-rot-linie",
  };

  /** Was von hier aus sinnvoll als Nächstes kommt. */
  const naechste: { status: Zeile["status"]; text: string }[] =
    lektion.status === "GEPLANT"
      ? [
          { status: "ABSOLVIERT", text: "Absolviert" },
          { status: "STORNIERT", text: "Storniert" },
          { status: "NO_SHOW", text: "Nicht erschienen" },
        ]
      : [{ status: "GEPLANT", text: "Zurücksetzen" }];

  return (
    <article className="border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-heading font-bold tabular-nums">
              {datum(lektion.datum)}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {lektion.startzeit} · {lektion.dauerMinuten} Min
            </span>
            <span
              className={cn(
                "inline-flex items-center border px-2 py-0.5 text-xs font-semibold",
                stil[lektion.status],
              )}
            >
              {STATUS_TEXT[lektion.status]}
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {KATEGORIE_TEXT[lektion.kategorie]}
            {zeigeInstruktor ? ` · ${lektion.instruktor}` : ""}
            {lektion.aboId ? " · auf Abo" : " · ohne Abo"}
          </p>
          {lektion.abholort ? (
            <p className="mt-1 text-sm">Abholung: {lektion.abholort}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {naechste.map((ziel) => (
            <form key={ziel.status} action={setzen}>
              <input type="hidden" name="lessonId" value={lektion.id} />
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="status" value={ziel.status} />
              {portal ? (
                <input type="hidden" name="portal" value="true" />
              ) : null}
              <Button
                type="submit"
                size="sm"
                variant={ziel.status === "ABSOLVIERT" ? "default" : "ghost"}
                disabled={laeuft}
              >
                {ziel.text}
              </Button>
            </form>
          ))}
        </div>
      </div>

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
    </article>
  );
}
