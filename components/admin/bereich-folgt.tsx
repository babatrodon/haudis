import { SeitenKopf } from "@/components/admin/admin-huelle";

/**
 * Platzhalter fuer einen Bereich, der in einem spaeteren Block entsteht.
 *
 * Damit fuehrt jeder Eintrag der Navigation von Anfang an irgendwohin. Eine
 * 404-Seite waehrend der Abnahme sieht aus wie ein Fehler, auch wenn sie nur
 * bedeutet, dass die Reihenfolge der Arbeit eine andere war.
 */
export function BereichFolgt({
  titel,
  beschreibung,
  wann,
}: {
  titel: string;
  beschreibung: string;
  wann: string;
}) {
  return (
    <>
      <SeitenKopf titel={titel} beschreibung={beschreibung} />
      <div className="border border-dashed border-linie-stark bg-flaeche-2 p-8 text-center">
        <p className="font-heading text-lg font-bold">Dieser Bereich folgt</p>
        <p className="mx-auto mt-2 max-w-prose text-muted-foreground">
          {wann}
        </p>
      </div>
    </>
  );
}
