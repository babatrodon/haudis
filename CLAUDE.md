# CLAUDE.md

## Projekt

Haudi's Fahrschule: Public Site + Buchung + Admin + Fahrlehrer-Portal.
UI-Sprache Deutsch (CH, kein ß). Währung CHF. Zeitzone Europe/Zurich.
Vollständige Spec: PLAN.md. Bei Widerspruch gilt PLAN.md.

## Stack

Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, Prisma + Postgres (Neon),
Better Auth (Rollen ADMIN, INSTRUCTOR, nur Team-Login), Resend, ASPSMS.

## Commands

pnpm dev | pnpm build | pnpm typecheck | pnpm lint
pnpm db:migrate | pnpm db:seed | pnpm db:verify | pnpm db:studio
pnpm db:seed:demo | pnpm db:seed:demo:purge

`db:migrate` und `db:deploy` hängen `prisma generate` an. Prisma 7 generiert
nach einer Migration nicht mehr von selbst, und ein veralteter Client fällt erst
beim Typecheck auf.

`pnpm test:e2e` gibt es noch nicht. Playwright kommt in Sprint 3 zusammen mit dem
Smoke-Test für den Buchungsflow. Bis dahin prüft `pnpm db:verify` die
Zusicherungen des Seeds, unter anderem Geschäftsregel 11.

### Seed

- `db:seed` schreibt nur Referenzdaten: Kursarten, Instruktoren, Team-Logins,
  Einstellungen. Gegen die Produktivdatenbank ungefährlich, mehrfaches
  Ausführen ändert nichts. Ein gesetztes Passwort wird nie überschrieben.
- `db:seed:demo` legt Beispielkurse und erfundene Buchungen an. Kurse tragen
  IDs mit Präfix `demo-`, Buchungen laufen auf `@example.invalid`. Vor dem
  Go-Live mit `db:seed:demo:purge` entfernen.

## Konventionen

- Server Components lesen, Server Actions schreiben, Zod-Validierung in jeder Action
- Geld als Prisma Decimal, Anzeige de-CH; Datum UTC speichern, Europe/Zurich anzeigen
- Sprachen: DE (Referenz), EN, IT, SQ via next-intl, Message-Files pro Sprache
- Mobile-first, Admin funktioniert bei 375px und auf iPad (768/1024)

## Domänenregeln (nie verletzen)

- Buchungsformular: Telefon Pflicht, KEIN Kanton-Feld
- Beide Nummern überall: 079 604 44 44 und 079 202 97 97
- Telefonische Anmeldung: kein Bestätigungsmail
- Ampel: frei>=4 grün, 1-3 gelb, 0 rot + Button weg
- Frühbucherrabatt: erste N Buchungen pro Kurs
- Provision: pro zuweisendem Fahrlehrer, Default CHF 50
- Kein Kunden-Login, Buchung immer als Gast
- Fahrlehrer-Zuweisung nur durch Admin, Kunden wählen nie einen Fahrlehrer
- Kursleiter-Dropdowns zeigen nur Instruktoren-Profile, User sind nie automatisch Instruktoren

### Wo diese Regeln im Code verankert sind

- **Geld**: [lib/format.ts](lib/format.ts) formatiert nur für die Anzeige.
  Gerechnet wird nie über `Number`. Provisionen, Abrechnungssummen und
  Kurstotale bleiben `Decimal` bis zum letzten Renderschritt, sonst entstehen
  Rappendifferenzen. Details im Kopfkommentar der Datei.

- **Kein Kunden-Login**: `disableSignUp: true` in [lib/auth.ts](lib/auth.ts). Die
  Registrierungs-Endpunkte antworten mit `EMAIL_PASSWORD_SIGN_UP_DISABLED`.
  Konten entstehen nur per Seed oder durch die Admin-Verwaltung (Sprint 4).
  Es gibt keine Rolle STUDENT und kein Modell mit Kundenkonto.
- **Rollentrennung**: `role` und `active` sind in [lib/auth.ts](lib/auth.ts) als
  `input: false` deklariert und lassen sich über keinen API-Aufruf setzen.
  Autorisiert wird ausschliesslich serverseitig in
  [lib/auth-guard.ts](lib/auth-guard.ts). [proxy.ts](proxy.ts) prüft nur, ob ein
  Cookie existiert, und ist deshalb kein Schutz, sondern Bequemlichkeit.
