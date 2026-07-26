import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";

const CACHE_PREFIX = "exhibit:";
const VERSION_PREFIX = "exhibit-version:";

/** Published CMS record, or null when nothing is published or we are offline. */
async function fetchPublished(exhibitId) {
  const res = await fetch(`/api/content/${exhibitId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.content ? { content: data.content, version: data.version } : null;
}

/** Bundled fallback so the demo path works with no database at all. */
async function fetchStatic(exhibitId) {
  const res = await fetch(`/exhibits/${exhibitId}.json`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Exhibit metadata cache — IndexedDB-backed for offline glb/JSON access.
 * (mirrors "Offline queue + IndexedDB cache" in the architecture diagram)
 *
 * Reads are cache-first so an exhibit opens instantly and works offline, then
 * revalidate against the CMS in the background: staff publishing a change
 * reaches visitors without a frontend deployment, at the cost of the current
 * view being one load stale.
 */
export const useExhibitStore = create((set, get) => ({
  activeExhibit: null, // { exhibit_id, glb_url, hotspot_json, audio_profile, persona_scripts }
  isLoading: false,
  scanError: null,

  async loadExhibit(exhibitId) {
    set({ isLoading: true, scanError: null });
    try {
      const cached = await idbGet(`${CACHE_PREFIX}${exhibitId}`);
      if (cached) {
        set({ activeExhibit: cached, isLoading: false });
        get().revalidateExhibit(exhibitId);
        return cached;
      }

      const published = await fetchPublished(exhibitId).catch(() => null);
      const data = published?.content || (await fetchStatic(exhibitId));
      if (!data) throw new Error("Exhibit metadata not found");

      await idbSet(`${CACHE_PREFIX}${exhibitId}`, data);
      if (published) await idbSet(`${VERSION_PREFIX}${exhibitId}`, published.version);

      set({ activeExhibit: data, isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false, scanError: err.message });
      return null;
    }
  },

  /** Silent background refresh; failures leave the cached copy in place. */
  async revalidateExhibit(exhibitId) {
    try {
      const published = await fetchPublished(exhibitId);
      if (!published) return;

      const knownVersion = await idbGet(`${VERSION_PREFIX}${exhibitId}`);
      if (knownVersion === published.version) return;

      await idbSet(`${CACHE_PREFIX}${exhibitId}`, published.content);
      await idbSet(`${VERSION_PREFIX}${exhibitId}`, published.version);

      if (get().activeExhibit?.exhibit_id === exhibitId) {
        set({ activeExhibit: published.content });
      }
    } catch {
      // Offline or CMS unavailable: the cached exhibit stays valid.
    }
  },

  clearActiveExhibit: () => set({ activeExhibit: null })
}));
