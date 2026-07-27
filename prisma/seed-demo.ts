import "dotenv/config";
import { Decimal } from "../lib/decimal";
import { preisBerechnen } from "../lib/preis";
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
  status?: "CONFIRMED" | "CANCELLED";
  // Ob eine Buchung den Frühbucherrabatt bekommt, entscheidet nicht diese
  // Liste, sondern lib/preis.ts anhand der Reihenfolge. Genau wie im echten
  // Buchungsflow, sonst prueft der Demo-Seed etwas anderes als die Anwendung.
  /** Kuerzel des zuweisenden Fahrlehrers, Grundlage der Provision. */
  vermitteltVon?: string;
  /**
   * Provisionssatz, wie er beim Zuweisen festgehalten wurde. Ohne Angabe gilt
   * der aktuelle Satz des Fahrlehrers. Ein abweichender Wert bildet den Fall
   * ab, dass Ausilia den Satz spaeter geaendert hat: alte Buchungen behalten
   * ihren, und die Abrechnung zeigt dann zwei Rechenzeilen statt einer
   * Multiplikation, die nicht aufgeht.
   */
  provisionssatz?: string;
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
  fruehbucherProzent?: string;
  fruehbucherPlaetze?: number;
  /** Bloecke als [Wochentag, Tagesversatz, Start, Ende]. */
  bloecke: [number, number, string, string][];
  /**
   * Vorlauf in Tagen bis zum ersten Kurstag. Negative Werte liegen in der
   * Vergangenheit: solche Kurse erscheinen oeffentlich nicht mehr, fuellen
   * aber die Abrechnung. Ohne Angabe 21 Tage wie bisher.
   */
  vorlaufTage?: number;
  buchungen: DemoBuchung[];
  /**
   * Wartende auf einem ausgebuchten Kurs. Eigenes Modell, keine Buchungen:
   * ein Wartender hat weder Adresse noch Geburtsdatum noch einen Preis.
   * Genutzt werden nur Vorname, Nachname und Telefon aus der Liste.
   */
  warteliste?: DemoBuchung[];
};

/**
 * Vergangene Kurse mit zugewiesenen Buchungen, Grundlage der Abrechnung.
 *
 * Aufbau je Monat: ein VKU, dazu abwechselnd ein BTU oder ein zweiter VKU.
 * Die Zuweisungen laufen ueber sechs Kuerzel, damit im Bericht mehrere
 * Fahrlehrer mit verschiedenen Summen stehen. Ein Teil der Buchungen bleibt
 * ohne Zuweisung — auch das gehoert ins Bild, sonst sieht der Bericht
 * vollstaendiger aus, als eine echte Abrechnung je ist.
 */
