import type { Metadata } from "next";
import Link from "next/link";
import {
  Abschnitt,
  Offen,
  Rechtstext,
} from "@/components/oeffentlich/rechtstext";
import { ADRESSE } from "@/lib/kontakt";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | Haudi's Fahrschule Baden",
  robots: { index: false, follow: true },
};

/**
 * Datenschutzerklaerung nach revDSG, Entwurf.
 *
 * Die Liste der Auftragsverarbeiter nennt nur, was wirklich eingesetzt wird.
 * Kein Kartendienst: die Kontaktseite verlinkt die Navigation, statt eine
 * Karte einzubetten, deshalb geht ohne Klick nichts an Dritte.
 *
 * Kein Kunden-Login und keine Registrierung (Geschaeftsregel 9), also gibt es
 * auch keine Konto- oder Profildaten von Kundinnen und Kunden.
 */
export default function DatenschutzSeite() {
  return (
    <Rechtstext titel="Datenschutzerklärung" stand="Juli 2026">
      <Abschnitt titel="Verantwortliche Stelle">
        <p className="text-foreground">
          {ADRESSE.firma}
          <br />
          {ADRESSE.strasse}, {ADRESSE.plz} {ADRESSE.ort}
          <br />
          <a
            href={`mailto:${ADRESSE.email}`}
            className="underline underline-offset-4"
          >
            {ADRESSE.email}
          </a>
        </p>
        <p>
          Diese Erklärung richtet sich nach dem revidierten Schweizer
          Datenschutzgesetz (revDSG). Soweit die DSGVO anwendbar ist, gelten
          deren Bestimmungen ergänzend.
        </p>
      </Abschnitt>

      <Abschnitt titel="Welche Daten wir bearbeiten">
        <p>
          <strong className="text-foreground">Beim Besuch der Website:</strong>{" "}
          Unser Hosting-Dienstleister erstellt technische Protokolle mit
          IP-Adresse, Zeitpunkt, abgerufener Seite und Browserangaben. Diese
          dienen dem Betrieb und der Sicherheit und werden nach{" "}
          <Offen>Aufbewahrungsdauer festlegen, z. B. 30 Tage</Offen> gelöscht.
        </p>
        <p>
          <strong className="text-foreground">Bei einer Kursanmeldung:</strong>{" "}
          Anrede, Vorname, Nachname, Strasse, Postleitzahl, Ort, Geburtsdatum,
          Telefonnummer und E-Mail-Adresse. Optional die Nummer des
          Lernfahrausweises und, wenn Du eine SMS-Erinnerung wünschst, eine
          Mobilnummer. Diese Angaben brauchen wir, um Dich zum Kurs zuzulassen,
          die Teilnahme zu bestätigen und die Kursbestätigung gegenüber den
          Behörden auszustellen.
        </p>
        <p>
          <strong className="text-foreground">
            Bei telefonischer Anmeldung:
          </strong>{" "}
          dieselben Angaben, die wir für Dich erfassen.
        </p>
        <p>
          Ein Kundenkonto gibt es nicht. Du kannst Dich weder registrieren noch
          anmelden, und wir legen kein Profil an.
        </p>
      </Abschnitt>

      <Abschnitt titel="Zweck und Rechtsgrundlage">
        <p>
          Wir bearbeiten diese Daten zur Vertragserfüllung, also zur
          Durchführung des gebuchten Kurses, sowie zur Erfüllung gesetzlicher
          Pflichten, insbesondere gegenüber dem Strassenverkehrsamt und der
          Buchhaltung. Eine Bearbeitung zu Werbezwecken findet nicht statt.
        </p>
      </Abschnitt>

      <Abschnitt titel="Auftragsverarbeiter">
        <p>
          Für den Betrieb der Website und der Buchung setzen wir folgende
          Dienstleister ein. Mit allen bestehen Auftragsverarbeitungsverträge.
        </p>
        <ul className="mt-2 space-y-3">
          <li>
            <strong className="text-foreground">Vercel Inc., USA</strong> —
            Hosting und Auslieferung der Website. Serverstandort Europa.
            Zugriffsprotokolle wie oben beschrieben.
          </li>
          <li>
            <strong className="text-foreground">Neon Inc., USA</strong> —
            Datenbank. Die Daten liegen in der Region Frankfurt am Main,
            Deutschland.
          </li>
          <li>
            <strong className="text-foreground">Resend, USA</strong> — Versand
            der Bestätigungs-E-Mails. Verarbeitet Name und E-Mail-Adresse.{" "}
            <Offen>Noch nicht aktiv, wird mit dem Buchungsversand
            aufgeschaltet</Offen>
          </li>
          <li>
            <strong className="text-foreground">
              VADIAN.NET AG (ASPSMS), Schweiz
            </strong>{" "}
            — Versand der SMS-Erinnerungen, nur wenn Du sie ausdrücklich
            wünschst. Verarbeitet die von Dir angegebene Mobilnummer.{" "}
            <Offen>Noch nicht aktiv, wird mit den SMS-Erinnerungen
            aufgeschaltet</Offen>
          </li>
        </ul>
        <p className="mt-3">
          Wir binden keine Karten, keine Schriftarten von fremden Servern, keine
          Analyse-Werkzeuge und keine Werbenetzwerke ein. Beim Aufruf unserer
          Seiten werden keine Daten an Google übermittelt. Erst wenn Du
          ausdrücklich auf «Route planen», «Bewertung schreiben» oder einen
          WhatsApp-Knopf klickst, öffnet sich der jeweilige Dienst, und dann
          gelten dessen eigene Bestimmungen.
        </p>
      </Abschnitt>

      <Abschnitt titel="Cookies">
        <p>
          Die öffentliche Website setzt keine Cookies zu Analyse- oder
          Werbezwecken. Ein technisch notwendiges Cookie wird nur im internen
          Team-Login gesetzt, der für Kundinnen und Kunden nicht zugänglich ist.
        </p>
      </Abschnitt>

      <Abschnitt titel="Aufbewahrung">
        <p>
          Anmeldedaten bewahren wir so lange auf, wie es für die
          Kursdurchführung, die Buchhaltung und die gesetzlichen
          Aufbewahrungsfristen nötig ist. Danach werden sie gelöscht oder
          anonymisiert.{" "}
          <Offen>Konkrete Frist mit der Kundin festlegen, Vorschlag:
          Anonymisierung drei Jahre nach dem Kurs, Buchhaltungsbelege zehn
          Jahre</Offen>
        </p>
      </Abschnitt>

      <Abschnitt titel="Deine Rechte">
        <p>
          Du hast das Recht auf Auskunft über die zu Deiner Person bearbeiteten
          Daten sowie auf Berichtigung, Löschung und Herausgabe. Melde Dich
          dafür formlos bei{" "}
          <a
            href={`mailto:${ADRESSE.email}`}
            className="text-foreground underline underline-offset-4"
          >
            {ADRESSE.email}
          </a>
          . Du kannst Dich zudem beim Eidgenössischen Datenschutz- und
          Öffentlichkeitsbeauftragten (EDÖB) beschweren.
        </p>
      </Abschnitt>

      <Abschnitt titel="Änderungen">
        <p>
          Wir passen diese Erklärung an, wenn sich unsere Bearbeitung ändert.
          Massgebend ist die jeweils auf dieser Seite veröffentlichte Fassung.
          Siehe auch unsere{" "}
          <Link href="/agb" className="text-foreground underline underline-offset-4">
            allgemeinen Geschäftsbedingungen
          </Link>
          .
        </p>
      </Abschnitt>
    </Rechtstext>
  );
}
