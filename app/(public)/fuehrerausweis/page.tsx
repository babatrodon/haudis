import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { KontaktStreifen } from "@/components/oeffentlich/kontakt-streifen";
import { SeitenKopf } from "@/components/oeffentlich/seiten-kopf";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/einstellungen";
import {
  FUEHRERAUSWEIS_EINLEITUNG,
  SCHRITTE,
  type Schritt,
} from "@/lib/inhalte/fuehrerausweis";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

export const metadata: Metadata = {
  title: "In sieben Schritten zum Führerausweis | Haudi's Fahrschule",
  description:
    "Vom Nothelferkurs über das Gesuch und die Theorieprüfung bis zum WAB-Kurs: der ganze Weg zum Führerausweis, Schritt für Schritt erklärt.",
};

export default async function FuehrerausweisSeite() {
  const [zeiten, kontaktUrl] = await Promise.all([
    oeffnungszeitenLesen(),
    whatsappLink("whatsapp.text.allgemein"),
  ]);

  return (
    <div className="bg-card">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
      <SeitenKopf
        bezeichnung="Dein Weg"
        titel="In sieben Schritten zum Führerausweis"
      >
        {FUEHRERAUSWEIS_EINLEITUNG}
      </SeitenKopf>
      <div className="mt-7 flex flex-wrap gap-3">
        {TELEFONNUMMERN.map((nummer) => (
          <a
            key={nummer.tel}
            href={`tel:${nummer.tel}`}
            className="inline-flex min-h-12 items-center border border-brand-schwarz px-5 font-semibold tabular-nums transition-colors hover:bg-flaeche-2"
          >
            {nummer.anzeige}
          </a>
        ))}
      </div>

      <ol className="mt-14 space-y-6">
        {SCHRITTE.map((schritt) => (
          <SchrittKarte key={schritt.nummer} schritt={schritt} />
        ))}
      </ol>

      <div className="mt-16">
        <KontaktStreifen zeiten={zeiten} whatsappUrl={kontaktUrl} />
      </div>
      </div>
    </div>
  );
}

function SchrittKarte({ schritt }: { schritt: Schritt }) {
  return (
    <li className="border border-border bg-card">
      <div className="flex gap-5 p-6 sm:gap-6 sm:p-8">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center bg-brand-schwarz font-heading text-xl font-bold text-flaeche-1"
        >
          {schritt.nummer}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-xl font-bold sm:text-2xl">
              <span className="sr-only">Schritt {schritt.nummer}: </span>
              {schritt.titel}
            </h2>
            {schritt.badge ? (
              <span className="bg-brand-gelb px-2 py-1 font-heading text-xs font-bold uppercase tracking-wider text-brand-schwarz">
                {schritt.badge}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-muted-foreground">{schritt.text}</p>

          {schritt.gutschein ? (
            <div className="mt-5 border-l-4 border-brand-gelb bg-flaeche-2 p-4">
              <p className="text-sm">{schritt.gutschein.text}</p>
              <p className="mt-2 font-heading text-sm font-semibold">
                Gutscheincode:{" "}
                <span className="bg-brand-gelb px-2 py-1 font-mono text-base tracking-wider text-brand-schwarz">
                  {schritt.gutschein.code}
                </span>
              </p>
            </div>
          ) : null}

          {schritt.aktionen ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {schritt.aktionen.map((aktion) => (
                <Button
                  key={aktion.href}
                  asChild
                  variant={aktion.betont ? "default" : "outline"}
                  // Die Beschriftungen hier sind ganze Sätze ("Zum
                  // Strassenverkehrsamt Aargau"). Auf 390px müssen sie
                  // umbrechen dürfen, sonst ragt der Knopf aus der Seite.
                  className="h-auto min-h-12 whitespace-normal py-3 text-left"
                >
                  {aktion.extern ? (
                    <a
                      href={aktion.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {aktion.text}
                      <ExternalLink aria-hidden="true" className="size-4" />
                      <span className="sr-only">(öffnet in neuem Tab)</span>
                    </a>
                  ) : (
                    <Link href={aktion.href}>{aktion.text}</Link>
                  )}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
