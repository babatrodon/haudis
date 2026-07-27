import "server-only";
import { prisma } from "@/lib/db";
import { Decimal } from "@/lib/decimal";
import { preisBerechnen } from "@/lib/preis";
import type { BuchungEingabe } from "@/lib/buchung-schema";

/**
 * Anlegen einer Kursbuchung.
 *
 * Der ganze Sinn dieser Datei ist, dass ein Kurs nie ueberbucht wird. Zaehlen
 * und danach einfuegen genuegt dafuer nicht: melden sich zwei Personen
 * gleichzeitig an, zaehlen beide elf von zwoelf, beide fuegen ein, und der Kurs
 * hat dreizehn Teilnehmende. Am Kurstag steht dann jemand ohne Platz da.
 *
 * Deshalb sperrt die Transaktion zuerst die Kurszeile mit FOR UPDATE. Ab da
 * wartet jede weitere Anmeldung desselben Kurses, bis diese hier fertig ist.
 * Erst danach wird gezaehlt, geprueft und geschrieben.
 *
 * FOR UPDATE statt isolationLevel Serializable: letzteres bricht bei Konflikt
 * mit einem Fehler ab und braucht einen Wiederholungslauf. Die Zeilensperre
 * loest dasselbe Problem ohne diese Mechanik.
 */

/** Geschaeftsregel 8: gleiche E-Mail, gleicher Kurs, innerhalb dieser Spanne. */
const DOPPELBUCHUNG_MINUTEN = 10;

/**
 * Traegt die Buchungs-ID zwischen Schritt 1, Schritt 2 und der Bestaetigung.
 *
 * Steht hier und nicht in der Action-Datei: eine Datei mit "use server" darf
 * ausser asynchronen Funktionen nichts exportieren.
 */
export const BUCHUNG_COOKIE = "haudi_buchung";

export type BuchungFehler =
  | "kurs-nicht-buchbar"
  | "ausgebucht"
  | "doppelbuchung";

export type BuchungErgebnis =
  | { erfolg: true; buchungId: string; total: Decimal; fruehbucher: boolean }
  | { erfolg: false; fehler: BuchungFehler };

/**
 * Zusaetze fuer die telefonische Anmeldung im Panel.
 *
 * Sie laeuft absichtlich durch dieselbe Funktion wie die Onlineanmeldung. Ein
 * zweiter Weg in die Buchungstabelle waere ein zweiter Weg ohne Zeilensperre,
 * und das Ueberbuchen kaeme durch die Hintertuer zurueck.
 */
export type BuchungOptionen = {
  /**
   * Default ONLINE. PHONE loest kein Bestaetigungsmail aus (Regel 4),
   * INSTRUCTOR schon: dort meldet ein Kursleiter im Portal an.
   */
  quelle?: "ONLINE" | "PHONE" | "INSTRUCTOR";
  /** Zuweisender Fahrlehrer, Grundlage der Provision (Regel 5). */
  referredById?: string | null;
  /** Wird am Telefon oft gleich mitdiktiert. */
  lfaNummer?: string;
};

/**
 * Eingabe einer Buchung.
 *
 * Wie das Onlineformular, aber mit optionaler E-Mail-Adresse: das Formular
 * verlangt sie, die telefonische Anmeldung nicht (siehe Booking.email im
 * Schema).
 */
export type BuchungDaten = Omit<BuchungEingabe, "email"> & { email?: string };

