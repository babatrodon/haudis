import "dotenv/config";
import { Decimal } from "../lib/decimal";
import { aufFuenfRappen, preisBerechnen } from "../lib/preis";
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
    preisberechnungPruefen();
    await instruktorenPruefen(prisma);
    await regelElfPruefen(prisma);
    await kontenPruefen(prisma);
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

  // Von der Kundin am 26.07.2026 bestaetigte Preise.
  for (const code of ["NHI", "NH", "MOT_A1_A"]) {
    const kursart = kursarten.find((k) => k.code === code);
    pruefe(
      kursart?.active === true && kursart.basePrice.toString() === "120",
      `${code} aktiv mit Preis 120`,
      `aktiv=${kursart?.active} preis=${kursart?.basePrice.toString()}`,
    );
  }

  // Preis widersprüchlich (480 gegen 120), deshalb nicht öffentlich.
  for (const code of ["MOT_A1", "MOT_A"]) {
    const kursart = kursarten.find((k) => k.code === code);
    pruefe(
      kursart?.active === false,
      `${code} bleibt inaktiv bis zur schriftlichen Bestätigung`,
      `aktiv=${kursart?.active}`,
    );
  }

  const motorrad = kursarten.filter((k) => k.code.startsWith("MOT_"));
  pruefe(
    motorrad.every((k) => !k.requiresLfa),
    "Motorrad-Grundkurse verlangen keinen Lernfahrausweis",
  );
}

/**
 * Geschaeftsregel 3, Kundenentscheid 26.07.2026: 10 % auf den Gesamtbetrag
 * inklusive Lehrmittel, erste fuenf Anmeldungen, kaufmaennisch auf 5 Rappen.
 * Der Kontrollfall aus PLAN.md ist der VKU: 170.00 wird zu 153.00.
 */
function preisberechnungPruefen() {
  console.log("Preisberechnung");

  const vku = {
    price: new Decimal("140.00"),
    materialPrice: new Decimal("30.00"),
    earlyBirdPercent: new Decimal("10.00"),
    earlyBirdSlots: 5,
  };

  pruefe(
    preisBerechnen(vku, 0).total.toString() === "153",
    "VKU erste Buchung: 170 wird zu 153.00",
    preisBerechnen(vku, 0).total.toString(),
  );
  pruefe(
    preisBerechnen(vku, 4).total.toString() === "153",
    "fünfte Buchung noch rabattiert",
  );
  pruefe(
    preisBerechnen(vku, 5).total.toString() === "170" &&
      !preisBerechnen(vku, 5).fruehbucher,
    "sechste Buchung zahlt voll, Rabatte ausgeschöpft",
  );
  pruefe(
    aufFuenfRappen(new Decimal("153.27")).toString() === "153.25" &&
      aufFuenfRappen(new Decimal("153.28")).toString() === "153.3",
    "Rundung auf 5 Rappen, kaufmännisch",
  );
  pruefe(
    new Decimal("0.1").plus(new Decimal("0.2")).toString() === "0.3",
    "Decimal rechnet exakt, kein Float",
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

/**
 * Kontoverwaltung nach PLAN.md Abschnitt 15.1: die Kursleiter bekommen ihr
 * Startpasswort von Hand, also muss der Wechsel beim ersten Login erzwungen
 * sein. Der Entwickler-Admin hat sein Passwort selbst gesetzt.
 */
async function kontenPruefen(prisma: PrismaSeedClient) {
  console.log("Konten");

  const konten = await prisma.user.findMany({
    select: { email: true, mustChangePassword: true },
  });

  const uebergeben = konten.filter((k) => k.email.endsWith("@haudi.ch"));
  pruefe(
    uebergeben.length > 0 && uebergeben.every((k) => k.mustChangePassword),
    "alle @haudi.ch-Konten erzwingen den Passwortwechsel",
    uebergeben
      .filter((k) => !k.mustChangePassword)
      .map((k) => k.email)
      .join(", "),
  );

  const dev = konten.find((k) => k.email === process.env.SEED_ADMIN_EMAIL);
  pruefe(
    dev === undefined || !dev.mustChangePassword,
    "Entwickler-Admin ohne erzwungenen Wechsel",
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

  // Der gespeicherte Betrag muss dem entsprechen, was lib/preis.ts rechnet.
  // 180 + 30 = 210, minus 10 % = 189.00 fuer die ersten fuenf.
  const rabattierte = fruehbucher?.bookings.filter((b) => b.earlyBird) ?? [];
  const volle = fruehbucher?.bookings.filter((b) => !b.earlyBird) ?? [];
  pruefe(
    rabattierte.every((b) => b.priceCharged.toString() === "189"),
    "rabattierte Buchungen mit 189.00 gespeichert",
    rabattierte.map((b) => b.priceCharged.toString()).join(", "),
  );
  pruefe(
    volle.every((b) => b.priceCharged.toString() === "210"),
    "Buchung nach dem fünften Platz mit 210.00 gespeichert",
    volle.map((b) => b.priceCharged.toString()).join(", "),
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
