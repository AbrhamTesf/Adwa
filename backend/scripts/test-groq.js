import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root or workspace root
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function testGroqApi() {
  console.log("=================================================");
  console.log(" TESTING GROQ LLM API ENDPOINT (FEAT-009)");
  console.log("=================================================\n");

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("❌ ERROR: GROQ_API_KEY is not defined in environment!");
    process.exit(1);
  }

  const model = process.env.GROQ_LLM_MODEL || "llama-3.3-70b-versatile";
  const prompt = "Explain the significance of Empress Taytu in 2 sentences.";

  console.log(`Key Found: ${apiKey.substring(0, 4)}...${apiKey.slice(-4)}`);
  console.log(`Target Model: ${model}`);
  console.log(`Prompt: "${prompt}"\n`);

  const startTime = Date.now();

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "You are a concise museum historian." },
          { role: "user", content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const duration = Date.now() - startTime;

    console.log(`HTTP Status Code: ${res.status} ${res.statusText}`);
    console.log(`Response Latency: ${duration} ms`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ Groq API Failed: ${errText}`);
      process.exit(1);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    console.log("\n--- Output Response ---");
    console.log(reply);
    console.log("\n✅ SUCCESS: Groq API test completed successfully!");
  } catch (err) {
    console.error(`❌ Network / Runtime Error: ${err.message}`);
    process.exit(1);
  }
}

testGroqApi();
