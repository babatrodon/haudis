import "server-only";
import { prisma } from "@/lib/db";
import { einstellungenLesen } from "@/lib/einstellungen";
import { datumLang } from "@/lib/format";
import { EXTERNE_LINKS } from "@/lib/inhalte/links";
import { versandVermerk, wabErinnerungSenden } from "@/lib/mail";

/**
 * WAB-Erinnerung (PLAN.md Abschnitt 14, Spec 4).
 *
 * Der WAB-Kurs ist obligatorisch und muss innerhalb von zwoelf Monaten nach
 * der bestandenen praktischen Pruefung absolviert sein. Wer die Frist
 * verpasst, verliert den Fuehrerausweis auf Probe — das ist der teuerste
 * Fehler, den ein Fahrschueler in diesem Jahr machen kann, und er passiert
 * durch Vergessen.
 *
 * Deshalb erinnert die Fahrschule nach elf Monaten: ein Monat Vorlauf, genug
 * um einen Kurstermin beim TCS zu finden.
 *
 * ZUR FRIST UND ZUM LAUF
 *
 * Der Lauf ist monatlich. Wer die Elf-Monats-Marke kurz nach einem Lauf
 * erreicht, bekommt die Mail beim naechsten — also zwischen elf und zwoelf
 * Monaten. Das ist knapp, aber innerhalb der Frist.
 *
 * Nach oben gibt es keine Grenze. Wer die zwoelf Monate schon ueberschritten
 * hat, bekommt die Erinnerung trotzdem: dann ist sie kein Vorlauf mehr,
 * sondern ein Hinweis auf ein Problem, das er ohnehin hat.
 */

/** Vorlauf in Monaten. Die Frist selbst betraegt zwoelf. */
export const WAB_MONATE = 11;

/**
 * Stichtag: wer die Pruefung an oder vor diesem Tag bestanden hat, ist faellig.
 *
 * Reine Rechnung ohne Datenbank, damit sie sich pruefen laesst.
 *
 * Der Tag wird auf die Laenge des Zielmonats begrenzt. setUTCMonth allein
 * genuegt nicht: es rechnet ueber das Monatsende hinaus weiter, aus dem
 * 31. Maerz minus elf Monaten wuerde der 1. Mai statt des 30. April. Ein Tag
 * Unterschied ist bei einer Jahresfrist verschmerzbar, eine Datumsrechnung,
 * die still danebenliegt, nicht.
 */
