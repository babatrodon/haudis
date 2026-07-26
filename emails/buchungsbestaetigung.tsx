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
 * Bestaetigungsmail nach einer Onlineanmeldung (PLAN.md Abschnitt 8).
 *
 * Enthaelt alles, was jemand am Kurstag braucht: Termine, Betrag, was
 * mitzubringen ist, und die Adresse. Antwort geht an info@haudi.ch.
 *
 * Farben und Abstaende stehen hier als Inline-Stil. In E-Mail-Programmen gibt
 * es keine verlaessliche Klassenunterstuetzung, Outlook ignoriert das meiste
 * aus einem style-Block.
 */

export type BestaetigungDaten = {
  anrede: string;
  vorname: string;
  nachname: string;
  kursName: string;
  termine: { datum: string; von: string; bis: string }[];
  total: string;
  kursgebuehr: string;
  /** null, wenn die Kursart kein Lehrmittel verrechnet (zum Beispiel BTU). */
  lehrmittel: string | null;
  fruehbucher: boolean;
  lernfahrausweisNoetig: boolean;
};

const farben = {
  ink: "#121212",
  grau: "#56524B",
  linie: "#DAD6CE",
  flaeche: "#F2F0EC",
  gelb: "#FFE500",
  papier: "#FAF9F7",
};

export function Buchungsbestaetigung(daten: BestaetigungDaten) {
  const mitbringen = [
    `Den Betrag von ${daten.total} in bar`,
    ...(daten.lernfahrausweisNoetig ? ["Deinen Lernfahrausweis"] : []),
    "Schreibzeug",
  ];

  return (
    <Html lang="de">
      <Head />
      <Preview>
        Deine Anmeldung für {daten.kursName} ist bestätigt
      </Preview>
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
              Deine Anmeldung ist bestätigt
            </Heading>
            <Text style={{ fontSize: "15px", color: farben.grau, marginTop: "12px" }}>
              Hoi {daten.vorname}, wir haben Dich für den {daten.kursName}{" "}
              eingetragen. Hier stehen alle Angaben zum Aufbewahren.
            </Text>
          </Section>

          <Section style={{ padding: "8px 28px 0" }}>
            <Heading as="h2" style={{ fontSize: "16px", margin: "20px 0 8px" }}>
              Kursdaten
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
                <strong>{termin.datum}</strong>, {termin.von} bis {termin.bis}{" "}
                Uhr
              </Text>
            ))}
            <Text style={{ fontSize: "14px", color: farben.grau, marginTop: "12px" }}>
              {ADRESSE.strasse}, {ADRESSE.plz} {ADRESSE.ort} · 350 m vom Bahnhof
              Baden
            </Text>
          </Section>

          <Section style={{ padding: "8px 28px 0" }}>
            <Heading as="h2" style={{ fontSize: "16px", margin: "20px 0 8px" }}>
              Betrag
            </Heading>
            <Text style={{ margin: "0 0 4px", fontSize: "15px" }}>
              Kursgebühr: {daten.kursgebuehr}
            </Text>
            {daten.lehrmittel !== null ? (
              <Text style={{ margin: "0 0 4px", fontSize: "15px" }}>
                Lehrmittel: {daten.lehrmittel}
              </Text>
            ) : null}
            {daten.fruehbucher ? (
              <Text
                style={{
                  margin: "8px 0",
                  fontSize: "14px",
                  backgroundColor: farben.gelb,
                  padding: "6px 10px",
                  display: "inline-block",
                  fontWeight: 600,
                }}
              >
                Frühbucherrabatt berücksichtigt
              </Text>
            ) : null}
            <Text style={{ margin: "8px 0 0", fontSize: "20px", fontWeight: 700 }}>
              Total: {daten.total}
            </Text>
            <Text style={{ fontSize: "14px", color: farben.grau, margin: "4px 0 0" }}>
              Bitte bar am ersten Kurstag mitbringen.
            </Text>
          </Section>

          <Section style={{ padding: "8px 28px 0" }}>
            <Heading as="h2" style={{ fontSize: "16px", margin: "20px 0 8px" }}>
              Bitte mitbringen
            </Heading>
            {mitbringen.map((eintrag) => (
              <Text key={eintrag} style={{ margin: "0 0 4px", fontSize: "15px" }}>
                • {eintrag}
              </Text>
            ))}
            {daten.lernfahrausweisNoetig ? (
              <Text
                style={{
                  margin: "12px 0 0",
                  fontSize: "14px",
                  borderLeft: `4px solid ${farben.gelb}`,
                  paddingLeft: "10px",
                  color: farben.grau,
                }}
              >
                Ohne gültigen Lernfahrausweis können wir die Teilnahme nicht
                bestätigen.
              </Text>
            ) : null}
          </Section>

          <Hr style={{ borderColor: farben.linie, margin: "24px 28px 0" }} />

          <Section style={{ padding: "16px 28px 28px" }}>
            <Text style={{ fontSize: "14px", color: farben.grau, margin: 0 }}>
              Fragen? Ruf uns an:
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
              Oder antworte einfach auf diese E-Mail, sie geht an{" "}
              {ADRESSE.email}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
