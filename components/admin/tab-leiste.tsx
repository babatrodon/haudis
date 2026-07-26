"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { AbmeldenKnopf } from "@/components/abmelden-knopf";
import { navigationsSymbol } from "@/components/admin/navigations-symbole";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MEHR_EINTRAEGE, TAB_EINTRAEGE, istAktiv } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";
import type { AngemeldeterBenutzer } from "@/lib/auth";

/**
 * Bottom-Tab-Bar fuer iPad und Handy (PLAN.md Abschnitt 6).
 *
 * Unten statt oben, weil das Panel im Stehen mit einer Hand bedient wird und
 * der Daumen den oberen Bildschirmrand auf einem iPad nicht erreicht.
 *
 * Vier Ziele plus "Mehr". Alle Flaechen sind mindestens 56px hoch, also
 * deutlich ueber den geforderten 44px, und tragen Symbol und Text: ein Symbol
 * allein raet man, und geraten wird taeglich.
 */
export function TabLeiste({ benutzer }: { benutzer: AngemeldeterBenutzer }) {
  const pfad = usePathname();
  const [mehrOffen, setMehrOffen] = useState(false);
  const mehrAktiv = MEHR_EINTRAEGE.some((e) => istAktiv(pfad, e.href));

  return (
    <nav
      aria-label="Hauptnavigation"
      // pb-safe faengt die Hausleiste auf dem iPhone ab, sonst liegt der
      // letzte Tab unter dem Strich zum Schliessen.
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-3xl">
        {TAB_EINTRAEGE.map((eintrag) => {
          const Symbol = navigationsSymbol(eintrag.href);
          const aktiv = istAktiv(pfad, eintrag.href);

          return (
            <li key={eintrag.href} className="flex-1">
              <Link
                href={eintrag.href}
                aria-current={aktiv ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 border-t-4 px-1 py-2 text-[11px] font-medium transition-colors",
                  aktiv
                    ? "border-brand-gelb text-foreground"
                    : "border-transparent text-muted-foreground",
                )}
              >
                <Symbol aria-hidden="true" className="size-5" />
                <span className="truncate">{eintrag.kurz}</span>
              </Link>
            </li>
          );
        })}

        <li className="flex-1">
          <Sheet open={mehrOffen} onOpenChange={setMehrOffen}>
            <SheetTrigger
              className={cn(
                "flex min-h-14 w-full flex-col items-center justify-center gap-1 border-t-4 px-1 py-2 text-[11px] font-medium transition-colors",
                mehrAktiv
                  ? "border-brand-gelb text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              <MoreHorizontal aria-hidden="true" className="size-5" />
              <span>Mehr</span>
            </SheetTrigger>

            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-heading">Weitere Bereiche</SheetTitle>
                <SheetDescription>
                  Angemeldet als {benutzer.name}
                </SheetDescription>
              </SheetHeader>

              <ul className="px-4">
                {MEHR_EINTRAEGE.map((eintrag) => {
                  const Symbol = navigationsSymbol(eintrag.href);
                  const aktiv = istAktiv(pfad, eintrag.href);

                  return (
                    <li key={eintrag.href}>
                      <Link
                        href={eintrag.href}
                        onClick={() => setMehrOffen(false)}
                        aria-current={aktiv ? "page" : undefined}
                        className={cn(
                          "flex min-h-16 items-center gap-4 border-b border-flaeche-3 last:border-b-0",
                          aktiv && "text-foreground",
                        )}
                      >
                        <Symbol
                          aria-hidden="true"
                          className="size-5 shrink-0 text-muted-foreground"
                        />
                        <span className="flex-1">
                          <span className="block font-medium">
                            {eintrag.text}
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            {eintrag.beschreibung}
                          </span>
                        </span>
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

              <div className="border-t border-flaeche-3 p-4">
                <p className="truncate text-sm text-muted-foreground">
                  {benutzer.email}
                </p>
                <div className="mt-3">
                  <AbmeldenKnopf />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
