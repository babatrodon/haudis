import type { Metadata } from "next";
import { VorschriftenSeite } from "@/components/oeffentlich/vorschriften-seite";
import { VORSCHRIFTEN_AUTO } from "@/lib/inhalte/vorschriften";

export const metadata: Metadata = {
  title: "Vorschriften Auto | Haudi's Fahrschule Baden",
  description:
    "Kategorie B: Lernfahrausweis ab 17, Anforderungen an die Begleitperson, Probezeit und WAB-Kurs. Stand nach der Revision vom 1. Januar 2021.",
};

export default function VorschriftenAutoSeite() {
  return <VorschriftenSeite seite={VORSCHRIFTEN_AUTO} />;
}
