"use client";

import { useActionState, useId, useState } from "react";
import { AlertTriangle, CalendarPlus, PackagePlus } from "lucide-react";
import { LektionZeile } from "@/components/admin/lektion-zeile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { chf, datum, datumLang } from "@/lib/format";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { ABO_GROESSEN, KATEGORIE_TEXT } from "@/lib/inhalte/lektionen";
import { cn } from "@/lib/utils";
import type { SchuelerKartei } from "@/lib/admin/schueler";
import type { InstruktorAuswahl } from "@/lib/instruktoren";
import {
  aboAnlegenAktion,
  aboZahlstatusAktion,
  lektionPlanenAktion,
  pruefungEintragenAktion,
  schuelerAendernAktion,
  wabWiederholenAktion,
  type SchuelerMeldung,
} from "@/app/admin/schueler/aktionen";

/**
 * Die Kartei eines Schuelers im Panel.
 *
 * Reihenfolge nach dem, was Ausilia am haeufigsten braucht: Abos mit ihrem
 * Stand, dann die Lektionen, dann die Angaben und die Pruefung. Der Abo-Stand
 * ist die Zahl, wegen der diese Seite geoeffnet wird.
 */
export function SchuelerKarteiAnsicht({
  kartei,
  instruktoren,
  preisVorschlag,
  versandAktiv,
}: {
  kartei: SchuelerKartei;
  instruktoren: InstruktorAuswahl[];
  /** Preis pro Lektion je Kategorie aus den Einstellungen. */
  preisVorschlag: Record<string, string>;
  versandAktiv: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Abos kartei={kartei} preisVorschlag={preisVorschlag} />
      <Lektionen kartei={kartei} instruktoren={instruktoren} />
      <Pruefung kartei={kartei} versandAktiv={versandAktiv} />
      <Angaben kartei={kartei} />
    </div>
  );
}

