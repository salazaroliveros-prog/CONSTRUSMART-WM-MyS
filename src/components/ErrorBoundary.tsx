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
 * Previene que toda la app se caiga y muestra una UI amigable
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
      // Forzar recarga si hay demasiados errores
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
      // Mantener solo los últimos 50 errores
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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          color: '#333',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '500px',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
            }}>
              ⚠️
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#e53e3e',
            }}>
              Algo salió mal
            </h1>
            <p style={{
              color: '#666',
              marginBottom: '0.5rem',
              lineHeight: 1.5,
            }}>
              Ha ocurrido un error inesperado. No te preocupes, tus datos están seguros.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '1rem',
                marginBottom: '1rem',
                textAlign: 'left',
                backgroundColor: '#f7f7f7',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#555' }}>
                  Detalles del error (desarrollo)
                </summary>
                <pre style={{
                  marginTop: '0.5rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#c53030',
                  fontSize: '0.8rem',
                }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              marginTop: '1.5rem',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2c5282')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3182ce')}
              >
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#e2e8f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#cbd5e0')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
              >
                Recargar página
              </button>
            </div>
            <p style={{
              marginTop: '1.5rem',
              fontSize: '0.8rem',
              color: '#999',
            }}>
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
