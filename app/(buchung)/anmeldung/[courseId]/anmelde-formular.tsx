"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EINGABE, Feld, Stern } from "@/components/buchung/formularfeld";
import { anmeldenAktion, type AnmeldeErgebnis } from "./aktionen";

/**
 * Schritt 1 der Anmeldung, nach design/haudis-design.dc.html Screen 04.
 *
 * Genau die Felder aus Geschaeftsregel 1: kein Kanton, kein Konto, kein
 * Passwort. Gesendet wird als gewoehnliches Formular an eine Server Action,
 * damit es auch ohne JavaScript funktioniert.
 *
 * Das Raster hat sechs Spalten wie in der Vorlage. Auf dem Handy stehen die
 * Felder untereinander, mit einer Ausnahme: PLZ und Ort teilen sich eine
 * Zeile, weil eine vierstellige Zahl keine ganze Zeile braucht und die beiden
 * zusammengehoeren.
 *
 * Die Zusammenfassung wird als Prop hereingereicht und steht innerhalb des
 * form-Elements. Nur so kann der Absendeknopf in der rechten Spalte sitzen und
 * trotzdem dieses Formular abschicken.
 */
export function AnmeldeFormular({
  kursId,
  titel,
  einleitung,
  zusammenfassung,
  einladungsToken,
}: {
  kursId: string;
  titel: string;
  einleitung: string;
  zusammenfassung: React.ReactNode;
  /**
   * Einladung von der Warteliste. Reist als verstecktes Feld mit, damit die
   * Action den reservierten Platz einloesen kann — die Adresszeile hat sie
   * nicht.
   */
  einladungsToken?: string;
}) {
  const [ergebnis, absenden, laeuft] = useActionState<
    AnmeldeErgebnis,
    FormData
  >(anmeldenAktion, null);

  return (
    <form action={absenden}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="px-4 py-6 sm:px-8 sm:py-10 lg:border-r lg:border-flaeche-3 lg:p-12">
          <h1 className="font-heading text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] lg:text-[40px]">
            {titel}
          </h1>
          <p className="mt-2.5 max-w-[520px] text-sm leading-[1.55] text-grau-text lg:text-base lg:leading-[1.6]">
            {einleitung} Felder mit <Stern /> sind Pflicht.
          </p>

          <input type="hidden" name="kursId" value={kursId} />
          {einladungsToken ? (
            <input
              type="hidden"
              name="einladungsToken"
              value={einladungsToken}
            />
          ) : null}

          {/*
            Honigtopf. Nicht type="hidden", das ueberspringen Bots. Abseits
            positioniert, aus der Tabreihenfolge genommen und fuer Screenreader
            ausgeblendet, damit kein Mensch es je sieht oder ausfuellt.
          */}
          <div
            aria-hidden="true"
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
          >
            <label htmlFor="webseite">Webseite (bitte leer lassen)</label>
            <input
              id="webseite"
              name="webseite"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>

          {ergebnis?.fehler ? (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{ergebnis.fehler}</AlertDescription>
            </Alert>
          ) : null}

          <div className="mt-6 grid grid-cols-6 gap-4 lg:mt-9 lg:gap-5">
            <Feld spalten="col-span-6 lg:col-span-2" label="Anrede">
              {(id) => (
                <select
                  id={id}
                  name="anrede"
                  required
                  defaultValue=""
                  className={EINGABE}
                >
                  <option value="" disabled>
                    Bitte wählen
                  </option>
                  <option value="Frau">Frau</option>
                  <option value="Herr">Herr</option>
                </select>
              )}
            </Feld>

            <Feld
              spalten="col-span-6 lg:col-span-2"
              label="Nachname"
              pflicht
              name="nachname"
              autoComplete="family-name"
            />
            <Feld
              spalten="col-span-6 lg:col-span-2"
              label="Vorname"
              pflicht
              name="vorname"
              autoComplete="given-name"
            />
            <Feld
              spalten="col-span-6 lg:col-span-4"
              label="Strasse und Nummer"
              pflicht
              name="strasse"
              autoComplete="street-address"
            />
            <Feld
              spalten="col-span-2 lg:col-span-2"
              label="PLZ"
              pflicht
              name="plz"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={4}
              platzhalter="5400"
              ziffern
            />
            <Feld
              spalten="col-span-4 lg:col-span-3"
              label="Ort"
              pflicht
              name="ort"
              autoComplete="address-level2"
              platzhalter="Baden"
            />
            <Feld
              spalten="col-span-6 lg:col-span-3"
              label="Geburtsdatum"
              pflicht
              name="geburtsdatum"
              type="date"
              autoComplete="bday"
              ziffern
            />
            <Feld
              spalten="col-span-6 lg:col-span-3"
              label="Telefon"
              pflicht
              name="telefon"
              type="tel"
              autoComplete="tel"
              platzhalter="079 000 00 00"
              ziffern
              betont
              hinweis="Pflicht: wir melden uns bei Änderungen am Kurs."
            />
            <Feld
              spalten="col-span-6 lg:col-span-3"
              label="E-Mail"
              pflicht
              name="email"
              type="email"
              autoComplete="email"
              platzhalter="name@beispiel.ch"
            />

            <div className="col-span-6 mt-1 border-t border-flaeche-3 pt-4.5 lg:pt-6">
              <AgbZeile />
            </div>
          </div>
        </div>

        <div className="border-t border-flaeche-3 bg-flaeche-1 px-4 py-5 sm:px-8 sm:py-8 lg:border-t-0 lg:px-10 lg:py-12">
          {zusammenfassung}
          <button
            type="submit"
            disabled={laeuft}
            className="mt-5 flex min-h-13 w-full items-center justify-center bg-brand-schwarz px-4 py-4 font-semibold text-flaeche-1 transition-colors hover:bg-brand-schwarz-weich disabled:opacity-60 lg:mt-6"
          >
            {laeuft ? "Wird gesendet ..." : "Weiter zu Schritt 2"}
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * AGB-Bestaetigung.
 *
 * Eine Zeile, ausgerichtet an der Oberkante: Kaestchen links, Satz rechts.
 * Das echte Kaestchen liegt unsichtbar darunter und traegt den Zustand — so
 * bleibt die Tastaturbedienung erhalten, und der sichtbare Kasten kann
 * aussehen wie in der Vorlage.
 *
 * Die Tippflaeche ist die ganze Zeile, nicht nur das Kaestchen.
 */
function AgbZeile() {
  const id = useId();
  const [akzeptiert, setAkzeptiert] = useState(false);

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 py-1 text-sm leading-[1.5] text-grau-text lg:text-[15px]"
    >
      <input
        id={id}
        name="agb"
        type="checkbox"
        required
        checked={akzeptiert}
        onChange={(ereignis) => setAkzeptiert(ereignis.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center border-2 border-brand-schwarz bg-card peer-focus-visible:ring-3 peer-focus-visible:ring-brand-schwarz/30"
        style={akzeptiert ? { background: "var(--brand-gelb)" } : undefined}
      >
        {akzeptiert ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7.5L5.5 11L12 3"
              stroke="#121212"
              strokeWidth="2.4"
              strokeLinecap="square"
            />
          </svg>
        ) : null}
      </span>
      <span>
        Ich akzeptiere die{" "}
        <Link
          href="/agb"
          target="_blank"
          className="font-semibold text-foreground [border-bottom:2px_solid_var(--brand-gelb)]"
        >
          AGB
        </Link>{" "}
        und die{" "}
        <Link
          href="/datenschutz"
          target="_blank"
          className="font-semibold text-foreground [border-bottom:2px_solid_var(--brand-gelb)]"
        >
          Datenschutzerklärung
        </Link>
        . <Stern />
      </span>
    </label>
  );
}
