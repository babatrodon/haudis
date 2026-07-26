import "dotenv/config";
import { prismaOeffnen, type PrismaSeedClient } from "./seed-lib";

/**
 * Demodaten: Beispielkurse und Buchungen fuer die Entwicklung.
 *
 * Bewusst getrennt vom Referenz-Seed, weil diese Datenbank spaeter produktiv
 * laeuft. Erfundene Personen gehoeren nicht in dieselbe Tabelle wie echte
 * Anmeldungen, ohne dass man sie zweifelsfrei wieder herausbekommt.
 *
 * Zwei Sicherungen dafuer:
 *   - Kurse tragen feste IDs mit dem Praefix "demo-"
 *   - Buchungen laufen auf @example.invalid, eine reservierte Domain (RFC 2606)
 *
 * Aufraeumen mit: pnpm db:seed:demo:purge
 *
 * Die Kurse decken alle Ampel-Zustaende ab (Geschaeftsregel 2). Die Ampel
 * selbst wird in Sprint 3 berechnet, hier entstehen nur die Buchungszahlen:
 *   demo-vku-gruen   5 von 12 belegt, 7 frei  -> gruen
 *   demo-vku-gelb   10 von 12 belegt, 2 frei  -> gelb
 *   demo-vku-rot    12 von 12 belegt, 0 frei  -> rot
 */

const DEMO_PRAEFIX = "demo-";
const DEMO_MAILDOMAIN = "@example.invalid";

type DemoBuchung = {
  anrede: string;
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  geburtsjahr: number;
  telefon: string;
  lfaNummer?: string;
  quelle?: "ONLINE" | "PHONE";
  status?: "CONFIRMED" | "CANCELLED" | "WAITLIST";
  fruehbucher?: boolean;
  /** Kuerzel des zuweisenden Fahrlehrers, Grundlage der Provision. */
  vermitteltVon?: string;
};

const ORTE = [
  { plz: "5400", ort: "Baden" },
  { plz: "5430", ort: "Wettingen" },
  { plz: "5408", ort: "Ennetbaden" },
  { plz: "5405", ort: "Dättwil" },
  { plz: "5417", ort: "Untersiggenthal" },
  { plz: "5443", ort: "Niederrohrdorf" },
];

const VORNAMEN = [
  "Lena",
  "Noah",
  "Mia",
  "Luca",
  "Elin",
  "Jonas",
  "Sara",
  "Nico",
  "Alina",
  "Timo",
  "Nora",
  "Sven",
];

const NACHNAMEN = [
  "Meier",
  "Bucher",
  "Frei",
  "Steiner",
  "Brunner",
  "Widmer",
  "Kaufmann",
  "Suter",
  "Baumann",
  "Hofer",
  "Roth",
  "Gasser",
];

/**
 * Erzeugt n Teilnehmer. Deterministisch, damit ein erneuter Lauf dieselben
 * Personen ergibt und keine Dubletten entstehen.
 */
function teilnehmer(n: number, versatz = 0): DemoBuchung[] {
  return Array.from({ length: n }, (_, i) => {
    const index = i + versatz;
    const ort = ORTE[index % ORTE.length];
    return {
      anrede: index % 2 === 0 ? "Frau" : "Herr",
      vorname: VORNAMEN[index % VORNAMEN.length],
      nachname: NACHNAMEN[(index * 5) % NACHNAMEN.length],
      strasse: `Musterweg ${index + 1}`,
      plz: ort.plz,
      ort: ort.ort,
      geburtsjahr: 2007 - (index % 4),
      telefon: `079 ${100 + index} ${20 + index} ${30 + index}`,
      // Jede dritte Buchung ohne Ausweisnummer, damit der Admin-Hinweis
      // "Ausweisnummer fehlt" im Sprint 4 etwas zu zeigen hat.
      ...(index % 3 === 0 ? {} : { lfaNummer: `AG ${600000 + index}` }),
    };
  });
}

function demoEmail(buchung: DemoBuchung, kursId: string, index: number) {
  return `${buchung.vorname}.${buchung.nachname}.${index}.${kursId}${DEMO_MAILDOMAIN}`
    .toLowerCase()
    .replace(/[^a-z0-9.@-]/g, "");
}

/**
 * Naechstes Vorkommen eines Wochentags ab heute plus Vorlauf.
 * 0 = Sonntag, 2 = Dienstag.
 */
function naechsterWochentag(wochentag: number, vorlaufTage: number): Date {
  const basis = new Date();
  basis.setUTCHours(0, 0, 0, 0);
  basis.setUTCDate(basis.getUTCDate() + vorlaufTage);
  while (basis.getUTCDay() !== wochentag) {
    basis.setUTCDate(basis.getUTCDate() + 1);
  }
  return basis;
}

function tagePlus(datum: Date, tage: number): Date {
  const kopie = new Date(datum);
  kopie.setUTCDate(kopie.getUTCDate() + tage);
  return kopie;
}

