import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { KursZeileKarte } from "@/components/admin/kurs-zeile";
import { Button } from "@/components/ui/button";
import { kurseFuerListe, kursartenFuerAuswahl } from "@/lib/admin/kurse";
import { requireRole } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/lib/generated/prisma/enums";

/**
 * Kursliste.
 *
 * Die Filter sind Links, keine Formulare: so bleibt der Zustand in der Adresse,
 * die Seite laesst sich als Lesezeichen ablegen und der Zurueck-Knopf tut, was
 * er soll. Ohne JavaScript funktioniert sie ebenfalls.
 *
 * Voreinstellung ist "kommend". Was vorbei ist, interessiert im Alltag nicht;
 * wer es braucht, findet es einen Fingertipp entfernt.
 */

type SuchParameter = {
  kursart?: string;
  status?: string;
  zeitraum?: string;
};

const STATUS_FILTER = [
  { wert: "", beschriftung: "Alle" },
  { wert: "PUBLISHED", beschriftung: "Veröffentlicht" },
  { wert: "DRAFT", beschriftung: "Entwurf" },
  { wert: "CANCELLED", beschriftung: "Abgesagt" },
];

const ZEITRAUM_FILTER = [
  { wert: "kommend", beschriftung: "Kommend" },
  { wert: "vergangen", beschriftung: "Vergangen" },
  { wert: "alle", beschriftung: "Alle" },
];

function istStatus(wert: string | undefined): wert is CourseStatus {
  return (
    wert === "DRAFT" ||
    wert === "PUBLISHED" ||
    wert === "CANCELLED" ||
    wert === "ARCHIVED"
  );
}

export default async function KurseSeite({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  await requireRole("ADMIN");
  const parameter = await searchParams;

  const zeitraum =
    parameter.zeitraum === "vergangen" || parameter.zeitraum === "alle"
      ? parameter.zeitraum
      : "kommend";

  const [kurse, kursarten] = await Promise.all([
    kurseFuerListe({
      kursartCode: parameter.kursart || undefined,
      status: istStatus(parameter.status) ? parameter.status : undefined,
      zeitraum,
    }),
    kursartenFuerAuswahl(),
  ]);

  function link(aenderung: SuchParameter): string {
    const suche = new URLSearchParams();
    const zusammen = { ...parameter, ...aenderung };
    for (const [schluessel, wert] of Object.entries(zusammen)) {
      if (wert) suche.set(schluessel, wert);
    }
    const text = suche.toString();
    return text ? `/admin/kurse?${text}` : "/admin/kurse";
  }

  return (
    <>
      <SeitenKopf
        titel="Kurse"
        beschreibung={`${kurse.length} ${kurse.length === 1 ? "Kurs" : "Kurse"} in dieser Ansicht`}
        aktionen={
          <Button asChild>
            <Link href="/admin/kurse/neu">
              <CalendarPlus aria-hidden="true" className="size-4" />
              Neuer Kurs
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3">
        <FilterReihe beschriftung="Kursart">
          <FilterLink
            href={link({ kursart: "" })}
            aktiv={!parameter.kursart}
            text="Alle"
          />
          {kursarten.map((kursart) => (
            <FilterLink
              key={kursart.id}
              href={link({ kursart: kursart.code })}
              aktiv={parameter.kursart === kursart.code}
              text={kursart.name}
            />
          ))}
        </FilterReihe>

        <FilterReihe beschriftung="Status">
          {STATUS_FILTER.map((eintrag) => (
            <FilterLink
              key={eintrag.wert || "alle"}
              href={link({ status: eintrag.wert })}
              aktiv={(parameter.status ?? "") === eintrag.wert}
              text={eintrag.beschriftung}
            />
          ))}
        </FilterReihe>

        <FilterReihe beschriftung="Zeitraum">
          {ZEITRAUM_FILTER.map((eintrag) => (
            <FilterLink
              key={eintrag.wert}
              href={link({ zeitraum: eintrag.wert })}
              aktiv={zeitraum === eintrag.wert}
              text={eintrag.beschriftung}
            />
          ))}
        </FilterReihe>
      </div>

      {kurse.length === 0 ? (
        <p className="border border-border bg-card p-5 text-muted-foreground">
          Kein Kurs passt zu dieser Auswahl.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {kurse.map((kurs) => (
            <li key={kurs.id}>
              <KursZeileKarte kurs={kurs} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * Eine Filterzeile.
 *
 * Auf schmalen Screens laufen die Knoepfe waagrecht weiter, statt auf sieben
 * Zeilen umzubrechen. Sonst fuellen die Filter allein auf 390px den halben
 * Bildschirm, bevor der erste Kurs zu sehen ist. Ab sm ist Platz genug, dort
 * bricht die Zeile wieder normal um.
 */
function FilterReihe({
  beschriftung,
  children,
}: {
  beschriftung: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {beschriftung}
      </span>
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
        {children}
      </div>
    </div>
  );
}

function FilterLink({
  href,
  aktiv,
  text,
}: {
  href: string;
  aktiv: boolean;
  text: string;
}) {
  return (
    <Link
      href={href}
      aria-current={aktiv ? "true" : undefined}
      className={cn(
        // 44px hoch, auch als Textlink: die Filter werden auf dem iPad getippt.
        "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border px-3 text-sm font-medium transition-colors",
        aktiv
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-flaeche-2",
      )}
    >
      {text}
    </Link>
  );
}
