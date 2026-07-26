import { prisma } from "../lib/prisma.js";
import { ROLE_ADMIN_STAFF, requireRole } from "../lib/authorize.js";
import { normalizeError } from "../lib/errors.js";

/**
 * Closed vocabulary. An unknown event name is dropped rather than stored, so
 * a future client cannot start recording something the privacy review never saw.
 */
const EVENT_NAMES = new Set([
  "tour_started",
  "tour_completed",
  "screen_viewed",
  "exhibit_scanned",
  "exhibit_viewed",
  "persona_selected",
  "voice_guide_used",
  "sensory_interaction",
  "quiz_completed",
  "badge_unlocked",
  "service_error"
]);

const PERSONAS = new Set(["kids", "scholar", "royal"]);
const MAX_BATCH = 50;
const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const SLUG_PATTERN = /^[a-z0-9_-]{1,60}$/;

function fail(reply, status, message) {
  return reply.code(status).send({ error: true, message, provider: "analytics", retryable: status >= 500 });
}

function boundedInt(value, max) {
  if (!Number.isFinite(value)) return null;
  const rounded = Math.trunc(value);
  if (rounded < 0) return null;
  return Math.min(rounded, max);
}

/**
 * Rebuilds each event from an allowlist. Free-text fields are deliberately
 * absent: no transcripts, no audio, no camera frames, no recovery tokens can
 * reach the table even if a client sends them.
 */
function sanitizeEvent(input) {
  if (!input || typeof input !== "object") return null;
  if (!EVENT_NAMES.has(input.name)) return null;

  const sessionId = typeof input.sessionId === "string" ? input.sessionId.trim() : "";
  if (!ID_PATTERN.test(sessionId)) return null;

  const exhibitId = typeof input.exhibitId === "string" ? input.exhibitId.trim() : "";
  const service = typeof input.service === "string" ? input.service.trim() : "";
  const code = typeof input.code === "string" ? input.code.trim() : "";
  const id = typeof input.id === "string" && ID_PATTERN.test(input.id) ? input.id : undefined;

  return {
    ...(id ? { id } : {}),
    name: input.name,
    sessionId,
    exhibitId: SLUG_PATTERN.test(exhibitId) ? exhibitId : null,
    persona: PERSONAS.has(input.persona) ? input.persona : null,
    durationMs: boundedInt(Number(input.durationMs), 6 * 60 * 60 * 1000),
    stopIndex: boundedInt(Number(input.stopIndex), 500),
    service: SLUG_PATTERN.test(service) ? service : null,
    code: SLUG_PATTERN.test(code) ? code : null
  };
}

function parseRange(query) {
  const to = query?.to ? new Date(query.to) : new Date();
  const from = query?.from
    ? new Date(query.from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    const error = new Error("Invalid date range.");
    error.status = 400;
    error.provider = "analytics";
    throw error;
  }
  return { from, to };
}

export default async function analyticsRoute(app) {
  const staffOnly = { preHandler: requireRole(ROLE_ADMIN_STAFF) };

  /**
   * Open to guests — visitors are not signed in. Client-supplied ids make the
   * write idempotent, so an offline queue can safely resend a flush that was
   * only partly acknowledged.
   */
  app.post("/analytics/events", async (req, reply) => {
    try {
      const incoming = Array.isArray(req.body?.events) ? req.body.events : [req.body?.event];
      if (incoming.length > MAX_BATCH) {
        return fail(reply, 413, `Send at most ${MAX_BATCH} events per request.`);
      }

      const events = incoming.map(sanitizeEvent).filter(Boolean);
      if (events.length === 0) return reply.code(202).send({ accepted: 0, rejected: incoming.length });

      const result = await prisma.analyticsEvent.createMany({ data: events, skipDuplicates: true });
      return reply.code(202).send({
        accepted: result.count,
        duplicates: events.length - result.count,
        rejected: incoming.length - events.length
      });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.get("/admin/analytics/summary", staffOnly, async (req, reply) => {
    try {
      const { from, to } = parseRange(req.query);
      const range = { createdAt: { gte: from, lte: to } };

      const [
        totalEvents,
        sessions,
        byName,
        byExhibit,
        byPersona,
        dropOff,
        failures,
        durations
      ] = await Promise.all([
        prisma.analyticsEvent.count({ where: range }),
        prisma.analyticsEvent.findMany({
          where: range,
          distinct: ["sessionId"],
          select: { sessionId: true }
        }),
        prisma.analyticsEvent.groupBy({ by: ["name"], where: range, _count: { _all: true } }),
        prisma.analyticsEvent.groupBy({
          by: ["exhibitId"],
          where: { ...range, name: { in: ["exhibit_viewed", "exhibit_scanned"] }, exhibitId: { not: null } },
          _count: { _all: true }
        }),
        prisma.analyticsEvent.groupBy({
          by: ["persona"],
          where: { ...range, persona: { not: null } },
          _count: { _all: true }
        }),
        prisma.analyticsEvent.groupBy({
          by: ["stopIndex"],
          where: { ...range, stopIndex: { not: null } },
          _count: { _all: true }
        }),
        prisma.analyticsEvent.groupBy({
          by: ["service", "code"],
          where: { ...range, name: "service_error" },
          _count: { _all: true }
        }),
        prisma.analyticsEvent.aggregate({
          where: { ...range, durationMs: { not: null } },
          _avg: { durationMs: true },
          _max: { durationMs: true }
        })
      ]);

      const rank = (rows, key) =>
        rows
          .map((row) => ({ key: row[key], count: row._count._all }))
          .sort((a, b) => b.count - a.count);

      return reply.send({
        range: { from, to },
        totals: {
          events: totalEvents,
          sessions: sessions.length,
          averageDurationMs: Math.round(durations._avg.durationMs || 0),
          longestDurationMs: durations._max.durationMs || 0
        },
        eventsByName: rank(byName, "name"),
        popularExhibits: rank(byExhibit, "exhibitId").slice(0, 10),
        personaUsage: rank(byPersona, "persona"),
        routeDropOff: dropOff
          .map((row) => ({ stopIndex: row.stopIndex, count: row._count._all }))
          .sort((a, b) => a.stopIndex - b.stopIndex),
        serviceFailures: failures
          .map((row) => ({ service: row.service, code: row.code, count: row._count._all }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });
}
