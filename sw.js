const CACHE_NAME = 'pokequien-v11';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

// External domains we cache dynamically (sprites, API)
const DYNAMIC_HOSTS = [
  'raw.githubusercontent.com',
  'pokeapi.co',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// Install: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first with cache fallback for dynamic
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Static assets: cache first
  if (event.request.url.includes(self.location.origin) || STATIC_ASSETS.some(a => event.request.url.endsWith(a.replace('./', '')))) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }))
    );
    return;
  }

  // Dynamic (sprites, API): network first, cache as fallback
  if (DYNAMIC_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
