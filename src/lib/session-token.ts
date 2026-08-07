import { createHmac, timingSafeEqual } from "node:crypto";

const VERSION = "v1";

function signatureFor(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Create a tamper-proof session token without storing server-side state.
 * The user's password hash is stable across every function instance in a
 * deployment, and changing the password automatically invalidates the token.
 */
export function createSessionToken(userId: string, passwordHash: string) {
  const encodedUserId = Buffer.from(userId, "utf8").toString("base64url");
  const payload = `${VERSION}.${encodedUserId}`;
  return `${payload}.${signatureFor(payload, passwordHash)}`;
}

/** Returns the signed-in user id, or null for malformed/tampered tokens. */
export function verifySessionToken(token: string, passwordHash: string) {
  const [version, encodedUserId, suppliedSignature, extra] = token.split(".");
  if (version !== VERSION || !encodedUserId || !suppliedSignature || extra) {
    return null;
  }

  const payload = `${version}.${encodedUserId}`;
  const expected = Buffer.from(signatureFor(payload, passwordHash), "utf8");
  const supplied = Buffer.from(suppliedSignature, "utf8");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return null;
  }

  try {
    const userId = Buffer.from(encodedUserId, "base64url").toString("utf8");
    return userId || null;
  } catch {
    return null;
  }
}

/** Read the unsigned id so the matching user can be loaded for verification. */
export function getSessionTokenUserId(token: string) {
  const [version, encodedUserId, suppliedSignature, extra] = token.split(".");
  if (version !== VERSION || !encodedUserId || !suppliedSignature || extra) {
    return null;
  }

  try {
    const userId = Buffer.from(encodedUserId, "base64url").toString("utf8");
    return userId || null;
  } catch {
    return null;
  }
}
