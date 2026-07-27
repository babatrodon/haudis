import "dotenv/config";
import { buchungAnlegen } from "../lib/buchung";
import {
  kursAbsagen,
  kursAktualisieren,
  kursAnlegen,
  kursDuplizieren,
  kursVeroeffentlichen,
} from "../lib/admin/kurse";
import { konflikteFinden } from "../lib/admin/einsatzplan";
import { prismaOeffnen, type PrismaSeedClient } from "./seed-lib";

/**
 * Prueft die Kursverwaltung gegen die echte Datenbank.
 *
 * Getrennt von verify-buchung.ts, weil dort die Zusicherungen des
 * Buchungsablaufs stehen und hier die der Kursverwaltung. Zwei Themen, zwei
 * Dateien.
 *
 * Was hier drin steht, faellt beim Klicken schlecht auf: dass eine Absage
 * wirklich alle Buchungen mitnimmt, und dass ein Duplikat jeden Termin um
 * dieselbe Spanne verschiebt und nicht nur den ersten.
 *
 * Aufruf: pnpm verify:kurse
 */

let fehler = 0;

function pruefe(bedingung: boolean, beschreibung: string, ist?: string) {
  if (bedingung) {
    console.log(`  OK    ${beschreibung}`);
  } else {
    console.log(`  FEHLT ${beschreibung}${ist ? ` -> ${ist}` : ""}`);
    fehler += 1;
  }
}

const NOTIZ = "Automatische Kursprüfung, wird wieder gelöscht";

function person(nummer: number) {
  return {
    anrede: "Frau" as const,
    nachname: `Kurspruefung${nummer}`,
    vorname: "Testperson",
    strasse: "Haselstrasse 33",
    plz: "5400",
    ort: "Baden",
    geburtsdatum: "2008-03-12",
    telefon: "079 604 44 44",
    email: `kurspruefung.${nummer}.${Date.now()}@example.invalid`,
    agb: true as const,
    webseite: "",
  };
}

/** Datum in 30 Tagen als "2026-08-26", damit der Kurs in der Zukunft liegt. */
function inTagen(tage: number): string {
  const tag = new Date();
  tag.setUTCDate(tag.getUTCDate() + tage);
  return tag.toISOString().slice(0, 10);
}

async function kursartId(prisma: PrismaSeedClient): Promise<string> {
  const kursart = await prisma.courseType.findFirstOrThrow({
    where: { code: "VKU" },
  });
  return kursart.id;
}

/**
 * Der Wizard-Weg: Kursart, erstes Datum, Muster. Vier Bloecke an zwei Tagen,
 * so wie ihn Ausilia anlegt.
 */
async function anlegenPruefen(prisma: PrismaSeedClient, entstanden: string[]) {
  console.log("Kurs anlegen");

  const start = inTagen(30);
  const kursId = await kursAnlegen({
    kursartId: await kursartId(prisma),
    termine: [
      { datum: start, von: "18:00", bis: "20:00" },
      { datum: start, von: "20:00", bis: "22:00" },
      { datum: inTagen(31), von: "18:00", bis: "20:00" },
      { datum: inTagen(31), von: "20:00", bis: "22:00" },
    ],
    preis: "140.00",
    materialpreis: "30.00",
    onlineLimit: 12,
    fruehbucherProzent: "10",
    fruehbucherPlaetze: "5",
    notizen: NOTIZ,
    veroeffentlichen: false,
  });
  entstanden.push(kursId);

  const kurs = await prisma.course.findUniqueOrThrow({
    where: { id: kursId },
    include: { sessions: { orderBy: [{ date: "asc" }, { startTime: "asc" }] } },
  });

  pruefe(kurs.sessions.length === 4, "vier Blöcke angelegt", `${kurs.sessions.length}`);
  pruefe(kurs.status === "DRAFT", "als Entwurf gespeichert", kurs.status);
  pruefe(
    kurs.price.toString() === "140" && kurs.materialPrice.toString() === "30",
    "Preise unverändert übernommen",
    `${kurs.price} / ${kurs.materialPrice}`,
  );
  pruefe(
    kurs.earlyBirdPercent?.toString() === "10" && kurs.earlyBirdSlots === 5,
    "Frühbucher 10 % für die ersten 5",
    `${kurs.earlyBirdPercent} / ${kurs.earlyBirdSlots}`,
  );
  // Der haeufigste stille Fehler bei @db.Date: ein Tag Versatz durch die
  // Zeitzone. Der gespeicherte Tag muss exakt der gewaehlte sein.
  pruefe(
    kurs.sessions[0].date.toISOString().slice(0, 10) === start,
    `erster Termin steht auf ${start}`,
    kurs.sessions[0].date.toISOString().slice(0, 10),
  );

  const ergebnis = await kursVeroeffentlichen(kursId);
  const veroeffentlicht = await prisma.course.findUniqueOrThrow({
    where: { id: kursId },
    select: { status: true },
  });
  pruefe(
    ergebnis.erfolg && veroeffentlicht.status === "PUBLISHED",
    "Entwurf lässt sich veröffentlichen",
    veroeffentlicht.status,
  );

  return kursId;
}

