import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Basis } from "@/lib/abrechnung";
import type { InstruktorAuswahl } from "@/lib/instruktoren";

/**
 * Zeitraum, Basis und wahlweise Fahrlehrer.
 *
 * Gewoehnliches GET-Formular: der Stand steht danach in der Adresse, laesst
 * sich als Lesezeichen ablegen und weitergeben. Wer eine Abrechnung noch
 * einmal ziehen will, ruft dieselbe Adresse auf und bekommt dieselben Zahlen.
 */
export function ZeitraumFilter({
  von,
  bis,
  basis,
  instruktoren,
  instruktorId,
  ziel,
}: {
  von: string;
  bis: string;
  basis: Basis;
  /** Weggelassen im Portal: dort gibt es nur die eigenen Zahlen. */
  instruktoren?: InstruktorAuswahl[];
  instruktorId?: string;
  ziel: string;
}) {
  const auswahlStil =
    "h-12 w-full border border-input bg-card px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <form
      method="get"
      action={ziel}
      className="mb-6 flex flex-wrap items-end gap-3"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="von">Von</Label>
        <Input id="von" name="von" type="date" defaultValue={von} className="w-44" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bis">Bis</Label>
        <Input id="bis" name="bis" type="date" defaultValue={bis} className="w-44" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="basis">Zeitraum nach</Label>
        <select
          id="basis"
          name="basis"
          defaultValue={basis}
          className={`${auswahlStil} w-48`}
        >
          <option value="anmeldung">Anmeldedatum</option>
          <option value="kurs">Kursdatum</option>
        </select>
      </div>

      {instruktoren ? (
        <div className="flex min-w-56 flex-1 flex-col gap-2">
          <Label htmlFor="fahrlehrer">Fahrlehrer</Label>
          <select
            id="fahrlehrer"
            name="fahrlehrer"
            defaultValue={instruktorId ?? ""}
            className={auswahlStil}
          >
            <option value="">Alle</option>
            {instruktoren.map((eintrag) => (
              <option key={eintrag.id} value={eintrag.id}>
                {eintrag.anzeige}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <Button type="submit">
        <Search aria-hidden="true" className="size-4" />
        Anzeigen
      </Button>
    </form>
  );
}
