import type { Metadata } from "next";
import Link from "next/link";
import { KontaktStreifen } from "@/components/oeffentlich/kontakt-streifen";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/einstellungen";
import { chf } from "@/lib/format";
import { aktiveKursarten, type KursartOeffentlich } from "@/lib/kurse";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

export const metadata: Metadata = {
  title: "Kurse | Haudi's Fahrschule Baden",
  description:
    "Verkehrskundeunterricht, Nothelferkurs, Basis-Theorieunterricht, Bögle und Motorrad-Grundkurse in Baden. Preise und Ablauf im Überblick.",
};

export default async function KurseSeite() {
  const [kursarten, zeiten, kontaktUrl] = await Promise.all([
    aktiveKursarten(),
    oeffnungszeitenLesen(),
    whatsappLink("whatsapp.text.allgemein"),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <header className="max-w-3xl">
        <p className="inline-block border-b-4 border-brand-gelb pb-1 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Unser Angebot
        </p>
        <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
          Kurse
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Alles, was Du für den Führerausweis brauchst, bei uns an der
          Haselstrasse 33 in Baden. Die aktuellen Daten findest Du bei den
          Kursdaten.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/kursdaten">Zu den Kursdaten</Link>
          </Button>
        </div>
      </header>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {kursarten.map((kursart) => (
          <KursartKarte key={kursart.id} kursart={kursart} />
        ))}
      </div>

      <div className="mt-16">
        <KontaktStreifen zeiten={zeiten} whatsappUrl={kontaktUrl} />
      </div>
    </div>
  );
}

function KursartKarte({ kursart }: { kursart: KursartOeffentlich }) {
  const gratis = kursart.gesamtpreis.lte(0);

  return (
    <article className="flex flex-col border border-border bg-card">
      <div className="flex-1 p-6">
        <h2 className="font-heading text-xl font-bold">{kursart.name}</h2>
        <p className="mt-3 text-muted-foreground">{kursart.beschreibung}</p>

        {kursart.lernfahrausweisNoetig ? (
          <p className="mt-4 border-l-4 border-brand-gelb pl-3 text-sm text-muted-foreground">
            Lernfahrausweis erforderlich
          </p>
        ) : null}
      </div>

      <div className="border-t border-border p-6">
        {gratis ? (
          <p className="font-heading text-2xl font-bold">Gratis</p>
        ) : (
          <>
            <p className="font-heading text-2xl font-bold">
              {chf(kursart.gesamtpreis)}
            </p>
            {kursart.materialpreis.gt(0) ? (
              <p className="text-sm text-muted-foreground">
                {chf(kursart.grundpreis)} Kursgebühr und{" "}
                {chf(kursart.materialpreis)} Lehrmittel
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                inklusive Lehrmittel
              </p>
            )}
          </>
        )}

        <p className="mt-3 text-sm text-muted-foreground">
          {!kursart.buchbar
            ? "Keine Anmeldung nötig, komm einfach vorbei."
            : kursart.anzahlKommendeKurse > 0
              ? `${kursart.anzahlKommendeKurse} ${kursart.anzahlKommendeKurse === 1 ? "Kurs ausgeschrieben" : "Kurse ausgeschrieben"}`
              : "Aktuell keine Daten ausgeschrieben"}
        </p>

        <Button asChild variant="outline" className="mt-4 w-full">
          <Link href={`/kurse/${kursart.slug}`}>Mehr erfahren</Link>
        </Button>
      </div>
    </article>
  );
}
