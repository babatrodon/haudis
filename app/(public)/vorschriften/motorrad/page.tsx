import type { Metadata } from "next";
import { VorschriftenSeite } from "@/components/oeffentlich/vorschriften-seite";
import { VORSCHRIFTEN_MOTORRAD } from "@/lib/inhalte/vorschriften";

export const metadata: Metadata = {
  title: "Vorschriften Motorrad | Haudi's Fahrschule Baden",
  description:
    "Kategorien A1 und A, Mindestalter, der obligatorische Grundkurs mit zwölf Stunden und die Gültigkeit des Lernfahrausweises.",
};

export default function VorschriftenMotorradSeite() {
  return <VorschriftenSeite seite={VORSCHRIFTEN_MOTORRAD} />;
}