export async function buchungAnlegen(
  kursId: string,
  eingabe: BuchungDaten,
  optionen: BuchungOptionen = {},
): Promise<BuchungErgebnis> {
  const quelle = optionen.quelle ?? "ONLINE";
  const email = eingabe.email?.trim() || null;
  return prisma.$transaction(async (tx) => {
    // Sperrt die Kurszeile fuer die Dauer der Transaktion. Alles Weitere in
    // diesem Block sieht einen Stand, den niemand sonst gleichzeitig aendert.
    const gesperrt = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM course WHERE id = ${kursId} FOR UPDATE
    `;
    if (gesperrt.length === 0) {
      return { erfolg: false, fehler: "kurs-nicht-buchbar" };
    }

    const kurs = await tx.course.findUnique({
      where: { id: kursId },
      include: { courseType: true },
    });

    if (
      !kurs ||
      kurs.status !== "PUBLISHED" ||
      !kurs.courseType.active ||
      !kurs.courseType.bookable
    ) {
      return { erfolg: false, fehler: "kurs-nicht-buchbar" };
    }

    // Ein Kurs, dessen Termine alle vorbei sind, ist nicht mehr buchbar.
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const kuenftige = await tx.courseSession.count({
      where: { courseId: kursId, date: { gte: heute } },
    });
    if (kuenftige === 0) {
      return { erfolg: false, fehler: "kurs-nicht-buchbar" };
    }

    // Geschaeftsregel 8. Innerhalb der Transaktion, also auch wirksam, wenn
    // zwei Anfragen auf verschiedenen Instanzen gleichzeitig ankommen.
    //
    // Nur online: die Regel faengt den doppelt geklickten Absendeknopf ab. Am
    // Telefon sitzt ein Mensch, der weiss, was er tut, und zwei Geschwister
    // unter derselben Elternadresse sind ein alltaeglicher Fall. Ein Duplikat
    // steht in der Liste direkt vor Ausilia und ist in einem Griff storniert;
    // eine abgewiesene Zweitanmeldung waere ein Telefonat mehr.
    if (quelle === "ONLINE" && email) {
      const seit = new Date(Date.now() - DOPPELBUCHUNG_MINUTEN * 60 * 1000);
      const schonGebucht = await tx.booking.findFirst({
        where: {
          courseId: kursId,
          email,
          createdAt: { gte: seit },
          status: { not: "CANCELLED" },
        },
        select: { id: true },
      });
      if (schonGebucht) {
        return { erfolg: false, fehler: "doppelbuchung" };
      }
    }

    const belegt = await tx.booking.count({
      where: { courseId: kursId, status: "CONFIRMED" },
    });
    if (belegt >= kurs.onlineLimit) {
      return { erfolg: false, fehler: "ausgebucht" };
    }

    // Provisionssatz festhalten, sobald eine Zuweisung vorliegt. Genau wie der
    // Preis: die Abrechnung eines vergangenen Monats darf sich nicht aendern,
    // nur weil der Satz heute ein anderer ist.
    const satz = optionen.referredById
      ? ((
          await tx.instructor.findUnique({
            where: { id: optionen.referredById },
            select: { provisionPerBooking: true },
          })
        )?.provisionPerBooking ?? null)
      : null;

    // Derselbe Rechenweg wie in der Anzeige. Der Zaehlstand stammt aus dieser
    // Transaktion, damit greift der Fruehbucherrabatt fuer genau die ersten N.
    const preis = preisBerechnen(
      {
        price: kurs.price,
        materialPrice: kurs.materialPrice,
        earlyBirdPercent: kurs.earlyBirdPercent,
        earlyBirdSlots: kurs.earlyBirdSlots,
      },
      belegt,
    );

    const buchung = await tx.booking.create({
      data: {
        courseId: kursId,
        salutation: eingabe.anrede,
        lastName: eingabe.nachname,
        firstName: eingabe.vorname,
        street: eingabe.strasse,
        zip: eingabe.plz,
        city: eingabe.ort,
        birthDate: new Date(eingabe.geburtsdatum),
        phone: eingabe.telefon,
        email,
        // Nur wer das Haekchen selbst gesetzt hat, hat den AGB zugestimmt. Bei
        // einer telefonischen Anmeldung bleibt das Feld leer, statt eine
        // Zustimmung zu behaupten, die niemand gegeben hat.
        agbAcceptedAt: quelle === "ONLINE" ? new Date() : null,
        lfaNumber: optionen.lfaNummer?.trim() || null,
        referredById: optionen.referredById ?? null,
        commissionRate: satz,
        source: quelle,
        status: "CONFIRMED",
        priceCharged: preis.total,
        earlyBird: preis.fruehbucher,
      },
      select: { id: true },
    });

    return {
      erfolg: true,
      buchungId: buchung.id,
      total: preis.total,
      fruehbucher: preis.fruehbucher,
    };
  });
}

/**
 * Schritt 2. Ergaenzt eine bestehende Buchung um die Ausweisnummer und die
 * SMS-Erinnerung. Beides freiwillig, deshalb kann hier nichts scheitern, was
 * die Anmeldung selbst betreffen wuerde.
 */
export async function buchungErgaenzen(
  buchungId: string,
  daten: {
    lfaNummer?: string;
    smsErinnerung?: boolean;
    smsTelefon?: string;
  },
): Promise<boolean> {
  const vorhanden = await prisma.booking.findUnique({
    where: { id: buchungId },
    select: { id: true },
  });
  if (!vorhanden) {
    return false;
  }

  await prisma.booking.update({
    where: { id: buchungId },
    data: {
      lfaNumber: daten.lfaNummer?.trim() || null,
      smsReminder: daten.smsErinnerung ?? false,
      smsPhone: daten.smsErinnerung ? (daten.smsTelefon?.trim() ?? null) : null,
    },
  });
  return true;
}

/** Liest eine Buchung samt Kurs fuer Bestaetigungsseite und Mail. */
export async function buchungLesen(buchungId: string) {
  return prisma.booking.findUnique({
    where: { id: buchungId },
    include: {
      course: {
        include: {
          courseType: true,
          sessions: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
        },
      },
    },
  });
}

export type BuchungMitKurs = NonNullable<
  Awaited<ReturnType<typeof buchungLesen>>
>;
