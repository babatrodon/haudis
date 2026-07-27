/**
 * Navigation des Admin-Panels, PLAN.md Abschnitt 6.
 *
 * Eine Liste, zwei Darstellungen: ab Desktop als Sidebar, darunter als
 * Bottom-Tab-Bar. Die Reihenfolge richtet sich danach, wie oft Ausilia etwas
 * braucht, nicht nach der Nummerierung im Plan.
 *
 * "imTab" markiert die vier Eintraege, die auf dem Handy direkt in der
 * Leiste stehen. Alles Weitere liegt hinter "Mehr". Fuenf Ziele nebeneinander
 * sind auf 390px die Grenze, und der fuenfte Platz gehoert dem Menue.
 */

export type NavigationsEintrag = {
  href: string;
  text: string;
  /** Kurzform fuer die schmale Tab-Leiste. */
  kurz: string;
  beschreibung: string;
  /** Erscheint in der Bottom-Tab-Bar statt im Mehr-Menue. */
  imTab: boolean;
  /** Noch nicht gebaut, wird als kommend markiert. */
  kommt?: string;
};

export const ADMIN_NAVIGATION: NavigationsEintrag[] = [
  {
    href: "/admin",
    text: "Übersicht",
    kurz: "Start",
    beschreibung: "Die nächsten sieben Tage auf einen Blick",
    imTab: true,
  },
  {
    href: "/admin/kurse",
    text: "Kurse",
    kurz: "Kurse",
    beschreibung: "Kurse anlegen, bearbeiten, absagen",
    imTab: true,
  },
  {
    href: "/admin/buchungen",
    text: "Buchungen",
    kurz: "Buchungen",
    beschreibung: "Anmeldungen suchen und bearbeiten",
    imTab: true,
  },
  {
    href: "/admin/einsatzplan",
    text: "Einsatzplan",
    kurz: "Einsatz",
    beschreibung: "Kursleiter den Terminen zuweisen",
    // Das Zuweisen der Kursleiter ist Tagesarbeit, steht aber seit der
    // Schuelerkartei hinter "Mehr": vier Ziele plus Menue sind auf 390px die
    // Grenze, und die Kartei wird oefter geoeffnet.
    imTab: false,
  },
  {
    href: "/admin/schueler",
    text: "Schüler",
    kurz: "Schüler",
    beschreibung: "Kartei, Abos, Lektionen und die WAB-Frist",
    // Gehoert in die Leiste: Abos und Lektionen sind Tagesarbeit, und die
    // WAB-Frist laeuft, ob jemand hinschaut oder nicht.
    imTab: true,
  },
  {
    href: "/admin/fahrlehrer",
    text: "Fahrlehrer",
    kurz: "Fahrlehrer",
    beschreibung: "Konten und Provisionssätze",
    imTab: false,
  },
  {
    href: "/admin/abrechnung",
    text: "Abrechnung",
    kurz: "Abrechnung",
    beschreibung: "Provisionen und Umsatz pro Zeitraum",
    imTab: false,
  },
  {
    href: "/admin/accounting",
    text: "Accounting",
    kurz: "Accounting",
    beschreibung: "Periodensummen pro Kursart",
    imTab: false,
  },
  {
    href: "/admin/einstellungen",
    text: "Einstellungen",
    kurz: "Einstell.",
    beschreibung: "Nummern, Preise, Texte und Schwellen",
    imTab: false,
  },
];

export const TAB_EINTRAEGE = ADMIN_NAVIGATION.filter((e) => e.imTab);
export const MEHR_EINTRAEGE = ADMIN_NAVIGATION.filter((e) => !e.imTab);

/**
 * Navigation des Fahrlehrer-Portals, PLAN.md Abschnitt 7 und 14.
 *
 * Seit "Meine Schüler" sind es fuenf Ziele, also gilt hier dieselbe Regel wie
 * im Panel: vier in der Leiste, der Rest hinter "Mehr". Das Profil rutscht
 * hinaus — das schaut ein Kursleiter einmal an, seine Schueler jede Woche.
 */
export const PORTAL_NAVIGATION: NavigationsEintrag[] = [
  {
    href: "/portal",
    text: "Mein Einsatzplan",
    kurz: "Einsatz",
    beschreibung: "Meine kommenden Termine",
    imTab: true,
  },
  {
    href: "/portal/anmelden",
    text: "Schüler anmelden",
    kurz: "Anmelden",
    beschreibung: "Anmeldung erfassen, Provision inklusive",
    imTab: true,
  },
  {
    href: "/portal/schueler",
    text: "Meine Schüler",
    kurz: "Schüler",
    beschreibung: "Meine Lektionen abhaken und die Prüfung eintragen",
    imTab: true,
  },
  {
    href: "/portal/provisionen",
    text: "Meine Provisionen",
    kurz: "Provision",
    beschreibung: "Meine Anmeldungen und Provisionen pro Zeitraum",
    imTab: true,
  },
  {
    href: "/portal/profil",
    text: "Profil",
    kurz: "Profil",
    beschreibung: "Angaben und Passwort",
    imTab: false,
  },
];

export const PORTAL_TABS = PORTAL_NAVIGATION.filter((e) => e.imTab);
export const PORTAL_MEHR = PORTAL_NAVIGATION.filter((e) => !e.imTab);

/**
 * Der aktive Eintrag. Die Startseiten "/admin" und "/portal" duerfen nur bei
 * exakter Uebereinstimmung aufleuchten, sonst waeren sie auf jeder Unterseite
 * aktiv.
 */
export function istAktiv(pfad: string, href: string): boolean {
  return href === "/admin" || href === "/portal"
    ? pfad === href
    : pfad.startsWith(href);
}
