import React, { Component, ErrorInfo, ReactNode } from 'react';

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
 * ErrorBoundary - Componente global para capturar errores no controlados
 * Previene que toda la app se caiga y muestra una UI amigable con Tailwind CSS.
 * Rate limiting: máximo 3 errores en 10 segundos, si excede recarga automática.
 * Log de errores en localStorage (últimos 50 registros).
 */
class ErrorBoundary extends Component<Props, State> {
  private errorCount: number = 0;
  private lastErrorTime: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Rate limiting: máximo 3 errores en 10 segundos
    const now = Date.now();
    if (now - this.lastErrorTime < 10000) {
      this.errorCount++;
    } else {
      this.errorCount = 1;
    }
    this.lastErrorTime = now;

    if (this.errorCount > 3) {
      console.error('[ErrorBoundary] Demasiados errores en poco tiempo, posible ataque o bug crítico');
      setTimeout(() => window.location.reload(), 5000);
    }

    // Registrar en audit si está disponible
    try {
      this.logErrorToStorage(error, errorInfo);
    } catch {
      // Silencioso - no podemos fallar al fallar
    }

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logErrorToStorage(error: Error, errorInfo: ErrorInfo): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      const stored = JSON.parse(localStorage.getItem('app_error_log') || '[]');
      stored.push(errorLog);
      if (stored.length > 50) stored.shift();
      localStorage.setItem('app_error_log', JSON.stringify(stored));
    } catch {
      console.warn('[ErrorBoundary] No se pudo guardar el log de errores');
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.errorCount = 0;
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-50 text-slate-800 font-sans text-center">
          <div className="max-w-md p-8 bg-white rounded-3xl shadow-lg">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-red-600 mb-2">Algo salió mal</h1>
            <p className="text-sm text-slate-500 mb-2 leading-relaxed">
              Ha ocurrido un error inesperado. No te preocupes, tus datos están seguros.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 mb-4 text-left bg-slate-100 p-4 rounded-2xl text-xs">
                <summary className="cursor-pointer font-semibold text-slate-600">
                  Detalles del error (desarrollo)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words text-red-700 text-[0.75rem]">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center mt-6 flex-wrap">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-medium text-sm transition-colors"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl font-medium text-sm transition-colors"
              >
                Recargar página
              </button>
            </div>
            <p className="mt-6 text-xs text-slate-400">
              Si este error persiste, contacta al administrador del sistema
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;