import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sitzungLesen, startseiteFuerRolle } from "@/lib/auth-guard";
import { ADRESSE } from "@/lib/kontakt";
import { LoginFormular } from "./login-formular";

export const metadata: Metadata = {
  title: "Team-Login | Haudi's Fahrschule",
  robots: { index: false, follow: false },
};

/**
 * Der einzige Login des Projekts. Kunden haben keine Konten
 * (Geschaeftsregel 9), deshalb gibt es hier weder Registrierung noch
 * "Konto erstellen".
 */
export default async function LoginSeite({
  searchParams,
}: {
  searchParams: Promise<{ weiter?: string }>;
}) {
  const sitzung = await sitzungLesen();
  if (sitzung?.user.active) {
    redirect(startseiteFuerRolle(sitzung.user.role));
  }

  const { weiter } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="border border-border bg-card p-8">
          <Image
            src="/haudis-logo.png"
            alt={ADRESSE.firma}
            width={993}
            height={586}
            priority
            className="h-12 w-auto"
          />
          <h1 className="mt-4 font-heading text-2xl font-bold">Team-Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Für Administration und Fahrlehrer.
          </p>

          <div className="mt-8">
            <LoginFormular weiter={zielPruefen(weiter)} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Kein Konto? Konten werden von der Administration angelegt.{" "}
          <Link href="/" className="underline underline-offset-4">
            Zur Startseite
          </Link>
        </p>
      </div>
    </main>
  );
}

/**
 * Verhindert, dass ein praeparierter weiter-Parameter nach dem Login auf eine
 * fremde Domain umleitet. Erlaubt sind nur projekteigene Pfade.
 */
function zielPruefen(weiter: string | undefined): string {
  if (!weiter || !weiter.startsWith("/") || weiter.startsWith("//")) {
    return "/team";
  }
  return weiter;
}
