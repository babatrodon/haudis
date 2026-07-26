"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { anmeldenAktion, type AnmeldeErgebnis } from "./aktionen";

/**
 * Schritt 1 der Anmeldung.
 *
 * Genau die Felder aus Geschaeftsregel 1. Kein Kanton, kein Konto, kein
 * Passwort. Es wird als gewoehnliches Formular an eine Server Action gesendet,
 * damit es auch ohne JavaScript funktioniert.
 */
export function AnmeldeFormular({ kursId }: { kursId: string }) {
  const [ergebnis, absenden, laeuft] = useActionState<
    AnmeldeErgebnis,
    FormData
  >(anmeldenAktion, null);

  return (
    <form action={absenden} className="flex flex-col gap-6">
      <input type="hidden" name="kursId" value={kursId} />

      {/*
        Honigtopf. Nicht type="hidden", das ueberspringen Bots. Abseits
        positioniert, aus der Tabreihenfolge genommen und fuer Screenreader
        ausgeblendet, damit kein Mensch es je sieht oder ausfuellt.
      */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="webseite">Webseite (bitte leer lassen)</label>
        <input
          id="webseite"
          name="webseite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {ergebnis?.fehler ? (
        <Alert variant="destructive">
          <AlertDescription>{ergebnis.fehler}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset className="flex flex-col gap-5">
        <legend className="font-heading text-lg font-bold">
          Deine Angaben
        </legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="anrede">Anrede</Label>
          <select
            id="anrede"
            name="anrede"
            required
            defaultValue=""
            className="h-12 w-full border border-input bg-card px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Bitte wählen
            </option>
            <option value="Frau">Frau</option>
            <option value="Herr">Herr</option>
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Feld name="nachname" label="Nachname" autoComplete="family-name" />
          <Feld name="vorname" label="Vorname" autoComplete="given-name" />
        </div>

        <Feld name="strasse" label="Strasse und Nummer" autoComplete="street-address" />

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Feld
            name="plz"
            label="PLZ"
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={4}
          />
          <Feld name="ort" label="Ort" autoComplete="address-level2" />
        </div>

        <Feld
          name="geburtsdatum"
          label="Geburtsdatum"
          type="date"
          autoComplete="bday"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="font-heading text-lg font-bold">
          So erreichen wir Dich
        </legend>

        <Feld
          name="telefon"
          label="Telefonnummer"
          type="tel"
          autoComplete="tel"
          hinweis="Damit wir Dich bei einer Änderung sofort erreichen."
        />
        <Feld
          name="email"
          label="E-Mail-Adresse"
          type="email"
          autoComplete="email"
          hinweis="Hierhin geht die Bestätigung."
        />
      </fieldset>

      <div className="flex items-start gap-3 border border-border bg-flaeche-2 p-4">
        <input
          id="agb"
          name="agb"
          type="checkbox"
          required
          className="mt-1 size-5 shrink-0 accent-brand-schwarz"
        />
        <Label htmlFor="agb" className="text-sm font-normal leading-relaxed">
          Ich habe die{" "}
          <Link
            href="/agb"
            target="_blank"
            className="underline underline-offset-4"
          >
            allgemeinen Geschäftsbedingungen
          </Link>{" "}
          und die{" "}
          <Link
            href="/datenschutz"
            target="_blank"
            className="underline underline-offset-4"
          >
            Datenschutzerklärung
          </Link>{" "}
          gelesen und bin damit einverstanden.
        </Label>
      </div>

      <Button type="submit" size="lg" disabled={laeuft} className="w-full">
        {laeuft ? "Wird gesendet ..." : "Anmeldung abschicken"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Mit dem Abschicken ist Dein Platz reserviert. Im nächsten Schritt kannst
        Du noch Deine Lernfahrausweis-Nummer nachtragen.
      </p>
    </form>
  );
}

function Feld({
  name,
  label,
  hinweis,
  type = "text",
  ...rest
}: {
  name: string;
  label: string;
  hinweis?: string;
  type?: string;
} & React.ComponentProps<"input">) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required {...rest} />
      {hinweis ? (
        <p className="text-sm text-muted-foreground">{hinweis}</p>
      ) : null}
    </div>
  );
}
