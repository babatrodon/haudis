"use client";

import { useActionState } from "react";
import { AlertTriangle, Phone } from "lucide-react";
import { TelefonAnmeldung } from "@/components/admin/telefon-anmeldung";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { datum, datumZeit } from "@/lib/format";
import { TELEFONNUMMERN } from "@/lib/kontakt";
import { cn } from "@/lib/utils";
import type { InstruktorAuswahl } from "@/lib/instruktoren";
import type { WartelisteZeile } from "@/lib/admin/warteliste";
import {
  einladungErneutSendenAktion,
  wartelisteBenachrichtigenAktion,
  wartendenEntfernenAktion,
  type BuchungErgebnisMeldung,
} from "@/app/admin/buchungen/aktionen";

/**
 * Warteliste eines Kurses im Panel.
 *
 * Steht auf derselben Seite wie die Buchungen, direkt unter den Stornos: wer
 * hier eine Buchung storniert, sieht im selben Bildschirm, wer daraufhin
 * eingeladen wurde. Eine eigene Seite haette diesen Zusammenhang zerschnitten.
 *
 * Der auffaelligste Teil ist der Hinweis oben, wenn kein Versandschluessel
 * gesetzt ist. Ohne ihn stuende hier "eingeladen" neben einer Person, die
 * nichts davon weiss.
 */
