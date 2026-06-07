import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'
import './antd-global.css'
import './styles/responsive.css'
import './styles/themes.css'
import './lib/i18n'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    integrations: [Sentry.replayIntegration()],
  })
}

// Inicializar sistema de temas ANTES de renderizar React (síncrono)
try {
  const savedTheme = localStorage.getItem('wm_erp_theme') || 'ant-design';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.classList.toggle('dark', savedTheme === 'dark-pro');
  // Cargar colores completos del tema en background
  import('./lib/themes').then(({ initializeTheme }) => initializeTheme()).catch(() => {});
} catch { /* silent */ }

// Registrar Service Worker para offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(
      (err) => console.warn('SW falló al registrarse:', err)
    )
  })
}

const container = document.getElementById('root')
if (container && !container.dataset.reactRoot) {
  container.dataset.reactRoot = '1'
  createRoot(container).render(<App />)
}
