-- Die E-Mail-Adresse einer Buchung wird optional.
--
-- Im Onlineformular bleibt sie Pflicht. Bei einer telefonischen Anmeldung gibt
-- es Leute ohne Adresse, besonders bei den Nothelferkursen; eine erfundene
-- Adresse waere schlimmer als keine.
--
-- Rein erweiternd: bestehende Zeilen behalten ihren Wert, nichts wird
-- geloescht und keine Anwendung bricht, die die Spalte liest.
ALTER TABLE "booking" ALTER COLUMN "email" DROP NOT NULL;
