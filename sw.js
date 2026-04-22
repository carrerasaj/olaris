// Bump CACHE_NAME to sweep all previously-cached responses on SW update —
// critical here because a stale error-page HTML may have been cached against
// /api/orders/.../pdf before this SW started skipping those paths.
const CACHE_NAME = 'olaris-v3';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/images/logo.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/static/css/tailwind.css',
  '/static/js/react.min.js',
  '/static/js/react-dom.min.js'
];

// Install - Cache key files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// Activate - Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Serve cached first, fallback network, then offline.
// CRITICAL: never cache admin routes, API routes, signing/verify flows, or
// auth. These are dynamic per-session / per-token and caching them serves
// stale or wrong responses across users (previously a stale error page
// kept appearing for /api/orders/.../pdf even after the server recovered).
const NO_CACHE_PREFIXES = [
  '/api/',
  '/admin',
  '/sign/',
  '/verify/',
  '/.well-known/',
];

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const skipCache = NO_CACHE_PREFIXES.some((p) => url.pathname.startsWith(p));

  if (skipCache) {
    // Straight to the network, no SW cache layer, no offline fallback.
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request.url, response.clone());
          return response;
        });
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => response || caches.match(OFFLINE_URL));
      })
  );
});