function abrechnungsKurse(): DemoKurs[] {
  const vkuBloecke: [number, number, string, string][] = [
    [2, 0, "18:00", "20:00"],
    [2, 0, "20:00", "22:00"],
    [3, 1, "18:00", "20:00"],
    [3, 1, "20:00", "22:00"],
  ];
  const btuBloecke: [number, number, string, string][] = [
    [2, 0, "19:00", "21:00"],
    [3, 1, "19:00", "21:00"],
  ];

  /** Kuerzel im Wechsel, damit die Summen pro Person auseinanderliegen. */
  const zuweisung = (muster: (string | null)[]): { vermitteltVon?: string }[] =>
    muster.map((kuerzel) => (kuerzel ? { vermitteltVon: kuerzel } : {}));

  const monate: {
    monat: number;
    /** Tage zurueck bis zum ersten Kurstag. */
    vorlauf: number;
  }[] = [
    { monat: 1, vorlauf: -30 },
    { monat: 2, vorlauf: -60 },
    { monat: 3, vorlauf: -90 },
  ];

  const muster: (string | null)[][] = [
    ["VaSh", "VaSh", "HaLu", null, "EgBe", "VaSh", "HaLu", null],
    ["HaLu", "EgBe", "EgBe", "HaAu", null, "VaSh", "HaAu", "HaBr"],
    ["EgBe", "HaAu", "VaSh", "VaSh", "HaBr", null, "HaLu", "AnDu"],
  ];

  return monate.flatMap(({ monat, vorlauf }, i) => {
    const versatz = 200 + monat * 40;
    const zuweisungen = zuweisung(muster[i]);

    /**
     * Der aeltere Satz gilt fuer den jeweils zweiten Kurs des Monats. Damit
     * faellt in einem Monat beides zusammen: derselbe Fahrlehrer hat
     * Buchungen zu 50.00 und zu 40.00. Genau dafuer buendelt die Abrechnung
     * nach (Person, Satz) — sonst stuende dort eine Multiplikation, die nicht
     * aufgeht.
     */
    const alterSatz = monat >= 2 ? { provisionssatz: "40.00" } : {};

    const vku: DemoKurs = {
      id: `${DEMO_PRAEFIX}abr-${monat}-vku`,
      kursartCode: "VKU",
      preis: "140.00",
      materialpreis: "30.00",
      onlineLimit: 12,
      status: "PUBLISHED",
      notiz: `Demo: Abrechnung, VKU vor ${monat} Monat(en)`,
      vorlaufTage: vorlauf,
      bloecke: vkuBloecke,
      buchungen: teilnehmer(8, versatz).map((b, index) => ({
        ...b,
        ...zuweisungen[index],
        // Jede achte Anmeldung kam telefonisch herein.
        ...(index === 4 ? { quelle: "PHONE" as const } : {}),
        // Ein Storno pro Kurs: darf keine Provision ausloesen. Bewusst auf
        // einer zugewiesenen Buchung, sonst prueft der Ausschluss nichts.
        ...(index === 2 ? { status: "CANCELLED" as const } : {}),
      })),
    };

    const zweiter: DemoKurs =
      monat === 2
        ? {
            id: `${DEMO_PRAEFIX}abr-${monat}-btu`,
            kursartCode: "BTU",
            preis: "200.00",
            materialpreis: "0.00",
            onlineLimit: 12,
            status: "PUBLISHED",
            notiz: `Demo: Abrechnung, BTU vor ${monat} Monaten`,
            vorlaufTage: vorlauf + 7,
            bloecke: btuBloecke,
            buchungen: teilnehmer(5, versatz + 20).map((b, index) => ({
              ...b,
              ...zuweisungen[index],
              ...(zuweisungen[index].vermitteltVon ? alterSatz : {}),
            })),
          }
        : {
            id: `${DEMO_PRAEFIX}abr-${monat}-vku-weekend`,
            kursartCode: "VKU",
            preis: "180.00",
            materialpreis: "30.00",
            onlineLimit: 12,
            status: "PUBLISHED",
            notiz: `Demo: Abrechnung, Weekend-VKU vor ${monat} Monat(en)`,
            vorlaufTage: vorlauf + 7,
            fruehbucherProzent: "10.00",
            fruehbucherPlaetze: 5,
            bloecke: [
              [5, 0, "18:00", "20:00"],
              [5, 0, "20:00", "22:00"],
              [6, 1, "08:30", "10:30"],
              [6, 1, "10:30", "12:30"],
            ],
            buchungen: teilnehmer(6, versatz + 20).map((b, index) => ({
              ...b,
              ...zuweisungen[index],
              ...(zuweisungen[index].vermitteltVon ? alterSatz : {}),
            })),
          };

    return [vku, zweiter];
  });
}

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
      ],
      // Drei Wartende, damit die Reihenfolge im Panel sichtbar ist und ein
      // Storno etwas zu benachrichtigen hat.
      warteliste: teilnehmer(3, 61),
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
      // Geschäftsregel 3: 10 % auf den Gesamtbetrag, erste 5 Anmeldungen.
      fruehbucherProzent: "10.00",
      fruehbucherPlaetze: 5,
      // Weekend-Muster: Fr zwei Bloecke, Sa zwei Bloecke.
      bloecke: [
        [5, 0, "18:00", "20:00"],
        [5, 0, "20:00", "22:00"],
        [6, 1, "08:30", "10:30"],
        [6, 1, "10:30", "12:30"],
      ],
      // Sechs Anmeldungen: die ersten fuenf mit Rabatt, die sechste voll.
      // Damit zeigt der Kurs den Zustand "Frühbucherrabatte ausgeschöpft".
      buchungen: teilnehmer(6, 70),
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
    // ------------------------------------------------------------------
    // Vergangene Kurse fuer die Abrechnung.
    //
    // Abgerechnet wird nach dem Kursdatum (Kundenentscheid 27.07.2026), also
    // braucht ein Monatsbericht Kurse, die in diesem Monat stattgefunden
    // haben. Die Kurse oben liegen alle in denselben drei Wochen und ergaeben
    // fuer jeden anderen Monat eine leere Seite.
    //
    // Diese hier liegen einen, zwei und drei Monate zurueck. Sie erscheinen
    // oeffentlich nicht mehr — kommendeKurse verlangt einen Termin ab heute —
    // und beeinflussen deshalb weder die Ampel-Demos noch die Startseite.
    //
    // Verteilt auf sechs Fahrlehrer und drei Kursarten, damit der Bericht
    // unterschiedliche Summen zeigt und nicht eine Zeile pro Person. Stornos
    // stehen absichtlich dazwischen: sie duerfen keine Provision ausloesen,
    // und der Bericht weist sie als ausgeschlossen aus.
    ...abrechnungsKurse(),

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
    select: { id: true, shortCode: true, provisionPerBooking: true },
  });
  const instruktorNachKuerzel = new Map(
    instruktoren.map((i) => [i.shortCode, i.id]),
  );
  const satzNachKuerzel = new Map(
    instruktoren.map((i) => [i.shortCode, i.provisionPerBooking]),
  );

  let kurseGeschrieben = 0;
  let buchungenGeschrieben = 0;
  let wartendeGeschrieben = 0;

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
      earlyBirdPercent: kurs.fruehbucherProzent ?? null,
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
    await prisma.waitlistEntry.deleteMany({ where: { courseId: kurs.id } });

    const start = naechsterWochentag(
      kurs.bloecke[0][0],
      kurs.vorlaufTage ?? 21,
    );
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

    // Zaehlt die bereits bestaetigten Anmeldungen, damit der Frühbucherrabatt
    // genauso vergeben wird wie spaeter im echten Buchungsflow.
    let bestaetigte = 0;

    const preisDaten = {
      price: new Decimal(kurs.preis),
      materialPrice: new Decimal(kurs.materialpreis),
      earlyBirdPercent: kurs.fruehbucherProzent
        ? new Decimal(kurs.fruehbucherProzent)
        : null,
      earlyBirdSlots: kurs.fruehbucherPlaetze ?? null,
    };

    for (const [index, buchung] of kurs.buchungen.entries()) {
      const status = buchung.status ?? "CONFIRMED";
      const instruktorId = buchung.vermitteltVon
        ? (instruktorNachKuerzel.get(buchung.vermitteltVon) ?? null)
        : null;
      // Dieselbe Funktion, die Sprint 3 bei jeder echten Buchung aufruft.
      const preis = preisBerechnen(preisDaten, bestaetigte);
      if (status === "CONFIRMED") {
        bestaetigte += 1;
      }

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
          status,
          priceCharged: preis.total,
          earlyBird: preis.fruehbucher,
          referredById: instruktorId,
          // Der Satz gehoert auf die Buchung, nicht nur an den Fahrlehrer:
          // genau wie priceCharged den Preis festhaelt. Ohne ihn zaehlt die
          // Abrechnung die Zuweisung gar nicht — lib/abrechnung.ts verlangt
          // referredBy UND commissionRate, sonst bliebe der Bericht leer.
          commissionRate: instruktorId
            ? (buchung.provisionssatz ??
              satzNachKuerzel.get(buchung.vermitteltVon ?? "") ??
              null)
            : null,
        },
      });
      buchungenGeschrieben += 1;
    }

    for (const [index, person] of (kurs.warteliste ?? []).entries()) {
      await prisma.waitlistEntry.create({
        data: {
          courseId: kurs.id,
          firstName: person.vorname,
          lastName: person.nachname,
          phone: person.telefon,
          email: demoEmail(person, `${kurs.id}-warteliste`, index),
        },
      });
      wartendeGeschrieben += 1;
    }
  }

  const schueler = await schuelerSchreiben(prisma);

  console.log(
    `Demodaten: ${kurseGeschrieben} Kurse, ${buchungenGeschrieben} Buchungen, ` +
      `${wartendeGeschrieben} Wartende, ${schueler} Schüler.`,
  );
  console.log("Entfernen mit: pnpm db:seed:demo:purge");
}

