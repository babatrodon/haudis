"use client";

import { useActionState, useId } from "react";
import { UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  schuelerAnmeldenAktion,
  type AnmeldeMeldung,
} from "@/app/portal/anmelden/aktionen";
import type { KursAuswahl } from "@/components/admin/telefon-anmeldung";

/**
 * Schueler anmelden.
 *
 * Dieselben Pflichtfelder wie im Panel, mit zwei Unterschieden: es gibt keine
 * Fahrlehrer-Auswahl, weil der Angemeldete selbst zugewiesen wird, und die
 * Bestaetigung geht raus, sobald eine Adresse dasteht.
 *
 * Nach dem Absenden ist das Formular leer und bereit fuer die naechste Person.
 */
export function SchuelerFormular({
  kurse,
  kuerzel,
}: {
  kurse: KursAuswahl[];
  kuerzel: string;
}) {
  const [ergebnis, absenden, laeuft] = useActionState<AnmeldeMeldung, FormData>(
    schuelerAnmeldenAktion,
    null,
  );
  const erledigt = ergebnis !== null && "erledigt" in ergebnis;

  const auswahlStil =
    "h-12 w-full border border-input bg-card px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  if (kurse.length === 0) {
    return (
      <p className="border border-border bg-card p-5 text-muted-foreground">
        Zurzeit ist kein Kurs ausgeschrieben, für den eine Anmeldung möglich
        wäre.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ergebnis && "fehler" in ergebnis ? (
        <Alert variant="destructive">
          <AlertDescription>{ergebnis.fehler}</AlertDescription>
        </Alert>
      ) : null}
      {erledigt ? (
        <Alert>
          <AlertDescription>{ergebnis.erledigt}</AlertDescription>
        </Alert>
      ) : null}

      <form
        action={absenden}
        key={erledigt ? "leer" : "gefuellt"}
        className="flex flex-col gap-5 border border-border bg-card p-4 sm:p-5"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="kursId">Kurs</Label>
          <select
            id="kursId"
            name="kursId"
            required
            defaultValue=""
            className={auswahlStil}
          >
            <option value="" disabled>
              Bitte wählen
            </option>
            {kurse.map((kurs) => (
              <option key={kurs.id} value={kurs.id} disabled={kurs.frei === 0}>
                {kurs.beschriftung}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="anrede">Anrede</Label>
            <select
              id="anrede"
              name="anrede"
              required
              defaultValue="Frau"
              className={auswahlStil}
            >
              <option value="Frau">Frau</option>
              <option value="Herr">Herr</option>
            </select>
          </div>
          <Feld name="geburtsdatum" label="Geburtsdatum" type="date" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Feld name="nachname" label="Nachname" autoComplete="off" />
          <Feld name="vorname" label="Vorname" autoComplete="off" />
        </div>

        <Feld name="strasse" label="Strasse und Nummer" autoComplete="off" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Feld name="plz" label="PLZ" inputMode="numeric" maxLength={4} />
          <Feld name="ort" label="Ort" autoComplete="off" />
        </div>

        <Feld name="telefon" label="Telefon" type="tel" autoComplete="off" />
        <Feld
          name="email"
          label="E-Mail (freiwillig)"
          type="email"
          required={false}
          autoComplete="off"
          hinweis="Liegt eine Adresse vor, geht die Bestätigung automatisch raus."
        />
        <Feld
          name="lfaNummer"
          label="Ausweisnummer (freiwillig)"
          required={false}
          autoComplete="off"
        />

        <div className="border-t border-flaeche-3 pt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Die Anmeldung wird Dir zugewiesen ({kuerzel}) und erscheint in
            Deiner Provisionsabrechnung.
          </p>
          <Button type="submit" size="lg" disabled={laeuft}>
            <UserPlus aria-hidden="true" className="size-4" />
            {laeuft ? "Wird angelegt ..." : "Anmelden"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Feld({
  name,
  label,
  hinweis,
  type = "text",
  required = true,
  ...rest
}: {
  name: string;
  label: string;
  hinweis?: string;
  type?: string;
  required?: boolean;
} & React.ComponentProps<"input">) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required={required} {...rest} />
      {hinweis ? (
        <p className="text-sm text-muted-foreground">{hinweis}</p>
      ) : null}
    </div>
  );
}
