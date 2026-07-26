import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminHuelle } from "@/components/admin/admin-huelle";
import { requireRole } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Administration | Haudi's Fahrschule",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Echte Autorisierung. proxy.ts leitet nur frueher um.
  const benutzer = await requireRole("ADMIN");

  return <AdminHuelle benutzer={benutzer}>{children}</AdminHuelle>;
}
