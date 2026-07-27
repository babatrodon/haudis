import { buchungenFuerKurs, kursKopfLesen } from "@/lib/admin/buchungen";
import { csvErzeugen, dateiname } from "@/lib/admin/csv";
import { requireRole } from "@/lib/auth-guard";
import { datum } from "@/lib/format";

/**
 * Teilnehmerliste als CSV.
 *
 * Route Handler statt Server Action, weil ein Download eine Antwort mit
 * eigenen Kopfzeilen braucht.
 *
 * requireRole leitet auf den Login um, wenn niemand angemeldet ist. Das gilt
 * auch hier: eine Teilnehmerliste enthaelt Adressen und Geburtsdaten und darf
 * nicht an einer ungeschuetzten Adresse haengen.
 */
export async function GET(
  _anfrage: Request,
  { params }: { params: Promise<{ kursId: string }> },
) {
  await requireRole("ADMIN");
  const { kursId } = await params;

  const [kurs, daten] = await Promise.all([
    kursKopfLesen(kursId),
    buchungenFuerKurs(kursId),
  ]);

  if (!kurs) {
    return new Response("Kurs nicht gefunden", { status: 404 });
  }

  const inhalt = csvErzeugen(
    [
      "Nr",
      "Anrede",
      "Nachname",
      "Vorname",
      "Geburtsdatum",
      "Strasse",
      "PLZ",
      "Ort",
      "Telefon",
      "E-Mail",
      "Ausweisnummer",
      "Fahrlehrer",
      "Anmeldung",
      "Status",
      "Preis",
    ],
    daten.zeilen.map((buchung, index) => [
      index + 1,
      buchung.anrede,
      buchung.nachname,
      buchung.vorname,
      datum(buchung.geburtsdatum),
      buchung.strasse,
      buchung.plz,
      buchung.ort,
      buchung.telefon,
      buchung.email,
      buchung.lfaNummer ?? "",
      buchung.fahrlehrer?.kuerzel ?? "",
      buchung.quelle === "PHONE" ? "telefonisch" : "online",
      buchung.status === "CONFIRMED" ? "bestätigt" : "storniert",
      // Ohne Waehrungszeichen und mit Punkt: so bleibt es in Excel eine Zahl,
      // mit der sich rechnen laesst.
      buchung.preis.toFixed(2),
    ]),
  );

  const name = dateiname([
    kurs.courseType.code,
    kurs.sessions[0] ? datum(kurs.sessions[0].date) : "ohne-termin",
    "Teilnehmer",
  ]);

  return new Response(inhalt, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
      // Eine Teilnehmerliste gehoert in keinen Cache, weder im Browser noch
      // unterwegs.
      "Cache-Control": "no-store",
    },
  });
}
