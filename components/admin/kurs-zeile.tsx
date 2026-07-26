import Link from "next/link";
import { AmpelChip } from "@/components/ampel-chip";
import { DuplizierenDialog } from "@/components/admin/duplizieren-dialog";
import { StatusChip } from "@/components/admin/status-chip";
import { chf, datum } from "@/lib/format";
import type { KursZeile } from "@/lib/admin/kurse";

/**
 * Eine Kurszeile in der Liste.
 *
 * Karte statt Tabellenzeile, weil das Panel vor allem auf dem iPad und dem
 * Handy bedient wird.
 *
 * Der Titel-Link ueberzieht die ganze Karte (after:absolute after:inset-0),
 * damit das Ziel so gross ist wie die Karte selbst — als reiner Textlink waere
 * es 23 Pixel hoch und damit auf dem Touchscreen kaum zu treffen. Der
 * Duplizieren-Knopf liegt in einem eigenen relativ positionierten Kasten und
 * damit ueber der Flaeche; verschachtelt ist nichts.
 *
 * Duplizieren steht direkt in der Zeile. Ausilias Kurse wiederholen sich, ein
 * neuer Kurs entsteht oefter aus einem alten als aus dem leeren Formular.
 */
/**
 * Ist der SARI-Eintrag ueberfaellig oder wird er es bald?
 *
 * Die asa verlangt den Eintrag 24 Stunden vor Kursbeginn. Der Hinweis
 * erscheint erst eine Woche vorher: stuende er an jedem veroeffentlichten
 * Kurs, waere er nach dem dritten Mal Tapete und genau dann unsichtbar, wenn
 * es darauf ankommt.
 */
const WOCHE = 7 * 24 * 60 * 60 * 1000;

function sariDraengt(kurs: KursZeile): boolean {
  if (kurs.status !== "PUBLISHED" || kurs.sariAngemeldet) return false;
  if (!kurs.ersterTermin) return false;
  return kurs.ersterTermin.getTime() - Date.now() < WOCHE;
}

export function KursZeileKarte({ kurs }: { kurs: KursZeile }) {
  const abgesagt = kurs.status === "CANCELLED";

  return (
    <div className="relative border border-border bg-card p-4 transition-colors hover:bg-flaeche-2 focus-within:bg-flaeche-2 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={kurs.status} />
            {!abgesagt ? (
              <AmpelChip
                zustand={kurs.verfuegbarkeit.zustand}
                text={`${kurs.belegt}/${kurs.limit} belegt`}
                className="px-2 py-1 text-xs"
              />
            ) : null}
          </div>

          <h2 className="mt-2 font-heading text-lg font-bold">
            <Link
              href={`/admin/kurse/${kurs.id}`}
              className="underline-offset-4 after:absolute after:inset-0 hover:underline"
            >
              {kurs.kursart}
            </Link>
          </h2>

          <p className="mt-1 text-muted-foreground">
            {kurs.ersterTermin ? (
              <>
                {datum(kurs.ersterTermin)}
                {kurs.letzterTermin &&
                kurs.letzterTermin.getTime() !== kurs.ersterTermin.getTime()
                  ? ` bis ${datum(kurs.letzterTermin)}`
                  : ""}
                {" · "}
                {kurs.anzahlTermine}{" "}
                {kurs.anzahlTermine === 1 ? "Block" : "Blöcke"}
              </>
            ) : (
              "Noch keine Termine"
            )}
          </p>
        </div>

        <p className="shrink-0 text-right">
          <span className="font-heading text-lg font-bold tabular-nums">
            {chf(kurs.gesamtpreis)}
          </span>
          <span className="block text-sm text-muted-foreground">
            inkl. Lehrmittel
          </span>
        </p>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2 border-t border-flaeche-3 pt-4">
        <DuplizierenDialog
          kursId={kurs.id}
          kursName={kurs.kursart}
          termine={kurs.termine}
        />
        {sariDraengt(kurs) ? (
          <span className="text-sm font-medium text-ampel-rot">
            Noch nicht in SARI eingetragen
          </span>
        ) : null}
      </div>
    </div>
  );
}
