import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { MessageCircle } from "lucide-react";
import { BuchungHuelle } from "@/components/buchung/buchung-huelle";
import { whatsappLink } from "@/lib/einstellungen";
import { chf, datumLang } from "@/lib/format";
import { BUCHUNG_COOKIE, buchungLesen } from "@/lib/buchung";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";

export const metadata: Metadata = {
  title: "Anmeldung bestätigt | Haudi's Fahrschule Baden",
  robots: { index: false, follow: false },
};

/**
 * Schritt 3, nach design/haudis-design.dc.html Screen 04.
 *
 * Zeigt die Buchung, wenn das Cookie noch da ist, sonst eine allgemeine
 * Bestaetigung. Beide Faelle sind gueltig: die Anmeldung steht seit Schritt 1,
 * unabhaengig davon, ob dieser Browser sie noch zuordnen kann.
 *
 * Die Ueberschrift nennt das Datum des ersten Kurstags. "Wir sehen uns am 11.
 * August" ist die Bestaetigung, die haengen bleibt — eine Nummer oder ein
 * Verweis auf eine Mail ist es nicht.
 */
export default async function AnmeldungBestaetigung({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await params;
  const kekse = await cookies();
  const buchungId = kekse.get(BUCHUNG_COOKIE)?.value;
  const buchung = buchungId ? await buchungLesen(buchungId) : null;
  const whatsappUrl = await whatsappLink("whatsapp.text.buchung");

  const ersterTermin = buchung?.course.sessions[0]?.date;
  const ersterTag = ersterTermin
    ? new Intl.DateTimeFormat("de-CH", {
        timeZone: "Europe/Zurich",
        day: "numeric",
        month: "long",
      }).format(ersterTermin)
    : null;

  return (
    <BuchungHuelle schritt={3}>
      <div className="grid grid-cols-1 gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14 lg:px-12 lg:py-12">
        <div>
          <p className="flex items-center gap-3.5">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center bg-brand-gelb lg:size-[68px]"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 14 14"
                fill="none"
                className="lg:size-8"
              >
                <path
                  d="M2 7.5L5.5 11L12 3"
                  stroke="#121212"
                  strokeWidth="2.4"
                  strokeLinecap="square"
                />
              </svg>
            </span>
            <span className="text-sm font-semibold text-grau-text">
              Anmeldung eingegangen
            </span>
          </p>

          <h1 className="mt-5 font-heading text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] lg:text-[44px]">
            {ersterTag
              ? `Du bist angemeldet. Wir sehen uns am ${ersterTag}.`
              : "Du bist angemeldet."}
          </h1>

          <p className="mt-4 max-w-[560px] leading-[1.6] text-grau-text lg:text-[17px]">
            {buchung?.email
              ? "Du erhältst die Bestätigung per E-Mail. "
              : "Wir haben Deine Anmeldung notiert. "}
            Bring am ersten Abend
            {buchung?.course.courseType.requiresLfa
              ? " Deinen Lernfahrausweis"
              : " Schreibzeug"}{" "}
            mit. Bezahlt wird wie gewählt:{" "}
            <span className="font-semibold text-foreground">
              Bar am ersten Kurstag
            </span>
            .
          </p>

          {buchung ? (
            <dl className="mt-9 border-t border-flaeche-3">
              <Zeile bezeichnung="Kurs" wert={buchung.course.courseType.name} />
              <Zeile
                bezeichnung="Termine"
                wert={buchung.course.sessions
                  .map(
                    (termin) =>
                      `${datumLang(termin.date)}, ${termin.startTime}–${termin.endTime}`,
                  )
                  .join("\n")}
              />
              <Zeile
                bezeichnung="Ort"
                wert={`${ADRESSE.strasse}, ${ADRESSE.plz} ${ADRESSE.ort}`}
              />
              <Zeile bezeichnung="Total" wert={chf(buchung.priceCharged)} betont />
              {buchung.lfaNumber ? (
                <Zeile bezeichnung="Ausweisnummer" wert={buchung.lfaNumber} />
              ) : null}
              {buchung.smsReminder ? (
                <Zeile bezeichnung="SMS-Erinnerung" wert="am Vortag um 18.00" />
              ) : null}
            </dl>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center border border-brand-schwarz px-5 font-semibold transition-colors hover:bg-flaeche-2"
            >
              Zurück zum Anfang
            </Link>
            <Link
              href="/kursdaten"
              className="inline-flex min-h-12 items-center px-1 font-semibold [border-bottom:2px_solid_var(--brand-gelb)]"
            >
              Weitere Kurse ansehen
            </Link>
          </div>
        </div>

        <aside>
          <div className="border border-flaeche-3 p-5 lg:p-7">
            <h2 className="font-heading text-xl font-semibold lg:text-[22px]">
              Frage zur Buchung?
            </h2>
            <p className="mt-2 text-sm leading-[1.55] text-grau-text">
              Schreib uns direkt. Wir antworten meist innerhalb einer Stunde.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex min-h-13 items-center justify-center gap-2.5 bg-brand-gelb px-4 py-3 text-center font-semibold text-brand-schwarz transition-colors hover:bg-brand-gelb-dunkel"
            >
              <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
              Frage zur Buchung? Schreib uns
            </a>

            <ul className="mt-5 space-y-1.5 text-sm">
              {TELEFONNUMMERN.map((nummer) => (
                <li key={nummer.tel}>
                  <a
                    href={`tel:${nummer.tel}`}
                    className="tabular-nums underline-offset-4 hover:underline"
                  >
                    {nummer.anzeige}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${ADRESSE.email}`}
                  className="underline-offset-4 hover:underline"
                >
                  {ADRESSE.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Diagonalstreifen aus der Vorlage, Referenz an die
              Fahrzeugbeklebung. */}
          <div
            aria-hidden="true"
            className="mt-4 h-2"
            style={{
              background:
                "repeating-linear-gradient(115deg,#121212 0 14px,#121212 14px,transparent 14px,transparent 28px),#FFE500",
            }}
          />
        </aside>
      </div>
    </BuchungHuelle>
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
    <div className="grid grid-cols-1 gap-1 border-b border-flaeche-3 py-3.5 text-[15px] sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-grau-text-hell">{bezeichnung}</dt>
      <dd className={`whitespace-pre-line ${betont ? "font-semibold" : ""}`}>
        {wert}
      </dd>
    </div>
  );
}
