/**
 * [5] Persona-conditioned RAG response via Groq Llama 3.3 70B.
 * Streams SSE chunks straight through to the client, which pipes
 * tokens into ElevenLabs streaming TTS as they arrive.
 */
import { normalizeError } from "../lib/errors.js";
import { PERSONA_PROMPTS } from "../lib/personas.js";

export default async function askGuideRoute(app) {
  app.post("/ask-guide", async (req, res) => {
    try {
      const { transcript, exhibitContext, persona = "scholar" } = req.body;
      if (!transcript) return res.code(400).send({ error: true, message: "Missing 'transcript'" });

      const systemPrompt = `${PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.scholar}
Exhibit context (ground your answer in this, do not invent facts):
${JSON.stringify(exhibitContext || {})}
If the visitor asks something unrelated or inappropriate, politely redirect
back to the exhibit's history, material, or cultural significance.`;

      const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.GROQ_LLM_MODEL || "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcript }
          ],
          stream: true
        })
      });

      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text();
        throw { status: upstream.status, message: errText, provider: "groq-llama" };
      }

      res.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });

      for await (const chunk of upstream.body) {
        res.raw.write(chunk);
      }
      res.raw.end();
    } catch (err) {
      return normalizeError(res, err);
    }
  });
}
