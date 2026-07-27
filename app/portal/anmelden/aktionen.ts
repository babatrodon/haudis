"use server";

import { revalidatePath } from "next/cache";
import { telefonAnmeldungSchema } from "@/lib/admin/buchung-schema";
import { requireInstruktorProfil } from "@/lib/auth-guard";
import { buchungAnlegen, buchungLesen } from "@/lib/buchung";
import { bestaetigungSenden, interneBenachrichtigungSenden } from "@/lib/mail";

/**
 * Schueler anmelden, PLAN.md Abschnitt 7.
 *
 * Zwei Dinge unterscheiden das von der telefonischen Erfassung im Panel:
 *
 *   Der zuweisende Fahrlehrer wird nicht gewaehlt, sondern ist der
 *   Angemeldete selbst. Er kommt aus der Sitzung und nicht aus dem Formular —
 *   sonst koennte man sich fremde Provisionen zuschreiben, indem man das
 *   abgeschickte Feld manipuliert.
 *
 *   Die Anmeldung wird als INSTRUCTOR gespeichert und loest damit eine
 *   Bestaetigung aus, sofern eine Adresse vorliegt. Nur PHONE bleibt ohne
 *   Mail (Geschaeftsregel 4).
 */

export type AnmeldeMeldung =
  | { fehler: string }
  | { erledigt: string }
  | null;

export async function schuelerAnmeldenAktion(
  _bisher: AnmeldeMeldung,
  formular: FormData,
): Promise<AnmeldeMeldung> {
  const { profil } = await requireInstruktorProfil();
  if (!profil) {
    return {
      fehler:
        "Diesem Konto ist kein Fahrlehrer-Profil zugeordnet. Bitte bei der Administration melden.",
    };
  }

  const geprueft = telefonAnmeldungSchema.safeParse({
    kursId: formular.get("kursId"),
    anrede: formular.get("anrede"),
    nachname: formular.get("nachname"),
    vorname: formular.get("vorname"),
    strasse: formular.get("strasse"),
    plz: formular.get("plz"),
    ort: formular.get("ort"),
    geburtsdatum: formular.get("geburtsdatum"),
    telefon: formular.get("telefon"),
    email: formular.get("email") ?? "",
    lfaNummer: formular.get("lfaNummer") ?? "",
    // Bewusst nicht aus dem Formular: siehe Kopfkommentar.
    fahrlehrerId: profil.id,
  });

  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  const daten = geprueft.data;
  const ergebnis = await buchungAnlegen(
    daten.kursId,
    { ...daten, agb: true, webseite: "" },
    {
      quelle: "INSTRUCTOR",
      lfaNummer: daten.lfaNummer,
      referredById: profil.id,
    },
  );

  if (!ergebnis.erfolg) {
    const meldungen = {
      "kurs-nicht-buchbar": "Dieser Kurs nimmt keine Anmeldungen mehr an.",
      ausgebucht:
        "Dieser Kurs ist voll. Bitte bei der Administration melden, wenn trotzdem ein Platz nötig ist.",
      doppelbuchung: "Für diese Adresse liegt bereits eine Anmeldung vor.",
    };
    return { fehler: meldungen[ergebnis.fehler] };
  }

  // Ab hier ist der Platz vergeben. Ein Fehler beim Versand darf daran nichts
  // mehr aendern, deshalb steht er ausserhalb und wird nur protokolliert.
  const buchung = await buchungLesen(ergebnis.buchungId);
  let versandtext = "Es wurde keine Bestätigung verschickt.";
  if (buchung) {
    const [bestaetigung] = await Promise.all([
      bestaetigungSenden(buchung),
      interneBenachrichtigungSenden(buchung),
    ]);
    if (bestaetigung.gesendet) {
      versandtext = `Die Bestätigung ging an ${buchung.email}.`;
    } else if (!buchung.email) {
      versandtext =
        "Ohne E-Mail-Adresse geht keine Bestätigung raus. Bitte die Kursdaten mündlich durchgeben.";
    } else {
      console.warn(
        `[Portal-Anmeldung ${ergebnis.buchungId}] Bestätigung nicht versendet: ${bestaetigung.grund}`,
      );
      versandtext =
        "Die Bestätigung konnte nicht zugestellt werden. Bitte die Kursdaten durchgeben.";
    }
  }

  revalidatePath("/portal");
  revalidatePath("/portal/provisionen");
  revalidatePath(`/admin/kurse/${daten.kursId}/buchungen`);
  revalidatePath("/admin");
  // Ein belegter Platz aendert die Ampel auf der oeffentlichen Seite.
  revalidatePath("/", "layout");

  return {
    erledigt: `${daten.vorname} ${daten.nachname} ist angemeldet, Provision auf ${profil.shortCode}. ${versandtext}`,
  };
}
