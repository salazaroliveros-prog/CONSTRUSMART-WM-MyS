import { log } from './auto-logger'

const SW_URL = '/sw.js'
const REGISTRATION_KEY = 'wm_erp_sw_registered'
const VAPID_KEY_STORAGE = 'wm_erp_vapid_key'

/**
 * Inicializa el Service Worker con inyección de VAPID key
 * 
 * Estrategia:
 * 1. Lee VITE_VAPID_PUBLIC_KEY de import.meta.env
 * 2. La almacena en sessionStorage para que el SW la lea
 * 3. Registra el SW
 * 4. Envía la key via postMessage después de la activación
 */
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Evitar registro duplicado en la misma sesión
  if (sessionStorage.getItem(REGISTRATION_KEY)) {
    return null
  }

  if (!('serviceWorker' in navigator)) {
    log('warn', 'SWInit', 'Service Workers not supported in this browser')
    return null
  }

  try {
    // 1. Obtener VAPID key de las variables de entorno
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
    
    if (vapidKey) {
      // 2. Almacenar para que el SW pueda leerla via postMessage
      sessionStorage.setItem(VAPID_KEY_STORAGE, vapidKey)
    } else {
      log('warn', 'SWInit', 'VITE_VAPID_PUBLIC_KEY not configured — push notifications disabled')
    }

    // 3. Registrar SW
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
      updateViaCache: 'none',
    })

    log('info', 'SWInit', `Service Worker registered (scope: ${registration.scope})`, {
      state: registration.active?.state,
    })

    // 4. Enviar VAPID key al SW cuando esté listo
    if (vapidKey && registration.active) {
      registration.active.postMessage({
        type: 'SET_VAPID_KEY',
        payload: { key: vapidKey },
      })
    } else if (registration.installing || registration.waiting) {
      // Esperar a que el SW se active
      const sw = registration.installing || registration.waiting
      sw?.addEventListener('statechange', () => {
        if (sw?.state === 'activated' && vapidKey) {
          sw.postMessage({
            type: 'SET_VAPID_KEY',
            payload: { key: vapidKey },
          })
        }
      })
    }

    // Marcar como registrado en esta sesión
    sessionStorage.setItem(REGISTRATION_KEY, 'true')

    // Escuchar mensajes del SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data || {}
      
      switch (type) {
        case 'SYNC_TRIGGERED':
          log('info', 'SWInit', 'Background sync triggered by SW', payload)
          break
        case 'NOTIFICATION_CLICKED':
          log('info', 'SWInit', 'Notification clicked', payload)
          break
        case 'VAPID_KEY_RECEIVED':
          log('info', 'SWInit', 'VAPID key confirmed by SW', payload)
          break
        case 'VAPID_KEY_MISSING':
          log('warn', 'SWInit', 'VAPID key missing in SW — push notifications disabled', payload)
          break
        default:
          break
      }
    })

    return registration

  } catch (error) {
    log('error', 'SWInit', 'Failed to register Service Worker', {
      error: String(error),
    })
    return null
  }
}

/**
 * Desregistra el Service Worker actual
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const result = await registration.unregister()
      if (result) {
        sessionStorage.removeItem(REGISTRATION_KEY)
        sessionStorage.removeItem(VAPID_KEY_STORAGE)
        log('info', 'SWInit', 'Service Worker unregistered')
      }
      return result
    }
    return true
  } catch (error) {
    log('error', 'SWInit', 'Failed to unregister Service Worker', {
      error: String(error),
    })
    return false
  }
}

export default initServiceWorker