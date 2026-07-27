import { Mail, MessageCircle, Phone, UserPlus } from "lucide-react";
import { BuchungBearbeitenDialog } from "@/components/admin/buchung-bearbeiten-dialog";
import { SariKnopf } from "@/components/admin/sari-knopf";
import { chf, datum } from "@/lib/format";
import { telLink, whatsappLink } from "@/lib/telefon";
import { cn } from "@/lib/utils";
import type { BuchungZeile } from "@/lib/admin/buchungen";
import type { InstruktorAuswahl } from "@/components/admin/buchung-bearbeiten-dialog";

/**
 * Eine Buchung als Karte.
 *
 * Gebaut fuer den haeufigsten Fall: Ausilia steht zwischen zwei Lektionen, hat
 * das Handy in einer Hand und will wissen, wer das ist, ob der Ausweis
 * vorliegt, und die Person anrufen. Deshalb stehen Name, Ausweisstatus und der
 * Anrufknopf ganz oben und in dieser Reihenfolge; der Knopf ist so gross, dass
 * er mit dem Daumen sicher zu treffen ist.
 *
 * Alles Weitere — Geburtsdatum, Adresse, Preis, Kuerzel — steht darunter in
 * einer Zeile. Es wird gelesen, wenn man danach sucht, nicht im Vorbeigehen.
 */
export function BuchungKarte({
  buchung,
  nummer,
  kursId,
  kursName,
  instruktoren,
  naechsteWartende,
}: {
  buchung: BuchungZeile;
  nummer: number;
  kursId: string;
  kursName: string;
  instruktoren: InstruktorAuswahl[];
  /** Wer beim Stornieren dieses Platzes eingeladen wird. */
  naechsteWartende?: string;
}) {
  const storniert = buchung.status === "CANCELLED";
  const telefonisch = buchung.quelle === "PHONE";

  return (
    <div
      className={cn(
        "border border-border bg-card p-4",
        storniert && "border-dashed opacity-70",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 font-heading text-sm font-semibold tabular-nums text-muted-foreground">
            {nummer}
          </span>
          <h3 className="min-w-0 font-heading text-lg font-bold">
            {buchung.nachname} {buchung.vorname}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {storniert ? (
            <span className="border border-ampel-rot-linie bg-ampel-rot-bg px-2 py-1 text-xs font-semibold text-ampel-rot">
              Storniert
            </span>
          ) : null}
          {/*
            Telefonisch Angemeldete haben nie etwas Schriftliches bekommen
            (Geschaeftsregel 4). Wer das beim Nachfragen nicht sieht, verweist
            auf eine Bestaetigungsmail, die es nie gab.
          */}
          {telefonisch ? (
            <span
              data-kennzeichen="telefonisch"
              className="inline-flex items-center gap-1.5 border border-flaeche-3 bg-flaeche-2 px-2 py-1 text-xs font-semibold"
            >
              <Phone aria-hidden="true" className="size-3" />
              Telefonisch
            </span>
          ) : null}
          {/* Ueber das Portal angemeldet: hat eine Bestaetigung bekommen,
              anders als eine telefonische Erfassung. */}
          {buchung.quelle === "INSTRUCTOR" ? (
            <span
              data-kennzeichen="fahrlehrer"
              className="inline-flex items-center gap-1.5 border border-flaeche-3 bg-flaeche-2 px-2 py-1 text-xs font-semibold"
            >
              <UserPlus aria-hidden="true" className="size-3" />
              Fahrlehrer
            </span>
          ) : null}
          {buchung.fruehbucher ? (
            <span className="border border-ampel-gelb-linie bg-ampel-gelb-bg px-2 py-1 text-xs font-semibold">
              Frühbucher
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-1">
        {buchung.lfaNummer ? (
          <span className="font-semibold tabular-nums">
            Ausweis {buchung.lfaNummer}
          </span>
        ) : (
          <span
            data-kennzeichen="ausweis-fehlt"
            className="font-semibold text-ampel-rot"
          >
            Ausweisnummer fehlt
          </span>
        )}
      </p>

      {/* Direkt erreichbar, ohne Umweg ueber eine Detailansicht. */}
      <div className="mt-3 flex flex-wrap items-stretch gap-2">
        <a
          href={telLink(buchung.telefon)}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-primary bg-primary px-4 text-base font-medium tabular-nums text-primary-foreground transition-colors hover:bg-primary/80 sm:flex-none"
        >
          <Phone aria-hidden="true" className="size-4" />
          {buchung.telefon}
        </a>
        <a
          href={whatsappLink(
            buchung.telefon,
            `Hoi ${buchung.vorname}, hier Haudi's Fahrschule zum ${kursName}.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${buchung.vorname} ${buchung.nachname} auf WhatsApp schreiben`}
          className="inline-flex size-12 shrink-0 items-center justify-center border border-border bg-card transition-colors hover:bg-flaeche-2"
        >
          <MessageCircle aria-hidden="true" className="size-5" />
        </a>
        {/* Ohne Adresse gibt es nichts zu oeffnen. Der Platz bleibt trotzdem
            besetzt, damit die Knopfreihe nicht von Karte zu Karte springt. */}
        {buchung.email ? (
          <a
            href={`mailto:${buchung.email}`}
            aria-label={`${buchung.vorname} ${buchung.nachname} eine E-Mail schreiben`}
            className="inline-flex size-12 shrink-0 items-center justify-center border border-border bg-card transition-colors hover:bg-flaeche-2"
          >
            <Mail aria-hidden="true" className="size-5" />
          </a>
        ) : (
          <span
            title="Keine E-Mail-Adresse hinterlegt"
            className="inline-flex size-12 shrink-0 items-center justify-center border border-dashed border-linie-stark text-muted-foreground"
          >
            <Mail aria-hidden="true" className="size-5" />
            <span className="sr-only">Keine E-Mail-Adresse hinterlegt</span>
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {datum(buchung.geburtsdatum)} · {buchung.strasse}, {buchung.plz}{" "}
        {buchung.ort} · <span className="tabular-nums">{chf(buchung.preis)}</span>
        {buchung.fahrlehrer ? (
          <>
            {" · "}
            <span
              className="font-semibold text-foreground"
              title={buchung.fahrlehrer.name}
            >
              {buchung.fahrlehrer.kuerzel}
            </span>
          </>
        ) : null}
      </p>
      <p className="text-sm break-all text-muted-foreground">
        {buchung.email ?? "Keine E-Mail-Adresse"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-flaeche-3 pt-3">
        <SariKnopf
          lfaNummer={buchung.lfaNummer}
          name={`${buchung.vorname} ${buchung.nachname}`}
        />
        <BuchungBearbeitenDialog
          buchung={buchung}
          kursId={kursId}
          instruktoren={instruktoren}
          naechsteWartende={naechsteWartende}
        />
      </div>
    </div>
  );
}
