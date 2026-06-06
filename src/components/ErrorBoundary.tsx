import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    try {
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      logs.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('errorLogs', JSON.stringify(logs.slice(-10)));
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background text-foreground font-sans text-center">
          <div className="max-w-md p-8 bg-card rounded-3xl shadow-lg border border-border">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-destructive mb-2">Algo salió mal</h1>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              Ha ocurrido un error inesperado. No te preocupes, tus datos están seguros.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 mb-4 text-left bg-muted p-4 rounded-2xl text-xs">
                <summary className="cursor-pointer font-semibold text-foreground/70">
                  Detalles del error (desarrollo)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words text-destructive text-[0.75rem]">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium text-sm transition-colors"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-2xl font-medium text-sm transition-colors"
              >
                Recargar página
              </button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Si este error persiste, contacta al administrador del sistema
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;