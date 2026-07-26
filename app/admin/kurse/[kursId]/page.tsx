import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Users } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { AbsageDialog } from "@/components/admin/absage-dialog";
import { DuplizierenDialog } from "@/components/admin/duplizieren-dialog";
import { KursStatusKnopf } from "@/components/admin/kurs-status-knopf";
import { StatusChip } from "@/components/admin/status-chip";
import { AmpelChip } from "@/components/ampel-chip";
import { Button } from "@/components/ui/button";
import {
  alsFeldwert,
  betroffeneBeiAbsage,
  kursLesen,
} from "@/lib/admin/kurse";
import { requireRole } from "@/lib/auth-guard";
import { chf, datum, datumLang } from "@/lib/format";
import { preisBerechnen } from "@/lib/preis";
import {
  ampelSchwellenLesen,
  verfuegbarkeitBerechnen,
} from "@/lib/verfuegbarkeit";
import { sariVermerkenAktion } from "../aktionen";

/**
 * Kursdetail.
 *
 * Zeigt den Kurs so, wie Ausilia ihn im Kopf hat: was ist es, wann laeuft es,
 * wie voll ist es, was kostet es. Die Aktionen stehen oben, weil sie der Grund
 * sind, diese Seite zu oeffnen.
 */
export default async function KursDetailSeite({
  params,
}: {
  params: Promise<{ kursId: string }>;
}) {
  await requireRole("ADMIN");
  const { kursId } = await params;

  const kurs = await kursLesen(kursId);
  if (!kurs) notFound();

  const [betroffene, schwellen] = await Promise.all([
    betroffeneBeiAbsage(kursId),
    ampelSchwellenLesen(),
  ]);

  const belegt = kurs._count.bookings;
  const verfuegbarkeit = verfuegbarkeitBerechnen(
    kurs.onlineLimit,
    belegt,
    schwellen,
  );
  const preis = preisBerechnen(kurs, belegt);
  const abgesagt = kurs.status === "CANCELLED";
  const termine = kurs.sessions.map((termin) => ({
    datum: alsFeldwert(termin.date),
    von: termin.startTime,
    bis: termin.endTime,
  }));

  return (
    <>
      <SeitenKopf
        titel={kurs.courseType.name}
        beschreibung={
          kurs.sessions.length > 0
            ? `${datum(kurs.sessions[0].date)} bis ${datum(kurs.sessions.at(-1)!.date)}`
            : "Noch keine Termine"
        }
        aktionen={
          <Button asChild variant="outline">
            <Link href={`/admin/kurse/${kurs.id}/bearbeiten`}>
              <Pencil aria-hidden="true" className="size-4" />
              Bearbeiten
            </Link>
          </Button>
        }
      />

      {/* Die Ampel bleibt klein. Gelb ist Akzent, nie Flaeche (PLAN.md 9), und
          ein Chip mit beiden Angaben waere hier ein gelber Balken. */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusChip status={kurs.status} />
        {!abgesagt ? (
          <>
            <span className="font-heading text-sm font-semibold tabular-nums">
              {belegt}/{kurs.onlineLimit} belegt
            </span>
            <AmpelChip
              zustand={verfuegbarkeit.zustand}
              text={verfuegbarkeit.text}
              className="px-2 py-1 text-xs"
            />
          </>
        ) : null}
      </div>

      {!abgesagt ? (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <DuplizierenDialog
            kursId={kurs.id}
            kursName={kurs.courseType.name}
            termine={termine}
            auffaellig
          />
          <KursStatusKnopf
            kursId={kurs.id}
            veroeffentlicht={kurs.status === "PUBLISHED"}
          />
          <AbsageDialog
            kursId={kurs.id}
            kursName={kurs.courseType.name}
            betroffene={betroffene}
          />
        </div>
      ) : (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <DuplizierenDialog
            kursId={kurs.id}
            kursName={kurs.courseType.name}
            termine={termine}
            auffaellig
          />
          <p className="text-sm text-muted-foreground">
            Ein abgesagter Kurs bleibt zur Nachvollziehbarkeit stehen. Für einen
            Ersatztermin dupliziere ihn.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="termine-titel">
          <h2 id="termine-titel" className="mb-3 font-heading text-lg font-bold">
            Termine
          </h2>
          {kurs.sessions.length === 0 ? (
            <p className="border border-border bg-card p-5 text-muted-foreground">
              Noch keine Termine erfasst.
            </p>
          ) : (
            <ul className="border border-border bg-card">
              {kurs.sessions.map((termin) => (
                <li
                  key={termin.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-flaeche-3 px-5 py-4 last:border-b-0"
                >
                  <span className="font-medium tabular-nums">
                    {datumLang(termin.date)}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {termin.startTime} bis {termin.endTime} Uhr
                  </span>
                  <span className="w-full text-sm text-muted-foreground">
                    {termin.instructor ? (
                      <>
                        Kursleitung:{" "}
                        <span className="font-semibold text-foreground">
                          {termin.instructor.shortCode}
                        </span>{" "}
                        {termin.instructor.firstName} {termin.instructor.lastName}
                      </>
                    ) : (
                      "Kursleitung noch offen"
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="preis-titel">
            <h2 id="preis-titel" className="mb-3 font-heading text-lg font-bold">
              Preis
            </h2>
            <dl className="border border-border bg-card">
              <Zeile
                bezeichnung="Kursgebühr"
                wert={chf(preis.kursgebuehr)}
              />
              <Zeile bezeichnung="Lehrmittel" wert={chf(preis.lehrmittel)} />
              <Zeile
                bezeichnung="Total"
                wert={chf(preis.regulaer)}
                betont
              />
              <Zeile
                bezeichnung="Frühbucher"
                wert={
                  kurs.earlyBirdPercent && kurs.earlyBirdSlots
                    ? `${kurs.earlyBirdPercent.toString()} % für die ersten ${kurs.earlyBirdSlots}`
                    : "Kein Rabatt"
                }
              />
              {preis.fruehbucher ? (
                <Zeile
                  bezeichnung="Nächste Anmeldung zahlt"
                  wert={chf(preis.total)}
                />
              ) : null}
            </dl>
          </section>

          <section aria-labelledby="anmeldungen-titel">
            <h2
              id="anmeldungen-titel"
              className="mb-3 font-heading text-lg font-bold"
            >
              Anmeldungen
            </h2>
            <div className="border border-border bg-card p-5">
              <p className="font-heading text-3xl font-bold tabular-nums">
                {belegt}
                <span className="text-lg font-normal text-muted-foreground">
                  {" "}
                  von {kurs.onlineLimit}
                </span>
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href={`/admin/kurse/${kurs.id}/buchungen`}>
                  <Users aria-hidden="true" className="size-4" />
                  Teilnehmerliste
                </Link>
              </Button>
            </div>
          </section>

          <section aria-labelledby="sari-titel">
            <h2 id="sari-titel" className="mb-3 font-heading text-lg font-bold">
              SARI
            </h2>
            <div className="flex flex-col gap-3 border border-border bg-card p-5">
              <SariZeile
                kursId={kurs.id}
                feld="angemeldet"
                beschriftung="Kurs eingetragen"
                frist="Spätestens 24 Stunden vor dem ersten Termin."
                gesetztAm={kurs.sariAngemeldetAm}
              />
              <SariZeile
                kursId={kurs.id}
                feld="bestaetigt"
                beschriftung="Kurs bestätigt"
                frist="Spätestens 24 Stunden nach dem letzten Termin."
                gesetztAm={kurs.sariBestaetigtAm}
              />
            </div>
          </section>

          {kurs.notes ? (
            <section aria-labelledby="notiz-titel">
              <h2
                id="notiz-titel"
                className="mb-3 font-heading text-lg font-bold"
              >
                Interne Notiz
              </h2>
              <p className="whitespace-pre-line border border-border bg-card p-5">
                {kurs.notes}
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Zeile({
  bezeichnung,
  wert,
  betont = false,
}: {
  bezeichnung: string;
  wert: string;
  betont?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-flaeche-3 px-5 py-3 last:border-b-0">
      <dt className="text-muted-foreground">{bezeichnung}</dt>
      <dd
        className={
          betont ? "font-heading font-bold tabular-nums" : "tabular-nums"
        }
      >
        {wert}
      </dd>
    </div>
  );
}

/**
 * Ein SARI-Vermerk. Gewoehnliches Formular, kein JavaScript noetig: es geht um
 * einen Zeitstempel, nicht um eine Eingabe.
 */
function SariZeile({
  kursId,
  feld,
  beschriftung,
  frist,
  gesetztAm,
}: {
  kursId: string;
  feld: "angemeldet" | "bestaetigt";
  beschriftung: string;
  frist: string;
  gesetztAm: Date | null;
}) {
  return (
    <form
      action={sariVermerkenAktion}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <input type="hidden" name="kursId" value={kursId} />
      <input type="hidden" name="feld" value={feld} />
      <input type="hidden" name="gesetzt" value={gesetztAm ? "false" : "true"} />
      <div className="min-w-0">
        <p className="font-medium">{beschriftung}</p>
        <p className="text-sm text-muted-foreground">
          {gesetztAm ? `Erledigt am ${datum(gesetztAm)}` : frist}
        </p>
      </div>
      <Button type="submit" variant="outline" size="sm">
        {gesetztAm ? "Zurücksetzen" : "Erledigt"}
      </Button>
    </form>
  );
}
