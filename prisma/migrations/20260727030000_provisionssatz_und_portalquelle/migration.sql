-- Provisionssatz auf der Buchung und eine dritte Anmeldequelle.
--
-- Beides rein erweiternd: keine Spalte verschwindet, kein bestehender Wert
-- aendert sich, und jede laufende Anwendung liest weiter, was sie kennt.

-- Die Anmeldung durch einen Kursleiter im Portal ist weder eine Onlinebuchung
-- noch eine telefonische Erfassung. Sie bekommt einen eigenen Wert, weil die
-- Buchungsansicht telefonisch Angemeldete markiert: das sind die Leute ohne
-- etwas Schriftliches, und eine Portal-Anmeldung erhaelt eine Bestaetigung.
--
-- ADD VALUE laeuft seit Postgres 12 auch in einer Transaktion, solange der
-- neue Wert darin nicht benutzt wird. Der Backfill unten benutzt ihn nicht.
ALTER TYPE "BookingSource" ADD VALUE 'INSTRUCTOR';

-- Der Provisionssatz zum Zeitpunkt der Zuweisung, dieselbe Idee wie
-- priceCharged. Ohne ihn wuerde eine Satzaenderung im Jahr 2027 die
-- Abrechnung von 2026 rueckwirkend umschreiben.
ALTER TABLE "booking" ADD COLUMN "commissionRate" DECIMAL(8,2);

-- Bestehende Zuweisungen bekommen den heute gueltigen Satz ihres Instruktors.
-- Einen anderen gab es nie: der Satz ist seit dem Seed unveraendert.
UPDATE "booking" AS b
SET "commissionRate" = i."provisionPerBooking"
FROM "instructor" AS i
WHERE b."referredById" = i."id"
  AND b."commissionRate" IS NULL;
