import { ChevronDown } from "lucide-react";
import { FAQ } from "@/lib/inhalte/faq";

/**
 * Haeufige Fragen als Akkordeon.
 *
 * Bewusst mit den nativen Elementen details und summary statt mit einer
 * JavaScript-Komponente: das funktioniert ohne Client-Bundle, ist von Haus aus
 * per Tastatur bedienbar, wird von Screenreadern korrekt angesagt und die
 * Antworten stehen im HTML, also auch fuer die Suchmaschine.
 */
export function FaqListe() {
  return (
    <div className="border border-border bg-card">
      {FAQ.map((eintrag) => (
        <details
          key={eintrag.frage}
          className="group border-b border-border last:border-b-0"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 p-5 font-heading font-semibold transition-colors hover:bg-flaeche-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
            {eintrag.frage}
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="px-5 pb-5 text-muted-foreground">
            {eintrag.antwort}
          </div>
        </details>
      ))}
    </div>
  );
}
