import { ImageResponse } from "next/og";

/**
 * Favicon (PLAN.md Abschnitt 11).
 *
 * Bewusst NICHT das Schriftlogo: "Haudi's Fahrschule & Verkehrsschule" ist bei
 * 32 Pixeln ein grauer Fleck. Ein Favicon muss auf einem vollen Tab-Balken
 * erkennbar sein, und dafuer taugt nur ein einzelnes Zeichen.
 *
 * Deshalb die Markenfarben und ein H: gelbe Flaeche, schwarzer Buchstabe,
 * dieselben Tokens wie in app/globals.css. Das Schriftlogo bleibt davon
 * unberuehrt und steht weiterhin in der Kopfzeile (Vorlage, Style Tile:
 * "Bestehendes Schriftlogo bleibt unveraendert").
 *
 * Liefert die Kundin spaeter eine eigene Bildmarke, ersetzt sie diese Datei
 * durch ein icon.png in derselben Groesse.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFE500",
          color: "#121212",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        H
      </div>
    ),
    size,
  );
}
