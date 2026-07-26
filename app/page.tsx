import Link from "next/link";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";

/**
 * Platzhalter-Startseite fuer Sprint 0. Die oeffentliche Website entsteht in
 * Sprint 2 (PLAN.md Abschnitt 5). Hier steht nur, was fuer einen sinnvollen
 * ersten Deploy noetig ist.
 */
export default function StartSeite() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl border border-border bg-card p-8 sm:p-12">
        <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Baden
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
          {ADRESSE.firma}
        </h1>
        <p className="mt-4 border-l-4 border-brand-gelb pl-4 text-muted-foreground">
          Die neue Website ist im Aufbau. Für Kurse, Fahrstunden und Anmeldungen
          erreichst Du uns jederzeit telefonisch.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {TELEFONNUMMERN.map((nummer) => (
            <a
              key={nummer.tel}
              href={`tel:${nummer.tel}`}
              className="flex min-h-11 items-center justify-between border border-border bg-secondary px-4 py-3 font-heading text-lg font-semibold transition-colors hover:bg-accent"
            >
              {nummer.anzeige}
              <span className="text-sm font-normal text-muted-foreground">
                anrufen
              </span>
            </a>
          ))}
        </div>

        <address className="mt-8 not-italic text-sm text-muted-foreground">
          {ADRESSE.strasse}
          <br />
          {ADRESSE.plz} {ADRESSE.ort}
          <br />
          <a href={`mailto:${ADRESSE.email}`} className="underline">
            {ADRESSE.email}
          </a>
        </address>

        <div className="mt-10 border-t border-border pt-4">
          <Link
            href="/team/login"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Team-Login
          </Link>
        </div>
      </div>
    </main>
  );
}
