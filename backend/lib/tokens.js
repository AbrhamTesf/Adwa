import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma.js";

export const ACCESS_COOKIE = "adwa_access";
export const REFRESH_COOKIE = "adwa_refresh";
export const CSRF_COOKIE = "adwa_csrf";
export const CSRF_HEADER = "x-adwa-csrf";

const ACCESS_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900); // 15 min
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

/**
 * Secrets are required rather than defaulted — a fallback secret silently
 * turns token signing into decoration.
 */
function accessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw Object.assign(new Error("JWT_ACCESS_SECRET must be set to at least 32 characters"), {
      status: 500,
      provider: "auth"
    });
  }
  return secret;
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function signAccessToken({ userId, email, roles }) {
  return jwt.sign({ sub: userId, email, roles }, accessSecret(), {
    expiresIn: ACCESS_TTL_SECONDS,
    issuer: "adwa-lens"
  });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, accessSecret(), { issuer: "adwa-lens" });
  } catch {
    return null;
  }
}

export function createCsrfToken() {
  return randomBytes(24).toString("base64url");
}

/** Double-submit cookie check, compared in constant time. */
export function csrfTokenMatches(cookieValue, headerValue) {
  if (!cookieValue || !headerValue) return false;
  const a = Buffer.from(String(cookieValue));
  const b = Buffer.from(String(headerValue));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function issueRefreshToken(userId, { userAgent, ipAddress } = {}) {
  const token = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
      ipAddress: ipAddress ? String(ipAddress).slice(0, 64) : null
    }
  });

  return { token, expiresAt };
}

/**
 * Rotates a refresh token. Presenting an already-rotated token means the
 * cookie leaked, so the whole family is revoked rather than just refused.
 */
export async function rotateRefreshToken(presentedToken, context = {}) {
  const tokenHash = hashToken(presentedToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing) return { ok: false, reason: "unknown" };

  if (existing.revokedAt || existing.replacedById) {
    await revokeAllUserTokens(existing.userId);
    return { ok: false, reason: "reused" };
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const issued = await issueRefreshToken(existing.userId, context);
  const replacement = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(issued.token) }
  });

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedById: replacement.id }
  });

  return { ok: true, userId: existing.userId, ...issued };
}

export async function revokeRefreshToken(presentedToken) {
  const tokenHash = hashToken(presentedToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export async function revokeAllUserTokens(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

function baseCookieOptions() {
  // Secure is mandatory in production; in local dev over plain http the browser
  // would silently drop a Secure cookie.
  const secure = process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";
  return {
    httpOnly: true,
    secure,
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    path: "/"
  };
}

export function setAuthCookies(reply, { accessToken, refreshToken, refreshExpiresAt, csrfToken }) {
  const base = baseCookieOptions();
  reply.setCookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: ACCESS_TTL_SECONDS });
  reply.setCookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    path: "/api/auth",
    expires: refreshExpiresAt
  });
  // Readable by the client on purpose — it must be echoed back in a header.
  reply.setCookie(CSRF_COOKIE, csrfToken, { ...base, httpOnly: false });
}

export function clearAuthCookies(reply) {
  const base = baseCookieOptions();
  reply.clearCookie(ACCESS_COOKIE, base);
  reply.clearCookie(REFRESH_COOKIE, { ...base, path: "/api/auth" });
  reply.clearCookie(CSRF_COOKIE, { ...base, httpOnly: false });
}
