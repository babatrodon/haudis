import Link from "next/link";
import { Phone, Search, UserPlus } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { SchuelerAnlegenDialog } from "@/components/admin/schueler-anlegen-dialog";
import { WabLaufKnopf } from "@/components/admin/wab-lauf-knopf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { schuelerSuchen, wabUebersicht } from "@/lib/admin/schueler";
import { requireRole } from "@/lib/auth-guard";
import { datum } from "@/lib/format";

/**
 * Schuelerkartei, PLAN.md Abschnitt 14.
 *
 * Rein intern: es gibt kein Schueler-Login. Wer hier steht, hat nie Zugang zu
 * diesen Daten — sie existieren fuer Ausilia und die Fahrlehrer.
 *
 * Ganz oben stehen die faelligen WAB-Erinnerungen, nicht die Suche. Eine Frist,
 * die laeuft, gehoert nicht unter eine Liste, in der man erst suchen muss.
 */
export default async function SchuelerSeite({
  searchParams,
}: {
  searchParams: Promise<{ suche?: string }>;
}) {
  await requireRole("ADMIN");
  const { suche } = await searchParams;

  const [zeilen, wab] = await Promise.all([
    schuelerSuchen(suche),
    wabUebersicht(),
  ]);
  const versandAktiv = Boolean(process.env.RESEND_API_KEY);

  return (
    <>
      <SeitenKopf
        titel="Schüler"
        beschreibung="Abos, Lektionen und die WAB-Frist"
        aktionen={<SchuelerAnlegenDialog />}
      />

      {wab.mitAdresse.length > 0 || wab.ohneAdresse.length > 0 ? (
        <section
          aria-labelledby="wab-titel"
          className="mb-6 border border-ampel-gelb-linie bg-ampel-gelb-bg/40 p-4 sm:p-5"
        >
          <h2 id="wab-titel" className="font-heading text-lg font-bold">
            WAB-Erinnerung fällig
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Der WAB-Kurs muss innerhalb von zwölf Monaten nach der praktischen
            Prüfung absolviert sein. Diese Personen sind seit elf Monaten dran.
          </p>

          {wab.mitAdresse.length > 0 ? (
            <p className="mt-3 text-sm">
              <strong>{wab.mitAdresse.length}</strong>{" "}
              {wab.mitAdresse.length === 1 ? "Person bekommt" : "Personen bekommen"}{" "}
              eine E-Mail:{" "}
              {wab.mitAdresse
                .map((p) => `${p.lastName} ${p.firstName}`)
                .join(", ")}
            </p>
          ) : null}

          {wab.ohneAdresse.length > 0 ? (
            <div className="mt-3 border-l-4 border-ampel-rot bg-card p-3">
              <p className="text-sm font-medium text-ampel-rot">
                {wab.ohneAdresse.length}{" "}
                {wab.ohneAdresse.length === 1
                  ? "Person hat keine E-Mail-Adresse"
                  : "Personen haben keine E-Mail-Adresse"}{" "}
                und muss angerufen werden.
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {wab.ohneAdresse.map((person) => (
                  <li key={person.id}>
                    {person.lastName} {person.firstName}{" "}
                    <a
                      href={`tel:${person.phone.replace(/\s/g, "")}`}
                      className="font-semibold tabular-nums underline-offset-4 hover:underline"
                    >
                      {person.phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4">
            <WabLaufKnopf versandAktiv={versandAktiv} />
          </div>
        </section>
      ) : null}

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div className="flex min-w-56 flex-1 flex-col gap-2">
          <label htmlFor="suche" className="text-sm font-medium">
            Suchen
          </label>
          <Input
            id="suche"
            name="suche"
            defaultValue={suche ?? ""}
            placeholder="Name oder Telefonnummer"
          />
        </div>
        <Button type="submit">
          <Search aria-hidden="true" className="size-4" />
          Suchen
        </Button>
        {suche ? (
          <Button asChild variant="ghost">
            <Link href="/admin/schueler">Zurücksetzen</Link>
          </Button>
        ) : null}
      </form>

      {zeilen.length === 0 ? (
        <div className="border border-border bg-card p-6">
          <p className="text-muted-foreground">
            {suche
              ? `Keine Person gefunden zu „${suche}".`
              : "Noch kein Schüler erfasst."}
          </p>
          {!suche ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <UserPlus aria-hidden="true" className="size-4" />
              Oben rechts legst Du den ersten an.
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {zeilen.map((person) => (
            <li key={person.id}>
              <article className="border border-border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-bold">
                      <Link
                        href={`/admin/schueler/${person.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {person.nachname} {person.vorname}
                      </Link>
                    </h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <a
                        href={`tel:${person.telefon.replace(/\s/g, "")}`}
                        className="inline-flex min-h-11 items-center gap-2 font-semibold tabular-nums"
                      >
                        <Phone aria-hidden="true" className="size-4" />
                        {person.telefon}
                      </a>
                      {person.email ? (
                        <span className="break-all text-muted-foreground">
                          {person.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          keine E-Mail
                        </span>
                      )}
                    </p>
                  </div>

                  <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Offene Lektionen</dt>
                      <dd className="font-heading text-lg font-bold tabular-nums">
                        {person.offeneLektionen}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Prüfung</dt>
                      <dd className="tabular-nums">
                        {person.pruefungAm ? datum(person.pruefungAm) : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">WAB</dt>
                      <dd>
                        <WabZustand
                          gesendetAm={person.wabGesendetAm}
                          mailStatus={person.wabMailStatus}
                          ohneAdresse={person.wabOhneAdresse}
                          pruefungAm={person.pruefungAm}
                        />
                      </dd>
                    </div>
                  </dl>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * Der WAB-Stand in einem Wort.
 *
 * "Verschickt" steht hier nur, wenn wirklich verschickt wurde. Wurde die Mail
 * bloss protokolliert, steht das da — bei einer Zwoelf-Monats-Frist ist ein
 * falsches Haekchen der teuerste Fehler.
 */
function WabZustand({
  gesendetAm,
  mailStatus,
  ohneAdresse,
  pruefungAm,
}: {
  gesendetAm: Date | null;
  mailStatus: string | null;
  ohneAdresse: boolean;
  pruefungAm: Date | null;
}) {
  if (!pruefungAm) return <span className="text-muted-foreground">—</span>;
  if (ohneAdresse) {
    return <span className="font-medium text-ampel-rot">anrufen</span>;
  }
  if (!gesendetAm) return <span className="text-muted-foreground">offen</span>;
  if (mailStatus === "gesendet") {
    return <span className="text-ampel-gruen">verschickt</span>;
  }
  return (
    <span className="font-medium text-ampel-rot">
      {mailStatus === "protokolliert" ? "nur protokolliert" : "Fehler"}
    </span>
  );
}
