import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { Preisbox } from "@/components/oeffentlich/preisbox";
import { Button } from "@/components/ui/button";
import { datumLang } from "@/lib/format";
import { kommendeKurse } from "@/lib/kurse";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { AnmeldeFormular } from "./anmelde-formular";

export const metadata: Metadata = {
  title: "Anmeldung | Haudi's Fahrschule Baden",
  robots: { index: false, follow: true },
};

/**
 * Schritt 1 der Anmeldung.
 *
 * Die Kapazitaet wird hier erneut geprueft, obwohl die Kurskarte den Knopf bei
 * einem vollen Kurs schon ausblendet: ueber einen Direktlink oder einen alten
 * Tab kommt man sonst in ein Formular, das beim Abschicken scheitert. Die
 * eigentliche Absicherung sitzt in der Transaktion in lib/buchung.ts, das hier
 * erspart der Kundin nur den vergeblichen Weg.
 */
export default async function AnmeldungSchritt1({
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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <nav aria-label="Brotkrumen" className="text-sm text-muted-foreground">
        <Link href="/kursdaten" className="underline underline-offset-4">
          Kursdaten
        </Link>
        <span aria-hidden="true"> / </span>
        <span>Anmeldung</span>
      </nav>

      <header className="mt-6">
        <p className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Schritt 1 von 2
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
          Anmeldung {kurs.kursart.name}
        </h1>
      </header>

      {kurs.verfuegbarkeit.buchbar ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <div className="order-2 border border-border bg-card p-6 sm:p-8 lg:order-1">
            <AnmeldeFormular kursId={kurs.id} />
          </div>

          <aside className="order-1 space-y-6 lg:order-2 lg:sticky lg:top-24">
            <Termine kurs={kurs} />
            <Preisbox
              kursgebuehr={kurs.preis}
              lehrmittel={kurs.materialpreis}
              regulaer={kurs.gesamtpreis}
              total={kurs.naechsterPreis}
              fruehbucher={kurs.naechsterPreis.lt(kurs.gesamtpreis)}
              fruehbucherPlaetzeFrei={kurs.fruehbucherPlaetzeFrei}
              lernfahrausweisNoetig={kurs.kursart.lernfahrausweisNoetig}
            />
          </aside>
        </div>
      ) : (
        <Ausgebucht />
      )}
    </div>
  );
}

function Termine({ kurs }: { kurs: Awaited<ReturnType<typeof kommendeKurse>>[number] }) {
  return (
    <div className="border border-border bg-card">
      <div className="border-b border-flaeche-3 p-5">
        <h2 className="font-heading text-lg font-bold">Deine Termine</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {kurs.termine.length}{" "}
          {kurs.termine.length === 1 ? "Termin" : "Termine"}, alle besuchen
        </p>
      </div>
      <ul className="p-5 text-sm">
        {kurs.termine.map((termin, index) => (
          <li
            key={`${termin.datum.toISOString()}-${termin.von}-${index}`}
            className="flex flex-wrap items-baseline justify-between gap-2 border-b border-flaeche-3 pb-2 last:border-b-0 last:pb-0 [&:not(:first-child)]:pt-2"
          >
            <span className="font-medium">{datumLang(termin.datum)}</span>
            <span className="tabular-nums text-muted-foreground">
              {termin.von} bis {termin.bis} Uhr
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Geschaeftsregel 2: bei null freien Plaetzen keine Anmeldung. Statt eines
 * gesperrten Formulars der Weg, der funktioniert. Die Warteliste kommt in
 * Welle 2.
 */
function Ausgebucht() {
  return (
    <div className="mt-10 border border-border bg-card p-8">
      <h2 className="font-heading text-2xl font-bold">
        Dieser Kurs ist ausgebucht
      </h2>
      <p className="mt-3 max-w-prose text-muted-foreground">
        Die Plätze sind vergeben. Ruf uns an, wir sagen Dir, wann der nächste
        Kurs startet, und merken Dich vor.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {TELEFONNUMMERN.map((nummer) => (
          <a
            key={nummer.tel}
            href={`tel:${nummer.tel}`}
            className="inline-flex min-h-12 items-center gap-3 border border-border px-5 font-heading font-bold transition-colors hover:bg-accent"
          >
            <Phone aria-hidden="true" className="size-5" />
            {nummer.anzeige}
          </a>
        ))}
      </div>
      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/kursdaten">Andere Kursdaten ansehen</Link>
        </Button>
      </div>
    </div>
  );
}
