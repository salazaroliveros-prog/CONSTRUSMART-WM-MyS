import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  // Inicializar tema desde preferencias del usuario
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme-mode') as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  // Cambiar tema
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem('theme-mode', newTheme);
      return newTheme;
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setTheme(mode);
    applyTheme(mode);
    localStorage.setItem('theme-mode', mode);
  }, []);

  return {
    theme,
    toggleTheme,
    setThemeMode,
    mounted,
  };
};

// Función para aplicar tema al DOM
function applyTheme(theme: ThemeMode) {
  const html = document.documentElement;
  
  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    html.classList.add('dark');
    html.style.colorScheme = 'dark';
  } else {
    html.setAttribute('data-theme', 'light');
    html.classList.remove('dark');
    html.style.colorScheme = 'light';
  }

  // Emitir evento personalizado
  window.dispatchEvent(
    new CustomEvent('theme-changed', { detail: { theme } })
  );
}
