"use client";

import { useActionState, useId, useState } from "react";
import { Bildplatzhalter } from "@/components/bildplatzhalter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ergaenzenAktion, type ErgaenzungErgebnis } from "../aktionen";

/**
 * Schritt 2, nach design/haudis-design.dc.html Screen 04.
 *
 * Links die Ausweisnummer mit Beispielbild, darunter die freiwillige
 * SMS-Erinnerung als eigener Kasten. Rechts die Buchung und die beiden
 * Knoepfe.
 *
 * Beides ist freiwillig, deshalb kann hier nichts scheitern, was die
 * Anmeldung selbst betreffen wuerde — der Platz ist seit Schritt 1 vergeben.
 */
export function ErgaenzungFormular({
  kursId,
  smsMoeglich,
  lernfahrausweisNoetig,
  zusammenfassung,
}: {
  kursId: string;
  smsMoeglich: boolean;
  lernfahrausweisNoetig: boolean;
  zusammenfassung: React.ReactNode;
}) {
  const [ergebnis, absenden, laeuft] = useActionState<
    ErgaenzungErgebnis,
    FormData
  >(ergaenzenAktion, null);

  const lfaId = useId();
  const smsId = useId();
  const [smsAn, setSmsAn] = useState(false);

  return (
    <form action={absenden}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="px-4 py-6 sm:px-8 sm:py-10 lg:border-r lg:border-flaeche-3 lg:p-12">
          <input type="hidden" name="kursId" value={kursId} />

          <h1 className="font-heading text-[28px] font-semibold leading-[1.05] tracking-[-0.025em] lg:text-[40px]">
            Lernfahrausweis und Erinnerung
          </h1>
          <p className="mt-2.5 max-w-[560px] text-sm leading-[1.6] text-grau-text lg:text-base">
            {lernfahrausweisNoetig
              ? "Für den VKU brauchen wir die Nummer deines Lernfahrausweises. Du findest sie oben rechts auf dem Ausweis."
              : "Wenn Du schon einen Lernfahrausweis hast, trag die Nummer hier ein. Du findest sie oben rechts auf dem Ausweis."}
          </p>

          {ergebnis?.fehler ? (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{ergebnis.fehler}</AlertDescription>
            </Alert>
          ) : null}

          <div className="mt-7 grid grid-cols-1 gap-6 lg:mt-9 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
            <div>
              <label
                htmlFor={lfaId}
                className="mb-1.5 block text-[13px] font-semibold lg:text-sm"
              >
                Lernfahrausweis-Nummer
              </label>
              <input
                id={lfaId}
                name="lfaNummer"
                type="text"
                inputMode="numeric"
                placeholder="z.B. 123 456 789"
                maxLength={40}
                className="min-h-12 w-full min-w-0 border border-linie-stark bg-card px-3.5 py-3 text-base tabular-nums outline-none placeholder:text-grau-text-hell focus-visible:border-brand-schwarz focus-visible:ring-3 focus-visible:ring-brand-schwarz/15"
              />
              <p className="mt-2.5 text-sm leading-[1.55] text-grau-text">
                Noch keinen Lernfahrausweis? Melde Dich trotzdem an und schick
                uns die Nummer später per WhatsApp nach.
              </p>
            </div>

            {/* Markierter Platzhalter, bis die Kundin ein echtes Bild liefert.
                Keine KI-Bilder in diesem Projekt. */}
            <figure className="lg:pt-6">
              <Bildplatzhalter
                beschreibung="Beispielbild: Lernfahrausweis"
                className="h-[150px] lg:h-[170px]"
              />
              <figcaption className="mt-2.5 border-t border-flaeche-3 pt-2.5 text-sm leading-[1.5] text-grau-text">
                So sieht der Ausweis aus. Die Nummer steht oben rechts.
              </figcaption>
            </figure>
          </div>

          {smsMoeglich ? (
            <div className="mt-8 border border-flaeche-3 lg:mt-10">
              <div className="flex items-start justify-between gap-4 p-5 lg:p-6">
                <div>
                  <p className="font-heading text-lg font-semibold">
                    SMS-Erinnerung, freiwillig
                  </p>
                  <p className="mt-1.5 max-w-[420px] text-sm leading-[1.55] text-grau-text">
                    Wir schicken Dir am Vortag um 18.00 eine SMS mit Zeit und
                    Ort.
                  </p>
                </div>

                <label
                  htmlFor={smsId}
                  className="mt-1 shrink-0 cursor-pointer"
                  aria-label="SMS-Erinnerung einschalten"
                >
                  <input
                    id={smsId}
                    name="smsErinnerung"
                    type="checkbox"
                    checked={smsAn}
                    onChange={(ereignis) => setSmsAn(ereignis.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-12 items-center border-2 border-brand-schwarz bg-card p-0.5 peer-focus-visible:ring-3 peer-focus-visible:ring-brand-schwarz/30"
                    style={smsAn ? { background: "var(--brand-gelb)" } : undefined}
                  >
                    <span
                      className="block size-5 bg-brand-schwarz transition-transform"
                      style={smsAn ? { transform: "translateX(20px)" } : undefined}
                    />
                  </span>
                </label>
              </div>

              {smsAn ? (
                <div className="border-t border-flaeche-3 p-5 lg:p-6">
                  <label
                    htmlFor="smsTelefon"
                    className="mb-1.5 block text-[13px] font-semibold lg:text-sm"
                  >
                    Mobilnummer für die SMS
                  </label>
                  <input
                    id="smsTelefon"
                    name="smsTelefon"
                    type="tel"
                    placeholder="079 000 00 00"
                    className="min-h-12 w-full min-w-0 max-w-[340px] border border-linie-stark bg-card px-3.5 py-3 text-base tabular-nums outline-none placeholder:text-grau-text-hell focus-visible:border-brand-schwarz focus-visible:ring-3 focus-visible:ring-brand-schwarz/15"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="border-t border-flaeche-3 bg-flaeche-1 px-4 py-5 sm:px-8 sm:py-8 lg:border-t-0 lg:px-10 lg:py-12">
          {zusammenfassung}

          <button
            type="submit"
            disabled={laeuft}
            className="mt-5 flex min-h-13 w-full items-center justify-center bg-brand-schwarz px-4 py-4 font-semibold text-flaeche-1 transition-colors hover:bg-brand-schwarz-weich disabled:opacity-60 lg:mt-6"
          >
            {laeuft ? "Wird gespeichert ..." : "Anmeldung abschicken"}
          </button>

          <button
            type="submit"
            name="ueberspringen"
            value="ja"
            disabled={laeuft}
            className="mt-2.5 flex min-h-13 w-full items-center justify-center border border-brand-schwarz px-4 py-4 font-semibold transition-colors hover:bg-flaeche-2 disabled:opacity-60"
          >
            Ohne Nummer abschliessen
          </button>
        </div>
      </div>
    </form>
  );
}
