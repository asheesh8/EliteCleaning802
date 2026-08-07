import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  getSessionTokenUserId,
  verifySessionToken,
} from "@/lib/session-token";

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE = "ec802_session";
// Browsers may cap persistent cookies, but the app itself does not expire an
// active admin session. This is intentionally far beyond the old 30-day row.
const SESSION_COOKIE_EXPIRES = new Date("2038-01-19T03:14:07.000Z");

// ============================================================
// Password hashing — scrypt from node's stdlib.
// Avoids a native bcrypt dependency that breaks on Node upgrades.
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;

  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, "hex");

  // Lengths must match before timingSafeEqual, which throws otherwise.
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

// ============================================================
// Sessions — signed cookies so serverless instance rotation cannot log an
// admin out. The previous database-backed row lived in /tmp on Vercel, so a
// request routed to a different function instance appeared unauthenticated.
// ============================================================

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw new Error("Cannot create a session for an unknown user");

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId, user.passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: SESSION_COOKIE_EXPIRES,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenUserId = getSessionTokenUserId(token);
  if (!tokenUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: tokenUserId },
  });

  if (!user || !user.active) return null;
  if (verifySessionToken(token, user.passwordHash) !== user.id) return null;

  // Explicit allowlist rather than omitting passwordHash — a future
  // sensitive column can't leak into callers by being forgotten here.
  const { id: userId, email, name, role, phone, hourlyRate, color, active, lastLoginAt, createdAt } =
    user;

  return { id: userId, email, name, role, phone, hourlyRate, color, active, lastLoginAt, createdAt };
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Guard for every CRM page. Redirects rather than throwing. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/crew/login");
  return user;
}

export async function requireOwner() {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/crew");
  return user;
}
