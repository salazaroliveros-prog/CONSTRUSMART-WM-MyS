import { useCallback, useEffect, useRef } from 'react';

const SW_PATH = '/sw.js';
const LS_KEY = 'wm_notification_permission_requested';

declare global {
  interface ServiceWorkerRegistration {
    showNotification(title: string, options?: NotificationOptions): Promise<void>;
  }
  interface Window {
    SafariRemoteNotification?: unknown;
  }
}

export function useNotifications() {
  const swRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(SW_PATH).then((reg) => { swRef.current = reg; }).catch(() => { });
  }, []);

  const permission = useCallback(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    try {
      const result = await Notification.requestPermission();
      localStorage.setItem(LS_KEY, 'true');
      return result === 'granted';
    } catch {
      return false;
    }
  }, []);

  const showLocalNotification = useCallback((title: string, options?: { body?: string; tag?: string; url?: string }) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    if (swRef.current) {
      swRef.current.showNotification(title, {
        body: options?.body || '',
        icon: '/logo.png',
        badge: '/favicon.ico',
        tag: options?.tag || 'local',
        data: { url: options?.url || '/' },
        requireInteraction: true,
      });
    } else {
      new Notification(title, {
        body: options?.body || '',
        icon: '/logo.png',
        tag: options?.tag || 'local',
      });
    }
  }, []);

  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();
      if (subscription) return subscription;

      const response = await fetch('/push/vapid-public-key');
      const vapidKey = response.ok ? (await response.text()).trim() : null;
      if (!vapidKey) return null;

      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      return subscription;
    } catch {
      return null;
    }
  }, []);

  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (!subscription) return true;
      await subscription.unsubscribe();
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    permission: permission(),
    requestPermission,
    showLocalNotification,
    subscribeToPush,
    unsubscribeFromPush,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData.split('').map((c) => c.charCodeAt(0)));
}
