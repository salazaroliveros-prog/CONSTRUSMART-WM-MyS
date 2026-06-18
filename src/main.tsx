import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initServiceWorker } from '@/lib/sw-init';
import { log } from '@/lib/auto-logger';
import { errorReporter } from '@/lib/errorReporting';
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

// Inicializar sistema de reporte de errores
errorReporter.init();
log('info', 'Main', 'Sistema de reporte de errores inicializado');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
