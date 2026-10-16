/* PuntoTIC Acacías - Service Worker PWA */
const CACHE_NAME = 'puntotic-pwa-v1.0.0';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
    OFFLINE_URL,
    '/manifest.webmanifest',
    '/manifest.json',
    '/images/logo_alcaldia.png',
    '/images/logo.png',
    '/images/escudo_acacias.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-512x512.png',
    '/images/icons/favicon-32x32.png',
    '/images/icons/apple-touch-icon.png',
];

// Install Event - Pre-cache core shell assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[PWA SW] Pre-caching warning:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - Clean old caches & claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
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

    // 1. Navigation Requests (HTML Pages / Inertia initial loads)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    // Try to match cached navigation page first
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Fallback to offline page
                    const offlinePage = await caches.match(OFFLINE_URL);
                    return offlinePage || new Response('Sin conexión', { status: 503, statusText: 'Offline' });
                })
        );
        return;
    }

    // 2. Static Assets (Vite build assets, images, fonts, styles)
    const isStaticAsset =
        url.pathname.startsWith('/build/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.svg') ||
        url.hostname.includes('fonts.bunny.net');

    if (isStaticAsset) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const copy = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // 3. Inertia Partial / JSON / API GET Requests
    const isInertia = request.headers.get('X-Inertia') === 'true';
    if (isInertia || url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
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

    // Default: Network with Cache Fallback
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return networkResponse;
            })
            .catch(() => caches.match(request))
    );
});

// Listener for skipWaiting command
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