function Abschnitt({
  titel,
  children,
  aktion,
}: {
  titel: string;
  children: React.ReactNode;
  aktion?: React.ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-flaeche-3 px-4 py-3 sm:px-5">
        <h2 id={id} className="font-heading text-lg font-bold">
          {titel}
        </h2>
        {aktion}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Meldung({ meldung }: { meldung: SchuelerMeldung }) {
  if (!meldung) return null;
  return (
    <Alert
      variant={"fehler" in meldung ? "destructive" : "default"}
      className="mt-3"
    >
      <AlertDescription>
        {"fehler" in meldung ? meldung.fehler : meldung.erledigt}
      </AlertDescription>
    </Alert>
  );
}

function Abos({
  kartei,
  preisVorschlag,
}: {
  kartei: SchuelerKartei;
  preisVorschlag: Record<string, string>;
}) {
  const [offen, setOffen] = useState(false);
  const [meldung, anlegen, laeuft] = useActionState<SchuelerMeldung, FormData>(
    aboAnlegenAktion,
    null,
  );
  const [zahlMeldung, zahlstatus] = useActionState<SchuelerMeldung, FormData>(
    aboZahlstatusAktion,
    null,
  );
  const [kategorie, setKategorie] = useState("AUTO");

  return (
    <Abschnitt
      titel="Abos"
      aktion={
        <Button variant="outline" size="sm" onClick={() => setOffen(!offen)}>
          <PackagePlus aria-hidden="true" className="size-4" />
          {offen ? "Abbrechen" : "Abo erfassen"}
        </Button>
      }
    >
      {offen ? (
        <form
          action={anlegen}
          className="mb-5 grid grid-cols-1 gap-4 border-b border-flaeche-3 pb-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input type="hidden" name="studentId" value={kartei.id} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="abo-kategorie">Kategorie</Label>
            <select
              id="abo-kategorie"
              name="kategorie"
              value={kategorie}
              onChange={(e) => setKategorie(e.target.value)}
              className="h-12 w-full border border-input bg-card px-3.5 text-base"
            >
              {Object.entries(KATEGORIE_TEXT).map(([wert, text]) => (
                <option key={wert} value={wert}>
                  {text}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="abo-groesse">Grösse</Label>
            <select
              id="abo-groesse"
              name="groesse"
              defaultValue="5"
              className="h-12 w-full border border-input bg-card px-3.5 text-base"
            >
              {ABO_GROESSEN.map((groesse) => (
                <option key={groesse} value={groesse}>
                  {groesse === 1 ? "Einzellektion" : `${groesse}er-Abo`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="abo-preis">Preis pro Lektion</Label>
            <Input
              id="abo-preis"
              name="preisProLektion"
              inputMode="decimal"
              // Vorschlag aus den Einstellungen; fuer Motorrad und Anhaenger BE
              // ist dort nichts hinterlegt, dann bleibt das Feld leer und
              // Ausilia traegt den Preis ein.
              key={kategorie}
              defaultValue={preisVorschlag[kategorie] ?? ""}
              placeholder="90.00"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="abo-zahlart">Zahlart</Label>
            <select
              id="abo-zahlart"
              name="zahlart"
              defaultValue="BAR"
              className="h-12 w-full border border-input bg-card px-3.5 text-base"
            >
              <option value="BAR">Bar</option>
              <option value="TWINT">TWINT</option>
              <option value="KARTE">Karte</option>
            </select>
          </div>

          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" name="bezahlt" className="size-5" />
            <span className="text-sm">Bereits bezahlt</span>
          </label>

          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" disabled={laeuft}>
              {laeuft ? "Wird erfasst …" : "Abo erfassen"}
            </Button>
          </div>
        </form>
      ) : null}

      <Meldung meldung={meldung} />
      <Meldung meldung={zahlMeldung} />

      {kartei.abos.length === 0 ? (
        <p className="text-muted-foreground">
          Noch kein Abo erfasst. Lektionen lassen sich trotzdem planen, zum
          Beispiel die Gratis-Probelektion.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {kartei.abos.map((abo) => (
            <li
              key={abo.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-flaeche-3 bg-flaeche-1 p-4"
            >
              <div>
                <p className="font-heading font-bold">
                  {abo.groesse === 1
                    ? "Einzellektion"
                    : `${abo.groesse}er-Abo`}{" "}
                  {KATEGORIE_TEXT[abo.kategorie]}
                </p>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {chf(abo.preisProLektion)} pro Lektion · erfasst am{" "}
                  {datum(abo.angelegtAm)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <p className="text-center">
                  <span
                    className={cn(
                      "block font-heading text-2xl font-bold tabular-nums",
                      abo.offen === 0 ? "text-muted-foreground" : "",
                    )}
                  >
                    {abo.offen}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    von {abo.groesse} offen
                  </span>
                </p>

                <form action={zahlstatus}>
                  <input type="hidden" name="aboId" value={abo.id} />
                  <input type="hidden" name="studentId" value={kartei.id} />
                  <input
                    type="hidden"
                    name="bezahlt"
                    value={abo.zahlstatus === "BEZAHLT" ? "false" : "true"}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant={abo.zahlstatus === "BEZAHLT" ? "ghost" : "outline"}
                  >
                    {abo.zahlstatus === "BEZAHLT"
                      ? `Bezahlt${abo.bezahltAm ? ` am ${datum(abo.bezahltAm)}` : ""}`
                      : "Als bezahlt vermerken"}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Abschnitt>
  );
}

function Lektionen({
  kartei,
  instruktoren,
}: {
  kartei: SchuelerKartei;
  instruktoren: InstruktorAuswahl[];
}) {
  const [offen, setOffen] = useState(false);
  const [meldung, planen, laeuft] = useActionState<SchuelerMeldung, FormData>(
    lektionPlanenAktion,
    null,
  );

  const offeneAbos = kartei.abos.filter((abo) => abo.offen > 0);

  return (
    <Abschnitt
      titel="Lektionen"
      aktion={
        <Button variant="outline" size="sm" onClick={() => setOffen(!offen)}>
          <CalendarPlus aria-hidden="true" className="size-4" />
          {offen ? "Abbrechen" : "Lektion planen"}
        </Button>
      }
    >
      {offen ? (
        <form
          action={planen}
          className="mb-5 grid grid-cols-1 gap-4 border-b border-flaeche-3 pb-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <input type="hidden" name="studentId" value={kartei.id} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="lektion-fahrlehrer">Fahrlehrer</Label>
            <select
              id="lektion-fahrlehrer"
              name="instructorId"
              required
              defaultValue=""
              className="h-12 w-full border border-input bg-card px-3.5 text-base"
            >
              <option value="" disabled>
                Bitte wählen
              </option>
              {instruktoren.map((eintrag) => (
                <option key={eintrag.id} value={eintrag.id}>
                  {eintrag.anzeige}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lektion-kategorie">Kategorie</Label>
            <select
              id="lektion-kategorie"
              name="kategorie"
              defaultValue="AUTO"
              className="h-12 w-full border border-input bg-card px-3.5 text-base"
            >
              {Object.entries(KATEGORIE_TEXT).map(([wert, text]) => (
                <option key={wert} value={wert}>
                  {text}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lektion-abo">Auf Abo</Label>
            <select
              id="lektion-abo"
              name="packageId"
              defaultValue={offeneAbos[0]?.id ?? ""}
              className="h-12 w-full border border-input bg-card px-3.5 text-base"
            >
              <option value="">Ohne Abo</option>
              {offeneAbos.map((abo) => (
                <option key={abo.id} value={abo.id}>
                  {abo.groesse}er {KATEGORIE_TEXT[abo.kategorie]} — {abo.offen}{" "}
                  offen
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lektion-datum">Datum</Label>
            <Input id="lektion-datum" name="datum" type="date" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lektion-zeit">Startzeit</Label>
            <Input
              id="lektion-zeit"
              name="startzeit"
              type="time"
              defaultValue="09:00"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lektion-dauer">Dauer in Minuten</Label>
            <Input
              id="lektion-dauer"
              name="dauerMinuten"
              type="number"
              min={15}
              max={480}
              step={5}
              defaultValue={45}
              required
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="lektion-abholort">Abholort (freiwillig)</Label>
            <Input
              id="lektion-abholort"
              name="abholort"
              placeholder="Haselstrasse 33"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={laeuft}>
              {laeuft ? "Wird geplant …" : "Lektion planen"}
            </Button>
          </div>
        </form>
      ) : null}

      <Meldung meldung={meldung} />

      {kartei.lektionen.length === 0 ? (
        <p className="text-muted-foreground">Noch keine Lektion geplant.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {kartei.lektionen.map((lektion) => (
            <li key={lektion.id}>
              <LektionZeile lektion={lektion} studentId={kartei.id} />
            </li>
          ))}
        </ul>
      )}
    </Abschnitt>
  );
}

function Pruefung({
  kartei,
  versandAktiv,
}: {
  kartei: SchuelerKartei;
  versandAktiv: boolean;
}) {
  const [meldung, eintragen, laeuft] = useActionState<
    SchuelerMeldung,
    FormData
  >(pruefungEintragenAktion, null);
  const [wabMeldung, wiederholen, wabLaeuft] = useActionState<
    SchuelerMeldung,
    FormData
  >(wabWiederholenAktion, null);

  const feldWert = kartei.pruefungAm
    ? kartei.pruefungAm.toISOString().slice(0, 10)
    : "";

  return (
    <Abschnitt titel="Praktische Prüfung und WAB">
      <form action={eintragen} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="studentId" value={kartei.id} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="pruefung-am">Bestanden am</Label>
          <Input
            id="pruefung-am"
            name="pruefungAm"
            type="date"
            defaultValue={feldWert}
            className="w-48"
          />
        </div>
        <Button type="submit" disabled={laeuft}>
          {laeuft ? "Wird gespeichert …" : "Speichern"}
        </Button>
      </form>

      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Die WAB-Erinnerung geht elf Monate nach diesem Datum raus. Der Kurs muss
        innerhalb von zwölf Monaten absolviert sein.
      </p>

      <Meldung meldung={meldung} />

      {kartei.pruefungAm ? (
        <div className="mt-4 border-t border-flaeche-3 pt-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Erinnerung:</span>{" "}
            <WabText kartei={kartei} />
          </p>

          {kartei.wabGesendetAm && kartei.wabMailStatus !== "gesendet" ? (
            <form action={wiederholen} className="mt-3">
              <input type="hidden" name="studentId" value={kartei.id} />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={wabLaeuft || !versandAktiv}
                title={
                  versandAktiv
                    ? undefined
                    : "Ohne Versandschlüssel geht keine E-Mail raus"
                }
              >
                {wabLaeuft ? "Wird gesendet …" : "Nochmals senden"}
              </Button>
            </form>
          ) : null}

          {!kartei.email ? (
            <p className="mt-3 flex items-start gap-2 text-sm font-medium text-ampel-rot">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
                Ohne E-Mail-Adresse kann keine Erinnerung rausgehen. Diese Person
                muss angerufen werden:{" "}
                <a
                  href={`tel:${kartei.telefon.replace(/\s/g, "")}`}
                  className="tabular-nums underline underline-offset-4"
                >
                  {kartei.telefon}
                </a>
              </span>
            </p>
          ) : null}

          <Meldung meldung={wabMeldung} />
        </div>
      ) : null}
    </Abschnitt>
  );
}

/** Der WAB-Stand im Klartext, ohne Beschoenigung. */
function WabText({ kartei }: { kartei: SchuelerKartei }) {
  if (!kartei.wabGesendetAm) {
    return <span className="text-muted-foreground">noch nicht verschickt</span>;
  }
  const wann = datumLang(kartei.wabGesendetAm);
  if (kartei.wabMailStatus === "gesendet") {
    return <span className="text-ampel-gruen">am {wann} verschickt</span>;
  }
  if (kartei.wabMailStatus === "protokolliert") {
    return (
      <span className="font-medium text-ampel-rot">
        am {wann} nur protokolliert, keine E-Mail verschickt — bitte anrufen (
        {TELEFONNUMMERN[0].anzeige} für Rückfragen)
      </span>
    );
  }
  return (
    <span className="font-medium text-ampel-rot">
      am {wann} fehlgeschlagen
      {kartei.wabMailGrund ? `: ${kartei.wabMailGrund}` : ""} — bitte anrufen
    </span>
  );
}

function Angaben({ kartei }: { kartei: SchuelerKartei }) {
  const [meldung, speichern, laeuft] = useActionState<SchuelerMeldung, FormData>(
    schuelerAendernAktion,
    null,
  );

  return (
    <Abschnitt titel="Angaben">
      <form action={speichern} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="studentId" value={kartei.id} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="a-vorname">Vorname</Label>
          <Input id="a-vorname" name="vorname" defaultValue={kartei.vorname} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="a-nachname">Nachname</Label>
          <Input id="a-nachname" name="nachname" defaultValue={kartei.nachname} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="a-telefon">Telefon</Label>
          <Input id="a-telefon" name="telefon" type="tel" defaultValue={kartei.telefon} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="a-email">E-Mail</Label>
          <Input
            id="a-email"
            name="email"
            type="email"
            defaultValue={kartei.email ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="a-notiz">Notiz</Label>
          <textarea
            id="a-notiz"
            name="notiz"
            rows={3}
            defaultValue={kartei.notiz ?? ""}
            className="w-full border border-input bg-card px-3.5 py-3 text-base"
          />
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={laeuft}>
            {laeuft ? "Wird gespeichert …" : "Speichern"}
          </Button>
        </div>
      </form>

      <Meldung meldung={meldung} />
    </Abschnitt>
  );
}
