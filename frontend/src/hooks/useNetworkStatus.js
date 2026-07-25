import { useEffect } from "react";
import { useSessionStore } from "../stores/useSessionStore";

/**
 * FEAT-022 — Offline / Degraded-Network Contingency & Service Worker Hook.
 * Registers Service Worker (/sw.js) and performs periodic health pings + navigator.onLine checks
 * to classify connection status: online / throttled / offline.
 */
export function useNetworkStatus() {
  const setNetworkStatus = useSessionStore((s) => s.setNetworkStatus);

  useEffect(() => {
    // 1. Register Service Worker for offline exhibit pre-caching
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (reg.installing) {
            console.log("[Adwa SW] Service worker installing...");
          } else if (reg.active) {
            console.log("[Adwa SW] Service worker active and caching exhibit data.");
          }
        })
        .catch((err) => {
          console.warn("[Adwa SW] Service worker registration failed:", err);
        });
    }

    // 2. Health & Latency Checker
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
