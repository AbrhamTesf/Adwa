/**
 * [5] VOICE Q&A LOOP — Groq Whisper-large-v3-turbo speech-to-text.
 * Accepts a multipart audio blob and returns { text }.
 */
import { normalizeError } from "../lib/errors.js";

export default async function sttRoute(app) {
  app.post("/stt", async (req, res) => {
    try {
      const data = await req.file();
      if (!data) return res.code(400).send({ error: true, message: "Missing audio file" });

      const form = new FormData();
      const buffer = await data.toBuffer();
      form.append("file", new Blob([buffer]), "speech.webm");
      form.append("model", process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo");
      form.append("response_format", "json");

      const upstream = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: form
      });

      if (!upstream.ok) {
        const errText = await upstream.text();
        throw { status: upstream.status, message: errText, provider: "groq-whisper" };
      }

      const json = await upstream.json();
      return res.send({ text: json.text });
    } catch (err) {
      return normalizeError(res, err);
    }
  });
}
