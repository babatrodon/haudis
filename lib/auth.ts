import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/db";

/**
 * Team-Login fuer Haudi's Fahrschule.
 *
 * Geschaeftsregel 9 aus PLAN.md: Es gibt keinen Kunden-Login. Kunden buchen
 * immer als Gast. Die einzigen Konten sind ADMIN und INSTRUCTOR.
 * Durchgesetzt wird das durch disableSignUp: die Registrierungs-Endpunkte
 * antworten mit einem Fehler, Konten entstehen ausschliesslich per Seed oder
 * spaeter durch die Admin-Verwaltung (Sprint 4).
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    // Keine Selbstregistrierung, siehe oben.
    disableSignUp: true,
    minPasswordLength: 12,
  },

  user: {
    additionalFields: {
      // input: false heisst, dass weder role noch active ueber einen
      // API-Aufruf gesetzt werden koennen. Eine Rechteausweitung durch
      // manipulierte Requests ist damit ausgeschlossen.
      role: {
        type: "string",
        required: true,
        input: false,
      },
      active: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  // PLAN.md Abschnitt 2 verlangt ein Rate-Limit auf dem Login.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/forget-password": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
    },
  },

  // nextCookies muss das letzte Plugin bleiben.
  plugins: [nextCookies()],
});

export type Sitzung = typeof auth.$Infer.Session;
export type AngemeldeterBenutzer = Sitzung["user"];
