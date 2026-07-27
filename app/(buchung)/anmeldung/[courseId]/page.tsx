import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuchungHuelle } from "@/components/buchung/buchung-huelle";
import {
  Buchungskarte,
  Zahlungsarten,
} from "@/components/buchung/buchungskarte";
import { datumLang } from "@/lib/format";
import { kommendeKurse } from "@/lib/kurse";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { AnmeldeFormular } from "./anmelde-formular";

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
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const kurse = await kommendeKurse();
  const kurs = kurse.find((eintrag) => eintrag.id === courseId);

  if (!kurs) {
    notFound();
  }

  const termine = kurs.termine
    .map((termin) => `${datumLang(termin.datum)}, ${termin.von}–${termin.bis}`)
    .join(" · ");

  if (!kurs.verfuegbarkeit.buchbar) {
    return (
      <BuchungHuelle schritt={1}>
        <Ausgebucht kursName={kurs.kursart.name} />
      </BuchungHuelle>
    );
  }

  return (
    <BuchungHuelle schritt={1}>
      <AnmeldeFormular
        kursId={kurs.id}
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
 * Ausgebucht. Kein Formular, sondern der Weg, der jetzt noch offen ist:
 * anrufen. Geschaeftsregel 2 nimmt den Knopf weg, hier steht, was stattdessen
 * hilft.
 */
function Ausgebucht({ kursName }: { kursName: string }) {
  return (
    <div className="px-4 py-10 sm:px-8 lg:px-12 lg:py-14">
      <h1 className="font-heading text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] lg:text-[40px]">
        Dieser Kurs ist ausgebucht
      </h1>
      <p className="mt-3 max-w-[520px] text-grau-text">
        Für den {kursName} gibt es keinen freien Platz mehr. Ruf uns an, wir
        sagen Dir, wann der nächste startet.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {TELEFONNUMMERN.map((nummer) => (
          <a
            key={nummer.tel}
            href={`tel:${nummer.tel}`}
            className="inline-flex min-h-12 items-center border border-brand-schwarz px-5 font-semibold tabular-nums"
          >
            {nummer.anzeige}
          </a>
        ))}
        <Link
          href="/kursdaten"
          className="inline-flex min-h-12 items-center px-2 font-semibold underline underline-offset-4"
        >
          Andere Kurse ansehen
        </Link>
      </div>
    </div>
  );
}
