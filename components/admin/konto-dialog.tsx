"use client";

import { useActionState, useState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { PasswortAnzeige } from "@/components/admin/passwort-anzeige";
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
  emailAendernAktion,
  kontoAktivAktion,
  kontoAnlegenAktion,
  passwortZuruecksetzenAktion,
  type KontoMeldung,
} from "@/app/admin/fahrlehrer/aktionen";
import type { InstruktorZeile } from "@/lib/admin/konten";

/**
 * Konto anlegen oder verwalten.
 *
 * Sobald ein Passwort entsteht, verdraengt dessen Anzeige alles andere im
 * Dialog. Ein Passwort, das zwischen Formularfeldern steht, wird uebersehen —
 * und es gibt keine zweite Gelegenheit.
 */
export function KontoDialog({ instruktor }: { instruktor: InstruktorZeile }) {
  const [offen, setOffen] = useState(false);
  const name = `${instruktor.vorname} ${instruktor.nachname}`;

  const [anlegenErgebnis, anlegen, anlegenLaeuft] = useActionState<
    KontoMeldung,
    FormData
  >(kontoAnlegenAktion, null);
  const [resetErgebnis, zuruecksetzen, resetLaeuft] = useActionState<
    KontoMeldung,
    FormData
  >(passwortZuruecksetzenAktion, null);
  const [emailErgebnis, emailAendern, emailLaeuft] = useActionState<
    KontoMeldung,
    FormData
  >(emailAendernAktion, null);
  const [aktivErgebnis, aktivSetzen, aktivLaeuft] = useActionState<
    KontoMeldung,
    FormData
  >(kontoAktivAktion, null);

  const meldung =
    anlegenErgebnis ?? resetErgebnis ?? emailErgebnis ?? aktivErgebnis;
  const passwort = meldung && "passwort" in meldung ? meldung : null;

  return (
    <Dialog open={offen} onOpenChange={setOffen}>
      <DialogTrigger asChild>
        <Button variant={instruktor.konto ? "outline" : "default"} size="sm">
          {instruktor.konto ? (
            <>
              <KeyRound aria-hidden="true" className="size-4" />
              Konto
            </>
          ) : (
            <>
              <UserPlus aria-hidden="true" className="size-4" />
              Konto anlegen
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>
            {instruktor.konto
              ? `Zugang zum Fahrlehrer-Portal, ${instruktor.konto.email}`
              : "Noch kein Zugang zum Fahrlehrer-Portal."}
          </DialogDescription>
        </DialogHeader>

        {passwort ? (
          <PasswortAnzeige
            passwort={passwort.passwort}
            name={passwort.name || name}
            onFertig={() => setOffen(false)}
          />
        ) : (
          <>
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

            {instruktor.konto ? (
              <div className="flex flex-col gap-5">
                <form action={emailAendern} className="flex flex-col gap-2">
                  <input
                    type="hidden"
                    name="userId"
                    value={instruktor.konto.userId}
                  />
                  <Label htmlFor={`email-${instruktor.id}`}>
                    E-Mail-Adresse
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id={`email-${instruktor.id}`}
                      name="email"
                      type="email"
                      required
                      defaultValue={instruktor.konto.email}
                      className="min-w-48 flex-1"
                    />
                    <Button type="submit" variant="outline" disabled={emailLaeuft}>
                      Speichern
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Damit meldet sich {instruktor.vorname} an.
                  </p>
                </form>

                <form action={zuruecksetzen} className="flex flex-col gap-2">
                  <input
                    type="hidden"
                    name="userId"
                    value={instruktor.konto.userId}
                  />
                  <input type="hidden" name="name" value={name} />
                  <Button type="submit" variant="outline" disabled={resetLaeuft}>
                    <KeyRound aria-hidden="true" className="size-4" />
                    Neues Passwort erzeugen
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Das alte gilt sofort nicht mehr, offene Sitzungen werden
                    beendet. Das neue erscheint einmalig.
                  </p>
                </form>

                <form
                  action={aktivSetzen}
                  className="flex flex-col gap-2 border-t border-flaeche-3 pt-4"
                >
                  <input
                    type="hidden"
                    name="userId"
                    value={instruktor.konto.userId}
                  />
                  <input
                    type="hidden"
                    name="aktiv"
                    value={instruktor.konto.aktiv ? "false" : "true"}
                  />
                  <Button
                    type="submit"
                    variant={instruktor.konto.aktiv ? "destructive" : "outline"}
                    disabled={aktivLaeuft}
                  >
                    {instruktor.konto.aktiv
                      ? "Konto stilllegen"
                      : "Konto wieder freigeben"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Stilllegen sperrt den Zugang sofort. Gelöscht wird nichts,
                    damit vergangene Zuweisungen nachvollziehbar bleiben.
                  </p>
                </form>
              </div>
            ) : (
              <form action={anlegen} className="flex flex-col gap-4">
                <input
                  type="hidden"
                  name="instruktorId"
                  value={instruktor.id}
                />
                <input type="hidden" name="name" value={name} />

                <div className="flex flex-col gap-2">
                  <Label htmlFor={`neu-email-${instruktor.id}`}>
                    E-Mail-Adresse
                  </Label>
                  <Input
                    id={`neu-email-${instruktor.id}`}
                    name="email"
                    type="email"
                    required
                    placeholder={`${instruktor.vorname.toLowerCase()}@haudi.ch`}
                    autoComplete="off"
                  />
                  <p className="text-sm text-muted-foreground">
                    Dient nur der Anmeldung. Ein Postfach muss dahinter nicht
                    liegen.
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOffen(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={anlegenLaeuft}>
                    {anlegenLaeuft ? "Wird angelegt ..." : "Konto anlegen"}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
