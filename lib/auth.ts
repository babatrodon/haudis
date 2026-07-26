import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
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
      // Wird nur vom Seed und ab Sprint 4 von der Kontoverwaltung gesetzt,
      // nie ueber einen API-Aufruf. Sonst koennte sich jemand den erzwungenen
      // Passwortwechsel selbst abschalten.
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
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

  hooks: {
    /**
     * Loescht mustChangePassword nach jedem erfolgreichen Passwortwechsel.
     *
     * Bewusst hier und nicht in der Server Action der Passwortseite: sonst
     * bliebe das Flag stehen, wenn jemand den Endpunkt direkt aufruft. Die
     * Person haette dann ein neues Passwort, waere aber weiterhin auf die
     * Passwortseite gesperrt und muesste raten, welches Passwort gilt.
     * Der Zwang endet dort, wo das Passwort tatsaechlich wechselt.
     */
    after: createAuthMiddleware(async (ctx) => {
      const gewechselt =
        ctx.path === "/change-password" || ctx.path === "/reset-password";
      if (!gewechselt || ctx.context.returned instanceof APIError) {
        return;
      }

      const benutzerId = ctx.context.session?.user.id;
      if (!benutzerId) {
        return;
      }

      await prisma.user.updateMany({
        where: { id: benutzerId, mustChangePassword: true },
        data: { mustChangePassword: false },
      });
    }),
  },

  // nextCookies muss das letzte Plugin bleiben.
  plugins: [nextCookies()],
});

export type Sitzung = typeof auth.$Infer.Session;
export type AngemeldeterBenutzer = Sitzung["user"];