/**
 * Schuelerkartei mit Abos und Lektionen (PLAN.md Abschnitt 14).
 *
 * Deckt die Zustaende ab, die im Panel unterschiedlich aussehen: ein Abo mit
 * Rest, ein aufgebrauchtes, eine Lektion ohne Abo, eine abgesagte, eine nicht
 * wahrgenommene. Dazu drei Pruefungsdaten — eines faellig fuer die
 * WAB-Erinnerung, eines knapp davor, und eines faellig ohne E-Mail-Adresse,
 * damit im Panel sichtbar wird, wen jemand anrufen muss.
 */
async function schuelerSchreiben(prisma: PrismaSeedClient): Promise<number> {
  // Bevorzugt Instruktoren mit Login: nur die koennen sich im Portal anmelden
  // und "Meine Schüler" ueberhaupt sehen. Ohne diese Vorauswahl landen die
  // Demo-Lektionen bei Kursleitern ohne Konto, und das Portal ist leer.
  const mitKonto = await prisma.instructor.findMany({
    where: { active: true, userId: { not: null } },
    orderBy: { shortCode: "asc" },
    take: 3,
  });
  const instruktoren =
    mitKonto.length > 0
      ? mitKonto
      : await prisma.instructor.findMany({
          where: { active: true },
          orderBy: { shortCode: "asc" },
          take: 3,
        });
  if (instruktoren.length === 0) return 0;

  /** Datum vor n Monaten, als reiner Kalendertag. */
  const monateZurueck = (monate: number): Date => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCMonth(d.getUTCMonth() - monate);
    return d;
  };

  type DemoLektion = [
    number,
    "GEPLANT" | "ABSOLVIERT" | "STORNIERT" | "NO_SHOW",
    boolean,
  ];

  const muster: {
    vorname: string;
    nachname: string;
    ohneMail?: boolean;
    pruefungVorMonaten?: number;
    abos: {
      kategorie: "AUTO" | "TAXI" | "MOTORRAD";
      groesse: number;
      preis: string;
      bezahlt: boolean;
    }[];
    /** [Tage ab heute, Status, auf das Abo buchen] */
    lektionen: DemoLektion[];
  }[] = [
    {
      vorname: "Selin",
      nachname: "Arslan",
      abos: [{ kategorie: "AUTO", groesse: 10, preis: "88.00", bezahlt: true }],
      lektionen: [
        [-21, "ABSOLVIERT", true],
        [-14, "ABSOLVIERT", true],
        [-7, "ABSOLVIERT", true],
        [-2, "NO_SHOW", true],
        [3, "GEPLANT", true],
        [10, "GEPLANT", true],
      ],
    },
    {
      vorname: "Marco",
      nachname: "Pfister",
      // Faellig fuer die WAB-Erinnerung: Pruefung liegt 11 Monate zurueck.
      pruefungVorMonaten: 11,
      abos: [{ kategorie: "AUTO", groesse: 5, preis: "90.00", bezahlt: true }],
      lektionen: [
        [-120, "ABSOLVIERT", true],
        [-110, "ABSOLVIERT", true],
        [-100, "ABSOLVIERT", true],
        [-95, "ABSOLVIERT", true],
        [-90, "ABSOLVIERT", true],
      ],
    },
    {
      vorname: "Aline",
      nachname: "Zbinden",
      // Noch nicht faellig, damit der Lauf nicht alles auf einmal abraeumt.
      pruefungVorMonaten: 4,
      abos: [{ kategorie: "AUTO", groesse: 5, preis: "90.00", bezahlt: false }],
      lektionen: [
        [-30, "ABSOLVIERT", true],
        [-25, "STORNIERT", true],
        [5, "GEPLANT", true],
      ],
    },
    {
      vorname: "Dario",
      nachname: "Blaser",
      // Faellig, aber ohne Adresse: die Erinnerung kann nicht rausgehen, und
      // genau das soll im Panel stehen.
      ohneMail: true,
      pruefungVorMonaten: 12,
      abos: [{ kategorie: "TAXI", groesse: 5, preis: "90.00", bezahlt: true }],
      lektionen: [
        [-200, "ABSOLVIERT", true],
        [-190, "ABSOLVIERT", true],
      ],
    },
    {
      vorname: "Nadia",
      nachname: "Kuster",
      // Nur die Gratis-Probelektion, noch kein Abo.
      abos: [],
      lektionen: [[2, "GEPLANT", false]],
    },
  ];

  let angelegt = 0;

  for (const [index, person] of muster.entries()) {
    const email = person.ohneMail
      ? null
      : `${person.vorname}.${person.nachname}${DEMO_MAILDOMAIN}`.toLowerCase();

    // Ueber die Maildomain wiederfindbar; wer keine hat, ueber den Namen.
    await prisma.studentRecord.deleteMany({
      where: email
        ? { email }
        : { firstName: person.vorname, lastName: person.nachname },
    });

    const schueler = await prisma.studentRecord.create({
      data: {
        firstName: person.vorname,
        lastName: person.nachname,
        phone: `079 ${300 + index} ${40 + index} ${50 + index}`,
        email,
        practicalExamPassedAt: person.pruefungVorMonaten
          ? monateZurueck(person.pruefungVorMonaten)
          : null,
        notes:
          index === 0
            ? "Fährt lieber am Vormittag, Abholung beim Bahnhof."
            : null,
      },
      select: { id: true },
    });
    angelegt += 1;

    const abos: { id: string; category: "AUTO" | "TAXI" | "MOTORRAD" }[] = [];
    for (const abo of person.abos) {
      const angelegtesAbo = await prisma.lessonPackage.create({
        data: {
          studentId: schueler.id,
          category: abo.kategorie,
          size: abo.groesse,
          pricePerLesson: abo.preis,
          paymentMethod: "BAR",
          paymentStatus: abo.bezahlt ? "BEZAHLT" : "OFFEN",
          paidAt: abo.bezahlt ? new Date() : null,
        },
        select: { id: true },
      });
      abos.push({ id: angelegtesAbo.id, category: abo.kategorie });
    }

    for (const [versatz, status, aufAbo] of person.lektionen) {
      const datum = new Date();
      datum.setUTCHours(0, 0, 0, 0);
      datum.setUTCDate(datum.getUTCDate() + versatz);
      const abo = aufAbo ? abos[0] : undefined;

      await prisma.lesson.create({
        data: {
          studentId: schueler.id,
          instructorId: instruktoren[index % instruktoren.length].id,
          category: abo?.category ?? "AUTO",
          date: datum,
          startTime: versatz % 2 === 0 ? "09:00" : "14:00",
          durationMin: 45,
          status,
          packageId: abo?.id ?? null,
          pickupNote: versatz === 3 ? "Bahnhof Baden, Ausgang Nord" : null,
        },
      });
    }
  }

  return angelegt;
}

