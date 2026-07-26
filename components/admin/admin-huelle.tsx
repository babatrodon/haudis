import type { ReactNode } from "react";
import { Seitenleiste } from "@/components/admin/seitenleiste";
import { TabLeiste } from "@/components/admin/tab-leiste";
import type { AngemeldeterBenutzer } from "@/lib/auth";

/**
 * Huelle des Admin-Panels.
 *
 * Ab 1024px steht die Seitenleiste, darunter die Bottom-Tab-Bar. Die Grenze
 * liegt dort, weil ein iPad im Querformat genau 1024px hat: im Hochformat und
 * auf dem Handy bedient man mit dem Daumen von unten, im Querformat ist genug
 * Platz fuer eine dauerhaft sichtbare Leiste.
 */
export function AdminHuelle({
  benutzer,
  children,
}: {
  benutzer: AngemeldeterBenutzer;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Seitenleiste benutzer={benutzer} />

      {/* Kopf nur auf schmalen Screens: auf dem Desktop steht der Name in der
          Seitenleiste, ein zweites Mal oben waere doppelt. */}
      <header className="sticky top-0 z-30 border-b border-border bg-card lg:hidden">
        <div className="flex min-h-14 items-center justify-between gap-4 px-4">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Haudi&apos;s
            </p>
            <p className="font-heading text-base font-bold leading-tight">
              Administration
            </p>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {benutzer.name}
          </p>
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Unten Platz fuer die Tab-Leiste, damit der letzte Inhalt nicht
            darunter verschwindet. */}
        <main className="min-w-0 flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      <TabLeiste benutzer={benutzer} />
    </div>
  );
}

/**
 * Kopfzeile einer Admin-Seite. Sorgt dafuer, dass Titel, Beschreibung und
 * Aktionen auf allen Seiten gleich sitzen.
 */
export function SeitenKopf({
  titel,
  beschreibung,
  aktionen,
}: {
  titel: string;
  beschreibung?: string;
  aktionen?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{titel}</h1>
        {beschreibung ? (
          <p className="mt-1 text-muted-foreground">{beschreibung}</p>
        ) : null}
      </div>
      {aktionen ? (
        <div className="flex flex-wrap gap-2">{aktionen}</div>
      ) : null}
    </div>
  );
}
