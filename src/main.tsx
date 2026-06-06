import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'
import './antd-global.css'
import './styles/responsive.css'
import './lib/i18n'
import { applyThemeToDocument } from './utils/theme-generator'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    integrations: [Sentry.replayIntegration()],
  });
}

// Aplicar tema por defecto ANTES de renderizar React
applyThemeToDocument({ appTheme: 'light', primaryColor: 'hsl(222.2 47.4% 11.2%)', compactMode: false });

// Registrar Service Worker para offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(
      (err) => console.warn('SW falló al registrarse:', err)
    );
  });
}

const container = document.getElementById('root');
if (container && !container.dataset.reactRoot) {
  container.dataset.reactRoot = '1';
  createRoot(container).render(<App />);
}