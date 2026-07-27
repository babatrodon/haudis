import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { datumLang } from "@/lib/format";
import type { Konflikt } from "@/lib/admin/einsatzplan";

/**
 * Konfliktwarnung des Einsatzplans.
 *
 * Ein doppelt eingeteilter Kursleiter faellt sonst am Abend des Kurses auf,
 * vor den Teilnehmenden. Deshalb steht die Warnung ganz oben, in Rot, und
 * nennt genau, was kollidiert: wer, an welchem Tag, welche zwei Kurse und
 * welche Uhrzeiten. "Es gibt einen Konflikt" waere eine Meldung, die man
 * wegklickt; "VaSh am Di, 18.08.: VKU 18-20 gegen Nothelfer 19-22" ist eine,
 * mit der man etwas anfangen kann.
 *
 * Beide Kurse sind verlinkt, damit die Korrektur nicht mit Suchen beginnt.
 */
export function KonfliktWarnung({ konflikte }: { konflikte: Konflikt[] }) {
  if (konflikte.length === 0) return null;

  return (
    <section
      aria-labelledby="konflikt-titel"
      className="mb-6 border-2 border-ampel-rot-linie bg-ampel-rot-bg p-4 sm:p-5"
    >
      <h2
        id="konflikt-titel"
        className="flex items-center gap-2 font-heading text-lg font-bold text-ampel-rot"
      >
        <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
        {konflikte.length === 1
          ? "Eine Doppelbelegung"
          : `${konflikte.length} Doppelbelegungen`}
      </h2>

      <ul className="mt-3 flex flex-col gap-3">
        {konflikte.map((konflikt, index) => (
          <li
            key={`${konflikt.instruktor.id}-${index}`}
            className="border border-ampel-rot-linie bg-card p-3"
          >
            <p className="font-semibold">
              {konflikt.instruktor.name}{" "}
              <span className="tabular-nums">({konflikt.instruktor.kuerzel})</span>{" "}
              am {datumLang(konflikt.datum)}
            </p>
            <ul className="mt-1.5 flex flex-col gap-1 text-sm">
              <li>
                <span className="tabular-nums font-medium">
                  {konflikt.erster.von}–{konflikt.erster.bis}
                </span>{" "}
                <Link
                  href={`/admin/kurse/${konflikt.erster.kursId}`}
                  className="underline underline-offset-4"
                >
                  {konflikt.erster.kursName}
                </Link>
              </li>
              <li>
                <span className="tabular-nums font-medium">
                  {konflikt.zweiter.von}–{konflikt.zweiter.bis}
                </span>{" "}
                <Link
                  href={`/admin/kurse/${konflikt.zweiter.kursId}`}
                  className="underline underline-offset-4"
                >
                  {konflikt.zweiter.kursName}
                </Link>
              </li>
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              Die beiden Zeiten überschneiden sich. Eine der Zuweisungen muss
              geändert werden.
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
