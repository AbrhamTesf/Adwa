/**
 * Centralized bilingual exhibit display metadata.
 *
 * INVARIANT: Every key in this map is an ASCII snake_case `exhibitId`.
 * These IDs are the routing/storage contract across the entire app.
 * Display names and summaries are resolved per-language at render time.
 *
 * Components import { EXHIBITS } and call:
 *   EXHIBITS[exhibitId]?.title[lang] || fallback
 */

export const EXHIBITS = {
  taytu_statue: {
    id: "taytu_statue",
    title: {
      en: "Empress Taytu Monument",
      am: "እቴጌ ጣይቱ ብጡል ሀውልት"
    },
    summary: {
      en: "Diplomat and strategist who played a pivotal role in the Battle of Adwa.",
      am: "በአድዋ ጦርነት ውስጥ ወሳኝ ሚና የተጫወቱ ስትራቴጂስት እና ዲፕሎማት።"
    },
    category: {
      en: "Monument",
      am: "ሐውልት"
    }
  },

  shotel_sword: {
    id: "shotel_sword",
    title: {
      en: "Shotel Curved Sword",
      am: "ሾተል ጎራዴ"
    },
    summary: {
      en: "Damascus-forged high-carbon steel blade optimized for cavalry combat at the Battle of Adwa.",
      am: "በአድዋ ጦርነት ለፈረሰኛ ውጊያ የተዘጋጀ ከፍተኛ ካርቦን ብረት ጎራዴ።"
    },
    category: {
      en: "Weapon",
      am: "የጦር መሣሪያ"
    }
  },

  negarit_drum: {
    id: "negarit_drum",
    title: {
      en: "Negarit Royal War Drum",
      am: "ነጋሪት የንጉሥ የጦር ከበሮ"
    },
    summary: {
      en: "Traditional ceremonial war drum used to rally troops and broadcast imperial declarations.",
      am: "ሰራዊትን ለመጥራትና የንጉሠ ነገሥቱን አዋጅ ለማወጅ ያገለግል የነበረ የጦር ነጋሪት።"
    },
    category: {
      en: "Instrument",
      am: "የሙዚቃ መሣሪያ"
    }
  },

  embilta: {
    id: "embilta",
    title: {
      en: "Embilta Ceremonial Flute",
      am: "እምቢልታ የሥርዓት ዋሽንት"
    },
    summary: {
      en: "Single-pitch keyless bamboo flute played in interlocking sets of three for royal ceremonies.",
      am: "ለንጉሣዊ ሥርዓት በሦስት ቡድን የሚነፋ ነጠላ-ድምፅ የቀርከሃ ዋሽንት።"
    },
    category: {
      en: "Instrument",
      am: "የሙዚቃ መሣሪያ"
    }
  },

  meleket: {
    id: "meleket",
    title: {
      en: "Meleket Royal Trumpet",
      am: "መለከት የንጉሥ ጥሩምባ"
    },
    summary: {
      en: "Long brass herald trumpet used to announce imperial proclamations and rally battlefield commands.",
      am: "የንጉሠ ነገሥቱን አዋጅ ለማወጅና የጦር ሜዳ ትእዛዝ ለማስተላለፍ ያገለግል የነበረ ረጅም የናስ ጥሩምባ።"
    },
    category: {
      en: "Instrument",
      am: "የሙዚቃ መሣሪያ"
    }
  },

  adwa_war_map: {
    id: "adwa_war_map",
    title: {
      en: "Adwa War Strategy Room",
      am: "የአድዋ ጦርነት ስትራቴጂ ክፍል"
    },
    summary: {
      en: "Tactical maps, battle formations, and strategic documents from the 1896 Battle of Adwa.",
      am: "ከ1896 የአድዋ ጦርነት የታክቲክ ካርታዎች፣ የጦር ድርጅቶችና ስትራቴጂያዊ ሰነዶች።"
    },
    category: {
      en: "Military Strategy",
      am: "ወታደራዊ ስትራቴጂ"
    }
  }
};

/**
 * Resolve a bilingual exhibit field with safe fallbacks.
 * @param {string} exhibitId — ASCII snake_case key
 * @param {string} field — "title" | "summary" | "category"
 * @param {string} lang — "en" | "am"
 * @returns {string}
 */
export function getExhibitText(exhibitId, field, lang = "en") {
  const exhibit = EXHIBITS[exhibitId];
  if (!exhibit) return exhibitId?.replace(/_/g, " ") || "";
  const bilingual = exhibit[field];
  if (!bilingual) return "";
  return bilingual[lang] || bilingual.en || "";
}
