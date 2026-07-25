import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_SESSION_AGE_DAYS = 30;
const MAX_ITINERARY_STOPS = 30;
const MAX_VISITED_EXHIBITS = 30;
const PERSONAS = new Set(["kids", "scholar", "royal"]);
const LANGUAGES = new Set(["en", "am", "es"]);

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.provider = "session-store";
  return error;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeStringList(value, maximum) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string" && item.length <= 120))].slice(0, maximum);
}

/** Validates the small, non-sensitive tour snapshot shared between devices. */
export function sanitizeSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) throw httpError(400, "A session snapshot is required.");

  const itinerary = Array.isArray(snapshot.itinerary)
    ? snapshot.itinerary.filter(isPlainObject).slice(0, MAX_ITINERARY_STOPS)
    : [];
  const currentStopIndex = Number.isInteger(snapshot.currentStopIndex)
    ? Math.min(Math.max(snapshot.currentStopIndex, 0), Math.max(itinerary.length - 1, 0))
    : 0;

  return {
    version: 1,
    language: LANGUAGES.has(snapshot.language) ? snapshot.language : "en",
    partyType: typeof snapshot.partyType === "string" ? snapshot.partyType.slice(0, 40) : null,
    timeBudgetMinutes: Number.isFinite(snapshot.timeBudgetMinutes) ? snapshot.timeBudgetMinutes : null,
    interests: sanitizeStringList(snapshot.interests, 12),
    accessibilityOnly: Boolean(snapshot.accessibilityOnly),
    persona: PERSONAS.has(snapshot.persona) ? snapshot.persona : "scholar",
    itinerary,
    currentStopIndex,
    visitedExhibitIds: sanitizeStringList(snapshot.visitedExhibitIds, MAX_VISITED_EXHIBITS),
    unlockedBadgeIds: sanitizeStringList(snapshot.unlockedBadgeIds, 24)
  };
}

/** File-backed development store; set SESSION_STORE_PATH to use a mounted production volume. */
export function createSessionStore({ filePath = process.env.SESSION_STORE_PATH } = {}) {
  const storePath = filePath || path.resolve(process.cwd(), ".data", "sessions.json");

  async function readDatabase() {
    try {
      const raw = await readFile(storePath, "utf8");
      const parsed = JSON.parse(raw);
      return isPlainObject(parsed) && isPlainObject(parsed.sessions) ? parsed : { version: 1, sessions: {} };
    } catch (error) {
      if (error.code === "ENOENT") return { version: 1, sessions: {} };
      throw httpError(503, "Saved tours are temporarily unavailable.");
    }
  }

  async function writeDatabase(database) {
    await mkdir(path.dirname(storePath), { recursive: true });
    const temporaryPath = `${storePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(database, null, 2), "utf8");
    await rename(temporaryPath, storePath);
  }

  function removeExpired(database, now = Date.now()) {
    for (const [digest, session] of Object.entries(database.sessions)) {
      if (!session?.expiresAt || Date.parse(session.expiresAt) <= now) delete database.sessions[digest];
    }
  }

  async function create(snapshot) {
    const database = await readDatabase();
    removeExpired(database);
    const token = randomBytes(32).toString("base64url");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + MAX_SESSION_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const session = { snapshot: sanitizeSnapshot(snapshot), updatedAt: now.toISOString(), expiresAt };
    database.sessions[hashToken(token)] = session;
    await writeDatabase(database);
    return { token, ...session };
  }

  async function get(token) {
    if (typeof token !== "string" || token.length < 32) throw httpError(400, "Invalid recovery link.");
    const database = await readDatabase();
    removeExpired(database);
    const session = database.sessions[hashToken(token)];
    if (!session) {
      await writeDatabase(database);
      throw httpError(404, "This saved tour is unavailable or has expired.");
    }
    return session;
  }

  async function update(token, snapshot) {
    const database = await readDatabase();
    removeExpired(database);
    const digest = hashToken(token);
    const previous = database.sessions[digest];
    if (!previous) throw httpError(404, "This saved tour is unavailable or has expired.");
    const session = { ...previous, snapshot: sanitizeSnapshot(snapshot), updatedAt: new Date().toISOString() };
    database.sessions[digest] = session;
    await writeDatabase(database);
    return session;
  }

  async function revoke(token) {
    const database = await readDatabase();
    delete database.sessions[hashToken(token)];
    await writeDatabase(database);
  }

  return { create, get, update, revoke };
}