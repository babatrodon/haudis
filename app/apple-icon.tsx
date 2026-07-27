import { ImageResponse } from "next/og";

/**
 * Symbol fuer den iOS-Startbildschirm (PLAN.md Abschnitt 11).
 *
 * Eigene Datei statt einer Groessenvariante von app/icon.tsx, weil iOS das
 * Bild anders behandelt: es beschneidet auf abgerundete Ecken und legt es auf
 * den Startbildschirm, also darf nichts Wichtiges am Rand liegen. Deshalb hier
 * mehr Luft um den Buchstaben als beim 32-Pixel-Favicon.
 *
 * Gleiche Markenfarben wie das Favicon, damit Tab und Startbildschirm
 * zusammengehoeren.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 104,
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
