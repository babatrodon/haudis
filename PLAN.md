# Haudi's Fahrschule Platform - Projektplan & Build Spec

Version 1.0 | Juli 2026 | LoliT
Client: Haudi's Fahrschule & Verkehrsschule, Haselstrasse 33, 5400 Baden
Target repo: `haudi-platform` (drop this file into the repo root as `PLAN.md`)

---

## 1. Problem & Ziel

Das alte haudi.ch (Legacy-PHP, ca. 2005) und der WordPress-Rebuild (Elementor + WooCommerce) werden ersetzt. WooCommerce behandelt Kurse als Shop-Produkte: Warenkorb, Mengenfelder, generischer Checkout mit Kanton-Feld, keine Instruktoren-Logik, keine Provisionen, keine telefonischen Anmeldungen. Das passt nicht zum Workflow der Fahrschule.

Neu: eine massgeschneiderte Plattform aus einem Guss.

1. Öffentliche Website: Marketing, Kursangebot, Kurskalender, Online-Anmeldung
2. Admin-Panel (Inhaberin Ausilia): Kurse, Buchungen, Instruktoren, Abrechnung, Accounting
3. Fahrlehrer-Portal: eigener Einsatzplan, Schüler anmelden, eigene Provisionen
4. 100% responsive. Admin wird primär auf iPad und Smartphone bedient.
5. Benachrichtigungen: Bestätigungs-Mail, SMS-Erinnerung, WhatsApp-Deep-Links

**Erfolgskriterien**
- Ausilia erstellt einen VKU-Kurs auf dem iPad in unter 60 Sekunden
- Online-Buchung Ende-zu-Ende in unter 2 Minuten inkl. Bestätigungsmail
- Abrechnungs- und Provisionsreport stimmt mit der manuellen Rechnung überein
- Lighthouse Mobile Score >= 90 auf allen öffentlichen Seiten

---

## 2. Tech Stack

| Layer | Wahl | Begründung |
|---|---|---|
| Framework | Next.js (App Router, latest stable) + TypeScript strict | Eine Codebase für Site + Admin + Portal. Server Actions statt API-Boilerplate. Bekannt aus dem Finance-Tracker-Projekt. |
| UI | Tailwind CSS + shadcn/ui | Schnell, konsistent, responsive Patterns out of the box |
| DB | PostgreSQL auf Neon (Region eu-central) + Prisma | Bekannter Stack, Point-in-time Recovery, Free Tier reicht fürs Volumen (~30 Buchungen/Monat) |
| Auth | Better Auth, E-Mail/Passwort, Rollen ADMIN / INSTRUCTOR (nur Team, kein Kunden-Login) | ClaudeKit liefert einen Better-Auth-Skill, damit arbeitet Claude Code am zuverlässigsten. Login mit Rate-Limit. Passwort-Hashing: Better-Auth-Standard scrypt (memory-hard, OWASP-konform, keine nativen Abhängigkeiten auf Windows-Dev und Vercel-Build) |
| E-Mail | Resend + React Email (Fallback: Hostinger SMTP + Nodemailer) | Domain-Versand ab haudi.ch mit SPF/DKIM |
| SMS | ASPSMS.ch (Schweizer Anbieter, Prepaid-Credits, HTTP-API) | Günstig, zuverlässig in CH. Alternative: Twilio |
| WhatsApp | `wa.me` Deep Links mit vorbefülltem Text | Keine API, keine Kosten, kein Meta-Approval nötig |
| Forms/Validation | react-hook-form + Zod (Zod auch serverseitig in jeder Action) | |
| Hosting | Vercel + Vercel Cron (Empfehlung) oder Hostinger VPS + Coolify/Docker | Vercel = zero ops. VPS = volle Kontrolle, mehr Wartung |
| Monitoring | Sentry (free) + UptimeRobot | |
| E2E-Test | Playwright: 1 Smoke-Test für den Buchungsflow | Der eine Test, der den Client-GAU verhindert |

Konventionen: Beträge als Prisma `Decimal` in CHF, Format `de-CH`. Zeiten in Europe/Zurich, Speicherung UTC. Hauptsprache Deutsch (Schweiz, kein ß), zusätzlich EN, IT und SQ via next-intl. Die deutsche Fassung ist die Referenz, UI-Strings liegen in Message-Files pro Sprache.

---

## 3. Architektur

```
app/
  (public)/                # Marketing + Buchung, kein Login
    page.tsx               # Home
    fuehrerausweis/        # 7 Schritte
    kurse/[slug]/          # Kursdetails (vku, nothelfer, btu, boegle, motorrad)
    fahrstunden/           # Auto, Motorrad, Anhänger BE, LKW, Taxi
    kursdaten/             # Kalender + Verfügbarkeit
    anmeldung/[courseId]/  # 2-Schritt-Buchung
    vorschriften/{auto,motorrad}/
    galerie/  kontakt/  agb/  datenschutz/  impressum/
  admin/                   # Rolle ADMIN (Middleware-geschützt)
  portal/                  # Rolle INSTRUCTOR (Middleware-geschützt)
  api/cron/sms-reminders/  # täglicher Cron, Secret-Header
lib/                       # db, auth, mail, sms, pricing, availability, copy
prisma/schema.prisma
emails/                    # React Email Templates
```

Ein Monolith. Server Components lesen, Server Actions schreiben. Verfügbarkeit wird ausschliesslich serverseitig berechnet. Keine Secrets im Client.

---

## 4. Datenmodell (Prisma-Skizze)

