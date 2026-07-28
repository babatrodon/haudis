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
pnpm test:e2e | pnpm verify:buchung | pnpm verify:kurse | pnpm verify:abrechnung
pnpm verify:warteliste | pnpm verify:schueler | pnpm verify:breite
pnpm verify:redirects | pnpm verify:kopfzeile

`db:migrate` und `db:deploy` hängen `prisma generate` an. Prisma 7 generiert
nach einer Migration nicht mehr von selbst, und ein veralteter Client fällt erst
beim Typecheck auf.

### Tests

- `pnpm test:e2e` fährt den Buchungsweg im Browser durch, gegen den
  Produktionsbuild. `globalSetup` setzt vorher die Demodaten zurück.
- `pnpm verify:buchung` prüft, was der Browser nicht kann: gleichzeitige
  Anmeldungen auf denselben letzten Platz, die Frühbuchergrenze, den
  Doppelbuchungsschutz. Legt Wegwerf-Kurse an und räumt sie wieder ab.
- `pnpm verify:kurse` prüft die Kursverwaltung: dass eine Absage die Buchungen
  mitnimmt, dass ein Duplikat jeden Termin um dieselbe Spanne verschiebt und
  dass Bearbeiten die Kursleiter-Zuweisungen behält.
- `pnpm verify:abrechnung` prüft die Provisionsrechnung gegen von Hand
  ausgerechnete Beträge. Die Erwartungswerte stehen als Literale im Skript und
  werden nicht aus derselben Funktion gerechnet, die geprüft wird.
- `pnpm verify:warteliste` prüft die Warteliste: dass ein reservierter Platz
  für andere gesperrt ist, dass die Frist ihn von selbst wieder freigibt, dass
  von acht gleichzeitigen Einlösungen desselben Tokens genau eine durchkommt,
  und dass eine Kursabsage niemanden einlädt.
- `pnpm verify:schueler` prüft den Abo-Stand und die WAB-Regel: dass
  Rückgängig und doppeltes Abhaken den Stand nicht verfälschen, dass von acht
  gleichzeitigen Zuordnungen auf die letzte offene Lektion genau eine
  durchkommt, dass ein fremder Fahrlehrer keine Lektion abhaken kann, und dass
  die Erinnerung erst nach elf Monaten fällig wird.
- `pnpm verify:breite` lädt jede öffentliche Route in WebKit bei 390 Pixeln und
  meldet Elemente, die breiter sind als das Fenster.
- `pnpm verify:redirects` prüft, welche Adresse jede Seite als die richtige
  ausgibt: dass jede alte ASP-Adresse mit 301 auf ein Ziel zeigt, das mit 200
  antwortet, dass die Regeln in der richtigen Reihenfolge stehen, und dass das
  canonical verschachtelter Seiten auf sich selbst zeigt statt auf den
  Elternpfad. Braucht einen laufenden Server.
- `pnpm verify:kopfzeile` misst im Browser, wo das gelbe Band der Kopfzeile
  liegt: dass es von Kante zu Kante läuft, dass das Logo keinen Grund hat und
  das Band dahinter durchläuft, dass es das untere Drittel des roten
  Schriftzugs kreuzt und über dem gelben Untertitel bleibt — sonst stünde Gelb
  auf Gelb —, dass das Logo gross genug für den Untertitel bleibt und daneben
  genug Platz für die Bedienung. Braucht einen laufenden Server.
- `pnpm db:verify` prüft die Zusicherungen des Seeds, unter anderem
  Geschäftsregel 11.

**Nach `pnpm test:e2e` einmal `pnpm db:seed:demo` laufen lassen.** Jeder
Testlauf legt eine echte Buchung auf dem grünen Demokurs an, danach stimmen die
Zahlen von `db:verify` nicht mehr. Der Demo-Seed stellt sie wieder her.

### Seed

- `db:seed` schreibt nur Referenzdaten: Kursarten, Instruktoren, Team-Logins,
  Einstellungen. Gegen die Produktivdatenbank ungefährlich, mehrfaches
  Ausführen ändert nichts. Ein gesetztes Passwort wird nie überschrieben.
