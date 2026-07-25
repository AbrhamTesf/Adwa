import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

const apiKey = process.env.GEMINI_API_KEY;
console.log("==========================================");
console.log("Gemini Vision Test Script");
console.log("API Key loaded:", apiKey ? `${apiKey.substring(0, 10)}...` : "MISSING");
console.log("==========================================");

if (!apiKey) {
  console.error("Error: GEMINI_API_KEY is missing.");
  process.exit(1);
}

// 1. Read sample image file
const sampleImagePath = path.join(__dirname, "../../frontend/public/models/posters/gasha_poster.png");
let rawImageData = "";
let mimeType = "image/png";

if (fs.existsSync(sampleImagePath)) {
  console.log(`Reading sample image from: ${sampleImagePath}`);
  const buf = fs.readFileSync(sampleImagePath);
  rawImageData = `data:image/png;base64,${buf.toString("base64")}`;
} else {
  console.log("Using fallback base64 1x1 image");
  rawImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
}

// 2. Clean base64 payload
let cleanBase64 = rawImageData;
if (rawImageData.startsWith("data:")) {
  const matches = rawImageData.match(/^data:(image\/\w+);base64,(.+)$/);
  if (matches) {
    mimeType = matches[1];
    cleanBase64 = matches[2];
  } else {
    cleanBase64 = rawImageData.replace(/^data:image\/\w+;base64,/, "");
  }
}

console.log(`Payload prepared: length=${cleanBase64.length}, detected mimeType=${mimeType}`);

// 3. Send REST request to Gemini API
const candidateModels = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];

async function runVisionTest() {
  for (const modelName of candidateModels) {
    console.log(`\n------------------------------------------`);
    console.log(`Testing Gemini Vision model: ${modelName}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const bodyPayload = {
      contents: [
        {
          parts: [
            { text: "Identify this exhibit from Adwa Museum. Return a valid JSON with keys: 'exhibitId', 'exhibitTitle', 'confidence', 'summary'." },
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            }
          ]
        }
      ]
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });

      console.log(`HTTP Status: ${res.status} ${res.statusText}`);
      const json = await res.json();
      console.log("Full JSON Response Body:");
      console.log(JSON.stringify(json, null, 2));

      if (res.status === 200) {
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("\nRaw Output Text:");
        console.log(text);
        if (text) {
          const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanedText);
          console.log("\nSuccessfully parsed JSON object:");
          console.log(parsed);
          break;
        }
      }
    } catch (err) {
      console.error(`Error testing ${modelName}:`, err);
    }
  }
}

runVisionTest();
