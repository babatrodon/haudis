import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BuchungHuelle } from "@/components/buchung/buchung-huelle";
import { Buchungskarte } from "@/components/buchung/buchungskarte";
import { einstellungJa } from "@/lib/einstellungen";
import { BUCHUNG_COOKIE, buchungLesen } from "@/lib/buchung";
import { datumLang } from "@/lib/format";
import { ErgaenzungFormular } from "./ergaenzung-formular";

export const metadata: Metadata = {
  title: "Lernfahrausweis | Haudi's Fahrschule Baden",
  robots: { index: false, follow: false },
};

/**
 * Schritt 2, nach design/haudis-design.dc.html Screen 04.
 *
 * Die Anmeldung steht bereits. Hier kommen nur noch freiwillige Angaben dazu.
 *
 * Die Vorlage markiert die Ausweisnummer mit einem Stern, schreibt im selben
 * Block aber "Melde dich trotzdem an und schick uns die Nummer spaeter per
 * WhatsApp nach". PLAN.md Abschnitt 6 nennt das Feld optional und
 * nachreichbar. Bei einem Widerspruch ueber eine Regel gilt PLAN.md: das Feld
 * bleibt freiwillig, der Stern entfaellt, der Rest der Vorlage bleibt.
 *
 * Ohne gueltiges Cookie geht es direkt zur Bestaetigung. Das passiert, wenn
 * jemand die Adresse direkt aufruft oder das Cookie abgelaufen ist; eine
 * Fehlermeldung waere hier falsch, denn angemeldet ist die Person ohnehin.
 */
export default async function AnmeldungSchritt2({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const kekse = await cookies();
  const buchungId = kekse.get(BUCHUNG_COOKIE)?.value;

  if (!buchungId) {
    redirect(`/anmeldung/${courseId}/bestaetigung`);
  }

  const buchung = await buchungLesen(buchungId);
  if (!buchung) {
    redirect(`/anmeldung/${courseId}/bestaetigung`);
  }

  // Die SMS-Erinnerung erscheint erst, wenn der Versand auch wirklich laeuft.
  // ASPSMS kommt spaeter, bis dahin waere die Auswahl ein Versprechen, das
  // niemand einloest.
  const smsMoeglich = await einstellungJa("sms.aktiv");

  const termine = buchung.course.sessions
    .map(
      (termin) =>
        `${datumLang(termin.date)}, ${termin.startTime}–${termin.endTime}`,
    )
    .join(" · ");

  return (
    <BuchungHuelle schritt={2}>
      <ErgaenzungFormular
        kursId={courseId}
        smsMoeglich={smsMoeglich}
        lernfahrausweisNoetig={buchung.course.courseType.requiresLfa}
        zusammenfassung={
          <Buchungskarte
            posten={{
              kursName: buchung.course.courseType.name,
              termine,
              kursgebuehr: buchung.course.price,
              lehrmittel: buchung.course.materialPrice,
              total: buchung.priceCharged,
              regulaer: buchung.course.price.plus(buchung.course.materialPrice),
              fruehbucher: buchung.earlyBird,
              zahlung: "Bar am ersten Kurstag",
            }}
          />
        }
      />
    </BuchungHuelle>
  );
}