- `db:seed:demo` legt Beispielkurse und erfundene Buchungen an. Kurse tragen
  IDs mit Präfix `demo-`, Buchungen laufen auf `@example.invalid`. Vor dem
  Go-Live mit `db:seed:demo:purge` entfernen.

  Die Kurse mit Präfix `demo-abr-` liegen in den letzten drei Monaten und
  füllen die Abrechnung. Sie erscheinen öffentlich nicht, weil `kommendeKurse`
  einen Termin ab heute verlangt. Ihre Buchungen tragen `commissionRate` —
  ohne den Satz zählt [lib/abrechnung.ts](lib/abrechnung.ts) eine Zuweisung
  gar nicht, und der Bericht bliebe leer, obwohl Fahrlehrer zugewiesen sind.
  Ein Teil trägt bewusst den älteren Satz CHF 40, damit im selben Monat zwei
  Rechenzeilen pro Person entstehen.

**Nach dem Hinzufügen eines Einstellungs-Schlüssels immer `pnpm db:seed`
ausführen**, sonst steht der Wert nur im Code. Die Anwendung fällt auf den
Default zurück und sieht deshalb richtig aus, aber die Admin kann den Wert
nicht bearbeiten, weil die Zeile in der Datenbank fehlt. `pnpm db:verify`
schlägt in diesem Fall an.

Der Seed überschreibt bestehende Einstellungen nie, damit er Anpassungen der
Admin nicht zurücksetzt. Ändert sich ein Default für einen Schlüssel, der schon
in der Datenbank steht, muss der Wert einmalig von Hand nachgezogen werden.

## Konventionen

- Server Components lesen, Server Actions schreiben, Zod-Validierung in jeder Action
- Geld als Prisma Decimal, Anzeige de-CH; Datum UTC speichern, Europe/Zurich anzeigen
- Website einsprachig Deutsch, kein i18n (Kundenentscheid 27.07.2026). Der
  Hinweis auf mehrsprachigen Fahrunterricht betrifft die Lektionen, nicht die Website
- Mobile-first, Admin funktioniert bei 375px und auf iPad (768/1024)

## Domänenregeln (nie verletzen)

- Buchungsformular: Telefon Pflicht, KEIN Kanton-Feld
- Beide Nummern überall: 079 604 44 44 und 079 202 97 97
- Telefonische Anmeldung: kein Bestätigungsmail
- Ampel: frei>=4 grün, 1-3 gelb, 0 rot + Button weg
- Frühbucherrabatt: erste N Buchungen pro Kurs
- Provision: pro zuweisendem Fahrlehrer, Default CHF 50
- Kein Kunden-Login, Buchung immer als Gast; auch die Schülerkartei ist rein
  intern, es gibt keine Rolle STUDENT und keinen Zugang für Fahrschüler
- Warteliste: Benachrichtigung mit Buchungslink, KEIN automatisches Nachrücken
- Zahlung: nur Bar, bis Payrexx bestätigt ist
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
- **Gelbes Band in der Kopfzeile**: Kundenwunsch vom 27.07.2026, ein
  Erkennungsmerkmal der alten Seite; die Schichtung stammt vom Bild der alten
  Kopfzeile (28.07.2026). In
  [components/oeffentlich/kopfzeile.tsx](components/oeffentlich/kopfzeile.tsx)
  läuft es von Kante zu Kante **hinter** dem Logo durch, ungebrochen. Von oben
  nach unten: roter Schriftzug, darin das Band auf dessen unterem Drittel,
  darunter der gelbe Untertitel "Fahrschule Verkehrszentrum" auf freiem
  Grund. Das Logo hat deshalb **keinen** Hintergrund — ein deckendes Feld
  würde das Band unterbrechen. Gemessen am Bild (993x586): roter Schriftzug
  bis 68 % der Bildhöhe, gelber Untertitel ab 71,5 %. Das Band liegt auf 48 %
  bis 70 % der Bildhöhe, in der Zeile gerechnet vom unteren Rand aus: 0,29 mal
  Logohöhe Abstand, 0,22 mal Logohöhe dick. Das Logo steht mit seiner
  Unterkante auf der Zeilenunterkante, die Zeilenhöhe ergibt sich aus der
  Logohöhe. Die Bedienung sitzt mit `self-start` oben in der Zeile, damit das
  Band unter den Beschriftungen durchläuft statt hindurch; sie trägt die
  Farben der Vorlage. Zur Hero-Fläche gibt es keine Trennlinie: das Band ist
  die Kante. Wer die Logohöhe ändert, rechnet die vier Pixelwerte
  nach — geprüft mit `pnpm verify:kopfzeile`. Nicht zu verwechseln mit dem
  Diagonalstreifen aus
  [components/oeffentlich/diagonalstreifen.tsx](components/oeffentlich/diagonalstreifen.tsx),
  der auf den Flächen liegt.
