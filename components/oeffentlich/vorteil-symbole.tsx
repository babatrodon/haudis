import type { Vorteil } from "@/lib/inhalte/warum-uns";

/**
 * Die sechs Strichzeichnungen aus design/haudis-design.dc.html Screen 02.
 *
 * Eins zu eins aus der Vorlage uebernommen, inklusive der gelben Fuellung, die
 * in jedem Symbol genau ein Element hervorhebt. Getrennt von den Texten, damit
 * lib/inhalte/warum-uns.ts ohne Oberflaeche auskommt.
 */
export function VorteilSymbol({ name }: { name: Vorteil["symbol"] }) {
  const gemeinsam = {
    width: 28,
    height: 28,
    viewBox: "0 0 28 28",
    fill: "none",
    "aria-hidden": true as const,
    className: "mb-4 shrink-0",
  };

  switch (name) {
    case "bahnhof":
      return (
        <svg {...gemeinsam}>
          <rect x="6.5" y="3.5" width="15" height="15" stroke="#121212" strokeWidth="1.6" />
          <path d="M6.5 12h15M10 18.5l-2 6M18 18.5l2 6" stroke="#121212" strokeWidth="1.6" />
          <rect x="9.5" y="6.5" width="9" height="3.5" fill="#FFE500" />
        </svg>
      );
    case "sprachen":
      return (
        <svg {...gemeinsam}>
          <circle cx="14" cy="14" r="10.5" stroke="#121212" strokeWidth="1.6" />
          <path
            d="M3.5 14h21M14 3.5c3 3 3 17 0 21M14 3.5c-3 3-3 17 0 21"
            stroke="#121212"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "dach":
      return (
        <svg {...gemeinsam}>
          <path d="M3.5 12L14 4l10.5 8v12.5h-21V12z" stroke="#121212" strokeWidth="1.6" />
          <rect x="11" y="16" width="6" height="8.5" fill="#FFE500" stroke="#121212" strokeWidth="1.6" />
        </svg>
      );
    case "kategorien":
      return (
        <svg {...gemeinsam}>
          <path d="M3.5 17.5l2-6.5h17l2 6.5v4h-21v-4z" stroke="#121212" strokeWidth="1.6" />
          <path d="M7 11l1.5-4h11l1.5 4" stroke="#121212" strokeWidth="1.6" />
          <circle cx="8" cy="21.5" r="2" fill="#121212" />
          <circle cx="20" cy="21.5" r="2" fill="#121212" />
        </svg>
      );
    case "familie":
      return (
        <svg {...gemeinsam}>
          <circle cx="10" cy="9" r="4" stroke="#121212" strokeWidth="1.6" />
          <circle cx="19.5" cy="11" r="3" stroke="#121212" strokeWidth="1.6" />
          <path
            d="M3.5 24.5c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M17 18.5c4 0 7.5 2 7.5 6"
            stroke="#121212"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "probe":
      return (
        <svg {...gemeinsam}>
          <path d="M3.5 5.5h21v14h-12l-6 5v-5h-3v-14z" stroke="#121212" strokeWidth="1.6" />
          <path d="M9 10.5h10M9 14.5h6" stroke="#121212" strokeWidth="1.6" />
        </svg>
      );
  }
}
