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
 * Einladung von der Warteliste.
 *
 * Der Kern der Mail ist die Frist. Wer sie ueberliest, verliert den Platz,
 * deshalb steht sie zweimal da: einmal im Fliesstext und einmal unter dem
 * Knopf. Der Betreff nennt den Kurs, damit die Mail zwischen anderen
 * auffindbar bleibt.
 *
 * Kein automatisches Nachruecken (Kundenentscheid 26.07.2026): die Mail sagt
 * ausdruecklich, dass noch nichts gebucht ist. Wer sich vor Wochen eingetragen
 * hat, ist vielleicht laengst versorgt, und eine Anmeldung ohne Zutun waere
 * eine Rechnung ohne Zutun.
 */

export type EinladungDaten = {
  vorname: string;
  kursName: string;
  termine: { datum: string; von: string; bis: string }[];
  /** Vollstaendige Adresse inklusive Token. */
  buchungsLink: string;
  /** Wie lange der Platz reserviert bleibt, zum Beispiel "Freitag, 29.07.2026, 14:00". */
  frist: string;
};

const farben = {
  ink: "#121212",
  grau: "#56524B",
  linie: "#DAD6CE",
  flaeche: "#F2F0EC",
  gelb: "#FFE500",
  papier: "#FAF9F7",
};

export function WartelistenEinladung(daten: EinladungDaten) {
  return (
    <Html lang="de">
      <Head />
      <Preview>
        Ein Platz im {daten.kursName} ist frei — reserviert bis {daten.frist}
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
              Ein Platz ist frei geworden
            </Heading>
            <Text
              style={{ fontSize: "15px", color: farben.grau, marginTop: "12px" }}
            >
              Hoi {daten.vorname}, im {daten.kursName} ist ein Platz frei
              geworden. Wir halten ihn für Dich bis{" "}
              <strong style={{ color: farben.ink }}>{daten.frist}</strong>.
            </Text>
            <Text
              style={{ fontSize: "15px", color: farben.grau, margin: "12px 0 0" }}
            >
              Angemeldet bist Du noch nicht — dafür brauchen wir Deine Angaben.
              Das dauert zwei Minuten.
            </Text>
          </Section>

          <Section style={{ padding: "20px 28px 0" }}>
            <Button
              href={daten.buchungsLink}
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
              Jetzt anmelden
            </Button>
            <Text
              style={{ fontSize: "14px", color: farben.grau, margin: "10px 0 0" }}
            >
              Der Link gilt bis {daten.frist}. Danach geben wir den Platz an die
              nächste Person weiter.
            </Text>
          </Section>

          <Section style={{ padding: "8px 28px 0" }}>
            <Heading as="h2" style={{ fontSize: "16px", margin: "20px 0 8px" }}>
              Die Termine
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
            <Text
              style={{ fontSize: "14px", color: farben.grau, margin: "12px 0 0" }}
            >
              {ADRESSE.strasse}, {ADRESSE.plz} {ADRESSE.ort}
            </Text>
          </Section>

          <Hr style={{ borderColor: farben.linie, margin: "24px 28px 0" }} />

          <Section style={{ padding: "16px 28px 28px" }}>
            <Text style={{ fontSize: "15px", margin: 0 }}>
              Passt der Termin nicht? Ruf uns an, wir schauen weiter:
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

export default WartelistenEinladung;
