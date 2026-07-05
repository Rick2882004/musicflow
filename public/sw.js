const CACHE_NAME = "musicflow-v1";
const ASSETS = [
  "/",
  "/favicon.ico",
  "/logo.png",
  "/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (e) => {
  // Ignore dynamic analytics or firebase/supabase API calls
  if (
    e.request.url.includes("supabase.co") ||
    e.request.url.includes("firebase") ||
    e.request.url.includes("/api/")
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        // Cache static files
        if (response.status === 200 && e.request.method === "GET") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      });
    }).catch(() => {
      // Fallback
      return caches.match("/");
    })
  );
});
