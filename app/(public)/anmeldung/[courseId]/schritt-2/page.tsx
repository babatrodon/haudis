import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Bildplatzhalter } from "@/components/bildplatzhalter";
import { einstellungJa } from "@/lib/einstellungen";
import { BUCHUNG_COOKIE, buchungLesen } from "@/lib/buchung";
import { ErgaenzungFormular } from "./ergaenzung-formular";

export const metadata: Metadata = {
  title: "Noch zwei Angaben | Haudi's Fahrschule Baden",
  robots: { index: false, follow: false },
};

/**
 * Schritt 2. Die Anmeldung steht bereits, hier werden nur noch freiwillige
 * Angaben ergaenzt (PLAN.md: Ausweisnummer "optional nachreichbar").
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
  // ASPSMS kommt in Sprint 6, bis dahin waere die Auswahl ein Versprechen,
  // das niemand einloest.
  const smsMoeglich = await einstellungJa("sms.aktiv");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <header>
        <p className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Schritt 2 von 2
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold leading-[1.1] sm:text-5xl">
          Fast geschafft
        </h1>
        <p className="mt-5 border-l-4 border-ampel-gruen-linie bg-ampel-gruen-bg p-4 text-ampel-gruen">
          Deine Anmeldung für den {buchung.course.courseType.name} ist
          eingegangen. Die Bestätigung ist unterwegs.
        </p>
      </header>

      <div className="mt-10 border border-border bg-card p-6 sm:p-8">
        <ErgaenzungFormular kursId={courseId} smsMoeglich={smsMoeglich} />
      </div>

      {buchung.course.courseType.requiresLfa ? (
        <section
          aria-labelledby="ausweis-titel"
          className="mt-8 border border-border bg-flaeche-2 p-6"
        >
          <h2 id="ausweis-titel" className="font-heading text-lg font-bold">
            Wo steht die Nummer?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Du findest sie auf der Vorderseite Deines Lernfahrausweises.
          </p>
          <div className="mt-4">
            <Bildplatzhalter
              seitenverhaeltnis="16/10"
              beschreibung="Lernfahrausweis mit hervorgehobener Ausweisnummer"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
