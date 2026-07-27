import Link from "next/link";
import { Phone, Search } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { TelefonAnmeldung } from "@/components/admin/telefon-anmeldung";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buchbareKurse, buchungenSuchen } from "@/lib/admin/buchungen";
import { requireRole } from "@/lib/auth-guard";
import { chf, datum } from "@/lib/format";
import { aktiveInstruktoren } from "@/lib/instruktoren";
import { telLink } from "@/lib/telefon";

/**
 * Buchungen ueber alle Kurse.
 *
 * Zwei Aufgaben: jemanden finden, der anruft und nur seinen Namen sagt, und
 * eine telefonische Anmeldung aufnehmen. Beides sind Telefonvorgaenge, deshalb
 * stehen sie auf derselben Seite.
 *
 * Die Suche laeuft als gewoehnliches Formular ueber die Adresse. Damit bleibt
 * das Ergebnis teilbar und der Zurueck-Knopf tut, was er soll.
 */
export default async function BuchungenSeite({
  searchParams,
}: {
  searchParams: Promise<{ suche?: string }>;
}) {
  await requireRole("ADMIN");
  const { suche = "" } = await searchParams;

  const [treffer, kurse, instruktoren] = await Promise.all([
    buchungenSuchen(suche),
    buchbareKurse(),
    aktiveInstruktoren(),
  ]);

  return (
    <>
      <SeitenKopf
        titel="Buchungen"
        beschreibung="Nach Name, Telefonnummer oder E-Mail suchen."
        aktionen={
          <TelefonAnmeldung
            kurse={kurse.map((kurs) => ({
              id: kurs.id,
              name: kurs.name,
              frei: kurs.frei,
              beschriftung: `${kurs.name}${kurs.ersterTermin ? `, ${datum(kurs.ersterTermin)}` : ""} — ${kurs.frei === 0 ? "voll" : `${kurs.frei} frei`}`,
            }))}
            instruktoren={instruktoren}
          />
        }
      />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex min-w-56 flex-1 flex-col gap-2">
          <Label htmlFor="suche">Suche</Label>
          <Input
            id="suche"
            name="suche"
            type="search"
            defaultValue={suche}
            placeholder="Meier, 079 128 48 58 oder @example.ch"
            autoComplete="off"
          />
        </div>
        <Button type="submit">
          <Search aria-hidden="true" className="size-4" />
          Suchen
        </Button>
      </form>

      {suche.trim().length === 0 ? (
        <p className="border border-border bg-card p-5 text-muted-foreground">
          Gib mindestens zwei Zeichen ein. Die Teilnehmerliste eines einzelnen
          Kurses steht beim Kurs selbst.
        </p>
      ) : treffer.length === 0 ? (
        <p className="border border-border bg-card p-5 text-muted-foreground">
          Nichts gefunden für „{suche}“.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {treffer.map((buchung) => (
            <li
              key={buchung.id}
              className="border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-bold">
                    {buchung.nachname} {buchung.vorname}
                  </h2>
                  <p className="mt-1 text-muted-foreground">
                    <Link
                      href={`/admin/kurse/${buchung.kurs.id}/buchungen`}
                      className="underline underline-offset-4"
                    >
                      {buchung.kurs.name}
                    </Link>
                    {buchung.kurs.ersterTermin
                      ? ` ab ${datum(buchung.kurs.ersterTermin)}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {buchung.status === "CANCELLED" ? (
                    <span className="border border-ampel-rot-linie bg-ampel-rot-bg px-2 py-1 text-xs font-semibold text-ampel-rot">
                      Storniert
                    </span>
                  ) : null}
                  {buchung.quelle === "PHONE" ? (
                    <span className="inline-flex items-center gap-1.5 border border-flaeche-3 bg-flaeche-2 px-2 py-1 text-xs font-semibold">
                      <Phone aria-hidden="true" className="size-3" />
                      Telefonisch
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <a
                  href={telLink(buchung.telefon)}
                  className="inline-flex min-h-12 items-center gap-2 border border-primary bg-primary px-4 text-base font-medium tabular-nums text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  <Phone aria-hidden="true" className="size-4" />
                  {buchung.telefon}
                </a>
                <span className="text-sm text-muted-foreground">
                  {buchung.lfaNummer ? (
                    <span className="tabular-nums">
                      Ausweis {buchung.lfaNummer}
                    </span>
                  ) : (
                    <span className="text-ampel-rot">Ausweisnummer fehlt</span>
                  )}
                  {" · "}
                  <span className="tabular-nums">{chf(buchung.preis)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
