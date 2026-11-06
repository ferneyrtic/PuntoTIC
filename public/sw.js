/* PuntoTIC Acacías - Service Worker PWA */
const BASE_PATH = self.location.pathname.replace(/\/sw\.js$/, '');
const CACHE_NAME = 'puntotic-pwa-v2.0.0';
const OFFLINE_URL = `${BASE_PATH}/offline.html`;

const PRECACHE_ASSETS = [
    OFFLINE_URL,
    `${BASE_PATH}/manifest.webmanifest`,
    `${BASE_PATH}/images/logo_alcaldia.png`,
    `${BASE_PATH}/images/escudo_acacias.png`,
    `${BASE_PATH}/images/icons/icon-192x192.png`,
    `${BASE_PATH}/images/icons/icon-512x512.png`,
    `${BASE_PATH}/images/icons/favicon-32x32.png`,
    `${BASE_PATH}/images/icons/apple-touch-icon.png`,
];

// Install Event - Pre-cache core shell assets and immediately take over
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[PWA SW] Pre-caching warning:', err);
            });
        })
    );
});

// Activate Event - Purge all older caches immediately and claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('[PWA SW] Eliminando caché obsoleta:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Strategic routing
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle HTTP/HTTPS GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin analytics/external requests if any
    if (url.origin !== self.location.origin && !url.hostname.includes('fonts.bunny.net')) {
        return;
    }

    // 1. Navigation Requests (HTML Pages / Inertia initial loads) -> Network First, never stale HTML
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(async () => {
                    const offlinePage = await caches.match(OFFLINE_URL);
                    return offlinePage || new Response('Sin conexión', { status: 503, statusText: 'Offline' });
                })
        );
        return;
    }

    // Never cache service worker itself or webmanifest
    if (url.pathname.endsWith('/sw.js') || url.pathname.endsWith('/manifest.webmanifest')) {
        event.respondWith(fetch(request));
        return;
    }

    // 2. Static Assets (Vite build assets, images, fonts, styles)
    const isStaticAsset =
        url.pathname.includes('/build/') ||
        url.pathname.includes('/images/') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.svg') ||
        url.hostname.includes('fonts.bunny.net');

    if (isStaticAsset) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // 3. Inertia Partial / JSON / API GET Requests
    const isInertia = request.headers.get('X-Inertia') === 'true';
    if (isInertia || url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({
                        error: 'offline',
                        message: 'Operación fuera de línea detectada. Conéctese a internet para consultar datos en tiempo real.',
                    }),
                    {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            })
        );
        return;
    }

    // Default: Network with fallback to cache
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});

// Listener for skipWaiting command
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
