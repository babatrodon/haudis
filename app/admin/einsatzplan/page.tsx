import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer, TriangleAlert } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { KonfliktWarnung } from "@/components/admin/konflikt-warnung";
import { Button } from "@/components/ui/button";
import { einsatzplanWoche } from "@/lib/admin/einsatzplan";
import {
  kalendertag,
  tagePlus,
  wochenStartKalender,
} from "@/lib/admin/zeitraum";
import { requireRole } from "@/lib/auth-guard";
import { datum, datumLang } from "@/lib/format";
import { aktiveInstruktoren } from "@/lib/instruktoren";
import { cn } from "@/lib/utils";
import { zuweisenAktion } from "./aktionen";

/**
 * Einsatzplan, eine Woche auf einmal.
 *
 * Die Auswahl liest ausschliesslich aktiveInstruktoren() — Geschaeftsregel 11.
 * Im Altsystem erschien sonst der Admin-Zugang als waehlbarer Kursleiter.
 */
export default async function EinsatzplanSeite({
  searchParams,
}: {
  searchParams: Promise<{ woche?: string }>;
}) {
  await requireRole("ADMIN");
  const { woche } = await searchParams;

  const gewaehlt =
    woche && !Number.isNaN(Date.parse(woche))
      ? new Date(`${woche}T00:00:00.000Z`)
      : kalendertag();
  const montag = wochenStartKalender(gewaehlt);

  const [plan, instruktoren] = await Promise.all([
    einsatzplanWoche(montag),
    aktiveInstruktoren(),
  ]);

  const alsWert = (tag: Date) => tag.toISOString().slice(0, 10);
  const vorige = alsWert(tagePlus(montag, -7));
  const naechste = alsWert(tagePlus(montag, 7));
  const heute = kalendertag();

  return (
    <>
      <SeitenKopf
        titel="Einsatzplan"
        beschreibung={`Woche vom ${datum(montag)} bis ${datum(tagePlus(montag, 6))}`}
        aktionen={
          <Button asChild variant="outline">
            <Link href={`/druck/einsatzplan/${alsWert(montag)}`} target="_blank">
              <Printer aria-hidden="true" className="size-4" />
              Woche drucken
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/einsatzplan?woche=${vorige}`}>
            <ChevronLeft aria-hidden="true" className="size-4" />
            Vorige
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/einsatzplan">Diese Woche</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/einsatzplan?woche=${naechste}`}>
            Nächste
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
        {plan.offen > 0 ? (
          <span className="text-sm text-muted-foreground">
            {plan.offen} {plan.offen === 1 ? "Termin ohne" : "Termine ohne"}{" "}
            Kursleitung
          </span>
        ) : null}
      </div>

      <KonfliktWarnung konflikte={plan.konflikte} />

      <div className="flex flex-col gap-4">
        {plan.tage.map((tag) => (
          <section
            key={tag.datum.toISOString()}
            aria-label={datumLang(tag.datum)}
            className={cn(
              "border border-border bg-card",
              tag.datum.getTime() === heute.getTime() &&
                "border-l-4 border-l-brand-gelb",
            )}
          >
            {/*
              Ein leerer Tag bekommt eine Zeile, kein Kaestchen. In einer Woche
              mit einem einzigen Kursabend waeren das sonst sechs Kaesten mit
              "Kein Termin", durch die man scrollt, um zum siebten zu kommen.
            */}
            {tag.termine.length === 0 ? (
              <p className="flex flex-wrap items-baseline gap-x-3 px-4 py-2 sm:px-5">
                <span className="font-heading font-bold text-muted-foreground">
                  {datumLang(tag.datum)}
                </span>
                <span className="text-sm text-muted-foreground">
                  kein Termin
                </span>
              </p>
            ) : (
              <>
                <h2 className="border-b border-flaeche-3 px-4 py-3 font-heading font-bold sm:px-5">
                  {datumLang(tag.datum)}
                </h2>
                <ul>
                {tag.termine.map((termin) => (
                  <li
                    key={termin.id}
                    className={cn(
                      "border-b border-flaeche-3 px-4 py-3 last:border-b-0 sm:px-5",
                      termin.imKonflikt && "bg-ampel-rot-bg",
                    )}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="font-medium tabular-nums">
                        {termin.von}–{termin.bis}
                      </span>
                      <Link
                        href={`/admin/kurse/${termin.kursId}`}
                        className="min-w-0 flex-1 text-muted-foreground underline-offset-4 hover:underline"
                      >
                        {termin.kursName}
                      </Link>
                      {termin.imKonflikt ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ampel-rot">
                          <TriangleAlert aria-hidden="true" className="size-4" />
                          Doppelt belegt
                        </span>
                      ) : null}
                    </div>

                    <form
                      action={zuweisenAktion}
                      className="mt-2 flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="terminId" value={termin.id} />
                      <input type="hidden" name="kursId" value={termin.kursId} />
                      <label
                        htmlFor={`instruktor-${termin.id}`}
                        className="sr-only"
                      >
                        Kursleitung für {termin.kursName} am {datum(termin.datum)}
                      </label>
                      <select
                        id={`instruktor-${termin.id}`}
                        name="instruktorId"
                        defaultValue={termin.instruktor?.id ?? ""}
                        className="h-12 min-w-48 flex-1 border border-input bg-card px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="">Noch nicht bestimmt</option>
                        {instruktoren.map((instruktor) => (
                          <option key={instruktor.id} value={instruktor.id}>
                            {instruktor.anzeige}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" variant="outline">
                        Übernehmen
                      </Button>
                    </form>
                  </li>
                ))}
                </ul>
              </>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
