import { createHash } from "node:crypto";
import { normalizeEmail, prisma } from "../lib/prisma.js";
import { hashPassword, validatePasswordStrength, verifyPassword } from "../lib/password.js";
import {
  createCsrfToken,
  clearAuthCookies,
  hashToken,
  issueRefreshToken,
  REFRESH_COOKIE,
  revokeRefreshToken,
  rotateRefreshToken,
  setAuthCookies,
  signAccessToken
} from "../lib/tokens.js";
import {
  ROLE_ADMIN_STAFF,
  ROLE_SUPER_ADMIN,
  ROLE_TOURIST,
  requireAuthenticatedUser,
  resolveUser,
  verifyCsrf
} from "../lib/authorize.js";
import { createSessionStore, sanitizeSnapshot } from "../lib/sessionStore.js";

const SIGN_IN_RATE_LIMIT = { max: 10, timeWindow: "15 minutes" };
const SIGN_UP_RATE_LIMIT = { max: 5, timeWindow: "1 hour" };

const legacySessionStore = createSessionStore();

function fail(reply, status, message) {
  return reply.code(status).send({ error: true, message, provider: "auth", retryable: status >= 500 });
}

function publicUser(user, roles) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    roles
  };
}

async function roleIdByName(name) {
  const role = await prisma.role.upsert({
    where: { name },
    update: {},
    create: { name }
  });
  return role.id;
}

async function establishSession(reply, req, user, roles) {
  const { token: refreshToken, expiresAt } = await issueRefreshToken(user.id, {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip
  });
  const csrfToken = createCsrfToken();

  setAuthCookies(reply, {
    accessToken: signAccessToken({ userId: user.id, email: user.email, roles }),
    refreshToken,
    refreshExpiresAt: expiresAt,
    csrfToken
  });

  return { csrfToken };
}

/**
 * Decides what a sign-up request is allowed to become. Self-service can only
 * ever produce a tourist; anything privileged requires an invitation and
 * lands as `pending` unless it is the configured bootstrap operator.
 */
async function resolveRequestedAccess({ requestedRole, email, invitationCode }) {
  if (requestedRole !== ROLE_ADMIN_STAFF) {
    return { roles: [ROLE_TOURIST], status: "active", invitation: null };
  }

  const bootstrapEmail = normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL || "");
  if (bootstrapEmail && bootstrapEmail === email) {
    return { roles: [ROLE_ADMIN_STAFF, ROLE_SUPER_ADMIN], status: "active", invitation: null };
  }

  if (!invitationCode) {
    return { error: "A staff invitation code is required to register as museum staff." };
  }

  const codeHash = hashToken(invitationCode);
  const invitation = await prisma.staffInvitation.findUnique({ where: { codeHash } });

  if (invitation) {
    const invitedEmail = normalizeEmail(invitation.email);
    const usable =
      invitation.status === "pending" &&
      invitation.expiresAt.getTime() > Date.now() &&
      (!invitedEmail || invitedEmail === email);
    if (!usable) return { error: "That staff invitation is no longer valid." };
    return { roles: [ROLE_ADMIN_STAFF], status: "pending", invitation };
  }

  // Shared bootstrap code, for standing up the very first staff accounts
  // before any invitation rows exist.
  const sharedCode = process.env.STAFF_INVITATION_CODE;
  if (sharedCode && sharedCode.length >= 8 && invitationCode === sharedCode) {
    return { roles: [ROLE_ADMIN_STAFF], status: "pending", invitation: null };
  }

  return { error: "That staff invitation code was not recognised." };
}

