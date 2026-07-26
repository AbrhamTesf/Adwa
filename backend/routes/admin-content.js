import { prisma } from "../lib/prisma.js";
import { ROLE_ADMIN_STAFF, recordAuditLog, requireRole } from "../lib/authorize.js";
import { sanitizeExhibitContent } from "../lib/contentSchema.js";
import { normalizeError } from "../lib/errors.js";

function fail(reply, status, message) {
  return reply.code(status).send({ error: true, message, provider: "content", retryable: status >= 500 });
}

function publicItem(item) {
  return {
    id: item.id,
    exhibitId: item.exhibitId,
    status: item.status,
    version: item.version,
    updatedAt: item.updatedAt,
    hasDraft: Boolean(item.draft),
    isPublished: Boolean(item.published)
  };
}

/**
 * Museum content management. Staff edit a draft, publish it as an immutable
 * version, and roll back by republishing an earlier version — history is only
 * ever appended to, so a rollback is itself auditable and reversible.
 */
export default async function adminContentRoute(app) {
  const staffOnly = { preHandler: requireRole(ROLE_ADMIN_STAFF) };

  /** Public read used by the visitor app; unpublished exhibits 404 to guests. */
  app.get("/content/:exhibitId", async (req, reply) => {
    try {
      const item = await prisma.contentItem.findUnique({
        where: { exhibitId: req.params.exhibitId }
      });
      if (!item?.published) return fail(reply, 404, "No published content for that exhibit.");

      return reply.send({
        content: item.published,
        version: item.version,
        updatedAt: item.updatedAt
      });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.get("/admin/content", staffOnly, async (req, reply) => {
    try {
      const items = await prisma.contentItem.findMany({ orderBy: { exhibitId: "asc" } });
      return reply.send({ items: items.map(publicItem) });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.get("/admin/content/:exhibitId", staffOnly, async (req, reply) => {
    try {
      const item = await prisma.contentItem.findUnique({
        where: { exhibitId: req.params.exhibitId },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 20,
            select: { id: true, version: true, publishedAt: true, editorId: true }
          }
        }
      });
      if (!item) return fail(reply, 404, "That exhibit has no content record yet.");

      return reply.send({
        item: publicItem(item),
        draft: item.draft,
        published: item.published,
        versions: item.versions
      });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  /** Saves a draft without affecting what visitors currently see. */
  app.put("/admin/content/:exhibitId/draft", staffOnly, async (req, reply) => {
    try {
      const { exhibitId } = req.params;
      const draft = sanitizeExhibitContent(req.body?.content, exhibitId);

      const item = await prisma.contentItem.upsert({
        where: { exhibitId },
        update: { draft, status: "draft" },
        create: { exhibitId, draft, status: "draft" }
      });

      await recordAuditLog({
        actorId: req.user.id,
        action: "content.draft.save",
        resource: `content_items/${exhibitId}`,
        metadata: { version: item.version },
        ipAddress: req.ip
      });

      return reply.send({ item: publicItem(item), draft });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.post("/admin/content/:exhibitId/publish", staffOnly, async (req, reply) => {
    try {
      const { exhibitId } = req.params;
      const existing = await prisma.contentItem.findUnique({ where: { exhibitId } });
      if (!existing?.draft) return fail(reply, 409, "There is no draft to publish.");

      const content = sanitizeExhibitContent(existing.draft, exhibitId);
      const version = existing.version + 1;

      // One transaction so a published item can never exist without the
      // matching history row.
      const [item] = await prisma.$transaction([
        prisma.contentItem.update({
          where: { exhibitId },
          data: { published: content, status: "published", version }
        }),
        prisma.contentVersion.create({
          data: { contentItemId: existing.id, version, content, editorId: req.user.id }
        })
      ]);

      await recordAuditLog({
        actorId: req.user.id,
        action: "content.publish",
        resource: `content_items/${exhibitId}`,
        metadata: { version },
        ipAddress: req.ip
      });

      return reply.send({ item: publicItem(item), published: content });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  /**
   * Republishes an earlier version as a new one. The history stays immutable,
   * so rolling back a rollback is just another rollback.
   */
  app.post("/admin/content/:exhibitId/rollback", staffOnly, async (req, reply) => {
    try {
      const { exhibitId } = req.params;
      const targetVersion = Number(req.body?.version);
      if (!Number.isInteger(targetVersion) || targetVersion < 1) {
        return fail(reply, 400, "Specify which version to roll back to.");
      }

      const existing = await prisma.contentItem.findUnique({ where: { exhibitId } });
      if (!existing) return fail(reply, 404, "That exhibit has no content record yet.");

      const snapshot = await prisma.contentVersion.findUnique({
        where: { contentItemId_version: { contentItemId: existing.id, version: targetVersion } }
      });
      if (!snapshot) return fail(reply, 404, `Version ${targetVersion} does not exist.`);

      const content = sanitizeExhibitContent(snapshot.content, exhibitId);
      const version = existing.version + 1;

      const [item] = await prisma.$transaction([
        prisma.contentItem.update({
          where: { exhibitId },
          data: { published: content, draft: content, status: "published", version }
        }),
        prisma.contentVersion.create({
          data: { contentItemId: existing.id, version, content, editorId: req.user.id }
        })
      ]);

      await recordAuditLog({
        actorId: req.user.id,
        action: "content.rollback",
        resource: `content_items/${exhibitId}`,
        metadata: { restoredFrom: targetVersion, version },
        ipAddress: req.ip
      });

      return reply.send({ item: publicItem(item), published: content, restoredFrom: targetVersion });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.get("/admin/content/:exhibitId/versions/:version", staffOnly, async (req, reply) => {
    try {
      const item = await prisma.contentItem.findUnique({ where: { exhibitId: req.params.exhibitId } });
      if (!item) return fail(reply, 404, "That exhibit has no content record yet.");

      const snapshot = await prisma.contentVersion.findUnique({
        where: {
          contentItemId_version: { contentItemId: item.id, version: Number(req.params.version) }
        }
      });
      if (!snapshot) return fail(reply, 404, "That version does not exist.");

      return reply.send({
        version: snapshot.version,
        content: snapshot.content,
        publishedAt: snapshot.publishedAt
      });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });
}
