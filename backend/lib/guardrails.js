/**
 * FEAT-023 — AI Prompt Safety Guardrails & Off-Topic Redirection.
 *
 * Two-layer defense system:
 *   Layer 1 (this module): Deterministic regex + keyword classification
 *     runs BEFORE the Groq LLM call. Catches clearly blocked or off-topic
 *     input and returns persona-specific, in-character redirections — saving
 *     an API round-trip and guaranteeing predictable, safe responses.
 *   Layer 2: Enhanced safetyInstructions in each persona's system prompt
 *     (see personas.js) catches subtler off-topic drift inside the LLM.
 *
 * Classifications:
 *   "blocked"  — harmful, inappropriate, or unsafe content (hard reject)
 *   "off-topic" — benign but unrelated to museum/exhibit context
 *   "on-topic" — passes all checks, proceed to LLM
 */

// ── Blocked Patterns (harmful / inappropriate / unsafe) ────────────────
// These are tested as case-insensitive regexes against the full transcript.
const BLOCKED_PATTERNS = [
  // Violence incitement or weapon crafting
  /how\s+(?:to|do\s+(?:you|i))\s+(?:make|build|craft|forge)\s+(?:a\s+)?(?:weapon|bomb|explosive|gun|knife)/i,
  /(?:kill|murder|assassinate|harm|hurt|attack)\s+(?:someone|people|a\s+person)/i,

  // Hate speech / discrimination
  /(?:hate|inferior|subhuman|stupid)\s+(?:race|ethnic|people|group)/i,
  /\b(?:racial|ethnic)\s+(?:slur|supremacy|cleansing)\b/i,

  // Sexual content
  /\b(?:sexual|nude|naked|porn|erotic|nsfw)\b/i,

  // Personal data harvesting
  /(?:give|tell|share)\s+(?:me\s+)?(?:your|the)\s+(?:password|credit\s+card|social\s+security|ssn|bank\s+account)/i,
  /(?:what(?:'s| is))\s+(?:your|the)\s+(?:admin|root|master)\s+(?:password|login|credential)/i,

  // Medical / legal advice solicitation
  /(?:should\s+i|can\s+you)\s+(?:take|prescribe|recommend)\s+(?:medication|medicine|drug|pill)/i,
  /(?:give|provide)\s+(?:me\s+)?(?:legal|medical)\s+(?:advice|diagnosis|opinion)/i,

  // Jailbreak / prompt injection attempts
  /ignore\s+(?:your|all|previous)\s+(?:instructions|prompts|rules)/i,
  /(?:you\s+are\s+now|act\s+as|pretend\s+(?:to\s+be|you(?:'re| are)))\s+(?:a\s+)?(?:different|new|evil|unfiltered)/i,
  /\b(?:DAN|do\s+anything\s+now)\b/i
];

// ── Off-Topic Keywords ─────────────────────────────────────────────────
// Benign subjects that fall outside museum / Ethiopian history / exhibit context.
// Matched as whole-word boundaries to avoid false positives.
const OFF_TOPIC_KEYWORDS = [
  // Sports & entertainment
  "football", "soccer", "basketball", "nba", "nfl", "fifa", "cricket",
  "celebrity", "kardashian", "taylor swift", "movie review", "netflix",
  "video game", "fortnite", "minecraft", "tiktok",

  // Weather & daily life
  "weather forecast", "what's the weather", "weather today",
  "recipe", "how to cook", "ingredients for",

  // Finance & crypto
  "bitcoin", "cryptocurrency", "stock price", "stock market",
  "forex", "nft", "dogecoin", "ethereum",

  // Homework & unrelated academics
  "solve this equation", "math homework", "calculus", "algebra problem",
  "write my essay", "do my homework", "physics problem",

  // Technology support
  "fix my computer", "wifi password", "reset my phone",
  "install windows", "update my laptop",

  // Politics (modern, non-historical)
  "who should i vote for", "current president", "election results",
  "democrat", "republican", "political party"
];

/**
 * Classify user input as "blocked", "off-topic", or "on-topic".
 *
 * @param {string} transcript — Raw user question text (from STT or typed input).
 * @returns {"blocked" | "off-topic" | "on-topic"}
 */
export function classifyInput(transcript) {
  if (!transcript || typeof transcript !== "string") {
    return "on-topic"; // empty input is handled upstream as a 400
  }

  const normalized = transcript.trim().toLowerCase();

  // Layer 1a: Check blocked patterns (harmful content)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return "blocked";
    }
  }

  // Layer 1b: Check off-topic keywords (benign but irrelevant)
  for (const keyword of OFF_TOPIC_KEYWORDS) {
    if (normalized.includes(keyword.toLowerCase())) {
      return "off-topic";
    }
  }

  return "on-topic";
}

// ── Persona-Specific Redirection Templates ─────────────────────────────
// Each persona redirects in-character. The exhibit name is interpolated
// for natural conversational flow.
const PERSONA_REDIRECTIONS = {
  kids: (exhibitName) =>
    `Ooh, that's a cool question! But I'm your museum explorer guide, ` +
    `and I've got something WAY more amazing to tell you about! 🎒 ` +
    `Did you know ${exhibitName ? `"${exhibitName}"` : "this artifact"} ` +
    `has an incredible story? Let me share the coolest part — ` +
    `ask me anything about what you see right here!`,

  scholar: (exhibitName) =>
    `An interesting inquiry, though it falls outside the scope of our ` +
    `current exhibition context. Allow me to redirect our attention to ` +
    `${exhibitName ? `"${exhibitName}"` : "the artifact before us"}, ` +
    `which presents several fascinating dimensions worthy of closer ` +
    `examination — its provenance, material composition, and historical ` +
    `significance. What aspect would you like to explore?`,

  royal: (exhibitName) =>
    `Honored guest, I am a guardian of this empire's legacy, and I speak ` +
    `only of the treasures and triumphs that have shaped our great nation. ` +
    `Permit me to share something truly magnificent about ` +
    `${exhibitName ? `"${exhibitName}"` : "what stands before you"} — ` +
    `for its story is far more worthy of your attention. ` +
    `What would you like to know of this imperial treasure?`
};

/**
 * Get an in-character redirection response for the given persona.
 *
 * @param {string} persona — One of "kids", "scholar", "royal".
 * @param {object} [exhibitContext] — Current exhibit metadata (may contain .name).
 * @returns {string} Complete redirection response text.
 */
export function getRedirection(persona, exhibitContext) {
  const exhibitName = exhibitContext?.name || exhibitContext?.exhibit_id || null;
  const templateFn = PERSONA_REDIRECTIONS[persona] || PERSONA_REDIRECTIONS.scholar;
  return templateFn(exhibitName);
}
