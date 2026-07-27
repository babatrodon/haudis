import type { ReactNode } from "react";
import { Kopfzeile } from "@/components/oeffentlich/kopfzeile";
import { Fusszeile } from "@/components/oeffentlich/fusszeile";
import { StrukturierteDaten } from "@/components/strukturierte-daten";
import { googleProfilLesen } from "@/lib/google";
import { whatsappLink } from "@/lib/einstellungen";
import { oeffnungszeitenLesen } from "@/lib/oeffnungszeiten";

/**
 * Huelle aller oeffentlichen Seiten (PLAN.md Abschnitt 3).
 *
 * /admin, /portal und /team liegen ausserhalb dieser Gruppe und bekommen
 * weder Kopf- noch Fusszeile.
 */

/**
 * Die oeffentlichen Seiten werden vorgerendert, das ist der halbe
 * Lighthouse-Wert. Ohne Revalidierung stuenden die Einstellungen allerdings so
 * in der Seite, wie sie beim Deploy waren: aendert Ausilia ab Sprint 4 eine
 * Telefonnummer oder einen Preis, bliebe die alte stehen.
 *
 * Eine Stunde ist der Kompromiss. Wenn die Einstellungen im Admin gespeichert
 * werden, soll die Aktion zusaetzlich revalidatePath("/", "layout") aufrufen,
 * dann ist die Aenderung sofort sichtbar.
 */
export const revalidate = 3600;

/**
 * Selbstbezuegliches canonical fuer jede oeffentliche Seite.
 *
 * Der Anlass sind die Weiterleitungen vom alten haudi.ch: Next haengt eine
 * nicht verwendete Query an das Ziel, aus `/kontakt/default.asp?nav=10` wird
 * `/kontakt?nav=10`. Ohne canonical kann Google das als eigene Adresse
 * fuehren, und die Signale verteilen sich auf zwei Fassungen derselben Seite —
 * dasselbe Problem wie bei www gegen apex, nur eine Ebene tiefer.
 *
 * Es hilft darueber hinaus bei allem, was Parameter anhaengt: utm_source aus
 * einer Kampagne, fbclid aus einem geteilten Link, gclid aus einer Anzeige.
 *
 * "./" heisst fuer Next: der vollstaendige aktuelle Pfad, aufgeloest gegen
 * metadataBase aus app/layout.tsx — NICHT nach den Regeln relativer URLs.
 * Verschachtelte Seiten zeigen deshalb auf sich selbst: /kurse/vku bleibt
 * /kurse/vku und wird nicht zu /kurse. Geprueft in
 * scripts/verify-redirects.mts, weil ein Next-Update das aendern koennte und
 * eine einstufige Seite wie /kontakt den Fehler nicht zeigen wuerde.
 *
 * GEWOLLTE FOLGE: GEFILTERTE LISTEN ZEIGEN AUF DIE UNGEFILTERTE
 *
 * `/kursdaten?art=vku` nennt `/kursdaten` als kanonische Adresse. Das ist kein
 * Versehen, sondern der Zweck: die gefilterte Ansicht zeigt eine Teilmenge
 * derselben Kurse mit demselben Text ringsherum. Zwei Adressen mit
 * weitgehend gleichem Inhalt konkurrieren gegeneinander, und am Ende rankt
 * keine von beiden.
 *
 * Die Filter verlieren dadurch nichts, was sie je hatten — sie sind ein
 * Bedienelement, kein Inhalt. Wer die Kursarten einzeln in die Suche bringen
 * will, nimmt dafuer die Kursseiten unter `/kurse/[slug]`: die haben eigenen
 * Text, stehen in der Sitemap und canonicalisieren auf sich selbst.
 */
export const metadata = {
  alternates: { canonical: "./" },
};
export default async function OeffentlichLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [profil, zeiten, whatsappUrl] = await Promise.all([
    googleProfilLesen(),
    oeffnungszeitenLesen(),
    whatsappLink("whatsapp.text.auto"),
  ]);

  return (
    <>
      <StrukturierteDaten profil={profil} zeiten={zeiten} />
      <Kopfzeile whatsappUrl={whatsappUrl} />
      <div className="flex flex-1 flex-col">{children}</div>
      <Fusszeile zeiten={zeiten} />
    </>
  );
}
