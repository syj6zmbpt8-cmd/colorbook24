/* Colorbook24 service worker: alles offline beschikbaar */
const V = 'cb24-v2';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'pages/index.json'];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await c.addAll(CORE);
    try {
      const list = await (await fetch('pages/index.json', {cache: 'no-cache'})).json();
      await Promise.all(list.map(p => c.add('pages/' + p.file).catch(() => {})));
    } catch (e) {}
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/') || u.pathname.endsWith('index.json');
  if (isPage) {
    // eerst netwerk (nieuwste versie), anders uit cache
    e.respondWith(fetch(e.request).then(r => { const cl = r.clone(); caches.open(V).then(c => c.put(e.request, cl)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(r2 => { const cl = r2.clone(); caches.open(V).then(c => c.put(e.request, cl)); return r2; })));
  }
});
