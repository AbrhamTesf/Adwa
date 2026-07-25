const QUEUE_KEY = "adwa-lens.analytics-queue";
const SESSION_KEY = "adwa-lens.analytics-session";
const MAX_QUEUE = 200;
const BATCH_SIZE = 50;
const FLUSH_DELAY_MS = 1500;

let flushTimer = null;
let flushing = false;

/**
 * A rotating, random per-visit id. It is not derived from anything about the
 * person and is never linked to an account, so it groups a visit without
 * identifying who made it.
 */
function sessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const generated = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    window.sessionStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return "ephemeral0000000000000000000000";
  }
}

function eventId() {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  }
}

function readQueue() {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(events) {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-MAX_QUEUE)));
  } catch {
    // Private browsing or a full quota: events are dropped rather than
    // breaking the visit.
  }
}

/**
 * Only these fields are ever sent. Anything else a caller passes is discarded
 * here, before it can reach the network — no transcripts, audio, images or
 * recovery tokens.
 */
function buildEvent(name, details = {}) {
  return {
    id: eventId(),
    name,
    sessionId: sessionId(),
    exhibitId: typeof details.exhibitId === "string" ? details.exhibitId : undefined,
    persona: typeof details.persona === "string" ? details.persona : undefined,
    durationMs: Number.isFinite(details.durationMs) ? Math.trunc(details.durationMs) : undefined,
    stopIndex: Number.isInteger(details.stopIndex) ? details.stopIndex : undefined,
    service: typeof details.service === "string" ? details.service : undefined,
    code: typeof details.code === "string" ? details.code : undefined
  };
}

/**
 * Sends queued events. Client-generated ids make the endpoint idempotent, so a
 * flush that fails midway can be retried without creating duplicates.
 */
export async function flushAnalytics() {
  if (flushing || typeof navigator === "undefined" || !navigator.onLine) return;

  const queued = readQueue();
  if (queued.length === 0) return;

  flushing = true;
  try {
    while (readQueue().length > 0) {
      const pending = readQueue();
      const batch = pending.slice(0, BATCH_SIZE);

      const response = await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ events: batch })
      });
      if (!response.ok) break;

      const sent = new Set(batch.map((event) => event.id));
      writeQueue(readQueue().filter((event) => !sent.has(event.id)));
    }
  } catch {
    // Stay queued and retry on the next event or reconnection.
  } finally {
    flushing = false;
  }
}

export function trackEvent(name, details) {
  if (typeof window === "undefined") return;

  writeQueue([...readQueue(), buildEvent(name, details)]);

  clearTimeout(flushTimer);
  flushTimer = window.setTimeout(flushAnalytics, FLUSH_DELAY_MS);
}

/** Registers reconnection and page-hide flushes. Returns a cleanup function. */
export function startAnalytics() {
  if (typeof window === "undefined") return () => {};

  const onOnline = () => flushAnalytics();
  const onHide = () => {
    if (document.visibilityState === "hidden") flushAnalytics();
  };

  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onHide);
  flushAnalytics();

  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onHide);
    clearTimeout(flushTimer);
  };
}
