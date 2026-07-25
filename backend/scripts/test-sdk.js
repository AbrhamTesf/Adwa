import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];

async function testSDK() {
  for (const m of models) {
    console.log(`Testing SDK with model: ${m}`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hello, respond in 5 words.");
      console.log(`Success (${m}):`, result.response.text());
    } catch (err) {
      console.error(`Error (${m}):`, err.message);
    }
  }
}

testSDK();
