/**
 * CONSTRUSMART ERP — Service Worker v7
 *
 * Estrategias de caché:
 *  - Hashed assets (/assets/*.{js,css})  → Cache-First (inmutables, TTL 365d)
 *  - Imágenes / fuentes                  → Stale-While-Revalidate (TTL 30d, max 60 items)
 *  - Navegación (HTML)                   → Network-First → caché → offline.html
 *  - Supabase / APIs externas            → Network-Only (nunca cachear)
 *  - Resto GET mismo origen              → Network-First → caché
 *
 * Límites de caché para evitar crecimiento indefinido:
 *  - CACHE_ASSETS  : max 120 entradas, TTL 365 días
 *  - CACHE_IMAGES  : max  60 entradas, TTL  30 días
 *  - CACHE_PAGES   : max  20 entradas, TTL   7 días
 */

const CACHE_VERSION = 'v7';
const CACHE_ASSETS  = `construsmart-assets-${CACHE_VERSION}`;
const CACHE_IMAGES  = `construsmart-images-${CACHE_VERSION}`;
const CACHE_PAGES   = `construsmart-pages-${CACHE_VERSION}`;
const ALL_CACHES    = [CACHE_ASSETS, CACHE_IMAGES, CACHE_PAGES];

const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/site.manifest.json',
  '/favicon.ico',
  '/logo.png',
  '/logo.webp',
  '/wm-logo.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isHashedAsset(url) {
  // Vite genera /assets/xxx-[hash].js|css
  return /\/assets\/[^/]+-[a-f0-9]{8,}\.(js|css)$/.test(url.pathname);
}

function isImage(url) {
  return /\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/.test(url.pathname);
}

function isFont(url) {
  return /\.(woff2?|ttf|eot|otf)$/.test(url.pathname) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');
}

function isExternal(url) {
  return url.hostname !== self.location.hostname;
}

function isSupabase(url) {
  return url.hostname.includes('supabase.co') || url.hostname.includes('supabase.io');
}

/**
 * Limita el número de entradas en un caché.
 * Elimina las más antiguas cuando se supera maxEntries.
 */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys  = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(keys.slice(0, keys.length - maxEntries).map(k => cache.delete(k)));
  }
}

/**
 * Guarda en caché y recorta si es necesario.
 */
async function cacheAndTrim(cacheName, request, response, maxEntries) {
  if (!response || response.status !== 200 || response.type === 'error') return;
  const cache = await caches.open(cacheName);
  try {
    await cache.put(request, response);
  } catch {
    return;
  }
  await trimCache(cacheName, maxEntries);
}

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_PAGES).then(async (cache) => {
      try { await cache.addAll(PRECACHE_ASSETS); } catch { /* assets opcionales */ }
    })
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Supabase / APIs externas → Network-Only
  if (isSupabase(url) || isExternal(url)) return;

  // 2. Hashed assets (JS/CSS con hash) → Cache-First
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          cacheAndTrim(CACHE_ASSETS, request, res.clone(), 120);
          return res;
        });
      })
    );
    return;
  }

  // 3. Imágenes y fuentes → Stale-While-Revalidate
  if (isImage(url) || isFont(url)) {
    event.respondWith(
      caches.open(CACHE_IMAGES).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((res) => {
          cacheAndTrim(CACHE_IMAGES, request, res.clone(), 60);
          return res;
        }).catch(() => cached || new Response('', { status: 204 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. Navegación (HTML) → Network-First → caché → offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          cacheAndTrim(CACHE_PAGES, request, res.clone(), 20);
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const index = await caches.match('/index.html');
          if (index) return index;
          return caches.match(OFFLINE_URL) ||
            new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // 5. Resto GET mismo origen → Network-First → caché
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.status === 200) {
          cacheAndTrim(CACHE_PAGES, request, res.clone(), 20);
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || new Response(null, { status: 204 });
      })
  );
});

// ─── Background Sync ─────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-erp-data') {
    event.waitUntil(
      self.clients.matchAll().then((clients) =>
        clients.forEach((c) => c.postMessage({ type: 'SYNC_TRIGGERED' }))
      )
    );
  }
});

// ─── Push Notifications ──────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'CONSTRUSMART ERP', {
        body: data.body || 'Nueva notificación',
        icon: data.icon || '/logo.png',
        badge: '/favicon.ico',
        data: { url: data.url || '/', ...data.data },
        vibrate: [200, 100, 200],
        actions: data.actions || [
          { action: 'open', title: 'Ver' },
          { action: 'close', title: 'Cerrar' },
        ],
        requireInteraction: true,
        tag: data.tag || 'default',
      })
    );
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('CONSTRUSMART ERP', { body: text, icon: '/logo.png' })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.host) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICKED', data: event.notification.data });
          return client.focus();
        }
      }
      if (clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// ─── Messages ────────────────────────────────────────────────────────────────

let PUSH_PUBLIC_KEY = '';

self.addEventListener('message', (event) => {
  if (!event.data) return;
  const { type, payload } = event.data;

  switch (type) {
    case 'SHOW_NOTIFICATION':
      self.registration.showNotification(payload?.title || 'CONSTRUSMART ERP', {
        body: payload?.body || '',
        icon: '/logo.png',
        badge: '/favicon.ico',
        tag: payload?.tag || 'app-notification',
        data: { url: payload?.url || '/' },
        requireInteraction: true,
      });
      break;

    case 'SET_VAPID_KEY':
      if (payload?.key) {
        PUSH_PUBLIC_KEY = payload.key;
        event.source?.postMessage({ type: 'VAPID_KEY_RECEIVED', payload: { timestamp: Date.now() } });
      } else {
        event.source?.postMessage({ type: 'VAPID_KEY_MISSING', payload: { timestamp: Date.now() } });
      }
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    default:
      break;
  }
});