```prisma
enum Role          { ADMIN INSTRUCTOR }
enum CourseStatus  { DRAFT PUBLISHED CANCELLED ARCHIVED }
enum BookingSource { ONLINE PHONE }
enum BookingStatus { CONFIRMED CANCELLED }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         Role
  name         String
  active       Boolean  @default(true)
  instructor   Instructor?
}

model Instructor {
  id                  String   @id @default(cuid())
  userId              String?  @unique   // Login optional, die meisten Kursleiter haben keinen
  firstName           String
  lastName            String
  shortCode           String   @unique   // Kürzel wie "HaAu", "VaSh", erscheint bei Buchungen
  phone               String?
  provisionPerBooking Decimal  @default(50) @db.Decimal(8,2)
  active              Boolean  @default(true)
  sessions            CourseSession[]
  referredBookings    Booking[]
}

model CourseType {
  id            String  @id @default(cuid())
  code          String  @unique  // VKU, NH, NHI, BTU, MOT_A1_A, MOT_A1, MOT_A, BOEGLE
  name          String
  slug          String  @unique
  description   String  @db.Text
  basePrice     Decimal @db.Decimal(8,2)
  materialPrice Decimal @default(0) @db.Decimal(8,2)
  onlineLimit   Int     @default(12)
  requiresLfa   Boolean @default(false)   // VKU: true
  bookable      Boolean @default(true)    // Bögle: false (Walk-in, gratis)
  sortOrder     Int     @default(0)
  active        Boolean @default(true)
}

model Course {
  id                String  @id @default(cuid())
  courseTypeId      String
  price             Decimal @db.Decimal(8,2)   // Weekend-VKU kostet mehr, deshalb pro Kurs
  materialPrice     Decimal @db.Decimal(8,2)
  onlineLimit       Int
  earlyBirdPercent  Decimal? @db.Decimal(5,2)  // 10.00 = 10 %, Kundenentscheid 26.07.2026
  earlyBirdSlots    Int?     // die ersten N Buchungen erhalten den Rabatt
  status            CourseStatus @default(DRAFT)
  notes             String?
  printedAt         DateTime?
  sessions          CourseSession[]
  bookings          Booking[]
}

model CourseSession {
  id           String   @id @default(cuid())
  courseId     String
  date         DateTime @db.Date
  startTime    String   // "18:00"
  endTime      String   // "20:00"
  instructorId String?  // null = "Noch nicht bestimmt"
}

model Booking {
  id            String   @id @default(cuid())
  courseId      String
  salutation    String   // Frau | Herr
  firstName     String
  lastName      String
  street        String
  zip           String
  city          String
  birthDate     DateTime @db.Date
  phone         String   // PFLICHT
  email         String
  lfaNumber     String?  // Schritt 2, optional nachreichbar
  agbAcceptedAt DateTime?
  smsReminder   Boolean  @default(false)
  smsPhone      String?
  source        BookingSource @default(ONLINE)
  status        BookingStatus @default(CONFIRMED)
  priceCharged  Decimal  @db.Decimal(8,2)
  earlyBird     Boolean  @default(false)
  referredById  String?  // Fahrlehrer -> Provision
  createdAt     DateTime @default(now())
}

model Setting { key String @id  value String @db.Text }
model SmsLog  { id String @id @default(cuid())  bookingId String  to String  body String  status String  sentAt DateTime @default(now()) }
```

### Geschäftsregeln (nie verletzen)

1. **Kein Kanton-Feld.** Buchungsformular hat exakt: Anrede, Nachname, Vorname, Strasse, PLZ, Ort, Geburtsdatum, Telefon (Pflicht), E-Mail (Pflicht), AGB-Checkbox.
2. **Verfügbarkeits-Ampel** (Werte in Settings anpassbar):
   `frei = onlineLimit - count(bookings CONFIRMED)`
   - frei >= 4: Grün, "Noch viele Plätze frei"
   - frei 1-3: Gelb, "Nur noch wenige Plätze frei"
   - frei 0: Rot, "Kurs ausgebucht", Anmelden-Button ausblenden
3. **Frühbucherrabatt**: 10 % auf den Gesamtbetrag inklusive Lehrmittel, für die ersten 5 Anmeldungen pro Kurs (bestätigt 26.07.2026). Mengen-basiert wie im Altsystem ("Frühbucherrabatte ausgeschöpft"), nicht datumsbasiert. Beispiel VKU: 170.00 minus 10 % = 153.00. Berechnung in Decimal, kaufmännische Rundung auf 5 Rappen, `priceCharged` speichert den tatsächlich verrechneten Betrag.
4. **Telefonische Anmeldungen** (source PHONE): kein Bestätigungsmail, zählt zur Kapazität, im Admin klar als "ohne Bestätigung" markiert.
5. **Provision**: `booking.referredBy -> instructor.provisionPerBooking`, Default CHF 50, pro Instruktor überschreibbar.
6. **Beide Telefonnummern überall**: 079 604 44 44 und 079 202 97 97. Header, Footer, Kontakt. Klick = `tel:` Link.
7. VKU-Kurs = 4 Blöcke à 2h über typischerweise 2 Tage. Nothelfer Intensiv = Fr Abend + Sa ganztags (2 Blöcke). Muster siehe Kurs-Wizard.
8. Doppelbuchungsschutz: gleiche E-Mail + gleicher Kurs innerhalb 10 Min blockieren. Honeypot-Feld + Rate Limit pro IP. Kein Captcha in v1 (Turnstile nur bei Bedarf).
9. **Kein Kunden-Login.** Kunden sehen Kurse und buchen immer als Gast. Kein Schüler-Konto, keine Registrierung, kein "Meine Buchungen". Der einzige Login ist der Team-Login (ADMIN, INSTRUCTOR), verlinkt als kleiner "Team-Login" im Footer.
10. **Fahrlehrer-Zuweisung nur durch den Admin.** Kunden wählen nie einen Fahrlehrer, weder bei Kursen noch bei Fahrstunden. Ausilia als Hauptadmin weist pro Kurs-Session und pro Lektion zu.
11. **User und Instruktor sind getrennte Konzepte.** Ein Instruktor kann ein Login haben, muss aber nicht (`userId` optional). Ein User ist nie automatisch Instruktor. Kursleiter-Dropdowns und der Einsatzplan zeigen ausschliesslich aktive Instruktoren-Profile, nie Admin-Accounts ohne Instruktoren-Profil. Fehler im Altsystem: der Admin-User "LOLIT" erschien als wählbarer Kursleiter. Umgekehrt gilt: eine Person darf beides sein (Ausilia = ADMIN-Login + Instruktoren-Profil).

### Instruktoren-Pool (Seed, aus dem Altsystem abgelesen am 26.07.2026, Vollständigkeit mit Ausilia prüfen)

Altschul René, Altschul Sabrina, Andres Jan, Angelli Dudu, Beutler Manuela, Bütikofer Markus, Domaniuk Sabine, Eggert Bernadette, Ettanaghmalti Jamal, Gaspers Roli, Guzzo Leandro, Haudenschild Ausilia, Haudenschild Bruno, Haudenschild Luca, Hengartner Christoph, Hertel Lars, Imeri Veton, Jauner Hansjörg, Kienast Peter, Knecht Roger, Knecht Uwe, Lange Silvio, Leutwyler Christian, Mengarelli Andrea, Rickli Karl, Rohner Martin, Saager Oliver, Schläfli Robert, Shala Valon, Spuler Stephan, Teufer Sandro, Vos de Mooij Dirk, Wildi Manuela, Zaccaro Toni, Zumsteg Viktor, Zünd Daniel.

