import { createTourSnapshot, useSessionStore } from "../stores/useSessionStore";

const RECOVERY_TOKEN_KEY = "adwa-lens.recovery-token";
const SYNC_DELAY_MS = 900;
let activeSessionSync = null;

function resetActiveSessionSync() {
  activeSessionSync?.();
  activeSessionSync = null;
}

function getStoredToken() {
  try { return window.localStorage.getItem(RECOVERY_TOKEN_KEY); } catch { return null; }
}

function storeToken(token) {
  try { window.localStorage.setItem(RECOVERY_TOKEN_KEY, token); } catch { /* private browsing fallback: memory only */ }
}

async function request(url, options) {
  const response = await fetch(url, { headers: { "content-type": "application/json" }, ...options });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Saved tours are temporarily unavailable.");
  return data;
}

export function getRecoveryTokenFromHash() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return params.get("resume");
}

export function createRecoveryLink(token) {
  const url = new URL(window.location.href);
  url.hash = new URLSearchParams({ resume: token }).toString();
  return url.toString();
}

export async function createRecoverySession() {
  const state = useSessionStore.getState();
  state.setSessionSyncStatus("saving");
  try {
    const data = await request("/api/sessions", { method: "POST", body: JSON.stringify({ snapshot: createTourSnapshot(state) }) });
    storeToken(data.token);
    state.setRecoverySession(data.token, data.updatedAt);
    return { ...data, recoveryLink: createRecoveryLink(data.token) };
  } catch (error) {
    state.setSessionSyncStatus("error");
    throw error;
  }
}

export async function restoreRecoverySession(token) {
  const state = useSessionStore.getState();
  state.setSessionSyncStatus("restoring");
  try {
    const data = await request("/api/sessions/restore", { method: "POST", body: JSON.stringify({ token }) });
    storeToken(token);
    state.hydrateSession(data.snapshot, token, data.updatedAt);
    return data.snapshot;
  } catch (error) {
    state.setSessionSyncStatus("error");
    throw error;
  }
}

export function startSessionSync() {
  const state = useSessionStore.getState();
  const token = state.recoveryToken || getStoredToken();
  if (!token) return () => {};
  state.setRecoverySession(token, state.sessionLastSavedAt);

  let lastSnapshot = JSON.stringify(createTourSnapshot(useSessionStore.getState()));
  let timer;
  let syncing = false;

  const sync = async () => {
    if (syncing || !navigator.onLine) return;
    const current = useSessionStore.getState();
    const snapshot = JSON.stringify(createTourSnapshot(current));
    if (snapshot === lastSnapshot) return;
    syncing = true;
    current.setSessionSyncStatus("saving");
    try {
      const data = await request("/api/sessions", { method: "PUT", body: JSON.stringify({ token, snapshot: JSON.parse(snapshot) }) });
      lastSnapshot = snapshot;
      useSessionStore.getState().setSessionSyncStatus("saved", data.updatedAt);
    } catch {
      useSessionStore.getState().setSessionSyncStatus("error");
    } finally {
      syncing = false;
    }
  };

  const unsubscribe = useSessionStore.subscribe((nextState) => {
    const snapshot = JSON.stringify(createTourSnapshot(nextState));
    if (snapshot === lastSnapshot) return;
    clearTimeout(timer);
    timer = window.setTimeout(sync, SYNC_DELAY_MS);
  });
  window.addEventListener("online", sync);
  const cleanup = () => {
    clearTimeout(timer);
    unsubscribe();
    window.removeEventListener("online", sync);
    if (activeSessionSync === cleanup) activeSessionSync = null;
  };
  activeSessionSync = cleanup;
  return cleanup;
}