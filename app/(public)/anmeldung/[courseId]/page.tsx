import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/einstellungen";
import { chf, datumLang } from "@/lib/format";
import { kommendeKurse } from "@/lib/kurse";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

export const metadata: Metadata = {
  title: "Anmeldung | Haudi's Fahrschule Baden",
  robots: { index: false, follow: true },
};

/**
 * ZWISCHENLOESUNG, wird in Sprint 3 ersetzt.
 *
 * Der Anmelden-Knopf auf jeder Kurskarte zeigt hierher. Das zweistufige
 * Buchungsformular entsteht erst in Sprint 3 (PLAN.md Abschnitt 5). Bis dahin
 * darf der Knopf aber nicht ins Leere laufen: eine 404-Seite auf dem
 * wichtigsten Aufruf der Website waere schlimmer als ein ehrlicher Hinweis.
 *
 * Diese Seite nimmt keine Anmeldung entgegen. Sie zeigt den Kurs und den Weg,
 * der heute funktioniert: anrufen.
 */
export default async function AnmeldungZwischenstand({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const kurse = await kommendeKurse();
  const kurs = kurse.find((eintrag) => eintrag.id === courseId);

  if (!kurs) {
    notFound();
  }

  const [zeiten, whatsappUrl] = await Promise.all([
    oeffnungszeitenLesen(),
    whatsappLink("whatsapp.text.buchung"),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <nav aria-label="Brotkrumen" className="text-sm text-muted-foreground">
        <Link href="/kursdaten" className="underline underline-offset-4">
          Kursdaten
        </Link>
        <span aria-hidden="true"> / </span>
        <span>Anmeldung</span>
      </nav>

      <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
        {kurs.kursart.name}
      </h1>

      <div className="mt-8 border border-border bg-card p-6 sm:p-8">
        <h2 className="font-heading text-lg font-bold">Deine Kursdaten</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {kurs.termine.map((termin, index) => (
            <li
              key={`${termin.datum.toISOString()}-${termin.von}-${index}`}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2 last:border-b-0 last:pb-0"
            >
              <span className="font-medium">{datumLang(termin.datum)}</span>
              <span className="tabular-nums text-muted-foreground">
                {termin.von} bis {termin.bis} Uhr
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-6">
          <span className="text-muted-foreground">Total</span>
          <span className="font-heading text-2xl font-bold">
            {chf(kurs.naechsterPreis)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          inklusive Lehrmittel, bar am ersten Kurstag
        </p>
      </div>

      <div className="mt-8 border-l-4 border-brand-gelb bg-flaeche-2 p-6">
        <h2 className="font-heading text-xl font-bold">
          Die Online-Anmeldung kommt in Kürze
        </h2>
        <p className="mt-3 text-muted-foreground">
          Wir bauen gerade das Anmeldeformular. Bis es soweit ist, melden wir
          Dich gerne telefonisch an, das dauert zwei Minuten. Wir erreichen uns{" "}
          {zeiten.tageLang} von {zeiten.von} bis {zeiten.bis} Uhr.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {TELEFONNUMMERN.map((nummer) => (
            <a
              key={nummer.tel}
              href={`tel:${nummer.tel}`}
              className="flex min-h-14 items-center justify-between gap-4 border border-border bg-card px-5 font-heading text-lg font-bold transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-3">
                <Phone aria-hidden="true" className="size-5" />
                {nummer.anzeige}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                anrufen
              </span>
            </a>
          ))}
          <Button asChild variant="akzent">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Über WhatsApp anmelden
            </a>
          </Button>
        </div>
      </div>

      <p className="mt-8">
        <Link
          href="/kursdaten"
          className="underline underline-offset-4 hover:text-brand-rot"
        >
          Zurück zu den Kursdaten
        </Link>
      </p>
    </div>
  );
}
