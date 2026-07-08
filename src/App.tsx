import { lazy, useState, useEffect } from "react";
import { useVisualSettings } from "@/hooks/useVisualSettings";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary as AppErrorBoundary } from "@/components/ErrorBoundary";
import { AntdProvider } from "@/lib/antd-config";
import type { ThemeMode } from "@/lib/antd-config";
import * as Sentry from '@sentry/react';
import { isSentryInitialized } from '@/lib/sentry';

const Index = lazy(() => import("./pages/Index"));

const queryClient = new QueryClient();

function getIsDark(): boolean {
  try {
    const theme = localStorage.getItem('wm_erp_theme') || '';
    if (theme === 'dark-pro') return true;
    const s = localStorage.getItem('wm_erp_data_settings');
    if (s) {
      const parsed = JSON.parse(s);
      return parsed?.appTheme === 'dark' || parsed?.appTheme === 'dark-pro';
    }
  } catch (e) {
    console.warn('[Theme] Error leyendo preferencia de tema, usando system default:', e);
    localStorage.removeItem('wm_erp_theme');
    localStorage.removeItem('wm_erp_data_settings');
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const App = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    getIsDark() ? 'dark' : 'light'
  );
  useVisualSettings();

  useEffect(() => {
    const onThemeChange = () => setThemeMode(getIsDark() ? 'dark' : 'light');
    window.addEventListener('wm-theme-changed', onThemeChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'wm_erp_theme' || e.key === 'wm_erp_data_settings')
        onThemeChange();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('wm-theme-changed', onThemeChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light">
      <AntdProvider mode={themeMode}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {isSentryInitialized() ? (
              <Sentry.ErrorBoundary fallback={<div className="p-6 text-center text-sm text-red-600">Ha ocurrido un error inesperado. Puede recargar la página para continuar.</div>}>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </Sentry.ErrorBoundary>
            ) : (
              <AppErrorBoundary>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </AppErrorBoundary>
            )}
          </TooltipProvider>
        </QueryClientProvider>
      </AntdProvider>
    </ThemeProvider>
  );
};

export default App;