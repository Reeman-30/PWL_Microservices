const CACHE_NAME = 'client-apps-v2';
const RUNTIME_CACHE = 'runtime-cache-v2';
const EXTERNAL_CACHE = 'external-cache-v2';

// Assets yang akan di-cache saat install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/modules',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
];

const ROUTES_TO_CACHE = [
  '/modules',
  '/modules/machine-learning',
  '/modules/machine-learning/sample',
  '/modules/microservices/book-management',
  '/modules/microservices/user-management',
  // Tambahkan route lain yang sering diakses
];

// External resources yang akan di-cache
const EXTERNAL_RESOURCES = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    Promise.all([
      // Cache internal assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Precaching static assets');
        return Promise.all(
          PRECACHE_URLS.map(url => {
            return cache.add(url).catch(err => {
              console.warn('[Service Worker] Failed to cache:', url, err);
            });
          })
        );
      }),
      // Cache external resources
      caches.open(EXTERNAL_CACHE).then((cache) => {
        console.log('[Service Worker] Precaching external resources');
        return Promise.all(
          EXTERNAL_RESOURCES.map(url => {
            return cache.add(url).catch(err => {
              console.warn('[Service Worker] Failed to cache external:', url, err);
            });
          })
        );
      }),
      // Cache additional routes (optional)
      caches.open(RUNTIME_CACHE).then((cache) => {
        console.log('[Service Worker] Precaching additional routes');
        return Promise.all(
          ROUTES_TO_CACHE.map(url => {
            return cache.add(url).catch(err => {
              console.warn('[Service Worker] Failed to cache route:', url, err);
            });
          })
        );
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME &&
                cacheName !== RUNTIME_CACHE &&
                cacheName !== EXTERNAL_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip webpack HMR requests in development
  if (url.pathname.includes('/_next/webpack-hmr') ||
    url.pathname.includes('/_next/static/webpack/')) {
    return;
  }

  // Handle external resources (CDN)
  if (url.origin !== location.origin) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', url.href);
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(EXTERNAL_CACHE).then((cache) => {
                  console.log('[Service Worker] Caching external resource:', url.href);
                  cache.put(request, responseToCache);
                });
              }
              return response;
            })
            .catch((error) => {
              console.error('[Service Worker] Failed to fetch external resource:', url.href, error);
              return new Response('Network error', { status: 408 });
            });
        })
    );
    return;
  }

  // Skip API routes - always fetch fresh
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // For HTML pages (navigation requests)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
              console.log('✓ Halaman disimpan ke cache');
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/offline')
                .then((offlinePage) => {
                  if (offlinePage) {
                    return offlinePage;
                  }
                  return new Response(
                    `<!DOCTYPE html>
                    <html lang="id">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Offline</title>
                      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
                      <style>
                        body { 
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          min-height: 100vh;
                        }
                        .offline-card {
                          background: white;
                          border-radius: 20px;
                          padding: 3rem;
                          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="row justify-content-center align-items-center min-vh-100">
                          <div class="col-md-6">
                            <div class="offline-card text-center">
                              <i class="bi bi-wifi-off text-primary" style="font-size: 5rem;"></i>
                              <h1 class="display-4 mt-4 mb-3">Anda Sedang Offline</h1>
                              <p class="lead text-muted mb-4">
                                Tidak ada koneksi internet. Beberapa fitur mungkin tidak tersedia.
                              </p>
                              <button class="btn btn-primary btn-lg" onclick="window.location.reload()">
                                <i class="bi bi-arrow-clockwise me-2"></i>Coba Lagi
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </body>
                    </html>`,
                    {
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            });
        })
    );
    return;
  }

  // For other resources (CSS, JS, images, fonts, etc.) - Cache First Strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Update cache in background
          fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            })
            .catch(() => { });

          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            if (request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ddd" width="200" height="200"/><text fill="#999" x="50%" y="50%" text-anchor="middle" dy=".3em">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
          });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || 1,
      url: data.url || '/',
    },
    actions: [
      {
        action: 'open',
        title: 'Buka',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  if (event.action === 'open') {
    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    console.log('[Service Worker] Syncing data...');
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}
// Message event
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return Promise.all(
          urls.map(url => {
            return cache.add(url).catch(err => {
              console.warn('[Service Worker] Failed to cache URL:', url, err);
            });
          })
        );
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[Service Worker] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[Service Worker] Periodic sync:', event.tag);

  if (event.tag === 'update-cache') {
    event.waitUntil(refreshAllCaches());
  }
});

