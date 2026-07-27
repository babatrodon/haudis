import Image from "next/image";
import { notFound } from "next/navigation";
import { DruckKnopf } from "@/components/admin/druck-knopf";
import { buchungenFuerKurs, kursKopfLesen } from "@/lib/admin/buchungen";
import { requireRole } from "@/lib/auth-guard";
import { datum, datumLang } from "@/lib/format";
import { ADRESSE } from "@/lib/kontakt";

/**
 * Teilnehmerliste zum Drucken.
 *
 * Eigene Route ausserhalb von /admin, damit die Seitenleiste und die
 * Tab-Leiste gar nicht erst entstehen. Der Schutz haengt trotzdem an
 * requireRole: die Liste enthaelt Adressen und Geburtsdaten.
 *
 * Aufbau als echte Tabelle, nicht als Karten. Der Grund ist der Druck:
 * <thead> wird vom Browser auf jeder Seite wiederholt, also steht der
 * Kursname mit allen Terminen auch auf Blatt zwei. Ein loses Blatt ohne
 * Kursbezeichnung ist im Ordner wertlos.
 *
 * Jede Zeile traegt break-inside: avoid, damit kein Teilnehmer zwischen zwei
 * Seiten zerschnitten wird — auf einer halben Zeile kann niemand
 * unterschreiben.
 */

/** Mehr Spalten passen auf A4 nicht mehr mit brauchbarer Breite. */
const MAX_UNTERSCHRIFTEN = 3;

export default async function TeilnehmerlisteSeite({
  params,
}: {
  params: Promise<{ kursId: string }>;
}) {
  await requireRole("ADMIN");
  const { kursId } = await params;

  const [kurs, daten] = await Promise.all([
    kursKopfLesen(kursId),
    buchungenFuerKurs(kursId),
  ]);

  if (!kurs) notFound();

  const teilnehmende = daten.zeilen.filter(
    (buchung) => buchung.status === "CONFIRMED",
  );

  // Eine Unterschriftenspalte pro Kurstag: unterschrieben wird pro Anwesenheit,
  // und ein VKU laeuft an zwei Tagen. Bei mehr Tagen als Platz bleibt eine
  // einzelne Spalte, sonst wird jede so schmal, dass niemand hineinschreiben
  // kann.
  const kurstage = [
    ...new Set(kurs.sessions.map((termin) => termin.date.toISOString())),
  ].map((wert) => new Date(wert));
  const spalten =
    kurstage.length > 0 && kurstage.length <= MAX_UNTERSCHRIFTEN
      ? kurstage.map((tag) => datum(tag))
      : ["Unterschrift"];

  return (
    <main className="mx-auto max-w-[210mm] bg-white p-6 text-black print:max-w-none print:p-0">
      <DruckKnopf />

      <table className="w-full border-collapse text-[11pt]">
        <thead className="table-header-group">
          <tr>
            <th colSpan={3 + spalten.length} className="p-0 text-left">
              <div className="mb-3 border-b-2 border-black pb-2">
                {/* priority statt Lazy-Loading: der Druckdialog wartet nicht, bis ein
                   Bild nachgeladen ist. Ohne das bleibt der Kopf auf dem Papier leer. */}
              <Image
                src="/haudis-logo.png"
                alt={ADRESSE.firma}
                width={993}
                height={586}
                priority
                className="mb-2 h-10 w-auto"
              />
              <p className="text-[9pt] font-semibold uppercase tracking-[0.15em]">
                  {ADRESSE.firma}
                </p>
                <h1 className="mt-1 text-[18pt] font-bold leading-tight">
                  {kurs.courseType.name}
                </h1>
                <p className="mt-1 text-[10pt]">
                  {kurs.sessions
                    .map(
                      (termin) =>
                        `${datumLang(termin.date)}, ${termin.startTime}–${termin.endTime}`,
                    )
                    .join(" · ")}
                </p>
                <p className="mt-0.5 text-[10pt]">
                  {ADRESSE.strasse}, {ADRESSE.plz} {ADRESSE.ort} ·{" "}
                  {teilnehmende.length}{" "}
                  {teilnehmende.length === 1 ? "Teilnehmer" : "Teilnehmende"}
                </p>
              </div>
            </th>
          </tr>
          <tr className="border-b border-black text-[9pt] uppercase tracking-wide">
            <th className="w-[8mm] py-1 text-left font-semibold">Nr</th>
            <th className="py-1 text-left font-semibold">Name</th>
            <th className="w-[32mm] py-1 text-left font-semibold">
              Ausweisnummer
            </th>
            {spalten.map((spalte) => (
              <th
                key={spalte}
                className="w-[34mm] border-l border-neutral-400 py-1 pl-2 text-left font-semibold tabular-nums"
              >
                {spalte}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {teilnehmende.map((buchung, index) => (
            <tr
              key={buchung.id}
              className="break-inside-avoid border-b border-neutral-400 align-bottom"
            >
              <td className="h-[14mm] py-1 align-middle tabular-nums">
                {index + 1}
              </td>
              <td className="py-1 align-middle">
                <span className="font-semibold">
                  {buchung.nachname} {buchung.vorname}
                </span>
                <span className="ml-2 text-[9pt] tabular-nums">
                  {datum(buchung.geburtsdatum)}
                </span>
              </td>
              <td className="py-1 align-middle tabular-nums">
                {buchung.lfaNummer ?? ""}
              </td>
              {/*
                Senkrechte Linie je Spalte: sonst ist es eine leere Flaeche und
                niemand sieht, wo die Unterschrift des zweiten Kurstags
                hingehoert. Zusammen mit der Zeilenlinie unten ergibt das ein
                Kaestchen von 34 mal 14 Millimetern.
              */}
              {spalten.map((spalte) => (
                <td key={spalte} className="border-l border-neutral-400 py-1" />
              ))}
            </tr>
          ))}

          {teilnehmende.length === 0 ? (
            <tr>
              <td colSpan={3 + spalten.length} className="py-6 text-center">
                Für diesen Kurs liegt keine Anmeldung vor.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <p className="mt-4 text-[9pt]">
        Gedruckt am {datum(new Date())}
      </p>
    </main>
  );
}
