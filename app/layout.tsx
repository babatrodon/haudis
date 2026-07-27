import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ADRESSE } from "@/lib/kontakt";
import { SEITEN_URL } from "@/lib/seite";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

/**
 * Grundangaben fuer jede Seite (PLAN.md Abschnitt 11).
 *
 * metadataBase ist die Voraussetzung fuer alles Weitere: ohne sie bleiben
 * OpenGraph-Bild und canonical relativ, und relative Adressen taugen weder in
 * einer WhatsApp-Vorschau noch in einem Suchergebnis. Der Wert kommt aus der
 * Umgebung (lib/seite.ts), damit er beim Umzug auf haudi.ch an einer Stelle
 * wechselt.
 *
 * Das OpenGraph-Bild selbst deklariert diese Datei nicht: Next findet
 * app/opengraph-image.tsx von selbst und haengt es an jede Seite, die nichts
 * Eigenes mitbringt.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SEITEN_URL),
  title: {
    default: "Haudi's Fahrschule & Verkehrsschule Baden",
    // Unterseiten setzen ihren eigenen Titel; die Vorlage haengt den Namen an.
    template: "%s | Haudi's Fahrschule Baden",
  },
  description:
    "Fahrschule und Verkehrsschule in Baden. VKU, Nothelferkurs, BTU, Motorrad-Grundkurse und Fahrstunden.",
  applicationName: ADRESSE.firma,
  openGraph: {
    type: "website",
    locale: "de_CH",
    siteName: ADRESSE.firma,
    url: SEITEN_URL,
    title: "Haudi's Fahrschule & Verkehrsschule Baden",
    description:
      "VKU, Nothelferkurs, Theorieunterricht und Fahrstunden in Baden. Montag bis Samstag, 350 m vom Bahnhof.",
  },
  twitter: { card: "summary_large_image" },
  // Der Ortsbezug ist bei einer Fahrschule die halbe Suche.
  keywords: [
    "Fahrschule Baden",
    "VKU Baden",
    "Nothelferkurs Baden",
    "Verkehrskundeunterricht",
    "Fahrstunden Aargau",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de-CH"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
