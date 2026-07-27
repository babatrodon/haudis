"use client";

import { useActionState, useId, useState } from "react";
import { UserPlus } from "lucide-react";
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
  schuelerAnlegenAktion,
  type SchuelerMeldung,
} from "@/app/admin/schueler/aktionen";

/**
 * Einen Schueler anlegen.
 *
 * Vier Felder plus Notiz. Adresse und Geburtsdatum fragt die Kartei nicht ab:
 * fuer Fahrstunden braucht die Fahrschule sie nicht, und Daten, die niemand
 * braucht, sammelt man nicht.
 *
 * E-Mail ist freiwillig, aber der Hinweis sagt, was daran haengt — ohne
 * Adresse gibt es spaeter keine WAB-Erinnerung.
 */
export function SchuelerAnlegenDialog() {
  const [offen, setOffen] = useState(false);
  const [meldung, absenden, laeuft] = useActionState<SchuelerMeldung, FormData>(
    schuelerAnlegenAktion,
    null,
  );

  return (
    <Dialog open={offen} onOpenChange={setOffen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus aria-hidden="true" className="size-4" />
          Schüler anlegen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schüler anlegen</DialogTitle>
          <DialogDescription>
            Interne Kartei. Der Schüler hat keinen Zugang und sieht nichts davon.
          </DialogDescription>
        </DialogHeader>

        <form action={absenden} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Feld name="vorname" label="Vorname" />
            <Feld name="nachname" label="Nachname" />
          </div>
          <Feld name="telefon" label="Telefon" type="tel" />
          <Feld
            name="email"
            label="E-Mail (freiwillig)"
            type="email"
            required={false}
            hinweis="Ohne Adresse kann später keine WAB-Erinnerung rausgehen."
          />
          <Feld
            name="notiz"
            label="Notiz (freiwillig)"
            required={false}
            hinweis="Zum Beispiel bevorzugte Zeiten oder ein Treffpunkt."
          />

          {meldung && "fehler" in meldung ? (
            <Alert variant="destructive">
              <AlertDescription>{meldung.fehler}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOffen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={laeuft}>
              {laeuft ? "Wird angelegt …" : "Anlegen"}
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
  hinweis,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  hinweis?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required={required} />
      {hinweis ? (
        <p className="text-sm text-muted-foreground">{hinweis}</p>
      ) : null}
    </div>
  );
}
