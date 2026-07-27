import { ExternalLink } from "lucide-react";
import { SeitenKopf } from "@/components/oeffentlich/seiten-kopf";
import {
  VORSCHRIFTEN_GEPRUEFT_AM,
  type Vorschriftenseite,
} from "@/lib/inhalte/vorschriften";

/**
 * Gemeinsame Darstellung fuer /vorschriften/auto und /vorschriften/motorrad.
 * Beide Seiten haben denselben Aufbau, nur andere Inhalte.
 */
export function VorschriftenSeite({ seite }: { seite: Vorschriftenseite }) {
  return (
    <div className="bg-card">
      <div className="mx-auto w-full max-w-[900px] px-4 py-12 sm:px-6 lg:py-16">
      <SeitenKopf bezeichnung="Rechtliche Grundlagen" titel={seite.titel}>
        {seite.einleitung}
      </SeitenKopf>

      <div className="mt-12 space-y-10">
        {seite.abschnitte.map((abschnitt) => (
          <section key={abschnitt.ueberschrift}>
            <h2 className="font-heading text-2xl font-semibold sm:text-[30px]">
              {abschnitt.ueberschrift}
            </h2>
            <dl className="mt-6 grid grid-cols-1 gap-px border border-border bg-border">
              {abschnitt.regeln.map((regel) => (
                <div key={regel.titel} className="bg-card p-5">
                  <dt className="font-heading font-semibold">{regel.titel}</dt>
                  <dd className="mt-2 leading-[1.6] text-grau-text">
                    {regel.text}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {/* Rechtsangaben ohne Quelle sind wertlos. Wer es genau wissen muss,
          kommt mit einem Klick zur amtlichen Fassung. */}
      <section className="mt-12 border border-flaeche-3 bg-flaeche-1 p-6">
        <h2 className="font-heading text-lg font-semibold">Quellen</h2>
        <p className="mt-2 text-sm leading-[1.6] text-grau-text">
          Geprüft am {VORSCHRIFTEN_GEPRUEFT_AM}. Verbindlich sind immer die
          Angaben der Behörden. Im Zweifel fragst Du beim Strassenverkehrsamt
          nach oder rufst uns an.
        </p>
        <ul className="mt-4 space-y-2">
          {seite.quellen.map((quelle) => (
            <li key={quelle.href}>
              <a
                href={quelle.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-2 text-sm underline underline-offset-4 hover:text-brand-rot"
              >
                {quelle.text}
                <ExternalLink aria-hidden="true" className="size-4" />
                <span className="sr-only">(öffnet in neuem Tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </div>
  );
}
