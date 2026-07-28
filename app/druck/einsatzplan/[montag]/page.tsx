import Image from "next/image";
import { notFound } from "next/navigation";
import { DruckKnopf } from "@/components/admin/druck-knopf";
import { einsatzplanWoche } from "@/lib/admin/einsatzplan";
import { tagePlus, wochenStartKalender } from "@/lib/admin/zeitraum";
import { requireRole } from "@/lib/auth-guard";
import { datum, datumLang } from "@/lib/format";
import { ADRESSE } from "@/lib/kontakt";

/**
 * Einsatzplan einer Woche auf Papier.
 *
 * Haengt im Buero. Deshalb quer statt hoch: eine Woche mit sieben Tagen und
 * bis zu vier Bloecken pro Abend liest sich auf einem breiten Blatt besser.
 *
 * Konflikte werden auch hier ausgewiesen. Ein Blatt, das eine Doppelbelegung
 * verschweigt, ist schlimmer als keines: es sieht nach Ordnung aus.
 */
export default async function EinsatzplanDruckSeite({
  params,
}: {
  params: Promise<{ montag: string }>;
}) {
  await requireRole("ADMIN");
  const { montag } = await params;

  if (Number.isNaN(Date.parse(montag))) notFound();
  const start = wochenStartKalender(new Date(`${montag}T00:00:00.000Z`));
  const plan = await einsatzplanWoche(start);

  const mitTerminen = plan.tage.filter((tag) => tag.termine.length > 0);

  return (
    <main className="mx-auto max-w-[297mm] bg-white p-6 text-black print:max-w-none print:p-0">
      <DruckKnopf hinweis="A4 quer einstellen, dann passt die Woche auf ein Blatt." />

      <div className="mb-3 border-b-2 border-black pb-2">
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
          Einsatzplan {datum(start)} bis {datum(tagePlus(start, 6))}
        </h1>
        {plan.offen > 0 ? (
          <p className="mt-1 text-[10pt]">
            {plan.offen} {plan.offen === 1 ? "Termin" : "Termine"} ohne
            Kursleitung
          </p>
        ) : null}
      </div>

      {plan.konflikte.length > 0 ? (
        <div className="mb-4 border-2 border-black p-3">
          <p className="text-[11pt] font-bold">
            Achtung: {plan.konflikte.length}{" "}
            {plan.konflikte.length === 1 ? "Doppelbelegung" : "Doppelbelegungen"}
          </p>
          <ul className="mt-1 text-[10pt]">
            {plan.konflikte.map((konflikt, index) => (
              <li key={index}>
                {konflikt.instruktor.kuerzel} am {datum(konflikt.datum)}:{" "}
                {konflikt.erster.kursName} {konflikt.erster.von}–
                {konflikt.erster.bis} gegen {konflikt.zweiter.kursName}{" "}
                {konflikt.zweiter.von}–{konflikt.zweiter.bis}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mitTerminen.length === 0 ? (
        <p className="text-[11pt]">In dieser Woche findet kein Kurs statt.</p>
      ) : (
        <table className="w-full border-collapse text-[10pt]">
          <thead className="table-header-group">
            <tr className="border-b border-black text-[9pt] uppercase tracking-wide">
              <th className="w-[38mm] py-1 text-left font-semibold">Tag</th>
              <th className="w-[26mm] py-1 text-left font-semibold">Zeit</th>
              <th className="py-1 text-left font-semibold">Kurs</th>
              <th className="w-[45mm] py-1 text-left font-semibold">
                Kursleitung
              </th>
            </tr>
          </thead>
          <tbody>
            {mitTerminen.map((tag) =>
              tag.termine.map((termin, index) => (
                <tr
                  key={termin.id}
                  className="break-inside-avoid border-b border-neutral-400"
                >
                  <td className="py-1.5 align-top font-semibold">
                    {/* Der Tag steht nur bei seinem ersten Block, sonst liest
                        sich die Spalte wie ein Stotterer. */}
                    {index === 0 ? datumLang(tag.datum) : ""}
                  </td>
                  <td className="py-1.5 align-top tabular-nums">
                    {termin.von}–{termin.bis}
                  </td>
                  <td className="py-1.5 align-top">{termin.kursName}</td>
                  <td className="py-1.5 align-top">
                    {termin.instruktor
                      ? `${termin.instruktor.kuerzel} ${termin.instruktor.name}`
                      : "— offen —"}
                    {termin.imKonflikt ? " (doppelt belegt)" : ""}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      )}

      <p className="mt-4 text-[9pt]">Gedruckt am {datum(new Date())}</p>
    </main>
  );
}
