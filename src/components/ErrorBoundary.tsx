"use client"

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary mejorado con:
 * - Captura de errores controlados y no controlados
 * - Logging sanitizado (sin exponer datos sensibles)
 * - Botón de recarga para el usuario
 * - Modo desarrollo muestra detalles técnicos
 * - Callback onError para reporte externo
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log sanitizado — sin exponer datos sensibles
    const sanitizedError = {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'), // Solo primeras 3 líneas
      componentStack: errorInfo.componentStack?.split('\n').slice(0, 5).join('\n'),
      timestamp: new Date().toISOString(),
    };

    if (import.meta.env.DEV) {
      console.group('🔴 Error Boundary caught an error:');
      console.error('Error:', sanitizedError);
      console.groupEnd();
    }

    // Callback para reporte externo (Sentry, etc.)
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="max-w-md w-full p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Algo salió mal</h2>
              <p className="text-sm text-muted-foreground">
                Ha ocurrido un error inesperado. Puedes intentar recargar la página o contactar al administrador.
              </p>
            </div>

            {/* Solo mostrar detalles técnicos en desarrollo */}
            {import.meta.env.DEV && this.state.error && (
              <div className="space-y-2">
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Detalles técnicos (solo desarrollo)
                  </summary>
                  <pre className="mt-2 p-3 rounded bg-muted overflow-auto max-h-40 text-xs text-muted-foreground">
                  {this.state.error.name}: {this.state.error.message}
                  </pre>
                </details>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                Reintentar
              </Button>
              <Button onClick={this.handleReload}>
                Recargar página
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;