/* Service worker for Gym Membership PWA.
 *
 * Strategy:
 *  - Precache the app shell (login page + icons) so the install prompt works
 *    and the user gets a friendly screen if they open the app offline.
 *  - Network-first for everything else, falling back to cache only on failure.
 *  - Never cache API responses, auth callbacks, or PDF receipts (always fresh).
 */

const CACHE = "gym-membership-v1";
const PRECACHE_URLS = ["/login", "/logo.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET — never cache POST/PATCH/DELETE
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Same-origin only — don't intercept third-party (Vercel analytics, fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // Never cache APIs, auth, PDFs, server-action POSTs, or Next internals
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.startsWith("/m/")
  ) {
    return;
  }

  // Network-first with cache fallback
  event.respondWith(
    fetch(req)
      .then((response) => {
        // Cache successful responses for static assets
        if (
          response.ok &&
          (url.pathname.startsWith("/_next/static/") ||
            url.pathname.endsWith(".svg") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".ico") ||
            url.pathname === "/login")
        ) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(req, clone));
        }
        return response;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("/login")))
  );
});
