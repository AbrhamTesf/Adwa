// Loaded here rather than by the entry point: ES module imports evaluate
// before the importer's body, so a later dotenv.config() would leave the
// adapter below with an undefined connection string.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Single shared client. Node's module cache keeps this to one instance per
 * process, which matters because each PrismaClient opens its own pool.
 * Prisma 7 requires an explicit driver adapter.
 */
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"]
});

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
