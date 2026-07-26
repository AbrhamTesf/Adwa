import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import visionScanRoute from "./routes/vision-scan.js";
import sttRoute from "./routes/stt.js";
import askGuideRoute from "./routes/ask-guide.js";
import ttsStreamRoute from "./routes/tts-stream.js";
import sessionsRoute from "./routes/sessions.js";
import analyticsRoute from "./routes/analytics.js";

dotenv.config();

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173"
});

// Simple per-session rate limiting could be added here (Section: EDGE / SERVERLESS GATEWAY)
app.register(visionScanRoute, { prefix: "/api" });
app.register(sttRoute, { prefix: "/api" });
app.register(askGuideRoute, { prefix: "/api" });
app.register(ttsStreamRoute, { prefix: "/api" });
app.register(sessionsRoute, { prefix: "/api" });
app.register(analyticsRoute, { prefix: "/api" });

app.get("/api/health", async () => ({ status: "ok", service: "adwa-lens-bff" }));

const port = process.env.PORT || 8787;
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`Adwa Lens BFF listening on :${port}`);
});
