import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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