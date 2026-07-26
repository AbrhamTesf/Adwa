/**
 * FEAT-009 — Persona-conditioned RAG response via Groq Llama 3.3 70B.
 * FEAT-023 — AI Prompt Safety Guardrails & Off-Topic Redirection.
 *
 * Streams SSE chunks straight through to the client, which pipes
 * tokens into ElevenLabs streaming TTS as they arrive.
 *
 * Guardrail flow (FEAT-023):
 *   1. Classify user transcript via deterministic regex/keyword engine.
 *   2. If "blocked" or "off-topic" → return pre-composed in-character
 *      redirection as SSE (identical format to LLM stream), skip Groq call.
 *   3. If "on-topic" → proceed to Groq with enhanced safety system prompt.
 */
import { normalizeError } from "../lib/errors.js";
import { PERSONA_PROMPTS } from "../lib/personas.js";
import { classifyInput, getRedirection } from "../lib/guardrails.js";

export default async function askGuideRoute(app) {
  app.post("/ask-guide", async (req, res) => {
    try {
      const { transcript, exhibitContext, persona = "scholar", language = "en" } = req.body || {};
      if (!transcript) return res.code(400).send({ error: true, message: "Missing 'transcript'" });

      // ── Layer 1: Pre-LLM Guardrail Classification ──────────────────
      const classification = classifyInput(transcript);

      if (classification !== "on-topic") {
        // Log classification for monitoring (no PII — just label + persona + exhibit)
        console.warn(JSON.stringify({
          event: "guardrail_triggered",
          classification,
          persona,
          exhibitId: exhibitContext?.exhibit_id || "unknown",
          timestamp: new Date().toISOString()
        }));

        // Return in-character redirection as SSE stream (same format as Groq)
        // so the client TTS pipeline works identically without special-casing.
        const redirectionText = getRedirection(persona, exhibitContext);
        const ssePayload = formatAsSSE(redirectionText);

        res.raw.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive"
        });
        res.raw.write(ssePayload);
        res.raw.end();
        return;
      }

      // ── Layer 2: On-Topic → Groq LLM with Enhanced Safety Prompt ───
      const langInstruction = language === "am" ? "\nIMPORTANT: Respond fluently in Amharic using Ge'ez script (አማርኛ). Maintain the character persona." : "";
      const systemPrompt = `${PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.scholar}
Exhibit context (ground your answer in this, do not invent facts):
${JSON.stringify(exhibitContext || {})}
If the visitor asks something unrelated or inappropriate, politely redirect
back to the exhibit's history, material, or cultural significance.${langInstruction}`;

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
        console.error(`[ask-guide Error] Groq upstream status ${upstream.status}: ${errText}`);
        throw { status: upstream.status, message: errText, provider: "groq-llama" };
      }

      res.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        Connection: "keep-alive"
      });

      for await (const chunk of upstream.body) {
        res.raw.write(chunk);
      }
      res.raw.end();
    } catch (err) {
      console.error("[ask-guide Error]:", err);
      return normalizeError(res, err);
    }
  });
}

/**
 * Format a plain text redirection response as an OpenAI-compatible SSE stream.
 * This ensures the client SSE parser + TTS pipeline processes guardrail
 * redirections identically to real LLM responses — no special-casing needed.
 *
 * @param {string} text — The redirection response text.
 * @returns {string} SSE-formatted string with data lines and [DONE] terminator.
 */
function formatAsSSE(text) {
  // Emit the full text as a single SSE "delta" chunk, then close the stream.
  const chunk = {
    id: `guardrail-${Date.now()}`,
    object: "chat.completion.chunk",
    choices: [{
      index: 0,
      delta: { content: text },
      finish_reason: null
    }]
  };
  const doneChunk = {
    id: `guardrail-${Date.now()}`,
    object: "chat.completion.chunk",
    choices: [{
      index: 0,
      delta: {},
      finish_reason: "stop"
    }]
  };

  return `data: ${JSON.stringify(chunk)}\n\ndata: ${JSON.stringify(doneChunk)}\n\ndata: [DONE]\n\n`;
}
