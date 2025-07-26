/**
 * Service Worker for Portfolio Website
 * Provides offline caching and performance improvements
 */

const CACHE_NAME = 'portfolio-cache-v1';
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/about/index.html',
    '/writing-samples/index.html',
    '/wp-content/themes/astra/assets/css/minified/frontend.min.css',
    '/wp-content/themes/astra/assets/js/minified/frontend.min.js',
    '/wp-content/themes/astra/assets/fonts/astra.woff',
    '/wp-content/themes/astra/assets/fonts/astra.woff2',
    '/performance-optimizations.css',
    '/performance-optimizations.js'
];

// Cache patterns
const CACHE_PATTERNS = {
    images: /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i,
    fonts: /\.(woff|woff2|ttf|eot)$/i,
    styles: /\.css$/i,
    scripts: /\.js$/i,
    pages: /\/(index\.html|about|writing-samples|home)/i
};

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static assets', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip external requests (except fonts from Google)
    if (requestUrl.origin !== location.origin && !requestUrl.hostname.includes('fonts.g')) {
        return;
    }
    
    event.respondWith(
        handleFetchRequest(event.request)
    );
});

async function handleFetchRequest(request) {
    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname;
    
    try {
        // 1. Check static cache first
        const staticResponse = await caches.match(request, { cacheName: STATIC_CACHE });
        if (staticResponse) {
            return staticResponse;
        }
        
        // 2. Check dynamic cache
        const dynamicResponse = await caches.match(request, { cacheName: DYNAMIC_CACHE });
        if (dynamicResponse) {
            return dynamicResponse;
        }
        
        // 3. Fetch from network
        const networkResponse = await fetch(request);
        
        // 4. Cache the response if it's worth caching
        if (shouldCache(request, networkResponse)) {
            await cacheResponse(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('Service Worker: Fetch failed, serving offline content');
        return handleOfflineRequest(request);
    }
}

function shouldCache(request, response) {
    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname;
    
    // Don't cache if response is not successful
    if (!response || response.status !== 200 || response.type !== 'basic') {
        return false;
    }
    
    // Cache images, fonts, styles, scripts, and HTML pages
    return CACHE_PATTERNS.images.test(pathname) ||
           CACHE_PATTERNS.fonts.test(pathname) ||
           CACHE_PATTERNS.styles.test(pathname) ||
           CACHE_PATTERNS.scripts.test(pathname) ||
           CACHE_PATTERNS.pages.test(pathname);
}

async function cacheResponse(request, response) {
    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname;
    
    try {
        // Use appropriate cache based on content type
        let cacheName = DYNAMIC_CACHE;
        
        if (CACHE_PATTERNS.images.test(pathname) || 
            CACHE_PATTERNS.fonts.test(pathname) ||
            CACHE_PATTERNS.styles.test(pathname) ||
            CACHE_PATTERNS.scripts.test(pathname)) {
            cacheName = STATIC_CACHE;
        }
        
        const cache = await caches.open(cacheName);
        await cache.put(request, response);
        
        console.log('Service Worker: Cached', request.url);
    } catch (error) {
        console.error('Service Worker: Failed to cache', request.url, error);
    }
}

async function handleOfflineRequest(request) {
    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname;
    
    // Try to serve a cached page for navigation requests
    if (request.mode === 'navigate') {
        const offlinePage = await caches.match('/index.html');
        if (offlinePage) {
            return offlinePage;
        }
    }
    
    // For images, try to serve a cached placeholder
    if (CACHE_PATTERNS.images.test(pathname)) {
        const placeholder = await caches.match('/wp-content/uploads/placeholder.png');
        if (placeholder) {
            return placeholder;
        }
    }
    
    // Return a simple offline response
    return new Response(
        JSON.stringify({
            error: 'Offline',
            message: 'This content is not available offline'
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}

// Background sync for form submissions (if supported)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Handle any queued form submissions or other background tasks
    console.log('Service Worker: Performing background sync');
}

// Push notifications (if needed in the future)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New content available',
        icon: '/wp-content/uploads/icon-192x192.png',
        badge: '/wp-content/uploads/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Portfolio',
                icon: '/wp-content/uploads/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/wp-content/uploads/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Portfolio Update', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-sync') {
        event.waitUntil(syncContent());
    }
});

async function syncContent() {
    // Sync any updated content when online
    console.log('Service Worker: Syncing content in background');
}

// Cache size management
async function manageCacheSize() {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();
    
    // Limit dynamic cache to 50 items
    if (keys.length > 50) {
        const oldestKeys = keys.slice(0, keys.length - 50);
        await Promise.all(
            oldestKeys.map(key => cache.delete(key))
        );
    }
}

// Run cache management periodically
setInterval(manageCacheSize, 60000); // Every minute