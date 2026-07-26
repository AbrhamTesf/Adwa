/**
 * [5] VOICE Q&A LOOP — Groq Whisper-large-v3-turbo speech-to-text.
 * Accepts a multipart audio blob and returns { text }.
 */
import { normalizeError } from "../lib/errors.js";

export default async function sttRoute(app) {
  app.post("/stt", async (req, res) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw { status: 500, message: "GROQ_API_KEY is not configured on server.", provider: "groq-whisper" };
      }

      const data = await req.file();
      if (!data) return res.code(400).send({ error: true, message: "Missing audio file payload" });

      const buffer = await data.toBuffer();
      if (!buffer || buffer.length === 0) {
        return res.code(400).send({ error: true, message: "Empty audio buffer received" });
      }

      const form = new FormData();
      const filename = data.filename || "speech.webm";
      const mimeType = data.mimetype || "audio/webm";

      form.append("file", new Blob([buffer], { type: mimeType }), filename);
      form.append("model", process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo");
      form.append("response_format", "json");

      const upstream = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: form
      });

      if (!upstream.ok) {
        const errText = await upstream.text();
        console.error(`[stt Error] Groq Whisper status ${upstream.status}: ${errText}`);
        throw { status: upstream.status, message: errText, provider: "groq-whisper" };
      }

      const json = await upstream.json();
      return res.send({ text: json.text || "" });
    } catch (err) {
      console.error("[stt Error]:", err);
      return normalizeError(res, err);
    }
  });
}
