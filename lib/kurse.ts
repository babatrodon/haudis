import { prisma } from "@/lib/db";
import { preisBerechnen, fruehbucherPlaetzeFrei } from "@/lib/preis";
import { offeneEinladungenProKurs } from "@/lib/warteliste";
import {
  ampelSchwellenLesen,
  verfuegbarkeitBerechnen,
  type Verfuegbarkeit,
} from "@/lib/verfuegbarkeit";
import type { Decimal } from "@/lib/decimal";

/**
 * Lesezugriffe auf Kursarten und Kurse fuer die oeffentliche Website.
 *
 * Zwei Regeln stecken hier drin, damit sie nicht auf jeder Seite neu
 * geschrieben werden:
 *
 *   - Nur aktive Kursarten erscheinen oeffentlich. Kursarten ohne bestaetigten
 *     Preis stehen auf active: false und tauchen dadurch nirgends auf.
 *   - Nur veroeffentlichte Kurse mit kuenftigen Terminen sind sichtbar.
 *     Entwuerfe und abgesagte Kurse bleiben draussen.
 */

export type KursartOeffentlich = {
  id: string;
  code: string;
  name: string;
  slug: string;
  beschreibung: string;
  grundpreis: Decimal;
  materialpreis: Decimal;
  gesamtpreis: Decimal;
  lernfahrausweisNoetig: boolean;
  buchbar: boolean;
  /** Anzahl veroeffentlichter Kurse mit kuenftigen Terminen. */
  anzahlKommendeKurse: number;
};

export type KursOeffentlich = {
  id: string;
  kursart: { code: string; name: string; slug: string; lernfahrausweisNoetig: boolean };
  termine: { datum: Date; von: string; bis: string }[];
  ersterTermin: Date;
  preis: Decimal;
  materialpreis: Decimal;
  /** Regulaerer Gesamtpreis ohne Rabatt. */
  gesamtpreis: Decimal;
  /** Preis fuer die naechste Anmeldung, mit Fruehbucherrabatt falls verfuegbar. */
  naechsterPreis: Decimal;
  fruehbucherProzent: Decimal | null;
  fruehbucherPlaetzeFrei: number;
  verfuegbarkeit: Verfuegbarkeit;
};

/** Mitternacht heute, damit ein Kurs am laufenden Tag noch sichtbar bleibt. */
function heute(): Date {
  const jetzt = new Date();
  jetzt.setHours(0, 0, 0, 0);
  return jetzt;
}

export async function aktiveKursarten(): Promise<KursartOeffentlich[]> {
  const kursarten = await prisma.courseType.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          courses: {
            where: {
              status: "PUBLISHED",
              sessions: { some: { date: { gte: heute() } } },
            },
          },
        },
      },
    },
  });

  return kursarten.map((kursart) => ({
    id: kursart.id,
    code: kursart.code,
    name: kursart.name,
    slug: kursart.slug,
    beschreibung: kursart.description,
    grundpreis: kursart.basePrice,
    materialpreis: kursart.materialPrice,
    gesamtpreis: kursart.basePrice.plus(kursart.materialPrice),
    lernfahrausweisNoetig: kursart.requiresLfa,
    buchbar: kursart.bookable,
    anzahlKommendeKurse: kursart._count.courses,
  }));
}

export async function kursartNachSlug(
  slug: string,
): Promise<KursartOeffentlich | null> {
  const alle = await aktiveKursarten();
  return alle.find((kursart) => kursart.slug === slug) ?? null;
}

/**
 * Kommende Kurse, aufsteigend nach dem ersten Termin.
 *
 * @param kursartCode Auf eine Kursart einschraenken, zum Beispiel "VKU".
 * @param kursartCodes Auf mehrere einschraenken. Die Filterleiste auf
 *   /kursdaten fasst Kursarten zu Gruppen zusammen: "Nothelfer" meint NHI und
 *   NH. Eine leere Liste ergibt keine Kurse, nicht alle — sonst zeigte ein
 *   Filter ohne Treffer versehentlich das ganze Programm.
 * @param limit Anzahl, zum Beispiel drei fuer die Startseite.
 */
export async function kommendeKurse({
  kursartCode,
  kursartCodes,
  limit,
}: {
  kursartCode?: string;
  kursartCodes?: string[];
  limit?: number;
} = {}): Promise<KursOeffentlich[]> {
  const stichtag = heute();

  const kurse = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      courseType: {
        active: true,
        ...(kursartCode ? { code: kursartCode } : {}),
        ...(kursartCodes ? { code: { in: kursartCodes } } : {}),
      },
      sessions: { some: { date: { gte: stichtag } } },
    },
    include: {
      courseType: true,
      sessions: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });

  const schwellen = await ampelSchwellenLesen();
  // Reservierte Plaetze aus offenen Wartelisten-Einladungen. Ein Aufruf fuer
  // alle Kurse statt einer pro Karte.
  const reserviert = await offeneEinladungenProKurs(kurse.map((k) => k.id));

  const aufbereitet = kurse
    .map((kurs) => {
      const belegt = kurs._count.bookings;
      const preisDaten = {
        price: kurs.price,
        materialPrice: kurs.materialPrice,
        earlyBirdPercent: kurs.earlyBirdPercent,
        earlyBirdSlots: kurs.earlyBirdSlots,
      };
      const preis = preisBerechnen(preisDaten, belegt);

      return {
        id: kurs.id,
        kursart: {
          code: kurs.courseType.code,
          name: kurs.courseType.name,
          slug: kurs.courseType.slug,
          lernfahrausweisNoetig: kurs.courseType.requiresLfa,
        },
        termine: kurs.sessions.map((termin) => ({
          datum: termin.date,
          von: termin.startTime,
          bis: termin.endTime,
        })),
        ersterTermin: kurs.sessions[0]?.date ?? stichtag,
        preis: kurs.price,
        materialpreis: kurs.materialPrice,
        gesamtpreis: preis.regulaer,
        naechsterPreis: preis.total,
        fruehbucherProzent: kurs.earlyBirdPercent,
        fruehbucherPlaetzeFrei: fruehbucherPlaetzeFrei(preisDaten, belegt),
        verfuegbarkeit: verfuegbarkeitBerechnen(
          kurs.onlineLimit,
          belegt,
          schwellen,
          reserviert.get(kurs.id) ?? 0,
        ),
      };
    })
    // Prisma kann nicht nach dem fruehesten Termin einer Relation sortieren,
    // deshalb hier. Bei der Groessenordnung dieser Fahrschule ist das nichts.
    .sort((a, b) => a.ersterTermin.getTime() - b.ersterTermin.getTime());

  return limit ? aufbereitet.slice(0, limit) : aufbereitet;
}