Der Alteintrag "LOLIT LOLIT" wird NICHT übernommen (Admin-User, kein Kursleiter). Kürzel pro Instruktor generieren nach Muster Nachname+Vorname je zwei Buchstaben oder wie im Altsystem verwendet (HaAu = Haudenschild Ausilia, VaSh = Valon Shala), mit Ausilia abgleichen.

---

## 5. Öffentliche Website - Spec

### Seitenstruktur

| Route | Inhalt |
|---|---|
| `/` | Hero, "Warum uns wählen?", nächste Kurse (3 Karten), Fahrstunden-Teaser mit Gratis-Probelektion-CTA, Kundenstimmen, FAQ, Kontakt-Strip |
| `/fuehrerausweis` | Die 7 Schritte (Copy unten) |
| `/kurse` + `/kurse/[slug]` | VKU, Nothelfer, BTU, Bögle, Motorrad-Grundkurse. Preis, Ablauf, Daten-Teaser, Anmelden-CTA |
| `/fahrstunden` | Sektionen: Auto, Motorrad, Anhänger BE, Lastwagen, Taxi. Preiskarten + WhatsApp-CTA |
| `/kursdaten` | Filter nach Kursart, Kurskarten mit allen Session-Daten, Preis, Ampel, Anmelden |
| `/anmeldung/[courseId]` | Schritt 1 Formular, Schritt 2 LFA-Nr + SMS, Erfolgsseite |
| `/vorschriften/auto`, `/vorschriften/motorrad` | Rechtliche Grundlagen. Inhalte vom Altsystem übernehmen, aber auf Stand 2026 prüfen (astra.admin.ch). Die alten Seiten beschreiben die 2021er-Änderungen noch als "neu". |
| `/boegle` | Info Theorieprüfung (50 Fragen, max. 14 Fehler, 9 Sprachen) + Mini-Quiz mit 20 EIGENEN Demo-Fragen. Keine lizenzierten ASA-Prüfungsfragen nachbauen. |
| `/galerie` | Bestehende Fotos, aufgeräumt |
| `/kontakt` | Beide Nummern, WhatsApp-Buttons, info@haudi.ch, Adresse, Google Map, "350 m vom Bahnhof Baden" |
| `/agb`, `/datenschutz`, `/impressum` | Pflichtseiten, revDSG-konform |

### Fahrstunden-Preise (finale Zahlen vom Kunden)

**Auto-Fahrlektionen** und **Taxi-Fahrlektionen** (identische Struktur):
- 1 Lektion: CHF 95.00
- 5er-Abo: CHF 90.00 pro Lektion
- 10er-Abo: CHF 88.00 pro Lektion
- Einmalig CHF 100.00 Anteil an Versicherung und Administrationsaufwand (erste Lektion)
- Button **"Gratis Probelektion buchen"** öffnet WhatsApp-Chat direkt mit Ausilia, vorbefüllter Text:
  `https://wa.me/41796044444?text=Hoi%20Ausilia!%20Ich%20m%C3%B6chte%20gerne%20eine%20gratis%20Probelektion%20(Auto)%20vereinbaren.%20Mein%20Name:%20`
  Nummer und Texte in Settings pflegbar. Pro Kategorie eigener Text (Auto, Taxi, Motorrad, ...).

**LKW-Fahrlektionen**: praktische Lektion CHF 140.00, Theorielektion CHF 25.00 (bestätigt 26.07.2026, deckt sich mit dem Altsystem). Eigene Kartenstruktur ohne Abo-Staffel.

**Motorrad-Fahrlektionen und Anhänger-Ausbildung BE**: laut Kundin dieselben Ansätze wie Auto und Taxi (95 / 90 / 88). Da sich die LKW-Angabe in derselben Antwort als falsch erwiesen hat, vor Publikation kurz gegenprüfen, insbesondere Anhänger BE. Alle Werte über Settings pflegbar.

### Kurse (Startwerte aus Altsystem, alle pro Kurs überschreibbar)

- **VKU**: 4 Doppellektionen, Standard CHF 140 + CHF 30 Lehrmittel = CHF 170 total. Weekend-Variante CHF 210 total. Lernfahrausweis obligatorisch (Buchung Schritt 2 + am Kurstag). Online-Limit 12.
- **Nothelfer**: Intensivkurs Fr 19-22h + Sa 09-12h und 13-17h (1 Tag mit eLearning), oder Abendkurs. Ausweis 6 Jahre gültig. Preis laut Kundin 26.07.2026: je CHF 120. Plausibel (erste Schätzung lag bei 110 bzw. 99-130), kann publiziert werden.
- **BTU**: Di + Mi 19-21h, CHF 200 inkl. Material. Aktion "+ 8 Stunden Bögle gratis" (Flag in Settings).
- **Bögle/PFB**: Mo 19-21h, gratis, keine Anmeldung. Nur Infoseite, nicht buchbar.
- **Motorrad-Grundkurse**: A1 zu A (Aufsteigerkurs, ca. 4h) CHF 120, bestätigt und publizierbar. A1 (12h) und A (12h) laut zweiter Antwort ebenfalls CHF 120, WIDERSPRUCH zur ersten Antwort derselben Kundin (je ca. CHF 480). CHF 120 für 12 Stunden praktische Grundschulung entspricht CHF 10 pro Stunde und ist betriebswirtschaftlich nicht haltbar. Vermutung: die Rückfrage nach "einem festen Betrag" wurde als "ein Betrag für alle" gelesen. Diese beiden Kursarten bleiben `active: false` bis zur schriftlichen Bestätigung. Rechtlicher Grund: ein publizierter Preis mit Onlinebuchung ist ein verbindliches Angebot. Kein Lernfahrausweis für die Anmeldung nötig (`requiresLfa: false`, bestätigt 26.07.2026).

### Die 7 Schritte zum Führerausweis (finale Copy)

> Hier sind die sieben Schritte zum Führerausweis. Solltest Du mit einem Formular oder den gesetzlichen Bestimmungen nicht klarkommen, ruf uns einfach an! Wir bieten Dir alle erforderlichen Kurse an.

