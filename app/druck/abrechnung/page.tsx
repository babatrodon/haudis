import Image from "next/image";
import { AbrechnungBericht } from "@/components/admin/abrechnung-bericht";
import { DruckKnopf } from "@/components/admin/druck-knopf";
import {
  BASIS_TEXT,
  abrechnungLesen,
  basisAus,
  monatsVorgabe,
  zeitfensterAus,
} from "@/lib/abrechnung";
import { requireSession } from "@/lib/auth-guard";
import { datum } from "@/lib/format";
import { instruktorProfilZuBenutzer } from "@/lib/instruktoren";
import { ADRESSE } from "@/lib/kontakt";
import { prisma } from "@/lib/db";

/**
 * Abrechnung auf Papier.
 *
 * Eine Route fuer beide Rollen, mit einem harten Unterschied: die Admin darf
 * jeden Fahrlehrer drucken, ein Kursleiter ausschliesslich sich selbst. Der
 * Parameter aus der Adresse wird fuer ihn nicht gelesen, sondern durch sein
 * eigenes Profil ersetzt — sonst waere die fremde Abrechnung eine Zeile in der
 * Adresszeile entfernt.
 *
 * Die gewaehlte Basis steht im Kopf. Ein Blatt ohne diese Angabe laesst sich
 * nicht mehr zuordnen, sobald zwei Ausdrucke nebeneinander liegen.
 */
export default async function AbrechnungDruckSeite({
  searchParams,
}: {
  searchParams: Promise<{
    von?: string;
    bis?: string;
    basis?: string;
    fahrlehrer?: string;
  }>;
}) {
  const benutzer = await requireSession();
  const parameter = await searchParams;
  const vorgabe = monatsVorgabe();

  const von = gueltigerTag(parameter.von) ?? vorgabe.von;
  const bis = gueltigerTag(parameter.bis) ?? vorgabe.bis;
  const basis = basisAus(parameter.basis);

  let fahrlehrerId: string | undefined;
  if (benutzer.role === "ADMIN") {
    fahrlehrerId = parameter.fahrlehrer || undefined;
  } else {
    const profil = await instruktorProfilZuBenutzer(benutzer.id);
    if (!profil) {
      return (
        <main className="mx-auto max-w-[210mm] bg-white p-6 text-black">
          <p>
            Diesem Konto ist kein Fahrlehrer-Profil zugeordnet. Ohne Profil gibt
            es keine Provisionsabrechnung.
          </p>
        </main>
      );
    }
    fahrlehrerId = profil.id;
  }

  const abrechnung = await abrechnungLesen(
    zeitfensterAus(von, bis, basis),
    fahrlehrerId,
  );

  const fuer = fahrlehrerId
    ? await prisma.instructor.findUnique({
        where: { id: fahrlehrerId },
        select: { firstName: true, lastName: true, shortCode: true },
      })
    : null;

  return (
    <main className="mx-auto max-w-[210mm] bg-white p-6 text-black print:max-w-none print:p-0">
      <DruckKnopf hinweis="A4, Zeitraum und Basis stehen im Kopf." />

      <div className="mb-4 border-b-2 border-black pb-2">
        {/* priority statt Lazy-Loading: der Druckdialog wartet nicht, bis ein
                   Bild nachgeladen ist. Ohne das bleibt der Kopf auf dem Papier leer. */}
              <Image
                src="/haudis-logo.png"
                alt={ADRESSE.firma}
                width={1600}
                height={1073}
                priority
                className="mb-2 h-10 w-auto"
              />
              <p className="text-[9pt] font-semibold uppercase tracking-[0.15em]">
          {ADRESSE.firma}
        </p>
        <h1 className="mt-1 text-[18pt] font-bold leading-tight">
          Abrechnung
          {fuer ? ` ${fuer.lastName} ${fuer.firstName} (${fuer.shortCode})` : ""}
        </h1>
        <p className="mt-1 text-[10pt]">
          {datum(new Date(`${von}T00:00:00Z`))} bis{" "}
          {datum(new Date(`${bis}T00:00:00Z`))} · Zeitraum nach{" "}
          {BASIS_TEXT[basis]}
        </p>
      </div>

      <AbrechnungBericht abrechnung={abrechnung} fuerDruck />

      <p className="mt-6 text-[9pt]">Gedruckt am {datum(new Date())}</p>
    </main>
  );
}

function gueltigerTag(wert: string | undefined): string | undefined {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return undefined;
  return Number.isNaN(Date.parse(wert)) ? undefined : wert;
}
