/// <reference lib="webworker" />

const CACHE_NAME = 'drone-logger-v1';
const OFFLINE_URL = '/offline.html';

// Add list of URLs to cache on install
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/src/index.css',
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients
  self.clients.claim();
});

self.addEventListener('fetch', (event: any) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // API requests - attempt network first, then cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, return a generic error response
              return new Response(JSON.stringify({ 
                error: 'Network request failed',
                offline: true 
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }
  
  // For non-API requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If found in cache, return the cached version
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response to store in cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // If both cache and network fail, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL)
                .then(offlineResponse => {
                  return offlineResponse;
                });
            }
            
            // For non-navigation requests that fail, return a simple error
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle background sync for data that failed to send while offline
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-flight-logs') {
    event.waitUntil(syncFlightLogs());
  } else if (event.tag === 'sync-drone-data') {
    event.waitUntil(syncDroneData());
  }
});

async function syncFlightLogs() {
  const db = await getDatabase();
  const pendingLogs = await db.getAll('pendingFlightLogs');
  
  for (const log of pendingLogs) {
    try {
      const response = await fetch('/api/flight-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(log)
      });
      
      if (response.ok) {
        await db.delete('pendingFlightLogs', log.id);
      }
    } catch (error) {
      console.error('Failed to sync flight log:', error);
    }
  }
}

async function syncDroneData() {
  const db = await getDatabase();
  const pendingDroneUpdates = await db.getAll('pendingDroneUpdates');
  
  for (const update of pendingDroneUpdates) {
    try {
      const response = await fetch(`/api/drones/${update.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(update.data)
      });
      
      if (response.ok) {
        await db.delete('pendingDroneUpdates', update.id);
      }
    } catch (error) {
      console.error('Failed to sync drone update:', error);
    }
  }
}

// Simplified IDB wrapper for the service worker
function getDatabase() {
  return {
    getAll: async (storeName: string) => {
      // Implementation would go here using IndexedDB
      return [];
    },
    delete: async (storeName: string, id: number) => {
      // Implementation would go here using IndexedDB
      return true;
    }
  };
}

// TypeScript service worker type
declare const self: ServiceWorkerGlobalScope;
export {};
