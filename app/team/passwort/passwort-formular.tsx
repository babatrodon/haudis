"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { passwortAendern, type PasswortErgebnis } from "./aktionen";

export function PasswortFormular({ zielNachWechsel }: { zielNachWechsel: string }) {
  const router = useRouter();
  const [ergebnis, absenden, laeuft] = useActionState<
    PasswortErgebnis | null,
    FormData
  >(passwortAendern, null);

  useEffect(() => {
    if (ergebnis && "erfolg" in ergebnis) {
      router.push(zielNachWechsel);
      router.refresh();
    }
  }, [ergebnis, router, zielNachWechsel]);

  return (
    <form action={absenden} className="flex flex-col gap-5">
      {ergebnis && "fehler" in ergebnis ? (
        <Alert variant="destructive">
          <AlertDescription>{ergebnis.fehler}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="aktuell">Aktuelles Passwort</Label>
        <Input
          id="aktuell"
          name="aktuell"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="neu">Neues Passwort</Label>
        <Input
          id="neu"
          name="neu"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
        <p className="text-sm text-muted-foreground">Mindestens 12 Zeichen.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="wiederholung">Neues Passwort wiederholen</Label>
        <Input
          id="wiederholung"
          name="wiederholung"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </div>

      <Button type="submit" disabled={laeuft} className="min-h-11 w-full">
        {laeuft ? "Wird gespeichert ..." : "Passwort ändern"}
      </Button>
    </form>
  );
}
