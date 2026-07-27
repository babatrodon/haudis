import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth-guard";
import { PortalHuelle } from "@/components/portal-huelle";

export const metadata: Metadata = {
  title: "Fahrlehrer-Portal | Haudi's Fahrschule",
  robots: { index: false, follow: false },
};

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Echte Autorisierung. proxy.ts leitet nur frueher um.
  const benutzer = await requireRole("INSTRUCTOR");

  return <PortalHuelle benutzer={benutzer}>{children}</PortalHuelle>;
}
