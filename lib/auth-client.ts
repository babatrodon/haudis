"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

/**
 * Auth-Client fuer Client Components. Nur der Team-Login nutzt ihn.
 * inferAdditionalFields uebernimmt role und active aus der Serverkonfiguration,
 * damit session.user typisiert bleibt.
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signOut, useSession } = authClient;
