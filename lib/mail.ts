import "server-only";
import { render } from "@react-email/render";
import { Resend } from "resend";
import {
  Buchungsbestaetigung,
  type BestaetigungDaten,
} from "@/emails/buchungsbestaetigung";
import { Kursabsage } from "@/emails/kursabsage";
import { WabErinnerung } from "@/emails/wab-erinnerung";
import { WartelistenEinladung } from "@/emails/wartelisten-einladung";
import { einstellungenLesen } from "@/lib/einstellungen";
import { chf, datumLang } from "@/lib/format";
import { ADRESSE, TELEFONNUMMERN } from "@/lib/kontakt";
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
 * Absender, Anzeigename und Antwortadresse.
 *
 * Alle drei stehen in den Einstellungen und nicht im Code. Der Grund ist der
 * Start: Resend anzubinden soll eine Aenderung im Panel sein plus der
 * RESEND_API_KEY in der Umgebung — kein Deploy. Solange haudi.ch nicht per
 * SPF und DKIM verifiziert ist, traegt Ausilia die Testadresse von Resend ein
 * und danach die echte, ohne dass jemand Code anfassen muss.
 *
 * Die Antwortadresse bleibt davon unberuehrt: sie zeigt auf info@haudi.ch,
 * auch wenn der Absender voruebergehend eine fremde Domain ist. Wer auf eine
 * Bestaetigung antwortet, soll bei der Fahrschule landen.
 */
async function absenderAngaben(): Promise<{ from: string; antwortAn: string }> {
  const werte = await einstellungenLesen();
  const adresse = werte["mail.absender"].trim() || ADRESSE.email;
  const name = werte["mail.absenderName"].trim() || ADRESSE.firma;
  return {
    from: `${name} <${adresse}>`,
    antwortAn: werte["mail.antwortAn"].trim() || ADRESSE.email,
  };
}

/**
 * Verschickt eine Mail, oder protokolliert sie, wenn kein Schluessel da ist.
 *
 * Die HTML-Fassung kommt als Funktion und nicht als fertige Zeichenkette. Ohne
 * Schluessel wird sie gar nicht erst gebaut: gebraucht wird dann nur der Text
 * fuer das Log. Das spart nicht bloss Arbeit — der Renderer zieht
 * react-dom/server nach, und das laesst sich unter den React-Server-
 * Bedingungen der Pruefskripte nicht laden. So koennen die Skripte den ganzen
 * Weg bis zum Versandvermerk durchlaufen.
 */
