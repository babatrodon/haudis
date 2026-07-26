"use client";

import { useActionState, useState } from "react";
import { CalendarX, Phone } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  kursAbsagenAktion,
  type AbsageAktionErgebnis,
} from "@/app/admin/kurse/aktionen";
import type { Betroffene } from "@/lib/admin/kurse";

/**
 * Kurs absagen.
 *
 * Die Buchungen werden mit abgesagt (Entscheid aus PLAN.md), und genau das
 * muss vor dem Bestaetigen dastehen — samt der Frage, die dann wirklich
 * zaehlt: wen betrifft es, und wie erreiche ich diese Leute?
 *
 * Deshalb stehen die Namen mit ihren Nummern als Anrufknopf im Dialog. Bei
 * einer kurzfristigen Absage ruft Ausilia an; die Mail ist die schriftliche
 * Absicherung, nicht der Weg. Wer lieber telefoniert, entfernt den Haken und
 * hat die Liste bereits vor sich.
 */
export function AbsageDialog({
  kursId,
  kursName,
  betroffene,
}: {
  kursId: string;
  kursName: string;
  betroffene: Betroffene[];
}) {
  const [offen, setOffen] = useState(false);
  const [ergebnis, absenden, laeuft] = useActionState<
    AbsageAktionErgebnis,
    FormData
  >(kursAbsagenAktion, null);

  const erledigt = ergebnis !== null && "erledigt" in ergebnis;

  return (
    <Dialog open={offen} onOpenChange={setOffen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <CalendarX aria-hidden="true" className="size-4" />
          Kurs absagen
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{kursName} absagen</DialogTitle>
          <DialogDescription>
            {betroffene.length === 0
              ? "Für diesen Kurs liegt keine Anmeldung vor."
              : `${betroffene.length} ${betroffene.length === 1 ? "Anmeldung wird" : "Anmeldungen werden"} ebenfalls storniert. Die Plätze werden frei, der Kurs verschwindet von der Website.`}
          </DialogDescription>
        </DialogHeader>

        {erledigt ? (
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertDescription>
                Der Kurs ist abgesagt.
                {ergebnis.benachrichtigt > 0
                  ? ` ${ergebnis.benachrichtigt} ${ergebnis.benachrichtigt === 1 ? "Person wurde" : "Personen wurden"} per E-Mail benachrichtigt.`
                  : ""}
                {ergebnis.nichtErreicht > 0
                  ? ` ${ergebnis.nichtErreicht} E-Mail konnte nicht zugestellt werden — bitte anrufen.`
                  : ""}
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setOffen(false)}>
                Schliessen
              </Button>
            </div>
          </div>
        ) : (
          <form action={absenden} className="flex flex-col gap-4">
            <input type="hidden" name="kursId" value={kursId} />

            {ergebnis?.fehler ? (
              <Alert variant="destructive">
                <AlertDescription>{ergebnis.fehler}</AlertDescription>
              </Alert>
            ) : null}

            {betroffene.length > 0 ? (
              <div className="border border-border">
                <p className="border-b border-flaeche-3 bg-flaeche-2 px-3 py-2 font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Betroffen · {betroffene.length}
                </p>
                {/*
                  Die Liste rollt in sich. Bei zehn Angemeldeten fuellte sie
                  sonst den ganzen Dialog, und der Absagen-Knopf staende
                  unsichtbar darunter — bei einer Aktion, die Buchungen
                  storniert, ist das die falsche Stelle zum Suchen.
                */}
                <ul className="max-h-56 overflow-y-auto">
                  {betroffene.map((person) => (
                    <li
                      key={person.id}
                      className="flex items-center justify-between gap-3 border-b border-flaeche-3 px-3 py-2 last:border-b-0"
                    >
                      <span className="min-w-0 truncate text-sm">
                        {person.firstName} {person.lastName}
                      </span>
                      <a
                        href={`tel:${person.phone.replace(/\s/g, "")}`}
                        className="inline-flex min-h-11 shrink-0 items-center gap-2 px-2 text-sm font-medium tabular-nums underline underline-offset-4"
                      >
                        <Phone aria-hidden="true" className="size-4" />
                        {person.phone}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="grund">Grund (erscheint in der E-Mail)</Label>
              <Textarea
                id="grund"
                name="grund"
                rows={2}
                placeholder="Zum Beispiel: Der Kurs findet wegen zu wenigen Anmeldungen nicht statt."
              />
            </div>

            {betroffene.length > 0 ? (
              <div className="flex items-start gap-3 border border-border bg-flaeche-2 p-3">
                <input
                  id="benachrichtigen"
                  name="benachrichtigen"
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 size-5 shrink-0 accent-brand-schwarz"
                />
                <Label
                  htmlFor="benachrichtigen"
                  className="text-sm font-normal leading-relaxed"
                >
                  Teilnehmende per E-Mail benachrichtigen
                </Label>
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOffen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" variant="destructive" disabled={laeuft}>
                {laeuft ? "Wird abgesagt ..." : "Kurs absagen"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
