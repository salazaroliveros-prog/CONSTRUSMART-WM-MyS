import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { store } from './store';
import { Provider } from 'react-redux';
import { initServiceWorker } from '@/lib/sw-init';
import { scheduleHealthCheck } from '@/lib/store-health';
import { log } from '@/lib/auto-logger';
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

// Programar chequeo periódico de salud del store (cada 5 minutos)
const cancelHealthCheck = scheduleHealthCheck(
  () => store.getState() as unknown as Record<string, unknown>,
  'ReduxStore'
);

// Limpiar health check al recargar página
window.addEventListener('beforeunload', () => {
  cancelHealthCheck();
});

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
