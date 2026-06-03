// ERP CONSTRUSMART - Service Worker endurecido
// Estrategia: Network First con validaciones de seguridad

const CACHE_NAME = 'construsmart-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo.png',
  '/manifest.json',
  '/placeholder.svg',
  '/robots.txt',
  '/wm-logo.svg',
];

const ALLOWED_ORIGIN = self.location.origin;

function isSameOrigin(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.origin === ALLOWED_ORIGIN;
  } catch {
    return false;
  }
}

function hasAuthHeader(request: Request): boolean {
  const authHeaders = ['authorization', 'x-api-key', 'apikey'];
  for (const name of request.headers) {
    if (authHeaders.includes(name[0].toLowerCase())) return true;
  }
  return false;
}

function isStaticAsset(request: Request): boolean {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', '.txt'];
  if (staticExtensions.some(ext => pathname.endsWith(ext))) return true;
  const contentType = request.headers.get('content-type') || '';
  if (contentType.startsWith('text/')) return true;
  if (contentType.startsWith('application/javascript')) return true;
  if (contentType.startsWith('application/css')) return true;
  if (contentType.startsWith('image/')) return true;
  if (contentType.startsWith('font/')) return true;
  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // No interceptar peticiones a Supabase ni orígenes dinámicos distintos
  if (url.hostname.includes('supabase.co')) return;
  if (!isSameOrigin(event.request.url)) return;
  if (hasAuthHeader(event.request)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const cloned = response.clone();
        const status = response.status;
        const contentType = response.headers.get('content-type') || '';

        if (status === 200 && isStaticAsset(event.request)) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
