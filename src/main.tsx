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

// Inicializar sistema de temas ANTES de renderizar React
import('./lib/themes').then(({ initializeTheme }) => {
  initializeTheme()
}).catch(err => {
  console.warn('No se pudo inicializar temas:', err)
})

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
