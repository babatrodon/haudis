import "dotenv/config";
import {
  buchungReaktivieren,
  buchungStornieren,
} from "../lib/admin/buchungen";
import { buchungAnlegen, buchungLesen } from "../lib/buchung";
import { bestaetigungSenden } from "../lib/mail";
import { prismaOeffnen, type PrismaSeedClient } from "./seed-lib";

/**
 * Prueft die Zusicherungen des Buchungsablaufs gegen die echte Datenbank.
 *
 * Der Playwright-Test geht den Weg der Kundin durch den Browser. Was er nicht
 * kann, steht hier: gleichzeitige Anmeldungen auf denselben letzten Platz.
 * Genau dieser Fall ist der teuerste, wenn er schiefgeht, und er faellt beim
 * Klicken nie auf.
 *
 * Aufruf: pnpm verify:buchung
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

const PRAEFIX = "demo-pruefung-";

function person(nummer: number, email?: string) {
  return {
    anrede: "Frau" as const,
    nachname: `Pruefung${nummer}`,
    vorname: "Testperson",
    strasse: "Haselstrasse 33",
    plz: "5400",
    ort: "Baden",
    geburtsdatum: "2008-03-12",
    telefon: "079 604 44 44",
    email: email ?? `pruefung.${nummer}.${Date.now()}@example.invalid`,
    agb: true as const,
    webseite: "",
  };
}

/** Legt einen Wegwerf-Kurs an und raeumt ihn danach wieder ab. */
async function mitTestkurs<T>(
  prisma: PrismaSeedClient,
  einstellungen: {
    id: string;
    onlineLimit: number;
    preis: string;
    material: string;
    prozent?: string;
    plaetze?: number;
  },
  arbeit: (kursId: string) => Promise<T>,
): Promise<T> {
  const kursart = await prisma.courseType.findFirstOrThrow({
    where: { code: "VKU" },
  });
  const morgen = new Date();
  morgen.setDate(morgen.getDate() + 14);

  await prisma.course.deleteMany({ where: { id: einstellungen.id } });
  await prisma.course.create({
    data: {
      id: einstellungen.id,
      courseTypeId: kursart.id,
      price: einstellungen.preis,
      materialPrice: einstellungen.material,
      onlineLimit: einstellungen.onlineLimit,
      status: "PUBLISHED",
      notes: "Automatische Pruefung, wird wieder geloescht",
      earlyBirdPercent: einstellungen.prozent ?? null,
      earlyBirdSlots: einstellungen.plaetze ?? null,
      sessions: {
        create: [
          { date: morgen, startTime: "18:00", endTime: "20:00" },
        ],
      },
    },
  });

  try {
    return await arbeit(einstellungen.id);
  } finally {
    await prisma.course.deleteMany({ where: { id: einstellungen.id } });
  }
}

/**
 * Der wichtigste Test. Mehrere Anmeldungen starten gleichzeitig auf einen Kurs
 * mit genau einem Platz. Ohne die Zeilensperre in lib/buchung.ts zaehlen alle
 * null Belegungen und alle fuegen ein.
 */
async function wettlaufPruefen(prisma: PrismaSeedClient) {
  console.log("Gleichzeitige Anmeldungen auf den letzten Platz");

  await mitTestkurs(
    prisma,
    { id: `${PRAEFIX}wettlauf`, onlineLimit: 1, preis: "140.00", material: "30.00" },
    async (kursId) => {
      const gleichzeitig = 8;
      const ergebnisse = await Promise.all(
        Array.from({ length: gleichzeitig }, (_, i) =>
          buchungAnlegen(kursId, person(i)),
        ),
      );

      const erfolgreich = ergebnisse.filter((e) => e.erfolg).length;
      const ausgebucht = ergebnisse.filter(
        (e) => !e.erfolg && e.fehler === "ausgebucht",
      ).length;
      const inDb = await prisma.booking.count({
        where: { courseId: kursId, status: "CONFIRMED" },
      });

      pruefe(
        erfolgreich === 1,
        `von ${gleichzeitig} gleichzeitigen Anmeldungen gelingt genau eine`,
        `${erfolgreich} gelungen`,
      );
      pruefe(
        ausgebucht === gleichzeitig - 1,
        `die übrigen ${gleichzeitig - 1} bekommen "ausgebucht"`,
        `${ausgebucht}`,
      );
      pruefe(
        inDb === 1,
        "in der Datenbank steht genau eine bestätigte Buchung",
        `${inDb}`,
      );
    },
  );
}

