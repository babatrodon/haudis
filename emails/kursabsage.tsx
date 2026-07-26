import {
  Body,
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
 * Absage eines Kurses.
 *
 * Kurz und ohne Beschoenigung: was ausfaellt, welche Termine betroffen sind,
 * und wie es weitergeht. Der Anruf ist der eigentliche Weg — die Mail sorgt
 * nur dafuer, dass die Absage schriftlich vorliegt, falls jemand nicht
 * erreichbar war.
 *
 * Kein Betrag: bezahlt wird bar am ersten Kurstag, ein abgesagter Kurs hat
 * also nichts zurueckzuzahlen.
 */

export type AbsageDaten = {
  vorname: string;
  kursName: string;
  termine: { datum: string; von: string; bis: string }[];
  /** Freitext von Ausilia, leer wenn kein Grund angegeben wurde. */
  grund: string;
};

const farben = {
  ink: "#121212",
  grau: "#56524B",
  linie: "#DAD6CE",
  flaeche: "#F2F0EC",
  gelb: "#FFE500",
  papier: "#FAF9F7",
};

export function Kursabsage(daten: AbsageDaten) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Der {daten.kursName} findet nicht statt</Preview>
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
              Der Kurs findet nicht statt
            </Heading>
            <Text style={{ fontSize: "15px", color: farben.grau, marginTop: "12px" }}>
              Hoi {daten.vorname}, wir müssen den {daten.kursName} leider
              absagen. Deine Anmeldung ist damit hinfällig, Du musst nichts
              weiter tun.
            </Text>
            {daten.grund ? (
              <Text
                style={{
                  margin: "12px 0 0",
                  fontSize: "15px",
                  borderLeft: `4px solid ${farben.gelb}`,
                  paddingLeft: "10px",
                }}
              >
                {daten.grund}
              </Text>
            ) : null}
          </Section>

          <Section style={{ padding: "8px 28px 0" }}>
            <Heading as="h2" style={{ fontSize: "16px", margin: "20px 0 8px" }}>
              Diese Termine fallen aus
            </Heading>
            {daten.termine.map((termin) => (
              <Text
                key={`${termin.datum}-${termin.von}`}
                style={{
                  margin: "0 0 4px",
                  fontSize: "15px",
                  borderBottom: `1px solid ${farben.flaeche}`,
                  paddingBottom: "6px",
                }}
              >
                {termin.datum}, {termin.von} bis {termin.bis} Uhr
              </Text>
            ))}
          </Section>

          <Hr style={{ borderColor: farben.linie, margin: "24px 28px 0" }} />

          <Section style={{ padding: "16px 28px 28px" }}>
            <Text style={{ fontSize: "15px", margin: 0 }}>
              Ruf uns an, wir suchen Dir einen Platz im nächsten Kurs:
            </Text>
            {TELEFONNUMMERN.map((nummer) => (
              <Text
                key={nummer.tel}
                style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 600 }}
              >
                {nummer.anzeige}
              </Text>
            ))}
            <Text style={{ fontSize: "14px", color: farben.grau, margin: "12px 0 0" }}>
              Oder antworte auf diese E-Mail, sie geht an {ADRESSE.email}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
