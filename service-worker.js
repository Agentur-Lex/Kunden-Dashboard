const CACHE = 'lex-v4';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
];

self.addEventListener('install', function(e) {
  // Sofort aktivieren ohne auf alten SW zu warten
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(PRECACHE);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      // Alle offenen Tabs sofort übernehmen
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // index.html: immer vom Netzwerk (kein Caching)
  if (url.endsWith('/') || url.endsWith('/index.html')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Supabase API: immer Netzwerk
  if (url.includes('supabase.co')) return;

  // Statische Assets: Cache-first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (!response || response.status !== 200) return response;
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return response;
      });
    })
  );
});
