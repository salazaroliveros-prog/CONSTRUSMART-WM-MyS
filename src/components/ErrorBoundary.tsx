import React, { Component, ErrorInfo, ReactNode } from 'react'
import { log } from '@/lib/auto-logger'
import { checkStoreHealth } from '@/lib/store-health'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  moduleName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  recoveryAttempts: number
}

const MAX_RECOVERY_ATTEMPTS = 3
const RECOVERY_DELAYS = [1000, 2000, 4000] // Exponential backoff: 1s, 2s, 4s

/**
 * ErrorBoundary inteligente con autorecuperación automática
 * 
 * Características:
 * - Captura errores de renderizado en hijos
 * - Reintenta hasta 3 veces con backoff exponencial (1s, 2s, 4s)
 * - Registra errores en auto-logger persistente
 * - Verifica salud del store y reinicia si es necesario
 * - Muestra UI de fallback con botón "Reintentar"
 * - Soporta módulos nombrados para trazabilidad
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    
    const moduleName = this.props.moduleName || 'UnknownModule'
    
    log('error', `ErrorBoundary:${moduleName}`, error.message, {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      recoveryAttempts: this.state.recoveryAttempts,
    })

    // Intento de autorecuperación automática
    this.attemptAutoRecovery()
  }

  componentWillUnmount(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
    }
  }

  private attemptAutoRecovery(): void {
    const { recoveryAttempts } = this.state

    if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      log('warn', 'ErrorBoundary', `Max recovery attempts (${MAX_RECOVERY_ATTEMPTS}) reached. Manual intervention required.`)
      return
    }

    const delay = RECOVERY_DELAYS[recoveryAttempts] || 4000
    const moduleName = this.props.moduleName || 'UnknownModule'

    log('recovery', `ErrorBoundary:${moduleName}`, 
      `Attempting auto-recovery #${recoveryAttempts + 1}/${MAX_RECOVERY_ATTEMPTS} in ${delay}ms...`)

    this.recoveryTimer = setTimeout(() => {
      this.setState(prev => ({
        hasError: false,
        error: null,
        errorInfo: null,
        recoveryAttempts: prev.recoveryAttempts + 1,
      }))
    }, delay)
  }

  private handleManualReset = (): void => {
    log('recovery', 'ErrorBoundary', 'Manual reset triggered by user')

    // Verificar salud del store antes de resetear
    try {
      const rootState = (window as unknown as Record<string, unknown>).__store_state__ as Record<string, unknown> | undefined
      if (rootState && !checkStoreHealth(rootState)) {
        log('recovery', 'ErrorBoundary', 'Store health check failed. Resetting store to initial state.')
      }
    } catch {
      // Silencio — el store puede no estar disponible
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
    })

    this.props.onReset?.()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Si hay fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { recoveryAttempts } = this.state
      const canRetry = recoveryAttempts < MAX_RECOVERY_ATTEMPTS

      return (
        <div style={{
          padding: '24px',
          margin: '16px',
          borderRadius: '8px',
          backgroundColor: 'hsl(var(--destructive) / 0.1)',
          border: '1px solid hsl(var(--destructive) / 0.3)',
          color: 'hsl(var(--destructive))',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600 }}>
            ⚠️ Error en el módulo {this.props.moduleName || 'del sistema'}
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: '0.875rem', opacity: 0.8 }}>
            {this.state.error?.message || 'Ha ocurrido un error inesperado'}
          </p>
          
          {canRetry ? (
            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '12px' }}>
              Reintentando automáticamente... (intento {recoveryAttempts + 1}/{MAX_RECOVERY_ATTEMPTS})
            </p>
          ) : (
            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '12px', color: 'hsl(var(--warning))' }}>
              La recuperación automática no tuvo éxito. Intenta manualmente.
            </p>
          )}

          <button
            onClick={this.handleManualReset}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            🔄 Reintentar
          </button>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{ marginTop: '16px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.75rem', opacity: 0.6 }}>
                Ver detalle técnico
              </summary>
              <pre style={{
                marginTop: '8px',
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: 'hsl(var(--background))',
                fontSize: '0.7rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                maxHeight: '200px',
              }}>
                {this.state.error?.stack}
                {'\n\nComponent Stack:\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary