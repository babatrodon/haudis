import type { Metadata } from "next";
import Link from "next/link";
import { KontaktStreifen } from "@/components/oeffentlich/kontakt-streifen";
import { Kurskarte } from "@/components/oeffentlich/kurskarte";
import { whatsappLink } from "@/lib/einstellungen";
import { cn } from "@/lib/utils";
import { aktiveKursarten, kommendeKurse } from "@/lib/kurse";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

export const metadata: Metadata = {
  title: "Kursdaten | Haudi's Fahrschule Baden",
  description:
    "Alle ausgeschriebenen Kursdaten mit Terminen, Preis und freien Plätzen. VKU, Nothelferkurs, Basis-Theorieunterricht und Motorrad-Grundkurse in Baden.",
};

/**
 * Kursdaten mit Filter nach Kursart.
 *
 * Der Filter laeuft ueber einen Suchparameter und normale Links, nicht ueber
 * JavaScript. Damit funktioniert er ohne Client-Bundle, jede Auswahl hat eine
 * eigene Adresse zum Teilen, und die Suchmaschine sieht alle Varianten.
 */
export default async function KursdatenSeite({
  searchParams,
}: {
  searchParams: Promise<{ art?: string }>;
}) {
  const { art } = await searchParams;
  const kursarten = await aktiveKursarten();

  // Nur buchbare Kursarten taugen als Filter. Boegle hat keine Daten.
  const filterbar = kursarten.filter((kursart) => kursart.buchbar);
  const gewaehlt = filterbar.find((kursart) => kursart.code === art);

  const [kurse, zeiten, kontaktUrl] = await Promise.all([
    kommendeKurse(gewaehlt ? { kursartCode: gewaehlt.code } : {}),
    oeffnungszeitenLesen(),
    whatsappLink("whatsapp.text.allgemein"),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <header className="max-w-3xl">
        <p className="inline-block border-b-4 border-brand-gelb pb-1 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Termine
        </p>
        <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
          Kursdaten
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Alle ausgeschriebenen Kurse mit Terminen, Preis und freien Plätzen.
          Anmelden kannst Du direkt hier.
        </p>
      </header>

      <nav aria-label="Nach Kursart filtern" className="mt-10">
        <ul className="flex flex-wrap gap-2">
          <li>
            <FilterLink href="/kursdaten" aktiv={!gewaehlt}>
              Alle Kurse
            </FilterLink>
          </li>
          {filterbar.map((kursart) => (
            <li key={kursart.code}>
              <FilterLink
                href={`/kursdaten?art=${kursart.code}`}
                aktiv={gewaehlt?.code === kursart.code}
              >
                {kursart.name}
              </FilterLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10">
        {kurse.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {kurse.length} {kurse.length === 1 ? "Kurs" : "Kurse"}
              {gewaehlt ? ` in der Kategorie ${gewaehlt.name}` : ""}
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {kurse.map((kurs) => (
                <Kurskarte key={kurs.id} kurs={kurs} />
              ))}
            </div>
          </>
        ) : (
          <div className="border border-border bg-card p-8">
            <h2 className="font-heading text-xl font-bold">
              Keine Daten ausgeschrieben
            </h2>
            <p className="mt-3 max-w-prose text-muted-foreground">
              {gewaehlt
                ? `Für ${gewaehlt.name} ist zurzeit kein Termin ausgeschrieben.`
                : "Zurzeit ist kein Kurs ausgeschrieben."}{" "}
              Ruf uns an, wir sagen Dir, wann der nächste startet, und merken
              Dich vor.
            </p>
            {gewaehlt ? (
              <p className="mt-4">
                <Link
                  href="/kursdaten"
                  className="underline underline-offset-4 hover:text-brand-rot"
                >
                  Alle Kursdaten ansehen
                </Link>
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-16">
        <KontaktStreifen zeiten={zeiten} whatsappUrl={kontaktUrl} />
      </div>
    </div>
  );
}

function FilterLink({
  href,
  aktiv,
  children,
}: {
  href: string;
  aktiv: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={aktiv ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center border px-4 text-sm font-medium transition-colors",
        aktiv
          ? "border-brand-schwarz bg-brand-schwarz text-flaeche-1"
          : "border-border bg-card hover:bg-accent",
      )}
    >
      {children}
    </Link>
  );
}
