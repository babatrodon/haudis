import "dotenv/config";
import {
  abrechnungLesen,
  accountingLesen,
  zeitfensterAus,
} from "../lib/abrechnung";
import { Decimal } from "../lib/decimal";
import { buchungAendern } from "../lib/admin/buchungen";
import { buchungAnlegen } from "../lib/buchung";
import { prismaOeffnen } from "./seed-lib";

/**
 * Prueft die Abrechnung gegen von Hand gerechnete Zahlen.
 *
 * Das Erfolgskriterium des Sprints lautet: der Provisionsreport stimmt mit
 * dem ueberein, was Ausilia von Hand rechnet. Genau das steht hier.
 *
 * Wichtig fuer die Aussagekraft: die erwarteten Betraege stehen als Literale
 * im Skript. Sie werden nicht aus derselben Funktion gerechnet, die geprueft
 * wird — sonst pruefte sich der Code gegen sich selbst und waere auch dann
 * gruen, wenn beide Seiten denselben Fehler machen.
 *
 * Die Rechnung, die dahintersteht:
 *
 *   VKU 140 + 30 Lehrmittel = 170.00, Fruehbucher 10 % fuer die ersten 2
 *   -> 153.00 fuer Buchung 1 und 2, danach 170.00
 *   BTU 200 + 0 = 200.00, kein Rabatt
 *
 *   VaSh: VKU 1 (153.00) + VKU 2 (153.00) + BTU 1 (200.00) = 506.00
 *         3 Anmeldungen x 50.00 = 150.00 Provision
 *   LuBe: VKU 3 (170.00) = 170.00
 *         1 Anmeldung x 50.00 = 50.00 Provision
 *   ohne Zuweisung: VKU 4 (170.00) = 170.00, keine Provision
 *
 *   Umsatz gesamt 506.00 + 170.00 + 170.00 = 846.00
 *   Provision gesamt 150.00 + 50.00 = 200.00
 *
 * Aufruf: pnpm verify:abrechnung
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

const NOTIZ = "Abrechnungsprüfung, wird wieder gelöscht";
const PRAEFIX = "pruef-abrechnung-";

function person(nummer: number, nachname: string) {
  return {
    anrede: "Frau" as const,
    nachname,
    vorname: `Test${nummer}`,
    strasse: "Haselstrasse 33",
    plz: "5400",
    ort: "Baden",
    geburtsdatum: "2008-03-12",
    telefon: "079 604 44 44",
    email: `abrechnung.${nummer}.${Date.now()}@example.invalid`,
    agb: true as const,
    webseite: "",
  };
}

/** Kalendertag in N Tagen, als Mitternacht UTC. */
function inTagen(tage: number): Date {
  const tag = new Date();
  tag.setUTCHours(0, 0, 0, 0);
  tag.setUTCDate(tag.getUTCDate() + tage);
  return tag;
}

/**
 * Anmeldetag der Pruefbuchungen, 200 Tage zurueck.
 *
 * Die Demodaten entstehen alle "heute". Laege die Pruefung im selben Fenster,
 * summierte sie Pruef- und Demodaten und die von Hand gerechneten Erwartungen
 * gingen nie auf.
 */
const ANMELDETAG = inTagen(-200);

/** Derselbe Tag als "2026-01-08", so wie ihn das Formular liefert. */
function tagWert(tage: number): string {
  return inTagen(tage).toISOString().slice(0, 10);
}

