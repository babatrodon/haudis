import { chf, datum } from "@/lib/format";
import { BASIS_TEXT, type Abrechnung } from "@/lib/abrechnung";
import { cn } from "@/lib/utils";

/**
 * Der Provisionsbericht.
 *
 * Gebaut nach der einen Anforderung, an der dieser Sprint gemessen wird:
 * Ausilia rechnet seit Jahren von Hand und wird die ersten Monate
 * gegenpruefen. Deshalb steht hier nicht nur das Ergebnis, sondern der Weg
 * dorthin — jede Person namentlich, jedes Zwischentotal, und die Provision als
 * ausgeschriebene Rechnung «3 × CHF 50.00 = CHF 150.00».
 *
 * Dieselbe Komponente traegt das Panel, das Portal und den Ausdruck. Zwei
 * Darstellungen derselben Zahlen wuerden frueher oder spaeter abweichen, und
 * dann glaubt niemand mehr einer von beiden.
 */
export function AbrechnungBericht({
  abrechnung,
  fuerDruck = false,
}: {
  abrechnung: Abrechnung;
  /** Im Druck ohne Kaesten und Farbflaechen. */
  fuerDruck?: boolean;
}) {
  const rahmen = fuerDruck ? "" : "border border-border bg-card";

  if (abrechnung.anzahl === 0) {
    return (
      <div className={cn(rahmen, "p-5")}>
        <p className="text-muted-foreground">
          In diesem Zeitraum gibt es keine Anmeldung.
        </p>
        {abrechnung.ausgeschlossen.anzahl > 0 ? (
          <p className="mt-2 text-sm">
            {ausgeschlossenText(abrechnung)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="summe-titel"
        className={cn(rahmen, "p-4 sm:p-5")}
      >
        <h2
          id="summe-titel"
          className={cn("font-heading font-bold", fuerDruck ? "text-[12pt]" : "text-lg")}
        >
          Zusammenfassung
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-3">
          <Kennzahl
            bezeichnung="Anmeldungen"
            wert={String(abrechnung.anzahl)}
            fuerDruck={fuerDruck}
          />
          <Kennzahl
            bezeichnung="Umsatz"
            wert={chf(abrechnung.umsatz)}
            fuerDruck={fuerDruck}
          />
          <Kennzahl
            bezeichnung="Provision"
            wert={chf(abrechnung.provision)}
            betont
            fuerDruck={fuerDruck}
          />
        </dl>
        {abrechnung.ausgeschlossen.anzahl > 0 ? (
          <p className="mt-3 border-t border-flaeche-3 pt-3 text-sm">
            {ausgeschlossenText(abrechnung)}
          </p>
        ) : null}
      </section>

      {abrechnung.bloecke.map((block) => (
        <section
          key={block.instruktorId ?? "ohne"}
          aria-label={block.name}
          className={cn(rahmen, "break-inside-avoid")}
        >
          <h2
            className={cn(
              "border-b border-flaeche-3 px-4 py-3 font-heading font-bold sm:px-5",
              fuerDruck ? "text-[12pt]" : "text-lg",
            )}
          >
            {block.name}
            {block.instruktorId ? (
              <span className="ml-2 font-normal tabular-nums text-muted-foreground">
                {block.kuerzel}
              </span>
            ) : null}
          </h2>

          {block.kursarten.map((gruppe) => (
            <div key={gruppe.code} className="border-b border-flaeche-3">
              <h3 className="px-4 pt-3 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground sm:px-5">
                {gruppe.name}
              </h3>

              {/* Waagrecht rollbar statt gestaucht: eine Abrechnungstabelle
                  mit sechs Spalten passt auf 390px nicht, und Zahlen, die
                  umbrechen, liest niemand nach. */}
              <div className="overflow-x-auto px-4 pb-3 pt-2 sm:px-5">
                <table className="w-full min-w-[34rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-flaeche-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-1 pr-3 font-semibold">Anrede</th>
                      <th className="py-1 pr-3 font-semibold">Name</th>
                      <th className="py-1 pr-3 font-semibold">Ort</th>
                      <th className="py-1 pr-3 font-semibold">Angemeldet</th>
                      <th className="py-1 pr-3 font-semibold">Kurs</th>
                      <th className="py-1 text-right font-semibold">Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gruppe.zeilen.map((zeile) => (
                      <tr
                        key={zeile.buchungId}
                        className="break-inside-avoid border-b border-flaeche-2 last:border-b-0"
                      >
                        <td className="py-1.5 pr-3">{zeile.anrede}</td>
                        <td className="py-1.5 pr-3">
                          {zeile.nachname} {zeile.vorname}
                        </td>
                        <td className="py-1.5 pr-3">{zeile.ort}</td>
                        <td className="py-1.5 pr-3 tabular-nums">
                          {datum(zeile.angemeldetAm)}
                        </td>
                        <td className="py-1.5 pr-3 tabular-nums">
                          {zeile.kursdatum ? datum(zeile.kursdatum) : "—"}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {chf(zeile.betrag)}
                          {zeile.fruehbucher ? (
                            <span
                              title="Frühbucherrabatt"
                              className="ml-1 text-muted-foreground"
                            >
                              F
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-linie-stark font-semibold">
                      <td className="py-1.5 pr-3" colSpan={4}>
                        Zwischentotal {gruppe.name}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">
                        {gruppe.anzahl}{" "}
                        {gruppe.anzahl === 1 ? "Anmeldung" : "Anmeldungen"}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {chf(gruppe.umsatz)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="px-4 py-3 sm:px-5">
            <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-muted-foreground">
                {block.anzahl}{" "}
                {block.anzahl === 1 ? "Anmeldung" : "Anmeldungen"} im Zeitraum
              </span>
              <span className="tabular-nums">
                Umsatz {chf(block.umsatz)}
              </span>
            </p>

            {/*
              Die Rechnung ausgeschrieben. Ausilia soll sie mit dem Bleistift
              nachvollziehen koennen, ohne zu wissen, wie das Programm rechnet.
              Bei zwei verschiedenen Saetzen stehen zwei Zeilen da statt einer
              Multiplikation, die nicht aufgeht.
            */}
            {block.posten.length > 0 ? (
              <div className="mt-2 border-t border-flaeche-3 pt-2">
                {block.posten.map((posten) => (
                  <p
                    key={posten.satz.toString()}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 tabular-nums"
                  >
                    <span>
                      {posten.anzahl} × {chf(posten.satz)}
                    </span>
                    <span>{chf(posten.betrag)}</span>
                  </p>
                ))}
                <p className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 border-t border-linie-stark pt-1 font-heading font-bold tabular-nums">
                  <span>Provision {block.kuerzel}</span>
                  <span>{chf(block.provision)}</span>
                </p>
              </div>
            ) : (
              <p className="mt-2 border-t border-flaeche-3 pt-2 text-sm text-muted-foreground">
                Keine Zuweisung, keine Provision.
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function ausgeschlossenText(abrechnung: Abrechnung): string {
  const { anzahl, umsatz } = abrechnung.ausgeschlossen;
  return anzahl === 1
    ? `Eine stornierte Anmeldung über ${chf(umsatz)} ist nicht mitgezählt. Storniertes zählt weder zum Umsatz noch zur Provision.`
    : `${anzahl} stornierte Anmeldungen über ${chf(umsatz)} sind nicht mitgezählt. Storniertes zählt weder zum Umsatz noch zur Provision.`;
}

function Kennzahl({
  bezeichnung,
  wert,
  betont = false,
  fuerDruck = false,
}: {
  bezeichnung: string;
  wert: string;
  betont?: boolean;
  fuerDruck?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{bezeichnung}</dt>
      <dd
        className={cn(
          "font-heading font-bold tabular-nums",
          betont && !fuerDruck ? "text-2xl" : "text-lg",
        )}
      >
        {wert}
      </dd>
    </div>
  );
}

/** Kopfzeile mit Zeitraum und Basis. Steht im Panel wie auf dem Papier. */
export function AbrechnungKopf({ abrechnung }: { abrechnung: Abrechnung }) {
  return (
    <p className="text-muted-foreground">
      {datum(new Date(`${abrechnung.zeitfenster.vonTag}T00:00:00Z`))} bis{" "}
      {datum(new Date(`${abrechnung.zeitfenster.bisTag}T00:00:00Z`))} · Basis{" "}
      {BASIS_TEXT[abrechnung.zeitfenster.basis]}
    </p>
  );
}