// Function untuk refresh semua cache
async function refreshAllCaches() {
  console.log('[Service Worker] Refreshing all caches...');

  try {
    // 1. Refresh precache URLs
    const precache = await caches.open(CACHE_NAME);
    await Promise.all(
      PRECACHE_URLS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response && response.status === 200) {
            await precache.put(url, response);
            console.log('[Service Worker] Refreshed precache:', url);
          }
        } catch (error) {
          console.error('[Service Worker] Failed to refresh precache:', url, error);
        }
      })
    );

    // 2. Refresh external resources
    const externalCache = await caches.open(EXTERNAL_CACHE);
    await Promise.all(
      EXTERNAL_RESOURCES.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response && response.status === 200) {
            await externalCache.put(url, response);
            console.log('[Service Worker] Refreshed external:', url);
          }
        } catch (error) {
          console.error('[Service Worker] Failed to refresh external:', url, error);
        }
      })
    );

    // 3. Refresh routes
    const runtimeCache = await caches.open(RUNTIME_CACHE);
    await Promise.all(
      ROUTES_TO_CACHE.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response && response.status === 200) {
            await runtimeCache.put(url, response);
            console.log('[Service Worker] Refreshed route:', url);
          }
        } catch (error) {
          console.error('[Service Worker] Failed to refresh route:', url, error);
        }
      })
    );

    console.log('[Service Worker] ✓ All caches refreshed successfully');
    return { success: true, message: 'All caches refreshed' };
  } catch (error) {
    console.error('[Service Worker] ✗ Failed to refresh caches:', error);
    return { success: false, message: error.message };
  }
}

// Function untuk clear dan rebuild cache
async function clearAndRebuildCache() {
  console.log('[Service Worker] Clearing and rebuilding cache...');

  try {
    // 1. Clear all caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        console.log('[Service Worker] Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );

    // 2. Rebuild caches
    await Promise.all([
      // Rebuild precache
      caches.open(CACHE_NAME).then(cache => {
        return Promise.all(
          PRECACHE_URLS.map(url => cache.add(url).catch(err => {
            console.warn('[Service Worker] Failed to cache:', url, err);
          }))
        );
      }),
      // Rebuild external cache
      caches.open(EXTERNAL_CACHE).then(cache => {
        return Promise.all(
          EXTERNAL_RESOURCES.map(url => cache.add(url).catch(err => {
            console.warn('[Service Worker] Failed to cache external:', url, err);
          }))
        );
      }),
      // Rebuild runtime cache
      caches.open(RUNTIME_CACHE).then(cache => {
        return Promise.all(
          ROUTES_TO_CACHE.map(url => cache.add(url).catch(err => {
            console.warn('[Service Worker] Failed to cache route:', url, err);
          }))
        );
      })
    ]);

    console.log('[Service Worker] ✓ Cache cleared and rebuilt successfully');
    return { success: true, message: 'Cache cleared and rebuilt' };
  } catch (error) {
    console.error('[Service Worker] ✗ Failed to clear and rebuild cache:', error);
    return { success: false, message: error.message };
  }
}

async function updateCache() {
  try {
    console.log('[Service Worker] Updating cache...');
    const cache = await caches.open(EXTERNAL_CACHE);

    await Promise.all(
      EXTERNAL_RESOURCES.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response && response.status === 200) {
            await cache.put(url, response);
            console.log('[Service Worker] Updated cache for:', url);
          }
        } catch (error) {
          console.error('[Service Worker] Failed to update cache for:', url, error);
        }
      })
    );
  } catch (error) {
    console.error('[Service Worker] Update cache failed:', error);
  }
}