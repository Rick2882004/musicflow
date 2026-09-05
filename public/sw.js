// MusicFlow Service Worker — v5
// Strategy: App Shell (offline-first for navigation) + Network-first for API
// 
// CRITICAL: We do NOT cache:
//   - YouTube playback URLs (cross-origin, live media)
//   - Live audio / video media streams or HTTP range requests
//   - MediaSession state (in-memory)
//   - Supabase auth tokens (security)
//   - API responses that must be fresh (/api/*)

const CACHE_VERSION = "v5";
const STATIC_CACHE = `musicflow-static-${CACHE_VERSION}`;
const SHELL_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/silence.wav",
];

// ── Install: Pre-cache the app shell ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(async (cache) => {
        // Cache critical assets individually so a single network glitch won't abort SW installation
        await Promise.allSettled(
          SHELL_ASSETS.map(async (asset) => {
            try {
              const res = await fetch(asset);
              if (res.ok) {
                await cache.put(asset, res);
              }
            } catch (err) {
              console.warn(`[SW] Pre-cache skipped for ${asset}:`, err);
            }
          })
        );
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ── Activate: Remove stale caches from old versions ──────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim()) // Take control of all open tabs
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function shouldBypass(url, request) {
  // Skip cross-origin requests entirely — YouTube, Supabase, iTunes, Deezer etc.
  if (url.origin !== self.location.origin) return true;
  // Skip non-HTTP protocols
  if (!url.protocol.startsWith("http")) return true;
  // NEVER cache or intercept live audio/video streams or range requests
  // (Exception: allow local static /silence.wav)
  if (
    request.destination === "audio" ||
    request.destination === "video" ||
    request.headers.has("range")
  ) {
    if (url.pathname === "/silence.wav") return false;
    return true;
  }
  return false;
}

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.json"
  );
}

// ── Fetch: Request interception ───────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Always bypass cross-origin and audio/video media requests
  if (shouldBypass(url, request)) return;

  // ── Static assets: Cache-first (hashed by Next.js build) ──────────────────
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── API requests: Network-first, NO caching ────────────────────────────────
  // API responses must always be fresh. Don't cache music search/playback data.
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return a minimal offline JSON response for API failures
        return new Response(
          JSON.stringify({ error: "offline", message: "No network connection" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // ── Navigation requests: Network-first with offline fallback ──────────────
  // App shell pages are served fresh when online, offline page shown when not.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses for offline fallback
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Try cached version of this specific route first (ignoring search queries)
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          // Fall back to offline page
          const offlinePage = await caches.match("/offline");
          return offlinePage || new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // ── All other same-origin requests: Stale-while-revalidate ────────────────
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      });
      return cached || network;
    })
  );
});
