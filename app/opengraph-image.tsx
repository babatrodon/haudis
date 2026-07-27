import { ImageResponse } from "next/og";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";

/**
 * Vorschaubild fuer WhatsApp, Facebook und Suchergebnisse
 * (PLAN.md Abschnitt 11).
 *
 * Zur Laufzeit gezeichnet statt als Datei abgelegt: so gibt es keine zweite
 * Stelle, an der Adresse oder Telefonnummer stehen und veralten koennen. Die
 * Nummern kommen aus lib/kontakt.ts wie ueberall sonst (Geschaeftsregel 6).
 *
 * Kein Foto. Die Fahrschule hat noch keine gelieferten Bilder, und ein
 * erfundenes oder generiertes waere in einer WhatsApp-Vorschau genau das
 * Erste, was jemand von der Fahrschule sieht. Stattdessen die Marke: gelbe
 * Fläche, schwarze Schrift, der Schrägstreifen der Fahrzeugbeklebung.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${ADRESSE.firma}, ${ADRESSE.plz} ${ADRESSE.ort}`;

const GELB = "#FFE500";
const SCHWARZ = "#121212";
const GRAU = "#56524B";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Schraegstreifen wie auf dem Fahrzeug, oben als Kante. */}
        <div
          style={{
            height: 24,
            backgroundImage: `repeating-linear-gradient(115deg, ${SCHWARZ} 0 24px, ${SCHWARZ} 24px, ${GELB} 24px, ${GELB} 48px)`,
          }}
        />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: GELB,
              color: SCHWARZ,
              fontSize: 26,
              fontWeight: 700,
              padding: "10px 18px",
              letterSpacing: 1,
            }}
          >
            FAHRSCHULE UND VERKEHRSZENTRUM
          </div>

          <div
            style={{
              display: "flex",
              color: SCHWARZ,
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1.05,
              marginTop: 28,
              letterSpacing: -2,
            }}
          >
            Haudi&apos;s Fahrschule
          </div>

          <div
            style={{
              display: "flex",
              color: GRAU,
              fontSize: 34,
              marginTop: 20,
            }}
          >
            VKU · Nothelfer · Theorie · Fahrstunden
          </div>

          <div
            style={{
              display: "flex",
              gap: 28,
              marginTop: 40,
              color: SCHWARZ,
              fontSize: 30,
              fontWeight: 600,
            }}
          >
            <span>
              {ADRESSE.strasse}, {ADRESSE.plz} {ADRESSE.ort}
            </span>
            <span style={{ color: "#C9C5BC" }}>|</span>
            <span>{TELEFONNUMMERN[0].anzeige}</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
