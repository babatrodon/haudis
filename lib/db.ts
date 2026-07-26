import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Einziger Zugang zur Datenbank.
 *
 * Prisma 7 generiert den Client nach lib/generated/prisma statt nach
 * @prisma/client. Damit dieser Pfad nicht durch die ganze Codebase wandert,
 * importiert ausser dieser Datei niemand den generierten Client direkt.
 *
 * Der Neon-Adapter nutzt die gepoolte DATABASE_URL. Migrationen laufen ueber
 * DIRECT_URL, konfiguriert in prisma.config.ts.
 */

function prismaClientErzeugen() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL fehlt. Gepoolte Neon-Verbindung in .env eintragen.",
    );
  }
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

// In der Entwicklung wuerde jeder HMR-Reload eine neue Client-Instanz und damit
// einen neuen Verbindungspool erzeugen.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof prismaClientErzeugen>;
};

export const prisma = globalForPrisma.prisma ?? prismaClientErzeugen();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { Role } from "@/lib/generated/prisma/enums";

export { Prisma } from "@/lib/generated/prisma/client";

/** Decimal liegt in lib/decimal.ts, damit reine Rechenmodule ohne Verbindung auskommen. */
export { Decimal } from "@/lib/decimal";