/** Geschaeftsregel 3: 10 % fuer die ersten fuenf, danach voller Preis. */
async function fruehbucherGrenzePruefen(prisma: PrismaSeedClient) {
  console.log("Frühbuchergrenze");

  await mitTestkurs(
    prisma,
    {
      id: `${PRAEFIX}fruehbucher`,
      onlineLimit: 10,
      preis: "140.00",
      material: "30.00",
      prozent: "10.00",
      plaetze: 5,
    },
    async (kursId) => {
      const preise: string[] = [];
      for (let i = 0; i < 6; i += 1) {
        const e = await buchungAnlegen(kursId, person(i));
        preise.push(e.erfolg ? e.total.toString() : `FEHLER:${e.fehler}`);
      }

      pruefe(
        preise.slice(0, 5).every((p) => p === "153"),
        "Buchungen 1 bis 5 kosten 153.00",
        preise.slice(0, 5).join(", "),
      );
      pruefe(preise[5] === "170", "Buchung 6 kostet 170.00", preise[5]);

      // Der gespeicherte Betrag muss dem entsprechen, was gerechnet wurde.
      const gespeichert = await prisma.booking.findMany({
        where: { courseId: kursId },
        select: { priceCharged: true, earlyBird: true },
        orderBy: { createdAt: "asc" },
      });
      pruefe(
        gespeichert.filter((b) => b.earlyBird).length === 5,
        "genau fünf Buchungen sind als Frühbucher markiert",
        `${gespeichert.filter((b) => b.earlyBird).length}`,
      );
      pruefe(
        gespeichert.every(
          (b, i) => b.priceCharged.toString() === (i < 5 ? "153" : "170"),
        ),
        "priceCharged stimmt mit der Anzeige überein",
        gespeichert.map((b) => b.priceCharged.toString()).join(", "),
      );
    },
  );
}

/** Geschaeftsregel 8: gleiche E-Mail, gleicher Kurs, 10 Minuten. */
async function doppelbuchungPruefen(prisma: PrismaSeedClient) {
  console.log("Doppelbuchungsschutz");

  await mitTestkurs(
    prisma,
    { id: `${PRAEFIX}doppelt`, onlineLimit: 10, preis: "140.00", material: "30.00" },
    async (kursId) => {
      const adresse = `doppelt.${Date.now()}@example.invalid`;
      const erste = await buchungAnlegen(kursId, person(1, adresse));
      const zweite = await buchungAnlegen(kursId, person(2, adresse));

      pruefe(erste.erfolg, "erste Anmeldung gelingt");
      pruefe(
        !zweite.erfolg && zweite.fehler === "doppelbuchung",
        "zweite Anmeldung mit derselben Adresse wird abgewiesen",
        zweite.erfolg ? "sie ging durch" : zweite.fehler,
      );

      const anzahl = await prisma.booking.count({ where: { courseId: kursId } });
      pruefe(anzahl === 1, "nur eine Buchung in der Datenbank", `${anzahl}`);

      // Eine andere Adresse muss weiterhin durchkommen.
      const dritte = await buchungAnlegen(kursId, person(3));
      pruefe(dritte.erfolg, "andere Adresse wird nicht blockiert");
    },
  );
}

/** Ein voller Kurs nimmt auch einzeln keine Anmeldung mehr an. */
async function ausgebuchtPruefen(prisma: PrismaSeedClient) {
  console.log("Ausgebuchter Kurs");

  await mitTestkurs(
    prisma,
    { id: `${PRAEFIX}voll`, onlineLimit: 2, preis: "140.00", material: "30.00" },
    async (kursId) => {
      await buchungAnlegen(kursId, person(1));
      await buchungAnlegen(kursId, person(2));
      const dritte = await buchungAnlegen(kursId, person(3));

      pruefe(
        !dritte.erfolg && dritte.fehler === "ausgebucht",
        "Anmeldung über das Limit hinaus wird abgewiesen",
        dritte.erfolg ? "sie ging durch" : dritte.fehler,
      );

      const anzahl = await prisma.booking.count({
        where: { courseId: kursId, status: "CONFIRMED" },
      });
      pruefe(anzahl === 2, "das Limit von 2 wird eingehalten", `${anzahl}`);
    },
  );
}

