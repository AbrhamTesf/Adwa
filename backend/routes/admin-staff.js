import { randomBytes } from "node:crypto";
import { normalizeEmail, prisma } from "../lib/prisma.js";
import { hashToken, revokeAllUserTokens } from "../lib/tokens.js";
import {
  ROLE_ADMIN_STAFF,
  ROLE_SUPER_ADMIN,
  recordAuditLog,
  requireRole
} from "../lib/authorize.js";
import { normalizeError } from "../lib/errors.js";

const DEFAULT_INVITATION_DAYS = 14;
const MAX_INVITATION_DAYS = 90;

function fail(reply, status, message) {
  return reply.code(status).send({ error: true, message, provider: "admin", retryable: status >= 500 });
}

function publicInvitation(invitation) {
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
    usedAt: invitation.usedAt,
    createdBy: invitation.createdBy?.displayName || null
  };
}

function publicStaffUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    roles: user.roles.map((assignment) => assignment.role.name),
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt,
    approvedBy: user.approvedBy?.displayName || null
  };
}

/**
 * Staff lifecycle: issuing invitations, approving pending accounts and
 * suspending access. Everything here is super_admin only — admin_staff can
 * manage content but must not be able to widen the set of administrators.
 */
export default async function adminStaffRoute(app) {
  const superAdminOnly = { preHandler: requireRole(ROLE_SUPER_ADMIN) };
  const anyStaff = { preHandler: requireRole(ROLE_ADMIN_STAFF) };

  app.get("/admin/staff/invitations", superAdminOnly, async (req, reply) => {
    try {
      const invitations = await prisma.staffInvitation.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { createdBy: { select: { displayName: true } } }
      });
      return reply.send({ invitations: invitations.map(publicInvitation) });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  /**
   * The plaintext code is returned exactly once, here. Only its hash is
   * stored, so a lost code has to be reissued rather than looked up.
   */
  app.post("/admin/staff/invitations", superAdminOnly, async (req, reply) => {
    try {
      const email = normalizeEmail(req.body?.email);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return fail(reply, 400, "Enter a valid staff email address.");
      }

      const requestedDays = Number(req.body?.expiresInDays || DEFAULT_INVITATION_DAYS);
      const days = Number.isFinite(requestedDays)
        ? Math.min(Math.max(Math.trunc(requestedDays), 1), MAX_INVITATION_DAYS)
        : DEFAULT_INVITATION_DAYS;

      if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
        return fail(reply, 409, "An account already exists for that email address.");
      }

      const code = randomBytes(24).toString("base64url");
      const invitation = await prisma.staffInvitation.create({
        data: {
          email,
          codeHash: hashToken(code),
          role: ROLE_ADMIN_STAFF,
          expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          createdById: req.user.id
        }
      });

      await recordAuditLog({
        actorId: req.user.id,
        action: "staff.invitation.create",
        resource: `staff_invitations/${invitation.id}`,
        metadata: { email, expiresInDays: days },
        ipAddress: req.ip
      });

      return reply.code(201).send({ invitation: publicInvitation(invitation), code });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.post("/admin/staff/invitations/:id/revoke", superAdminOnly, async (req, reply) => {
    try {
      const invitation = await prisma.staffInvitation.findUnique({ where: { id: req.params.id } });
      if (!invitation) return fail(reply, 404, "That invitation no longer exists.");
      if (invitation.status !== "pending") {
        return fail(reply, 409, `That invitation is already ${invitation.status}.`);
      }

      const updated = await prisma.staffInvitation.update({
        where: { id: invitation.id },
        data: { status: "revoked" }
      });

      await recordAuditLog({
        actorId: req.user.id,
        action: "staff.invitation.revoke",
        resource: `staff_invitations/${invitation.id}`,
        metadata: { email: invitation.email },
        ipAddress: req.ip
      });

      return reply.send({ invitation: publicInvitation(updated) });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  /** Staff directory. Readable by any staff member; only actions are restricted. */
  app.get("/admin/staff/users", anyStaff, async (req, reply) => {
    try {
      const status = req.query?.status;
      const users = await prisma.user.findMany({
        where: {
          ...(status ? { status } : {}),
          roles: { some: { role: { name: { in: [ROLE_ADMIN_STAFF, ROLE_SUPER_ADMIN] } } } }
        },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          roles: { include: { role: true } },
          approvedBy: { select: { displayName: true } }
        }
      });
      return reply.send({ users: users.map(publicStaffUser) });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.post("/admin/staff/users/:id/approve", superAdminOnly, async (req, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: { roles: { include: { role: true } } }
      });
      if (!user) return fail(reply, 404, "That account no longer exists.");
      if (user.status !== "pending") {
        return fail(reply, 409, `That account is already ${user.status}.`);
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { status: "active", approvedById: req.user.id },
        include: {
          roles: { include: { role: true } },
          approvedBy: { select: { displayName: true } }
        }
      });

      await recordAuditLog({
        actorId: req.user.id,
        action: "staff.user.approve",
        resource: `users/${user.id}`,
        metadata: { email: user.email },
        ipAddress: req.ip
      });

      return reply.send({ user: publicStaffUser(updated) });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  /**
   * Suspension revokes refresh tokens immediately; the access token still
   * works until it expires, but every guard re-reads status from the database.
   */
  app.post("/admin/staff/users/:id/suspend", superAdminOnly, async (req, reply) => {
    try {
      if (req.params.id === req.user.id) {
        return fail(reply, 400, "You cannot suspend your own account.");
      }

      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) return fail(reply, 404, "That account no longer exists.");

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { status: "suspended" },
        include: {
          roles: { include: { role: true } },
          approvedBy: { select: { displayName: true } }
        }
      });
      await revokeAllUserTokens(user.id);

      await recordAuditLog({
        actorId: req.user.id,
        action: "staff.user.suspend",
        resource: `users/${user.id}`,
        metadata: { email: user.email },
        ipAddress: req.ip
      });

      return reply.send({ user: publicStaffUser(updated) });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.get("/admin/audit-logs", anyStaff, async (req, reply) => {
    try {
      const logs = await prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: Math.min(Number(req.query?.limit) || 50, 200),
        include: { actor: { select: { displayName: true, email: true } } }
      });

      return reply.send({
        logs: logs.map((log) => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          metadata: log.metadata,
          createdAt: log.createdAt,
          actor: log.actor?.displayName || log.actor?.email || "unknown"
        }))
      });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });
}
