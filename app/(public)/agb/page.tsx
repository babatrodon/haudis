import type { Metadata } from "next";
import Link from "next/link";
import {
  Abschnitt,
  Offen,
  Rechtstext,
  RECHTSTEXT_ROBOTS,
} from "@/components/oeffentlich/rechtstext";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen | Haudi's Fahrschule Baden",
  robots: RECHTSTEXT_ROBOTS,
};

/**
 * AGB, Entwurf.
 *
 * Der Zahlungsteil beschreibt bewusst nur Barzahlung am ersten Kurstag. Die
 * Online-Zahlung ueber Payrexx kommt in Welle 2 (PLAN.md Abschnitt 14) und
 * wird dann hier ergaenzt.
 *
 * Alle Fristen und Gebuehren sind Vorschlaege und muessen von der Kundin
 * bestaetigt werden, bevor der Text live geht.
 */
export default function AgbSeite() {
  return (
    <Rechtstext
      titel="Allgemeine Geschäftsbedingungen"
      stand="Juli 2026"
    >
      <Abschnitt titel="1. Geltungsbereich">
        <p>
          Diese Bedingungen gelten für alle Kurse und Fahrlektionen von{" "}
          {ADRESSE.firma}, {ADRESSE.strasse}, {ADRESSE.plz} {ADRESSE.ort}. Mit
          der Anmeldung akzeptierst Du sie.
        </p>
      </Abschnitt>

      <Abschnitt titel="2. Anmeldung">
        <p>
          Die Anmeldung erfolgt über das Formular auf dieser Website,
          telefonisch oder persönlich. Sie ist verbindlich, sobald wir sie
          bestätigt haben. Bei der Online-Anmeldung erhältst Du die Bestätigung
          per E-Mail, bei der telefonischen Anmeldung mündlich.
        </p>
        <p>
          Die Plätze werden in der Reihenfolge des Eingangs vergeben. Ist ein
          Kurs ausgebucht, melden wir uns mit dem nächsten möglichen Datum.
        </p>
      </Abschnitt>

      <Abschnitt titel="3. Preise und Zahlung">
        <p>
          Es gelten die auf dieser Website angegebenen Preise in Schweizer
          Franken. Der Kurspreis versteht sich inklusive Lehrmittel, sofern
          nichts anderes vermerkt ist.
        </p>
        <p>
          Der Betrag ist bar zu Beginn des ersten Kurstages zu bezahlen. Bitte
          bring ihn passend mit.
        </p>
        <p>
          Der Frühbucherrabatt von 10 Prozent gilt für die ersten fünf
          Anmeldungen eines Kurses und wird beim Anmelden automatisch
          abgezogen. Er ist nicht mit anderen Rabatten kumulierbar.
        </p>
      </Abschnitt>

      <Abschnitt titel="4. Abmeldung und Nichterscheinen">
        <p>
          Eine Abmeldung ist bis{" "}
          <Offen>Frist festlegen, Vorschlag: 14 Tage vor Kursbeginn</Offen>{" "}
          kostenlos möglich. Danach stellen wir{" "}
          <Offen>Betrag oder Prozentsatz festlegen</Offen> in Rechnung. Bei
          Nichterscheinen ohne Abmeldung ist der volle Kurspreis geschuldet.
        </p>
        <p>
          Kannst Du aus medizinischen Gründen nicht teilnehmen, melde Dich
          bitte so früh wie möglich. Mit einem Arztzeugnis suchen wir eine
          Lösung.
        </p>
        <p>
          Für abgesagte Fahrlektionen gilt eine Frist von{" "}
          <Offen>Frist festlegen, Vorschlag: 24 Stunden</Offen>. Später
          abgesagte Lektionen werden verrechnet.
        </p>
      </Abschnitt>

      <Abschnitt titel="5. Absage durch die Fahrschule">
        <p>
          Wir können einen Kurs absagen, wenn die Mindestteilnehmerzahl nicht
          erreicht wird oder wenn ein wichtiger Grund vorliegt. In diesem Fall
          bieten wir Dir einen Ersatztermin an oder erstatten den bereits
          bezahlten Betrag vollständig. Weitergehende Ansprüche bestehen nicht.
        </p>
      </Abschnitt>

      <Abschnitt titel="6. Mitzubringen">
        <p>
          Für den Verkehrskundeunterricht ist der Lernfahrausweis obligatorisch
          und an jedem Kurstag mitzubringen. Ohne gültigen Lernfahrausweis
          können wir die Teilnahme nicht bestätigen.
        </p>
        <p>
          Die Kursbestätigung gegenüber den Behörden erfolgt erst, wenn alle
          Kursteile besucht wurden.
        </p>
      </Abschnitt>

      <Abschnitt titel="7. Abonnemente für Fahrlektionen">
        <p>
          Abonnemente für fünf oder zehn Lektionen sind{" "}
          <Offen>Gültigkeitsdauer festlegen</Offen> gültig und persönlich. Sie
          sind nicht übertragbar und werden nicht in bar ausbezahlt.
        </p>
        <p>
          Die einmalige Gebühr für Versicherung und Administration wird mit der
          ersten Lektion fällig.
        </p>
      </Abschnitt>

      <Abschnitt titel="8. Haftung">
        <p>
          Während der Fahrlektionen sind unsere Schulungsfahrzeuge
          vorschriftsgemäss versichert. Für Schäden, die Du vorsätzlich oder
          grobfahrlässig verursachst, haften wir nicht.
        </p>
        <p>
          Für persönliche Gegenstände, die in unseren Räumen oder Fahrzeugen
          zurückbleiben, übernehmen wir keine Haftung.
        </p>
      </Abschnitt>

      <Abschnitt titel="9. Datenschutz">
        <p>
          Wie wir mit Deinen Daten umgehen, steht in unserer{" "}
          <Link
            href="/datenschutz"
            className="text-foreground underline underline-offset-4"
          >
            Datenschutzerklärung
          </Link>
          .
        </p>
      </Abschnitt>

      <Abschnitt titel="10. Anwendbares Recht und Gerichtsstand">
        <p>
          Es gilt Schweizer Recht. Gerichtsstand ist{" "}
          <Offen>Gerichtsstand festlegen, üblich: Baden</Offen>.
        </p>
      </Abschnitt>

      <Abschnitt titel="11. Fragen">
        <p>
          Bei Fragen zu diesen Bedingungen erreichst Du uns unter{" "}
          {TELEFONNUMMERN.map((nummer, index) => (
            <span key={nummer.tel}>
              {index > 0 ? " oder " : ""}
              <a
                href={`tel:${nummer.tel}`}
                className="text-foreground underline underline-offset-4"
              >
                {nummer.anzeige}
              </a>
            </span>
          ))}{" "}
          sowie unter{" "}
          <a
            href={`mailto:${ADRESSE.email}`}
            className="text-foreground underline underline-offset-4"
          >
            {ADRESSE.email}
          </a>
          .
        </p>
      </Abschnitt>
    </Rechtstext>
  );
}
