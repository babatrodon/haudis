import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bildplatzhalter } from "@/components/bildplatzhalter";
import { KontaktStreifen } from "@/components/oeffentlich/kontakt-streifen";
import { Kurskarte } from "@/components/oeffentlich/kurskarte";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/einstellungen";
import { chf } from "@/lib/format";
import { aktiveKursarten, kommendeKurse, kursartNachSlug } from "@/lib/kurse";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

/**
 * Kursdetailseite.
 *
 * Nur aktive Kursarten haben eine Seite. Die Motorrad-Grundkurse A1 und A
 * stehen auf active: false, solange ihr Preis nicht schriftlich bestaetigt
 * ist, und liefern hier deshalb bewusst 404 statt einer Seite ohne Preis.
 */

export async function generateStaticParams() {
  const kursarten = await aktiveKursarten();
  return kursarten.map((kursart) => ({ slug: kursart.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kursart = await kursartNachSlug(slug);

  if (!kursart) {
    return { title: "Kurs nicht gefunden | Haudi's Fahrschule" };
  }

  return {
    title: `${kursart.name} | Haudi's Fahrschule Baden`,
    description: kursart.beschreibung.slice(0, 160),
  };
}

export default async function KursDetailSeite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kursart = await kursartNachSlug(slug);

  if (!kursart) {
    notFound();
  }

  const [kurse, zeiten, kontaktUrl] = await Promise.all([
    kursart.buchbar ? kommendeKurse({ kursartCode: kursart.code }) : [],
    oeffnungszeitenLesen(),
    whatsappLink("whatsapp.text.allgemein"),
  ]);

  const gratis = kursart.gesamtpreis.lte(0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <nav aria-label="Brotkrumen" className="text-sm text-muted-foreground">
        <Link href="/kurse" className="underline underline-offset-4">
          Kurse
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{kursart.name}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <header className="lg:col-span-2">
          <h1 className="font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
            {kursart.name}
          </h1>
          <p className="mt-5 max-w-prose text-lg text-muted-foreground">
            {kursart.beschreibung}
          </p>

          {kursart.lernfahrausweisNoetig ? (
            <p className="mt-6 border-l-4 border-brand-gelb bg-flaeche-2 p-4">
              <strong className="font-heading">Wichtig:</strong> Für diesen Kurs
              brauchst Du den Lernfahrausweis. Bring ihn am ersten Kurstag mit.
            </p>
          ) : null}

          <div className="mt-8">
            <Bildplatzhalter
              seitenverhaeltnis="16/9"
              beschreibung={`Schulungsraum an der Haselstrasse 33, wo der ${kursart.name} stattfindet`}
            />
          </div>
        </header>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-border bg-card p-6">
            <p className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Preis
            </p>
            {gratis ? (
              <>
                <p className="mt-2 font-heading text-4xl font-bold">Gratis</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keine Anmeldung nötig. Komm einfach vorbei.
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 font-heading text-4xl font-bold">
                  {chf(kursart.gesamtpreis)}
                </p>
                {kursart.materialpreis.gt(0) ? (
                  <dl className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Kursgebühr</dt>
                      <dd className="tabular-nums">
                        {chf(kursart.grundpreis)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Lehrmittel</dt>
                      <dd className="tabular-nums">
                        {chf(kursart.materialpreis)}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    inklusive Lehrmittel
                  </p>
                )}
                <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                  Betrag bitte bar am ersten Kurstag mitbringen.
                </p>
              </>
            )}

            <div className="mt-6 space-y-3">
              {kursart.buchbar ? (
                <Button asChild className="w-full">
                  <Link href="/kursdaten">Freie Daten ansehen</Link>
                </Button>
              ) : null}
              {TELEFONNUMMERN.map((nummer) => (
                <a
                  key={nummer.tel}
                  href={`tel:${nummer.tel}`}
                  className="flex min-h-12 items-center justify-center border border-border font-heading font-semibold transition-colors hover:bg-accent"
                >
                  {nummer.anzeige}
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {kursart.buchbar ? (
        <section aria-labelledby="daten-titel" className="mt-16">
          <h2
            id="daten-titel"
            className="font-heading text-3xl font-bold sm:text-4xl"
          >
            Nächste Daten
          </h2>

          {kurse.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {kurse.map((kurs) => (
                <Kurskarte key={kurs.id} kurs={kurs} />
              ))}
            </div>
          ) : (
            <p className="mt-6 border border-border bg-card p-6 text-muted-foreground">
              Für diesen Kurs ist zurzeit kein Datum ausgeschrieben. Ruf uns an,
              wir sagen Dir, wann der nächste startet, und merken Dich vor.
            </p>
          )}
        </section>
      ) : null}

      <div className="mt-16">
        <KontaktStreifen zeiten={zeiten} whatsappUrl={kontaktUrl} />
      </div>
    </div>
  );
}
