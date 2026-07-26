import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test image: Shotel Sword poster
const shotelImagePath = path.join(__dirname, "../../frontend/public/models/posters/shotel_sword_poster.webp");
const imageBuffer = fs.readFileSync(shotelImagePath);
const base64Image = `data:image/webp;base64,${imageBuffer.toString("base64")}`;

async function testShotelScan() {
  console.log("Sending Shotel Sword poster scan request to http://localhost:8787/api/vision-scan ...");
  try {
    const res = await fetch("http://localhost:8787/api/vision-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image })
    });

    console.log("Endpoint Status:", res.status, res.statusText);
    const json = await res.json();
    console.log("\n--- Vision Scan API Response ---");
    console.log(JSON.stringify(json, null, 2));

    if (json.exhibit_id === "shotel_sword") {
      console.log("\n SUCCESS! Correctly recognized exhibit_id: 'shotel_sword'");
    } else {
      console.log(`\n Exhibit ID returned: '${json.exhibit_id}' (usedModel: ${json.usedModel || 'fallback'})`);
    }
  } catch (err) {
    console.error("Test error:", err.message);
  }
}

testShotelScan();
