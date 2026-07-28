import Image from "next/image";
import Link from "next/link";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { cn } from "@/lib/utils";

/**
 * Rahmen des Buchungsablaufs, nach design/haudis-design.dc.html Screen 04.
 *
 * Der Ablauf bekommt eine eigene, schlanke Kopfzeile statt der Navigation der
 * Website: wer angefangen hat sich anzumelden, soll den Weg zu Ende gehen und
 * nicht in der Hauptnavigation abbiegen. Eine Fusszeile gibt es hier
 * ebenfalls nicht.
 *
 * Die Schrittanzeige zeigt, wo man steht und wie weit es noch ist. Erledigte
 * Schritte sind gelb, der aktuelle schwarz, die kommenden nur umrandet.
 */

const SCHRITTE = [
  { nummer: 1, titel: "Angaben" },
  { nummer: 2, titel: "Lernfahrausweis" },
  { nummer: 3, titel: "Bestätigung" },
] as const;

export function BuchungHuelle({
  schritt,
  children,
}: {
  schritt: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  const [ersteNummer] = TELEFONNUMMERN;

  return (
    <div className="min-h-dvh bg-card">
      <header className="flex items-center justify-between gap-4 border-b border-flaeche-3 px-4 py-3 sm:px-8 lg:h-20 lg:py-0 lg:px-12">
        <Link href="/" aria-label="Zur Startseite">
          <Image
            src="/haudis-logo.png"
            alt="Haudi's Fahrschule & Verkehrsschule"
            width={1600}
            height={1073}
            priority
            className="h-9 w-auto lg:h-[52px]"
          />
        </Link>

        <div className="flex items-center gap-3 text-sm text-grau-text sm:gap-6">
          <span className="hidden sm:inline">Anmeldung Kurs</span>
          <span aria-hidden="true" className="hidden text-flaeche-3 sm:inline">
            |
          </span>
          <a
            href={`tel:${ersteNummer.tel}`}
            className="tabular-nums underline-offset-4 hover:underline"
          >
            <span className="hidden sm:inline">Fragen? </span>
            {ersteNummer.anzeige}
          </a>
        </div>
      </header>

      <nav
        aria-label="Fortschritt der Anmeldung"
        className="flex gap-2 border-b border-flaeche-3 px-4 py-3.5 sm:px-8 lg:gap-3 lg:px-12 lg:py-7"
      >
        <ol className="flex gap-2 lg:gap-3">
          {SCHRITTE.map((eintrag) => {
            const erledigt = eintrag.nummer < schritt;
            const aktiv = eintrag.nummer === schritt;

            return (
              <li key={eintrag.nummer}>
                <span
                  aria-current={aktiv ? "step" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1.5 border px-3 py-2.5 text-[13px] font-medium lg:gap-2.5 lg:px-4.5 lg:text-[15px]",
                    aktiv && "border-brand-schwarz bg-brand-schwarz text-flaeche-1",
                    erledigt && "border-brand-gelb bg-brand-gelb text-brand-schwarz",
                    !aktiv && !erledigt && "border-flaeche-3 text-grau-text",
                  )}
                >
                  <span className="font-heading font-semibold tabular-nums">
                    {eintrag.nummer}
                  </span>
                  {eintrag.titel}
                  {erledigt ? (
                    <span className="sr-only">, erledigt</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {children}
    </div>
  );
}

/**
 * Zweispaltiger Rumpf: Formular links, Zusammenfassung rechts.
 *
 * Auf dem Handy steht die Zusammenfassung unter dem Formular. Das ist keine
 * Nebensache: wer den Preis zuoberst sieht, entscheidet ueber den Preis; wer
 * ihn nach den Angaben sieht, entscheidet ueber die Anmeldung. Die Vorlage
 * legt ihn deshalb ans Ende, und die DOM-Reihenfolge gibt das her, ohne dass
 * etwas umsortiert werden muss.
 */
export function BuchungSpalten({
  formular,
  zusammenfassung,
}: {
  formular: React.ReactNode;
  zusammenfassung: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="px-4 py-6 sm:px-8 sm:py-10 lg:border-r lg:border-flaeche-3 lg:p-12">
        {formular}
      </div>
      <div className="border-t border-flaeche-3 bg-flaeche-1 px-4 py-5 sm:px-8 sm:py-8 lg:border-t-0 lg:px-10 lg:py-12">
        {zusammenfassung}
      </div>
    </div>
  );
}
