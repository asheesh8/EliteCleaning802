import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// The CLI (generate / migrate / db push) connects via `datasource.url`.
// The runtime driver adapter lives with the client instead — see src/lib/db.ts.
const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: { url },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "npx tsx prisma/seed.ts",
  },
});