/** Ein abgesagter oder nicht veroeffentlichter Kurs ist nicht buchbar. */
async function nichtBuchbarPruefen(prisma: PrismaSeedClient) {
  console.log("Nicht buchbare Kurse");

  await mitTestkurs(
    prisma,
    { id: `${PRAEFIX}entwurf`, onlineLimit: 5, preis: "140.00", material: "30.00" },
    async (kursId) => {
      await prisma.course.update({
        where: { id: kursId },
        data: { status: "DRAFT" },
      });
      const entwurf = await buchungAnlegen(kursId, person(1));
      pruefe(
        !entwurf.erfolg && entwurf.fehler === "kurs-nicht-buchbar",
        "Entwurf nimmt keine Anmeldung an",
      );

      await prisma.course.update({
        where: { id: kursId },
        data: { status: "CANCELLED" },
      });
      const abgesagt = await buchungAnlegen(kursId, person(2));
      pruefe(
        !abgesagt.erfolg && abgesagt.fehler === "kurs-nicht-buchbar",
        "abgesagter Kurs nimmt keine Anmeldung an",
      );
    },
  );
}

/**
 * Telefonische Anmeldung, Geschaeftsregel 4.
 *
 * Sie laeuft durch dieselbe Funktion wie die Onlineanmeldung, also durch
 * dieselbe Zeilensperre. Der Unterschied liegt in der Quelle, im fehlenden
 * AGB-Zeitstempel und darin, dass kein Bestaetigungsmail hinausgeht.
 */
async function telefonischPruefen(prisma: PrismaSeedClient) {
  console.log("Telefonische Anmeldung");

  await mitTestkurs(
    prisma,
    { id: `${PRAEFIX}telefon`, onlineLimit: 2, preis: "140.00", material: "30.00" },
    async (kursId) => {
      const instruktor = await prisma.instructor.findFirstOrThrow({
        where: { active: true },
      });

      const ergebnis = await buchungAnlegen(kursId, person(1), {
        quelle: "PHONE",
        lfaNummer: "AG 123456",
        referredById: instruktor.id,
      });
      pruefe(ergebnis.erfolg, "telefonische Anmeldung gelingt");
      if (!ergebnis.erfolg) return;

      const buchung = await prisma.booking.findUniqueOrThrow({
        where: { id: ergebnis.buchungId },
      });

      pruefe(buchung.source === "PHONE", "Quelle ist PHONE", buchung.source);
      pruefe(
        buchung.agbAcceptedAt === null,
        "kein AGB-Zeitstempel: am Telefon setzt niemand ein Häkchen",
        String(buchung.agbAcceptedAt),
      );
      pruefe(
        buchung.lfaNumber === "AG 123456",
        "diktierte Ausweisnummer gespeichert",
        buchung.lfaNumber ?? "keine",
      );
      pruefe(
        buchung.referredById === instruktor.id,
        "zuweisender Fahrlehrer gespeichert",
      );

      // Geschaeftsregel 4: der Mailversand lehnt eine PHONE-Buchung selbst ab,
      // unabhaengig davon, wer ihn aufruft.
      const mitKurs = await buchungLesen(ergebnis.buchungId);
      const versand = await bestaetigungSenden(mitKurs!);
      pruefe(
        !versand.gesendet && versand.grund === "telefonische Anmeldung, keine Mail",
        "kein Bestätigungsmail für eine telefonische Anmeldung",
        versand.grund ?? "es ging hinaus",
      );

      // Ohne E-Mail-Adresse: am Schalter ein Alltagsfall, vor allem bei den
      // Nothelferkursen. Telefon bleibt Pflicht, darueber ist die Person
      // erreichbar.
      const ohneAdresse = await buchungAnlegen(
        kursId,
        { ...person(2), email: undefined },
        { quelle: "PHONE" },
      );
      pruefe(ohneAdresse.erfolg, "Anmeldung ohne E-Mail-Adresse gelingt");
      if (ohneAdresse.erfolg) {
        const gespeichert = await prisma.booking.findUniqueOrThrow({
          where: { id: ohneAdresse.buchungId },
        });
        pruefe(
          gespeichert.email === null,
          "keine erfundene Adresse gespeichert",
          gespeichert.email ?? "null",
        );

        const mitKursOhne = await buchungLesen(ohneAdresse.buchungId);
        const versandOhne = await bestaetigungSenden({
          ...mitKursOhne!,
          source: "ONLINE",
        });
        pruefe(
          !versandOhne.gesendet &&
            versandOhne.grund === "keine E-Mail-Adresse hinterlegt",
          "der Mailversand bricht sauber ab statt zu scheitern",
          versandOhne.grund ?? "er ging hinaus",
        );
      }

      // Dieselbe Kapazitaetspruefung wie online.
      const dritte = await buchungAnlegen(kursId, person(3), { quelle: "PHONE" });
      pruefe(
        !dritte.erfolg && dritte.fehler === "ausgebucht",
        "telefonische Anmeldung über das Limit wird abgewiesen",
        dritte.erfolg ? "sie ging durch" : dritte.fehler,
      );
    },
  );
}

