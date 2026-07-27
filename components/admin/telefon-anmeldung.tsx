"use client";

import { useActionState, useId, useState } from "react";
import { PhoneIncoming } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  telefonAnmeldungAktion,
  type BuchungErgebnisMeldung,
} from "@/app/admin/buchungen/aktionen";
import type { InstruktorAuswahl } from "@/components/admin/buchung-bearbeiten-dialog";

/**
 * Telefonische Anmeldung.
 *
 * Dieselben Pflichtfelder wie online, ohne AGB-Haekchen und ohne Mailversand
 * (Geschaeftsregel 4). Sie laeuft durch dieselbe Transaktion wie die
 * Onlineanmeldung, wird also gegen dieselbe Kapazitaet geprueft.
 *
 * Der Hinweis, dass nichts verschickt wird, steht im Dialog und nicht erst in
 * der Bestaetigung: wer es vorher weiss, sagt der Person am Telefon gleich die
 * Kursdaten durch.
 */

const AUSWAHL_STIL =
  "h-12 w-full border border-input bg-card px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type KursAuswahl = {
  id: string;
  name: string;
  beschriftung: string;
  frei: number;
};

export function TelefonAnmeldung({
  kurse,
  instruktoren,
  kursId,
  variante = "default",
  beschriftung,
  vorbelegung,
}: {
  kurse: KursAuswahl[];
  instruktoren: InstruktorAuswahl[];
  /** Auf der Kursseite steht der Kurs schon fest. */
  kursId?: string;
  variante?: "default" | "outline";
  /** Abweichender Text auf dem Knopf, etwa beim Umwandeln eines Wartenden. */
  beschriftung?: string;
  /**
   * Bekanntes aus einem Wartelisten-Eintrag. Adresse und Geburtsdatum stehen
   * dort nicht — die fragt Ausilia am Telefon ab, statt sie zu erfinden.
   */
  vorbelegung?: {
    vorname?: string;
    nachname?: string;
    telefon?: string;
    email?: string;
  };
}) {
  const [offen, setOffen] = useState(false);
  const [ergebnis, absenden, laeuft] = useActionState<
    BuchungErgebnisMeldung,
    FormData
  >(telefonAnmeldungAktion, null);

  const erledigt = ergebnis !== null && "erledigt" in ergebnis;

  return (
    <Dialog open={offen} onOpenChange={setOffen}>
      <DialogTrigger asChild>
        <Button variant={variante}>
          <PhoneIncoming aria-hidden="true" className="size-4" />
          {beschriftung ?? "Telefonische Anmeldung"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Telefonische Anmeldung</DialogTitle>
          <DialogDescription>
            Es wird kein Bestätigungsmail verschickt. Bitte die Kursdaten am
            Telefon durchgeben.
          </DialogDescription>
        </DialogHeader>

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
          // Nach einer Anmeldung ist das Formular leer und bereit fuer die
          // naechste: am Telefon kommen oft zwei Personen nacheinander.
          key={erledigt ? "leer" : "gefuellt"}
          className="flex flex-col gap-4"
        >
          {kursId ? (
            <input type="hidden" name="kursId" value={kursId} />
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="kursId">Kurs</Label>
              <select
                id="kursId"
                name="kursId"
                required
                defaultValue=""
                className={AUSWAHL_STIL}
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
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="anrede">Anrede</Label>
              <select
                id="anrede"
                name="anrede"
                required
                defaultValue="Frau"
                className={AUSWAHL_STIL}
              >
                <option value="Frau">Frau</option>
                <option value="Herr">Herr</option>
              </select>
            </div>
            <Feld name="geburtsdatum" label="Geburtsdatum" type="date" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Feld
              name="nachname"
              label="Nachname"
              autoComplete="off"
              defaultValue={vorbelegung?.nachname}
            />
            <Feld
              name="vorname"
              label="Vorname"
              autoComplete="off"
              defaultValue={vorbelegung?.vorname}
            />
          </div>

          <Feld name="strasse" label="Strasse und Nummer" autoComplete="off" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Feld name="plz" label="PLZ" inputMode="numeric" maxLength={4} />
            <Feld name="ort" label="Ort" autoComplete="off" />
          </div>

          <Feld
            name="telefon"
            label="Telefon"
            type="tel"
            autoComplete="off"
            defaultValue={vorbelegung?.telefon}
          />
          {/* Freiwillig: nicht jede Person am Telefon hat eine Adresse, und
              eine erfundene waere schlimmer als keine. */}
          <Feld
            name="email"
            label="E-Mail (freiwillig)"
            type="email"
            required={false}
            autoComplete="off"
            defaultValue={vorbelegung?.email}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Feld
              name="lfaNummer"
              label="Ausweisnummer"
              required={false}
              autoComplete="off"
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="fahrlehrerId">Zuweisender Fahrlehrer</Label>
              <select
                id="fahrlehrerId"
                name="fahrlehrerId"
                defaultValue=""
                className={AUSWAHL_STIL}
              >
                <option value="">Keine Zuweisung</option>
                {instruktoren.map((eintrag) => (
                  <option key={eintrag.id} value={eintrag.id}>
                    {eintrag.anzeige}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOffen(false)}>
              Schliessen
            </Button>
            <Button type="submit" disabled={laeuft}>
              {laeuft ? "Wird angelegt ..." : "Anmelden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Feld({
  name,
  label,
  type = "text",
  required = true,
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
} & React.ComponentProps<"input">) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required={required} {...rest} />
    </div>
  );
}
