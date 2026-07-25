/**
 * FEAT-015 — Client-side persona display metadata.
 *
 * Icons and labels only — full prompt engineering stays server-side
 * in backend/lib/personas.js. The transitionGreeting is duplicated
 * here so VoiceGuideOverlay can render the caption text immediately
 * on persona switch without waiting for a server round-trip.
 *
 * ⚠ Persona IDs (kids | scholar | royal) are shared contracts —
 *   do NOT rename them without a version bump in CHANGELOG_CONTRACTS.md.
 */
export const PERSONAS = [
  {
    id: "kids",
    label: "Explorer Kids",
    icon: "🎒",
    transitionGreeting:
      "Hey there, explorer! 🎒 Ready to discover something seriously amazing? Let's go on an adventure!"
  },
  {
    id: "scholar",
    label: "History Scholar",
    icon: "🎓",
    transitionGreeting:
      "Let us examine this artifact through the lens of documented historical record. I shall provide precise context drawn from primary sources and material analysis."
  },
  {
    id: "royal",
    label: "Imperial Guide",
    icon: "👑",
    transitionGreeting:
      "I am honored to receive you, esteemed visitor. Allow me to share with you the treasures of our great empire and the legacy of those who defended this sacred land."
  }
];