1. **Nothelferkurs absolvieren**
   Absolviere zuerst den obligatorischen Nothelferkurs. Du erhältst danach einen Ausweis, der dem Gesuch beizulegen ist.
   [Button: Zum Nothelferkurs -> /kurse/nothelfer]
2. **Gesuch ausfüllen**
   Fülle das «Gesuch um Erteilung eines Lernfahr- bzw. Führerausweises» aus. Sehtest, Foto und Nothelferausweis beilegen.
   [Button: Formular herunterladen -> Strassenverkehrsamt Aargau, exakten Link beim Build verifizieren]
3. **Einwohnerkontrolle**
   Persönlicher Identitätscheck bei der Einwohnerkontrolle zur Kontrolle der Personalien. Identitätskarte oder Pass sowie Formular mitbringen, inkl. Nothelfer-Bestätigung und Foto.
4. **Theorieprüfung & Lernfahrausweis**
   Das Strassenverkehrsamt stellt den Anmeldetalon für die Theorieprüfung zu. Nach bestandener Prüfung wird der Lernfahrausweis ausgestellt.
   [Button: Theorie-Unterstützung -> /kurse/btu]
5. **Fahrstunden & VKU**
   Melde Dich für den Verkehrskundeunterricht (VKU) und die praktischen Fahrstunden an. Wir begleiten Dich kompetent und geduldig.
   [Buttons: VKU-Daten ansehen, Gratis Probelektion]
6. **Praktische Prüfung**
   Lege die praktische Fahrprüfung beim Strassenverkehrsamt ab und erhalte nach bestandener Prüfung Deinen Führerausweis.
7. **WAB-Kurs (Weiterausbildung)** [Badge: ABSCHLUSS]
   Der WAB-Kurs ist obligatorisch und muss innerhalb von 12 Monaten nach der praktischen Prüfung absolviert werden. Er ist Voraussetzung für den definitiven Führerausweis. Den Kurs buchst Du direkt beim TCS. Als unser Fahrschüler profitierst Du von einem exklusiven Rabatt von CHF 20.-
   **Gutscheincode: Ausilia20**
   [Button: Jetzt beim TCS buchen -> TCS-WAB-Link, beim Build verifizieren]

### Warum uns wählen? (aus WP-Version übernehmen, verfeinern)

Schritt-für-Schritt Lernen · Moderne Ausbildungsfahrzeuge mit Doppelsteuerung · Mehrsprachige Fahrlehrer (Deutsch, Italienisch, Spanisch, Englisch, Französisch) · Flexible Terminplanung · Familienrabatt und Abo-Pakete · Geduldige, persönliche Betreuung · 350 m vom Bahnhof Baden

### Kundenstimmen

Echte Google-Reviews aus der WP-Version übernehmen (Emerson Narayan, Annina Clara, Aylin Sakat, Riccardo Russo). Link zum Google-Profil für neue Bewertungen. Als echtes Google-Widget mit Sternen und Profil-Link darstellen, nicht als anonyme Zitatkarte. Button-Text deutsch: "Bewertung schreiben".

### FAQ (Homepage-Sektion, Fragen aus der WP-Version übernehmen)

1. In welchen Sprachen wird der Fahrunterricht angeboten?
2. Gibt es Abos oder Rabatte? (5er/10er-Abo, Familienrabatt)
3. Wo finden die Fahrstunden statt?
4. Fahre ich mit Schaltgetriebe oder Automatik?
5. Ab welchem Alter kann ich mit dem Autofahren beginnen? (LFA ab 17, praktische Prüfung ab 18)
6. Wie lange ist die Theorieprüfung gültig? (seit 2021 unbefristet gültig)
7. Wie lange muss ich den Lernfahrausweis besitzen, bevor ich die praktische Prüfung ablegen darf? (LFA vor dem 20. Geburtstag erhalten: mindestens 12 Monate)

Antworten neu redigieren, Tippfehler der WP-Version nicht übernehmen ("Fahrnterricht", "Lernen?A"). Deutsche Headlines überall in Satzschreibung, kein englisches Title Case.

### Buchungsflow

**Schritt 1**: Kursübersicht (Daten, Preis, ggf. Frühbucher-Badge) + Formular gemäss Regel 1. Preisbox: Kursgebühr + Kursmaterial = Total, Hinweis "Betrag bitte bar am ersten Kurstag mitbringen" und bei VKU "WICHTIG: Lernfahrausweis am ersten Kurstag mitbringen!"
**Schritt 2**: Lernfahrausweis-Nummer (mit Beispielbild wie im Altsystem, Feld optional) + SMS-Erinnerung optional (Handy-Nummer).
**Erfolgsseite**: Bestätigung, "E-Mail-Bestätigung unterwegs, Spam-Ordner prüfen", WhatsApp-Button "Frage zur Buchung? Schreib uns."

---

## 6. Admin-Panel (Rolle ADMIN)

Responsive Shell: Desktop Sidebar, iPad/Phone Bottom-Tab-Bar + Sheets. Alle Tabellen kollabieren auf kleinen Screens zu Karten. Touch-Targets min. 44px. Getestet bei 375 / 768 / 1024 px.

