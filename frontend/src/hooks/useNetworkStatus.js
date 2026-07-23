import { useEffect } from "react";
import { useSessionStore } from "../stores/useSessionStore";

/**
 * [Section 1.3] Offline / Degraded-Network Contingency Flow.
 * Periodic ping + navigator.onLine to classify: online / throttled / offline.
 */
export function useNetworkStatus() {
  const setNetworkStatus = useSessionStore((s) => s.setNetworkStatus);

  useEffect(() => {
    async function check() {
      if (!navigator.onLine) {
        setNetworkStatus("offline");
        return;
      }
      const start = performance.now();
      try {
        await fetch("/api/health", { cache: "no-store" });
        const elapsed = performance.now() - start;
        setNetworkStatus(elapsed > 1200 ? "throttled" : "online");
      } catch {
        setNetworkStatus("offline");
      }
    }
    check();
    const id = setInterval(check, 15000);
    window.addEventListener("online", check);
    window.addEventListener("offline", check);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", check);
      window.removeEventListener("offline", check);
    };
  }, [setNetworkStatus]);
}
