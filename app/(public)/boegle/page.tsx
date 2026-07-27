import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { KontaktStreifen } from "@/components/oeffentlich/kontakt-streifen";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/einstellungen";
import { BOEGLE_FRAGEN } from "@/lib/inhalte/boegle-fragen";
import { EXTERNE_LINKS } from "@/lib/inhalte/links";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";
import { Quiz } from "./quiz";

export const metadata: Metadata = {
  title: "Bögle: gratis Theorie üben | Haudi's Fahrschule Baden",
  description:
    "Jeden Montag von 19 bis 21 Uhr üben wir gemeinsam die Theorieprüfung. Gratis und ohne Anmeldung. Dazu 20 Übungsfragen zum Selbertesten.",
};

/**
 * Boegle: Infoseite plus Uebungsquiz.
 *
 * Die Zahlen zur Theoriepruefung stammen vom Kanton Aargau (geprueft
 * 26.07.2026): 50 Fragen, 45 Minuten, 150 Punkte, bestanden ab 135 Punkten,
 * also hoechstens 15 Fehlerpunkte.
 */
export default async function BoegleSeite() {
  const [zeiten, kontaktUrl] = await Promise.all([
    oeffnungszeitenLesen(),
    whatsappLink("whatsapp.text.allgemein"),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <header>
        <p className="inline-block border-b-4 border-brand-gelb pb-1 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Gratis und ohne Anmeldung
        </p>
        <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
          Bögle
        </h1>
        <p className="mt-5 max-w-prose text-lg text-muted-foreground">
          Jeden Montag von 19 bis 21 Uhr üben wir zusammen die
          Theorieprüfungsfragen. Du kommst einfach vorbei, ohne Anmeldung und
          ohne Kosten. Wir gehen die Fragen durch, die Dir Mühe machen, und
          erklären, warum eine Antwort stimmt.
        </p>
      </header>

      <section
        aria-labelledby="pruefung-titel"
        className="mt-12 border border-border bg-card p-6 sm:p-8"
      >
        <h2 id="pruefung-titel" className="font-heading text-2xl font-bold">
          Die Theorieprüfung in Zahlen
        </h2>
        <dl className="mt-6 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
          <Kennzahl wert="50" text="Fragen mit je drei Antwortmöglichkeiten" />
          <Kennzahl wert="45" text="Minuten Zeit" />
          <Kennzahl wert="150" text="Punkte sind maximal möglich" />
          <Kennzahl
            wert="135"
            text="Punkte brauchst Du, also höchstens 15 Fehlerpunkte"
          />
        </dl>
        <p className="mt-6 text-sm text-muted-foreground">
          Fehler zählen unterschiedlich schwer, von einem bis fünf Punkten. In
          welchen Sprachen die Prüfung angeboten wird, hängt vom Kanton ab, das
          erfährst Du beim Strassenverkehrsamt.
        </p>
        <div className="mt-5">
          <Button asChild variant="outline">
            <a
              href={EXTERNE_LINKS.basisTheoriepruefungAargau}
              target="_blank"
              rel="noopener noreferrer"
            >
              Angaben des Kantons Aargau
              <ExternalLink aria-hidden="true" className="size-4" />
              <span className="sr-only">(öffnet in neuem Tab)</span>
            </a>
          </Button>
        </div>
      </section>

      <section aria-labelledby="quiz-titel" className="mt-16">
        <h2
          id="quiz-titel"
          className="font-heading text-3xl font-bold sm:text-4xl"
        >
          Teste Dich selbst
        </h2>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Zwanzig Übungsfragen zu Regeln, die wir im Bögle ohnehin durchgehen.
        </p>
        <p className="mt-3 max-w-prose border-l-4 border-brand-gelb pl-4 text-sm text-muted-foreground">
          Das sind unsere eigenen Übungsfragen, keine Originalfragen der
          Prüfung. Sie zeigen Dir, wo Du stehst, ersetzen aber das offizielle
          Lernmaterial nicht.
        </p>

        <div className="mt-8">
          <Quiz fragen={BOEGLE_FRAGEN} />
        </div>
      </section>

      <section
        aria-labelledby="btu-titel"
        className="mt-16 border border-border bg-flaeche-2 p-6 sm:p-8"
      >
        <h2 id="btu-titel" className="font-heading text-2xl font-bold">
          Mehr als Üben: der Basis-Theorieunterricht
        </h2>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Wenn Du die Theorie systematisch aufbauen willst, ist der BTU der
          richtige Weg. Dienstag und Mittwoch von 19 bis 21 Uhr, inklusive
          Lehrmittel.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/kurse/btu">Zum Basis-Theorieunterricht</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/kursdaten">Kursdaten ansehen</Link>
          </Button>
        </div>
      </section>

      <div className="mt-16">
        <KontaktStreifen zeiten={zeiten} whatsappUrl={kontaktUrl} />
      </div>
    </div>
  );
}

function Kennzahl({ wert, text }: { wert: string; text: string }) {
  return (
    <div className="bg-card p-5">
      <dt className="font-heading text-4xl font-bold tabular-nums">{wert}</dt>
      <dd className="mt-1 text-sm text-muted-foreground">{text}</dd>
    </div>
  );
}
