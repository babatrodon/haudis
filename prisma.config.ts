import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Konfiguration fuer die Prisma CLI (migrate, db seed, studio).
 *
 * Die CLI braucht eine direkte Verbindung, deshalb DIRECT_URL (Neon-Hostname
 * ohne "-pooler"). Die Anwendung selbst verbindet ueber die gepoolte
 * DATABASE_URL, siehe lib/db.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
