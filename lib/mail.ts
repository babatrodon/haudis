import "server-only";
import { render } from "@react-email/render";
import { Resend } from "resend";
import {
  Buchungsbestaetigung,
  type BestaetigungDaten,
} from "@/emails/buchungsbestaetigung";
import { einstellungenLesen } from "@/lib/einstellungen";
import { chf, datumLang } from "@/lib/format";
import { ADRESSE } from "@/lib/kontakt";
import type { BuchungMitKurs } from "@/lib/buchung";

/**
 * Mailversand ueber Resend.
 *
 * Ohne RESEND_API_KEY wird die Mail gerendert und ins Log geschrieben statt
 * versendet. Damit laesst sich der ganze Buchungsablauf testen, bevor der
 * Schluessel und die verifizierte Domain vorliegen (Launch-Checkliste).
 *
 * Wichtig: Ein Fehler beim Versand darf die Buchung nie umwerfen. Der Platz
 * ist vergeben, sobald die Transaktion durch ist. Deshalb faengt jede Funktion
 * hier ihre Fehler selbst ab und meldet sie als Ergebnis zurueck, statt zu
 * werfen.
 */

export type VersandErgebnis = {
  gesendet: boolean;
  grund?: string;
};

function resendClient(): Resend | null {
  const schluessel = process.env.RESEND_API_KEY;
  return schluessel ? new Resend(schluessel) : null;
}

/**
 * Absenderadresse. Solange haudi.ch nicht verifiziert ist, wird ueber die
 * Testdomain von Resend zugestellt; die Antwort geht trotzdem an info@haudi.ch.
 */
function absender(): string {
  return (
    process.env.RESEND_FROM ?? `Haudi's Fahrschule <onboarding@resend.dev>`
  );
}

async function senden(auftrag: {
  an: string;
  betreff: string;
  html: string;
  text: string;
  antwortAn?: string;
}): Promise<VersandErgebnis> {
  const client = resendClient();

  if (!client) {
    console.info(
      `[Mail] RESEND_API_KEY fehlt, nicht versendet. An: ${auftrag.an} | Betreff: ${auftrag.betreff}`,
    );
    console.info(`[Mail] Textfassung:\n${auftrag.text}`);
    return { gesendet: false, grund: "kein RESEND_API_KEY" };
  }

  try {
    const { error } = await client.emails.send({
      from: absender(),
      to: auftrag.an,
      subject: auftrag.betreff,
      html: auftrag.html,
      text: auftrag.text,
      replyTo: auftrag.antwortAn ?? ADRESSE.email,
    });
    if (error) {
      console.error(`[Mail] Resend meldet einen Fehler: ${error.message}`);
      return { gesendet: false, grund: error.message };
    }
    return { gesendet: true };
  } catch (fehler) {
    console.error("[Mail] Versand fehlgeschlagen", fehler);
    return {
      gesendet: false,
      grund: fehler instanceof Error ? fehler.message : "unbekannt",
    };
  }
}

function daten(buchung: BuchungMitKurs): BestaetigungDaten {
  const lehrmittel = buchung.course.materialPrice;

  return {
    anrede: buchung.salutation,
    vorname: buchung.firstName,
    nachname: buchung.lastName,
    kursName: buchung.course.courseType.name,
    termine: buchung.course.sessions.map((termin) => ({
      datum: datumLang(termin.date),
      von: termin.startTime,
      bis: termin.endTime,
    })),
    total: chf(buchung.priceCharged),
    kursgebuehr: chf(buchung.course.price),
    lehrmittel: lehrmittel.gt(0) ? chf(lehrmittel) : null,
    fruehbucher: buchung.earlyBird,
    lernfahrausweisNoetig: buchung.course.courseType.requiresLfa,
  };
}

/** Einfache Textfassung, falls das Mailprogramm kein HTML anzeigt. */
function textfassung(d: BestaetigungDaten): string {
  const zeilen = [
    `Deine Anmeldung für ${d.kursName} ist bestätigt.`,
    "",
    "Kursdaten:",
    ...d.termine.map((t) => `  ${t.datum}, ${t.von} bis ${t.bis} Uhr`),
    "",
    `Ort: ${ADRESSE.strasse}, ${ADRESSE.plz} ${ADRESSE.ort}`,
    "",
    `Total: ${d.total} (bitte bar am ersten Kurstag mitbringen)`,
  ];
  if (d.lernfahrausweisNoetig) {
    zeilen.push("", "WICHTIG: Lernfahrausweis am ersten Kurstag mitbringen.");
  }
  zeilen.push("", `Fragen? ${ADRESSE.email}`);
  return zeilen.join("\n");
}

/**
 * Bestaetigung an die anmeldende Person.
 *
 * Geschaeftsregel 4: Telefonische Anmeldungen bekommen KEINE Bestaetigung.
 * Diese Funktion wird deshalb nur im Onlineablauf aufgerufen; zur Sicherheit
 * prueft sie die Quelle trotzdem selbst.
 */
export async function bestaetigungSenden(
  buchung: BuchungMitKurs,
): Promise<VersandErgebnis> {
  if (buchung.source !== "ONLINE") {
    return { gesendet: false, grund: "telefonische Anmeldung, keine Mail" };
  }

  const inhalt = daten(buchung);
  const element = Buchungsbestaetigung(inhalt);
  const html = await render(element);

  return senden({
    an: buchung.email,
    betreff: `Anmeldung bestätigt: ${inhalt.kursName}`,
    html,
    text: textfassung(inhalt),
  });
}

/**
 * Interne Kopie an die Administration, haengt an der Einstellung
 * mail.internKopie. Kurz gehalten: die Details stehen ohnehin im Admin.
 */
export async function interneBenachrichtigungSenden(
  buchung: BuchungMitKurs,
): Promise<VersandErgebnis> {
  const werte = await einstellungenLesen();
  if (werte["mail.internKopie"].trim().toLowerCase() !== "true") {
    return { gesendet: false, grund: "in den Einstellungen abgeschaltet" };
  }

  const empfaenger = werte["mail.absender"].trim() || ADRESSE.email;
  const kurs = buchung.course.courseType.name;
  const ersterTermin = buchung.course.sessions[0];
  const text = [
    `Neue Onlineanmeldung: ${kurs}`,
    "",
    `${buchung.salutation} ${buchung.firstName} ${buchung.lastName}`,
    `${buchung.street}, ${buchung.zip} ${buchung.city}`,
    `Telefon: ${buchung.phone}`,
    `E-Mail: ${buchung.email}`,
    `Betrag: ${chf(buchung.priceCharged)}${buchung.earlyBird ? " (Frühbucher)" : ""}`,
    ersterTermin ? `Erster Termin: ${datumLang(ersterTermin.date)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return senden({
    an: empfaenger,
    betreff: `Neue Anmeldung: ${kurs} — ${buchung.lastName}`,
    html: `<pre style="font-family:inherit;white-space:pre-wrap">${text}</pre>`,
    text,
    antwortAn: buchung.email,
  });
}
