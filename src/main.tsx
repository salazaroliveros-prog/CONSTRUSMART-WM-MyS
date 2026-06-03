import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Registrar Service Worker para offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('SW registrado, scope:', registration.scope);
      },
      (err) => {
        console.warn('SW falló al registrarse:', err);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);