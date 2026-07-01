import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initServiceWorker } from '@/lib/sw-init';
import { log } from '@/lib/auto-logger';
import { errorReporter } from '@/lib/errorReporting';
import { initMetrics } from '@/lib/metrics';
import './index.css';
import '@/lib/i18n';

const container = document.getElementById('root');
const root = createRoot(container!);

// Inicializar Service Worker con VAPID key dinámica
initServiceWorker().then(reg => {
  if (reg) {
    log('info', 'Main', 'Service Worker registrado correctamente', {
      scope: reg.scope,
      state: reg.active?.state,
    });
  }
});

// Inicializar sistema de reporte de errores local
errorReporter.init();
log('info', 'Main', 'Sistema de reporte de errores inicializado');

// Inicializar sistema de métricas y monitoring
initMetrics();
log('info', 'Main', 'Sistema de métricas y monitoring inicializado');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