- **Beide Telefonnummern**: einzige Quelle ist `TELEFONNUMMERN` in
  [lib/kontakt.ts](lib/kontakt.ts). Nie eine Nummer einzeln hart codieren.
  WhatsApp läuft nur über 079 604 44 44, für 079 202 97 97 gibt es bis auf
  Weiteres nur `tel:` (Entscheidung 3 vom 26.07.2026).
- **Ampel-Farben**: als Tokens in [app/globals.css](app/globals.css) hinterlegt
  (`--ampel-gruen`, `--ampel-gelb`, `--ampel-rot` je mit Hintergrund und Linie),
  abgelesen aus der Designvorlage.

## Abweichungen von der Prisma-Skizze in PLAN.md Abschnitt 4

PLAN.md bleibt die Quelle der Wahrheit. Die folgenden vier Punkte sind bewusste,
technisch erzwungene Abweichungen und keine offene Diskussion.

1. **`User.passwordHash` gibt es nicht.** Better Auth legt den Hash in
   `Account.password` ab, mit `providerId = "credential"`. PLAN.md Abschnitt 2
   schreibt Better Auth vor, Abschnitt 4 ist ausdrücklich eine Skizze. `User`
   trägt weiterhin `role`, `name` und `active` wie dort vorgesehen.
2. **Passwort-Hashing ist scrypt**, nicht Argon2 oder bcrypt (Kundenentscheid
   26.07.2026). Better Auth bringt scrypt mit: speicherhart, ohne native
   Abhängigkeit, ohne Build-Risiko auf Windows und Vercel. Wird das je geändert,
   muss [prisma/seed.ts](prisma/seed.ts) dieselbe Hash-Funktion benutzen.
3. **Prisma 7 verdrahtet die Verbindung anders.** Im `datasource`-Block steht
   keine `url`. Die CLI liest `DIRECT_URL` aus [prisma.config.ts](prisma.config.ts),
   zur Laufzeit verbindet der Neon-Adapter über die gepoolte `DATABASE_URL`.
   Der Client wird nach `lib/generated/prisma` generiert, nicht nach
   `@prisma/client`. Deshalb importiert ausser [lib/db.ts](lib/db.ts) niemand den
   generierten Client direkt.
4. **Next.js 16 hat `middleware.ts` in `proxy.ts` umbenannt**, exportierte
   Funktion `proxy`, nur Node-Runtime.

## Routen

- `/` öffentlich, Platzhalter bis Sprint 2
- `/team/login` Team-Login, `/team` verteilt nach Rolle
- `/admin` Rolle ADMIN, `/portal` Rolle INSTRUCTOR
- `/api/auth/[...all]` Better Auth

`/team/login` heisst so, damit es nicht mit der Kundenbuchung unter
`/anmeldung/[courseId]` kollidiert.

## Umgebungsvariablen

Siehe [.env.example](.env.example). `DATABASE_URL` ist die gepoolte Neon-URL
(Hostname mit `-pooler`), `DIRECT_URL` die direkte (ohne `-pooler`).
`.env` gehört nie ins Git.

## Stand

Sprint 0 und 1 abgeschlossen: Scaffold, Prisma und Neon, Better Auth,
vollständiges Datenmodell aus PLAN.md Abschnitt 4, Referenz-Seed.

Offen gegenüber PLAN.md, mit Ausilia zu klären:

- Preise für Nothelfer (NH, NHI) und die drei Motorrad-Grundkurse. Diese
  Kursarten stehen deshalb auf `active: false` und erscheinen nicht öffentlich.
- Ob die Motorrad-Grundkurse einen Lernfahrausweis verlangen. `requiresLfa` ist
  nur beim VKU gesetzt, weil PLAN.md nur dort davon spricht.
- Vollständigkeit des Instruktoren-Pools und die Kürzel. Die Liste steht in
  [prisma/seed-data/instruktoren.ts](prisma/seed-data/instruktoren.ts), eine
  Korrektur ist eine Zeile. Kürzel-Regel: Nachname+Vorname je zwei Buchstaben,
  Ausnahme `VaSh` für Shala Valon wie im Altsystem.
- Fahrstunden-Preise für Motorrad, Lastwagen und Anhänger BE. In den
  Einstellungen leer, die Seite zeigt dafür später "auf Anfrage".

@AGENTS.md