- **Kapazität**: [lib/buchung.ts](lib/buchung.ts) sperrt die Kurszeile mit
  `SELECT … FOR UPDATE`, bevor es zählt und schreibt. Ohne diese Sperre nehmen
  zwei gleichzeitige Anmeldungen denselben letzten Platz. Wer dort etwas
  ändert, lässt danach `pnpm verify:buchung` laufen.
- **Preis**: entsteht ausschliesslich in [lib/preis.ts](lib/preis.ts) und wird
  innerhalb derselben Transaktion berechnet, in der gezählt wird. Nur so gilt
  der Frühbucherrabatt für exakt die ersten fünf.
- **Mailversand** steht ausserhalb der Transaktion und darf eine Buchung nie
  umwerfen: der Platz ist vergeben, auch wenn Resend ausfällt. Ohne
  `RESEND_API_KEY` wird die Mail nur protokolliert.
- **Honigtopf**: das Feld `webseite` ist im Zod-Schema absichtlich unbegrenzt.
  Eine Längenprüfung würde die Eingabe abweisen und dem Bot verraten, woran es
  lag. Die Entscheidung fällt in der Server Action, die nach aussen Erfolg
  meldet und nichts speichert.
- **Kursabsage** nimmt die Buchungen mit und sperrt dabei dieselbe Kurszeile wie
  eine Anmeldung. Ohne die Sperre könnte zwischen dem Lesen der Betroffenen und
  dem Absagen noch jemand buchen: die Buchung wäre storniert, die Person nie
  benachrichtigt.
- **Öffentlicher Cache**: `app/(public)/layout.tsx` steht auf einer Stunde. Jede
  Aktion, die einen Kurs anlegt, ändert, veröffentlicht oder absagt, ruft
  `revalidatePath("/", "layout")` auf — sonst zeigt die Website bis zu eine
  Stunde den alten Stand.
- **Kein `lib/preis.ts` in Client-Komponenten.** Über `Decimal` hängt daran der
  Prisma-Client, und der lässt sich nicht ins Browser-Bundle packen (Turbopack
  bricht mit `node:module` ab). Werte, die das Formular im Browser braucht,
  stehen in [lib/inhalte/kursmuster.ts](lib/inhalte/kursmuster.ts).
- **Drei Anmeldequellen.** `ONLINE` und `INSTRUCTOR` lösen eine Bestätigung
  aus, `PHONE` nie (Geschäftsregel 4). Die Entscheidung steht als
  `bestaetigungFaellig()` in [lib/mail.ts](lib/mail.ts) und ist deshalb ohne
  Mailrenderer prüfbar. `INSTRUCTOR` ist ein eigener Wert und nicht `PHONE`,
  weil die Buchungsansicht telefonisch Angemeldete markiert: das sind die
  Leute ohne etwas Schriftliches, und eine Portal-Anmeldung bekommt eine Mail.
- **Telefonische Anmeldung** läuft durch dasselbe `buchungAnlegen` wie die
  Onlineanmeldung, nur mit `quelle: "PHONE"`. Ein zweiter Schreibweg wäre ein
  zweiter Weg ohne Zeilensperre. Zwei Unterschiede sind Absicht:
  `agbAcceptedAt` bleibt leer (am Telefon setzt niemand ein Häkchen), und der
  Doppelbuchungsschutz greift nur online — er fängt den doppelt geklickten
  Absendeknopf ab, nicht zwei Geschwister unter derselben Elternadresse.
- **CSV** entsteht in [lib/admin/csv.ts](lib/admin/csv.ts): Semikolon statt
  Komma und ein BOM am Anfang. Ohne beides zerlegt Excel unter Windows die
  Spalten nicht und macht aus "Müller" ein "MÃ¼ller". Zellen, die mit `=`, `+`,
  `-` oder `@` beginnen, bekommen ein Apostroph, sonst führt Excel sie als
  Formel aus.
- **Teilnehmerliste** liegt unter `/druck/...`, ausserhalb von `/admin`, damit
  die Seitenleiste gar nicht erst entsteht; geschützt ist sie trotzdem über
  `requireRole`. Sie ist eine echte `<table>`: `<thead>` wiederholt der Browser
  auf jeder Druckseite, also steht der Kursname mit allen Terminen auch auf
  Blatt zwei. Jede Zeile trägt `break-inside: avoid`, damit kein Teilnehmer
  zwischen zwei Seiten zerfällt. Auf dem Blatt stehen nur Nummer, Name und
  Telefon — keine Unterschriftenspalten (Kundenentscheid 27.07.2026: es wird
  nichts unterschrieben), und Geburtsdatum und Ausweisnummer bleiben im Panel.