export function WartelisteAbschnitt({
  kursId,
  zeilen,
  reserviert,
  versandAktiv,
  instruktoren,
}: {
  kursId: string;
  zeilen: WartelisteZeile[];
  reserviert: number;
  /** Ob ein RESEND_API_KEY gesetzt ist. */
  versandAktiv: boolean;
  instruktoren: InstruktorAuswahl[];
}) {
  const [meldung, benachrichtigen, laeuft] = useActionState<
    BuchungErgebnisMeldung,
    FormData
  >(wartelisteBenachrichtigenAktion, null);

  const inSchlange = zeilen.filter((zeile) => zeile.position > 0);

  return (
    <section aria-labelledby="warteliste-titel" className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="warteliste-titel" className="font-heading text-lg font-bold">
          Warteliste
          {inSchlange.length > 0 ? (
            <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
              {inSchlange.length}{" "}
              {inSchlange.length === 1 ? "Person" : "Personen"}
              {reserviert > 0
                ? `, ${reserviert} ${reserviert === 1 ? "Platz" : "Plätze"} reserviert`
                : ""}
            </span>
          ) : null}
        </h2>

        {inSchlange.some((zeile) => zeile.status === "WARTET") ? (
          <form action={benachrichtigen}>
            <input type="hidden" name="kursId" value={kursId} />
            <Button type="submit" variant="outline" size="sm" disabled={laeuft}>
              {laeuft ? "Wird eingeladen …" : "Nächste Person einladen"}
            </Button>
          </form>
        ) : null}
      </div>

      {!versandAktiv ? (
        <Alert className="mb-3 border-ampel-rot-linie bg-ampel-rot-bg">
          <AlertTriangle aria-hidden="true" className="size-4 text-ampel-rot" />
          <AlertDescription className="text-foreground">
            <strong>Es werden keine E-Mails verschickt.</strong> Ohne
            Versandschlüssel wird jede Einladung nur protokolliert. Wer hier als
            eingeladen steht, weiss nichts davon — bitte anrufen:{" "}
            {TELEFONNUMMERN.map((nummer, index) => (
              <span key={nummer.tel}>
                {index > 0 ? " oder " : ""}
                <a
                  href={`tel:${nummer.tel}`}
                  className="font-semibold tabular-nums underline underline-offset-4"
                >
                  {nummer.anzeige}
                </a>
              </span>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}

      {meldung ? (
        <Alert
          variant={"fehler" in meldung ? "destructive" : "default"}
          className="mb-3"
        >
          <AlertDescription>
            {"fehler" in meldung ? meldung.fehler : meldung.erledigt}
          </AlertDescription>
        </Alert>
      ) : null}

      {zeilen.length === 0 ? (
        <p className="border border-border bg-card p-5 text-muted-foreground">
          Für diesen Kurs wartet niemand.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {zeilen.map((zeile) => (
            <li key={zeile.id}>
              <Zeile
                zeile={zeile}
                kursId={kursId}
                versandAktiv={versandAktiv}
                instruktoren={instruktoren}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Zeile({
  zeile,
  kursId,
  versandAktiv,
  instruktoren,
}: {
  zeile: WartelisteZeile;
  kursId: string;
  versandAktiv: boolean;
  instruktoren: InstruktorAuswahl[];
}) {
  const [erneutMeldung, erneutSenden, erneutLaeuft] = useActionState<
    BuchungErgebnisMeldung,
    FormData
  >(einladungErneutSendenAktion, null);
  const [entfernenMeldung, entfernen, entfernenLaeuft] = useActionState<
    BuchungErgebnisMeldung,
    FormData
  >(wartendenEntfernenAktion, null);

  const gestrichen = zeile.status === "ENTFERNT";
  const gebucht = zeile.status === "GEBUCHT";

  return (
    <article
      className={cn(
        "border bg-card p-4 sm:p-5",
        gestrichen || gebucht ? "border-flaeche-3 bg-flaeche-1" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2">
            {zeile.position > 0 ? (
              <span className="font-heading text-lg font-bold tabular-nums">
                {zeile.position}.
              </span>
            ) : null}
            <span
              className={cn(
                "font-heading text-lg font-bold",
                gestrichen ? "line-through" : "",
              )}
            >
              {zeile.nachname} {zeile.vorname}
            </span>
            <ZustandChip zeile={zeile} />
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Eingetragen am {datum(zeile.eingetragenAm)}
            {zeile.frist && zeile.status === "EINGELADEN"
              ? ` · Platz reserviert bis ${datumZeit(zeile.frist)}`
              : ""}
          </p>

          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <a
              href={`tel:${zeile.telefon.replace(/\s/g, "")}`}
              className="inline-flex min-h-11 items-center gap-2 font-semibold tabular-nums"
            >
              <Phone aria-hidden="true" className="size-4" />
              {zeile.telefon}
            </a>
            <a
              href={`mailto:${zeile.email}`}
              className="break-all text-muted-foreground underline-offset-4 hover:underline"
            >
              {zeile.email}
            </a>
          </p>

          {zeile.status === "EINGELADEN" ? (
            <p
              className={cn(
                "mt-2 text-sm",
                zeile.mailStatus === "gesendet"
                  ? "text-muted-foreground"
                  : "font-medium text-ampel-rot",
              )}
            >
              {mailText(zeile)}
            </p>
          ) : null}
        </div>

        {!gestrichen && !gebucht ? (
          <div className="flex flex-wrap gap-2">
            <TelefonAnmeldung
              kurse={[]}
              instruktoren={instruktoren}
              kursId={kursId}
              variante="outline"
              beschriftung="In Buchung umwandeln"
              vorbelegung={{
                vorname: zeile.vorname,
                nachname: zeile.nachname,
                telefon: zeile.telefon,
                email: zeile.email,
              }}
            />

            {zeile.status === "EINGELADEN" && !zeile.abgelaufen ? (
              <form action={erneutSenden}>
                <input type="hidden" name="eintragId" value={zeile.id} />
                <input type="hidden" name="kursId" value={kursId} />
                <Button
                  type="submit"
                  variant="ghost"
                  disabled={erneutLaeuft || !versandAktiv}
                  title={
                    versandAktiv
                      ? undefined
                      : "Ohne Versandschlüssel geht keine E-Mail raus"
                  }
                >
                  {erneutLaeuft ? "Wird gesendet …" : "Nochmals senden"}
                </Button>
              </form>
            ) : null}

            <form action={entfernen}>
              <input type="hidden" name="eintragId" value={zeile.id} />
              <input type="hidden" name="kursId" value={kursId} />
              <Button type="submit" variant="ghost" disabled={entfernenLaeuft}>
                Streichen
              </Button>
            </form>
          </div>
        ) : null}
      </div>

      {erneutMeldung || entfernenMeldung ? (
        <Alert
          variant={
            (erneutMeldung && "fehler" in erneutMeldung) ||
            (entfernenMeldung && "fehler" in entfernenMeldung)
              ? "destructive"
              : "default"
          }
          className="mt-3"
        >
          <AlertDescription>
            {meldungstext(erneutMeldung) ?? meldungstext(entfernenMeldung)}
          </AlertDescription>
        </Alert>
      ) : null}
    </article>
  );
}

function meldungstext(meldung: BuchungErgebnisMeldung): string | null {
  if (!meldung) return null;
  return "fehler" in meldung ? meldung.fehler : meldung.erledigt;
}

/**
 * Was mit der Einladungsmail passiert ist, im Klartext.
 *
 * "protokolliert" heisst: nicht verschickt. Das steht hier ausgeschrieben und
 * nicht als Fachbegriff, weil danach jemand zum Telefon greifen muss.
 */
function mailText(zeile: WartelisteZeile): string {
  if (zeile.abgelaufen) {
    return "Frist abgelaufen, es kam keine Anmeldung. Der Platz ist wieder frei.";
  }
  switch (zeile.mailStatus) {
    case "gesendet":
      return "Einladung per E-Mail verschickt.";
    case "protokolliert":
      return "Keine E-Mail verschickt (kein Versandschlüssel). Bitte anrufen.";
    case "fehler":
      return `E-Mail nicht zugestellt${zeile.mailGrund ? `: ${zeile.mailGrund}` : ""}. Bitte anrufen.`;
    default:
      return "Noch keine Einladung verschickt.";
  }
}

function ZustandChip({ zeile }: { zeile: WartelisteZeile }) {
  const stil: Record<WartelisteZeile["status"], string> = {
    WARTET: "bg-flaeche-2 text-grau-text border-flaeche-3",
    EINGELADEN: zeile.abgelaufen
      ? "bg-flaeche-2 text-grau-text border-flaeche-3"
      : "bg-ampel-gelb-bg text-ampel-gelb border-ampel-gelb-linie",
    GEBUCHT: "bg-ampel-gruen-bg text-ampel-gruen border-ampel-gruen-linie",
    ENTFERNT: "bg-flaeche-2 text-grau-text border-flaeche-3",
  };
  const text: Record<WartelisteZeile["status"], string> = {
    WARTET: "Wartet",
    EINGELADEN: zeile.abgelaufen ? "Frist abgelaufen" : "Eingeladen",
    GEBUCHT: "Hat gebucht",
    ENTFERNT: "Gestrichen",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-xs font-semibold",
        stil[zeile.status],
      )}
    >
      {text[zeile.status]}
    </span>
  );
}
