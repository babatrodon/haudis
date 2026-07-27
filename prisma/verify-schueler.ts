import "dotenv/config";
import {
  abosMitStand,
  lektionPlanen,
  lektionStatusSetzen,
  schuelerDesInstruktors,
} from "../lib/schueler";
import {
  WAB_MONATE,
  erinnerungFaellig,
  stichtag,
  wabLaufAusfuehren,
} from "../lib/wab";
import { prismaOeffnen, type PrismaSeedClient } from "./seed-lib";

/**
 * Prueft Schuelerkartei, Abo-Stand und WAB-Erinnerung gegen die echte
 * Datenbank.
 *
 * Zwei Dinge stehen hier, die im Browser nie auffallen: dass zwei gleichzeitig
 * erfasste Lektionen nicht dieselbe letzte offene Lektion eines Abos belegen,
 * und dass ein Fahrlehrer keine fremde Lektion abhaken kann. Das Zweite ist
 * eine Rechtefrage, und Rechte prueft man nicht daran, ob ein Knopf sichtbar
 * ist.
 *
 * Aufruf: pnpm verify:schueler
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

const PRAEFIX = "Pruefung-Schueler-";

/** Legt Wegwerf-Schueler an und raeumt sie danach wieder ab. */
async function mitSchueler<T>(
  prisma: PrismaSeedClient,
  daten: { nachname: string; email?: string | null; pruefungAm?: Date | null },
  arbeit: (studentId: string) => Promise<T>,
): Promise<T> {
  const schueler = await prisma.studentRecord.create({
    data: {
      firstName: "Test",
      lastName: `${PRAEFIX}${daten.nachname}`,
      phone: "079 604 44 44",
      email: daten.email === undefined ? "pruefung@example.invalid" : daten.email,
      practicalExamPassedAt: daten.pruefungAm ?? null,
    },
    select: { id: true },
  });

  try {
    return await arbeit(schueler.id);
  } finally {
    await prisma.studentRecord.delete({ where: { id: schueler.id } });
  }
}

async function ersterInstruktor(prisma: PrismaSeedClient) {
  return prisma.instructor.findFirstOrThrow({
    where: { active: true },
    orderBy: { shortCode: "asc" },
  });
}

function tagVor(monate: number, tage = 0): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() - monate);
  d.setUTCDate(d.getUTCDate() - tage);
  return d;
}

// ---------------------------------------------------------------------------

async function aboStandPruefen(prisma: PrismaSeedClient) {
  console.log("Abo-Stand");
  const instruktor = await ersterInstruktor(prisma);

  await mitSchueler(prisma, { nachname: "Abo" }, async (studentId) => {
    const abo = await prisma.lessonPackage.create({
      data: {
        studentId,
        category: "AUTO",
        size: 5,
        pricePerLesson: "90.00",
      },
      select: { id: true },
    });

    const frisch = await abosMitStand(studentId);
    pruefe(
      frisch[0]?.offen === 5 && frisch[0]?.verbraucht === 0,
      "ein frisches 5er-Abo hat 5 offen und 0 verbraucht",
      `${frisch[0]?.offen} offen, ${frisch[0]?.verbraucht} verbraucht`,
    );

    const geplant = await lektionPlanen({
      studentId,
      instructorId: instruktor.id,
      kategorie: "AUTO",
      datum: "2026-08-10",
      startzeit: "09:00",
      dauerMinuten: 45,
      packageId: abo.id,
    });
    pruefe(geplant.erfolg, "Lektion auf dem Abo geplant");
    const lessonId = (geplant as { lessonId: string }).lessonId;

    const nochGeplant = await abosMitStand(studentId);
    pruefe(
      nochGeplant[0]?.verbraucht === 0,
      "eine geplante Lektion verbraucht noch nichts",
      `${nochGeplant[0]?.verbraucht} verbraucht`,
    );

    await lektionStatusSetzen(lessonId, "ABSOLVIERT");
    const abgehakt = await abosMitStand(studentId);
    pruefe(
      abgehakt[0]?.verbraucht === 1 && abgehakt[0]?.offen === 4,
      "abgehakt: 1 verbraucht, 4 offen",
      `${abgehakt[0]?.verbraucht} verbraucht, ${abgehakt[0]?.offen} offen`,
    );

    // Zweimal derselbe Status. Ein mitgefuehrter Zaehler wuerde hier auf 2
    // springen; die Zaehlung kann das nicht.
    await lektionStatusSetzen(lessonId, "ABSOLVIERT");
    const doppelt = await abosMitStand(studentId);
    pruefe(
      doppelt[0]?.verbraucht === 1,
      "zweimal abhaken zaehlt nicht doppelt",
      `${doppelt[0]?.verbraucht} verbraucht`,
    );

    await lektionStatusSetzen(lessonId, "GEPLANT");
    const zurueck = await abosMitStand(studentId);
    pruefe(
      zurueck[0]?.verbraucht === 0 && zurueck[0]?.offen === 5,
      "rueckgaengig gibt die Lektion ins Abo zurueck",
      `${zurueck[0]?.verbraucht} verbraucht, ${zurueck[0]?.offen} offen`,
    );

    // Storniert und No-Show verbrauchen nichts.
    await lektionStatusSetzen(lessonId, "STORNIERT");
    const storniert = await abosMitStand(studentId);
    pruefe(
      storniert[0]?.verbraucht === 0,
      "eine stornierte Lektion verbraucht nichts",
      `${storniert[0]?.verbraucht} verbraucht`,
    );
    await lektionStatusSetzen(lessonId, "NO_SHOW");
    const noShow = await abosMitStand(studentId);
    pruefe(
      noShow[0]?.verbraucht === 0,
      "eine nicht wahrgenommene Lektion verbraucht nichts",
      `${noShow[0]?.verbraucht} verbraucht`,
    );
  });
}

