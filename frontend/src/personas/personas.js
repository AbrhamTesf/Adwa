/**
 * FEAT-015 — Client-side persona display metadata with Amharic & English support.
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
    label: {
      en: "Explorer Kids",
      am: "የሕፃናት አሳሽ"
    },
    icon: "🎒",
    transitionGreeting: {
      en: "Hey there, explorer! 🎒 Ready to discover something seriously amazing? Let's go on an adventure!",
      am: "ሰላም አሳሽ! 🎒 ድንቅ ነገር ለማወቅ ተዘጋጅተሃል? ወደ አስደሳች ጉዞ እንሂድ!"
    }
  },
  {
    id: "scholar",
    label: {
      en: "History Scholar",
      am: "የታሪክ ተመራማሪ"
    },
    icon: "🎓",
    transitionGreeting: {
      en: "Let us examine this artifact through the lens of documented historical record. I shall provide precise context drawn from primary sources and material analysis.",
      am: "ይህንን ቅርሳዊ ማስረጃ በታሪካዊ መረጃዎች መነፅር እንመርምር። ከዋና ምንጮች የተቀዱ ትክክለኛ መረጃዎችን አቀርባለሁ።"
    }
  },
  {
    id: "royal",
    label: {
      en: "Imperial Guide",
      am: "የንግሥና መሪ"
    },
    icon: "👑",
    transitionGreeting: {
      en: "I am honored to receive you, esteemed visitor. Allow me to share with you the treasures of our great empire and the legacy of those who defended this sacred land.",
      am: "ክቡር እንግዳችን፣ እንኳን ደህና መጡ። የዚህች የተቀደሰች ምድር የጀግኖች ታሪክና ቅርስ አካፍልዎታለሁ።"
    }
  }
];

export function getPersonaLabel(persona, lang = "en") {
  if (!persona) return "";
  if (typeof persona.label === "string") return persona.label;
  return persona.label?.[lang] || persona.label?.en || "";
}

export function getPersonaGreeting(persona, lang = "en") {
  if (!persona) return "";
  if (typeof persona.transitionGreeting === "string") return persona.transitionGreeting;
  return persona.transitionGreeting?.[lang] || persona.transitionGreeting?.en || "";
}
