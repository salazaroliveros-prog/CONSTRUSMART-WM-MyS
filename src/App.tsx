import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoaderSpinner from "@/components/LoaderSpinner";
import { AntdProvider } from "@/lib/antd-config";
import type { ThemeMode } from "@/lib/antd-config";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Leer appSettings del store para sincronizar con el tema guardado
    try {
      const stored = localStorage.getItem('wm_erp_data_settings');
      if (stored) {
        const s = JSON.parse(stored);
        if (s?.appTheme === 'dark' || s?.appTheme === 'dark-pro') return 'dark';
      }
    } catch { /* silent */ }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return (localStorage.getItem('theme-mode') as ThemeMode) || (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    // Escuchar cambios de tema desde el store (via storage event o custom event)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wm_erp_data_settings' && e.newValue) {
        try {
          const s = JSON.parse(e.newValue);
          if (s?.appTheme) {
            setThemeMode(s.appTheme === 'dark' || s.appTheme === 'dark-pro' ? 'dark' : 'light');
          }
        } catch { /* silent */ }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AntdProvider mode={themeMode}>
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ErrorBoundary>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<LoaderSpinner size={60} text="Cargando..." fullScreen />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ErrorBoundary>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AntdProvider>
  );
};

export default App;