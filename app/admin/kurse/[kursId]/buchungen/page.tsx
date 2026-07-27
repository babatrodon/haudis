import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Download, Printer } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { BuchungKarte } from "@/components/admin/buchung-karte";
import { TelefonAnmeldung } from "@/components/admin/telefon-anmeldung";
import { Button } from "@/components/ui/button";
import { buchungenFuerKurs, kursKopfLesen } from "@/lib/admin/buchungen";
import { requireRole } from "@/lib/auth-guard";
import { datumLang } from "@/lib/format";
import { aktiveInstruktoren } from "@/lib/instruktoren";

/**
 * Kurs-Buchungsansicht.
 *
 * Der Bildschirm, den Ausilia am haeufigsten oeffnet. Oben steht, um welchen
 * Kurs es geht und wie er belegt ist; darunter eine Karte pro Person mit
 * Anrufknopf. Alles andere ist einen Fingertipp entfernt, nichts davon liegt
 * hinter einer Detailansicht.
 */
export default async function KursBuchungenSeite({
  params,
}: {
  params: Promise<{ kursId: string }>;
}) {
  await requireRole("ADMIN");
  const { kursId } = await params;

  const [kurs, daten, instruktoren] = await Promise.all([
    kursKopfLesen(kursId),
    buchungenFuerKurs(kursId),
    aktiveInstruktoren(),
  ]);

  if (!kurs) notFound();

  const bestaetigt = daten.zeilen.filter(
    (buchung) => buchung.status === "CONFIRMED",
  );
  const storniert = daten.zeilen.filter(
    (buchung) => buchung.status !== "CONFIRMED",
  );

  // Termine nach Kurstag zusammenfassen: "Di, 18.08.2026 — 18:00–20:00, 20:00–22:00"
  const kurstage = [
    ...kurs.sessions
      .reduce((sammlung, termin) => {
        const schluessel = datumLang(termin.date);
        const bisher = sammlung.get(schluessel) ?? [];
        bisher.push(`${termin.startTime}–${termin.endTime}`);
        sammlung.set(schluessel, bisher);
        return sammlung;
      }, new Map<string, string[]>())
      .entries(),
  ].map(([datumText, zeiten]) => ({
    datum: datumText,
    zeiten: `${zeiten.join(", ")} Uhr`,
  }));

  const zugewiesen = [
    ...new Set(
      kurs.sessions
        .filter((termin) => termin.instructor)
        .map(
          (termin) =>
            `${termin.instructor!.shortCode} ${termin.instructor!.firstName} ${termin.instructor!.lastName}`,
        ),
    ),
  ];
  const kursleitung =
    zugewiesen.length > 0
      ? `Kursleitung: ${zugewiesen.join(", ")}`
      : "Kursleitung noch offen";

  return (
    <>
      <SeitenKopf
        titel={kurs.courseType.name}
        beschreibung={
          kurs.sessions.length > 0
            ? `${datumLang(kurs.sessions[0].date)}, ${kurs.sessions[0].startTime} Uhr`
            : "Noch keine Termine"
        }
        aktionen={
          <>
            <TelefonAnmeldung
              kurse={[]}
              instruktoren={instruktoren}
              kursId={kurs.id}
            />
            <Button asChild variant="outline">
              <Link href={`/druck/teilnehmerliste/${kurs.id}`} target="_blank">
                <Printer aria-hidden="true" className="size-4" />
                Liste drucken
              </Link>
            </Button>
          </>
        }
      />

      <section
        aria-labelledby="kopf-titel"
        className="mb-6 border border-border bg-card"
      >
        <h2 id="kopf-titel" className="sr-only">
          Kursdaten und Zähler
        </h2>

        {/*
          Nach Kurstag gruppiert, nicht ein Block pro Zeile. Ein VKU hat vier
          Bloecke an zwei Tagen; vier Zeilen mit viermal derselben
          Kursleitungszeile schieben auf dem Handy die Namen unter den Rand,
          und die Namen sind der Grund, diese Seite zu oeffnen.
        */}
        <ul className="border-b border-flaeche-3">
          {kurstage.map((tag) => (
            <li
              key={tag.datum}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-flaeche-3 px-4 py-3 last:border-b-0 sm:px-5"
            >
              <span className="font-medium tabular-nums">
                <CalendarDays
                  aria-hidden="true"
                  className="mr-2 inline size-4 align-[-2px] text-muted-foreground"
                />
                {tag.datum}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {tag.zeiten}
              </span>
            </li>
          ))}
        </ul>

        <p className="border-b border-flaeche-3 px-4 py-2 text-sm text-muted-foreground sm:px-5">
          {kursleitung}
        </p>

        {/* Vier Zaehler statt der drei aus PLAN.md 6.3: seit dem Portal gibt es
            eine dritte Quelle, und sie unterscheidet sich in dem, was zaehlt —
            eine Anmeldung ueber einen Kursleiter loest eine Bestaetigung aus,
            eine telefonische nicht. */}
        <div className="grid grid-cols-2 divide-flaeche-3 sm:grid-cols-4 sm:divide-x">
          <Zaehler titel="Online" wert={daten.zaehler.online} />
          <Zaehler titel="Telefonisch" wert={daten.zaehler.telefon} />
          <Zaehler titel="Fahrlehrer" wert={daten.zaehler.fahrlehrer} />
          <Zaehler
            titel="Total"
            wert={daten.zaehler.total}
            zusatz={`von ${kurs.onlineLimit}`}
          />
        </div>

        {daten.zaehler.ohneAusweis > 0 && kurs.courseType.requiresLfa ? (
          <p className="border-t border-flaeche-3 px-4 py-3 text-sm font-medium text-ampel-rot sm:px-5">
            {daten.zaehler.ohneAusweis}{" "}
            {daten.zaehler.ohneAusweis === 1
              ? "Person hat keine Ausweisnummer"
              : "Personen haben keine Ausweisnummer"}{" "}
            hinterlegt. Ohne Nummer keine SARI-Meldung.
          </p>
        ) : null}

        {daten.zaehler.telefon > 0 ? (
          <p className="border-t border-flaeche-3 px-4 py-3 text-sm text-muted-foreground sm:px-5">
            {daten.zaehler.telefon}{" "}
            {daten.zaehler.telefon === 1
              ? "Person wurde telefonisch angemeldet und hat"
              : "Personen wurden telefonisch angemeldet und haben"}{" "}
            nichts Schriftliches erhalten. Bei einer Änderung anrufen.
          </p>
        ) : null}
      </section>

      {daten.zeilen.length === 0 ? (
        <p className="border border-border bg-card p-5 text-muted-foreground">
          Für diesen Kurs liegt noch keine Anmeldung vor.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bestaetigt.map((buchung, index) => (
            <li key={buchung.id}>
              <BuchungKarte
                buchung={buchung}
                nummer={index + 1}
                kursId={kurs.id}
                kursName={kurs.courseType.name}
                instruktoren={instruktoren}
              />
            </li>
          ))}
        </ul>
      )}

      {storniert.length > 0 ? (
        <section aria-labelledby="storniert-titel" className="mt-8">
          <h2
            id="storniert-titel"
            className="mb-3 font-heading text-lg font-bold"
          >
            Storniert
          </h2>
          <ul className="flex flex-col gap-3">
            {storniert.map((buchung, index) => (
              <li key={buchung.id}>
                <BuchungKarte
                  buchung={buchung}
                  nummer={index + 1}
                  kursId={kurs.id}
                  kursName={kurs.courseType.name}
                  instruktoren={instruktoren}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {daten.zeilen.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-flaeche-3 pt-6">
          <Button asChild variant="outline">
            <a href={`/admin/kurse/${kurs.id}/buchungen/csv`}>
              <Download aria-hidden="true" className="size-4" />
              CSV herunterladen
            </a>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/admin/kurse/${kurs.id}`}>Zum Kurs</Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}

function Zaehler({
  titel,
  wert,
  zusatz,
}: {
  titel: string;
  wert: number;
  zusatz?: string;
}) {
  return (
    <div className="px-4 py-4 text-center sm:px-5">
      <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {titel}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums">
        {wert}
        {zusatz ? (
          <span className="text-base font-normal text-muted-foreground">
            {" "}
            {zusatz}
          </span>
        ) : null}
      </p>
    </div>
  );
}
