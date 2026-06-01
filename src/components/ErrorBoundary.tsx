import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Algo salió mal</h2>
            <p className="text-sm text-slate-500 mb-4">Ocurrió un error inesperado en la aplicación.</p>
            <pre className="text-xs text-red-600 bg-red-50 rounded-lg p-3 overflow-auto max-h-40 text-left mb-4">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-2 w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