export function stichtag(jetzt: Date = new Date()): Date {
  const jahr = jetzt.getUTCFullYear();
  const monat = jetzt.getUTCMonth() - WAB_MONATE;
  // Tag 0 des Folgemonats ist der letzte Tag des Zielmonats.
  const letzterTag = new Date(Date.UTC(jahr, monat + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(jahr, monat, Math.min(jetzt.getUTCDate(), letzterTag)),
  );
}

/**
 * Ist diese Person faellig?
 *
 * Als reine Funktion neben der Abfrage, damit verify:schueler die Regel ohne
 * Datenbank pruefen kann — dieselbe Idee wie bestaetigungFaellig in lib/mail.ts.
 */
export function erinnerungFaellig(
  person: {
    practicalExamPassedAt: Date | null;
    wabReminderSentAt: Date | null;
    email: string | null;
  },
  jetzt: Date = new Date(),
): { faellig: boolean; grund?: string } {
  if (!person.practicalExamPassedAt) {
    return { faellig: false, grund: "kein Prüfungsdatum erfasst" };
  }
  if (person.wabReminderSentAt) {
    return { faellig: false, grund: "bereits erinnert" };
  }
  if (person.practicalExamPassedAt > stichtag(jetzt)) {
    return { faellig: false, grund: `Prüfung liegt weniger als ${WAB_MONATE} Monate zurück` };
  }
  if (!person.email?.trim()) {
    return { faellig: false, grund: "keine E-Mail-Adresse hinterlegt" };
  }
  return { faellig: true };
}

export type WabLauf = {
  /** Angeschrieben, unabhaengig davon ob wirklich versendet wurde. */
  benachrichtigt: number;
  gesendet: number;
  nurProtokolliert: number;
  fehler: number;
  /** Faellig, aber ohne Adresse — die muss jemand anrufen. */
  ohneAdresse: number;
};

/**
 * Der monatliche Lauf.
 *
 * `wabReminderSentAt` wird gesetzt, sobald der Versuch gelaufen ist, und nicht
 * erst bei erfolgreichem Versand. Sonst liefe der naechste Lauf dieselbe Person
 * wieder an, und ohne RESEND_API_KEY waere das jeden Monat aufs Neue. Was
 * wirklich passiert ist, steht in wabMailStatus daneben — dort steht auch,
 * wenn nur protokolliert wurde.
 *
 * Personen ohne Adresse werden NICHT als benachrichtigt markiert. Sie bleiben
 * faellig und erscheinen im Panel, weil bei ihnen jemand zum Telefon greifen
 * muss.
 */
export async function wabLaufAusfuehren(
  jetzt: Date = new Date(),
): Promise<WabLauf> {
  const faellige = await prisma.studentRecord.findMany({
    where: {
      practicalExamPassedAt: { not: null, lte: stichtag(jetzt) },
      wabReminderSentAt: null,
    },
    select: {
      id: true,
      firstName: true,
      email: true,
      practicalExamPassedAt: true,
      wabReminderSentAt: true,
    },
  });

  const werte = await einstellungenLesen();
  const gutscheincode = werte["wab.gutscheincode"].trim();

  const lauf: WabLauf = {
    benachrichtigt: 0,
    gesendet: 0,
    nurProtokolliert: 0,
    fehler: 0,
    ohneAdresse: 0,
  };

  for (const person of faellige) {
    const entscheidung = erinnerungFaellig(person, jetzt);
    if (!entscheidung.faellig) {
      if (entscheidung.grund === "keine E-Mail-Adresse hinterlegt") {
        lauf.ohneAdresse += 1;
      }
      continue;
    }

    const ergebnis = await wabErinnerungSenden({
      an: person.email as string,
      vorname: person.firstName,
      pruefungAm: datumLang(person.practicalExamPassedAt as Date),
      tcsLink: EXTERNE_LINKS.tcsWabKurs,
      gutscheincode,
    });

    const vermerk = versandVermerk(ergebnis);
    await prisma.studentRecord.update({
      where: { id: person.id },
      data: {
        wabReminderSentAt: jetzt,
        wabMailStatus: vermerk.status,
        wabMailGrund: vermerk.grund,
      },
    });

    lauf.benachrichtigt += 1;
    if (vermerk.status === "gesendet") lauf.gesendet += 1;
    else if (vermerk.status === "protokolliert") lauf.nurProtokolliert += 1;
    else lauf.fehler += 1;
  }

  return lauf;
}

/**
 * Eine einzelne Erinnerung noch einmal verschicken.
 *
 * Fuer den Fall, dass die Mail nie rausging — solange kein RESEND_API_KEY
 * gesetzt ist, ist das jede. Der Zeitstempel wird dabei erneuert, damit im
 * Panel steht, wann zuletzt ein Versuch lief.
 */
export async function wabErinnerungWiederholen(
  studentId: string,
  jetzt: Date = new Date(),
): Promise<{ erfolg: boolean; grund?: string }> {
  const person = await prisma.studentRecord.findUnique({
    where: { id: studentId },
    select: { firstName: true, email: true, practicalExamPassedAt: true },
  });

  if (!person?.practicalExamPassedAt) {
    return { erfolg: false, grund: "Für diese Person ist kein Prüfungsdatum erfasst." };
  }
  if (!person.email?.trim()) {
    return {
      erfolg: false,
      grund: "Keine E-Mail-Adresse hinterlegt. Diese Person muss angerufen werden.",
    };
  }

  const werte = await einstellungenLesen();
  const ergebnis = await wabErinnerungSenden({
    an: person.email,
    vorname: person.firstName,
    pruefungAm: datumLang(person.practicalExamPassedAt),
    tcsLink: EXTERNE_LINKS.tcsWabKurs,
    gutscheincode: werte["wab.gutscheincode"].trim(),
  });

  const vermerk = versandVermerk(ergebnis);
  await prisma.studentRecord.update({
    where: { id: studentId },
    data: {
      wabReminderSentAt: jetzt,
      wabMailStatus: vermerk.status,
      wabMailGrund: vermerk.grund,
    },
  });

  return { erfolg: true };
}
