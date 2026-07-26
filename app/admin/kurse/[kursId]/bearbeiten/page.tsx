import { notFound } from "next/navigation";
import { SeitenKopf } from "@/components/admin/admin-huelle";
import { KursFormular } from "@/components/admin/kurs-formular";
import { alsFeldwert, kursLesen, kursartenFuerAuswahl } from "@/lib/admin/kurse";
import { requireRole } from "@/lib/auth-guard";
import { kursAktualisierenAktion } from "../../aktionen";

export default async function KursBearbeitenSeite({
  params,
}: {
  params: Promise<{ kursId: string }>;
}) {
  await requireRole("ADMIN");
  const { kursId } = await params;

  const [kurs, kursarten] = await Promise.all([
    kursLesen(kursId),
    kursartenFuerAuswahl(),
  ]);

  if (!kurs) notFound();

  return (
    <>
      <SeitenKopf
        titel={`${kurs.courseType.name} bearbeiten`}
        beschreibung={
          kurs._count.bookings > 0
            ? `${kurs._count.bookings} ${kurs._count.bookings === 1 ? "Person ist" : "Personen sind"} angemeldet. Eine Änderung an Datum oder Zeit erreicht sie nicht von selbst.`
            : undefined
        }
      />

      <KursFormular
        kursarten={kursarten.map((kursart) => ({
          id: kursart.id,
          code: kursart.code,
          name: kursart.name,
          grundpreis: kursart.basePrice.toString(),
          materialpreis: kursart.materialPrice.toString(),
          onlineLimit: kursart.onlineLimit,
        }))}
        aktion={kursAktualisierenAktion}
        zurueck={`/admin/kurse/${kurs.id}`}
        vorgabe={{
          kursId: kurs.id,
          kursartId: kurs.courseTypeId,
          termine: kurs.sessions.map((termin) => ({
            datum: alsFeldwert(termin.date),
            von: termin.startTime,
            bis: termin.endTime,
          })),
          preis: kurs.price.toString(),
          materialpreis: kurs.materialPrice.toString(),
          onlineLimit: String(kurs.onlineLimit),
          fruehbucherProzent: kurs.earlyBirdPercent?.toString() ?? "",
          fruehbucherPlaetze: kurs.earlyBirdSlots
            ? String(kurs.earlyBirdSlots)
            : "",
          notizen: kurs.notes ?? "",
          veroeffentlicht: kurs.status === "PUBLISHED",
        }}
      />
    </>
  );
}
