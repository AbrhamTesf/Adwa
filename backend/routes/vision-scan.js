/**
 * [1]-[2] CAMERA FRAME CAPTURE -> GEMINI FLASH VISION CALL
 * Client sends a base64 JPEG frame. This proxy forces strict JSON schema
 * output from Gemini so the client can trust exhibit_id/confidence shape.
 */
import { normalizeError } from "../lib/errors.js";

const SYSTEM_PROMPT_VISION = `You are a museum artifact classifier for an Ethiopian history museum.
Given an image frame, identify the closest matching exhibit from this
known catalog: [shotel_sword, wanza_drum, embilta_horn, meleket_horn, adwa_war_map, royal_regalia].
Respond ONLY with the JSON schema provided. If no confident match exists,
set exhibit_id to 'unknown' and confidence below 0.5. Never include any
text outside the JSON object.`;

export default async function visionScanRoute(app) {
  app.post("/vision-scan", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.code(400).send({ error: true, message: "Missing 'image' (base64 JPEG)" });

      const apiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

      const payload = {
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT_VISION },
              { inlineData: { mimeType: "image/jpeg", data: image } }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              exhibit_id: { type: "string" },
              confidence: { type: "number" },
              material_guess: { type: "string" }
            },
            required: ["exhibit_id", "confidence"]
          }
        }
      };

      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!upstream.ok) {
        const errText = await upstream.text();
        throw { status: upstream.status, message: errText, provider: "gemini" };
      }

      const data = await upstream.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      const parsed = JSON.parse(text);

      const threshold = parseFloat(process.env.VISION_CONFIDENCE_THRESHOLD || "0.85");
      return res.send({ ...parsed, threshold, aboveThreshold: parsed.confidence >= threshold });
    } catch (err) {
      return normalizeError(res, err);
    }
  });
}
