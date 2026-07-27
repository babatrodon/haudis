import Link from "next/link";
import { KeyRound } from "lucide-react";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { ProfilFehlt } from "@/components/portal/profil-fehlt";
import { Button } from "@/components/ui/button";
import { requireInstruktorProfil } from "@/lib/auth-guard";
import { chf } from "@/lib/format";
import { TELEFONNUMMERN } from "@/lib/kontakt";

/**
 * Profil.
 *
 * Nur lesen. Name, Kuerzel und Provisionssatz pflegt die Administration
 * (Geschaeftsregel 10 und 5); wer sie hier aendern koennte, koennte seine
 * eigene Provision setzen. Aenderbar ist genau das, was niemand sonst wissen
 * darf: das Passwort.
 */
export default async function ProfilSeite() {
  const { benutzer, profil } = await requireInstruktorProfil();
  if (!profil) return <ProfilFehlt name={benutzer.name} />;

  return (
    <>
      <SeitenKopf
        titel="Profil"
        beschreibung="Angaben und Passwort"
        aktionen={
          <Button asChild variant="outline">
            <Link href="/team/passwort">
              <KeyRound aria-hidden="true" className="size-4" />
              Passwort ändern
            </Link>
          </Button>
        }
      />

      <dl className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
        <Feld bezeichnung="Name" wert={`${profil.lastName} ${profil.firstName}`} />
        <Feld bezeichnung="Kürzel" wert={profil.shortCode} />
        <Feld bezeichnung="Anmeldung" wert={benutzer.email} />
        <Feld
          bezeichnung="Provision pro Anmeldung"
          wert={chf(profil.provisionPerBooking)}
        />
      </dl>

      <p className="mt-6 max-w-prose text-sm text-muted-foreground">
        Name, Kürzel und Provisionssatz pflegt die Administration. Stimmt etwas
        nicht, meldest Du Dich am besten direkt:
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {TELEFONNUMMERN.map((nummer) => (
          <a
            key={nummer.tel}
            href={`tel:${nummer.tel}`}
            className="inline-flex min-h-12 items-center border border-border bg-card px-4 font-medium tabular-nums transition-colors hover:bg-flaeche-2"
          >
            {nummer.anzeige}
          </a>
        ))}
      </div>
    </>
  );
}

function Feld({ bezeichnung, wert }: { bezeichnung: string; wert: string }) {
  return (
    <div className="bg-card p-4 sm:p-5">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {bezeichnung}
      </dt>
      <dd className="mt-1 font-medium break-words">{wert}</dd>
    </div>
  );
}
