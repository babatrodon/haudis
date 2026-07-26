"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from "@/lib/auth-client";

const anmeldeSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail-Adresse eingeben")
    .email("Das sieht nicht nach einer E-Mail-Adresse aus"),
  passwort: z.string().min(1, "Passwort eingeben"),
});

type AnmeldeDaten = z.infer<typeof anmeldeSchema>;

export function LoginFormular({ weiter }: { weiter: string }) {
  const router = useRouter();
  const [fehler, setFehler] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnmeldeDaten>({
    resolver: zodResolver(anmeldeSchema),
    defaultValues: { email: "", passwort: "" },
  });

  async function absenden(daten: AnmeldeDaten) {
    setFehler(null);

    const { error } = await signIn.email({
      email: daten.email,
      password: daten.passwort,
    });

    if (error) {
      // Bewusst dieselbe Meldung fuer falsches Passwort und unbekanntes Konto:
      // sonst laesst sich abfragen, welche Adressen ein Konto haben.
      setFehler(
        error.status === 429
          ? "Zu viele Versuche. Bitte kurz warten und erneut probieren."
          : "E-Mail-Adresse oder Passwort stimmt nicht.",
      );
      return;
    }

    // Wohin es geht, entscheidet der Server anhand der Rolle.
    router.push(weiter);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(absenden)} className="flex flex-col gap-5">
      {fehler ? (
        <Alert variant="destructive">
          <AlertDescription>{fehler}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="passwort">Passwort</Label>
        <Input
          id="passwort"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.passwort)}
          {...register("passwort")}
        />
        {errors.passwort ? (
          <p className="text-sm text-destructive">{errors.passwort.message}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting} className="min-h-11 w-full">
        {isSubmitting ? "Wird angemeldet ..." : "Anmelden"}
      </Button>
    </form>
  );
}
