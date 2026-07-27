import { FAQ } from "@/lib/inhalte/faq";

/**
 * Akkordeon der haeufigen Fragen, nach design/haudis-design.dc.html Screen 02.
 *
 * details/summary statt eines Zustands in React: das Auf- und Zuklappen
 * funktioniert damit ohne JavaScript, die Tastaturbedienung bringt der Browser
 * mit, und die Antworten stehen im HTML — was fuer die Suche zaehlt.
 *
 * Der erste Eintrag ist offen, wie in der Vorlage. Er beantwortet die Frage,
 * die am haeufigsten gestellt wird, und zeigt nebenbei, dass sich die anderen
 * ebenfalls oeffnen lassen.
 */
export function FaqListe({
  preise,
}: {
  /** Betraege aus den Einstellungen, damit sie nur an einer Stelle stehen. */
  preise: Record<string, string>;
}) {
  return (
    <div className="border-t border-flaeche-3">
      {FAQ.map((eintrag, index) => (
        <details
          key={eintrag.frage}
          name="faq"
          open={index === 0}
          className="group border-b border-flaeche-3 open:bg-flaeche-1"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 font-heading text-base font-semibold marker:content-none sm:px-5 sm:text-[17px]">
            {eintrag.frage}
            {/* Plus und Minus statt eines Pfeils, wie in der Vorlage. Das
                Quadrat ist 28px gross und liegt in einer Zeile von mindestens
                56px, die als Ganzes anklickbar ist. */}
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center bg-brand-gelb text-lg font-semibold leading-none text-brand-schwarz"
            >
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <p className="px-4 pb-5 text-[15px] leading-[1.6] text-grau-text sm:px-5">
            {platzhalterErsetzen(eintrag.antwort, preise)}
          </p>
        </details>
      ))}
    </div>
  );
}

/**
 * Setzt die Betraege aus den Einstellungen in den Text.
 *
 * Ein Preis, der fest im Antworttext steht, veraltet still: die Preisseite
 * zeigt dann den neuen Wert und die Antwort den alten. Fehlt ein Wert, steht
 * "auf Anfrage" statt einer Luecke — dieselbe Sprachregelung wie auf der
 * Fahrstundenseite.
 */
function platzhalterErsetzen(
  text: string,
  preise: Record<string, string>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    return preise[name] ?? "auf Anfrage";
  });
}
