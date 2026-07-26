import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import dotenv from "dotenv";
import visionScanRoute from "./routes/vision-scan.js";
import sttRoute from "./routes/stt.js";
import askGuideRoute from "./routes/ask-guide.js";
import ttsStreamRoute from "./routes/tts-stream.js";
import sessionsRoute from "./routes/sessions.js";
import authRoute from "./routes/auth.js";
import adminStaffRoute from "./routes/admin-staff.js";
import adminContentRoute from "./routes/admin-content.js";
import analyticsRoute from "./routes/analytics.js";
import { disconnectPrisma } from "./lib/prisma.js";

dotenv.config();

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  // Auth cookies are only sent cross-origin when credentials are allowed.
  credentials: true
});

await app.register(cookie);

// Permissive default so the AI proxy routes keep working; the auth routes
// tighten this per-route via `config.rateLimit`.
await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute"
});

// Sign-out and refresh carry no payload, but clients routinely still send a
// JSON content-type header. Fastify's default parser rejects that as a 400, so
// an empty body is read as an empty object instead.
app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
  if (!body || body.trim() === "") return done(null, {});
  try {
    done(null, JSON.parse(body));
  } catch (error) {
    error.statusCode = 400;
    done(error, undefined);
  }
});
await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit for audio file recordings
  }
});

app.register(visionScanRoute, { prefix: "/api" });
app.register(sttRoute, { prefix: "/api" });
app.register(askGuideRoute, { prefix: "/api" });
app.register(ttsStreamRoute, { prefix: "/api" });
app.register(sessionsRoute, { prefix: "/api" });
app.register(authRoute, { prefix: "/api" });
app.register(adminStaffRoute, { prefix: "/api" });
app.register(adminContentRoute, { prefix: "/api" });
app.register(analyticsRoute, { prefix: "/api" });

app.get("/api/health", async () => ({ status: "ok", service: "adwa-lens-bff" }));

app.addHook("onClose", async () => {
  await disconnectPrisma();
});

const port = process.env.PORT || 8787;
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`Adwa Lens BFF listening on :${port}`);
});
