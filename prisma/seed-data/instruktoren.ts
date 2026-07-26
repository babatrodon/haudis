/**
 * Instruktoren-Pool, abgelesen aus dem Altsystem am 26.07.2026.
 *
 * PROVISORISCH. Vollstaendigkeit und Kuerzel sind mit Ausilia abzugleichen
 * (PLAN.md Abschnitt 4 und Entscheidung 14). Eine Korrektur ist genau eine
 * Zeile in dieser Liste, deshalb steht hier reine Datenhaltung ohne Logik.
 *
 * Kuerzel-Regel: erste zwei Buchstaben Nachname + erste zwei Buchstaben
 * Vorname, Umlaute ohne Punkte (Buetikofer -> Bu, Zuend -> Zu).
 * Ausnahme: Shala Valon behaelt "VaSh" aus dem Altsystem, weil das Team das
 * Kuerzel auf Buchungslisten wiedererkennt.
 *
 * Login bekommen nur drei Personen. Alle uebrigen sind Profile ohne Konto,
 * userId bleibt null (Geschaeftsregel 11).
 *
 * Der Alteintrag "LOLIT LOLIT" ist bewusst nicht uebernommen: Admin-Account,
 * kein Kursleiter.
 */

// Relativer Pfad statt @/-Alias: diese Datei laeuft unter tsx, nicht unter Next.
import type { Role } from "../../lib/generated/prisma/enums";

export type InstruktorSaat = {
  vorname: string;
  nachname: string;
  kuerzel: string;
  /**
   * Nur gesetzt, wenn die Person ein Team-Login erhaelt. Die Richtung ist
   * bewusst so: ein Instruktor kann ein Konto haben, ein Konto macht aber
   * niemanden zum Instruktor.
   */
  login?: {
    email: string;
    rolle: Role;
    /** Name auf dem Konto, wie er im Admin-Header erscheint. */
    anzeigename: string;
    /** Umgebungsvariable mit dem Startpasswort. */
    passwortEnv: string;
  };
};

export const INSTRUKTOREN: InstruktorSaat[] = [
  { vorname: "René", nachname: "Altschul", kuerzel: "AlRe" },
  { vorname: "Sabrina", nachname: "Altschul", kuerzel: "AlSa" },
  { vorname: "Jan", nachname: "Andres", kuerzel: "AnJa" },
  { vorname: "Dudu", nachname: "Angelli", kuerzel: "AnDu" },
  { vorname: "Manuela", nachname: "Beutler", kuerzel: "BeMa" },
  { vorname: "Markus", nachname: "Bütikofer", kuerzel: "BuMa" },
  { vorname: "Sabine", nachname: "Domaniuk", kuerzel: "DoSa" },
  {
    vorname: "Bernadette",
    nachname: "Eggert",
    kuerzel: "EgBe",
    login: {
      email: "bernadette@haudi.ch",
      rolle: "INSTRUCTOR",
      anzeigename: "Bernadette Eggert",
      passwortEnv: "SEED_BERNADETTE_PASSWORD",
    },
  },
  { vorname: "Jamal", nachname: "Ettanaghmalti", kuerzel: "EtJa" },
  { vorname: "Roli", nachname: "Gaspers", kuerzel: "GaRo" },
  { vorname: "Leandro", nachname: "Guzzo", kuerzel: "GuLe" },
  {
    vorname: "Ausilia",
    nachname: "Haudenschild",
    kuerzel: "HaAu",
    // Ausilia ist Inhaberin und Kursleiterin zugleich: ADMIN-Login plus
    // Instruktoren-Profil. Genau der Fall, den Geschaeftsregel 11 erlaubt.
    login: {
      email: "ausilia@haudi.ch",
      rolle: "ADMIN",
      anzeigename: "Ausilia Haudenschild",
      passwortEnv: "SEED_AUSILIA_PASSWORD",
    },
  },
  { vorname: "Bruno", nachname: "Haudenschild", kuerzel: "HaBr" },
  {
    vorname: "Luca",
    nachname: "Haudenschild",
    kuerzel: "HaLu",
    login: {
      email: "luca@haudi.ch",
      rolle: "INSTRUCTOR",
      anzeigename: "Luca Haudenschild",
      passwortEnv: "SEED_LUCA_PASSWORD",
    },
  },
  { vorname: "Christoph", nachname: "Hengartner", kuerzel: "HeCh" },
  { vorname: "Lars", nachname: "Hertel", kuerzel: "HeLa" },
  { vorname: "Veton", nachname: "Imeri", kuerzel: "ImVe" },
  { vorname: "Hansjörg", nachname: "Jauner", kuerzel: "JaHa" },
  { vorname: "Peter", nachname: "Kienast", kuerzel: "KiPe" },
  { vorname: "Roger", nachname: "Knecht", kuerzel: "KnRo" },
  { vorname: "Uwe", nachname: "Knecht", kuerzel: "KnUw" },
  { vorname: "Silvio", nachname: "Lange", kuerzel: "LaSi" },
  { vorname: "Christian", nachname: "Leutwyler", kuerzel: "LeCh" },
  { vorname: "Andrea", nachname: "Mengarelli", kuerzel: "MeAn" },
  { vorname: "Karl", nachname: "Rickli", kuerzel: "RiKa" },
  { vorname: "Martin", nachname: "Rohner", kuerzel: "RoMa" },
  { vorname: "Oliver", nachname: "Saager", kuerzel: "SaOl" },
  { vorname: "Robert", nachname: "Schläfli", kuerzel: "ScRo" },
  // Ausnahme von der Regel, siehe Kopfkommentar.
  { vorname: "Valon", nachname: "Shala", kuerzel: "VaSh" },
  { vorname: "Stephan", nachname: "Spuler", kuerzel: "SpSt" },
  { vorname: "Sandro", nachname: "Teufer", kuerzel: "TeSa" },
  { vorname: "Dirk", nachname: "Vos de Mooij", kuerzel: "VoDi" },
  { vorname: "Manuela", nachname: "Wildi", kuerzel: "WiMa" },
  { vorname: "Toni", nachname: "Zaccaro", kuerzel: "ZaTo" },
  { vorname: "Viktor", nachname: "Zumsteg", kuerzel: "ZuVi" },
  { vorname: "Daniel", nachname: "Zünd", kuerzel: "ZuDa" },
];
