import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Prisma CLI configuration — migrations, introspection, seeding and Studio. */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js"
  },
  datasource: {
    // Deliberately not the env() helper, which throws when the variable is
    // unset. Every CLI command loads this file, including `prisma generate`
    // during install, where no database is configured yet.
    url: process.env.DATABASE_URL || ""
  }
});