export default async function authRoute(app) {
  app.post("/auth/sign-up", { config: { rateLimit: SIGN_UP_RATE_LIMIT } }, async (req, reply) => {
    const displayName = String(req.body?.displayName || req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const requestedRole = req.body?.role === ROLE_ADMIN_STAFF ? ROLE_ADMIN_STAFF : ROLE_TOURIST;

    if (displayName.length < 2 || displayName.length > 80) {
      return fail(reply, 400, "Please enter a name between 2 and 80 characters.");
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
      return fail(reply, 400, "Please enter a valid email address.");
    }
    const passwordProblem = validatePasswordStrength(password);
    if (passwordProblem) return fail(reply, 400, passwordProblem);

    const access = await resolveRequestedAccess({
      requestedRole,
      email,
      invitationCode: req.body?.invitationCode
    });
    if (access.error) return fail(reply, 403, access.error);

    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      return fail(reply, 409, "An account already exists for that email address.");
    }

    const passwordHash = await hashPassword(password);
    const roleIds = await Promise.all(access.roles.map(roleIdByName));

    const user = await prisma.user.create({
      data: {
        email,
        displayName,
        passwordHash,
        status: access.status,
        roles: { create: roleIds.map((roleId) => ({ roleId })) }
      }
    });

    if (access.invitation) {
      await prisma.staffInvitation.update({
        where: { id: access.invitation.id },
        data: { status: "accepted", usedAt: new Date() }
      });
    }

    if (access.status === "pending") {
      return reply.code(202).send({
        user: publicUser(user, access.roles),
        pendingApproval: true,
        message: "Your staff account is awaiting approval from a museum administrator."
      });
    }

    const { csrfToken } = await establishSession(reply, req, user, access.roles);
    return reply.code(201).send({ user: publicUser(user, access.roles), csrfToken });
  });

  app.post("/auth/sign-in", { config: { rateLimit: SIGN_IN_RATE_LIMIT } }, async (req, reply) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    if (!email || !password) return fail(reply, 400, "Enter your email and password.");

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } }
    });

    if (!user) {
      // Equalise timing so a missing account is not measurably faster than a
      // wrong password, which would leak which emails are registered.
      await hashPassword(password);
      return fail(reply, 401, "Incorrect email or password.");
    }

    if (!(await verifyPassword(user.passwordHash, password))) {
      return fail(reply, 401, "Incorrect email or password.");
    }

    if (user.status === "pending") {
      return fail(reply, 403, "Your staff account is still awaiting administrator approval.");
    }
    if (user.status !== "active") {
      return fail(reply, 403, "This account has been suspended.");
    }

    const roles = user.roles.map((assignment) => assignment.role.name);
    const { csrfToken } = await establishSession(reply, req, user, roles);
    await prisma.user.update({ where: { id: user.id }, data: { lastSignInAt: new Date() } });

    return reply.send({ user: publicUser(user, roles), csrfToken });
  });

  app.post("/auth/refresh", async (req, reply) => {
    const presented = req.cookies?.[REFRESH_COOKIE];
    if (!presented) return fail(reply, 401, "Your session has expired. Please sign in again.");

    const rotation = await rotateRefreshToken(presented, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    if (!rotation.ok) {
      clearAuthCookies(reply);
      const message =
        rotation.reason === "reused"
          ? "Your session was ended for security reasons. Please sign in again."
          : "Your session has expired. Please sign in again.";
      return fail(reply, 401, message);
    }

    const user = await prisma.user.findUnique({
      where: { id: rotation.userId },
      include: { roles: { include: { role: true } } }
    });
    if (!user || user.status !== "active") {
      clearAuthCookies(reply);
      return fail(reply, 401, "Your session is no longer valid.");
    }

    const roles = user.roles.map((assignment) => assignment.role.name);
    const csrfToken = createCsrfToken();
    setAuthCookies(reply, {
      accessToken: signAccessToken({ userId: user.id, email: user.email, roles }),
      refreshToken: rotation.token,
      refreshExpiresAt: rotation.expiresAt,
      csrfToken
    });

    return reply.send({ user: publicUser(user, roles), csrfToken });
  });

  app.post("/auth/sign-out", async (req, reply) => {
    if (!verifyCsrf(req, reply)) return reply;

    const presented = req.cookies?.[REFRESH_COOKIE];
    if (presented) await revokeRefreshToken(presented);
    clearAuthCookies(reply);
    return reply.code(204).send();
  });

  app.get("/auth/me", async (req, reply) => {
    const user = await resolveUser(req, { reloadUser: true });
    return reply.send({ user: user ?? null });
  });

  /**
   * Imports an accountless recovery-link tour into the signed-in account. The
   * original recovery link keeps working — claiming copies, it does not consume.
   */
  app.post(
    "/auth/claim-tour",
    { preHandler: requireAuthenticatedUser() },
    async (req, reply) => {
      const token = String(req.body?.token || "");
      if (token.length < 32) return fail(reply, 400, "That recovery link is not valid.");

      const recoveryTokenHash = createHash("sha256").update(token).digest("hex");

      let snapshot = null;
      const existing = await prisma.tourSession.findUnique({ where: { recoveryTokenHash } });
      if (existing) {
        snapshot = existing.snapshot;
      } else {
        try {
          snapshot = (await legacySessionStore.get(token)).snapshot;
        } catch {
          return fail(reply, 404, "This saved tour is unavailable or has expired.");
        }
      }

      const safeSnapshot = sanitizeSnapshot(snapshot);
      const tour = await prisma.tourSession.upsert({
        where: { recoveryTokenHash },
        update: { userId: req.user.id, snapshot: safeSnapshot },
        create: { userId: req.user.id, recoveryTokenHash, snapshot: safeSnapshot }
      });

      if (safeSnapshot.visitedExhibitIds.length > 0) {
        await prisma.tourExhibit.createMany({
          data: safeSnapshot.visitedExhibitIds.map((exhibitId) => ({
            tourSessionId: tour.id,
            exhibitId
          })),
          skipDuplicates: true
        });
      }

      return reply.send({ tourId: tour.id, snapshot: safeSnapshot });
    }
  );
}
