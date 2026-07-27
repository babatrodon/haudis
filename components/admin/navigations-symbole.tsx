import {
  CalendarDays,
  Calculator,
  ClipboardList,
  Coins,
  LayoutDashboard,
  Settings,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Symbole der Navigation, getrennt von lib/admin/navigation.ts.
 *
 * Die Navigationsdaten bleiben dadurch frei von Oberflaechen-Abhaengigkeiten
 * und lassen sich auch serverseitig lesen, ohne eine Symbolbibliothek
 * mitzuziehen.
 */
const SYMBOLE: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/kurse": CalendarDays,
  "/admin/buchungen": ClipboardList,
  "/admin/einsatzplan": Users,
  "/admin/fahrlehrer": UserRound,
  "/admin/abrechnung": Coins,
  "/admin/accounting": Calculator,
  "/admin/einstellungen": Settings,

  "/portal": CalendarDays,
  "/portal/anmelden": UserPlus,
  "/portal/provisionen": Coins,
  "/portal/profil": UserRound,
};

export function navigationsSymbol(href: string): LucideIcon {
  return SYMBOLE[href] ?? ClipboardList;
}
