"use client";

import { useActionState, useState } from "react";
import { Copy } from "lucide-react";
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
import { tageVerschieben, tageZwischen } from "@/lib/inhalte/kursmuster";
import { kursDuplizierenAktion, type KursErgebnis } from "@/app/admin/kurse/aktionen";

/**
 * Kurs duplizieren.
 *
 * Der haeufigere Weg zu einem neuen Kurs: Ausilias Kurse wiederholen sich, nur
 * das Datum aendert. Deshalb steht der Knopf in der Liste an jeder Zeile und
 * nicht erst zwei Klicks tief.
 *
 * Sie waehlt einen Abstand, nicht vier Daten. Die drei Schnellknoepfe decken
 * ab, was in einer Fahrschule vorkommt; das Feld daneben bleibt fuer alles
 * andere. Die Vorschau zeigt vor dem Bestaetigen, was entsteht — ein
 * Duplikat, das auf einem Feiertag landet, faellt so vorher auf.
 */

type Termin = { datum: string; von: string; bis: string };

const ABSTAENDE = [
  { tage: 7, beschriftung: "+1 Woche" },
  { tage: 14, beschriftung: "+2 Wochen" },
  { tage: 28, beschriftung: "+4 Wochen" },
];

const WOCHENTAG = new Intl.DateTimeFormat("de-CH", {
  timeZone: "Europe/Zurich",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function anzeigen(iso: string): string {
  const [jahr, monat, tag] = iso.split("-").map(Number);
  return WOCHENTAG.format(new Date(Date.UTC(jahr, monat - 1, tag)));
}

export function DuplizierenDialog({
  kursId,
  kursName,
  termine,
  auffaellig = false,
}: {
  kursId: string;
  kursName: string;
  termine: Termin[];
  /** In der Liste dezent, auf der Detailseite als Hauptaktion. */
  auffaellig?: boolean;
}) {
  const [offen, setOffen] = useState(false);
  const [ergebnis, absenden, laeuft] = useActionState<KursErgebnis, FormData>(
    kursDuplizierenAktion,
    null,
  );

  const start = termine[0]?.datum ?? "";
  const [neuerStart, setNeuerStart] = useState(
    start ? tageVerschieben(start, 7) : "",
  );

  const versatz = start && neuerStart ? tageZwischen(start, neuerStart) : 0;
  const vorschau = termine.map((termin) => ({
    ...termin,
    datum: tageVerschieben(termin.datum, versatz),
  }));

  return (
    <Dialog open={offen} onOpenChange={setOffen}>
      <DialogTrigger asChild>
        <Button variant={auffaellig ? "default" : "outline"} size="sm">
          <Copy aria-hidden="true" className="size-4" />
          Duplizieren
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{kursName} duplizieren</DialogTitle>
          <DialogDescription>
            Preis, Plätze und Ablauf werden übernommen. Anmeldungen nicht. Der
            neue Kurs entsteht als Entwurf.
          </DialogDescription>
        </DialogHeader>

        {ergebnis?.fehler ? (
          <Alert variant="destructive">
            <AlertDescription>{ergebnis.fehler}</AlertDescription>
          </Alert>
        ) : null}

        <form action={absenden} className="flex flex-col gap-4">
          <input type="hidden" name="kursId" value={kursId} />
          <input type="hidden" name="neuerStart" value={neuerStart} />

          <div className="flex flex-wrap gap-2">
            {ABSTAENDE.map((abstand) => (
              <Button
                key={abstand.tage}
                type="button"
                size="sm"
                variant={versatz === abstand.tage ? "default" : "outline"}
                onClick={() => setNeuerStart(tageVerschieben(start, abstand.tage))}
                aria-pressed={versatz === abstand.tage}
              >
                {abstand.beschriftung}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`neuerStart-${kursId}`}>Neuer erster Kurstag</Label>
            <Input
              id={`neuerStart-${kursId}`}
              type="date"
              value={neuerStart}
              onChange={(ereignis) => setNeuerStart(ereignis.target.value)}
              className="sm:max-w-56"
            />
          </div>

          <div className="border border-border bg-flaeche-2 p-3">
            <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Neue Termine
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {vorschau.map((termin, index) => (
                <li key={index} className="text-sm tabular-nums">
                  {anzeigen(termin.datum)}, {termin.von} bis {termin.bis} Uhr
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOffen(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={laeuft || !neuerStart}>
              {laeuft ? "Wird angelegt ..." : "Duplikat anlegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
