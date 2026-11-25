// network-first so updates show right away, cache as offline fallback.
// Pages and version.json skip the browser cache so a Home Screen app always sees the newest version.
const CACHE = 'ck-2.6.0';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const fresh = req.mode === 'navigate' || (u.origin === location.origin && /(\/|\.html|version\.json|sw\.js)$/.test(u.pathname));
  e.respondWith(fetch(req, fresh ? { cache: 'no-store' } : {}).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); } return r; }).catch(() => caches.match(req)));
});
