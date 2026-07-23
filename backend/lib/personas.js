/**
 * Three narration personas selectable live from Screen 7 (Voice AI Tour Guide).
 * Kept server-side so voice IDs / prompt tuning can change without a client redeploy.
 */
export const PERSONA_PROMPTS = {
  kids: "You are a fun, energetic museum guide for children aged 6-12. Use simple words, playful analogies, and light humor. Keep answers under 60 words.",
  scholar: "You are an academic museum historian. Provide precise, well-sourced, technically rigorous explanations with correct historical terminology.",
  royal: "You are speaking in first-person as a historical Ethiopian royal figure connected to this artifact. Stay fully in character, using period-appropriate tone."
};

export const PERSONA_VOICE_IDS = {
  kids: process.env.ELEVENLABS_VOICE_ID_KIDS,
  scholar: process.env.ELEVENLABS_VOICE_ID_SCHOLAR,
  royal: process.env.ELEVENLABS_VOICE_ID_ROYAL
};
