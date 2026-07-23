/**
 * ElevenLabs streaming TTS proxy. Client falls back to
 * window.speechSynthesis if this call fails (offline/quota).
 */
import { normalizeError } from "../lib/errors.js";
import { PERSONA_VOICE_IDS } from "../lib/personas.js";

export default async function ttsStreamRoute(app) {
  app.post("/tts-stream", async (req, res) => {
    try {
      const { text, persona = "scholar", voiceId } = req.body;
      if (!text) return res.code(400).send({ error: true, message: "Missing 'text'" });

      const resolvedVoiceId = voiceId || PERSONA_VOICE_IDS[persona] || PERSONA_VOICE_IDS.scholar;

      const upstream = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}/stream`,
        {
          method: "POST",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2",
            voice_settings: { stability: 0.4, similarity_boost: 0.8 }
          })
        }
      );

      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text();
        throw { status: upstream.status, message: errText, provider: "elevenlabs" };
      }

      res.header("Content-Type", "audio/mpeg");
      for await (const chunk of upstream.body) {
        res.raw.write(chunk);
      }
      res.raw.end();
    } catch (err) {
      return normalizeError(res, err);
    }
  });
}
