import { lazy, useEffect } from "react";
import { useVisualSettings } from "@/hooks/useVisualSettings";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary as AppErrorBoundary } from "@/components/ErrorBoundary";
import * as Sentry from '@sentry/react';
import { isSentryInitialized } from '@/lib/sentry';

const Index = lazy(() => import("./pages/Index"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useVisualSettings();

  return (
    <ThemeProvider defaultTheme="light">
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
    </ThemeProvider>
  );
};

export default App;