import "dotenv/config";
import { buchungStornieren } from "../lib/admin/buchungen";
import { kursAbsagen } from "../lib/admin/kurse";
import { buchungAnlegen } from "../lib/buchung";
import { verfuegbarkeitBerechnen } from "../lib/verfuegbarkeit";
import {
  EINLADUNG_STUNDEN,
  einladungLesen,
  naechstePersonEinladen,
  wartelisteEintragen,
} from "../lib/warteliste";
import { prismaOeffnen, type PrismaSeedClient } from "./seed-lib";

/**
 * Prueft die Warteliste gegen die echte Datenbank.
 *
 * Der Browser kann zeigen, dass ein Formular abschickt. Was er nicht kann,
 * steht hier: dass ein reservierter Platz fuer alle anderen wirklich weg ist,
 * dass die Frist ihn von selbst wieder freigibt, und dass zwei gleichzeitige
 * Anmeldungen auf denselben reservierten Platz nicht beide durchkommen.
 *
 * Aufruf: pnpm verify:warteliste
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

const PRAEFIX = "demo-pruefung-wl-";
const SCHWELLEN = { gruen: 4, gelb: 1 };

function person(nummer: number) {
  return {
    anrede: "Frau" as const,
    nachname: `Wartepruefung${nummer}`,
    vorname: "Testperson",
    strasse: "Haselstrasse 33",
    plz: "5400",
    ort: "Baden",
    geburtsdatum: "2008-03-12",
    telefon: "079 604 44 44",
    email: `wl.${nummer}.${Date.now()}@example.invalid`,
    agb: true as const,
    webseite: "",
  };
}

function wartender(nummer: number) {
  return {
    vorname: "Warte",
    nachname: `Person${nummer}`,
    telefon: `079 000 00 0${nummer}`,
    email: `warte.${nummer}.${Date.now()}@example.invalid`,
  };
}

/** Legt einen Wegwerf-Kurs an und raeumt ihn danach wieder ab. */
async function mitTestkurs<T>(
  prisma: PrismaSeedClient,
  id: string,
  onlineLimit: number,
  arbeit: (kursId: string) => Promise<T>,
): Promise<T> {
  const kursart = await prisma.courseType.findFirstOrThrow({
    where: { code: "VKU" },
  });
  const spaeter = new Date();
  spaeter.setDate(spaeter.getDate() + 14);

  await prisma.course.deleteMany({ where: { id } });
  await prisma.course.create({
    data: {
      id,
      courseTypeId: kursart.id,
      price: "140.00",
      materialPrice: "30.00",
      onlineLimit,
      status: "PUBLISHED",
      notes: "Automatische Pruefung, wird wieder geloescht",
      sessions: {
        create: [{ date: spaeter, startTime: "18:00", endTime: "20:00" }],
      },
    },
  });

  try {
    return await arbeit(id);
  } finally {
    await prisma.course.deleteMany({ where: { id } });
  }
}

/** Fuellt den Kurs bis zum Limit und gibt die Buchungs-IDs zurueck. */
async function auffuellen(kursId: string, anzahl: number): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < anzahl; i++) {
    const ergebnis = await buchungAnlegen(kursId, person(1000 + i), {
      quelle: "PHONE",
    });
    if (!ergebnis.erfolg) {
      throw new Error(`Auffuellen fehlgeschlagen: ${ergebnis.fehler}`);
    }
    ids.push(ergebnis.buchungId);
  }
  return ids;
}

// ---------------------------------------------------------------------------

async function eintragenPruefen(prisma: PrismaSeedClient) {
  console.log("Eintragen");

  await mitTestkurs(prisma, `${PRAEFIX}eintrag`, 1, async (kursId) => {
    const zuFrueh = await wartelisteEintragen(kursId, wartender(1));
    pruefe(
      !zuFrueh.erfolg && zuFrueh.fehler === "noch-plaetze-frei",
      "solange ein Platz frei ist, gibt es keine Warteliste",
      zuFrueh.erfolg ? "eingetragen" : zuFrueh.fehler,
    );

    await auffuellen(kursId, 1);

    const ersteAnmeldung = wartender(2);
    const erste = await wartelisteEintragen(kursId, ersteAnmeldung);
    pruefe(
      erste.erfolg && erste.position === 1,
      "auf dem vollen Kurs ist der erste Eintrag Position 1",
      erste.erfolg ? `Position ${erste.position}` : erste.fehler,
    );

    const nochmal = await wartelisteEintragen(kursId, ersteAnmeldung);
    pruefe(
      !nochmal.erfolg && nochmal.fehler === "schon-eingetragen",
      "dieselbe Adresse landet nicht zweimal in der Schlange",
      nochmal.erfolg ? "zweimal eingetragen" : nochmal.fehler,
    );

    const zweite = await wartelisteEintragen(kursId, wartender(3));
    pruefe(
      zweite.erfolg && zweite.position === 2,
      "die naechste Person ist Position 2",
      zweite.erfolg ? `Position ${zweite.position}` : zweite.fehler,
    );
  });
}

