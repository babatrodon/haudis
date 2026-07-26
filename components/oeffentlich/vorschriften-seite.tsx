import { ExternalLink } from "lucide-react";
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
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <header>
        <p className="inline-block border-b-4 border-brand-gelb pb-1 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Rechtliche Grundlagen
        </p>
        <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
          {seite.titel}
        </h1>
        <p className="mt-5 max-w-prose text-lg text-muted-foreground">
          {seite.einleitung}
        </p>
      </header>

      <div className="mt-12 space-y-10">
        {seite.abschnitte.map((abschnitt) => (
          <section key={abschnitt.ueberschrift}>
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              {abschnitt.ueberschrift}
            </h2>
            <dl className="mt-6 grid gap-px border border-border bg-border">
              {abschnitt.regeln.map((regel) => (
                <div key={regel.titel} className="bg-card p-5">
                  <dt className="font-heading font-bold">{regel.titel}</dt>
                  <dd className="mt-2 text-muted-foreground">{regel.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {/* Rechtsangaben ohne Quelle sind wertlos. Wer es genau wissen muss,
          kommt mit einem Klick zur amtlichen Fassung. */}
      <section className="mt-12 border border-border bg-flaeche-2 p-6">
        <h2 className="font-heading text-lg font-bold">Quellen</h2>
        <p className="mt-2 text-sm text-muted-foreground">
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
  );
}
