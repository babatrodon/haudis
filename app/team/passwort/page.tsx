import type { Metadata } from "next";
import {
  requireSessionOhnePasswortzwang,
  startseiteFuerRolle,
} from "@/lib/auth-guard";
import { PasswortFormular } from "./passwort-formular";

export const metadata: Metadata = {
  title: "Passwort ändern | Haudi's Fahrschule",
  robots: { index: false, follow: false },
};

/**
 * Passwort ändern. Zwei Wege hierher:
 *
 *   - erzwungen: mustChangePassword ist gesetzt, requireSession leitet um
 *   - freiwillig: über das Profil
 *
 * Diese Seite prüft die Sitzung ohne den Passwortzwang, sonst würde sie sich
 * selbst im Kreis weiterleiten.
 */
export default async function PasswortSeite() {
  const benutzer = await requireSessionOhnePasswortzwang();
  const erzwungen = benutzer.mustChangePassword;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="border border-border bg-card p-8">
          <h1 className="font-heading text-2xl font-bold">
            {erzwungen ? "Neues Passwort setzen" : "Passwort ändern"}
          </h1>

          {erzwungen ? (
            <p className="mt-3 border-l-4 border-brand-gelb pl-4 text-sm text-muted-foreground">
              Dein Konto hat noch das Startpasswort, das Du von der
              Administration bekommen hast. Bitte setze jetzt ein eigenes, dann
              geht es weiter.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Angemeldet als {benutzer.email}.
            </p>
          )}

          <div className="mt-8">
            <PasswortFormular
              zielNachWechsel={startseiteFuerRolle(benutzer.role)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
