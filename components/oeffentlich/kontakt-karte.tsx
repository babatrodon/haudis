import { MessageCircle } from "lucide-react";
import { Bildplatzhalter } from "@/components/bildplatzhalter";
import { Bezeichnung } from "@/components/oeffentlich/abschnitt";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";
import { cn } from "@/lib/utils";

/**
 * Kontaktblock mit Kartenausschnitt, nach design/haudis-design.dc.html
 * Screen 02.
 *
 * Steht am Fuss der Startseite und auf /kontakt. Beide zeigen dieselbe
 * Adresse, dieselben Nummern und dieselbe Karte; zwei Fassungen davon liefen
 * frueher oder spaeter auseinander, und eine falsche Adresse auf der einen
 * Seite merkt niemand, bis jemand vor der falschen Tuer steht.
 *
 * Die Vorlage teilt 1fr neben 620px. Der Kartenausschnitt ist bewusst ein
 * markierter Platzhalter und kein eingebetteter Kartendienst: ein iframe laedt
 * fremde Skripte und setzt Cookies, bevor jemand etwas angeklickt hat, und
 * muesste in der Datenschutzerklaerung als Auftragsverarbeiter stehen.
 *
 * Geschaeftsregel 6: beide Nummern, beide als tel:-Link. WhatsApp laeuft nur
 * ueber die erste (Entscheidung 3 vom 26.07.2026).
 */
export function KontaktKarte({
  whatsappUrl,
  titel = "Komm vorbei oder ruf an",
  titelId,
  /** Auf /kontakt traegt die Seite schon eine h1, dort ist der Titel eine h2. */
  alsUeberschrift: Ueberschrift = "h2",
  bezeichnung = "Kontakt",
  einleitung,
  className,
}: {
  whatsappUrl: string;
  titel?: string;
  titelId?: string;
  alsUeberschrift?: "h1" | "h2";
  bezeichnung?: string;
  einleitung?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-[1344px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_620px]",
        className,
      )}
    >
      <div className="px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
        <Bezeichnung>{bezeichnung}</Bezeichnung>
        <Ueberschrift
          id={titelId}
          lang="de"
          className="font-heading text-[26px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[32px] lg:text-[38px]"
        >
          {titel}
        </Ueberschrift>

        {einleitung ? (
          <p className="mt-4 max-w-[520px] leading-[1.6] text-grau-text">
            {einleitung}
          </p>
        ) : null}

        <dl className="mt-7 border-t border-flaeche-3">
          <Kontaktzeile bezeichnung="Adresse">
            {ADRESSE.strasse}
            <br />
            {ADRESSE.plz} {ADRESSE.ort}
          </Kontaktzeile>
          <Kontaktzeile bezeichnung="Telefon">
            {TELEFONNUMMERN.map((nummer) => (
              <a
                key={nummer.tel}
                href={`tel:${nummer.tel}`}
                className="block font-semibold tabular-nums underline-offset-4 hover:underline"
              >
                {nummer.anzeige}
              </a>
            ))}
          </Kontaktzeile>
          <Kontaktzeile bezeichnung="E-Mail">
            <a
              href={`mailto:${ADRESSE.email}`}
              className="underline-offset-4 hover:underline"
            >
              {ADRESSE.email}
            </a>
          </Kontaktzeile>
          <Kontaktzeile bezeichnung="Termine">
            Fahrstunden nach Vereinbarung, Kurse abends
          </Kontaktzeile>
          <Kontaktzeile bezeichnung="Sprachen">
            Deutsch, Italienisch, Spanisch, Englisch, Französisch
          </Kontaktzeile>
        </dl>

        <div className="mt-7 flex flex-wrap gap-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2.5 bg-brand-gelb px-5 font-semibold text-brand-schwarz transition-colors hover:bg-brand-gelb-dunkel"
          >
            <MessageCircle aria-hidden="true" className="size-[18px]" />
            WhatsApp schreiben
          </a>
          <a
            href={`tel:${TELEFONNUMMERN[0].tel}`}
            className="inline-flex min-h-12 items-center border border-brand-schwarz px-5 font-semibold tabular-nums transition-colors hover:bg-flaeche-2"
          >
            {TELEFONNUMMERN[0].anzeige}
          </a>
        </div>
      </div>

      <div className="relative border-flaeche-3 lg:border-l">
        <Bildplatzhalter
          beschreibung={`Kartenausschnitt: ${ADRESSE.strasse}, ${ADRESSE.plz} ${ADRESSE.ort}`}
          seitenverhaeltnis="4/3"
          className="lg:h-full"
        />
      </div>
    </div>
  );
}

/** Eine Zeile der Kontaktliste: Bezeichnung links, Angabe rechts. */
function Kontaktzeile({
  bezeichnung,
  children,
}: {
  bezeichnung: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-5 border-b border-flaeche-3 py-3 leading-[1.5] sm:grid-cols-[120px_minmax(0,1fr)]">
      <dt className="text-grau-text-hell">{bezeichnung}</dt>
      <dd>{children}</dd>
    </div>
  );
}
