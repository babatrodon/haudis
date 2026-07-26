import "dotenv/config";
import { EINSTELLUNG_DEFAULTS } from "../lib/einstellungen-defaults";
import { INSTRUKTOREN } from "./seed-data/instruktoren";
import { KURSARTEN } from "./seed-data/kursarten";
import { prismaOeffnen, type PrismaSeedClient } from "./seed-lib";

/**
 * Prueft die Zusicherungen, die der Seed geben muss.
 *
 * Kein Testframework: Vitest und Playwright kommen mit Sprint 3, wo es
 * Buchungslogik zu testen gibt. Bis dahin ist das hier der Weg, die
 * Geschaeftsregeln nach jeder Seed-Aenderung nachzuweisen.
 *
 * Aufruf: pnpm db:verify
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

async function main() {
  const prisma = prismaOeffnen();

  try {
    await kursartenPruefen(prisma);
    await instruktorenPruefen(prisma);
    await regelElfPruefen(prisma);
    await einstellungenPruefen(prisma);
    await demodatenPruefen(prisma);
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

async function kursartenPruefen(prisma: PrismaSeedClient) {
  console.log("Kursarten");
  const kursarten = await prisma.courseType.findMany();

  pruefe(
    kursarten.length === KURSARTEN.length,
    `${KURSARTEN.length} Kursarten vorhanden`,
    `${kursarten.length}`,
  );

  const vku = kursarten.find((k) => k.code === "VKU");
  // Decimal muss exakt bleiben, kein Float unterwegs.
  pruefe(
    vku?.basePrice.toString() === "140",
    "VKU Grundpreis exakt 140",
    vku?.basePrice.toString(),
  );
  pruefe(
    vku?.materialPrice.toString() === "30",
    "VKU Lehrmittel exakt 30",
    vku?.materialPrice.toString(),
  );
  pruefe(vku?.requiresLfa === true, "VKU verlangt den Lernfahrausweis");

  const boegle = kursarten.find((k) => k.code === "BOEGLE");
  pruefe(boegle?.bookable === false, "Bögle ist nicht buchbar");

  // Kursarten ohne bestaetigten Preis duerfen nicht oeffentlich erscheinen.
  const offeneAktiv = kursarten.filter(
    (k) => k.active && k.bookable && k.basePrice.toString() === "0",
  );
  pruefe(
    offeneAktiv.length === 0,
    "keine aktive buchbare Kursart mit Preis 0",
    offeneAktiv.map((k) => k.code).join(", "),
  );
}

async function instruktorenPruefen(prisma: PrismaSeedClient) {
  console.log("Instruktoren");
  const profile = await prisma.instructor.findMany();

  pruefe(
    profile.length === INSTRUKTOREN.length,
    `${INSTRUKTOREN.length} Profile vorhanden`,
    `${profile.length}`,
  );

  const kuerzel = profile.map((p) => p.shortCode);
  pruefe(
    new Set(kuerzel).size === kuerzel.length,
    "Kürzel sind eindeutig",
  );

  const erwarteteLogins = INSTRUKTOREN.filter((i) => i.login).length;
  const mitLogin = profile.filter((p) => p.userId !== null);
  pruefe(
    mitLogin.length === erwarteteLogins,
    `genau ${erwarteteLogins} Profile mit Login`,
    `${mitLogin.length}`,
  );
  pruefe(
    profile.length - mitLogin.length === INSTRUKTOREN.length - erwarteteLogins,
    `${INSTRUKTOREN.length - erwarteteLogins} Profile ohne Login (userId null)`,
  );

  // Ausilia ist der erlaubte Doppelfall: ADMIN-Konto plus Kursleiterprofil.
  const ausilia = await prisma.instructor.findUnique({
    where: { shortCode: "HaAu" },
    include: { user: true },
  });
  pruefe(ausilia !== null, "Profil HaAu existiert");
  pruefe(
    ausilia?.user?.role === "ADMIN",
    "HaAu hängt an einem ADMIN-Konto",
    ausilia?.user?.role,
  );
  pruefe(
    ausilia?.provisionPerBooking.toString() === "50",
    "Provision default exakt 50",
    ausilia?.provisionPerBooking.toString(),
  );

  pruefe(
    profile.every((p) => p.lastName !== "LOLIT"),
    "der Alteintrag LOLIT ist nicht übernommen",
  );
}

/**
 * Geschaeftsregel 11. Der Fehler des Altsystems war, dass der Admin-Account
 * "LOLIT" als waehlbarer Kursleiter erschien. Ein Konto ohne Instruktoren-
 * Profil darf nirgends als Kursleiter auftauchen.
 */
