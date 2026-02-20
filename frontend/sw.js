const CACHE_NAME = 'permit-assistant-v2';
const SHELL_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.svg',
    '/vendor/tailwind.js',
    '/vendor/marked.min.js',
    '/vendor/purify.min.js'
];

// Install: cache static shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch: cache-first for shell, network-only for API
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip API calls and non-GET requests
    if (url.pathname.startsWith('/api') || event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    // Don't cache non-ok responses or opaque responses
                    if (!response || response.status !== 200) return response;
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                });
            })
    );
});