/** Ein Kurs ohne Termine darf nicht oeffentlich werden. */
async function leerenKursPruefen(prisma: PrismaSeedClient, entstanden: string[]) {
  console.log("Kurs ohne Termine");

  const kursId = await prisma.course
    .create({
      data: {
        courseTypeId: await kursartId(prisma),
        price: "140.00",
        materialPrice: "30.00",
        onlineLimit: 12,
        status: "DRAFT",
        notes: NOTIZ,
      },
      select: { id: true },
    })
    .then((kurs) => kurs.id);
  entstanden.push(kursId);

  const ergebnis = await kursVeroeffentlichen(kursId);
  const status = await prisma.course.findUniqueOrThrow({
    where: { id: kursId },
    select: { status: true },
  });
  pruefe(
    !ergebnis.erfolg && ergebnis.fehler === "keine-termine",
    "ohne Termine kein Veröffentlichen",
    ergebnis.erfolg ? "es ging durch" : (ergebnis.fehler ?? ""),
  );
  pruefe(status.status === "DRAFT", "bleibt Entwurf", status.status);
}

/**
 * Duplizieren mit Versatz. Der Kern: der Abstand zwischen den Terminen bleibt
 * erhalten, aus Di+Mi wird wieder Di+Mi.
 */
async function duplizierenPruefen(
  prisma: PrismaSeedClient,
  quelleId: string,
  entstanden: string[],
) {
  console.log("Kurs duplizieren");

  const quelle = await prisma.course.findUniqueOrThrow({
    where: { id: quelleId },
    include: { sessions: { orderBy: [{ date: "asc" }, { startTime: "asc" }] } },
  });

  // Eine Anmeldung, um zu pruefen, dass sie NICHT mitkopiert wird.
  await buchungAnlegen(quelleId, person(1));

  const neuerStart = inTagen(44);
  const ergebnis = await kursDuplizieren(quelleId, neuerStart);
  pruefe(ergebnis.erfolg, "Duplikat entsteht");
  if (!ergebnis.erfolg) return;
  entstanden.push(ergebnis.kursId);

  const duplikat = await prisma.course.findUniqueOrThrow({
    where: { id: ergebnis.kursId },
    include: {
      sessions: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
      _count: { select: { bookings: true } },
    },
  });

  pruefe(
    duplikat.sessions.length === quelle.sessions.length,
    "gleich viele Blöcke wie im Original",
    `${duplikat.sessions.length} statt ${quelle.sessions.length}`,
  );
  pruefe(
    duplikat.sessions[0].date.toISOString().slice(0, 10) === neuerStart,
    `erster Termin liegt auf ${neuerStart}`,
    duplikat.sessions[0].date.toISOString().slice(0, 10),
  );

  const versatz = ergebnis.verschobenUm;
  const alleVerschoben = duplikat.sessions.every((termin, index) => {
    const original = quelle.sessions[index];
    const differenz =
      (termin.date.getTime() - original.date.getTime()) / 86_400_000;
    return differenz === versatz;
  });
  pruefe(
    alleVerschoben,
    `alle Termine um ${versatz} Tage verschoben, nicht nur der erste`,
    duplikat.sessions
      .map((t) => t.date.toISOString().slice(0, 10))
      .join(", "),
  );
  pruefe(
    duplikat.sessions.every(
      (termin, index) =>
        termin.startTime === quelle.sessions[index].startTime &&
        termin.endTime === quelle.sessions[index].endTime,
    ),
    "Uhrzeiten unverändert",
  );
  pruefe(
    duplikat.status === "DRAFT",
    "Duplikat ist ein Entwurf und nicht sofort öffentlich",
    duplikat.status,
  );
  pruefe(
    duplikat._count.bookings === 0,
    "keine Anmeldungen mitkopiert",
    `${duplikat._count.bookings}`,
  );
}

