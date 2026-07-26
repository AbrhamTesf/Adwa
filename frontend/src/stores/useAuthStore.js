import { create } from "zustand";
import { apiRequest } from "../lib/apiClient";

function authRequest(path, { method = "POST", body } = {}) {
  return apiRequest(`/api/auth/${path}`, { method, body });
}

export const useAuthStore = create((set, get) => ({
  user: null,
  roles: [],
  /** "unknown" until the first /me completes, so the UI can avoid flashing signed-out. */
  status: "unknown", // unknown | authenticated | anonymous
  pendingApproval: false,
  error: null,
  isSubmitting: false,

  isAdmin: () => get().roles.some((role) => role === "admin_staff" || role === "super_admin"),
  isSuperAdmin: () => get().roles.includes("super_admin"),

  clearError: () => set({ error: null }),

  applySession: (user) =>
    set({
      user,
      roles: user?.roles || [],
      status: user ? "authenticated" : "anonymous",
      pendingApproval: false,
      error: null
    }),

  /**
   * Called once on app load. A 401 here is the normal signed-out case, not an
   * error worth surfacing.
   */
  restoreSession: async () => {
    try {
      const data = await authRequest("me", { method: "GET" });
      get().applySession(data?.user ?? null);
    } catch {
      set({ user: null, roles: [], status: "anonymous" });
    }
  },

  signIn: async ({ email, password }) => {
    set({ isSubmitting: true, error: null });
    try {
      const data = await authRequest("sign-in", { body: { email, password } });
      get().applySession(data.user);
      return { ok: true };
    } catch (error) {
      set({ error: error.message });
      return { ok: false, message: error.message };
    } finally {
      set({ isSubmitting: false });
    }
  },

  signUp: async ({ displayName, email, password, role, invitationCode }) => {
    set({ isSubmitting: true, error: null });
    try {
      const data = await authRequest("sign-up", {
        body: { displayName, email, password, role, invitationCode }
      });

      if (data?.pendingApproval) {
        set({ pendingApproval: true, status: "anonymous" });
        return { ok: true, pendingApproval: true, message: data.message };
      }

      get().applySession(data.user);
      return { ok: true };
    } catch (error) {
      set({ error: error.message });
      return { ok: false, message: error.message };
    } finally {
      set({ isSubmitting: false });
    }
  },

  signOut: async () => {
    try {
      await authRequest("sign-out");
    } finally {
      set({ user: null, roles: [], status: "anonymous", pendingApproval: false, error: null });
    }
  },

  /** Imports an accountless recovery-link tour into the signed-in account. */
  claimTour: async (token) => {
    try {
      const data = await authRequest("claim-tour", { body: { token } });
      return { ok: true, snapshot: data.snapshot };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }
}));