async function senden(auftrag: {
  an: string;
  betreff: string;
  html: () => Promise<string>;
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
    const angaben = await absenderAngaben();
    const { error } = await client.emails.send({
      from: angaben.from,
      to: auftrag.an,
      subject: auftrag.betreff,
      html: await auftrag.html(),
      text: auftrag.text,
      replyTo: auftrag.antwortAn ?? angaben.antwortAn,
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
 * Bekommt diese Buchung eine Bestaetigung?
 *
 * Geschaeftsregel 4 haengt an der Quelle, und die Quelle steht auf der
 * Buchung:
 *
 *   ONLINE      Bestaetigung, das ist der Sinn des Formulars
 *   INSTRUCTOR  Bestaetigung, ein Kursleiter hat im Portal angemeldet
 *   PHONE       nie, die Kursdaten werden am Telefon durchgegeben
 *
 * Eigene Funktion, damit die Regel geprueft werden kann, ohne eine Mail zu
 * rendern: der Renderer laeuft nicht unter den React-Server-Bedingungen, unter
 * denen die Pruefskripte starten. Die Entscheidung ist ohnehin das, worauf es
 * ankommt.
 */
export function bestaetigungFaellig(buchung: {
  source: string;
  email: string | null;
}): { faellig: boolean; grund?: string } {
  if (buchung.source === "PHONE") {
    return { faellig: false, grund: "telefonische Anmeldung, keine Mail" };
  }
  // Seit die Adresse optional ist, kann sie fehlen. Das ist kein Fehler,
  // sondern ein gueltiger Zustand: die Person wurde am Schalter erfasst und
  // ist ueber ihre Nummer erreichbar.
  if (!buchung.email) {
    return { faellig: false, grund: "keine E-Mail-Adresse hinterlegt" };
  }
  return { faellig: true };
}

/**
 * Bestaetigung an die anmeldende Person.
 *
 * Prueft die Regel selbst, statt sich darauf zu verlassen, dass jeder
 * Aufrufer sie kennt.
 */
export async function bestaetigungSenden(
  buchung: BuchungMitKurs,
): Promise<VersandErgebnis> {
  const entscheidung = bestaetigungFaellig(buchung);
  if (!entscheidung.faellig) {
    return { gesendet: false, grund: entscheidung.grund };
  }

  const inhalt = daten(buchung);

  return senden({
    an: buchung.email as string,
    betreff: `Anmeldung bestätigt: ${inhalt.kursName}`,
    html: () => render(Buchungsbestaetigung(inhalt)),
    text: textfassung(inhalt),
  });
}

/**
 * Absage an eine angemeldete Person.
 *
 * Anders als die Bestaetigung geht diese Mail auch an telefonisch Angemeldete:
 * Geschaeftsregel 4 verbietet die Bestaetigung, nicht die Absage — wer nicht
 * erfaehrt, dass sein Kurs ausfaellt, steht vor verschlossener Tuer. Wer keine
 * brauchbare Adresse hinterlegt hat, wird angerufen; deshalb zeigt der Dialog
 * die Nummern.
 */
export async function absageSenden(daten: {
  an: string;
  vorname: string;
  kursName: string;
  termine: { datum: string; von: string; bis: string }[];
  grund: string;
}): Promise<VersandErgebnis> {
  const text = [
    `Hoi ${daten.vorname}, der ${daten.kursName} findet leider nicht statt.`,
    ...(daten.grund ? ["", daten.grund] : []),
    "",
    "Diese Termine fallen aus:",
    ...daten.termine.map((t) => `  ${t.datum}, ${t.von} bis ${t.bis} Uhr`),
    "",
    "Ruf uns an, wir suchen Dir einen Platz im nächsten Kurs:",
    ...TELEFONNUMMERN.map((nummer) => `  ${nummer.anzeige}`),
  ].join("\n");

  return senden({
    an: daten.an,
    betreff: `Abgesagt: ${daten.kursName}`,
    html: () =>
      render(
        Kursabsage({
          vorname: daten.vorname,
          kursName: daten.kursName,
          termine: daten.termine,
          grund: daten.grund,
        }),
      ),
    text,
  });
}

/**
 * Wie ein Versand ausgegangen ist, als Wert statt nur im Serverlog.
 *
 * Ohne RESEND_API_KEY schreibt senden() bloss ins Log. Auf dem Bildschirm sah
 * das bisher aus wie ein erfolgreicher Versand. Bei einer Wartelisten-Einladung
 * ist das gefaehrlich: im Panel stuende eine eingeladene Person, die nie etwas
 * erfahren hat, und niemand ruft sie an.
 */
export type VersandVermerk = {
  status: "gesendet" | "protokolliert" | "fehler";
  grund: string | null;
};

export function versandVermerk(ergebnis: VersandErgebnis): VersandVermerk {
  if (ergebnis.gesendet) {
    return { status: "gesendet", grund: null };
  }
  return {
    status:
      ergebnis.grund === "kein RESEND_API_KEY" ? "protokolliert" : "fehler",
    grund: ergebnis.grund ?? null,
  };
}

/**
 * Einladung von der Warteliste.
 *
 * Geht immer raus, sobald eine Adresse vorliegt — anders als die Bestaetigung
 * gibt es hier keine Quelle, die den Versand verbieten wuerde: wer sich selbst
 * eingetragen hat, will benachrichtigt werden. Die Adresse ist auf dem Eintrag
 * Pflicht, deshalb genuegt die Pruefung auf leer.
 */
export async function wartelistenEinladungSenden(daten: {
  an: string;
  vorname: string;
  kursName: string;
  termine: { datum: string; von: string; bis: string }[];
  buchungsLink: string;
  frist: string;
}): Promise<VersandErgebnis> {
  if (!daten.an.trim()) {
    return { gesendet: false, grund: "keine E-Mail-Adresse hinterlegt" };
  }

  const text = [
    `Hoi ${daten.vorname}, im ${daten.kursName} ist ein Platz frei geworden.`,
    `Wir halten ihn für Dich bis ${daten.frist}.`,
    "",
    "Angemeldet bist Du noch nicht. Hier geht es zur Anmeldung:",
    daten.buchungsLink,
    "",
    "Die Termine:",
    ...daten.termine.map((t) => `  ${t.datum}, ${t.von} bis ${t.bis} Uhr`),
    "",
    `Ort: ${ADRESSE.strasse}, ${ADRESSE.plz} ${ADRESSE.ort}`,
    "",
    "Passt der Termin nicht? Ruf uns an:",
    ...TELEFONNUMMERN.map((nummer) => `  ${nummer.anzeige}`),
  ].join("\n");

  return senden({
    an: daten.an,
    betreff: `Ein Platz ist frei: ${daten.kursName}`,
    html: () =>
      render(
        WartelistenEinladung({
          vorname: daten.vorname,
          kursName: daten.kursName,
          termine: daten.termine,
          buchungsLink: daten.buchungsLink,
          frist: daten.frist,
        }),
      ),
    text,
  });
}

/**
 * Erinnerung an den WAB-Kurs, elf Monate nach der praktischen Pruefung.
 *
 * Geht an jede Person mit Adresse — es gibt keine Quelle und keine Regel, die
 * den Versand hier verbieten wuerde. Wer keine Adresse hinterlegt hat, wird
 * angerufen; das entscheidet der Aufrufer in lib/wab.ts.
 */
export async function wabErinnerungSenden(daten: {
  an: string;
  vorname: string;
  pruefungAm: string;
  tcsLink: string;
  gutscheincode: string;
}): Promise<VersandErgebnis> {
  if (!daten.an.trim()) {
    return { gesendet: false, grund: "keine E-Mail-Adresse hinterlegt" };
  }

  const text = [
    `Hoi ${daten.vorname}, Du hast Deine praktische Prüfung am ${daten.pruefungAm} bestanden.`,
    "",
    "Der WAB-Kurs ist obligatorisch und muss innerhalb von zwölf Monaten nach",
    "der Prüfung absolviert sein. Ohne ihn gibt es keinen definitiven",
    "Führerausweis. Du hast noch rund einen Monat Zeit.",
    "",
    ...(daten.gutscheincode
      ? [`Mit unserem Code sparst Du beim TCS: ${daten.gutscheincode}`, ""]
      : []),
    "Hier buchst Du den Kurs:",
    daten.tcsLink,
    "",
    "Fragen? Ruf uns an:",
    ...TELEFONNUMMERN.map((nummer) => `  ${nummer.anzeige}`),
  ].join("\n");

  return senden({
    an: daten.an,
    betreff: "Dein WAB-Kurs steht an",
    html: () =>
      render(
        WabErinnerung({
          vorname: daten.vorname,
          pruefungAm: daten.pruefungAm,
          tcsLink: daten.tcsLink,
          gutscheincode: daten.gutscheincode,
        }),
      ),
    text,
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

  const empfaenger = werte["mail.internEmpfaenger"].trim() || ADRESSE.email;
  const kurs = buchung.course.courseType.name;
  const ersterTermin = buchung.course.sessions[0];
  const herkunft =
    buchung.source === "INSTRUCTOR" ? "Anmeldung über einen Kursleiter" : "Neue Onlineanmeldung";
  const text = [
    `${herkunft}: ${kurs}`,
    "",
    `${buchung.salutation} ${buchung.firstName} ${buchung.lastName}`,
    `${buchung.street}, ${buchung.zip} ${buchung.city}`,
    `Telefon: ${buchung.phone}`,
    `E-Mail: ${buchung.email ?? "keine angegeben"}`,
    `Betrag: ${chf(buchung.priceCharged)}${buchung.earlyBird ? " (Frühbucher)" : ""}`,
    ersterTermin ? `Erster Termin: ${datumLang(ersterTermin.date)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return senden({
    an: empfaenger,
    betreff: `Neue Anmeldung: ${kurs} — ${buchung.lastName}`,
    html: async () =>
      `<pre style="font-family:inherit;white-space:pre-wrap">${text}</pre>`,
    text,
    antwortAn: buchung.email ?? undefined,
  });
}