async function reservierungPruefen(prisma: PrismaSeedClient) {
  console.log("Reservierter Platz");

  await mitTestkurs(prisma, `${PRAEFIX}reserviert`, 1, async (kursId) => {
    const [buchungId] = await auffuellen(kursId, 1);
    await wartelisteEintragen(kursId, wartender(10));

    // Storno gibt den Platz frei und laedt in einem Zug die erste Person ein.
    await buchungStornieren(buchungId);

    const eintrag = await prisma.waitlistEntry.findFirstOrThrow({
      where: { courseId: kursId },
    });
    pruefe(
      eintrag.status === "EINGELADEN" && eintrag.token !== null,
      "nach dem Storno ist die erste Person eingeladen und hat einen Token",
      `${eintrag.status}, Token ${eintrag.token ? "vorhanden" : "fehlt"}`,
    );

    const fristStunden = eintrag.invitedUntil
      ? Math.round(
          (eintrag.invitedUntil.getTime() - Date.now()) / (60 * 60 * 1000),
        )
      : 0;
    pruefe(
      fristStunden === EINLADUNG_STUNDEN,
      `der Platz ist ${EINLADUNG_STUNDEN} Stunden reserviert`,
      `${fristStunden} Stunden`,
    );

    // Jetzt der eigentliche Punkt: der Platz ist fuer alle anderen weg.
    const fremd = await buchungAnlegen(kursId, person(11));
    pruefe(
      !fremd.erfolg && fremd.fehler === "ausgebucht",
      "ein Fremder kann den reservierten Platz nicht nehmen",
      fremd.erfolg ? "gebucht" : fremd.fehler,
    );

    const belegt = await prisma.booking.count({
      where: { courseId: kursId, status: "CONFIRMED" },
    });
    const ampel = verfuegbarkeitBerechnen(1, belegt, SCHWELLEN, 1);
    pruefe(
      ampel.zustand === "rot" && !ampel.buchbar,
      "die Ampel steht wegen der Reservierung auf rot",
      `${ampel.zustand}, frei ${ampel.frei}`,
    );

    // Mit Token geht es, und zwar genau einmal.
    const token = eintrag.token as string;
    const mitToken = await buchungAnlegen(kursId, person(12), {
      einladungsToken: token,
    });
    pruefe(
      mitToken.erfolg,
      "die eingeladene Person kann ihren Platz nehmen",
      mitToken.erfolg ? "" : mitToken.fehler,
    );

    const danach = await prisma.waitlistEntry.findFirstOrThrow({
      where: { courseId: kursId },
    });
    pruefe(
      danach.status === "GEBUCHT" && danach.bookingId !== null,
      "der Eintrag steht danach auf GEBUCHT und verweist auf die Buchung",
      `${danach.status}, bookingId ${danach.bookingId ?? "fehlt"}`,
    );

    const nochmal = await buchungAnlegen(kursId, person(13), {
      einladungsToken: token,
    });
    pruefe(
      !nochmal.erfolg && nochmal.fehler === "ausgebucht",
      "derselbe Token gilt kein zweites Mal",
      nochmal.erfolg ? "zweimal gebucht" : nochmal.fehler,
    );
  });
}