- **SARI-Knopf** kopiert die Ausweisnummer und öffnet das Portal, mehr nicht.
  Die Rückmeldung sagt deshalb nur, dass die Nummer kopiert ist. Ein
  "Eingetragen" wäre eine Behauptung über etwas, das diese Anwendung nicht
  wissen kann, und wer sich darauf verlässt, verpasst die 24-Stunden-Frist.
- **`Booking.email` ist optional.** Im öffentlichen Formular Pflicht, bei der
  telefonischen Anmeldung nicht: am Schalter gibt es Leute ohne Adresse, und
  eine erfundene wäre schlimmer als keine. Telefon bleibt Pflicht
  (Geschäftsregel 1). Der Mailversand bricht sauber ab, wenn keine Adresse
  vorliegt, statt zu scheitern.
- **Konfliktwarnung** im Einsatzplan vergleicht `"HH:MM"` als Zeichenkette;
  in diesem Format ist das derselbe Vergleich wie ein Zeitvergleich. Blöcke,
  die aneinandergrenzen (18:00–20:00 und 20:00–22:00), kollidieren dadurch
  korrekt nicht. Die Erkennung sitzt in `konflikteFinden` als reine Funktion,
  damit `verify:kurse` sie ohne Datenbank prüfen kann.
- **Startpasswörter** entstehen in [lib/admin/konten.ts](lib/admin/konten.ts)
  über `randomInt` aus `node:crypto`, aus einem Alphabet ohne I, l, 1, O und 0.
  Gespeichert wird nur der Hash; angezeigt wird das Passwort genau einmal.
  Gehasht wird mit `hashPassword` aus `better-auth/crypto`, derselben Funktion
  wie in [prisma/seed-lib.ts](prisma/seed-lib.ts) — wird der Algorithmus in
  [lib/auth.ts](lib/auth.ts) je umgestellt, müssen beide Stellen mitziehen.
- **Provision**: der Satz wird beim Zuweisen auf der Buchung festgehalten
  (`commissionRate`), genau wie `priceCharged` den Preis festhält. Ändert
  Ausilia später einen Satz, bleiben vergangene Abrechnungen unverändert. Das
  Feld wird nur angefasst, wenn sich die Zuweisung ändert — eine korrigierte
  Telefonnummer schreibt die Abrechnung nicht neu. Gerechnet wird nach (Person,
  Satz) gebündelt, damit bei zwei Sätzen zwei Rechenzeilen dastehen statt einer
  Multiplikation, die nicht aufgeht.
- **Abrechnung**: [lib/abrechnung.ts](lib/abrechnung.ts) ist die einzige
  Quelle für Panel, Accounting und Portal. Der Zeitraum läuft wahlweise über
  das Anmelde- oder das Kursdatum, **Standard ist das Kursdatum**
  (Kundenentscheid 27.07.2026: das Geld fliesst bar am ersten Kurstag).
  Der Standard steht als `BASIS_STANDARD` an einer Stelle, gelesen wird er
  überall über `basisAus`; der gewählte Endtag zählt einschliesslich,
  und die Grenzen liegen je nach Basis auf Zürcher Mitternacht (`createdAt`)
  oder Mitternacht UTC (`@db.Date`). Beides steht in `zeitfensterAus`.
- **Warteliste**: eigenes Modell `WaitlistEntry`, keine Buchung mit anderem
  Status. Ein Wartender hat Name, Telefon und E-Mail, sonst nichts; `Booking`
  verlangt Adresse, Geburtsdatum und Preis, die wären alle erfunden.
  `BookingStatus` kennt deshalb nur noch CONFIRMED und CANCELLED.
- **Reservierter Platz**: wird eine Buchung storniert, geht der älteste
  wartende Eintrag auf `EINGELADEN` und hält den Platz 48 Stunden
  (`EINLADUNG_STUNDEN` in [lib/warteliste.ts](lib/warteliste.ts)). Solange die
  Frist läuft, zählt er wie eine Buchung gegen die Kapazität — sonst nimmt ein
  beliebiger Besucher den Platz, bevor die eingeladene Person ihre Mail liest.
  Nach Ablauf wird er von selbst wieder frei: es gibt keinen Aufräum-Job, die
  Frist wird beim Lesen ausgewertet. Wer an `offeneEinladung` etwas ändert,
  lässt danach `pnpm verify:warteliste` laufen.
