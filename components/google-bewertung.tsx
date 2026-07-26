import { Button } from "@/components/ui/button";
import type { GoogleProfil } from "@/lib/google";

/**
 * Bewertungen aus dem Google Business Profile.
 *
 * Fuehrend ist die Gesamtbewertung, nicht ein einzelnes Zitat. Rezensionstexte
 * gehoeren ihren Verfassern: aus dem Profil wird nichts abgeschrieben. Der
 * Zitat-Slot bleibt leer, bis Ausilia Texte eintraegt, fuer die sie die
 * Zustimmung hat.
 *
 * Alles rendert serverseitig aus den Einstellungen. Es laedt kein Skript von
 * Google und es geht keine Anfrage an Google, solange niemand klickt.
 */
export function GoogleBewertung({ profil }: { profil: GoogleProfil }) {
  const { bewertung, anzahlBewertungen, zitate } = profil;

  // Ohne gepflegte Bewertung gibt es nichts zu zeigen.
  if (bewertung === null) {
    return null;
  }

  return (
    <div className="border border-border bg-card p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Bewertungen auf Google
          </p>
          <div className="mt-3 flex items-center gap-4">
            <span className="font-heading text-5xl font-bold leading-none">
              {bewertung.toLocaleString("de-CH", {
                minimumFractionDigits: 1,
              })}
            </span>
            <div>
              <Sterne bewertung={bewertung} />
              {anzahlBewertungen !== null ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {anzahlBewertungen} Bewertungen
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href={profil.profilUrl} target="_blank" rel="noopener noreferrer">
              Alle Bewertungen ansehen
            </a>
          </Button>
          <Button asChild>
            <a
              href={profil.bewertungSchreibenUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Bewertung schreiben
            </a>
          </Button>
        </div>
      </div>

      {zitate.length > 0 ? (
        <ul className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {zitate.map((zitat) => (
            <li key={`${zitat.name}-${zitat.text.slice(0, 24)}`} className="bg-card p-5">
              <Sterne bewertung={zitat.sterne} />
              <blockquote className="mt-3 text-sm text-foreground">
                {zitat.text}
              </blockquote>
              <p className="mt-3 text-sm font-medium">{zitat.name}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Sternreihe. Halbe Sterne werden bewusst nicht dargestellt, gerundet wird auf
 * den naechsten ganzen Stern; die genaue Zahl steht ohnehin daneben.
 */
function Sterne({ bewertung }: { bewertung: number }) {
  const voll = Math.round(bewertung);

  return (
    <span
      className="flex gap-0.5"
      role="img"
      aria-label={`${bewertung.toLocaleString("de-CH", { minimumFractionDigits: 1 })} von 5 Sternen`}
    >
      {[1, 2, 3, 4, 5].map((stern) => (
        <Stern key={stern} gefuellt={stern <= voll} />
      ))}
    </span>
  );
}

function Stern({ gefuellt }: { gefuellt: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`size-5 ${gefuellt ? "fill-brand-gelb" : "fill-linie-stark"}`}
    >
      <path d="M10 1.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.7 1-5.8L1.5 7.6l5.9-.8L10 1.5z" />
    </svg>
  );
}