async function aufraeumen(prisma: PrismaSeedClient) {
  // Buchungen und Termine haengen per Cascade am Kurs, das Loeschen der Kurse
  // genuegt. Die Buchungen werden trotzdem zusaetzlich ueber die reservierte
  // Maildomain gesucht, falls jemand eine Demo-Buchung verschoben hat.
  const buchungen = await prisma.booking.deleteMany({
    where: { email: { endsWith: DEMO_MAILDOMAIN } },
  });
  const wartende = await prisma.waitlistEntry.deleteMany({
    where: { email: { endsWith: DEMO_MAILDOMAIN } },
  });
  const kurse = await prisma.course.deleteMany({
    where: { id: { startsWith: DEMO_PRAEFIX } },
  });
  // Abos und Lektionen haengen per Cascade am Schueler.
  const schueler = await prisma.studentRecord.deleteMany({
    where: {
      OR: [
        { email: { endsWith: DEMO_MAILDOMAIN } },
        // Dario Blaser hat bewusst keine Adresse, deshalb ueber den Namen.
        { firstName: "Dario", lastName: "Blaser" },
      ],
    },
  });

  console.log(
    `Demodaten entfernt: ${kurse.count} Kurse, ${buchungen.count} Buchungen, ` +
      `${wartende.count} Wartende, ${schueler.count} Schüler.`,
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
