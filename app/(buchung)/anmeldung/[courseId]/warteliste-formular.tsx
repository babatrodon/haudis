"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Feld } from "@/components/buchung/formularfeld";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  wartelisteEintragenAktion,
  type WartelisteErgebnis,
} from "./aktionen";

/**
 * Warteliste eines ausgebuchten Kurses.
 *
 * Vier Felder, mehr braucht es nicht, um jemanden zu erreichen. Adresse und
 * Geburtsdatum fragt niemand ab, solange gar kein Platz da ist.
 *
 * Nach dem Absenden bleibt die Person auf der Seite: es ist keine Buchung
 * entstanden, auf deren Bestaetigung man weiterleiten koennte. Stattdessen
 * steht dort, an welcher Stelle sie in der Schlange steht und was als
 * Naechstes passiert.
 */
export function WartelisteFormular({
  kursId,
  kursName,
  telefonnummern,
}: {
  kursId: string;
  kursName: string;
  telefonnummern: { tel: string; anzeige: string }[];
}) {
  const [ergebnis, absenden, laeuft] = useActionState<
    WartelisteErgebnis,
    FormData
  >(wartelisteEintragenAktion, null);

  if (ergebnis && "erfolg" in ergebnis) {
    return (
      <div className="px-4 py-10 sm:px-8 lg:px-12 lg:py-14">
        <p className="mb-4 inline-flex size-12 items-center justify-center bg-brand-gelb">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 12.5L9.5 18L20 6"
              stroke="#121212"
              strokeWidth="2.6"
              strokeLinecap="square"
            />
          </svg>
        </p>
        <h1 className="font-heading text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] lg:text-[40px]">
          Du stehst auf der Warteliste
        </h1>
        <p className="mt-3 max-w-[520px] leading-[1.6] text-grau-text">
          Für den {kursName} bist Du an{" "}
          <strong className="text-foreground">
            Stelle {ergebnis.position}
          </strong>
          . Wird ein Platz frei, bekommst Du eine E-Mail mit einem Link zur
          Anmeldung. Der Platz bleibt dann 48 Stunden für Dich reserviert.
        </p>
        <p className="mt-3 max-w-[520px] leading-[1.6] text-grau-text">
          Angemeldet bist Du damit noch nicht. Wenn es pressiert, ruf uns an —
          oft finden wir einen Platz in einem anderen Kurs.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          {telefonnummern.map((nummer) => (
            <a
              key={nummer.tel}
              href={`tel:${nummer.tel}`}
              className="inline-flex min-h-12 items-center border border-brand-schwarz px-5 font-semibold tabular-nums"
            >
              {nummer.anzeige}
            </a>
          ))}
          <Link
            href="/kursdaten"
            className="inline-flex min-h-12 items-center px-2 font-semibold underline underline-offset-4"
          >
            Andere Kurse ansehen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={absenden} className="px-4 py-10 sm:px-8 lg:px-12 lg:py-14">
      <h1 className="font-heading text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] lg:text-[40px]">
        Dieser Kurs ist ausgebucht
      </h1>
      <p className="mt-3 max-w-[520px] leading-[1.6] text-grau-text">
        Für den {kursName} gibt es keinen freien Platz mehr. Trag Dich auf die
        Warteliste ein: wird ein Platz frei, melden wir uns bei Dir — der Reihe
        nach, und mit einem Link zur Anmeldung.
      </p>

      <input type="hidden" name="kursId" value={kursId} />

      {/* Honigtopf wie im Anmeldeformular. Nicht type="hidden", das
          ueberspringen Bots; stattdessen aus dem Bild geschoben. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="wl-webseite">Webseite (bitte leer lassen)</label>
        <input
          id="wl-webseite"
          name="webseite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="mt-8 grid max-w-[560px] grid-cols-1 gap-5 sm:grid-cols-2">
        <Feld
          spalten="sm:col-span-1"
          label="Vorname"
          name="vorname"
          pflicht
          autoComplete="given-name"
        />
        <Feld
          spalten="sm:col-span-1"
          label="Nachname"
          name="nachname"
          pflicht
          autoComplete="family-name"
        />
        <Feld
          spalten="sm:col-span-1"
          label="Telefon"
          name="telefon"
          type="tel"
          pflicht
          betont
          ziffern
          platzhalter="079 000 00 00"
          autoComplete="tel"
          hinweis="Damit wir Dich schnell erreichen."
        />
        <Feld
          spalten="sm:col-span-1"
          label="E-Mail"
          name="email"
          type="email"
          pflicht
          platzhalter="name@beispiel.ch"
          autoComplete="email"
          hinweis="Hierhin geht die Benachrichtigung."
        />
      </div>

      {ergebnis && "fehler" in ergebnis ? (
        <Alert variant="destructive" className="mt-6 max-w-[560px]">
          <AlertDescription>{ergebnis.fehler}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={laeuft}
          className="inline-flex min-h-13 items-center bg-brand-schwarz px-6 font-semibold text-flaeche-1 transition-colors hover:bg-brand-schwarz-weich disabled:opacity-60"
        >
          {laeuft ? "Wird eingetragen …" : "Auf Warteliste eintragen"}
        </button>
        <span className="text-sm text-grau-text">
          Kostenlos und unverbindlich.
        </span>
      </div>

      <p className="mt-6 max-w-[520px] text-[13px] leading-[1.55] text-grau-text-hell">
        Lieber gleich anrufen?{" "}
        {telefonnummern.map((nummer, index) => (
          <span key={nummer.tel}>
            {index > 0 ? " oder " : ""}
            <a
              href={`tel:${nummer.tel}`}
              className="font-semibold tabular-nums text-foreground underline-offset-4 hover:underline"
            >
              {nummer.anzeige}
            </a>
          </span>
        ))}
      </p>
    </form>
  );
}
