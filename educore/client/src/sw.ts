// File: educore/client/src/sw.ts
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

cleanupOutdatedCaches();

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'educore-api-cache', networkTimeoutSeconds: 5 })
);

registerRoute(
  ({ request }) =>
    request.destination === 'style' || request.destination === 'script',
  new CacheFirst({ cacheName: 'educore-static-cache' })
);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
