import type { Metadata } from "next";
import { Bildplatzhalter } from "@/components/bildplatzhalter";
import { KontaktStreifen } from "@/components/oeffentlich/kontakt-streifen";
import { SeitenKopf } from "@/components/oeffentlich/seiten-kopf";
import { whatsappLink } from "@/lib/einstellungen";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

export const metadata: Metadata = {
  title: "Galerie | Haudi's Fahrschule Baden",
  description:
    "Ein Blick auf unsere Ausbildungsfahrzeuge, den Schulungsraum an der Haselstrasse 33 und unser Team.",
};

/**
 * Galerie.
 *
 * Die Fotos kommen von der Kundin und werden vor dem Launch eingesetzt. Bis
 * dahin stehen markierte Platzhalter mit dem richtigen Seitenverhaeltnis: das
 * Raster stimmt schon jetzt und beim Austausch springt nichts.
 *
 * PLAN.md Abschnitt 10 schliesst KI-generierte Bilder aus.
 */

const BILDER = [
  { beschreibung: "Ausbildungsfahrzeug von aussen, Front mit Beschriftung", format: "4/3" },
  { beschreibung: "Cockpit mit Doppelsteuerung", format: "4/3" },
  { beschreibung: "Schulungsraum an der Haselstrasse 33", format: "4/3" },
  { beschreibung: "Ausilia Haudenschild im Gespräch mit einer Fahrschülerin", format: "4/3" },
  { beschreibung: "Motorrad für die Grundkurse", format: "4/3" },
  { beschreibung: "Das Team vor dem Schulungsraum", format: "4/3" },
  { beschreibung: "Ausbildungsfahrzeug beim Bahnhof Baden", format: "4/3" },
  { beschreibung: "Theorieunterricht im Schulungsraum", format: "4/3" },
  { beschreibung: "Lastwagen für die Kategorie C", format: "4/3" },
];

export default async function GalerieSeite() {
  const [zeiten, kontaktUrl] = await Promise.all([
    oeffnungszeitenLesen(),
    whatsappLink("whatsapp.text.allgemein"),
  ]);

  return (
    <div className="bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
      <SeitenKopf bezeichnung="Einblick" titel="Galerie">
        <p>
          Unsere Fahrzeuge, der Schulungsraum und das Team. Komm vorbei und
          schau es Dir selbst an, wir sind an der Haselstrasse 33 in Baden.
        </p>
      </SeitenKopf>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BILDER.map((bild) => (
          <Bildplatzhalter
            key={bild.beschreibung}
            beschreibung={bild.beschreibung}
            seitenverhaeltnis={bild.format}
          />
        ))}
      </div>

      <div className="mt-16">
        <KontaktStreifen zeiten={zeiten} whatsappUrl={kontaktUrl} />
      </div>
      </div>
    </div>
  );
}
