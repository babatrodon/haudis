import type { ReactNode } from "react";
import { Seitenleiste } from "@/components/admin/seitenleiste";
import { TabLeiste } from "@/components/admin/tab-leiste";
import {
  PORTAL_MEHR,
  PORTAL_NAVIGATION,
  PORTAL_TABS,
} from "@/lib/admin/navigation";
import type { AngemeldeterBenutzer } from "@/lib/auth";

/**
 * Huelle des Fahrlehrer-Portals.
 *
 * Dieselben Bausteine wie das Panel, nur mit anderer Navigation: Seitenleiste
 * ab 1024px, darunter die Bottom-Tab-Bar. Ein Kursleiter schaut den Plan auf
 * dem Handy an, oft unterwegs, und soll dasselbe Bedienmuster vorfinden wie
 * die Admin.
 *
 * Vier Ziele passen in die Leiste, deshalb kein "Mehr"-Menue.
 */
export function PortalHuelle({
  benutzer,
  children,
}: {
  benutzer: AngemeldeterBenutzer;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Seitenleiste
        benutzer={benutzer}
        navigation={PORTAL_NAVIGATION}
        bereich="Fahrlehrer"
      />

      <header className="sticky top-0 z-30 border-b border-border bg-card lg:hidden">
        <div className="flex min-h-12 items-center gap-3 px-4">
          <span className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Haudi&apos;s
          </span>
          <span aria-hidden="true" className="text-linie-stark">
            ·
          </span>
          <span className="truncate text-sm font-medium">{benutzer.name}</span>
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      <TabLeiste benutzer={benutzer} tabs={PORTAL_TABS} mehr={PORTAL_MEHR} />
    </div>
  );
}
