// ============================================================
// EduCore Service Worker
// File: educore/client/src/sw.ts
// ============================================================

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// self.__WB_MANIFEST must be a standalone expression for Workbox to inject into
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

cleanupOutdatedCaches();

// API routes — NetworkFirst (fresh data, falls back to cache)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'educore-api-cache', networkTimeoutSeconds: 5 })
);

// Static assets — CacheFirst
registerRoute(
  ({ request }) =>
    request.destination === 'style' || request.destination === 'script',
  new CacheFirst({ cacheName: 'educore-static-cache' })
);

// Background sync for offline mutation queue
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'educore-sync-queue') {
    console.log('[SW] Background sync: educore-sync-queue');
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
