/**
 * [1]-[2] CAMERA FRAME CAPTURE -> GEMINI FLASH VISION CALL VIA @google/generative-ai SDK
 * Implements multi-model fallback chain (gemini-flash-latest -> gemini-2.5-flash -> gemini-2.0-flash -> gemini-2.5-flash-lite)
 * with robust base64 sanitization, detailed logging, markdown code-fence stripping, and quota fallbacks.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { normalizeError } from "../lib/errors.js";

const GEMINI_MODELS = [
  "gemini-flash-latest",    // Points to latest stable multimodal Flash model
  "gemini-2.5-flash",       // Primary model reference
  "gemini-2.0-flash",       // Alternate fallback
  "gemini-2.5-flash-lite"   // Lite fallback
];

const SYSTEM_PROMPT_VISION = `You are an expert computer vision model specializing in object recognition, document extraction, and visual context analysis for an Ethiopian history museum.

Analyze the image frame for prominent visual identifiers: distinctive shapes, branding/logos, key text labels, dominant colors, physical textures, and aspect ratios.

Match the image against known Ethiopian museum exhibit catalog items when applicable: [shotel_sword, menelik_taytu_statue, negarit_drum, embilta, meleket].

Handle low-light, rotated, or blurry images gracefully by supplying your best high-probability match alongside a lower confidence score rather than returning empty output.

Respond ONLY with clean JSON matching this exact structure:
{
  "identifiedItem": "Name or catalog ID of detected object/exhibit",
  "category": "Broad category",
  "confidence": 0.95,
  "details": {
    "keyVisualFeatures": ["feature 1", "feature 2"],
    "readableText": "Any text detected, or None",
    "conditionOrContext": "Note on lighting/angle/visibility"
  },
  "summary": "Concise summary of visual scan result"
}`;

const DEV_FALLBACK_NEGARIT = {
  identifiedItem: "negarit_drum",
  exhibit_id: "negarit_drum",
  category: "instrument",
  confidence: 0.95,
  details: {
    keyVisualFeatures: ["Wanza hardwood body", "Stretched cowhide membrane", "Imperial gold studs"],
    readableText: "None detected",
    conditionOrContext: "Simulated dev fallback scan"
  },
  summary: "Wanza hardwood & stretched hide Negarit ceremonial drum (Dev Fallback)",
  material_guess: "Wanza hardwood, stretched cowhide & imperial gold studs (Dev Fallback)",
  threshold: 0.85,
  aboveThreshold: true,
  quotaFallback: true,
  message: "Gemini vision service fallback active."
};

function toExhibitId(itemStr) {
  if (!itemStr) return "unknown";
  const s = String(itemStr).toLowerCase().trim().replace(/\s+/g, "_");
  if (s.includes("shotel") || s.includes("sword")) return "shotel_sword";
  if (s.includes("menelik") || s.includes("statue") || s.includes("taytu")) return "menelik_taytu_statue";
  if (s.includes("negarit") || s.includes("drum")) return "negarit_drum";
  if (s.includes("embilta")) return "embilta";
  if (s.includes("meleket")) return "meleket";
  if (["shotel_sword", "menelik_taytu_statue", "negarit_drum", "embilta", "meleket"].includes(s)) return s;
  return s;
}

export default async function visionScanRoute(app) {
  app.post("/vision-scan", async (req, res) => {
    try {
      const imageData = req.body?.image;
      if (!imageData) {
        app.log.error("Vision Scan Error: Missing 'image' payload in body");
        return res.code(400).send({ error: true, message: "Missing 'image' (base64 JPEG)" });
      }

      // Step 2: Base64 Sanitization & MIME Type Extraction
      let cleanBase64 = imageData;
      let mimeType = "image/jpeg";
      if (imageData.startsWith("data:")) {
        const matches = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          cleanBase64 = matches[2];
        } else {
          cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, "");
        }
      }

      // Enhanced Logging: Incoming payload metrics
      console.log(`[Vision Scan] Processing request - Base64 String Length: ${cleanBase64.length}, Detected MIME: ${mimeType}`);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.includes("your_gemini_api_key_here")) {
        console.warn("[Vision Scan] GEMINI_API_KEY missing or default placeholder. Using DEV_FALLBACK_NEGARIT.");
        return res.send(DEV_FALLBACK_NEGARIT);
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      let lastError = null;

      for (const modelName of GEMINI_MODELS) {
        try {
          console.log(`[Vision Scan] Attempting Gemini API call with model: ${modelName}`);
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT_VISION,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  identifiedItem: { type: "STRING" },
                  category: { type: "STRING" },
                  confidence: { type: "NUMBER" },
                  details: {
                    type: "OBJECT",
                    properties: {
                      keyVisualFeatures: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      },
                      readableText: { type: "STRING" },
                      conditionOrContext: { type: "STRING" }
                    },
                    required: ["keyVisualFeatures", "readableText", "conditionOrContext"]
                  },
                  summary: { type: "STRING" }
                },
                required: ["identifiedItem", "category", "confidence", "details", "summary"]
              }
            }
          });

          const result = await model.generateContent([
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            }
          ]);

          const responseText = result.response.text();
          // Enhanced Logging: Log raw model response prior to parsing
          console.log(`[Vision Scan] Raw Model Response (${modelName}):\n${responseText}`);

          // JSON Response Cleanup: Strip ```json markdown code block fences
          const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

          let parsed;
          try {
            parsed = JSON.parse(cleanedText);
          } catch (parseErr) {
            console.error(`[Vision Scan] Failed to parse JSON response from ${modelName}:`, parseErr.message);
            throw parseErr;
          }

          const exhibitId = toExhibitId(parsed.identifiedItem);
          const threshold = parseFloat(process.env.VISION_CONFIDENCE_THRESHOLD || "0.85");

          const responsePayload = {
            ...parsed,
            exhibit_id: exhibitId,
            material_guess: parsed.summary || parsed.details?.keyVisualFeatures?.join(", ") || "",
            threshold,
            aboveThreshold: parsed.confidence >= threshold,
            usedModel: modelName
          };

          console.log(`[Vision Scan] Success with model ${modelName}: Matched '${exhibitId}' (Confidence: ${parsed.confidence})`);
          return res.send(responsePayload);

        } catch (err) {
          console.error(`[Vision Scan] Model '${modelName}' failed with error:`, err.message || err);
          lastError = err;
        }
      }

      // If all models hit quota or network errors, fallback to DEV_FALLBACK_NEGARIT
      console.error("[Vision Scan] All Gemini models failed or hit quota limits. Returning DEV_FALLBACK_NEGARIT fallback.", lastError);
      return res.status(200).send(DEV_FALLBACK_NEGARIT);

    } catch (err) {
      console.error("[Vision Scan] Unhandled route handler exception:", err);
      return normalizeError(res, err);
    }
  });
}
