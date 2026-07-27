"use client";

import { useId } from "react";

/**
 * Bausteine der Formulare im Buchungsablauf, nach
 * design/haudis-design.dc.html Screen 04.
 *
 * An einer Stelle, weil sie zweimal gebraucht werden: im Anmeldeformular und
 * im Wartelisten-Formular. Zwei Fassungen desselben Eingabefelds waeren zwei
 * Gelegenheiten, die Vorlage nur halb zu treffen.
 */

/** Rahmen und Innenabstand aller Eingaben, eins zu eins aus der Vorlage. */
export const EINGABE =
  "min-h-12 w-full min-w-0 border border-linie-stark bg-card px-3.5 py-3 text-base outline-none placeholder:text-grau-text-hell focus-visible:border-brand-schwarz focus-visible:ring-3 focus-visible:ring-brand-schwarz/15";

export function Stern() {
  return (
    <span className="text-brand-rot" aria-hidden="true">
      *
    </span>
  );
}

export type FeldProps = {
  spalten: string;
  label: string;
  pflicht?: boolean;
  name?: string;
  type?: string;
  platzhalter?: string;
  hinweis?: string;
  /** Tabellenziffern fuer Zahlen, damit Ziffern gleich breit stehen. */
  ziffern?: boolean;
  /** Kraeftigerer Rahmen, wie in der Vorlage beim Telefonfeld. */
  betont?: boolean;
  children?: (id: string) => React.ReactNode;
} & Omit<React.ComponentProps<"input">, "children" | "name" | "type">;

export function Feld({
  spalten,
  label,
  pflicht = false,
  name,
  type = "text",
  platzhalter,
  hinweis,
  ziffern = false,
  betont = false,
  children,
  ...rest
}: FeldProps) {
  const id = useId();
  const hinweisId = `${id}-hinweis`;

  return (
    <div className={spalten}>
      {/*
        Ein schlichtes label-Element, kein Flexcontainer. Die Beschriftungen
        sind kurz, aber die AGB-Zeile weiter unten ist ein ganzer Satz — und
        ein Satz in einem Flexcontainer bricht nicht um. Genau daran hing der
        waagrechte Ueberhang auf dem iPhone.
      */}
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold lg:text-sm">
        {label} {pflicht ? <Stern /> : null}
        {pflicht ? <span className="sr-only">Pflichtfeld</span> : null}
      </label>

      {children ? (
        children(id)
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={pflicht}
          placeholder={platzhalter}
          aria-describedby={hinweis ? hinweisId : undefined}
          className={`${EINGABE} ${ziffern ? "tabular-nums" : ""} ${
            betont ? "border-brand-schwarz" : ""
          }`}
          {...rest}
        />
      )}

      {hinweis ? (
        <p id={hinweisId} className="mt-1.5 text-xs text-grau-text lg:text-[13px]">
          {hinweis}
        </p>
      ) : null}
    </div>
  );
}