async function fristPruefen(prisma: PrismaSeedClient) {
  console.log("Ablauf der Frist");

  await mitTestkurs(prisma, `${PRAEFIX}frist`, 1, async (kursId) => {
    const [buchungId] = await auffuellen(kursId, 1);
    await wartelisteEintragen(kursId, wartender(20));
    await buchungStornieren(buchungId);

    const eintrag = await prisma.waitlistEntry.findFirstOrThrow({
      where: { courseId: kursId },
    });

    // Die Frist um eine Stunde in die Vergangenheit ziehen, statt zwei Tage zu
    // warten. Geprueft wird die Auswertung beim Lesen, und die haengt allein an
    // invitedUntil.
    await prisma.waitlistEntry.update({
      where: { id: eintrag.id },
      data: { invitedUntil: new Date(Date.now() - 60 * 60 * 1000) },
    });

    const abgelaufen = await einladungLesen(eintrag.token as string, kursId);
    pruefe(
      !abgelaufen.gueltig && abgelaufen.grund === "abgelaufen",
      "eine abgelaufene Einladung meldet sich als abgelaufen",
      abgelaufen.gueltig ? "gueltig" : abgelaufen.grund,
    );

    const wieder = await buchungAnlegen(kursId, person(21));
    pruefe(
      wieder.erfolg,
      "nach Ablauf der Frist ist der Platz wieder fuer alle frei",
      wieder.erfolg ? "" : wieder.fehler,
    );

    const mitAltemToken = await buchungAnlegen(kursId, person(22), {
      einladungsToken: eintrag.token as string,
    });
    pruefe(
      !mitAltemToken.erfolg,
      "ein abgelaufener Token oeffnet keinen Platz",
      mitAltemToken.erfolg ? "gebucht" : mitAltemToken.fehler,
    );
  });
}

async function wettlaufPruefen(prisma: PrismaSeedClient) {
  console.log("Gleichzeitige Anmeldungen auf den reservierten Platz");

  await mitTestkurs(prisma, `${PRAEFIX}wettlauf`, 1, async (kursId) => {
    const [buchungId] = await auffuellen(kursId, 1);
    await wartelisteEintragen(kursId, wartender(30));
    await buchungStornieren(buchungId);

    const eintrag = await prisma.waitlistEntry.findFirstOrThrow({
      where: { courseId: kursId },
    });
    const token = eintrag.token as string;

    // Achtmal derselbe Token gleichzeitig: der doppelt geklickte Knopf in der
    // Mail. Ohne die Zeilensperre kaeme jeder Aufruf auf denselben Zaehlstand.
    const gleichzeitig = 8;
    const ergebnisse = await Promise.all(
      Array.from({ length: gleichzeitig }, (_, i) =>
        buchungAnlegen(kursId, person(30 + i), { einladungsToken: token }),
      ),
    );

    const erfolgreich = ergebnisse.filter((e) => e.erfolg).length;
    const inDb = await prisma.booking.count({
      where: { courseId: kursId, status: "CONFIRMED" },
    });

    pruefe(
      erfolgreich === 1,
      `von ${gleichzeitig} gleichzeitigen Einloesungen gelingt genau eine`,
      `${erfolgreich} gelungen`,
    );
    pruefe(
      inDb === 1,
      "der Kurs hat danach genau eine bestaetigte Buchung",
      `${inDb}`,
    );
  });
}

async function tokenFremdkursPruefen(prisma: PrismaSeedClient) {
  console.log("Token gilt nur fuer seinen Kurs");

  await mitTestkurs(prisma, `${PRAEFIX}kurs-a`, 1, async (kursA) => {
    await mitTestkurs(prisma, `${PRAEFIX}kurs-b`, 1, async (kursB) => {
      const [buchungA] = await auffuellen(kursA, 1);
      await wartelisteEintragen(kursA, wartender(40));
      await buchungStornieren(buchungA);

      const eintrag = await prisma.waitlistEntry.findFirstOrThrow({
        where: { courseId: kursA },
      });

      await auffuellen(kursB, 1);
      const fremd = await buchungAnlegen(kursB, person(41), {
        einladungsToken: eintrag.token as string,
      });
      pruefe(
        !fremd.erfolg && fremd.fehler === "ausgebucht",
        "ein Token aus Kurs A oeffnet keinen Platz in Kurs B",
        fremd.erfolg ? "gebucht" : fremd.fehler,
      );

      const gelesen = await einladungLesen(eintrag.token as string, kursB);
      pruefe(
        !gelesen.gueltig && gelesen.grund === "unbekannt",
        "und wird fuer Kurs B gar nicht erst als Einladung erkannt",
        gelesen.gueltig ? "gueltig" : gelesen.grund,
      );
    });
  });
}

