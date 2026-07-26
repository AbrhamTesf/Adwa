/**
 * FEAT-022 — Offline Service Worker & Top-20 Exhibit Pre-Cache
 * Provides offline contingency caching for exhibit metadata JSONs,
 * 3D models, app shell, and static persona script fallbacks.
 */

const CACHE_NAME = "adwa-lens-v2";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/exhibits/shotel_sword.json",
  "/exhibits/negarit_drum.json",
  "/exhibits/taytu_statue.json",
  "/exhibits/embilta.json",
  "/exhibits/meleket.json",
  "/models/taytu_statue.glb",
  "/models/shotel_sword.glb"
];

// Install Event: Pre-cache core museum exhibit JSONs & app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn("SW precache partial warning:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up legacy caches & claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First for App Code & Scripts, Cache-First for 3D Models/Assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Bypass cache entirely for Vite dev server HMR & source files
  if (
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.includes("node_modules")
  ) {
    return;
  }

  // 1. Exhibit Metadata JSON & Models → Cache First with Stale-While-Revalidate
  if (url.pathname.startsWith("/exhibits/") || url.pathname.startsWith("/models/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2. Navigation / App Shell → Network First with Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/index.html") || caches.match("/");
      })
    );
    return;
  }

  // 3. General Static Code & Assets → Network First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200 && (url.protocol === "http:" || url.protocol === "https:")) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (url.pathname.endsWith(".json")) {
            return new Response(
              JSON.stringify({
                offline: true,
                name: "Offline Museum Exhibit",
                persona_scripts: {
                  usage: "Cached exhibit information available offline."
                }
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          }
        });
      })
  );
});
