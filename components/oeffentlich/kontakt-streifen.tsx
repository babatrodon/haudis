import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";
import type { Oeffnungszeiten } from "@/lib/oeffnungszeiten";

/**
 * Kontakt-Strip fuer den Abschluss einer Seite.
 *
 * Geschaeftsregel 6: beide Nummern, beide als tel:-Link. Die Nummern stehen
 * gross und nebeneinander, nicht versteckt im Fliesstext - wer hier ankommt,
 * will anrufen.
 */
export function KontaktStreifen({
  zeiten,
  whatsappUrl,
}: {
  zeiten: Oeffnungszeiten;
  whatsappUrl: string;
}) {
  return (
    <section
      aria-labelledby="kontakt-streifen-titel"
      className="border border-border bg-brand-schwarz p-8 text-flaeche-1 sm:p-12"
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <h2
            id="kontakt-streifen-titel"
            className="font-heading text-3xl font-bold"
          >
            Fragen? Ruf uns an.
          </h2>
          <p className="mt-3 max-w-prose text-flaeche-3">
            Wir beraten Dich gerne persönlich, {zeiten.tageLang} von{" "}
            {zeiten.von} bis {zeiten.bis} Uhr. Du erreichst uns auf beiden
            Nummern.
          </p>
          <p className="mt-3 text-sm text-flaeche-3">
            {ADRESSE.strasse}, {ADRESSE.plz} {ADRESSE.ort} · 350 m vom Bahnhof
            Baden
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {TELEFONNUMMERN.map((nummer) => (
            <a
              key={nummer.tel}
              href={`tel:${nummer.tel}`}
              className="flex min-h-14 items-center justify-between gap-4 border border-flaeche-3/30 bg-brand-schwarz-weich px-5 font-heading text-xl font-bold transition-colors hover:bg-brand-gelb hover:text-brand-schwarz"
            >
              <span className="flex items-center gap-3">
                <Phone aria-hidden="true" className="size-5" />
                {nummer.anzeige}
              </span>
              <span className="text-sm font-normal opacity-70">anrufen</span>
            </a>
          ))}

          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild variant="akzent">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                Über WhatsApp schreiben
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-flaeche-3/40 bg-transparent text-flaeche-1 hover:bg-brand-schwarz-weich hover:text-flaeche-1"
            >
              <a href={`mailto:${ADRESSE.email}`}>{ADRESSE.email}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
