/**
 * Zeitraeume fuer die Auswertungen des Panels.
 *
 * Hier steckt die haeufigste stille Fehlerquelle des ganzen Projekts, deshalb
 * ausfuehrlich: der Server laeuft in UTC, die Fahrschule lebt in
 * Europe/Zurich. Eine Anmeldung um 00:30 Uhr Schweizer Zeit ist in UTC noch
 * der Vortag. Wer "heute" mit UTC-Grenzen zaehlt, zeigt Ausilia morgens eine
 * Anmeldung zu wenig und wundert sich abends ueber eine zu viel.
 *
 * Dazu kommt ein zweiter Unterschied, der genauso leicht untergeht:
 *
 *   CourseSession.date ist @db.Date, also ein reines Kalenderdatum ohne
 *   Uhrzeit. Prisma gibt es als Zeitpunkt um Mitternacht UTC zurueck.
 *   Verglichen wird es deshalb mit kalendertag(), nicht mit einem echten
 *   Zeitpunkt.
 *
 *   Booking.createdAt ist ein echter Zeitstempel. Verglichen wird er mit
 *   zuercherMitternacht(), also dem tatsaechlichen Moment, in dem in Baden
 *   der Tag beginnt.
 *
 * Die beiden zu verwechseln verschiebt Zahlen um bis zu zwei Stunden, was im
 * Sommer genau eine Nacht falsch zaehlt.
 */

const ZONE = "Europe/Zurich";

/** Kalenderdatum in Zuerich, als Jahr, Monat (1-12) und Tag. */
function zuercherDatumsteile(zeitpunkt: Date): {
  jahr: number;
  monat: number;
  tag: number;
} {
  // sv-SE liefert ISO-artig "2026-07-27", das laesst sich sicher zerlegen.
  const text = new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(zeitpunkt);
  const [jahr, monat, tag] = text.split("-").map(Number);
  return { jahr, monat, tag };
}

/** Verschiebung Zuerichs gegenueber UTC in Minuten, sommerzeitfest. */
function offsetMinuten(zeitpunkt: Date): number {
  const inZuerich = new Date(zeitpunkt.toLocaleString("en-US", { timeZone: ZONE }));
  const inUtc = new Date(zeitpunkt.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((inZuerich.getTime() - inUtc.getTime()) / 60000);
}

/**
 * Kalenderdatum als Mitternacht UTC. Fuer Vergleiche mit @db.Date-Spalten
 * wie CourseSession.date.
 */
export function kalendertag(zeitpunkt: Date = new Date()): Date {
  const { jahr, monat, tag } = zuercherDatumsteile(zeitpunkt);
  return new Date(Date.UTC(jahr, monat - 1, tag));
}

/** Kalendertag um N Tage verschoben. */
export function tagePlus(tag: Date, tage: number): Date {
  const kopie = new Date(tag);
  kopie.setUTCDate(kopie.getUTCDate() + tage);
  return kopie;
}

/**
 * Montag der Woche, in der dieser Kalendertag liegt.
 *
 * Fuer den Einsatzplan, der auf @db.Date-Spalten arbeitet. dieseWoche()
 * daneben liefert echte Zeitpunkte und passt zu Zeitstempeln wie
 * Booking.createdAt — die beiden sind nicht austauschbar.
 *
 * getUTCDay zaehlt den Sonntag als 0, in der Schweiz beginnt die Woche am
 * Montag.
 */
export function wochenStartKalender(tag: Date = kalendertag()): Date {
  const wochentag = tag.getUTCDay();
  return tagePlus(tag, -((wochentag + 6) % 7));
}

/** Die sieben Kalendertage ab diesem Montag. */
export function kalenderWoche(montag: Date): Date[] {
  return Array.from({ length: 7 }, (_, versatz) => tagePlus(montag, versatz));
}

/**
 * Der Moment, in dem in Zuerich der angegebene Tag beginnt.
 * Fuer Vergleiche mit echten Zeitstempeln wie Booking.createdAt.
 */
export function zuercherMitternacht(zeitpunkt: Date = new Date()): Date {
  const { jahr, monat, tag } = zuercherDatumsteile(zeitpunkt);
  const alsWaereEsUtc = Date.UTC(jahr, monat - 1, tag);
  // Erst grob schaetzen, dann mit dem Offset des geschaetzten Moments
  // korrigieren. Ein Durchgang genuegt, weil Zeitumstellungen nachts um 02:00
  // stattfinden und nie um Mitternacht.
  const schaetzung = new Date(alsWaereEsUtc);
  return new Date(alsWaereEsUtc - offsetMinuten(schaetzung) * 60000);
}

export type Zeitraum = { von: Date; bis: Date };

/** Heute, von Mitternacht bis Mitternacht, in echten Zeitstempeln. */
export function heute(jetzt: Date = new Date()): Zeitraum {
  const von = zuercherMitternacht(jetzt);
  const bis = new Date(von.getTime() + 24 * 60 * 60 * 1000);
  return { von, bis };
}

/**
 * Diese Woche, Montag bis Sonntag. In der Schweiz beginnt die Woche am
 * Montag; getDay() zaehlt den Sonntag als 0, deshalb die Umrechnung.
 */
export function dieseWoche(jetzt: Date = new Date()): Zeitraum {
  const tagesbeginn = zuercherMitternacht(jetzt);
  const wochentag = new Date(
    tagesbeginn.toLocaleString("en-US", { timeZone: ZONE }),
  ).getDay();
  const seitMontag = (wochentag + 6) % 7;
  const von = new Date(tagesbeginn.getTime() - seitMontag * 24 * 60 * 60 * 1000);
  const bis = new Date(von.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { von, bis };
}

/** Dieser Monat, erster bis erster. */
export function dieserMonat(jetzt: Date = new Date()): Zeitraum {
  const { jahr, monat } = zuercherDatumsteile(jetzt);
  const ersterDesMonats = new Date(Date.UTC(jahr, monat - 1, 1));
  const ersterDesNaechsten = new Date(Date.UTC(jahr, monat, 1));
  return {
    von: zuercherMitternacht(ersterDesMonats),
    bis: zuercherMitternacht(ersterDesNaechsten),
  };
}

/** Derselbe Monat als Kalendertage, fuer @db.Date-Spalten. */
export function dieserMonatKalender(jetzt: Date = new Date()): Zeitraum {
  const { jahr, monat } = zuercherDatumsteile(jetzt);
  return {
    von: new Date(Date.UTC(jahr, monat - 1, 1)),
    bis: new Date(Date.UTC(jahr, monat, 1)),
  };
}

/** Monatsname fuer die Beschriftung, zum Beispiel "Juli 2026". */
export function monatsName(jetzt: Date = new Date()): string {
  return new Intl.DateTimeFormat("de-CH", {
    timeZone: ZONE,
    month: "long",
    year: "numeric",
  }).format(jetzt);
}
