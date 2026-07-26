import React from "react";
import { useSessionStore } from "../../stores/useSessionStore";

/**
 * Global Language Toggle Button for Adwa Lens (EN | AM).
 * Floating glassmorphic toggle in top-right corner matching the Adwa design system.
 */
export default function LanguageToggle() {
  const language = useSessionStore((state) => state.language) || "en";
  const setLanguage = useSessionStore((state) => state.setLanguage);

  const toggleLanguage = () => {
    const nextLang = language === "am" ? "en" : "am";
    setLanguage(nextLang);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        type="button"
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-imperial-gold/40 bg-obsidian/85 backdrop-blur-md shadow-gold-glow hover:border-imperial-gold transition-all duration-200 text-xs font-semibold text-parchment cursor-pointer"
        aria-label="Toggle language between English and Amharic"
      >
        <span className="text-sm">{language === "am" ? "🇪🇹" : "🇬🇧"}</span>
        <span className="tracking-wider uppercase font-bold text-imperial-gold">
          {language === "am" ? "አማ" : "EN"}
        </span>
        <span className="text-[10px] text-parchment/40">|</span>
        <span className="text-[10px] text-parchment/70 uppercase">
          {language === "am" ? "EN" : "አማርኛ"}
        </span>
      </button>
    </div>
  );
}
