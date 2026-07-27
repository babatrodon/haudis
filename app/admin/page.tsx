import Link from "next/link";
import { CalendarPlus, PhoneIncoming } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { FuellstandListe } from "@/components/admin/fuellstand-liste";
import { TerminListe } from "@/components/admin/termin-liste";
import { Button } from "@/components/ui/button";
import {
  anmeldeZahlen,
  fuellstaende,
  naechsteTermine,
  umsatzMonat,
} from "@/lib/admin/dashboard";
import { monatsName } from "@/lib/admin/zeitraum";
import { requireRole } from "@/lib/auth-guard";
import { chf } from "@/lib/format";

/**
 * Uebersicht.
 *
 * Die Reihenfolge folgt der Frage, die Ausilia zwischen zwei Lektionen im
 * Stehen stellt: Was steht an, und wie voll sind die Kurse? Der Umsatz wird
 * einmal pro Woche angeschaut und steht deshalb unten, nicht oben.
 *
 * Die beiden Schnellzugriffe sitzen im Seitenkopf statt in einer Kachel: dort
 * sind sie ohne Scrollen erreichbar, und sie sind Handeln, nicht Lesen.
 */
export default async function AdminUebersicht() {
  const benutzer = await requireRole("ADMIN");

  const [termine, kurse, zahlen, umsatz] = await Promise.all([
    naechsteTermine(7),
    fuellstaende(),
    anmeldeZahlen(),
    umsatzMonat(),
  ]);

  return (
    <>
      <SeitenKopf
        titel={`Grüezi ${benutzer.name.split(" ")[0]}`}
        beschreibung="Was in den nächsten Tagen ansteht."
        aktionen={
          <>
            {/* Ziele entstehen in Block B und C. Bis dahin fuehren sie auf die
                jeweilige Uebersicht, statt ins Leere zu laufen. */}
            <Button asChild>
              <Link href="/admin/kurse">
                <CalendarPlus aria-hidden="true" className="size-4" />
                Neuer Kurs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/buchungen">
                <PhoneIncoming aria-hidden="true" className="size-4" />
                Telefonische Anmeldung
              </Link>
            </Button>
          </>
        }
      />

      <div className="space-y-8">
        <section aria-labelledby="termine-titel">
          <h2
            id="termine-titel"
            className="mb-3 font-heading text-lg font-bold"
          >
            Nächste sieben Tage
          </h2>
          <TerminListe termine={termine} />
        </section>

        <section aria-labelledby="fuellstand-titel">
          <h2
            id="fuellstand-titel"
            className="mb-3 font-heading text-lg font-bold"
          >
            Füllstand der Kurse
          </h2>
          <FuellstandListe kurse={kurse} />
        </section>

        <section aria-labelledby="anmeldungen-titel">
          <h2
            id="anmeldungen-titel"
            className="mb-3 font-heading text-lg font-bold"
          >
            Anmeldungen
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Kennzahl
              titel="Heute"
              wert={String(zahlen.heuteGesamt)}
              zusatz={`${zahlen.heuteOnline} online, ${zahlen.heuteTelefon} telefonisch`}
            />
            <Kennzahl
              titel="Diese Woche"
              wert={String(zahlen.wocheGesamt)}
              zusatz={`${zahlen.wocheOnline} online, ${zahlen.wocheTelefon} telefonisch`}
            />
          </div>
        </section>

        <section aria-labelledby="umsatz-titel">
          <h2 id="umsatz-titel" className="mb-3 font-heading text-lg font-bold">
            Umsatz {monatsName()}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Kennzahl
              titel="Nach Anmeldedatum"
              wert={chf(umsatz.nachAnmeldedatum)}
              zusatz={`${umsatz.anzahlNachAnmeldedatum} Anmeldungen in diesem Monat eingegangen`}
            />
            <Kennzahl
              titel="Nach Kursdatum"
              wert={chf(umsatz.nachKursdatum)}
              zusatz={`${umsatz.anzahlNachKursdatum} Anmeldungen für Kurse, die in diesem Monat starten`}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Beide Zahlen ohne abgesagte Kurse und stornierte Anmeldungen. Der
            Betrag wird bar am ersten Kurstag fällig.
          </p>
        </section>
      </div>
    </>
  );
}

function Kennzahl({
  titel,
  wert,
  zusatz,
}: {
  titel: string;
  wert: string;
  zusatz: string;
}) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {titel}
      </p>
      <p className="mt-2 font-heading text-3xl font-bold tabular-nums">
        {wert}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{zusatz}</p>
    </div>
  );
}
