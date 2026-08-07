import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Resolve the SQLite file to open.
 *
 * Locally this is just the file in the repo. On a serverless host the
 * bundle's filesystem is read-only, and SQLite needs to write a journal
 * even to serve reads — so the build-time database is copied to /tmp on
 * cold start and opened from there.
 *
 * Consequence worth knowing: on serverless, writes live only for the
 * life of that instance. Anything durable (new leads, uploaded photos)
 * needs Postgres — see the deploy notes in the README.
 */
function resolveSqliteUrl(): string {
  const configured = process.env.DATABASE_URL;

  // A non-file URL means a real database is configured; hand it straight
  // through and let the adapter deal with it.
  if (configured && !configured.startsWith("file:")) return configured;

  const relative = (configured ?? "file:./prisma/dev.db").replace(/^file:/, "");
  const source = path.resolve(process.cwd(), relative);

  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (!isServerless) return `file:${source}`;

  const writable = path.join("/tmp", "elite802.db");
  try {
    // Only copy on cold start; subsequent requests reuse the instance.
    if (!existsSync(writable) && existsSync(source)) {
      copyFileSync(source, writable);
    }
    return `file:${writable}`;
  } catch {
    // If /tmp is unavailable, fall back and let the adapter surface it.
    return `file:${source}`;
  }
}

// Next.js hot-reloads modules in dev; without a global cache we'd open a new
// SQLite handle on every reload and eventually exhaust them.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: resolveSqliteUrl() }) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
