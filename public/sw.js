// Сначала сеть, при её отсутствии — кэш. Видео (range-запросы) не кэшируется.
const CACHE = 'dibil-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range') || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    try { const net = await fetch(r); if (net.ok) c.put(r, net.clone()); return net; }
    catch (err) { const hit = await c.match(r); if (hit) return hit; throw err; }
  }));
});