1. **Dashboard**: nächste 7 Tage (Sessions + Instruktor), Füllstand-Balken pro Kurs, Buchungen heute/Woche, Umsatz Monat, Quick Actions (Neuer Kurs, Telefonische Anmeldung, Suche).
2. **Kurse**: Liste mit Filtern + Ampel. **Kurs-Wizard**: Kursart wählen, erstes Datum wählen, Muster vorschlagen (VKU: Di+Di+Mi+Mi je 2 Blöcke 17.45-19.45/19.45-21.45 oder 18-20/20-22; Weekend: Fr 18-20, Fr 20-22, Sa 08.30-10.30, Sa 10.30-12.30; Nothelfer Intensiv: Fr 19-22, Sa 09-12, Sa 13-17), Sessions editierbar, Preis, Material, Online-Limit (Default 12), Frühbucherrabatt + Slots, Publish/Draft. Kurs duplizieren. Kurs absagen mit optionaler Teilnehmer-Benachrichtigung.
3. **Buchungen**: pro Kurs + globale Suche (Name/Telefon/E-Mail). **Kurs-Buchungsansicht** ("Buchungen ansehen" wie im Altsystem): Kopf mit allen Sessions und Zählern (Online-Anmeldungen, Telefonische Anmeldungen, Total). Pro Buchung eine Zeile mit Name, Geburtsdatum, LFA-Nummer fett (fehlt sie: Hinweis "Ausweisnummer fehlt"), Kürzel des zuweisenden Fahrlehrers (z.B. HaAu, VaSh), Adresse, Telefonnummern, E-Mail, Preis. Aktionen pro Zeile: LFA-Nummer bearbeiten, **SARI-Button** (kopiert die LFA-Nummer in die Zwischenablage und öffnet das SARI-Portal der asa für die Kursbestätigung, nur aktiv wenn die Nummer vorliegt), Löschen mit Bestätigung. Quick Actions `tel:`, `wa.me`, `mailto:` (auf dem iPad Gold wert). Bearbeiten, stornieren. **"Telefonische Anmeldung"** als Schnellformular ohne Mailversand. CSV-Export. **Teilnehmerliste drucken**: die Kurs-Buchungsansicht als Druckversion mit Unterschriftslinie pro Teilnehmer (VKU-Lektionen werden schriftlich bestätigt).
4. **Instruktoren-Einsatzplan**: Sessions nach Woche, Instruktor pro Session zuweisen (Default "Noch nicht bestimmt"), durchsuchbares Dropdown mit dem gesamten aktiven Instruktoren-Pool plus Option "Instruktor entfernen", Konfliktwarnung bei Überschneidung, Druckansicht. Es erscheinen nur Instruktoren-Profile, nie User ohne Profil (Regel 11).
5. **Abrechnung**: Filter Fahrlehrer + Von/Bis. Tabellen pro Kursart (VKU, Nothelfer, BTU, Motorradkurse) mit Anrede, Name, Ort, Anmeldedatum, Kursdatum. Totale: Anmeldungen, Umsatz, **Provision** (Satz × zugeordnete Buchungen). Druck/PDF.
6. **Accounting**: Periodensummen pro Kursart, Total Umsatz, Total ohne Motorrad-Kurse (wie Altsystem), Total Buchungen.
7. **Fahrlehrer**: Konten verwalten, Provisionssatz, aktiv/inaktiv, Passwort-Reset.
8. **Einstellungen**: Telefonnummern, WhatsApp-Nummer + vorbefüllte Texte pro Kategorie, WAB-Gutscheincode, Fahrstunden-Preise/-Texte, Ampel-Schwellen, Absender-Mail, SMS an/aus, BTU-Aktion an/aus.

Bewusst NICHT übernommen aus dem Altsystem: das gemeinsame Fahrlehrer-Login (jeder bekommt ein eigenes Konto) und die Bulk-Funktion "515 Kurse als gedruckt markieren" (durch `printedAt` pro Kurs ersetzt, nur falls der Kunde den Druck-Workflow behalten will).

## 7. Fahrlehrer-Portal (Rolle INSTRUCTOR)

- **Mein Einsatzplan**: kommende Sessions
- **Schüler anmelden**: Schnellbuchung, automatisch sich selbst als `referredBy` zugeordnet (Provision)
- **Meine Provisionen**: Periodenfilter, Liste + Total
- **Meine Schüler** (ab Welle 2): interne Schülerkartei, Lektionen abhaken, Abo-Stand sehen, Prüfungsdatum erfassen
- **Profil**: Passwort ändern

## 8. Benachrichtigungen

- **Buchungsbestätigung** (React Email, gebrandet): Kursdaten, Total, Mitbringen-Liste (Lernfahrausweis, Betrag bar), Reply-To info@haudi.ch. SPF/DKIM/DMARC auf haudi.ch einrichten.
- **Interne Mail** an Admin pro Buchung (Toggle in Settings).
- **SMS-Erinnerung**: Cron täglich 07:00 Europe/Zurich. Alle CONFIRMED-Buchungen mit `smsReminder` und erster Session heute: "Erinnerung: Heute [Kurs] um [Zeit], Haselstrasse 33, Baden. Haudi's Fahrschule". Jede SMS in `SmsLog`.
- **WhatsApp**: nur Deep Links, kein API. Kontexte: Probelektion pro Kategorie, Frage zur Buchung, allgemeiner Kontakt.

## 9. Design-Richtung