async function ohneAboPruefen(prisma: PrismaSeedClient) {
  console.log("Lektion ohne Abo");
  const instruktor = await ersterInstruktor(prisma);

  await mitSchueler(prisma, { nachname: "OhneAbo" }, async (studentId) => {
    const abo = await prisma.lessonPackage.create({
      data: { studentId, category: "AUTO", size: 5, pricePerLesson: "90.00" },
      select: { id: true },
    });

    const probe = await lektionPlanen({
      studentId,
      instructorId: instruktor.id,
      kategorie: "AUTO",
      datum: "2026-08-11",
      startzeit: "10:00",
      dauerMinuten: 45,
    });
    pruefe(probe.erfolg, "eine Lektion ohne Abo laesst sich planen");

    await lektionStatusSetzen((probe as { lessonId: string }).lessonId, "ABSOLVIERT");
    const stand = await abosMitStand(studentId);
    pruefe(
      stand[0]?.verbraucht === 0 && stand[0]?.offen === 5,
      "sie veraendert den Abo-Stand nicht",
      `${stand[0]?.verbraucht} verbraucht`,
    );
    void abo;
  });
}

async function aboErschoepftPruefen(prisma: PrismaSeedClient) {
  console.log("Abo erschoepft");
  const instruktor = await ersterInstruktor(prisma);

  await mitSchueler(prisma, { nachname: "Voll" }, async (studentId) => {
    const abo = await prisma.lessonPackage.create({
      data: { studentId, category: "AUTO", size: 1, pricePerLesson: "95.00" },
      select: { id: true },
    });

    const erste = await lektionPlanen({
      studentId,
      instructorId: instruktor.id,
      kategorie: "AUTO",
      datum: "2026-08-12",
      startzeit: "09:00",
      dauerMinuten: 45,
      packageId: abo.id,
    });
    pruefe(erste.erfolg, "die einzige Lektion des 1er-Abos ist planbar");

    const zweite = await lektionPlanen({
      studentId,
      instructorId: instruktor.id,
      kategorie: "AUTO",
      datum: "2026-08-13",
      startzeit: "09:00",
      dauerMinuten: 45,
      packageId: abo.id,
    });
    pruefe(
      !zweite.erfolg && zweite.fehler === "abo-erschoepft",
      "eine zweite Lektion auf dem 1er-Abo wird abgewiesen",
      zweite.erfolg ? "geplant" : zweite.fehler,
    );
  });
}

