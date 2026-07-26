import type { Metadata } from "next";
import {
  Abschnitt,
  Offen,
  Rechtstext,
} from "@/components/oeffentlich/rechtstext";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";

export const metadata: Metadata = {
  title: "Impressum | Haudi's Fahrschule Baden",
  robots: { index: false, follow: true },
};

export default function ImpressumSeite() {
  return (
    <Rechtstext titel="Impressum" stand="Juli 2026">
      <Abschnitt titel="Verantwortlich für den Inhalt">
        <p className="text-foreground">
          {ADRESSE.firma}
          <br />
          {ADRESSE.strasse}
          <br />
          {ADRESSE.plz} {ADRESSE.ort}
          <br />
          Schweiz
        </p>
        <p>
          Rechtsform: <Offen>Einzelfirma oder GmbH, bitte angeben</Offen>
          <br />
          Inhaberin: <Offen>vollständiger Name</Offen>
          <br />
          UID-Nummer: <Offen>CHE-XXX.XXX.XXX</Offen>
        </p>
      </Abschnitt>

      <Abschnitt titel="Kontakt">
        <ul className="space-y-1">
          {TELEFONNUMMERN.map((nummer) => (
            <li key={nummer.tel}>
              Telefon:{" "}
              <a
                href={`tel:${nummer.tel}`}
                className="text-foreground underline underline-offset-4"
              >
                {nummer.anzeige}
              </a>
            </li>
          ))}
          <li>
            E-Mail:{" "}
            <a
              href={`mailto:${ADRESSE.email}`}
              className="text-foreground underline underline-offset-4"
            >
              {ADRESSE.email}
            </a>
          </li>
        </ul>
      </Abschnitt>

      <Abschnitt titel="Bewilligung">
        <p>
          Fahrlehrerbewilligung und Bewilligung zur Führung einer Fahrschule
          nach Massgabe der Verordnung über die Zulassung von Personen und
          Fahrzeugen zum Strassenverkehr: <Offen>Bewilligungsnummer und
          ausstellende Stelle</Offen>
        </p>
      </Abschnitt>

      <Abschnitt titel="Haftungsausschluss">
        <p>
          Die Inhalte dieser Website werden mit Sorgfalt erstellt. Für die
          Richtigkeit, Vollständigkeit und Aktualität der Angaben zu
          gesetzlichen Bestimmungen wird keine Gewähr übernommen. Verbindlich
          sind ausschliesslich die Auskünfte der zuständigen Behörden,
          insbesondere des Strassenverkehrsamts des Kantons Aargau.
        </p>
        <p>
          Für Inhalte externer Websites, auf die verlinkt wird, sind
          ausschliesslich deren Betreiber verantwortlich.
        </p>
      </Abschnitt>

      <Abschnitt titel="Urheberrecht">
        <p>
          Texte, Bilder und Gestaltung dieser Website sind urheberrechtlich
          geschützt. Eine Verwendung ausserhalb der gesetzlich erlaubten Fälle
          bedarf der vorherigen schriftlichen Zustimmung.
        </p>
      </Abschnitt>

      <Abschnitt titel="Technische Umsetzung">
        <p>
          <Offen>Angabe der Agentur, falls gewünscht</Offen>
        </p>
      </Abschnitt>
    </Rechtstext>
  );
}
