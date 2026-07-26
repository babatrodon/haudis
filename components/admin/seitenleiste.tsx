"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AbmeldenKnopf } from "@/components/abmelden-knopf";
import { navigationsSymbol } from "@/components/admin/navigations-symbole";
import { ADMIN_NAVIGATION, istAktiv } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";
import type { AngemeldeterBenutzer } from "@/lib/auth";

/**
 * Seitenleiste ab Desktopbreite. Darunter uebernimmt die Tab-Leiste.
 *
 * Die Leiste scrollt nicht mit: Ausilia wechselt zwischen Kursen, Buchungen und
 * Einsatzplan staendig hin und her, und ein Ziel, das man erst hochscrollen
 * muss, kostet bei jedem Wechsel Zeit.
 */
export function Seitenleiste({ benutzer }: { benutzer: AngemeldeterBenutzer }) {
  const pfad = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:h-dvh lg:flex-col lg:sticky lg:top-0">
      <div className="border-b border-flaeche-3 px-5 py-4">
        <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Haudi&apos;s
        </p>
        <p className="font-heading text-lg font-bold">Administration</p>
      </div>

      <nav aria-label="Hauptnavigation" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {ADMIN_NAVIGATION.map((eintrag) => {
            const Symbol = navigationsSymbol(eintrag.href);
            const aktiv = istAktiv(pfad, eintrag.href);

            return (
              <li key={eintrag.href}>
                <Link
                  href={eintrag.href}
                  aria-current={aktiv ? "page" : undefined}
                  className={cn(
                    // 48px statt der geforderten 44px: 1024px ist das iPad im
                    // Querformat, also ein Touch-Geraet. Das Minimum ist dort
                    // die Untergrenze, nicht das Ziel.
                    "flex min-h-12 items-center gap-3 border-l-4 px-3 text-sm font-medium transition-colors",
                    aktiv
                      ? "border-brand-gelb bg-flaeche-2 text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-flaeche-2 hover:text-foreground",
                  )}
                >
                  <Symbol aria-hidden="true" className="size-5 shrink-0" />
                  <span className="flex-1">{eintrag.text}</span>
                  {eintrag.kommt ? (
                    <span className="bg-flaeche-3 px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {eintrag.kommt}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-flaeche-3 p-4">
        <p className="truncate text-sm font-medium">{benutzer.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {benutzer.email}
        </p>
        <div className="mt-3">
          <AbmeldenKnopf />
        </div>
      </div>
    </aside>
  );
}