- **Kursabsage lädt niemanden ein.** Ein abgesagter Kurs hat keinen Platz zu
  vergeben. Nur das Stornieren einer einzelnen Buchung löst eine Einladung aus,
  und der Storno-Dialog sagt vorher an, wer benachrichtigt wird.
- **Mailversand ist sichtbar.** Jede Einladung hält in `mailStatus` fest, was
  passiert ist: `gesendet`, `protokolliert` oder `fehler`. Ohne
  `RESEND_API_KEY` steht über der Warteliste ein roter Streifen, dass keine
  E-Mails rausgehen. Eine eingeladene Person, die nichts davon weiss, ist
  schlimmer als gar keine Einladung.
- **Absender, Absendername und Antwortadresse sind Einstellungen**, nicht
  Konstanten. Resend anzubinden ist damit eine Änderung im Panel plus
  `RESEND_API_KEY` in der Umgebung, ohne Deploy. Die Antwortadresse bleibt
  info@haudi.ch, auch wenn der Absender vorübergehend eine fremde Domain ist.
- **Mailinhalte werden erst gerendert, wenn sie versendet werden.** `senden()`
  in [lib/mail.ts](lib/mail.ts) nimmt die HTML-Fassung als Funktion. Ohne
  Schlüssel wird sie nie aufgerufen — der Renderer zieht `react-dom/server`
  nach, und das lässt sich unter den React-Server-Bedingungen der Prüfskripte
  nicht laden.
- **Kanonische Adresse**: `KANONISCHER_HOST` in
  [lib/inhalte/redirects.ts](lib/inhalte/redirects.ts) ist `haudi.ch` ohne www;
  `www` leitet mit 301 dorthin. `BETTER_AUTH_URL` muss denselben Hostnamen
  tragen, sonst widersprechen sich Weiterleitung und canonical —
  [lib/seite.ts](lib/seite.ts) meldet das im Log. Dazu setzt
  `app/(public)/layout.tsx` ein selbstbezügliches canonical: gefilterte
  Ansichten wie `/kursdaten?art=vku` zeigen **absichtlich** auf `/kursdaten`,
  weil sie denselben Inhalt in Teilmengen zeigen. Wer Kursarten einzeln in die
  Suche bringen will, nimmt `/kurse/[slug]`.
- **Zahlung**: [lib/zahlung.ts](lib/zahlung.ts) entscheidet anhand von
  `PAYREXX_API_KEY`, welche Zahlungsarten erscheinen. Ohne Schlüssel nur Bar,
  also genau das bisherige Bild. Bewusst kein Schalter in den Einstellungen:
  der würde eine Zahlart einschalten, hinter der keine Anbindung steht.
- **Schülerkartei** ist ein eigenes Modell ohne User-Bezug. Ein Fahrschüler
  hat nie Zugang; die Kartei existiert für Ausilia und die Fahrlehrer.
- **Abo-Stand wird gezählt, nicht geführt.** Verbraucht ist die Anzahl
  Lektionen mit Status `ABSOLVIERT` auf dem Abo — es gibt kein `lessonsUsed`.
  Rückgängig korrigiert sich damit von selbst, doppeltes Abhaken zählt nicht
  doppelt, und der Stand kann nicht von der Wirklichkeit abweichen. Das Zuordnen
  einer Lektion zu einem Abo läuft unter `SELECT … FOR UPDATE` auf der Abozeile,
  aus demselben Grund wie die Kapazitätssperre beim Buchen.
- **Lektionszuweisung nur durch die Admin** (Geschäftsregel 10, auf die Lektion
  übertragen). Im Portal kann ein Fahrlehrer weder sich selbst noch jemand
  anderen eintragen — er hakt ab, was ihm zugewiesen wurde, und trägt das
  Prüfungsdatum ein. Beides serverseitig auf seine eigenen Lektionen begrenzt,
  nicht bloss durch weggelassene Knöpfe.
- **WAB-Erinnerung** läuft elf Monate nach der bestandenen Prüfung, einen Monat
  vor Ablauf der Frist. `wabReminderSentAt` wird gesetzt, sobald der Versuch
  gelaufen ist, und `wabMailStatus` hält fest, was dabei herauskam. Wer keine
  E-Mail-Adresse hat, wird NICHT als benachrichtigt geführt und bleibt in der
  Liste stehen — bei dieser Person muss jemand anrufen.