async function wettlaufPruefen(prisma: PrismaSeedClient) {
  console.log("Gleichzeitige Zuordnung auf die letzte Lektion");
  const instruktor = await ersterInstruktor(prisma);

  await mitSchueler(prisma, { nachname: "Wettlauf" }, async (studentId) => {
    const abo = await prisma.lessonPackage.create({
      data: { studentId, category: "AUTO", size: 1, pricePerLesson: "95.00" },
      select: { id: true },
    });

    const gleichzeitig = 8;
    const ergebnisse = await Promise.all(
      Array.from({ length: gleichzeitig }, (_, i) =>
        lektionPlanen({
          studentId,
          instructorId: instruktor.id,
          kategorie: "AUTO",
          datum: "2026-08-14",
          startzeit: `0${i}:00`.slice(-5),
          dauerMinuten: 45,
          packageId: abo.id,
        }),
      ),
    );

    const erfolgreich = ergebnisse.filter((e) => e.erfolg).length;
    const inDb = await prisma.lesson.count({ where: { packageId: abo.id } });

    pruefe(
      erfolgreich === 1,
      `von ${gleichzeitig} gleichzeitigen Zuordnungen gelingt genau eine`,
      `${erfolgreich} gelungen`,
    );
    pruefe(inDb === 1, "am Abo haengt danach genau eine Lektion", `${inDb}`);
  });
}

async function rechtePruefen(prisma: PrismaSeedClient) {
  console.log("Rechte im Portal");
  const instruktoren = await prisma.instructor.findMany({
    where: { active: true },
    orderBy: { shortCode: "asc" },
    take: 2,
  });
  const [meiner, fremder] = instruktoren;

  await mitSchueler(prisma, { nachname: "Rechte" }, async (studentId) => {
    const geplant = await lektionPlanen({
      studentId,
      instructorId: meiner.id,
      kategorie: "AUTO",
      datum: "2026-08-15",
      startzeit: "09:00",
      dauerMinuten: 45,
    });
    const lessonId = (geplant as { lessonId: string }).lessonId;

    const fremdVersuch = await lektionStatusSetzen(
      lessonId,
      "ABSOLVIERT",
      fremder.id,
    );
    pruefe(
      !fremdVersuch.erfolg && fremdVersuch.fehler === "nicht-zugewiesen",
      "ein fremder Fahrlehrer kann die Lektion nicht abhaken",
      fremdVersuch.erfolg ? "abgehakt" : fremdVersuch.fehler,
    );

    const eigenerVersuch = await lektionStatusSetzen(
      lessonId,
      "ABSOLVIERT",
      meiner.id,
    );
    pruefe(
      eigenerVersuch.erfolg,
      "der zugewiesene Fahrlehrer kann sie abhaken",
      eigenerVersuch.erfolg ? "" : eigenerVersuch.fehler,
    );

    const meineSchueler = await schuelerDesInstruktors(meiner.id);
    pruefe(
      meineSchueler.some((s) => s.id === studentId),
      "der Schueler erscheint bei seinem Fahrlehrer",
    );
    const fremdeSchueler = await schuelerDesInstruktors(fremder.id);
    pruefe(
      !fremdeSchueler.some((s) => s.id === studentId),
      "und nicht bei einem anderen",
    );
  });
}

async function wabRegelPruefen() {
  console.log("WAB-Regel");

  pruefe(
    !erinnerungFaellig({
      practicalExamPassedAt: null,
      wabReminderSentAt: null,
      email: "a@example.invalid",
    }).faellig,
    "ohne Pruefungsdatum ist niemand faellig",
  );

  pruefe(
    !erinnerungFaellig({
      practicalExamPassedAt: tagVor(WAB_MONATE - 1),
      wabReminderSentAt: null,
      email: "a@example.invalid",
    }).faellig,
    `${WAB_MONATE - 1} Monate nach der Pruefung noch nicht faellig`,
  );

  pruefe(
    erinnerungFaellig({
      practicalExamPassedAt: tagVor(WAB_MONATE, 1),
      wabReminderSentAt: null,
      email: "a@example.invalid",
    }).faellig,
    `${WAB_MONATE} Monate nach der Pruefung faellig`,
  );

  pruefe(
    erinnerungFaellig({
      practicalExamPassedAt: tagVor(14),
      wabReminderSentAt: null,
      email: "a@example.invalid",
    }).faellig,
    "auch nach ueberschrittener Frist noch faellig",
  );

  pruefe(
    !erinnerungFaellig({
      practicalExamPassedAt: tagVor(WAB_MONATE, 1),
      wabReminderSentAt: new Date(),
      email: "a@example.invalid",
    }).faellig,
    "wer schon erinnert wurde, wird nicht noch einmal angeschrieben",
  );

  pruefe(
    !erinnerungFaellig({
      practicalExamPassedAt: tagVor(WAB_MONATE, 1),
      wabReminderSentAt: null,
      email: null,
    }).faellig,
    "ohne E-Mail-Adresse geht keine Erinnerung raus",
  );

  const grenze = stichtag(new Date(Date.UTC(2026, 2, 31)));
  pruefe(
    grenze.toISOString().slice(0, 10) === "2025-04-30",
    "der Stichtag rechnet Monatsenden sauber (31.03.2026 -> 30.04.2025)",
    grenze.toISOString().slice(0, 10),
  );
}