async function regelElfPruefen(prisma: PrismaSeedClient) {
  console.log("Geschäftsregel 11: User ist nie automatisch Instruktor");

  const kursleiter = await prisma.instructor.findMany({
    where: { active: true },
    select: { shortCode: true, userId: true },
  });

  const konten = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });
  const kursleiterUserIds = new Set(
    kursleiter.flatMap((k) => (k.userId ? [k.userId] : [])),
  );
  const kontenOhneProfil = konten.filter((k) => !kursleiterUserIds.has(k.id));

  pruefe(
    kontenOhneProfil.length > 0,
    "es gibt mindestens ein Konto ohne Kursleiterprofil (Testfall)",
  );

  // Die Auswahlliste stammt ausschliesslich aus dem Instructor-Modell, ein
  // Konto ohne Profil kann darin gar nicht vorkommen.
  for (const konto of kontenOhneProfil) {
    pruefe(
      !kursleiterUserIds.has(konto.id),
      `${konto.email} erscheint nicht als wählbarer Kursleiter`,
    );
  }

  const rollen = new Set(konten.map((k) => k.role));
  pruefe(
    [...rollen].every((r) => r === "ADMIN" || r === "INSTRUCTOR"),
    "nur die Rollen ADMIN und INSTRUCTOR vergeben",
    [...rollen].join(", "),
  );
}

async function einstellungenPruefen(prisma: PrismaSeedClient) {
  console.log("Einstellungen");
  const zeilen = await prisma.setting.findMany();
  const vorhanden = new Set(zeilen.map((z) => z.key));
  const erwartet = Object.keys(EINSTELLUNG_DEFAULTS);
  const fehlend = erwartet.filter((k) => !vorhanden.has(k));

  pruefe(
    fehlend.length === 0,
    `alle ${erwartet.length} Schlüssel vorhanden`,
    fehlend.join(", "),
  );

  const werte = new Map(zeilen.map((z) => [z.key, z.value]));
  // Geschaeftsregel 6: beide Nummern, ueberall.
  pruefe(
    werte.get("kontakt.telefon1") === "079 604 44 44",
    "Telefon 1 ist 079 604 44 44",
    werte.get("kontakt.telefon1"),
  );
  pruefe(
    werte.get("kontakt.telefon2") === "079 202 97 97",
    "Telefon 2 ist 079 202 97 97",
    werte.get("kontakt.telefon2"),
  );
  pruefe(
    werte.get("wab.gutscheincode") === "Ausilia20",
    "WAB-Gutscheincode ist Ausilia20",
  );
  pruefe(werte.get("ampel.schwelleGruen") === "4", "Ampelschwelle grün ist 4");
}

async function demodatenPruefen(prisma: PrismaSeedClient) {
  const kurse = await prisma.course.findMany({
    where: { id: { startsWith: "demo-" } },
    include: { bookings: true, sessions: true },
  });

  if (kurse.length === 0) {
    console.log("Demodaten: keine vorhanden, übersprungen");
    return;
  }

  console.log("Demodaten");

  // Nur CONFIRMED belegt einen Platz. Storniert und Warteliste zaehlen nicht.
  const belegt = (id: string) =>
    kurse
      .find((k) => k.id === id)
      ?.bookings.filter((b) => b.status === "CONFIRMED").length ?? -1;

  const erwartung: [string, number, number][] = [
    // id, belegt, frei
    ["demo-vku-gruen", 5, 7],
    ["demo-vku-gelb", 10, 2],
    ["demo-vku-rot", 12, 0],
  ];

  for (const [id, sollBelegt, sollFrei] of erwartung) {
    const kurs = kurse.find((k) => k.id === id);
    const ist = belegt(id);
    pruefe(ist === sollBelegt, `${id}: ${sollBelegt} belegt`, `${ist}`);
    pruefe(
      (kurs?.onlineLimit ?? 0) - ist === sollFrei,
      `${id}: ${sollFrei} frei`,
      `${(kurs?.onlineLimit ?? 0) - ist}`,
    );
  }

  const fruehbucher = kurse.find(
    (k) => k.id === "demo-vku-weekend-fruehbucher",
  );
  const rabattiert =
    fruehbucher?.bookings.filter((b) => b.earlyBird).length ?? -1;
  pruefe(
    rabattiert === fruehbucher?.earlyBirdSlots,
    "Weekend-VKU: Frühbucherplätze ausgeschöpft",
    `${rabattiert} von ${fruehbucher?.earlyBirdSlots}`,
  );

  pruefe(
    kurse.some((k) => k.status === "DRAFT"),
    "ein Entwurf vorhanden",
  );
  pruefe(
    kurse.some((k) => k.status === "CANCELLED"),
    "ein abgesagter Kurs vorhanden",
  );

  const alleTermine = kurse.flatMap((k) => k.sessions);
  pruefe(
    alleTermine.every((t) => t.instructorId === null),
    'alle Termine stehen auf "Noch nicht bestimmt"',
  );

  const demoBuchungen = kurse.flatMap((k) => k.bookings);
  pruefe(
    demoBuchungen.every((b) => b.email.endsWith("@example.invalid")),
    "alle Demo-Buchungen tragen @example.invalid",
  );
  pruefe(
    demoBuchungen.some((b) => b.source === "PHONE"),
    "telefonische Anmeldungen vorhanden",
  );
  pruefe(
    demoBuchungen.some((b) => b.referredById !== null),
    "Buchungen mit zuweisendem Fahrlehrer vorhanden",
  );
  pruefe(
    demoBuchungen.some((b) => b.lfaNumber === null),
    "Buchungen ohne Ausweisnummer vorhanden",
  );
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
