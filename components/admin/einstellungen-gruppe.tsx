"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  einstellungenSpeichernAktion,
  type EinstellungenMeldung,
} from "@/app/admin/einstellungen/aktionen";
import { META, type Gruppe } from "@/lib/admin/einstellungen-meta";

/**
 * Eine Gruppe von Einstellungen mit eigenem Speicherknopf.
 *
 * Gruppenweise statt alles auf einmal: so bleibt der Weg vom Aendern zum
 * Speichern kurz, und ein halb getippter Wert in einer anderen Gruppe wandert
 * nicht mit in die Datenbank.
 */
export function EinstellungenGruppe({
  gruppe,
  werte,
}: {
  gruppe: Gruppe;
  werte: Record<string, string>;
}) {
  const [ergebnis, speichern, laeuft] = useActionState<
    EinstellungenMeldung,
    FormData
  >(einstellungenSpeichernAktion, null);

  return (
    <section
      aria-labelledby={`gruppe-${gruppe.id}`}
      className="border border-border bg-card p-4 sm:p-5"
    >
      <h2 id={`gruppe-${gruppe.id}`} className="font-heading text-lg font-bold">
        {gruppe.titel}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{gruppe.beschreibung}</p>

      <form action={speichern} className="mt-4 flex flex-col gap-5">
        <input type="hidden" name="gruppe" value={gruppe.id} />

        {ergebnis && "fehler" in ergebnis ? (
          <Alert variant="destructive">
            <AlertDescription>{ergebnis.fehler}</AlertDescription>
          </Alert>
        ) : null}
        {ergebnis && "erledigt" in ergebnis ? (
          <Alert>
            <AlertDescription>{ergebnis.erledigt}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          {gruppe.schluessel.map((schluessel) => {
            const meta = META[schluessel] ?? {
              beschriftung: schluessel,
              typ: "text" as const,
            };
            const wert = werte[schluessel] ?? "";
            const id = `feld-${schluessel}`;

            if (meta.typ === "schalter") {
              return (
                <div
                  key={schluessel}
                  className="flex items-start gap-3 sm:col-span-2"
                >
                  {/* Merker, damit die Action ein fehlendes Haekchen als
                      "false" liest und nicht als "unveraendert". */}
                  <input
                    type="hidden"
                    name={`${schluessel}__schalter`}
                    value="1"
                  />
                  <input
                    id={id}
                    name={schluessel}
                    type="checkbox"
                    defaultChecked={wert.toLowerCase() === "true"}
                    className="mt-1 size-5 shrink-0 accent-brand-schwarz"
                  />
                  <div>
                    <Label htmlFor={id} className="font-normal">
                      {meta.beschriftung}
                    </Label>
                    {meta.hinweis ? (
                      <p className="text-sm text-muted-foreground">
                        {meta.hinweis}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            }

            if (meta.typ === "lang") {
              return (
                <div key={schluessel} className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor={id}>{meta.beschriftung}</Label>
                  <Textarea
                    id={id}
                    name={schluessel}
                    defaultValue={wert}
                    rows={2}
                  />
                  {meta.hinweis ? (
                    <p className="text-sm text-muted-foreground">{meta.hinweis}</p>
                  ) : null}
                </div>
              );
            }

            return (
              <div key={schluessel} className="flex flex-col gap-2">
                <Label htmlFor={id}>{meta.beschriftung}</Label>
                <Input
                  id={id}
                  name={schluessel}
                  defaultValue={wert}
                  inputMode={
                    meta.typ === "zahl" || meta.typ === "betrag"
                      ? "decimal"
                      : undefined
                  }
                  className={
                    meta.typ === "zahl" || meta.typ === "betrag"
                      ? "tabular-nums"
                      : undefined
                  }
                />
                {meta.hinweis ? (
                  <p className="text-sm text-muted-foreground">{meta.hinweis}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div>
          <Button type="submit" disabled={laeuft}>
            {laeuft ? "Wird gespeichert ..." : `${gruppe.titel} speichern`}
          </Button>
        </div>
      </form>
    </section>
  );
}
