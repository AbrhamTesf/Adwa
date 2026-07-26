import { useSessionStore } from "../stores/useSessionStore";
import enLocale from "../locales/en";
import amLocale from "../locales/am";

/**
 * Safely resolves nested keys using dot notation (e.g. "landing.startTour").
 * Prevents TypeError if a parent or child property is undefined.
 */
export function resolveKey(obj, path) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((prev, curr) => prev?.[curr], obj);
}

/**
 * Lightweight zero-dependency translation hook for Adwa Lens.
 * Reads active language from `useSessionStore` and resolves string translations.
 * Automatically falls back to English if an Amharic string is missing.
 */
export function useTranslation() {
  const language = useSessionStore((state) => state.language) || "en";
  const translations = language === "am" ? amLocale : enLocale;

  const t = (key, fallback = "") => {
    const val = resolveKey(translations, key);
    if (val !== undefined && val !== null) return val;

    // Fallback to English if key is missing in active locale
    const enVal = resolveKey(enLocale, key);
    if (enVal !== undefined && enVal !== null) return enVal;

    return fallback || key;
  };

  return { t, language };
}
