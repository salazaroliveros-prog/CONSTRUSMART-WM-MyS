const CACHE_NAME = 'construsmart-v5';
const OFFLINE_URL = '/offline.html';
const PUSH_PUBLIC_KEY = 'BC2v9F0k9sA3dF5gH7jK9lQ2wE4rT6yU8iOp1xZ3cV5bN7mQ9sD1fG3hJ5kL7zX9cV1bN3m';

const PRECACHE_ASSETS = [
  '/', '/index.html', '/offline.html', '/manifest.json',
  '/logo.png', '/logo.webp', '/favicon.ico', '/wm-logo.svg',
  '/icons/icon-192.png', '/icons/icon-192.webp',
  '/icons/icon-512.png', '/icons/icon-512.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try { await cache.addAll(PRECACHE_ASSETS); } catch { }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.hostname.includes('supabase.co') || url.hostname !== self.location.hostname) return;

  const isAsset = url.pathname.startsWith('/assets/') ||
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|eot)$/.test(url.pathname);

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        }).catch(() => {
          // Si es una imagen no cacheada, devolver placeholder
          if (request.destination === 'image') {
            return caches.match('/placeholder.svg') || new Response('', { status: 204 });
          }
          return caches.match('/offline.html') || new Response('Sin conexión', { status: 503 });
        });
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return res;
      }).catch(() => caches.match(request).then((cached) => cached || caches.match('/offline.html')))
    );
    return;
  }

  event.respondWith(
    fetch(request).then((res) => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return res;
    }).catch(() => caches.match(request))
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-erp-data') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_TRIGGERED' }));
      })
    );
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
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
    };
    event.waitUntil(self.registration.showNotification(data.title || 'CONSTRUSMART ERP', options));
  } catch {
    const text = event.data.text();
    event.waitUntil(self.registration.showNotification('CONSTRUSMART ERP', { body: text, icon: '/logo.png' }));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || event.notification.data?.redirect || '/';
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, url } = event.data.payload || {};
    self.registration.showNotification(title || 'CONSTRUSMART ERP', {
      body: body || '',
      icon: '/logo.png',
      badge: '/favicon.ico',
      tag: tag || 'app-notification',
      data: { url: url || '/' },
      requireInteraction: true,
    });
  }
});
