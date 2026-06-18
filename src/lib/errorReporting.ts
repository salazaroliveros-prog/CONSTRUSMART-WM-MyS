/**
 * Sistema de Reporte de Errores Centralizado
 * 
 * Funcionalidades:
 * - Captura automática de errores (window.onerror, unhandledrejection)
 * - Almacenamiento de errores en localStorage (últimos 100)
 * - Clasificación por severidad (low, medium, high, critical)
 * - Reporte manual de errores
 * - Consulta de historial de errores
 */

interface ErrorEntry {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'runtime' | 'network' | 'validation' | 'auth' | 'sync' | 'unknown';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
  userId?: string;
}

const ERROR_STORAGE_KEY = 'erp_error_log';
const MAX_ERRORS = 100;

class ErrorReporter {
  private errors: ErrorEntry[] = [];
  private initialized = false;

  init() {
    if (this.initialized) return;

    this.loadErrors();

    window.onerror = (message, source, lineno, colno, error) => {
      this.reportError({
        severity: 'high',
        type: 'runtime',
        message: String(message),
        stack: error?.stack,
        context: { source, lineno, colno }
      });
    };

    window.onunhandledrejection = (event) => {
      this.reportError({
        severity: 'high',
        type: 'unknown',
        message: String(event.reason),
        stack: event.reason?.stack
      });
    };

    this.initialized = true;
  }

  private loadErrors() {
    try {
      const stored = localStorage.getItem(ERROR_STORAGE_KEY);
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (err) {
      console.error('[ErrorReporter] Error loading error log:', err);
    }
  }

  private saveErrors() {
    try {
      const trimmed = this.errors.slice(-MAX_ERRORS);
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.error('[ErrorReporter] Error saving error log:', err);
    }
  }

  reportError(error: Omit<ErrorEntry, 'id' | 'timestamp' | 'userAgent' | 'url'>) {
    const entry: ErrorEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...error
    };

    this.errors.push(entry);
    this.saveErrors();

    console.error(`[ErrorReporter] [${error.severity.toUpperCase()}] ${error.type}: ${error.message}`, entry);

    if (error.severity === 'critical') {
      this.notifyCriticalError(entry);
    }
  }

  private notifyCriticalError(entry: ErrorEntry) {
    try {
      const notifications = JSON.parse(localStorage.getItem('erp_notificaciones') || '[]');
      const existingNotification = notifications.find(
        (n: any) => n.titulo === 'Error Crítico Detectado' && !n.leido
      );

      if (!existingNotification) {
        notifications.unshift({
          id: crypto.randomUUID(),
          titulo: 'Error Crítico Detectado',
          mensaje: `${entry.type}: ${entry.message.substring(0, 100)}...`,
          tipo: 'error',
          leido: false,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('erp_notificaciones', JSON.stringify(notifications.slice(0, 50)));
      }
    } catch (err) {
      console.error('[ErrorReporter] Error creating notification:', err);
    }
  }

  getErrors(filters?: {
    severity?: ErrorEntry['severity'];
    type?: ErrorEntry['type'];
    since?: Date;
  }): ErrorEntry[] {
    let filtered = [...this.errors];

    if (filters?.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    if (filters?.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters?.since) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= filters.since!);
    }

    return filtered.reverse();
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      last24h: 0,
      lastCritical: null as ErrorEntry | null
    };

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const error of this.errors) {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

      if (new Date(error.timestamp) >= last24h) {
        stats.last24h++;
      }

      if (error.severity === 'critical' && !stats.lastCritical) {
        stats.lastCritical = error;
      }
    }

    return stats;
  }

  clearErrors() {
    this.errors = [];
    this.saveErrors();
  }

  clearOldErrors(daysToKeep = 7) {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    this.errors = this.errors.filter(e => new Date(e.timestamp) >= cutoff);
    this.saveErrors();
  }
}

export const errorReporter = new ErrorReporter();

export function reportNetworkError(message: string, context?: Record<string, unknown>) {
  errorReporter.reportError({
    severity: 'medium',
    type: 'network',
    message,
    context
  });
}

export function reportValidationError(message: string, context?: Record<string, unknown>) {
  errorReporter.reportError({
    severity: 'low',
    type: 'validation',
    message,
    context
  });
}

export function reportAuthError(message: string, context?: Record<string, unknown>) {
  errorReporter.reportError({
    severity: 'high',
    type: 'auth',
    message,
    context
  });
}

export function reportSyncError(message: string, context?: Record<string, unknown>) {
  errorReporter.reportError({
    severity: 'medium',
    type: 'sync',
    message,
    context
  });
}

export function reportCriticalError(message: string, context?: Record<string, unknown>) {
  errorReporter.reportError({
    severity: 'critical',
    type: 'unknown',
    message,
    context
  });
}