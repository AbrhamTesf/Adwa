import { create } from "zustand";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flag: "EN", ttsVoiceId: "default" },
  { code: "am", label: "አማርኛ (Amharic)", flag: "AM", ttsVoiceId: "browser_fallback" },
  { code: "es", label: "Español (Spanish)", flag: "ES", ttsVoiceId: "multilingual" }
];

/**
 * App State Manager — session context, tour history, offline queue.
 * (mirrors "App State Manager (Zustand/Redux)" in the architecture diagram)
 */
export const useSessionStore = create((set, get) => ({
  language: "en", // en | am | es
  partyType: null, // individual | family | scholar
  timeBudgetMinutes: null, // 20 | 45 | 120 | null (no limit)
  interests: [],
  accessibilityOnly: false,

  persona: "scholar", // kids | scholar | royal
  itinerary: [],
  currentStopIndex: 0,
  visitedExhibitIds: [],

  networkStatus: "online", // online | throttled | offline

  setLanguage: (language) => set({ language }),
  setOnboarding: (partial) => set(partial),
  setPersona: (persona) => set({ persona }),
  setItinerary: (itinerary) => set({ itinerary, currentStopIndex: 0 }),
  markVisited: (exhibitId) =>
    set((s) => ({
      visitedExhibitIds: s.visitedExhibitIds.includes(exhibitId)
        ? s.visitedExhibitIds
        : [...s.visitedExhibitIds, exhibitId]
    })),
  setNetworkStatus: (networkStatus) => set({ networkStatus }),
  resetSession: () =>
    set({
      partyType: null,
      timeBudgetMinutes: null,
      interests: [],
      accessibilityOnly: false,
      itinerary: [],
      currentStopIndex: 0,
      visitedExhibitIds: []
    })
}));
