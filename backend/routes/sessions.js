import { normalizeError } from "../lib/errors.js";
import { createSessionStore } from "../lib/sessionStore.js";

const sessionStore = createSessionStore();

/** Accountless, recovery-token session API. Tokens stay in request bodies, never route paths. */
export default async function sessionsRoute(app) {
  app.post("/sessions", async (request, reply) => {
    try {
      const session = await sessionStore.create(request.body?.snapshot);
      return reply.code(201).send({ token: session.token, snapshot: session.snapshot, updatedAt: session.updatedAt, expiresAt: session.expiresAt });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.post("/sessions/restore", async (request, reply) => {
    try {
      const session = await sessionStore.get(request.body?.token);
      return reply.send({ snapshot: session.snapshot, updatedAt: session.updatedAt, expiresAt: session.expiresAt });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.put("/sessions", async (request, reply) => {
    try {
      const session = await sessionStore.update(request.body?.token, request.body?.snapshot);
      return reply.send({ snapshot: session.snapshot, updatedAt: session.updatedAt, expiresAt: session.expiresAt });
    } catch (error) {
      return normalizeError(reply, error);
    }
  });

  app.delete("/sessions", async (request, reply) => {
    try {
      await sessionStore.revoke(request.body?.token);
      return reply.code(204).send();
    } catch (error) {
      return normalizeError(reply, error);
    }
  });
}