type DemoKurs = {
  id: string;
  kursartCode: string;
  preis: string;
  materialpreis: string;
  onlineLimit: number;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "ARCHIVED";
  notiz: string;
  fruehbucherRabatt?: string;
  fruehbucherPlaetze?: number;
  /** Bloecke als [Wochentag, Tagesversatz, Start, Ende]. */
  bloecke: [number, number, string, string][];
  buchungen: DemoBuchung[];
};

function demoKurse(): DemoKurs[] {
  // VKU-Muster aus PLAN.md Abschnitt 6.2: Di und Mi, je zwei Bloecke.
  const vkuBloecke: [number, number, string, string][] = [
    [2, 0, "18:00", "20:00"],
    [2, 0, "20:00", "22:00"],
    [3, 1, "18:00", "20:00"],
    [3, 1, "20:00", "22:00"],
  ];

  return [
    {
      id: `${DEMO_PRAEFIX}vku-gruen`,
      kursartCode: "VKU",
      preis: "140.00",
      materialpreis: "30.00",
      onlineLimit: 12,
      status: "PUBLISHED",
      notiz: "Demo: Ampel grün, 7 Plätze frei",
      bloecke: vkuBloecke,
      buchungen: teilnehmer(5).map((b, i) => ({
        ...b,
        // Zwei telefonische Anmeldungen: zaehlen zur Kapazitaet, loesen aber
        // kein Bestaetigungsmail aus (Geschaeftsregel 4).
        quelle: i < 2 ? ("PHONE" as const) : ("ONLINE" as const),
        // Ein paar Buchungen mit zuweisendem Fahrlehrer fuer die Abrechnung.
        ...(i === 0 ? { vermitteltVon: "VaSh" } : {}),
        ...(i === 1 ? { vermitteltVon: "HaLu" } : {}),
      })),
    },
    {
      id: `${DEMO_PRAEFIX}vku-gelb`,
      kursartCode: "VKU",
      preis: "140.00",
      materialpreis: "30.00",
      onlineLimit: 12,
      status: "PUBLISHED",
      notiz: "Demo: Ampel gelb, 2 Plätze frei",
      bloecke: vkuBloecke,
      buchungen: teilnehmer(10, 20).map((b, i) => ({
        ...b,
        ...(i === 3 ? { vermitteltVon: "EgBe" } : {}),
      })),
    },
    {
      id: `${DEMO_PRAEFIX}vku-rot`,
      kursartCode: "VKU",
      preis: "140.00",
      materialpreis: "30.00",
      onlineLimit: 12,
      status: "PUBLISHED",
      notiz: "Demo: ausgebucht, Anmelden-Button muss verschwinden",
      bloecke: vkuBloecke,
      buchungen: [
        ...teilnehmer(12, 40),
        // Eine stornierte Buchung darf den Platz nicht belegen.
        { ...teilnehmer(1, 60)[0], status: "CANCELLED" as const },
        // Warteliste, Flow folgt in Sprint 7.
        { ...teilnehmer(1, 61)[0], status: "WAITLIST" as const },
      ],
    },
    {
      id: `${DEMO_PRAEFIX}vku-weekend-fruehbucher`,
      kursartCode: "VKU",
      // Weekend-VKU kostet mehr, deshalb steht der Preis pro Kurs.
      preis: "180.00",
      materialpreis: "30.00",
      onlineLimit: 12,
      status: "PUBLISHED",
      notiz: "Demo: Weekend-Variante, Frühbucherrabatte ausgeschöpft",
      fruehbucherRabatt: "20.00",
      fruehbucherPlaetze: 3,
      // Weekend-Muster: Fr zwei Bloecke, Sa zwei Bloecke.
      bloecke: [
        [5, 0, "18:00", "20:00"],
        [5, 0, "20:00", "22:00"],
        [6, 1, "08:30", "10:30"],
        [6, 1, "10:30", "12:30"],
      ],
      buchungen: teilnehmer(4, 70).map((b, i) => ({
        ...b,
        // Die ersten drei haben den Rabatt bekommen, damit ist er
        // ausgeschoepft (Geschaeftsregel 3).
        fruehbucher: i < 3,
      })),
    },
    {
      id: `${DEMO_PRAEFIX}btu`,
      kursartCode: "BTU",
      preis: "200.00",
      materialpreis: "0.00",
      onlineLimit: 12,
      status: "PUBLISHED",
      notiz: "Demo: BTU mit Bögle-Aktion",
      bloecke: [
        [2, 0, "19:00", "21:00"],
        [3, 1, "19:00", "21:00"],
      ],
      buchungen: teilnehmer(3, 80),
    },
    {
      id: `${DEMO_PRAEFIX}vku-entwurf`,
      kursartCode: "VKU",
      preis: "140.00",
      materialpreis: "30.00",
      onlineLimit: 12,
      status: "DRAFT",
      notiz: "Demo: Entwurf, darf öffentlich nicht erscheinen",
      bloecke: vkuBloecke,
      buchungen: [],
    },
    {
      id: `${DEMO_PRAEFIX}vku-abgesagt`,
      kursartCode: "VKU",
      preis: "140.00",
      materialpreis: "30.00",
      onlineLimit: 12,
      status: "CANCELLED",
      notiz: "Demo: abgesagt, darf öffentlich nicht erscheinen",
      bloecke: vkuBloecke,
      buchungen: teilnehmer(2, 90),
    },
  ];
}

