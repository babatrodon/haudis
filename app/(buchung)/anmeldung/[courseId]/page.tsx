import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuchungHuelle } from "@/components/buchung/buchung-huelle";
import {
  Buchungskarte,
  Zahlungsarten,
} from "@/components/buchung/buchungskarte";
import { datumLang, datumZeit } from "@/lib/format";
import { kommendeKurse } from "@/lib/kurse";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { einladungLesen } from "@/lib/warteliste";
import { AnmeldeFormular } from "./anmelde-formular";
import { WartelisteFormular } from "./warteliste-formular";

export const metadata: Metadata = {
  title: "Anmeldung | Haudi's Fahrschule Baden",
  robots: { index: false, follow: true },
};

/**
 * Schritt 1 der Anmeldung, nach design/haudis-design.dc.html Screen 04.
 *
 * Die Kapazitaet wird hier erneut geprueft, obwohl die Kurskarte den Knopf bei
 * einem vollen Kurs schon ausblendet: ueber einen Direktlink oder einen alten
 * Tab kommt man sonst in ein Formular, das beim Abschicken scheitert. Die
 * eigentliche Absicherung sitzt in der Transaktion in lib/buchung.ts, das hier
 * erspart der Kundin nur den vergeblichen Weg.
 */
export default async function AnmeldungSchritt1({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ einladung?: string }>;
}) {
  const { courseId } = await params;
  const { einladung: token } = await searchParams;
  const kurse = await kommendeKurse();
  const kurs = kurse.find((eintrag) => eintrag.id === courseId);

  if (!kurs) {
    notFound();
  }

  const termine = kurs.termine
    .map((termin) => `${datumLang(termin.datum)}, ${termin.von}–${termin.bis}`)
    .join(" · ");

  // Einladung von der Warteliste. Sie oeffnet einen Kurs, der fuer alle
  // anderen ausgebucht ist — genau den Platz, den sie reserviert hat.
  const einladung = token ? await einladungLesen(token, courseId) : null;

  if (!kurs.verfuegbarkeit.buchbar && !einladung?.gueltig) {
    return (
      <BuchungHuelle schritt={1}>
        {einladung ? (
          <EinladungAbgelaufen
            kursName={kurs.kursart.name}
            grund={einladung.grund}
          />
        ) : null}
        <WartelisteFormular
          kursId={kurs.id}
          kursName={kurs.kursart.name}
          telefonnummern={[...TELEFONNUMMERN]}
        />
      </BuchungHuelle>
    );
  }

  return (
    <BuchungHuelle schritt={1}>
      {einladung?.gueltig ? (
        <p className="mx-4 mt-6 border-l-4 border-brand-gelb bg-flaeche-1 p-4 text-sm leading-[1.55] sm:mx-8 lg:mx-12">
          <strong>Dein Platz ist reserviert bis {datumZeit(einladung.frist)}.</strong>{" "}
          Danach geben wir ihn an die nächste Person auf der Warteliste weiter.
        </p>
      ) : null}

      <AnmeldeFormular
        kursId={kurs.id}
        einladungsToken={einladung?.gueltig ? token : undefined}
        titel="Deine Angaben"
        einleitung={`Für die Anmeldung zum ${kurs.kursart.name}, ${termine}.`}
        zusammenfassung={
          <>
            <Buchungskarte
              posten={{
                kursName: kurs.kursart.name,
                termine,
                kursgebuehr: kurs.preis,
                lehrmittel: kurs.materialpreis,
                total: kurs.naechsterPreis,
                regulaer: kurs.gesamtpreis,
                fruehbucher: kurs.naechsterPreis.lt(kurs.gesamtpreis),
              }}
            />
            <div className="mt-5 lg:mt-6">
              <Zahlungsarten />
            </div>
          </>
        }
      />

      <p className="px-4 pb-8 text-[13px] leading-[1.55] text-grau-text-hell sm:px-8 lg:px-12">
        Lieber telefonisch anmelden? Ruf uns an:{" "}
        {TELEFONNUMMERN.map((nummer, index) => (
          <span key={nummer.tel}>
            {index > 0 ? " oder " : ""}
            <a
              href={`tel:${nummer.tel}`}
              className="font-semibold tabular-nums text-foreground underline-offset-4 hover:underline"
            >
              {nummer.anzeige}
            </a>
          </span>
        ))}
      </p>
    </BuchungHuelle>
  );
}

/**
 * Eine Einladung, die nicht mehr gilt.
 *
 * Steht ueber dem Wartelisten-Formular: der Platz ist weg, aber der Weg zurueck
 * in die Schlange ist gleich darunter. Ohne diesen Hinweis waere das Formular
 * eine stumme Antwort auf einen Link, den jemand extra angeklickt hat.
 */
function EinladungAbgelaufen({
  kursName,
  grund,
}: {
  kursName: string;
  grund: "unbekannt" | "abgelaufen" | "verbraucht";
}) {
  const text = {
    abgelaufen: `Die Frist für Deinen Platz im ${kursName} ist abgelaufen, wir haben ihn weitergegeben.`,
    verbraucht: `Für diesen Link liegt bereits eine Anmeldung vor. Falls das nicht Du warst, ruf uns an.`,
    unbekannt: `Dieser Einladungslink gilt nicht für diesen Kurs.`,
  }[grund];

  return (
    <div className="mx-4 mt-6 border-l-4 border-brand-rot bg-flaeche-1 p-4 sm:mx-8 lg:mx-12">
      <p className="text-sm leading-[1.55]">
        <strong>Der Link ist nicht mehr gültig.</strong> {text}
      </p>
    </div>
  );
}
