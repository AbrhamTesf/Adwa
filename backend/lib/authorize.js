import { prisma } from "./prisma.js";
import {
  ACCESS_COOKIE,
  CSRF_COOKIE,
  CSRF_HEADER,
  csrfTokenMatches,
  verifyAccessToken
} from "./tokens.js";

export const ROLE_TOURIST = "tourist";
export const ROLE_ADMIN_STAFF = "admin_staff";
export const ROLE_SUPER_ADMIN = "super_admin";

function unauthorized(reply, message = "Sign in to continue.") {
  return reply.code(401).send({ error: true, message, provider: "auth", retryable: false });
}

function forbidden(reply, message = "You do not have access to this resource.") {
  return reply.code(403).send({ error: true, message, provider: "auth", retryable: false });
}

/**
 * Resolves the caller from the access cookie. Roles come from the token for
 * speed; `reloadUser` re-reads the database when a decision must not run on a
 * token minted before a role or status change.
 */
export async function resolveUser(req, { reloadUser = false } = {}) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return null;

  const claims = verifyAccessToken(token);
  if (!claims?.sub) return null;

  if (!reloadUser) {
    return { id: claims.sub, email: claims.email, roles: claims.roles || [] };
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: { roles: { include: { role: true } } }
  });
  if (!user || user.status !== "active") return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    roles: user.roles.map((assignment) => assignment.role.name)
  };
}

/**
 * Cookie auth is ambient, so state-changing requests need a double-submit CSRF
 * token. Safe methods are exempt.
 */
export function verifyCsrf(req, reply) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;
  if (csrfTokenMatches(req.cookies?.[CSRF_COOKIE], req.headers[CSRF_HEADER])) return true;

  reply.code(403).send({
    error: true,
    message: "Missing or invalid CSRF token.",
    provider: "auth",
    retryable: false
  });
  return false;
}

export function requireAuthenticatedUser(options = {}) {
  return async function preHandler(req, reply) {
    if (!verifyCsrf(req, reply)) return reply;

    const user = await resolveUser(req, { reloadUser: true, ...options });
    if (!user) return unauthorized(reply);

    req.user = user;
    return undefined;
  };
}

/**
 * Accepts any of the named roles. super_admin implicitly satisfies
 * admin_staff so operators do not need both assignments.
 */
export function requireRole(...allowedRoles) {
  const allowed = new Set(allowedRoles.flat());
  if (allowed.has(ROLE_ADMIN_STAFF)) allowed.add(ROLE_SUPER_ADMIN);

  return async function preHandler(req, reply) {
    if (!verifyCsrf(req, reply)) return reply;

    const user = await resolveUser(req, { reloadUser: true });
    if (!user) return unauthorized(reply);

    if (!user.roles.some((role) => allowed.has(role))) {
      return forbidden(reply);
    }

    req.user = user;
    return undefined;
  };
}

/** Attaches the user when present but never rejects — for mixed guest routes. */
export async function attachOptionalUser(req) {
  req.user = await resolveUser(req).catch(() => null);
}

export async function recordAuditLog({ actorId, action, resource, metadata, ipAddress }) {
  if (!actorId) return;
  await prisma.adminAuditLog.create({
    data: {
      actorId,
      action,
      resource,
      metadata: metadata ?? undefined,
      ipAddress: ipAddress ? String(ipAddress).slice(0, 64) : null
    }
  });
}
