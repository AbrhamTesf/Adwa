import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";

/**
 * Exhibit metadata cache — IndexedDB-backed for offline glb/JSON access.
 * (mirrors "Offline queue + IndexedDB cache" in the architecture diagram)
 */
export const useExhibitStore = create((set, get) => ({
  activeExhibit: null, // { exhibit_id, glb_url, hotspot_json, audio_profile, persona_scripts }
  isLoading: false,
  scanError: null,

  async loadExhibit(exhibitId) {
    set({ isLoading: true, scanError: null });
    try {
      const cached = await idbGet(`exhibit:${exhibitId}`);
      if (cached) {
        set({ activeExhibit: cached, isLoading: false });
        return cached;
      }
      const res = await fetch(`/exhibits/${exhibitId}.json`);
      if (!res.ok) throw new Error("Exhibit metadata not found");
      const data = await res.json();
      await idbSet(`exhibit:${exhibitId}`, data);
      set({ activeExhibit: data, isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false, scanError: err.message });
      return null;
    }
  },

  clearActiveExhibit: () => set({ activeExhibit: null })
}));
