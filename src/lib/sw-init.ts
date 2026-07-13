import { log } from './auto-logger';

const SW_URL = '/sw.js';
const REGISTRATION_KEY = 'wm_erp_sw_registered';
const VAPID_KEY_STORAGE = 'wm_erp_vapid_key';

function sendVapidKey(sw: ServiceWorker) {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (vapidKey) {
    sessionStorage.setItem(VAPID_KEY_STORAGE, vapidKey);
    sw.postMessage({ type: 'SET_VAPID_KEY', payload: { key: vapidKey } });
  }
}

/**
 * Registra el Service Worker.
 * - Detecta actualizaciones y activa el nuevo SW automáticamente.
 * - Inyecta VAPID key cuando el SW está activo.
 */
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    log('warn', 'SWInit', 'Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
      updateViaCache: 'none',
    });

    log('info', 'SWInit', `SW registered (scope: ${registration.scope})`);

    // Inyectar VAPID key al SW activo
    if (registration.active) {
      sendVapidKey(registration.active);
    }

    // Detectar nuevo SW en espera → activar automáticamente
    const onUpdateFound = () => {
      const newSW = registration.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          // Hay una nueva versión — activar sin esperar recarga manual
          newSW.postMessage({ type: 'SKIP_WAITING' });
          log('info', 'SWInit', 'New SW version activated');
        }
        if (newSW.state === 'activated') {
          sendVapidKey(newSW);
        }
      });
    };

    registration.addEventListener('updatefound', onUpdateFound);

    // Recargar cuando el SW controlador cambie (nueva versión activada)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Escuchar mensajes del SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      switch (type) {
        case 'SYNC_TRIGGERED':
          log('info', 'SWInit', 'Background sync triggered', payload);
          break;
        case 'NOTIFICATION_CLICKED':
          log('info', 'SWInit', 'Notification clicked', payload);
          break;
        case 'VAPID_KEY_RECEIVED':
          log('info', 'SWInit', 'VAPID key confirmed by SW', payload);
          break;
        case 'VAPID_KEY_MISSING':
          log('warn', 'SWInit', 'VAPID key missing — push disabled', payload);
          break;
        default:
          break;
      }
    });

    // Verificar actualizaciones cada 60 min
    setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);

    sessionStorage.setItem(REGISTRATION_KEY, 'true');
    return registration;
  } catch (error) {
    log('error', 'SWInit', 'Failed to register SW', { error: String(error) });
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      if (result) {
        sessionStorage.removeItem(REGISTRATION_KEY);
        sessionStorage.removeItem(VAPID_KEY_STORAGE);
        log('info', 'SWInit', 'SW unregistered');
      }
      return result;
    }
    return true;
  } catch (error) {
    log('error', 'SWInit', 'Failed to unregister SW', { error: String(error) });
    return false;
  }
}

export default initServiceWorker;