/**
 * Bearbeiten darf die Zuweisungen aus dem Einsatzplan nicht wegwerfen.
 *
 * Die Termine werden nach Position abgeglichen statt geloescht und neu
 * angelegt. Wer den zweiten Block um eine halbe Stunde verschiebt, soll nicht
 * nebenbei den Kursleiter verlieren.
 */
async function bearbeitenPruefen(prisma: PrismaSeedClient, entstanden: string[]) {
  console.log("Kurs bearbeiten");

  const start = inTagen(90);
  const kursId = await kursAnlegen({
    kursartId: await kursartId(prisma),
    termine: [
      { datum: start, von: "18:00", bis: "20:00" },
      { datum: start, von: "20:00", bis: "22:00" },
      { datum: inTagen(91), von: "18:00", bis: "20:00" },
    ],
    preis: "140.00",
    materialpreis: "30.00",
    onlineLimit: 12,
    fruehbucherProzent: "10",
    fruehbucherPlaetze: "5",
    notizen: NOTIZ,
    veroeffentlichen: true,
  });
  entstanden.push(kursId);

  const instruktor = await prisma.instructor.findFirstOrThrow({
    where: { active: true },
  });
  const vorher = await prisma.courseSession.findMany({
    where: { courseId: kursId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  await prisma.courseSession.update({
    where: { id: vorher[1].id },
    data: { instructorId: instruktor.id },
  });

  // Nur die Endzeit des zweiten Blocks aendern, sonst alles gleich.
  await kursAktualisieren(kursId, {
    kursartId: (await prisma.course.findUniqueOrThrow({ where: { id: kursId } }))
      .courseTypeId,
    termine: [
      { datum: start, von: "18:00", bis: "20:00" },
      { datum: start, von: "20:00", bis: "21:30" },
      { datum: inTagen(91), von: "18:00", bis: "20:00" },
    ],
    preis: "140.00",
    materialpreis: "30.00",
    onlineLimit: 12,
    fruehbucherProzent: "10",
    fruehbucherPlaetze: "5",
    notizen: NOTIZ,
    veroeffentlichen: true,
  });

  const nachher = await prisma.courseSession.findMany({
    where: { courseId: kursId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  pruefe(nachher.length === 3, "weiterhin drei Blöcke", `${nachher.length}`);
  pruefe(
    nachher[1].endTime === "21:30",
    "die geänderte Endzeit steht drin",
    nachher[1].endTime,
  );
  pruefe(
    nachher[1].instructorId === instruktor.id,
    "die Kursleiter-Zuweisung überlebt die Änderung",
    nachher[1].instructorId ?? "keine",
  );
  pruefe(
    nachher.every((termin, index) => termin.id === vorher[index].id),
    "die Termine behalten ihre Identität, sie werden nicht neu angelegt",
  );

  // Einen Block streichen: der ueberzaehlige verschwindet, die anderen bleiben.
  await kursAktualisieren(kursId, {
    kursartId: (await prisma.course.findUniqueOrThrow({ where: { id: kursId } }))
      .courseTypeId,
    termine: [
      { datum: start, von: "18:00", bis: "20:00" },
      { datum: start, von: "20:00", bis: "21:30" },
    ],
    preis: "140.00",
    materialpreis: "30.00",
    onlineLimit: 12,
    fruehbucherProzent: "",
    fruehbucherPlaetze: "",
    notizen: NOTIZ,
    veroeffentlichen: false,
  });

  const gekuerzt = await prisma.course.findUniqueOrThrow({
    where: { id: kursId },
    include: { sessions: true },
  });
  pruefe(gekuerzt.sessions.length === 2, "Block gestrichen", `${gekuerzt.sessions.length}`);
  pruefe(
    gekuerzt.status === "DRAFT",
    "als Entwurf gespeichert nimmt den Kurs von der Website",
    gekuerzt.status,
  );
  pruefe(
    gekuerzt.earlyBirdPercent === null && gekuerzt.earlyBirdSlots === null,
    "leerer Frühbucher löscht den Rabatt",
    `${gekuerzt.earlyBirdPercent} / ${gekuerzt.earlyBirdSlots}`,
  );
}

/**
 * Absagen nimmt die Buchungen mit. Ohne das zaehlte die Abrechnung in Sprint 5
 * Umsatz fuer einen Kurs, der nie stattgefunden hat.
 */
async function absagenPruefen(prisma: PrismaSeedClient, entstanden: string[]) {
  console.log("Kurs absagen");

  const start = inTagen(60);
  const kursId = await kursAnlegen({
    kursartId: await kursartId(prisma),
    termine: [
      { datum: start, von: "18:00", bis: "20:00" },
      { datum: inTagen(61), von: "18:00", bis: "20:00" },
    ],
    preis: "140.00",
    materialpreis: "30.00",
    onlineLimit: 12,
    fruehbucherProzent: "",
    fruehbucherPlaetze: "",
    notizen: NOTIZ,
    veroeffentlichen: true,
  });
  entstanden.push(kursId);

  await buchungAnlegen(kursId, person(2));
  await buchungAnlegen(kursId, person(3));

  const ergebnis = await kursAbsagen(kursId, "Zu wenige Anmeldungen");
  pruefe(ergebnis.erfolg, "Absage geht durch");
  if (!ergebnis.erfolg) return;

  pruefe(
    ergebnis.betroffene.length === 2,
    "beide Angemeldeten werden als betroffen gemeldet",
    `${ergebnis.betroffene.length}`,
  );
  pruefe(
    ergebnis.betroffene.every((person) => person.phone.length > 0),
    "jede betroffene Person hat eine Telefonnummer für den Rückruf",
  );

  const kurs = await prisma.course.findUniqueOrThrow({
    where: { id: kursId },
    select: { status: true, notes: true },
  });
  const bestaetigt = await prisma.booking.count({
    where: { courseId: kursId, status: "CONFIRMED" },
  });
  const storniert = await prisma.booking.count({
    where: { courseId: kursId, status: "CANCELLED" },
  });

  pruefe(kurs.status === "CANCELLED", "Kurs steht auf CANCELLED", kurs.status);
  pruefe(bestaetigt === 0, "keine bestätigte Buchung mehr", `${bestaetigt}`);
  pruefe(storniert === 2, "beide Buchungen storniert", `${storniert}`);
  pruefe(
    kurs.notes?.includes("Zu wenige Anmeldungen") === true,
    "Grund in der Notiz festgehalten",
    kurs.notes ?? "",
  );

  // Der Platz ist frei, aber der Kurs nimmt trotzdem nichts mehr an.
  const nachher = await buchungAnlegen(kursId, person(4));
  pruefe(
    !nachher.erfolg && nachher.fehler === "kurs-nicht-buchbar",
    "abgesagter Kurs nimmt keine Anmeldung mehr an",
    nachher.erfolg ? "sie ging durch" : nachher.fehler,
  );

  const zweiteAbsage = await kursAbsagen(kursId, "");
  pruefe(
    !zweiteAbsage.erfolg && zweiteAbsage.fehler === "bereits-abgesagt",
    "zweite Absage wird abgewiesen",
  );
}

/**
 * Konfliktwarnung des Einsatzplans.
 *
 * Reine Rechnung, deshalb ohne Datenbank. Der Fall, der zaehlt, ist der
 * knappe: 18-20 und 20-22 sind kein Konflikt, 18-20 und 19-21 schon.
 */
function konfliktePruefen() {
  console.log("Konfliktwarnung");

  const tag = new Date(Date.UTC(2026, 7, 18));
  const vaSh = { id: "i1", kuerzel: "VaSh", name: "Shala Valon" };
  const luBe = { id: "i2", kuerzel: "LuBe", name: "Bernasconi Luca" };

  const termin = (
    id: string,
    von: string,
    bis: string,
    instruktor: typeof vaSh | null,
    kursName = "VKU",
    datum = tag,
  ) => ({
    id,
    datum,
    von,
    bis,
    kursId: `k-${id}`,
    kursName,
    instruktor,
    imKonflikt: false,
  });

  const anschluss = konflikteFinden([
    termin("a", "18:00", "20:00", vaSh),
    termin("b", "20:00", "22:00", vaSh),
  ]);
  pruefe(
    anschluss.konflikte.length === 0,
    "aneinandergrenzende Blöcke sind kein Konflikt",
    `${anschluss.konflikte.length}`,
  );

  const ueberlappung = konflikteFinden([
    termin("a", "18:00", "20:00", vaSh, "Verkehrskundeunterricht"),
    termin("b", "19:00", "22:00", vaSh, "Nothelferkurs Intensiv"),
  ]);
  pruefe(
    ueberlappung.konflikte.length === 1,
    "Überschneidung wird erkannt",
    `${ueberlappung.konflikte.length}`,
  );
  pruefe(
    ueberlappung.konflikte[0]?.erster.kursName === "Verkehrskundeunterricht" &&
      ueberlappung.konflikte[0]?.zweiter.kursName === "Nothelferkurs Intensiv",
    "die Meldung nennt beide Kurse",
  );
  pruefe(
    ueberlappung.betroffene.has("a") && ueberlappung.betroffene.has("b"),
    "beide Termine sind als betroffen markiert",
  );

  const verschiedene = konflikteFinden([
    termin("a", "18:00", "20:00", vaSh),
    termin("b", "18:00", "20:00", luBe),
  ]);
  pruefe(
    verschiedene.konflikte.length === 0,
    "zwei verschiedene Personen zur selben Zeit sind kein Konflikt",
  );

  const andererTag = konflikteFinden([
    termin("a", "18:00", "20:00", vaSh),
    termin("b", "18:00", "20:00", vaSh, "VKU", new Date(Date.UTC(2026, 7, 19))),
  ]);
  pruefe(
    andererTag.konflikte.length === 0,
    "dieselbe Zeit an verschiedenen Tagen ist kein Konflikt",
  );

  const ohneZuweisung = konflikteFinden([
    termin("a", "18:00", "20:00", null),
    termin("b", "18:00", "20:00", null),
  ]);
  pruefe(
    ohneZuweisung.konflikte.length === 0,
    "unbesetzte Termine kollidieren nicht miteinander",
  );

  const dreifach = konflikteFinden([
    termin("a", "18:00", "22:00", vaSh),
    termin("b", "19:00", "20:00", vaSh),
    termin("c", "21:00", "23:00", vaSh),
  ]);
  pruefe(
    dreifach.konflikte.length === 2,
    "drei überlappende Termine ergeben zwei Meldungen",
    `${dreifach.konflikte.length}`,
  );
}

async function main() {
  const prisma = prismaOeffnen();
  const entstanden: string[] = [];

  try {
    const quelleId = await anlegenPruefen(prisma, entstanden);
    await leerenKursPruefen(prisma, entstanden);
    await duplizierenPruefen(prisma, quelleId, entstanden);
    await bearbeitenPruefen(prisma, entstanden);
    await absagenPruefen(prisma, entstanden);
    konfliktePruefen();
  } finally {
    // Buchungen haengen per Cascade an den Kursen und verschwinden mit ihnen.
    await prisma.course.deleteMany({ where: { id: { in: entstanden } } });

    const reste = await prisma.course.count({ where: { notes: NOTIZ } });
    console.log("Aufräumen");
    pruefe(reste === 0, "keine Prüfkurse zurückgeblieben", `${reste}`);

    await prisma.$disconnect();
  }

  console.log("");
  if (fehler > 0) {
    console.error(`${fehler} Pruefung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log("Alle Pruefungen bestanden.");
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
