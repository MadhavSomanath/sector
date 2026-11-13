// Offline support: pages load network-first (so new deploys show up), everything else cache-first.
const CACHE = 'sector-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icon-192.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const save = (res) => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); }
    return res;
  };
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).then(save).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(request).then((hit) => hit || fetch(request).then(save)));
});
