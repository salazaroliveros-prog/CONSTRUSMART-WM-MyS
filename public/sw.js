// CONSTRUSMART ERP - Service Worker PWA Offline-First
// Estrategia: Cache First para assets estáticos, Network First para API

const CACHE_NAME = 'construsmart-v3';
const OFFLINE_URL = '/offline.html';

// Assets estáticos que se cachean al instalar (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  '/wm-logo.svg',
];

// === INSTALL: Pre-cachear app shell ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE_ASSETS);
      } catch (err) {
        console.warn('[SW] Precache parcial:', err);
      }
    })
  );
  self.skipWaiting();
});

// === ACTIVATE: Limpiar caches antiguos ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// === FETCH: Network First para HTML/API, Cache First para assets ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interceptar Supabase API ni otras APIs externas
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname !== self.location.hostname) return;

  // Para assets Vite (.js, .css hashes): Cache First
  const isAsset = url.pathname.startsWith('/assets/') ||
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/.test(url.pathname);

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => caches.match('/offline.html') || new Response('Sin conexión', { status: 503 }));
      })
    );
    return;
  }

  // Para HTML (navegación): Network First con fallback a cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline.html')))
    );
    return;
  }

  // Para otros (fuentes, etc): Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// === BACKGROUND SYNC: Sincronizar cuando vuelve la conexión ===
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-erp-data') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_TRIGGERED' });
        });
      })
    );
  }
});