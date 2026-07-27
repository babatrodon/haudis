"use client";

import { useActionState, useId, useState } from "react";
import { Pencil } from "lucide-react";
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
  buchungAendernAktion,
  buchungLoeschenAktion,
  buchungReaktivierenAktion,
  buchungStornierenAktion,
  type BuchungErgebnisMeldung,
} from "@/app/admin/buchungen/aktionen";
import type { BuchungZeile } from "@/lib/admin/buchungen";

/**
 * Buchung bearbeiten.
 *
 * Die Ausweisnummer steht zuoberst, weil sie der haeufigste Grund ist, diesen
 * Dialog zu oeffnen: sie wird oft erst am Kurstag nachgereicht.
 *
 * Stornieren und Loeschen sind bewusst getrennt und stehen unten in einem
 * eigenen Abschnitt. Stornieren gibt den Platz frei und laesst die Zeile
 * stehen; Loeschen ist fuer Fehleingaben und verlangt eine zweite Bestaetigung,
 * weil danach nichts mehr nachvollziehbar ist.
 */

export type InstruktorAuswahl = {
  id: string;
  anzeige: string;
};

const AUSWAHL_STIL =
  "h-12 w-full border border-input bg-card px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BuchungBearbeitenDialog({
  buchung,
  kursId,
  instruktoren,
}: {
  buchung: BuchungZeile;
  kursId: string;
  instruktoren: InstruktorAuswahl[];
}) {
  const [offen, setOffen] = useState(false);
  const [loeschenGefragt, setLoeschenGefragt] = useState(false);

  const [ergebnis, speichern, laeuft] = useActionState<
    BuchungErgebnisMeldung,
    FormData
  >(buchungAendernAktion, null);
  const [stornoErgebnis, stornieren, stornoLaeuft] = useActionState<
    BuchungErgebnisMeldung,
    FormData
  >(
    buchung.status === "CANCELLED"
      ? buchungReaktivierenAktion
      : buchungStornierenAktion,
    null,
  );
  const [loeschErgebnis, loeschen, loeschLaeuft] = useActionState<
    BuchungErgebnisMeldung,
    FormData
  >(buchungLoeschenAktion, null);

  const meldung = ergebnis ?? stornoErgebnis ?? loeschErgebnis;

  // Ein zugewiesener, inzwischen inaktiver Fahrlehrer muss in der Liste
  // bleiben. Sonst loeschte das erste Speichern die Zuweisung und mit ihr die
  // Grundlage der Provision.
  const auswahl =
    buchung.fahrlehrer &&
    !instruktoren.some((eintrag) => eintrag.id === buchung.fahrlehrer?.id)
      ? [
          ...instruktoren,
          {
            id: buchung.fahrlehrer.id,
            anzeige: `${buchung.fahrlehrer.name} (${buchung.fahrlehrer.kuerzel}, nicht mehr aktiv)`,
          },
        ]
      : instruktoren;

  return (
    <Dialog open={offen} onOpenChange={setOffen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil aria-hidden="true" className="size-4" />
          Bearbeiten
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {buchung.nachname} {buchung.vorname}
          </DialogTitle>
          <DialogDescription>
            {buchung.quelle === "PHONE"
              ? "Telefonisch angemeldet, hat nichts Schriftliches erhalten."
              : "Online angemeldet, hat eine Bestätigung per E-Mail."}
          </DialogDescription>
        </DialogHeader>

        {meldung && "fehler" in meldung ? (
          <Alert variant="destructive">
            <AlertDescription>{meldung.fehler}</AlertDescription>
          </Alert>
        ) : null}
        {meldung && "erledigt" in meldung ? (
          <Alert>
            <AlertDescription>{meldung.erledigt}</AlertDescription>
          </Alert>
        ) : null}

        <form action={speichern} className="flex flex-col gap-4">
          <input type="hidden" name="buchungId" value={buchung.id} />
          <input type="hidden" name="kursId" value={kursId} />

          <Feld
            name="lfaNummer"
            label="Ausweisnummer"
            defaultValue={buchung.lfaNummer ?? ""}
            hinweis="Leer lassen, solange sie nicht vorliegt."
            required={false}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`anrede-${buchung.id}`}>Anrede</Label>
              <select
                id={`anrede-${buchung.id}`}
                name="anrede"
                defaultValue={buchung.anrede}
                className={AUSWAHL_STIL}
              >
                <option value="Frau">Frau</option>
                <option value="Herr">Herr</option>
              </select>
            </div>
            <Feld
              name="geburtsdatum"
              label="Geburtsdatum"
              type="date"
              defaultValue={buchung.geburtsdatum.toISOString().slice(0, 10)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Feld name="nachname" label="Nachname" defaultValue={buchung.nachname} />
            <Feld name="vorname" label="Vorname" defaultValue={buchung.vorname} />
          </div>

          <Feld name="strasse" label="Strasse" defaultValue={buchung.strasse} />

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Feld name="plz" label="PLZ" defaultValue={buchung.plz} inputMode="numeric" />
            <Feld name="ort" label="Ort" defaultValue={buchung.ort} />
          </div>

          <Feld
            name="telefon"
            label="Telefon"
            type="tel"
            defaultValue={buchung.telefon}
          />
          <Feld
            name="email"
            label="E-Mail"
            type="email"
            required={false}
            defaultValue={buchung.email ?? ""}
            hinweis="Darf leer bleiben. Ohne Adresse geht keine Mail hinaus."
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor={`fahrlehrer-${buchung.id}`}>
              Zuweisender Fahrlehrer
            </Label>
            <select
              id={`fahrlehrer-${buchung.id}`}
              name="fahrlehrerId"
              defaultValue={buchung.fahrlehrer?.id ?? ""}
              className={AUSWAHL_STIL}
            >
              <option value="">Keine Zuweisung</option>
              {auswahl.map((eintrag) => (
                <option key={eintrag.id} value={eintrag.id}>
                  {eintrag.anzeige}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Grundlage der Provision. Nur die Admin setzt sie.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOffen(false)}
            >
              Schliessen
            </Button>
            <Button type="submit" disabled={laeuft}>
              {laeuft ? "Wird gespeichert ..." : "Speichern"}
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-flaeche-3 pt-4">
          <form action={stornieren}>
            <input type="hidden" name="buchungId" value={buchung.id} />
            <input type="hidden" name="kursId" value={kursId} />
            <Button
              type="submit"
              variant={buchung.status === "CANCELLED" ? "outline" : "destructive"}
              size="sm"
              disabled={stornoLaeuft}
            >
              {buchung.status === "CANCELLED"
                ? "Wieder anmelden"
                : "Stornieren, Platz freigeben"}
            </Button>
          </form>

          {loeschenGefragt ? (
            <form action={loeschen} className="flex items-center gap-2">
              <input type="hidden" name="buchungId" value={buchung.id} />
              <input type="hidden" name="kursId" value={kursId} />
              <span className="text-sm text-muted-foreground">
                Wirklich löschen?
              </span>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={loeschLaeuft}
              >
                Ja, löschen
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLoeschenGefragt(false)}
              >
                Nein
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLoeschenGefragt(true)}
            >
              Fehleingabe löschen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
  // Eigene ID statt des Feldnamens: derselbe Dialog erscheint pro Buchung
  // einmal, und zwei gleiche IDs im Dokument haengen das Label an die falsche
  // Eingabe.
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
