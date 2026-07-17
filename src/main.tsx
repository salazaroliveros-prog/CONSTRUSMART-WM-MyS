import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initServiceWorker, unregisterServiceWorker } from '@/lib/sw-init';
import { log } from '@/lib/auto-logger';
import { errorReporter } from '@/lib/errorReporting';
import { initMetrics } from '@/lib/metrics';
import './index.css';
import '@/lib/i18n';
import { initSentry } from '@/lib/sentry';

const container = document.getElementById('root');
const root = createRoot(container!);

;(async () => {
  if (!sessionStorage.getItem('wm_sw_disabled_once')) {
    const ok = await unregisterServiceWorker()
    if (ok) {
      sessionStorage.setItem('wm_sw_disabled_once', 'true');
      log('info', 'Main', 'Service Worker desregistrado para recarga limpia');
    }
  }
  const reg = await initServiceWorker();
  if (reg) {
    log('info', 'Main', 'Service Worker registrado correctamente', {
      scope: reg.scope,
      state: reg.active?.state,
    });
  }
})();

// Inicializar sistema de reporte de errores local
errorReporter.init();
log('info', 'Main', 'Sistema de reporte de errores inicializado');

// Inicializar sistema de métricas y monitoring
initMetrics();
log('info', 'Main', 'Sistema de métricas y monitoring inicializado');

// Inicializar Sentry (si está configurado)
initSentry().catch(() => {});

// Captura global de errores no manejados
window.addEventListener('error', (event) => {
  console.error('[GlobalError]', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledRejection]', event.reason);
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
