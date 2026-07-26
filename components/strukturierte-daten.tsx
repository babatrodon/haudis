import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";
import type { GoogleProfil } from "@/lib/google";
import type { Oeffnungszeiten } from "@/lib/oeffnungszeiten";
import { einstellungenLesen } from "@/lib/einstellungen";

/**
 * schema.org DrivingSchool fuer die Suchergebnisse (PLAN.md Abschnitt 11).
 *
 * DrivingSchool ist ein Untertyp von LocalBusiness, deshalb genuegt der eine
 * Typ. Enthalten sind Adresse, Koordinaten, beide Telefonnummern,
 * Oeffnungszeiten und die Gesamtbewertung.
 *
 * Die Bewertung kommt aus den Einstellungen und ist eine Momentaufnahme. Sie
 * wird nur ausgegeben, wenn sowohl Wert als auch Anzahl gepflegt sind:
 * aggregateRating ohne reviewCount ist laut Google unvollstaendig.
 */
export async function StrukturierteDaten({
  profil,
  zeiten,
}: {
  profil: GoogleProfil;
  zeiten: Oeffnungszeiten;
}) {
  const werte = await einstellungenLesen();

  const daten: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    name: ADRESSE.firma,
    address: {
      "@type": "PostalAddress",
      streetAddress: ADRESSE.strasse,
      postalCode: ADRESSE.plz,
      addressLocality: ADRESSE.ort,
      addressRegion: "AG",
      addressCountry: "CH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: werte["geo.breitengrad"],
      longitude: werte["geo.laengengrad"],
    },
    // Beide Nummern, wie ueberall sonst auch (Geschaeftsregel 6).
    telephone: TELEFONNUMMERN.map((n) => n.tel),
    email: ADRESSE.email,
    openingHours: zeiten.schemaOrg,
    areaServed: "Baden AG",
    hasMap: profil.profilUrl,
  };

  if (profil.bewertung !== null && profil.anzahlBewertungen !== null) {
    daten.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: profil.bewertung,
      reviewCount: profil.anzahlBewertungen,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      // Kein Nutzertext in diesem Objekt, alle Werte stammen aus den
      // Einstellungen und aus lib/kontakt.ts.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(daten) }}
    />
  );
}