- **`/api/cron/wab` verlangt `CRON_SECRET`.** Ohne den Wert antwortet die Route
  mit 503 statt zu laufen: ein offener Endpunkt liesse jeden einen Massenversand
  auslösen, und weil jeder Lauf die Betroffenen als erinnert markiert, liefe die
  Frist danach still weiter.
- **Kein `lib/schueler.ts` in Client-Komponenten**, aus demselben Grund wie bei
  `lib/preis.ts`. Beschriftungen und Abo-Grössen stehen in
  [lib/inhalte/lektionen.ts](lib/inhalte/lektionen.ts).
- **Einstellungen** speichern gruppenweise und rufen danach
  `revalidatePath("/", "layout")` auf. Jeder Schlüssel muss in genau einer
  Gruppe in [lib/admin/einstellungen-meta.ts](lib/admin/einstellungen-meta.ts)
  stehen; `db:verify` prüft das. Fehlt er dort, lässt er sich nicht bearbeiten
  und niemand merkt es, weil die Anwendung auf den Default zurückfällt.

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

- `/` öffentlich
- `/anmeldung/[courseId]` Anmeldung Schritt 1, `/schritt-2` Ergänzungen,
  `/bestaetigung` Erfolgsseite. Alle drei auf `noindex`: die Seiten sind
  transaktional und die Bestätigung zeigt Personendaten. Lighthouse zieht
  dafür den SEO-Wert auf 60, das ist gewollt.
- `/team/login` Team-Login, `/team` verteilt nach Rolle
- `/druck/...` Druckansichten ausserhalb der Panel-Hülle, trotzdem geschützt
- `/admin` Rolle ADMIN, `/portal` Rolle INSTRUCTOR
- `/api/auth/[...all]` Better Auth

`/team/login` heisst so, damit es nicht mit der Kundenbuchung unter
`/anmeldung/[courseId]` kollidiert.

## Umgebungsvariablen

Siehe [.env.example](.env.example). `DATABASE_URL` ist die gepoolte Neon-URL
(Hostname mit `-pooler`), `DIRECT_URL` die direkte (ohne `-pooler`).
`.env` gehört nie ins Git.

## Stand

Sprint 0 bis 8 abgeschlossen: Scaffold, Datenmodell, Auth, öffentliche Website
nach der Designvorlage, die Onlineanmeldung mit Bestätigungsmail, das
Admin-Panel (Übersicht, Kurse mit Wizard, Buchungen mit Teilnehmerliste,
Einsatzplan, Konten, Einstellungen), Abrechnung und Accounting, das
Fahrlehrer-Portal, die Warteliste mit reserviertem Platz sowie die
Schülerkartei mit Abos, Lektionen und der WAB-Erinnerung.

Offen für den Versand: ein `RESEND_API_KEY` und die verifizierte Domain
haudi.ch. Bis dahin ist die Warteliste vollständig, aber jede Einladung wird
nur protokolliert — das Panel sagt das bei jedem Eintrag.

Offen für die Online-Zahlung: `PAYREXX_API_KEY` und die Bestätigung der Kundin.
Der Schalter steht, die Anbindung selbst (Webhook, Zahlstatus im Admin,
Erstattung bei Kursabsage) ist ein eigener Durchgang.

Offen gegenüber PLAN.md, mit Ausilia zu klären:

- Preise für Nothelfer (NH, NHI) und die drei Motorrad-Grundkurse. Diese
  Kursarten stehen deshalb auf `active: false` und erscheinen nicht öffentlich.
- Ob die Motorrad-Grundkurse einen Lernfahrausweis verlangen. `requiresLfa` ist
  nur beim VKU gesetzt, weil PLAN.md nur dort davon spricht.
- Vollständigkeit des Instruktoren-Pools und die Kürzel. Die Liste steht in
  [prisma/seed-data/instruktoren.ts](prisma/seed-data/instruktoren.ts), eine
  Korrektur ist eine Zeile. Kürzel-Regel: Nachname+Vorname je zwei Buchstaben,
  Ausnahme `VaSh` für Shala Valon wie im Altsystem.
- Fahrstunden-Preise für Motorrad und Anhänger BE. In den Einstellungen leer,
  die Preiskarte zeigt dafür Gedankenstriche und "Preis folgt". Auto, Taxi und
  Lastwagen sind hinterlegt.
@AGENTS.md
