import type { ReactNode } from "react";
import { AbmeldenKnopf } from "@/components/abmelden-knopf";
import type { AngemeldeterBenutzer } from "@/lib/auth";

/**
 * Gemeinsame Huelle fuer Admin-Panel und Fahrlehrer-Portal.
 *
 * Sprint 0 zeigt nur Kopfzeile und Abmelden. Die eigentliche Navigation
 * (Desktop-Sidebar, Bottom-Tab-Bar auf iPad und Handy) kommt in Sprint 4,
 * PLAN.md Abschnitt 6.
 */
export function TeamHuelle({
  bereich,
  benutzer,
  children,
}: {
  bereich: string;
  benutzer: AngemeldeterBenutzer;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Haudi&apos;s Fahrschule
            </p>
            <p className="font-heading text-lg font-bold">{bereich}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium">{benutzer.name}</p>
              <p className="text-muted-foreground">{benutzer.email}</p>
            </div>
            <AbmeldenKnopf />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
