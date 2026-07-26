import "dotenv/config";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

let PrismaClient;
try {
  const pkgPrisma = require("@prisma/client");
  PrismaClient = pkgPrisma.PrismaClient;
} catch (e) {
  console.warn("[Prisma] @prisma/client load fallback (un-generated or missing):", e?.message);
}

let PrismaPg;
try {
  const pkgPg = await import("@prisma/adapter-pg");
  PrismaPg = pkgPg.PrismaPg;
} catch {}

function createMockPrisma() {
  return new Proxy({}, {
    get: (_, prop) => {
      if (prop === "$disconnect") return async () => {};
      return new Proxy({}, {
        get: () => async () => null
      });
    }
  });
}

let prismaInstance;
try {
  if (PrismaClient && process.env.DATABASE_URL) {
    prismaInstance = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
      log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"]
    });
  } else {
    console.warn("[Prisma] DATABASE_URL missing or PrismaClient uninitialized. Using mock fallback.");
    prismaInstance = createMockPrisma();
  }
} catch (e) {
  console.warn("[Prisma] Initialization fallback:", e?.message);
  prismaInstance = createMockPrisma();
}

export const prisma = prismaInstance;

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function disconnectPrisma() {
  try {
    await prisma?.$disconnect?.();
  } catch {
    /* noop */
  }
}
