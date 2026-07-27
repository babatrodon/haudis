import type { MetadataRoute } from "next";
import { aktiveKursarten } from "@/lib/kurse";
import { absoluteUrl } from "@/lib/seite";

/**
 * Sitemap (PLAN.md Abschnitt 11).
 *
 * Enthaelt genau die Seiten, die auch in den Index sollen. Nicht dabei:
 *
 *   /anmeldung/*   transaktional und auf noindex
 *   /agb, /datenschutz, /impressum
 *                  Entwuerfe, solange sie nicht juristisch freigegeben sind
 *                  (RECHTSTEXT_ROBOTS). Eine Sitemap, die auf noindex-Seiten
 *                  zeigt, ist ein Widerspruch: sie bittet um Aufnahme und
 *                  verbietet sie im selben Atemzug. Nach der Freigabe kommen
 *                  die drei hier dazu.
 *   /admin, /portal, /team, /druck
 *                  nicht oeffentlich
 *
 * Die Kursseiten kommen aus der Datenbank und nicht aus einer Liste im Code:
 * eine Kursart ohne bestaetigten Preis steht auf inaktiv und erscheint
 * oeffentlich nirgends. Sie gehoert dann auch nicht in die Sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jetzt = new Date();

  /**
   * changeFrequency und priority sind Hinweise, keine Anweisungen. Gesetzt
   * werden sie trotzdem, weil sie die Rangfolge innerhalb der eigenen Seite
   * beschreiben: die Kursdaten aendern sich woechentlich, das Impressum nie.
   */
  const feste: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/kursdaten"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/kurse"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/fahrstunden"), changeFrequency: "monthly", priority: 0.8 },
    {
      url: absoluteUrl("/fuehrerausweis"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: absoluteUrl("/boegle"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/kontakt"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/galerie"), changeFrequency: "monthly", priority: 0.4 },
    {
      url: absoluteUrl("/vorschriften/auto"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/vorschriften/motorrad"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  const kursarten = await aktiveKursarten();
  const kursseiten: MetadataRoute.Sitemap = kursarten.map((kursart) => ({
    url: absoluteUrl(`/kurse/${kursart.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...feste, ...kursseiten].map((eintrag) => ({
    lastModified: jetzt,
    ...eintrag,
  }));
}
