"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function AbmeldenKnopf() {
  const router = useRouter();
  const [laeuft, setLaeuft] = useState(false);

  async function abmelden() {
    setLaeuft(true);
    await signOut();
    router.push("/team/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={abmelden}
      disabled={laeuft}
      className="min-h-11"
    >
      {laeuft ? "..." : "Abmelden"}
    </Button>
  );
}