async function schreiben(prisma: PrismaSeedClient) {
  const kursarten = await prisma.courseType.findMany({
    select: { id: true, code: true },
  });
  const kursartNachCode = new Map(kursarten.map((k) => [k.code, k.id]));

  if (kursartNachCode.size === 0) {
    throw new Error(
      "Keine Kursarten vorhanden. Zuerst pnpm db:seed ausfuehren.",
    );
  }

  const instruktoren = await prisma.instructor.findMany({
    select: { id: true, shortCode: true },
  });
  const instruktorNachKuerzel = new Map(
    instruktoren.map((i) => [i.shortCode, i.id]),
  );

  let kurseGeschrieben = 0;
  let buchungenGeschrieben = 0;

  for (const kurs of demoKurse()) {
    const kursartId = kursartNachCode.get(kurs.kursartCode);
    if (!kursartId) {
      throw new Error(`Kursart ${kurs.kursartCode} fehlt.`);
    }

    const werte = {
      courseTypeId: kursartId,
      price: kurs.preis,
      materialPrice: kurs.materialpreis,
      onlineLimit: kurs.onlineLimit,
      status: kurs.status,
      notes: kurs.notiz,
      earlyBirdDiscount: kurs.fruehbucherRabatt ?? null,
      earlyBirdSlots: kurs.fruehbucherPlaetze ?? null,
    };

    await prisma.course.upsert({
      where: { id: kurs.id },
      update: werte,
      create: { id: kurs.id, ...werte },
    });
    kurseGeschrieben += 1;

    // Termine und Buchungen jedes Mal neu aufbauen, damit ein erneuter Lauf
    // dieselben Zahlen ergibt und die Daten wieder in der Zukunft liegen.
    await prisma.courseSession.deleteMany({ where: { courseId: kurs.id } });
    await prisma.booking.deleteMany({ where: { courseId: kurs.id } });

    const start = naechsterWochentag(kurs.bloecke[0][0], 21);
    for (const [, versatz, von, bis] of kurs.bloecke) {
      await prisma.courseSession.create({
        data: {
          courseId: kurs.id,
          date: tagePlus(start, versatz),
          startTime: von,
          endTime: bis,
          // Kursleiter bleibt offen: "Noch nicht bestimmt". Die Zuweisung
          // macht die Admin im Einsatzplan (Geschaeftsregel 10).
          instructorId: null,
        },
      });
    }

    for (const [index, buchung] of kurs.buchungen.entries()) {
      const rabatt = buchung.fruehbucher
        ? Number(kurs.fruehbucherRabatt ?? "0")
        : 0;
      const gesamt =
        Number(kurs.preis) + Number(kurs.materialpreis) - rabatt;

      await prisma.booking.create({
        data: {
          courseId: kurs.id,
          salutation: buchung.anrede,
          firstName: buchung.vorname,
          lastName: buchung.nachname,
          street: buchung.strasse,
          zip: buchung.plz,
          city: buchung.ort,
          birthDate: new Date(Date.UTC(buchung.geburtsjahr, 4, 12)),
          phone: buchung.telefon,
          email: demoEmail(buchung, kurs.id, index),
          lfaNumber: buchung.lfaNummer ?? null,
          agbAcceptedAt: new Date(),
          source: buchung.quelle ?? "ONLINE",
          status: buchung.status ?? "CONFIRMED",
          priceCharged: gesamt.toFixed(2),
          earlyBird: buchung.fruehbucher ?? false,
          referredById: buchung.vermitteltVon
            ? (instruktorNachKuerzel.get(buchung.vermitteltVon) ?? null)
            : null,
        },
      });
      buchungenGeschrieben += 1;
    }
  }

  console.log(
    `Demodaten: ${kurseGeschrieben} Kurse, ${buchungenGeschrieben} Buchungen.`,
  );
  console.log("Entfernen mit: pnpm db:seed:demo:purge");
}

async function aufraeumen(prisma: PrismaSeedClient) {
  // Buchungen und Termine haengen per Cascade am Kurs, das Loeschen der Kurse
  // genuegt. Die Buchungen werden trotzdem zusaetzlich ueber die reservierte
  // Maildomain gesucht, falls jemand eine Demo-Buchung verschoben hat.
  const buchungen = await prisma.booking.deleteMany({
    where: { email: { endsWith: DEMO_MAILDOMAIN } },
  });
  const kurse = await prisma.course.deleteMany({
    where: { id: { startsWith: DEMO_PRAEFIX } },
  });

  console.log(
    `Demodaten entfernt: ${kurse.count} Kurse, ${buchungen.count} Buchungen.`,
  );
}

async function main() {
  const prisma = prismaOeffnen();
  try {
    if (process.argv.includes("--purge")) {
      await aufraeumen(prisma);
    } else {
      await schreiben(prisma);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((fehler) => {
  console.error(fehler);
  process.exit(1);
});
