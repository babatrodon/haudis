import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";

/**
 * Erinnerung an den WAB-Kurs.
 *
 * Die Mail hat genau eine Aufgabe: dafuer sorgen, dass jemand einen Termin
 * bucht, bevor die Zwoelf-Monats-Frist ablaeuft. Deshalb steht die Folge des
 * Versaeumnisses drin und nicht nur die Aufforderung — wer nicht weiss, dass
 * der Ausweis auf dem Spiel steht, schiebt es auf.
 *
 * Der Gutscheincode ist der Grund, warum diese Mail von der Fahrschule kommt
 * und nicht vom TCS: er spart dem Absolventen Geld und stammt aus den
 * Einstellungen, ist also ohne Deploy aenderbar.
 */

export type WabDaten = {
  vorname: string;
  /** Wann die praktische Pruefung bestanden wurde. */
  pruefungAm: string;
  tcsLink: string;
  /** Leer, wenn Ausilia den Code aus den Einstellungen entfernt hat. */
  gutscheincode: string;
};

const farben = {
  ink: "#121212",
  grau: "#56524B",
  linie: "#DAD6CE",
  flaeche: "#F2F0EC",
  gelb: "#FFE500",
  papier: "#FAF9F7",
};

export function WabErinnerung(daten: WabDaten) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Dein WAB-Kurs steht an — die Frist läuft</Preview>
      <Body
        style={{
          backgroundColor: farben.papier,
          fontFamily:
            "Inter, -apple-system, Segoe UI, Helvetica, Arial, sans-serif",
          color: farben.ink,
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: `1px solid ${farben.linie}`,
            maxWidth: "560px",
            margin: "0 auto",
          }}
        >
          <Section style={{ padding: "28px 28px 0" }}>
            <Text
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: farben.grau,
                fontWeight: 600,
              }}
            >
              {ADRESSE.firma}
            </Text>
            <Heading
              as="h1"
              style={{ fontSize: "24px", margin: "12px 0 0", lineHeight: 1.2 }}
            >
              Vergiss den WAB-Kurs nicht
            </Heading>
            <Text
              style={{ fontSize: "15px", color: farben.grau, marginTop: "12px" }}
            >
              Hoi {daten.vorname}, Du hast Deine praktische Prüfung am{" "}
              {daten.pruefungAm} bestanden — herzliche Gratulation nochmals.
            </Text>
            <Text
              style={{
                margin: "12px 0 0",
                fontSize: "15px",
                lineHeight: 1.55,
                borderLeft: `4px solid ${farben.gelb}`,
                paddingLeft: "10px",
              }}
            >
              Der WAB-Kurs (Weiterausbildung) ist obligatorisch und muss{" "}
              <strong>innerhalb von zwölf Monaten nach der Prüfung</strong>{" "}
              absolviert sein. Ohne ihn gibt es keinen definitiven
              Führerausweis. Du hast noch rund einen Monat Zeit — jetzt einen
              Termin zu buchen ist der einfachste Weg.
            </Text>
          </Section>

          {daten.gutscheincode ? (
            <Section style={{ padding: "20px 28px 0" }}>
              <Text
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: farben.grau,
                }}
              >
                Mit unserem Code sparst Du beim TCS:
              </Text>
              <Text
                style={{
                  margin: "8px 0 0",
                  display: "inline-block",
                  backgroundColor: farben.gelb,
                  padding: "10px 16px",
                  fontSize: "20px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                {daten.gutscheincode}
              </Text>
            </Section>
          ) : null}

          <Section style={{ padding: "20px 28px 0" }}>
            <Button
              href={daten.tcsLink}
              style={{
                backgroundColor: farben.ink,
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 600,
                padding: "14px 24px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              WAB-Kurs beim TCS buchen
            </Button>
            <Text
              style={{ fontSize: "14px", color: farben.grau, margin: "10px 0 0" }}
            >
              Der Kurs dauert einen Tag. Standorte gibt es mehrere, zum Beispiel
              das Fahrzentrum Frick.
            </Text>
          </Section>

          <Hr style={{ borderColor: farben.linie, margin: "24px 28px 0" }} />

          <Section style={{ padding: "16px 28px 28px" }}>
            <Text style={{ fontSize: "15px", margin: 0 }}>
              Fragen dazu? Ruf uns an:
            </Text>
            {TELEFONNUMMERN.map((nummer) => (
              <Text
                key={nummer.tel}
                style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 600 }}
              >
                {nummer.anzeige}
              </Text>
            ))}
            <Text
              style={{ fontSize: "14px", color: farben.grau, margin: "12px 0 0" }}
            >
              Oder antworte auf diese E-Mail, sie geht an {ADRESSE.email}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WabErinnerung;
