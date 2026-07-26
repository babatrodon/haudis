"use client";

import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizFrage } from "@/lib/inhalte/boegle-fragen";

/**
 * Uebungsquiz fuer die Boegle-Seite.
 *
 * Eine Frage pro Schritt, sofortige Rueckmeldung mit Erklaerung. Das ist der
 * Punkt: nicht abfragen, sondern erklaeren, warum eine Antwort stimmt.
 *
 * Die Fragen sind eigene Formulierungen, keine Originalfragen der asa.
 */
export function Quiz({ fragen }: { fragen: QuizFrage[] }) {
  const [index, setIndex] = useState(0);
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const [richtige, setRichtige] = useState(0);
  const [fertig, setFertig] = useState(false);

  const frage = fragen[index];
  const beantwortet = gewaehlt !== null;
  const letzte = index === fragen.length - 1;

  function antworten(antwortIndex: number) {
    if (beantwortet) {
      return;
    }
    setGewaehlt(antwortIndex);
    if (antwortIndex === frage.richtig) {
      setRichtige((wert) => wert + 1);
    }
  }

  function weiter() {
    if (letzte) {
      setFertig(true);
      return;
    }
    setIndex((wert) => wert + 1);
    setGewaehlt(null);
  }

  function neuStarten() {
    setIndex(0);
    setGewaehlt(null);
    setRichtige(0);
    setFertig(false);
  }

  if (fertig) {
    return (
      <div className="border border-border bg-card p-8 text-center">
        <p className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Ergebnis
        </p>
        <p className="mt-3 font-heading text-5xl font-bold">
          {richtige} von {fragen.length}
        </p>
        <p className="mx-auto mt-4 max-w-prose text-muted-foreground">
          {richtige === fragen.length
            ? "Alles richtig. Genau so darf es an der Prüfung aussehen."
            : richtige >= fragen.length * 0.8
              ? "Gut unterwegs. Die letzten Lücken schliessen wir gemeinsam im Bögle."
              : "Noch etwas Übung nötig, und genau dafür gibt es das Bögle. Komm vorbei, es ist gratis."}
        </p>
        <Button onClick={neuStarten} className="mt-6">
          <RotateCcw aria-hidden="true" className="size-4" />
          Nochmals üben
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-border p-5">
        <p className="text-sm text-muted-foreground">
          Frage {index + 1} von {fragen.length}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {richtige} richtig
        </p>
      </div>

      {/* Fortschritt, rein dekorativ: die Zahlen stehen darueber im Text. */}
      <div aria-hidden="true" className="h-1 bg-flaeche-3">
        <div
          className="h-full bg-brand-gelb transition-all"
          style={{ width: `${((index + (beantwortet ? 1 : 0)) / fragen.length) * 100}%` }}
        />
      </div>

      <div className="p-6">
        <h3 className="font-heading text-xl font-bold">{frage.frage}</h3>

        <ul className="mt-6 space-y-3">
          {frage.antworten.map((antwort, antwortIndex) => {
            const istRichtig = antwortIndex === frage.richtig;
            const istGewaehlt = antwortIndex === gewaehlt;

            return (
              <li key={antwort}>
                <button
                  type="button"
                  onClick={() => antworten(antwortIndex)}
                  disabled={beantwortet}
                  aria-pressed={istGewaehlt}
                  className={cn(
                    "flex w-full min-h-14 items-center justify-between gap-4 border p-4 text-left transition-colors",
                    !beantwortet && "border-border hover:bg-accent",
                    beantwortet &&
                      istRichtig &&
                      "border-ampel-gruen-linie bg-ampel-gruen-bg text-ampel-gruen",
                    beantwortet &&
                      istGewaehlt &&
                      !istRichtig &&
                      "border-ampel-rot-linie bg-ampel-rot-bg text-ampel-rot",
                    beantwortet &&
                      !istRichtig &&
                      !istGewaehlt &&
                      "border-border opacity-60",
                  )}
                >
                  <span className="font-medium">{antwort}</span>
                  {beantwortet && istRichtig ? (
                    <Check aria-hidden="true" className="size-5 shrink-0" />
                  ) : null}
                  {beantwortet && istGewaehlt && !istRichtig ? (
                    <X aria-hidden="true" className="size-5 shrink-0" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {beantwortet ? (
          <div aria-live="polite" className="mt-6">
            <p className="font-heading font-bold">
              {gewaehlt === frage.richtig ? "Richtig." : "Nicht ganz."}
            </p>
            <p className="mt-2 text-muted-foreground">{frage.erklaerung}</p>
            <Button onClick={weiter} className="mt-5">
              {letzte ? "Ergebnis ansehen" : "Nächste Frage"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