async function wabLaufPruefen(prisma: PrismaSeedClient) {
  console.log("WAB-Lauf");

  await mitSchueler(
    prisma,
    { nachname: "Wab", pruefungAm: tagVor(WAB_MONATE, 5) },
    async (studentId) => {
      const ersterLauf = await wabLaufAusfuehren();
      pruefe(
        ersterLauf.benachrichtigt >= 1,
        "der Lauf erfasst die faellige Person",
        `${ersterLauf.benachrichtigt} benachrichtigt`,
      );

      const nachher = await prisma.studentRecord.findUniqueOrThrow({
        where: { id: studentId },
      });
      pruefe(
        nachher.wabReminderSentAt !== null,
        "der Zeitstempel verhindert den Doppelversand",
        `${nachher.wabReminderSentAt}`,
      );
      pruefe(
        !process.env.RESEND_API_KEY
          ? nachher.wabMailStatus === "protokolliert"
          : nachher.wabMailStatus === "gesendet",
        process.env.RESEND_API_KEY
          ? "mit Schluessel steht dort gesendet"
          : "ohne RESEND_API_KEY steht dort protokolliert, nicht gesendet",
        `${nachher.wabMailStatus}`,
      );

      const zweiterLauf = await wabLaufAusfuehren();
      const nochmal = await prisma.studentRecord.findUniqueOrThrow({
        where: { id: studentId },
      });
      pruefe(
        nochmal.wabReminderSentAt?.getTime() ===
          nachher.wabReminderSentAt?.getTime(),
        "ein zweiter Lauf schreibt dieselbe Person nicht noch einmal an",
        `${zweiterLauf.benachrichtigt} im zweiten Lauf`,
      );
    },
  );

  // Ohne Adresse: faellig, aber nicht als benachrichtigt gefuehrt. Sonst
  // stuende im Panel ein Haken neben jemandem, den niemand erreicht hat.
  await mitSchueler(
    prisma,
    { nachname: "WabOhneMail", email: null, pruefungAm: tagVor(WAB_MONATE, 5) },
    async (studentId) => {
      const lauf = await wabLaufAusfuehren();
      const nachher = await prisma.studentRecord.findUniqueOrThrow({
        where: { id: studentId },
      });
      pruefe(
        nachher.wabReminderSentAt === null,
        "ohne Adresse wird niemand als benachrichtigt gefuehrt",
        `${nachher.wabReminderSentAt}`,
      );
      pruefe(
        lauf.ohneAdresse >= 1,
        "der Lauf meldet, wie viele ohne Adresse faellig sind",
        `${lauf.ohneAdresse}`,
      );
    },
  );
}

async function main() {
  const prisma = prismaOeffnen();

  try {
    await aboStandPruefen(prisma);
    await ohneAboPruefen(prisma);
    await aboErschoepftPruefen(prisma);
    await wettlaufPruefen(prisma);
    await rechtePruefen(prisma);
    await wabRegelPruefen();
    await wabLaufPruefen(prisma);

    const reste = await prisma.studentRecord.count({
      where: { lastName: { startsWith: PRAEFIX } },
    });
    console.log("Aufräumen");
    pruefe(reste === 0, "keine Prüf-Schüler zurückgeblieben", `${reste}`);
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
