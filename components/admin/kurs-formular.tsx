"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FRUEHBUCHER_STANDARD,
  musterFuerKursart,
  stundenPlus,
  tageVerschieben,
  tageZwischen,
  termineAusMuster,
  type Terminvorschlag,
} from "@/lib/inhalte/kursmuster";
import { cn } from "@/lib/utils";
import type { KursErgebnis } from "@/app/admin/kurse/aktionen";

/**
 * Kursformular, benutzt vom Wizard und von "Kurs bearbeiten".
 *
 * Das Erfolgskriterium aus PLAN.md Abschnitt 1 lautet: ein VKU in unter 60
 * Sekunden auf dem iPad. Danach ist alles hier gebaut.
 *
 * Der Hauptweg besteht aus drei Beruehrungen: Kursart antippen, ersten
 * Kurstag waehlen, veroeffentlichen. Preis, Lehrmittel, Limit und
 * Fruehbucherrabatt kommen aus der Kursart beziehungsweise aus dem
 * Kundenentscheid und stehen deshalb unter "Weitere Einstellungen". Jedes Feld
 * mehr auf dem Hauptweg kostet bei jedem einzelnen Kurs Zeit.
 *
 * Die Kursart ist eine Reihe von Knoepfen, kein Auswahlfeld: ein select oeffnet
 * auf dem iPad ein Rad, das man drehen, treffen und bestaetigen muss.
 */

export type KursartAuswahl = {
  id: string;
  code: string;
  name: string;
  /** Als Zeichenkette, Decimal ueberlebt die Grenze zum Client nicht. */
  grundpreis: string;
  materialpreis: string;
  onlineLimit: number;
};

export type KursVorgabe = {
  kursId: string;
  kursartId: string;
  termine: Terminvorschlag[];
  preis: string;
  materialpreis: string;
  onlineLimit: string;
  fruehbucherProzent: string;
  fruehbucherPlaetze: string;
  notizen: string;
  veroeffentlicht: boolean;
};

type Props = {
  kursarten: KursartAuswahl[];
  aktion: (
    bisher: KursErgebnis,
    formular: FormData,
  ) => Promise<KursErgebnis>;
  vorgabe?: KursVorgabe;
  /** Wohin "Abbrechen" fuehrt. */
  zurueck: string;
};

const OHNE_MUSTER = "frei";

