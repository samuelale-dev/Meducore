// EduCore Service Worker
// File: educore/client/src/sw.ts
// Minimal SW — offline caching handled by syncQueue.ts (Dexie/IndexedDB)

self.addEventListener('install', () => {
  (self as any).skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil((self as any).clients.claim());
});

// Background sync handler for offline mutation queue
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'educore-sync-queue') {
    // Sync is triggered from the app via syncQueue.ts
    console.log('[SW] Background sync triggered: educore-sync-queue');
  }
});
