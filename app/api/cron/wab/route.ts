import { NextResponse } from "next/server";
import { wabLaufAusfuehren } from "@/lib/wab";

/**
 * Monatlicher Lauf der WAB-Erinnerung (PLAN.md Abschnitt 14, Spec 4).
 *
 * Ausgeloest vom Cron in vercel.json. Vercel schickt dabei den Header
 * `authorization: Bearer <CRON_SECRET>` mit, wenn CRON_SECRET in der Umgebung
 * gesetzt ist.
 *
 * WARUM DIE PRUEFUNG SEIN MUSS
 *
 * Ohne sie koennte jeder, der die Adresse kennt oder erraet, einen Massenversand
 * an Fahrschueler ausloesen — und weil jeder Lauf `wabReminderSentAt` setzt,
 * waeren die Betroffenen danach als erinnert markiert, ohne je etwas bekommen
 * zu haben. Die Frist liefe still weiter.
 *
 * Fehlt CRON_SECRET, antwortet die Route mit 503 statt zu laufen. Ein offener
 * Endpunkt waere schlimmer als ein nicht laufender Cron: den nicht laufenden
 * merkt man an leeren Erinnerungen, den offenen niemand.
 */

/** Kein Vorhalten: der Lauf schreibt in die Datenbank. */
export const dynamic = "force-dynamic";

export async function GET(anfrage: Request): Promise<NextResponse> {
  const geheimnis = process.env.CRON_SECRET;

  if (!geheimnis) {
    console.error(
      "[Cron WAB] CRON_SECRET fehlt. Der Lauf wurde nicht ausgeführt.",
    );
    return NextResponse.json(
      { fehler: "CRON_SECRET ist nicht gesetzt." },
      { status: 503 },
    );
  }

  const mitgegeben = anfrage.headers.get("authorization");
  if (mitgegeben !== `Bearer ${geheimnis}`) {
    return NextResponse.json({ fehler: "Nicht erlaubt." }, { status: 401 });
  }

  const lauf = await wabLaufAusfuehren();

  // Ins Log, weil der Cron sonst spurlos laeuft. Die Zahlen stehen ausserdem
  // im Panel bei jedem Schueler.
  console.info(
    `[Cron WAB] ${lauf.benachrichtigt} angeschrieben ` +
      `(${lauf.gesendet} gesendet, ${lauf.nurProtokolliert} nur protokolliert, ` +
      `${lauf.fehler} Fehler), ${lauf.ohneAdresse} ohne Adresse.`,
  );

  return NextResponse.json(lauf);
}