export function KursFormular({ kursarten, aktion, vorgabe, zurueck }: Props) {
  const [ergebnis, absenden, laeuft] = useActionState<KursErgebnis, FormData>(
    aktion,
    null,
  );

  const bearbeiten = vorgabe !== undefined;

  // Beim Anlegen ist die erste Kursart vorgewaehlt, samt ihren Preisen. Wer
  // einen VKU anlegt, muss sie dann gar nicht mehr antippen; wer etwas anderes
  // anlegt, tippt einmal und bekommt die passenden Werte.
  const start = kursarten[0];

  const [kursartId, setKursartId] = useState(
    vorgabe?.kursartId ?? start?.id ?? "",
  );
  const [termine, setTermine] = useState<Terminvorschlag[]>(
    vorgabe?.termine ?? [],
  );
  const [erstesDatum, setErstesDatum] = useState(
    vorgabe?.termine[0]?.datum ?? "",
  );
  const [musterId, setMusterId] = useState(
    // Beim Bearbeiten kein Muster: die Termine des Kurses stehen schon, und ein
    // vorgewaehltes Muster wuerde sie beim ersten Datumswechsel ueberschreiben.
    bearbeiten ? OHNE_MUSTER : (musterFuerKursart(start?.code ?? "")[0]?.id ?? OHNE_MUSTER),
  );

  const [preis, setPreis] = useState(vorgabe?.preis ?? start?.grundpreis ?? "");
  const [materialpreis, setMaterialpreis] = useState(
    vorgabe?.materialpreis ?? start?.materialpreis ?? "",
  );
  const [onlineLimit, setOnlineLimit] = useState(
    vorgabe?.onlineLimit ?? String(start?.onlineLimit ?? ""),
  );
  const [fruehbucherProzent, setFruehbucherProzent] = useState(
    vorgabe?.fruehbucherProzent ?? FRUEHBUCHER_STANDARD.prozent,
  );
  const [fruehbucherPlaetze, setFruehbucherPlaetze] = useState(
    vorgabe?.fruehbucherPlaetze ?? FRUEHBUCHER_STANDARD.plaetze,
  );
  const [notizen, setNotizen] = useState(vorgabe?.notizen ?? "");
  const [weitereOffen, setWeitereOffen] = useState(false);

  const kursart = kursarten.find((eintrag) => eintrag.id === kursartId);
  const muster = kursart ? musterFuerKursart(kursart.code) : [];
  const weitereId = useId();

  // Beim Anlegen die Werte der Kursart uebernehmen, sobald eine gewaehlt ist.
  // Beim Bearbeiten gelten die Werte des Kurses, bis die Kursart bewusst
  // gewechselt wird — dann sind die alten Preise ohnehin die falschen.
  function kursartWaehlen(neueId: string): void {
    setKursartId(neueId);
    const gewaehlt = kursarten.find((eintrag) => eintrag.id === neueId);
    if (!gewaehlt) return;

    setPreis(gewaehlt.grundpreis);
    setMaterialpreis(gewaehlt.materialpreis);
    setOnlineLimit(String(gewaehlt.onlineLimit));

    const passende = musterFuerKursart(gewaehlt.code);
    const neuesMuster = passende[0];
    setMusterId(neuesMuster?.id ?? OHNE_MUSTER);
    if (neuesMuster && erstesDatum) {
      setTermine(termineAusMuster(neuesMuster, erstesDatum));
    }
  }

  function musterWaehlen(id: string): void {
    setMusterId(id);
    const gewaehlt = muster.find((eintrag) => eintrag.id === id);
    if (gewaehlt && erstesDatum) {
      setTermine(termineAusMuster(gewaehlt, erstesDatum));
    }
  }

  /**
   * Der erste Kurstag ist der einzige Termin, den Ausilia wirklich waehlt.
   *
   * Stehen schon Termine, werden sie um dieselbe Spanne verschoben statt neu
   * erzeugt: wer den zweiten Block von Hand angepasst hat und dann den Kurs
   * eine Woche spaeter legt, verliert die Anpassung sonst wortlos.
   */
  function erstesDatumSetzen(neu: string): void {
    const vorher = erstesDatum;
    setErstesDatum(neu);
    if (!neu) return;

    if (termine.length === 0) {
      const gewaehlt = muster.find((eintrag) => eintrag.id === musterId);
      setTermine(
        gewaehlt
          ? termineAusMuster(gewaehlt, neu)
          : [{ datum: neu, von: "", bis: "" }],
      );
      return;
    }

    const versatz = vorher
      ? tageZwischen(vorher, neu)
      : tageZwischen(termine[0].datum, neu);
    setTermine(
      termine.map((termin) => ({
        ...termin,
        datum: tageVerschieben(termin.datum, versatz),
      })),
    );
  }

  function terminAendern(
    index: number,
    feld: keyof Terminvorschlag,
    wert: string,
  ): void {
    setTermine(
      termine.map((termin, position) =>
        position === index ? { ...termin, [feld]: wert } : termin,
      ),
    );
    if (index === 0 && feld === "datum") setErstesDatum(wert);
  }

  /** Neuer Block schliesst an den letzten an: von = bisheriges Ende, plus 2 h. */
  function blockHinzufuegen(): void {
    const letzter = termine.at(-1);
    setTermine([
      ...termine,
      letzter
        ? {
            datum: letzter.datum,
            von: letzter.bis,
            bis: stundenPlus(letzter.bis, 2),
          }
        : { datum: erstesDatum, von: "", bis: "" },
    ]);
  }

  function blockEntfernen(index: number): void {
    setTermine(termine.filter((_, position) => position !== index));
  }

  return (
    <form action={absenden} className="flex flex-col gap-8">
      {vorgabe ? (
        <input type="hidden" name="kursId" value={vorgabe.kursId} />
      ) : null}
      <input type="hidden" name="kursartId" value={kursartId} />
      <input type="hidden" name="termine" value={JSON.stringify(termine)} />
      <input type="hidden" name="preis" value={preis} />
      <input type="hidden" name="materialpreis" value={materialpreis} />
      <input type="hidden" name="onlineLimit" value={onlineLimit} />
      <input
        type="hidden"
        name="fruehbucherProzent"
        value={fruehbucherProzent}
      />
      <input
        type="hidden"
        name="fruehbucherPlaetze"
        value={fruehbucherPlaetze}
      />
      <input type="hidden" name="notizen" value={notizen} />

      {ergebnis?.fehler ? (
        <Alert variant="destructive">
          <AlertDescription>{ergebnis.fehler}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold">Kursart</h2>
        <div className="flex flex-wrap gap-2">
          {kursarten.map((eintrag) => (
            <Button
              key={eintrag.id}
              type="button"
              variant={eintrag.id === kursartId ? "default" : "outline"}
              onClick={() => kursartWaehlen(eintrag.id)}
              aria-pressed={eintrag.id === kursartId}
            >
              {eintrag.name}
            </Button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold">Erster Kurstag</h2>
        <div className="flex flex-col gap-2 sm:max-w-64">
          <Label htmlFor="erstesDatum" className="sr-only">
            Erster Kurstag
          </Label>
          <Input
            id="erstesDatum"
            type="date"
            value={erstesDatum}
            onChange={(ereignis) => erstesDatumSetzen(ereignis.target.value)}
          />
        </div>
        {termine.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Ein anderes Datum verschiebt alle Termine mit.
          </p>
        ) : null}
      </section>

      {muster.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-bold">Ablauf</h2>
          <div className="flex flex-wrap gap-2">
            {muster.map((eintrag) => (
              <Button
                key={eintrag.id}
                type="button"
                variant={eintrag.id === musterId ? "default" : "outline"}
                onClick={() => musterWaehlen(eintrag.id)}
                aria-pressed={eintrag.id === musterId}
                title={eintrag.hinweis}
              >
                {eintrag.name}
              </Button>
            ))}
            <Button
              type="button"
              variant={musterId === OHNE_MUSTER ? "default" : "outline"}
              onClick={() => setMusterId(OHNE_MUSTER)}
              aria-pressed={musterId === OHNE_MUSTER}
            >
              Frei
            </Button>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-heading text-lg font-bold">
            Termine
            {termine.length > 0 ? (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {termine.length}{" "}
                {termine.length === 1 ? "Block" : "Blöcke"}
              </span>
            ) : null}
          </h2>
        </div>

        {termine.length === 0 ? (
          <p className="border border-dashed border-linie-stark p-5 text-muted-foreground">
            Wähle den ersten Kurstag, dann erscheinen die Blöcke hier.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {termine.map((termin, index) => (
              <li
                key={index}
                className="flex flex-wrap items-end gap-3 border border-border bg-card p-3"
              >
                <div className="flex min-w-40 flex-1 flex-col gap-1.5">
                  <Label
                    htmlFor={`termin-datum-${index}`}
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    Datum
                  </Label>
                  <Input
                    id={`termin-datum-${index}`}
                    type="date"
                    value={termin.datum}
                    onChange={(ereignis) =>
                      terminAendern(index, "datum", ereignis.target.value)
                    }
                  />
                </div>
                <div className="flex w-28 flex-col gap-1.5">
                  <Label
                    htmlFor={`termin-von-${index}`}
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    Von
                  </Label>
                  <Input
                    id={`termin-von-${index}`}
                    type="time"
                    value={termin.von}
                    onChange={(ereignis) =>
                      terminAendern(index, "von", ereignis.target.value)
                    }
                  />
                </div>
                <div className="flex w-28 flex-col gap-1.5">
                  <Label
                    htmlFor={`termin-bis-${index}`}
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    Bis
                  </Label>
                  <Input
                    id={`termin-bis-${index}`}
                    type="time"
                    value={termin.bis}
                    onChange={(ereignis) =>
                      terminAendern(index, "bis", ereignis.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => blockEntfernen(index)}
                  aria-label={`Block ${index + 1} entfernen`}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div>
          <Button type="button" variant="outline" onClick={blockHinzufuegen}>
            <Plus aria-hidden="true" className="size-4" />
            Block hinzufügen
          </Button>
        </div>
      </section>

      <section className="border-t border-flaeche-3 pt-4">
        <button
          type="button"
          onClick={() => setWeitereOffen(!weitereOffen)}
          aria-expanded={weitereOffen}
          aria-controls={weitereId}
          className="flex min-h-12 w-full items-center justify-between gap-3 text-left font-heading text-lg font-bold"
        >
          Weitere Einstellungen
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-5 shrink-0 transition-transform",
              weitereOffen && "rotate-180",
            )}
          />
        </button>
        <p className="text-sm text-muted-foreground">
          Preis, Plätze und Frühbucher sind bereits gesetzt
          {kursart ? ` (aus ${kursart.name})` : ""}.
        </p>

        <div
          id={weitereId}
          hidden={!weitereOffen}
          className="mt-5 flex flex-col gap-5"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Feld
              id="preis"
              label="Kursgebühr (CHF)"
              value={preis}
              onChange={setPreis}
              inputMode="decimal"
            />
            <Feld
              id="materialpreis"
              label="Lehrmittel (CHF)"
              value={materialpreis}
              onChange={setMaterialpreis}
              inputMode="decimal"
            />
            <Feld
              id="onlineLimit"
              label="Plätze"
              value={onlineLimit}
              onChange={setOnlineLimit}
              inputMode="numeric"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Feld
              id="fruehbucherProzent"
              label="Frühbucherrabatt (%)"
              value={fruehbucherProzent}
              onChange={setFruehbucherProzent}
              inputMode="decimal"
              hinweis="Leer lassen, wenn dieser Kurs keinen Rabatt hat."
            />
            <Feld
              id="fruehbucherPlaetze"
              label="Für die ersten … Anmeldungen"
              value={fruehbucherPlaetze}
              onChange={setFruehbucherPlaetze}
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notizen">Interne Notiz</Label>
            <Textarea
              id="notizen"
              value={notizen}
              onChange={(ereignis) => setNotizen(ereignis.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Nur im Panel sichtbar, nie auf der Website.
            </p>
          </div>
        </div>
      </section>

      {/*
        Zwei Absendeknoepfe statt einer Auswahl. name/value entscheiden, ob der
        Kurs oeffentlich wird — ein Schalter mehr waere ein Handgriff mehr.
      */}
      <div className="flex flex-wrap gap-3 border-t border-flaeche-3 pt-6">
        <Button
          type="submit"
          name="veroeffentlichen"
          value="true"
          size="lg"
          disabled={laeuft}
        >
          {laeuft
            ? "Wird gespeichert ..."
            : bearbeiten
              ? "Speichern und veröffentlichen"
              : "Veröffentlichen"}
        </Button>
        <Button
          type="submit"
          name="veroeffentlichen"
          value="false"
          variant="outline"
          size="lg"
          disabled={laeuft}
        >
          Als Entwurf sichern
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href={zurueck}>Abbrechen</Link>
        </Button>
      </div>
    </form>
  );
}

function Feld({
  id,
  label,
  value,
  onChange,
  hinweis,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (wert: string) => void;
  hinweis?: string;
} & Omit<React.ComponentProps<"input">, "onChange" | "value" | "id">) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(ereignis) => onChange(ereignis.target.value)}
        {...rest}
      />
      {hinweis ? (
        <p className="text-sm text-muted-foreground">{hinweis}</p>
      ) : null}
    </div>
  );
}