async function reihenfolgePruefen(prisma: PrismaSeedClient) {
  console.log("Reihenfolge und Anzahl der Einladungen");

  await mitTestkurs(prisma, `${PRAEFIX}reihenfolge`, 2, async (kursId) => {
    const ids = await auffuellen(kursId, 2);
    const erster = wartender(50);
    await wartelisteEintragen(kursId, erster);
    await wartelisteEintragen(kursId, wartender(51));
    await wartelisteEintragen(kursId, wartender(52));

    await buchungStornieren(ids[0]);

    const eingeladen = await prisma.waitlistEntry.findMany({
      where: { courseId: kursId, status: "EINGELADEN" },
    });
    pruefe(
      eingeladen.length === 1,
      "ein frei gewordener Platz laedt genau eine Person ein",
      `${eingeladen.length} eingeladen`,
    );
    pruefe(
      eingeladen[0]?.email === erster.email.toLowerCase(),
      "und zwar die aelteste in der Schlange",
      eingeladen[0]?.email ?? "niemand",
    );

    // Zweites Storno: der naechste Platz geht an die zweite Person.
    await buchungStornieren(ids[1]);
    const alle = await prisma.waitlistEntry.findMany({
      where: { courseId: kursId, status: "EINGELADEN" },
      orderBy: { createdAt: "asc" },
    });
    pruefe(
      alle.length === 2,
      "ein zweites Storno laedt die naechste Person ein",
      `${alle.length} eingeladen`,
    );
  });
}

async function kursabsagePruefen(prisma: PrismaSeedClient) {
  console.log("Absage des ganzen Kurses");

  await mitTestkurs(prisma, `${PRAEFIX}absage`, 1, async (kursId) => {
    await auffuellen(kursId, 1);
    await wartelisteEintragen(kursId, wartender(60));

    await kursAbsagen(kursId, "Automatische Pruefung");

    const eingeladen = await prisma.waitlistEntry.count({
      where: { courseId: kursId, status: "EINGELADEN" },
    });
    pruefe(
      eingeladen === 0,
      "eine Kursabsage laedt niemanden ein",
      `${eingeladen} eingeladen`,
    );

    const wartet = await prisma.waitlistEntry.count({
      where: { courseId: kursId, status: "WARTET" },
    });
    pruefe(
      wartet === 1,
      "die wartende Person bleibt als Wartende stehen",
      `${wartet}`,
    );
  });
}

async function mailStatusPruefen(prisma: PrismaSeedClient) {
  console.log("Sichtbarkeit des Mailversands");

  await mitTestkurs(prisma, `${PRAEFIX}mail`, 1, async (kursId) => {
    const [buchungId] = await auffuellen(kursId, 1);
    await wartelisteEintragen(kursId, wartender(70));
    await buchungStornieren(buchungId);

    const eintrag = await prisma.waitlistEntry.findFirstOrThrow({
      where: { courseId: kursId },
    });

    pruefe(
      eintrag.mailStatus !== null,
      "jede Einladung haelt fest, was beim Versand passiert ist",
      eintrag.mailStatus ?? "nichts festgehalten",
    );
    pruefe(
      !process.env.RESEND_API_KEY
        ? eintrag.mailStatus === "protokolliert"
        : eintrag.mailStatus === "gesendet",
      process.env.RESEND_API_KEY
        ? "mit Schluessel steht dort gesendet"
        : "ohne RESEND_API_KEY steht dort protokolliert, nicht gesendet",
      `${eintrag.mailStatus}${eintrag.mailGrund ? ` (${eintrag.mailGrund})` : ""}`,
    );
  });
}

async function einladungOhneWartendePruefen(prisma: PrismaSeedClient) {
  console.log("Einladen ohne Wartende");

  await mitTestkurs(prisma, `${PRAEFIX}leer`, 2, async (kursId) => {
    const ergebnis = await prisma.$transaction((tx) =>
      naechstePersonEinladen(tx, kursId),
    );
    pruefe(
      ergebnis === null,
      "ein Kurs ohne Warteliste laedt niemanden ein",
      ergebnis ? "jemand eingeladen" : "",
    );
  });
}

async function main() {
  const prisma = prismaOeffnen();

  try {
    await eintragenPruefen(prisma);
    await reservierungPruefen(prisma);
    await fristPruefen(prisma);
    await wettlaufPruefen(prisma);
    await tokenFremdkursPruefen(prisma);
    await reihenfolgePruefen(prisma);
    await kursabsagePruefen(prisma);
    await mailStatusPruefen(prisma);
    await einladungOhneWartendePruefen(prisma);

    const reste = await prisma.course.count({
      where: { id: { startsWith: PRAEFIX } },
    });
    console.log("Aufräumen");
    pruefe(reste === 0, "keine Prüfkurse zurückgeblieben", `${reste}`);
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
