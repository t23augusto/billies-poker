// Billie's Holdem Poker — service worker
// v2: network-first para el HTML (los datos van embebidos ahí, así que el caché
// viejo dejaba la app congelada para siempre). Caché sólo como respaldo offline.
const CACHE = 'billies-poker-v2';
const ASSETS = ['/billies-poker/', '/billies-poker/index.html', '/billies-poker/manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const esHTML = e.request.mode === 'navigate' ||
                 (e.request.headers.get('accept') || '').includes('text/html');
  if (esHTML) {
    // red primero: siempre trae la versión publicada más nueva
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
          return r;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('/billies-poker/index.html')))
    );
  } else {
    // el resto (íconos, manifest): caché primero, que no cambia
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
