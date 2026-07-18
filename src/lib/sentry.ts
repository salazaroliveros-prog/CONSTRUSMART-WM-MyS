import * as Sentry from '@sentry/react';
export const { captureException, captureMessage } = Sentry;

let sentryInitialized = false;

export async function initSentry(): Promise<void> {
  if (sentryInitialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.warn('[Sentry] VITE_SENTRY_DSN no configurada. Sentry no se inicializará.');
    }
    return;
  }
  try {
    Sentry.init({
      dsn,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.1,
      environment: import.meta.env.MODE,
    });
    sentryInitialized = true;
    console.info('[Sentry] Inicializado correctamente');
  } catch (e) {
    console.error('[Sentry] Error al inicializar:', e);
  }
}

export function isSentryInitialized(): boolean {
  return sentryInitialized;
}