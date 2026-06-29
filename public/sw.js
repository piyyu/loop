const CACHE_NAME = "loop-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/login",
  "/manifest.webmanifest",
  "/sounds/click.mp3",
  "/sounds/select.mp3",
  "/sounds/startup.mp3",
  "/sounds/shutdown.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip API routes, auth, and development hot reloads
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.includes("webpack")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache album art and images dynamically
        if (
          event.request.method === "GET" &&
          (url.hostname.includes("spotify") ||
            url.hostname.includes("saavn") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".jpg") ||
            url.pathname.endsWith(".jpeg") ||
            url.pathname.endsWith(".svg"))
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Return offline fallback if network fails
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
