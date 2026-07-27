"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Druckknopf der Teilnehmerliste.
 *
 * Verschwindet im Druck selbst: auf dem Papier waere er ein leerer Kasten.
 */
export function DruckKnopf({
  hinweis = "A4, Name und Telefon pro Teilnehmer.",
}: {
  hinweis?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
      <Button type="button" onClick={() => window.print()}>
        <Printer aria-hidden="true" className="size-4" />
        Drucken
      </Button>
      <p className="text-sm text-muted-foreground">{hinweis}</p>
    </div>
  );
}