/** Stornieren gibt den Platz frei, die Zeile bleibt stehen. */
async function stornoPruefen(prisma: PrismaSeedClient) {
  console.log("Stornieren und wieder anmelden");

  await mitTestkurs(
    prisma,
    { id: `${PRAEFIX}storno`, onlineLimit: 1, preis: "140.00", material: "30.00" },
    async (kursId) => {
      const erste = await buchungAnlegen(kursId, person(1));
      if (!erste.erfolg) {
        pruefe(false, "erste Anmeldung gelingt");
        return;
      }

      const vollerKurs = await buchungAnlegen(kursId, person(2));
      pruefe(
        !vollerKurs.erfolg && vollerKurs.fehler === "ausgebucht",
        "der einzige Platz ist belegt",
      );

      await buchungStornieren(erste.buchungId);
      const nachStorno = await prisma.booking.findUniqueOrThrow({
        where: { id: erste.buchungId },
      });
      pruefe(
        nachStorno.status === "CANCELLED",
        "Buchung steht auf storniert, die Zeile bleibt",
        nachStorno.status,
      );

      const nachher = await buchungAnlegen(kursId, person(3));
      pruefe(nachher.erfolg, "der freigewordene Platz ist wieder buchbar");

      // Jetzt ist der Kurs wieder voll: der Widerruf darf ihn nicht ueberbuchen.
      const zurueck = await buchungReaktivieren(erste.buchungId);
      pruefe(
        !zurueck.erfolg && zurueck.fehler === "ausgebucht",
        "Wiederanmeldung wird abgewiesen, wenn der Platz weg ist",
        zurueck.erfolg ? "sie ging durch" : (zurueck.fehler ?? ""),
      );

      const bestaetigt = await prisma.booking.count({
        where: { courseId: kursId, status: "CONFIRMED" },
      });
      pruefe(bestaetigt === 1, "der Kurs bleibt bei einem Platz", `${bestaetigt}`);
    },
  );
}

async function main() {
  const prisma = prismaOeffnen();
  try {
    await wettlaufPruefen(prisma);
    await fruehbucherGrenzePruefen(prisma);
    await doppelbuchungPruefen(prisma);
    await ausgebuchtPruefen(prisma);
    await nichtBuchbarPruefen(prisma);
    await telefonischPruefen(prisma);
    await stornoPruefen(prisma);

    // Sicherheitsnetz: nichts von dieser Pruefung darf zurueckbleiben.
    const reste = await prisma.course.count({
      where: { id: { startsWith: PRAEFIX } },
    });
    console.log("Aufräumen");
    pruefe(reste === 0, "keine Prüfkurse in der Datenbank zurückgeblieben", `${reste}`);
  } finally {
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