- Logo (Haudi's Schriftzug) bleibt. Farben: Gelb `#FFE500`, Rot `#E3001B`, Schwarz `#121212`, warme Grautöne, weisser Grund. Gelb als Akzent, keine gelben Vollflächen.
- Typo: Display-Font mit Charakter für Headlines (Archivo Black oder Space Grotesk), Inter für Fliesstext.
- Look: hell, energisch, dezente Diagonal-Akzente als Referenz an die Fahrzeug-Beklebung. Grosse Preiskarten. Ampel-Chips (grün/gelb/rot) übernehmen das mentale Modell des Altsystems, das Team kennt es.
- Sticky Mobile-Bar auf Kursseiten: Anruf | WhatsApp | Anmelden.
- Barrierefrei: Kontrast Gelb/Schwarz geprüft, semantisches HTML, Fokus-States.
- Fotos: bestehende Galerie bereinigen, idealerweise neue Shots von Fahrzeugen + Schulungsraum.

---

## 10. Build-Plan mit Claude Code

Repo `haudi-platform` (privat, GitHub). Pro Sprint ein Feature-Branch, kleine Commits, Vercel Preview-Deploys als Feedback-Link für Ausilia.

Arbeitsweise pro Sprint: Plan Mode starten, Plan reviewen, dann implementieren lassen. `CLAUDE.md` bei jeder Stack-Entscheidung aktualisieren.

ClaudeKit (installiert via `ck`): pro Sprint dieselbe Kette. `planner` liest PLAN.md und erstellt den Sprint-Plan, `database-admin` übernimmt Schema und Migrationen, `fullstack-developer` implementiert, `tester` schreibt Playwright- und Unit-Tests, `code-reviewer` prüft vor jedem Merge, `git-manager` committet ohne AI-Attribution. Die übrigen elf Agents nur bei konkretem Bedarf. `ui-ux-designer` ausschliesslich für Screenshot-to-Code aus den Claude-Design-Screens, keine KI-generierten Bilder oder Assets im ganzen Projekt. Nach der Kit-Installation prüfen, dass die Domänenregeln in CLAUDE.md erhalten bleiben und nicht vom Kit-Template überschrieben werden. PLAN.md bleibt die einzige Quelle der Wahrheit.

| Sprint | Umfang | DoD |
|---|---|---|
| 0 Fundament (0.5 T) | Scaffold Next+TS+Tailwind+shadcn, Prisma+Neon, Auth-Gerüst, Vercel-Projekt, CLAUDE.md + PLAN.md im Repo | Deployte Seite, Login mit geseedetem Admin |
| 1 Schema & Auth (1 T) | Schema, Migrationen, Seed (Kursarten, kompletter Instruktoren-Pool aus Abschnitt 4 mit Kürzeln, Logins nur für Ausilia, Luca und Bernadette, Beispielkurse, Settings), Rollen-Middleware | Admin- und Instruktor-Login, geschützte Routen |
| 2 Public Site (2-3 T) | Layout, Designsystem, alle statischen Seiten mit finaler Copy, 7 Schritte, Fahrstunden, Bögle-Quiz, Kontakt. Links (TCS, Strassenverkehrsamt AG) verifizieren | Content-komplett, Lighthouse Mobile >= 90 |
| 3 Buchung (2 T) | /kursdaten mit Ampel, 2-Schritt-Flow, Validierung, Doppelbuchungs-/Spamschutz, Bestätigungsmail, Erfolgsseite, Playwright-Smoke-Test | E2E-Buchung auf Staging inkl. Mail |
| 4 Admin (3-4 T) | Dashboard, Kurs-Wizard + CRUD, Buchungen inkl. telefonische Anmeldung, Einsatzplan, Teilnehmerliste-Druck, Settings | Ausilia verwaltet Kurs + Buchung komplett auf dem iPad |
| 5 Abrechnung & Portal (1-2 T) | Abrechnung + Accounting + Druck/PDF, Fahrlehrer-Portal | Provisionsreport == manuelle Rechnung bei Testdaten |
| 6 Notifications & Polish (1-2 T) | SMS-Cron + Provider, Logs, Empty/Error-States, SEO-Meta, schema.org DrivingSchool, Sitemap, Redirect-Map | Launch-Checkliste grün |
| Go-Live 1 (0.5 T) | Content-Freeze mit Ausilia, Testbuchungen durchs Team, DNS-Umstellung haudi.ch, Monitoring | Kern-Plattform live, ersetzt haudi.ch |

Welle 1 (Sprints 0-6): ~10-13 fokussierte Tage bis Go-Live 1. Welle 2 (Sprints 7-10, siehe Abschnitt 14): ~7-9 Tage, laufend deployt, Go-Live 2 als Feature-Release ohne DNS-Risiko. Total ~17-22 Tage, realistisch 4-6 Wochen neben dem BM-Technic-Start.

### CLAUDE.md Starter

```md
# CLAUDE.md
## Projekt
Haudi's Fahrschule: Public Site + Buchung + Admin + Fahrlehrer-Portal.
UI-Sprache Deutsch (CH, kein ß). Währung CHF. Zeitzone Europe/Zurich.
Vollständige Spec: PLAN.md. Bei Widerspruch gilt PLAN.md.

## Stack
Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, Prisma + Postgres (Neon),
Better Auth (Rollen ADMIN, INSTRUCTOR, nur Team-Login), Resend, ASPSMS.

## Commands
pnpm dev | pnpm build | pnpm prisma migrate dev | pnpm prisma db seed | pnpm test:e2e

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
```

### Erster Claude-Code-Prompt

> Read PLAN.md fully. Start Sprint 0: scaffold the project per sections 2 and 3, set up Prisma with Neon, Better Auth with ADMIN and INSTRUCTOR roles (team only, no customer accounts), seed one admin user, make it deployable on Vercel. Create CLAUDE.md from section 10. Plan first, then implement.

---

## 11. Launch-Checkliste

- [ ] AGB, Datenschutzerklärung (revDSG: Auftragsverarbeiter Vercel/Neon/Resend/ASPSMS aufführen, Aufbewahrung von Buchungsdaten definieren, z.B. Anonymisierung nach 3 Jahren), Impressum
- [ ] SPF/DKIM/DMARC für Versand ab haudi.ch, Testmail an Gmail/Outlook/Bluewin
- [ ] Altes haudi.ch crawlen, 301-Redirect-Map für indexierte URLs
- [ ] Google Business Profile aktualisieren (neue Site, Fotos, Buchungslink)
- [ ] schema.org DrivingSchool + LocalBusiness, OG-Images, Favicons
- [ ] Neon-Backups/PITR verifiziert, Sentry + Uptime-Monitor aktiv
- [ ] Testfälle: Buchung, telefonische Anmeldung, Ampel-Zustände, ausgebucht, Frühbucher ausgeschöpft, SMS, Abrechnung, Kurs absagen
- [ ] 10-Min-Loom für Ausilia: Kurs anlegen, Buchung erfassen, Abrechnung ziehen
- [ ] Parallelbetrieb: 1 Woche Testbuchungen intern, erst dann DNS

## 12. Entscheidungen (Stand 26.07.2026)

### Beantwortet von Ausilia am 26.07.2026

- Motorrad-Grundkurse verlangen KEINEN Lernfahrausweis zur Anmeldung (`requiresLfa: false`).
- Instruktoren-Pool: 36 Namen vollständig, Kürzel bestätigt.
- Provision: CHF 50 pro Anmeldung, flach für alle Kursleiter.
- Frühbucherrabatt: 10 % auf den Gesamtbetrag inkl. Lehrmittel, erste 5 Anmeldungen pro Kurs (VKU: 170 wird zu 153).
- Preise: Nothelfer Intensiv und Abendkurs je CHF 120, Grundkurs A1 zu A CHF 120, LKW CHF 140 praktisch und CHF 25 Theorie.
- Kursleiter-Konten: provisorische @haudi.ch-Adressen, Passwörter verteilt Ausilia persönlich, deshalb Passwortvergabe im Admin-Panel statt per Mail (siehe Abschnitt 15).
- Datenübernahme: CSV von der Kundin, künftige und vergangene Anmeldungen, Lieferung kurz vor dem Launch.
- BTU-Aktion mit 8 Gratis-Stunden Bögle bleibt aktiv.
- Warteliste: nur Benachrichtigung mit Buchungslink, KEIN automatisches Nachrücken.
- Payrexx: Abklärung läuft kundenseitig, Zahlung bleibt in Welle 2.
- Systemzugang: ALLE 36 Kursleiter erhalten ein Login (Änderung gegenüber dem früheren Plan mit drei Logins).
- Bestehende Anmeldungen aus dem Altsystem werden übernommen (neuer Arbeitsblock, siehe Abschnitt 15).

### Offen, blockiert aber nichts mehr (Stand 27.07.2026)

1. **Motorrad-Grundkurse A1 und A**: definitive Preise werden von der Kundin abgeklärt. Bis dahin `active: false`, also nicht öffentlich sichtbar.
2. **Motorrad-Fahrlektionen und Anhänger-Ausbildung BE**: Preise werden abgeklärt. Bis dahin auf der Fahrstunden-Seite "auf Anfrage" mit Telefon- und WhatsApp-Kontakt.

Beides sind Inhalte, keine Bausteine. Sprint 2 und die Buchung laufen unabhängig davon weiter, die Werte werden später im Admin nachgetragen.

### Weiterhin offen, nicht blockierend

6. Lektionsdauer für die interne Erfassung (45 oder 90 Minuten).
7. Übersetzungen: SQ liefert Loli, wer liest EN und IT gegen? Nur UI und Kernseiten oder auch alle Kursbeschreibungen?
8. Hosting-Eigentum und Abrechnung: LoliT Managed Hosting empfohlen (siehe Abschnitt 13).

## 13. Kommerziell (LoliT, intern)

- Aufwand neu ~17-22 Tage nach der Streichung von Schülerportal und Slot-Buchung. Als Produkt positionieren, nicht als Stunden: Website + Buchungssystem + Online-Zahlung + interne Schülerkartei + Adminsoftware in einem. Schweizer Vergleichswert für diesen Umfang: CHF 12-20k. Offerte in zwei Positionen (Welle 1, Welle 2), ein Vertrag, Abnahme pro Welle.
- Recurring: Care-Plan CHF 99-179/Monat (Hosting, Backups, SMS-Credits, Payrexx-Betreuung, Updates, kleine Änderungen). Mit Zahlungen und Schülerdaten steigt die Verantwortung, also steigt der Care-Preis mit. Das ist der langfristige Gewinn.
- Risiken: grosser Umfang. Schutz: Go-Live 1 nach Welle 1, damit früh etwas Sichtbares live ist und Feedback fliesst. Jeder weitere Wunsch ab jetzt nur mit Preis- und Terminanpassung. From-scratch heisst: jeder Bug gehört Dir. Gegenmittel: Playwright-Smoke-Tests + Parallelbetrieb vor DNS-Umstellung.
- Fertigsoftware für Fahrschulen existiert, deckt aber Provisionen + WhatsApp-Flow + deren exakten Prozess nicht ohne Kompromisse ab. Custom ist hier vertretbar und differenziert LoliT.

## 14. Welle 2: erweiterter v1-Umfang (Kundenentscheide 26.07.2026)

Kein separates v2. Die folgenden Features sind fester Bestandteil von v1 und laufen als Sprints 7-10 direkt nach Go-Live 1. Laufend deployen, Go-Live 2 als Feature-Release.

Kundenentscheid vom 26.07.2026 (Feedback Haudi's): KEIN Kunden-Login und KEIN Schülerportal. Kunden sehen Kurse und buchen als Gast, mehr nicht. KEINE öffentliche Slot-Buchung und KEINE Fahrlehrer-Wahl durch Kunden. Die Fahrlehrer-Zuweisung macht die Admin (Ausilia als Hauptadmin) intern, pro Kurs-Session und pro Lektion. Die Schülerverwaltung ist deshalb ein rein internes Werkzeug (Schülerkartei) für Admin und Fahrlehrer.

### Schema-Erweiterungen (Deltas zu Abschnitt 4)

```prisma
// BookingStatus um WAITLIST erweitern. KEINE Rolle STUDENT, kein Kunden-Login.
// Booking erweitern: paymentMethod, paymentStatus, paidAt, payrexxRef

enum LessonCategory { AUTO TAXI MOTORRAD LKW ANHAENGER_BE }
enum LessonStatus   { GEPLANT ABSOLVIERT STORNIERT NO_SHOW }
enum PaymentMethod  { BAR TWINT KARTE }
enum PaymentStatus  { OFFEN BEZAHLT ERSTATTET }

// Interne Schülerkartei. KEIN Login, KEIN User-Bezug.
model StudentRecord {
  id                    String    @id @default(cuid())
  firstName             String
  lastName              String
  phone                 String
  email                 String?
  notes                 String?
  practicalExamPassedAt DateTime?   // Basis der WAB-Erinnerung
  wabReminderSentAt     DateTime?   // verhindert Doppelversand
  packages              LessonPackage[]
  lessons               Lesson[]
}

model LessonPackage {
  id             String  @id @default(cuid())
  studentId      String
  category       LessonCategory
  size           Int       // 1 | 5 | 10
  pricePerLesson Decimal @db.Decimal(8,2)
  lessonsUsed    Int     @default(0)
  paymentMethod  PaymentMethod
  paymentStatus  PaymentStatus @default(OFFEN)
  createdAt      DateTime @default(now())
}

model Lesson {
  id           String @id @default(cuid())
  studentId    String
  instructorId String   // Zuweisung ausschliesslich durch den Admin
  category     LessonCategory
  date         DateTime @db.Date
  startTime    String
  durationMin  Int
  pickupNote   String?
  status       LessonStatus @default(GEPLANT)
  packageId    String?
}
```

### Feature-Specs

1. **Online-Zahlung**: Payrexx (TWINT + Karte), Bar bleibt Option im Checkout. Gast-Checkout, kein Konto nötig. Webhook setzt `paymentStatus`. Erstattung bei Kursabsage manuell aus dem Admin, mit Log. Konto läuft auf die Fahrschule (Entscheidung 9).
2. **Warteliste**: ausgebuchter Kurs zeigt "Auf Warteliste eintragen" statt nichts. Läuft über E-Mail und Telefon aus dem Formular, ohne Konto. Bei Storno: Benachrichtigung mit Buchungslink oder Auto-Nachrücken (Entscheidung 13). Admin sieht die Warteliste pro Kurs.
3. **Schülerkartei & Lektionsverwaltung (intern)**: Admin und Fahrlehrer legen Schüler an, erfassen Abos (1/5/10, Preise aus Abschnitt 5) und Lektionen. Der Admin weist den Fahrlehrer pro Lektion zu. Abgehakte Lektion zählt das Abo herunter (Entscheidung 11). Kunden sehen davon nichts, der Fahrstunden-Kontakt bleibt WhatsApp und Telefon.
4. **WAB-Erinnerung**: Admin oder Fahrlehrer trägt die bestandene praktische Prüfung in der Schülerkartei ein. Monatlicher Cron: 11 Monate nach Prüfungsdatum Mail mit TCS-Link + Gutscheincode Ausilia20, `wabReminderSentAt` verhindert Doppelversand.
5. **Google-Reviews-Widget**: Places API oder in Settings gepflegte Reviews, immer mit Sternen, Namen und Google-Link.
6. **Mehrsprachigkeit**: next-intl mit DE als Referenz, EN/IT/SQ. Sprachumschalter im Header, hreflang-Tags, Kursbeschreibungen mit Übersetzungsfeldern im Admin (Entscheidung 12).

### Sprints Welle 2

| Sprint | Umfang | DoD |
|---|---|---|
| 7 Zahlung + Warteliste (2 T) | Payrexx-Integration, Webhooks, Zahlstatus im Admin und in der Abrechnung, WAITLIST-Flow | Testzahlung Ende-zu-Ende als Gast, Warteliste greift nach Storno |
| 8 Schülerkartei & Lektionen (2 T) | StudentRecord, Abo-Erfassung, Lektionen planen und abhaken im Admin und im Fahrlehrer-Portal, Fahrlehrer-Zuweisung pro Lektion | Abo-Stand stimmt nach abgehakter Lektion, Zuweisung nur durch Admin möglich |
| 9 WAB + Reviews (1 T) | Prüfungsdatum-Erfassung, WAB-Cron, Reviews-Widget | Test-Erinnerung ausgelöst und geloggt, Widget live |
| 10 Mehrsprachigkeit (2-3 T) | next-intl, Übersetzungen EN/IT/SQ, Sprachumschalter, hreflang, Sitemap pro Sprache | Alle Kernseiten in 4 Sprachen, SEO-Tags korrekt |
| Go-Live 2 (0.5 T) | Feature-Ankündigung, Schulung Ausilia + Fahrlehrer | Volle Plattform live |

---

## 15. Neuer Arbeitsblock: 36 Logins und Datenübernahme (Kundenentscheid 26.07.2026)

Zwei Antworten der Kundin erweitern den Umfang. Beide sind machbar, keine davon ist Tagesarbeit.

### 15.1 Logins für alle 36 Kursleiter

Bisher geplant: drei Logins. Neu: alle. Das ändert nicht die Rollen (weiterhin nur ADMIN und INSTRUCTOR, kein Kunden-Login), aber es ändert die Kontoverwaltung.

Nicht machbar ist der bisherige Weg über Seed-Passwörter in `.env`. 36 Passwörter in einer Datei zu pflegen und einzeln zu verteilen ist fehleranfällig und unsicher. Stattdessen:

- **Kein E-Mail-abhängiger Flow.** Kundenentscheid 26.07.2026: die Kursleiter erhalten provisorische @haudi.ch-Adressen ohne echtes Postfach, Passwörter verteilt Ausilia persönlich. Ein Einladungs- oder Reset-Link per Mail würde ins Leere laufen. Deshalb: **Passwortvergabe direkt im Admin-Panel**. Ausilia legt ein Konto an, das System zeigt ein einmalig generiertes Passwort im Panel an (kopierbar, danach nur noch als Hash gespeichert), sie gibt es weiter. Gleiches gilt für "Passwort zurücksetzen".
- **Erzwungener Wechsel beim ersten Login** (`mustChangePassword`), damit das von Ausilia verteilte Passwort nicht dauerhaft in Umlauf bleibt.
- **E-Mail-Adresse pro Konto im Admin änderbar**, damit die echten Adressen später ohne Datenverlust nachgezogen werden. Sobald echte Postfächer existieren, kann der Reset-per-Mail-Flow nachgerüstet werden.
- **Keine Instruktoren-Benachrichtigungen** an diese Adressen verdrahten, solange die Postfächer nicht existieren. Mailversand betrifft in Welle 1 ausschliesslich Kunden und die Adresse info@haudi.ch.
- **Onboarding gestaffelt**: zuerst Ausilia, Luca und Bernadette, dann der Rest nach dem Go-Live. Ein Rollout an 36 Personen gleichzeitig erzeugt Supportlast beim Start.
- **Konten deaktivieren statt löschen**: `Instructor.active` und `User.active` steuern Sichtbarkeit und Zugang getrennt.
- **Sicherheitsfolge**: 36 Konten sind 36 mögliche Einstiegspunkte. Rate-Limit am Login bleibt, zusätzlich Session-Laufzeit begrenzen und im Admin eine Liste "letzter Login" führen, damit ungenutzte Konten auffallen.

Aufwand: rund 1 Tag (Einladungs-Flow, Kontoverwaltung im Admin, Mailvorlage).

### 15.2 Datenübernahme aus dem Altsystem: ZURÜCKGESTELLT (27.07.2026)

Die Kundin verfügt aktuell über keinen Export. Entscheid: Start ohne Altdaten, das neue System beginnt mit neuen Kursen und Anmeldungen. Eine spätere Übernahme wird separat geprüft.

Folgen für Welle 1: kein Importskript, kein Feldabgleich, kein Abgleichlauf. Der Aufwand von 1 bis 3 Tagen entfällt.

Falls die Übernahme später doch kommt, gilt unverändert: zuerst eine Musterdatei mit 10 bis 20 Zeilen anfordern, Importskript idempotent mit Trockenlauf und Protokoll bauen, importierte Buchungen markieren, alte Kursleiter-Kürzel auf `Instructor.shortCode` mappen und unbekannte Kürzel protokollieren statt still verwerfen. Personendaten inklusive Geburtsdatum und Ausweisnummer, deshalb Aufbewahrungsfrist in der Datenschutzerklärung festhalten und Exportdateien nach dem Import löschen.

Praktische Konsequenz für den Launch: da keine Altdaten übernommen werden, muss beim Umschalten der DNS klar sein, welche Kurse im Altsystem noch offene Anmeldungen haben. Diese Teilnehmer werden vom Altsystem aus bedient oder manuell im neuen System erfasst. Vor Go-Live 1 mit Ausilia durchgehen.

### 15.3 Auswirkung auf Zeitplan und Offerte

Nach dem Wegfall der Datenübernahme bleibt als Zusatzumfang nur die Kontoverwaltung für 36 Kursleiter, rund 1 Tag. Neuer Gesamtaufwand rund 18 bis 23 Tage. Die Kontoverwaltung gehört als eigene Position in die Offerte. Die Datenübernahme wird als optionale Position mit Aufwand nach Aufwand ausgewiesen, falls sie später kommt.