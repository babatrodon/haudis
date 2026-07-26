import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Check, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/einstellungen";
import { chf, datumLang } from "@/lib/format";
import { BUCHUNG_COOKIE, buchungLesen } from "@/lib/buchung";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";

export const metadata: Metadata = {
  title: "Anmeldung bestätigt | Haudi's Fahrschule Baden",
  robots: { index: false, follow: false },
};

/**
 * Erfolgsseite (PLAN.md Abschnitt 5).
 *
 * Zeigt die Buchung, wenn das Cookie noch da ist, sonst eine allgemeine
 * Bestaetigung. Beide Faelle sind gueltig: die Anmeldung steht seit Schritt 1,
 * unabhaengig davon, ob dieser Browser sie noch zuordnen kann.
 */
export default async function AnmeldungBestaetigung({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await params;
  const kekse = await cookies();
  const buchungId = kekse.get(BUCHUNG_COOKIE)?.value;
  const buchung = buchungId ? await buchungLesen(buchungId) : null;
  const whatsappUrl = await whatsappLink("whatsapp.text.buchung");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center bg-ampel-gruen text-flaeche-1"
        >
          <Check className="size-6" />
        </span>
        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          Anmeldung bestätigt
        </h1>
      </div>

      <p className="mt-6 text-lg text-muted-foreground">
        Danke für Deine Anmeldung. Die Bestätigung per E-Mail ist unterwegs.
        Schau bitte auch im Spam-Ordner nach, falls sie nicht ankommt.
      </p>

      {buchung ? (
        <section
          aria-labelledby="uebersicht-titel"
          className="mt-10 border border-border bg-card"
        >
          <div className="border-b border-flaeche-3 p-5">
            <h2 id="uebersicht-titel" className="font-heading text-lg font-bold">
              {buchung.course.courseType.name}
            </h2>
          </div>
          <ul className="p-5 text-sm">
            {buchung.course.sessions.map((termin) => (
              <li
                key={termin.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-flaeche-3 pb-2 last:border-b-0 last:pb-0 [&:not(:first-child)]:pt-2"
              >
                <span className="font-medium">{datumLang(termin.date)}</span>
                <span className="tabular-nums text-muted-foreground">
                  {termin.startTime} bis {termin.endTime} Uhr
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-flaeche-3 p-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-heading text-2xl font-bold tabular-nums">
                {chf(buchung.priceCharged)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Bitte bar am ersten Kurstag mitbringen.
            </p>
            {buchung.course.courseType.requiresLfa ? (
              <p className="mt-3 border-l-4 border-brand-gelb pl-3 text-sm">
                <strong className="font-heading">Wichtig:</strong>{" "}
                Lernfahrausweis am ersten Kurstag mitbringen.
              </p>
            ) : null}
            <p className="mt-3 text-sm text-muted-foreground">
              {ADRESSE.strasse}, {ADRESSE.plz} {ADRESSE.ort} · 350 m vom Bahnhof
              Baden
            </p>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="fragen-titel" className="mt-10">
        <h2 id="fragen-titel" className="font-heading text-xl font-bold">
          Noch eine Frage?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Schreib uns oder ruf an, wir sind {""}
          <Link href="/kontakt" className="underline underline-offset-4">
            Montag bis Samstag
          </Link>{" "}
          für Dich da.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <Button asChild variant="akzent" size="lg">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Frage zur Buchung? Schreib uns.
            </a>
          </Button>
          {TELEFONNUMMERN.map((nummer) => (
            <a
              key={nummer.tel}
              href={`tel:${nummer.tel}`}
              className="flex min-h-12 items-center gap-3 border border-border px-5 font-heading font-bold transition-colors hover:bg-accent"
            >
              <Phone aria-hidden="true" className="size-5" />
              {nummer.anzeige}
            </a>
          ))}
        </div>
      </section>

      <p className="mt-10">
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
