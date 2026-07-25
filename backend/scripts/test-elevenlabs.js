import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

const DEFAULT_PUBLIC_VOICE_ID = "cgSgspJ2msm6clMCkdW9"; // Jessica

async function testElevenLabsApi() {
  console.log("=================================================");
  console.log(" TESTING ELEVENLABS TTS STREAMING API (FEAT-009)");
  console.log("=================================================\n");

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("❌ ERROR: ELEVENLABS_API_KEY is not defined in environment!");
    process.exit(1);
  }

  let voiceId =
    process.env.ELEVENLABS_VOICE_ID ||
    process.env.ELEVENLABS_VOICE_ID_KIDS ||
    process.env.ELEVENLABS_VOICE_ID_SCHOLAR ||
    DEFAULT_PUBLIC_VOICE_ID;

  if (!voiceId || voiceId.startsWith("voice_id_") || voiceId.length < 15) {
    console.log(`[INFO] Invalid/placeholder Voice ID detected. Falling back to public voice: ${DEFAULT_PUBLIC_VOICE_ID}`);
    voiceId = DEFAULT_PUBLIC_VOICE_ID;
  }

  const text = "Empress Taytu Betul was a master military strategist at the Battle of Adwa.";

  console.log(`Key Found: ${apiKey.substring(0, 4)}...${apiKey.slice(-4)}`);
  console.log(`Voice ID: ${voiceId}`);
  console.log(`Text Payload: "${text}"\n`);

  const startTime = Date.now();

  const attemptTts = async (idToUse) => {
    return await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${idToUse}/stream`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });
  };

  try {
    let res = await attemptTts(voiceId);

    // If initial custom/placeholder voice fails, try querying account premade voices or fallback ID
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`⚠️ Warning: Voice ID '${voiceId}' returned HTTP ${res.status}: ${errText}`);
      console.log(`[INFO] Retrying with public fallback Voice ID: ${DEFAULT_PUBLIC_VOICE_ID}...`);
      voiceId = DEFAULT_PUBLIC_VOICE_ID;
      res = await attemptTts(voiceId);
    }

    const duration = Date.now() - startTime;

    console.log(`HTTP Status Code: ${res.status} ${res.statusText}`);
    console.log(`Response Latency: ${duration} ms`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ ElevenLabs TTS Failed: ${errText}`);
      process.exit(1);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const outputPath = path.join(__dirname, "test-output.mp3");
    fs.writeFileSync(outputPath, buffer);

    console.log(`Audio Buffer Size: ${buffer.length} bytes`);
    console.log(`Saved MP3 File: ${outputPath}`);
    console.log("\n✅ SUCCESS: ElevenLabs TTS stream test completed successfully!");
  } catch (err) {
    console.error(`❌ Network / Runtime Error: ${err.message}`);
    process.exit(1);
  }
}

testElevenLabsApi();
