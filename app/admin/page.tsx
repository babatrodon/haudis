import { SeitenKopf } from "@/components/admin/admin-huelle";
import { requireRole } from "@/lib/auth-guard";

/**
 * Uebersicht.
 *
 * Die Kennzahlen und Listen entstehen im zweiten Teil von Block A, sobald die
 * Navigation abgenommen ist. Bis dahin steht hier, was kommt: so laesst sich
 * die Huelle bei allen Breiten beurteilen, ohne dass halbfertige Widgets den
 * Blick auf die Navigation verstellen.
 */
export default async function AdminUebersicht() {
  const benutzer = await requireRole("ADMIN");

  const geplant = [
    {
      titel: "Nächste sieben Tage",
      text: "Alle Termine mit Kursart, Zeit und zugewiesenem Kursleiter. Wo noch niemand zugewiesen ist, fällt es hier auf.",
    },
    {
      titel: "Füllstand pro Kurs",
      text: "Balken je ausgeschriebenem Kurs, mit denselben Ampelschwellen wie auf der öffentlichen Seite.",
    },
    {
      titel: "Anmeldungen heute und diese Woche",
      text: "Getrennt nach online und telefonisch.",
    },
    {
      titel: "Umsatz des Monats",
      text: "Zwei Zahlen: nach Anmeldedatum und nach Kursdatum, beide beschriftet.",
    },
    {
      titel: "Schnellzugriff",
      text: "Neuer Kurs und telefonische Anmeldung, ohne Umweg über die Listen.",
    },
  ];

  return (
    <>
      <SeitenKopf
        titel={`Grüezi ${benutzer.name.split(" ")[0]}`}
        beschreibung="Übersicht über die kommenden Tage und die laufenden Anmeldungen."
      />

      <div className="border border-dashed border-linie-stark bg-flaeche-2 p-6">
        <p className="font-heading text-lg font-bold">
          Die Kennzahlen folgen gleich
        </p>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Zuerst steht die Navigation zur Abnahme an. Sobald sie passt, kommen
          an dieser Stelle die folgenden Bereiche.
        </p>
      </div>

      {/*
        Eigene Rahmen statt der Rasterlinie aus bg-border und gap-px: bei
        ungerader Anzahl bleibt sonst die letzte Zelle leer und zeigt die
        Rahmenfarbe als grauen Block. Die Kacheln des Dashboards sind nie
        garantiert vollzaehlig, deshalb hier die robustere Variante.
      */}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {geplant.map((eintrag) => (
          <li key={eintrag.titel} className="border border-border bg-card p-5">
            <h2 className="font-heading font-bold">{eintrag.titel}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{eintrag.text}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
