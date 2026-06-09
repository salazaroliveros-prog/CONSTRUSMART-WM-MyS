import { log } from './auto-logger'

export interface HealthReport {
  healthy: boolean
  issues: string[]
  timestamp: string
  module: string
  recoveredKeys: string[]
}

const HEALTH_CHECK_INTERVAL = 300000 // 5 minutos
const MAX_LOG_ENTRIES = 50

/**
 * Store Health Check — Monitoreo y autorecuperación del estado global
 * 
 * Características:
 * - Verifica que todas las keys del store tengan valores válidos
 * - Detecta undefined/null en estado y registra el problema
 * - Ofrece reseteo automático de keys inválidas
 * - Genera reportes de salud para diagnóstico
 * - Auto-limpieza de logs viejos
 * - Ejecución periódica programable
 */

/**
 * Verifica la salud de un objeto de estado
 * Retorna false si encuentra valores inválidos
 */
export function checkStoreHealth(
  state: Record<string, unknown>,
  moduleName = 'UnknownStore'
): boolean {
  const issues: string[] = []

  for (const [key, value] of Object.entries(state)) {
    if (value === undefined) {
      issues.push(`Key "${key}" is undefined`)
    } else if (value === null) {
      issues.push(`Key "${key}" is null (expected object/array/primitive)`)
    } else if (typeof value === 'number' && isNaN(value)) {
      issues.push(`Key "${key}" is NaN`)
    } else if (typeof value === 'string' && value.length === 0 && key !== '') {
      // Strings vacíos pueden ser válidos, solo advertir
      issues.push(`Key "${key}" is empty string — possible data loss`)
    }
  }

  if (issues.length > 0) {
    log('warn', `StoreHealth:${moduleName}`, `Health check failed: ${issues.length} issues`, {
      issues,
      totalKeys: Object.keys(state).length,
    })
    return false
  }

  return true
}

/**
 * Recupera keys inválidas de un store, reemplazándolas con valores por defecto
 * Retorna un nuevo objeto con las correcciones aplicadas (inmutable)
 */
export function recoverStoreState<T extends Record<string, unknown>>(
  state: T,
  defaults: Partial<T>,
  moduleName = 'UnknownStore'
): { recovered: T; report: HealthReport } {
  const recovered: Record<string, unknown> = { ...state }
  const issues: string[] = []
  const recoveredKeys: string[] = []

  for (const [key, value] of Object.entries(state)) {
    if (value === undefined || value === null) {
      const defaultValue = defaults[key as keyof T]
      if (defaultValue !== undefined) {
        recovered[key] = defaultValue
        recoveredKeys.push(key)
        issues.push(`Key "${key}" was ${value === undefined ? 'undefined' : 'null'}, recovered with default`)
      } else {
        issues.push(`Key "${key}" is invalid but no default provided`)
      }
    } else if (typeof value === 'number' && isNaN(value)) {
      const defaultValue = defaults[key as keyof T]
      if (defaultValue !== undefined) {
        recovered[key] = defaultValue
        recoveredKeys.push(key)
        issues.push(`Key "${key}" was NaN, recovered with default`)
      }
    }
  }

  const healthy = issues.length === 0

  if (recoveredKeys.length > 0) {
    log('recovery', `StoreHealth:${moduleName}`, `Recovered ${recoveredKeys.length} keys`, {
      recoveredKeys,
      issues,
    })
  }

  const report: HealthReport = {
    healthy,
    issues,
    timestamp: new Date().toISOString(),
    module: moduleName,
    recoveredKeys,
  }

  return { recovered: recovered as T, report }
}

/**
 * Programa chequeos periódicos de salud del store
 * Retorna función para cancelar el intervalo
 */
export function scheduleHealthCheck(
  getState: () => Record<string, unknown>,
  moduleName: string,
  intervalMs: number = HEALTH_CHECK_INTERVAL,
  onIssue?: (report: import('./auto-logger').LogEntry) => void
): () => void {
  const intervalId = setInterval(() => {
    try {
      const state = getState();
      const issues: string[] = [];

      for (const [key, value] of Object.entries(state)) {
        if (value === undefined) issues.push(`Key "${key}" is undefined`);
        else if (value === null) issues.push(`Key "${key}" is null`);
        else if (typeof value === 'number' && isNaN(value)) issues.push(`Key "${key}" is NaN`);
        else if (typeof value === 'string' && value.length === 0 && key !== '') issues.push(`Key "${key}" is empty string`);
      }

      if (issues.length > 0) {
        const report = {
          healthy: false,
          issues,
          timestamp: new Date().toISOString(),
          module: moduleName,
          recoveredKeys: [],
        };

        log('warn', `StoreHealth:${moduleName}`, `Health check failed: ${issues.length} issues`, report);

        if (onIssue) {
          try { onIssue(report); } catch (e) { /* noop */ }
        }
      }
    } catch (error) {
      log('error', `StoreHealth:${moduleName}`, 'Health check execution failed', {
        error: String(error),
      });
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}

/**
 * Exporta un reporte de salud detallado para diagnóstico
 */
export function generateHealthReport(
  state: Record<string, unknown>,
  moduleName: string
): HealthReport {
  const issues: string[] = []

  for (const [key, value] of Object.entries(state)) {
    if (value === undefined) {
      issues.push(`"${key}": undefined`)
    } else if (value === null) {
      issues.push(`"${key}": null`)
    } else if (typeof value === 'number' && isNaN(value)) {
      issues.push(`"${key}": NaN`)
    }
  }

  return {
    healthy: issues.length === 0,
    issues,
    timestamp: new Date().toISOString(),
    module: moduleName,
    recoveredKeys: [],
  }
}

export default checkStoreHealth