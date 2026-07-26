import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flag: "EN", ttsVoiceId: "default" },
  { code: "am", label: "Amharic", flag: "AM", ttsVoiceId: "browser_fallback" },
  { code: "es", label: "Español (Spanish)", flag: "ES", ttsVoiceId: "multilingual" }
];

function clampStopIndex(index, itineraryLength) {
  const lastIndex = Math.max(itineraryLength - 1, 0);
  return Math.min(Math.max(index, 0), lastIndex);
}

/** Versioned, non-sensitive state persisted by FEAT-028 recovery sessions. */
export function createTourSnapshot(state) {
  return {
    version: 1,
    language: state.language,
    partyType: state.partyType,
    timeBudgetMinutes: state.timeBudgetMinutes,
    interests: state.interests,
    accessibilityOnly: state.accessibilityOnly,
    persona: state.persona,
    itinerary: state.itinerary,
    currentStopIndex: state.currentStopIndex,
    visitedExhibitIds: state.visitedExhibitIds,
    unlockedBadgeIds: state.unlockedBadgeIds
  };
}

/** App State Manager — session context, tour history, offline queue with localStorage persistence. */
export const useSessionStore = create(
  persist(
    (set) => ({
      language: "en",
      partyType: null,
      timeBudgetMinutes: null,
      interests: [],
      accessibilityOnly: false,
      persona: "scholar",
      itinerary: [],
      currentStopIndex: 0,
      visitedExhibitIds: [],
      unlockedBadgeIds: [],
      networkStatus: "online",
      recoveryToken: null,
      sessionSyncStatus: "idle",
      sessionLastSavedAt: null,

      setLanguage: (language) => set({ language }),
      setOnboarding: (partial) => set(partial),
      setPersona: (persona) => set({ persona }),
      setItinerary: (itinerary) => set({ itinerary, currentStopIndex: 0 }),
      setCurrentStopIndex: (index) => set((s) => ({ currentStopIndex: clampStopIndex(index, s.itinerary.length) })),
      advanceStop: () => set((s) => ({ currentStopIndex: clampStopIndex(s.currentStopIndex + 1, s.itinerary.length) })),
      markVisited: (exhibitId) => set((s) => ({ visitedExhibitIds: s.visitedExhibitIds.includes(exhibitId) ? s.visitedExhibitIds : [...s.visitedExhibitIds, exhibitId] })),
      unlockBadge: (badgeId) => set((s) => ({ unlockedBadgeIds: s.unlockedBadgeIds.includes(badgeId) ? s.unlockedBadgeIds : [...s.unlockedBadgeIds, badgeId] })),
      setNetworkStatus: (networkStatus) => set({ networkStatus }),
      setRecoverySession: (recoveryToken, sessionLastSavedAt = null) => set({ recoveryToken, sessionLastSavedAt, sessionSyncStatus: "saved" }),
      setSessionSyncStatus: (sessionSyncStatus, sessionLastSavedAt) => set((state) => ({ sessionSyncStatus, sessionLastSavedAt: sessionLastSavedAt ?? state.sessionLastSavedAt })),
      hydrateSession: (snapshot, recoveryToken, sessionLastSavedAt = null) => set({
        language: snapshot.language || "en",
        partyType: snapshot.partyType || null,
        timeBudgetMinutes: snapshot.timeBudgetMinutes ?? null,
        interests: Array.isArray(snapshot.interests) ? snapshot.interests : [],
        accessibilityOnly: Boolean(snapshot.accessibilityOnly),
        persona: snapshot.persona || "scholar",
        itinerary: Array.isArray(snapshot.itinerary) ? snapshot.itinerary : [],
        currentStopIndex: clampStopIndex(snapshot.currentStopIndex || 0, snapshot.itinerary?.length || 0),
        visitedExhibitIds: Array.isArray(snapshot.visitedExhibitIds) ? snapshot.visitedExhibitIds : [],
        unlockedBadgeIds: Array.isArray(snapshot.unlockedBadgeIds) ? snapshot.unlockedBadgeIds : [],
        recoveryToken,
        sessionLastSavedAt,
        sessionSyncStatus: "saved"
      }),
      resetSession: () => set({ partyType: null, timeBudgetMinutes: null, interests: [], accessibilityOnly: false, itinerary: [], currentStopIndex: 0, visitedExhibitIds: [], unlockedBadgeIds: [] })
    }),
    {
      name: "adwa-lens.session-store",
      partialize: (state) => ({
        language: state.language,
        partyType: state.partyType,
        timeBudgetMinutes: state.timeBudgetMinutes,
        interests: state.interests,
        accessibilityOnly: state.accessibilityOnly,
        persona: state.persona,
        itinerary: state.itinerary,
        currentStopIndex: state.currentStopIndex,
        visitedExhibitIds: state.visitedExhibitIds,
        unlockedBadgeIds: state.unlockedBadgeIds,
        recoveryToken: state.recoveryToken
      })
    }
  )
);