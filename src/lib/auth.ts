import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE = "ec802_session";
const SESSION_DAYS = 30;

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
// Sessions — server-side rows so access can be revoked instantly.
// ============================================================

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function getCurrentUser() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.active) return null;

  // Explicit allowlist rather than omitting passwordHash — a future
  // sensitive column can't leak into callers by being forgotten here.
  const { id: userId, email, name, role, phone, hourlyRate, color, active, lastLoginAt, createdAt } =
    session.user;

  return { id: userId, email, name, role, phone, hourlyRate, color, active, lastLoginAt, createdAt };
}

export async function destroySession() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (id) {
    // The row may already be gone (expired sweep, manual revoke).
    await prisma.session.deleteMany({ where: { id } });
  }
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