async function main() {
  const prisma = prismaOeffnen();
  const kursIds = [`${PRAEFIX}vku`, `${PRAEFIX}btu`, `${PRAEFIX}spaeter`];

  try {
    const vkuArt = await prisma.courseType.findFirstOrThrow({
      where: { code: "VKU" },
    });
    const btuArt = await prisma.courseType.findFirstOrThrow({
      where: { code: "BTU" },
    });
    const [vaSh, luBe] = await prisma.instructor.findMany({
      where: { active: true },
      orderBy: { shortCode: "asc" },
      take: 2,
    });

    await prisma.course.deleteMany({ where: { id: { in: kursIds } } });

    // Zwei Kurse im Zeitraum, einer weit ausserhalb.
    await prisma.course.create({
      data: {
        id: `${PRAEFIX}vku`,
        courseTypeId: vkuArt.id,
        price: "140.00",
        materialPrice: "30.00",
        onlineLimit: 20,
        earlyBirdPercent: "10.00",
        earlyBirdSlots: 2,
        status: "PUBLISHED",
        notes: NOTIZ,
        sessions: {
          create: [
            { date: inTagen(300), startTime: "18:00", endTime: "20:00" },
          ],
        },
      },
    });
    await prisma.course.create({
      data: {
        id: `${PRAEFIX}btu`,
        courseTypeId: btuArt.id,
        price: "200.00",
        materialPrice: "0.00",
        onlineLimit: 20,
        status: "PUBLISHED",
        notes: NOTIZ,
        sessions: {
          create: [
            { date: inTagen(302), startTime: "19:00", endTime: "21:00" },
          ],
        },
      },
    });
    await prisma.course.create({
      data: {
        id: `${PRAEFIX}spaeter`,
        courseTypeId: vkuArt.id,
        price: "140.00",
        materialPrice: "30.00",
        onlineLimit: 20,
        status: "PUBLISHED",
        notes: NOTIZ,
        sessions: {
          create: [
            { date: inTagen(400), startTime: "18:00", endTime: "20:00" },
          ],
        },
      },
    });

    // --- Buchungen anlegen -------------------------------------------------
    const b1 = await buchungAnlegen(`${PRAEFIX}vku`, person(1, "Aebi"), {
      referredById: vaSh.id,
    });
    const b2 = await buchungAnlegen(`${PRAEFIX}vku`, person(2, "Berger"), {
      referredById: vaSh.id,
    });
    const b3 = await buchungAnlegen(`${PRAEFIX}vku`, person(3, "Custer"), {
      referredById: luBe.id,
    });
    const b4 = await buchungAnlegen(`${PRAEFIX}vku`, person(4, "Dubs"));
    const b5 = await buchungAnlegen(`${PRAEFIX}btu`, person(5, "Erni"), {
      referredById: vaSh.id,
    });
    // Storniert: zaehlt nirgends mit, wird aber ausgewiesen.
    const b6 = await buchungAnlegen(`${PRAEFIX}vku`, person(6, "Frei"), {
      referredById: vaSh.id,
    });
    // Ausserhalb des Zeitraums nach Kursdatum.
    const b7 = await buchungAnlegen(`${PRAEFIX}spaeter`, person(7, "Graf"), {
      referredById: vaSh.id,
    });

    for (const [name, e] of [
      ["1", b1],
      ["2", b2],
      ["3", b3],
      ["4", b4],
      ["5", b5],
      ["6", b6],
      ["7", b7],
    ] as const) {
      if (!e.erfolg) {
        pruefe(false, `Buchung ${name} angelegt`, e.fehler);
        return;
      }
    }
    if (!b6.erfolg || !b1.erfolg || !b2.erfolg || !b3.erfolg) return;

    await prisma.booking.update({
      where: { id: b6.buchungId },
      data: { status: "CANCELLED" },
    });

    // Alle Pruefbuchungen in ein eigenes, weit zurueckliegendes Fenster
    // schieben. Die Demodaten entstehen alle "heute"; ohne diesen Abstand
    // liefe die Pruefung gegen die Summe aus Pruef- und Demodaten und waere
    // wertlos.
    await prisma.booking.updateMany({
      where: { courseId: { in: [`${PRAEFIX}vku`, `${PRAEFIX}btu`] } },
      data: { createdAt: ANMELDETAG },
    });

    // Buchung 7 liegt noch weiter zurueck und faellt damit auch aus dem
    // Pruef-Fenster. Sie dient allein dem Kursdatum-Fall: ihr Kurs findet
    // erst in 400 Tagen statt.
    if (b7.erfolg) {
      await prisma.booking.update({
        where: { id: b7.buchungId },
        data: { createdAt: inTagen(-400) },
      });
    }

    console.log("Preise (Grundlage der ganzen Rechnung)");
    const preise = await prisma.booking.findMany({
      where: { courseId: `${PRAEFIX}vku` },
      // Nach Nachname: die Buchungen tragen nach dem Zurueckdatieren denselben
      // Zeitstempel, und die Namen sind in Anlegereihenfolge vergeben.
      orderBy: { lastName: "asc" },
      select: { priceCharged: true, lastName: true },
    });
    pruefe(
      preise[0]?.priceCharged.toString() === "153" &&
        preise[1]?.priceCharged.toString() === "153",
      "die ersten zwei VKU-Anmeldungen kosten 153.00",
      preise.map((p) => p.priceCharged.toString()).join(", "),
    );
    pruefe(
      preise[2]?.priceCharged.toString() === "170",
      "die dritte kostet 170.00",
      preise[2]?.priceCharged.toString(),
    );

    console.log("Provisionssatz auf der Buchung");
    const mitSatz = await prisma.booking.findUniqueOrThrow({
      where: { id: b1.buchungId },
      select: { commissionRate: true },
    });
    pruefe(
      mitSatz.commissionRate?.toString() === "50",
      "Satz beim Anlegen festgehalten",
      mitSatz.commissionRate?.toString() ?? "keiner",
    );
    const ohneZuweisung = await prisma.booking.findFirstOrThrow({
      where: { courseId: `${PRAEFIX}vku`, referredById: null },
      select: { commissionRate: true },
    });
    pruefe(
      ohneZuweisung.commissionRate === null,
      "ohne Zuweisung kein Satz",
      ohneZuweisung.commissionRate?.toString() ?? "null",
    );

    // --- Abrechnung nach Anmeldedatum -------------------------------------
    console.log("Abrechnung, Basis Anmeldedatum");
    // Genau ein Tag, von und bis derselbe. Prueft nebenbei, dass der
    // gewaehlte Endtag einschliesslich gilt: waere er es nicht, waere das
    // Fenster leer und alle Zahlen null.
    const fenster = zeitfensterAus(
      tagWert(-200),
      tagWert(-200),
      "anmeldung",
    );
    const abrechnung = await abrechnungLesen(fenster);

    const vaShBlock = abrechnung.bloecke.find(
      (b) => b.instruktorId === vaSh.id,
    );
    const luBeBlock = abrechnung.bloecke.find(
      (b) => b.instruktorId === luBe.id,
    );
    const ohneBlock = abrechnung.bloecke.find((b) => b.instruktorId === null);

    pruefe(vaShBlock !== undefined, `Block für ${vaSh.shortCode} vorhanden`);
    pruefe(luBeBlock !== undefined, `Block für ${luBe.shortCode} vorhanden`);
    pruefe(ohneBlock !== undefined, 'Block "Ohne Zuweisung" vorhanden');
    if (!vaShBlock || !luBeBlock || !ohneBlock) return;

    // Von Hand: 153.00 + 153.00 + 200.00 = 506.00
    pruefe(
      vaShBlock.anzahl === 3,
      `${vaSh.shortCode}: 3 Anmeldungen`,
      `${vaShBlock.anzahl}`,
    );
    pruefe(
      vaShBlock.umsatz.toFixed(2) === "506.00",
      `${vaSh.shortCode}: Umsatz 506.00`,
      vaShBlock.umsatz.toFixed(2),
    );
    pruefe(
      vaShBlock.posten.length === 1 &&
        vaShBlock.posten[0].anzahl === 3 &&
        vaShBlock.posten[0].satz.toFixed(2) === "50.00" &&
        vaShBlock.posten[0].betrag.toFixed(2) === "150.00",
      `${vaSh.shortCode}: eine Rechenzeile, 3 × 50.00 = 150.00`,
      vaShBlock.posten
        .map((p) => `${p.anzahl}x${p.satz.toFixed(2)}=${p.betrag.toFixed(2)}`)
        .join(", "),
    );
    pruefe(
      vaShBlock.kursarten.length === 2,
      `${vaSh.shortCode}: zwei Kursarten`,
      vaShBlock.kursarten.map((k) => k.code).join(", "),
    );
    const vkuGruppe = vaShBlock.kursarten.find((k) => k.code === "VKU");
    pruefe(
      vkuGruppe?.umsatz.toFixed(2) === "306.00" && vkuGruppe?.anzahl === 2,
      `${vaSh.shortCode}: VKU-Zwischentotal 2 Anmeldungen, 306.00`,
      `${vkuGruppe?.anzahl} / ${vkuGruppe?.umsatz.toFixed(2)}`,
    );

    pruefe(
      luBeBlock.umsatz.toFixed(2) === "170.00" &&
        luBeBlock.provision.toFixed(2) === "50.00",
      `${luBe.shortCode}: 170.00 Umsatz, 50.00 Provision`,
      `${luBeBlock.umsatz.toFixed(2)} / ${luBeBlock.provision.toFixed(2)}`,
    );

    pruefe(
      ohneBlock.umsatz.toFixed(2) === "170.00" &&
        ohneBlock.provision.toFixed(2) === "0.00" &&
        ohneBlock.posten.length === 0,
      "Ohne Zuweisung: 170.00 Umsatz, keine Provision",
      `${ohneBlock.umsatz.toFixed(2)} / ${ohneBlock.provision.toFixed(2)}`,
    );

    // Summenprobe: 506.00 + 170.00 + 170.00 = 846.00
    pruefe(
      abrechnung.umsatz.toFixed(2) === "846.00",
      "Gesamtumsatz 846.00",
      abrechnung.umsatz.toFixed(2),
    );
    pruefe(
      abrechnung.provision.toFixed(2) === "200.00",
      "Gesamtprovision 200.00",
      abrechnung.provision.toFixed(2),
    );
    pruefe(abrechnung.anzahl === 5, "5 Anmeldungen gezählt", `${abrechnung.anzahl}`);

    const summeBloecke = abrechnung.bloecke.reduce(
      (summe, block) => summe.plus(block.umsatz),
      new Decimal(0),
    );
    pruefe(
      summeBloecke.eq(abrechnung.umsatz),
      "Summe der Blöcke ergibt den Periodenumsatz, auf den Rappen",
      `${summeBloecke.toFixed(2)} gegen ${abrechnung.umsatz.toFixed(2)}`,
    );

    pruefe(
      abrechnung.ausgeschlossen.anzahl === 1 &&
        abrechnung.ausgeschlossen.umsatz.toFixed(2) === "170.00",
      "eine stornierte Anmeldung ausgewiesen, 170.00",
      `${abrechnung.ausgeschlossen.anzahl} / ${abrechnung.ausgeschlossen.umsatz.toFixed(2)}`,
    );

    // --- Ein Instruktor allein --------------------------------------------
    console.log("Abrechnung, auf einen Fahrlehrer eingeschränkt");
    const nurVaSh = await abrechnungLesen(fenster, vaSh.id);
    pruefe(
      nurVaSh.bloecke.length === 1 &&
        nurVaSh.provision.toFixed(2) === "150.00" &&
        nurVaSh.umsatz.toFixed(2) === "506.00",
      `nur ${vaSh.shortCode}: 506.00 Umsatz, 150.00 Provision`,
      `${nurVaSh.bloecke.length} Blöcke, ${nurVaSh.umsatz.toFixed(2)}, ${nurVaSh.provision.toFixed(2)}`,
    );

    // --- Geaenderter Satz --------------------------------------------------
    console.log("Geänderter Provisionssatz");
    await prisma.instructor.update({
      where: { id: luBe.id },
      data: { provisionPerBooking: "60.00" },
    });
    const nachSatzaenderung = await abrechnungLesen(fenster, luBe.id);
    pruefe(
      nachSatzaenderung.provision.toFixed(2) === "50.00",
      "die alte Buchung behält ihren Satz von 50.00",
      nachSatzaenderung.provision.toFixed(2),
    );

    // Eine neue Buchung bekommt den neuen Satz, der Report zeigt zwei Zeilen.
    const b8 = await buchungAnlegen(`${PRAEFIX}btu`, person(8, "Huber"), {
      referredById: luBe.id,
    });
    if (!b8.erfolg) {
      pruefe(false, "Buchung 8 angelegt", b8.fehler);
      return;
    }
    await prisma.booking.update({
      where: { id: b8.buchungId },
      data: { createdAt: ANMELDETAG },
    });
    const zweiSaetze = await abrechnungLesen(fenster, luBe.id);
    const postenZeilen = zweiSaetze.bloecke[0]?.posten ?? [];
    pruefe(
      postenZeilen.length === 2,
      "zwei Rechenzeilen bei zwei Sätzen",
      postenZeilen
        .map((p) => `${p.anzahl}x${p.satz.toFixed(2)}`)
        .join(", "),
    );
    pruefe(
      zweiSaetze.provision.toFixed(2) === "110.00",
      "Provision 50.00 + 60.00 = 110.00",
      zweiSaetze.provision.toFixed(2),
    );

    // Satz wieder zuruecksetzen, damit der Seed-Zustand stimmt.
    await prisma.instructor.update({
      where: { id: luBe.id },
      data: { provisionPerBooking: "50.00" },
    });

    // --- Zuweisung nachtraeglich aendern -----------------------------------
    console.log("Zuweisung nachträglich ändern");
    const vorher = await prisma.booking.findUniqueOrThrow({
      where: { id: b4.erfolg ? b4.buchungId : "" },
      select: {
        salutation: true,
        firstName: true,
        lastName: true,
        street: true,
        zip: true,
        city: true,
        birthDate: true,
        phone: true,
        email: true,
        lfaNumber: true,
      },
    });
    await buchungAendern(b4.erfolg ? b4.buchungId : "", {
      anrede: vorher.salutation,
      vorname: vorher.firstName,
      nachname: vorher.lastName,
      strasse: vorher.street,
      plz: vorher.zip,
      ort: vorher.city,
      geburtsdatum: vorher.birthDate.toISOString().slice(0, 10),
      telefon: vorher.phone,
      email: vorher.email ?? "",
      lfaNummer: vorher.lfaNumber ?? "",
      fahrlehrerId: vaSh.id,
    });
    const zugewiesen = await prisma.booking.findUniqueOrThrow({
      where: { id: b4.erfolg ? b4.buchungId : "" },
      select: { commissionRate: true, referredById: true },
    });
    pruefe(
      zugewiesen.referredById === vaSh.id &&
        zugewiesen.commissionRate?.toString() === "50",
      "nachträgliche Zuweisung setzt den Satz",
      `${zugewiesen.referredById === vaSh.id} / ${zugewiesen.commissionRate?.toString()}`,
    );

    // Erneut speichern ohne Wechsel darf den Satz nicht neu ziehen.
    await prisma.instructor.update({
      where: { id: vaSh.id },
      data: { provisionPerBooking: "70.00" },
    });
    await buchungAendern(b4.erfolg ? b4.buchungId : "", {
      anrede: vorher.salutation,
      vorname: vorher.firstName,
      nachname: vorher.lastName,
      strasse: vorher.street,
      plz: vorher.zip,
      ort: "Wettingen",
      geburtsdatum: vorher.birthDate.toISOString().slice(0, 10),
      telefon: vorher.phone,
      email: vorher.email ?? "",
      lfaNummer: vorher.lfaNumber ?? "",
      fahrlehrerId: vaSh.id,
    });
    const unveraendert = await prisma.booking.findUniqueOrThrow({
      where: { id: b4.erfolg ? b4.buchungId : "" },
      select: { commissionRate: true, city: true },
    });
    pruefe(
      unveraendert.commissionRate?.toString() === "50" &&
        unveraendert.city === "Wettingen",
      "eine Adressänderung lässt den festgehaltenen Satz in Ruhe",
      `Satz ${unveraendert.commissionRate?.toString()}, Ort ${unveraendert.city}`,
    );
    await prisma.instructor.update({
      where: { id: vaSh.id },
      data: { provisionPerBooking: "50.00" },
    });

    // --- Basis Kursdatum ---------------------------------------------------
    console.log("Abrechnung, Basis Kursdatum");
    const nachKurs = await abrechnungLesen(
      zeitfensterAus(tagWert(300), tagWert(300), "kurs"),
    );
    pruefe(
      nachKurs.anzahl === 4,
      "nur die vier VKU-Anmeldungen im Kursfenster",
      `${nachKurs.anzahl}`,
    );
    pruefe(
      nachKurs.umsatz.toFixed(2) === "646.00",
      "Umsatz 153 + 153 + 170 + 170 = 646.00",
      nachKurs.umsatz.toFixed(2),
    );

    const weitDraussen = await abrechnungLesen(
      zeitfensterAus(tagWert(400), tagWert(400), "kurs"),
    );
    pruefe(
      weitDraussen.anzahl === 1,
      "der Kurs in 400 Tagen erscheint nur in seinem eigenen Fenster",
      `${weitDraussen.anzahl}`,
    );

    // --- Accounting --------------------------------------------------------
    console.log("Accounting");
    // Inzwischen ist Buchung 8 dazugekommen (BTU 200.00), Buchung 4 wurde
    // zugewiesen. Von Hand: 153 + 153 + 170 + 170 + 200 + 200 = 1046.00
    const accounting = await accountingLesen(fenster);
    pruefe(
      accounting.umsatz.toFixed(2) === "1046.00",
      "Accounting-Total 1046.00",
      accounting.umsatz.toFixed(2),
    );
    pruefe(accounting.anzahl === 6, "6 Anmeldungen", `${accounting.anzahl}`);
    const vku = accounting.kursarten.find((k) => k.code === "VKU");
    const btu = accounting.kursarten.find((k) => k.code === "BTU");
    pruefe(
      vku?.anzahl === 4 && vku?.umsatz.toFixed(2) === "646.00",
      "Kursart VKU: 4 Anmeldungen, 646.00",
      `${vku?.anzahl} / ${vku?.umsatz.toFixed(2)}`,
    );
    pruefe(
      btu?.anzahl === 2 && btu?.umsatz.toFixed(2) === "400.00",
      "Kursart BTU: 2 Anmeldungen, 400.00",
      `${btu?.anzahl} / ${btu?.umsatz.toFixed(2)}`,
    );
    pruefe(
      accounting.umsatzOhneMotorrad.eq(accounting.umsatz),
      "ohne Motorradkurse in diesen Testdaten gleich dem Total",
      `${accounting.umsatzOhneMotorrad.toFixed(2)}`,
    );
  } finally {
    await prisma.booking.deleteMany({
      where: { course: { id: { in: kursIds } } },
    });
    await prisma.course.deleteMany({ where: { id: { in: kursIds } } });

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
