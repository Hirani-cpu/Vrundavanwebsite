// Service Worker for aggressive Firebase image caching
const CACHE_NAME = 'vrundavan-images-v1';

// Install event - cache immediately
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    self.skipWaiting(); // Activate immediately
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control immediately
});

// Fetch event - Cache Firebase images aggressively
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Cache Firebase Storage images permanently
    if (url.hostname.includes('firebasestorage.googleapis.com')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('Service Worker: Serving from cache:', url.pathname);
                        return cachedResponse; // Return cached image immediately
                    }

                    // Not in cache, fetch and cache it
                    return fetch(event.request).then((networkResponse) => {
                        console.log('Service Worker: Caching new image:', url.pathname);
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    }
    // Let other requests pass through normally
});
