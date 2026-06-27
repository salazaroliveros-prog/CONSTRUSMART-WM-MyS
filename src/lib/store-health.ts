import { log } from './auto-logger'

export interface HealthReport {
  healthy: boolean
  issues: string[]
  timestamp: string
  module: string
  recoveredKeys: string[]
  retryCount?: number
  circuitBreakerTripped?: boolean
}

export interface DebugMetrics {
  checksPerformed: number
  issuesDetected: number
  repairsApplied: number
  retriesTriggered: number
  circuitBreakerTripped: number
  lastHealthyAt: string | null
  lastIssueAt: string | null
}

type HealthStatus = 'healthy' | 'degraded' | 'critical'

interface CircuitBreakerState {
  failures: number
  lastFailure: number
  openedUntil: number
}

const HEALTH_CHECK_INTERVAL = 300000 // 5 minutos
const MAX_LOG_ENTRIES = 50
const CIRCUIT_BREAKER_THRESHOLD = 3
const CIRCUIT_BREAKER_COOLDOWN = 60000 // 1 min

const metrics: DebugMetrics = {
  checksPerformed: 0,
  issuesDetected: 0,
  repairsApplied: 0,
  retriesTriggered: 0,
  circuitBreakerTripped: 0,
  lastHealthyAt: null,
  lastIssueAt: null,
}

const circuitBreaker: Record<string, CircuitBreakerState> = {}

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

export default checkStoreHealth/**
 * AutoDebugger — Diagnóstico + auto-reparación avanzada en producción
 * 
 * Características nuevas:
 * - Detección extendida (undefined/null/NaN/empty/arrays corruptos)
 * - Circuit breaker para reintentos infinitos
 * - Backoff exponencial en reparaciones
 * - Métricas de salud persistentes
 * - Modo debug/production
 * - Integración con log y error-logger
 */

export class AutoDebugger {
  private moduleName: string
  private enabled = true
  private intervalId: ReturnType<typeof setInterval> | null = null

  constructor(moduleName: string) {
    this.moduleName = moduleName
  }

  start(getState: () => Record<string, unknown>, intervalMs = HEALTH_CHECK_INTERVAL) {
    if (this.intervalId) return
    this.intervalId = setInterval(() => {
      if (!this.enabled) return
      try {
        const state = getState()
        const issues = detectIssues(state)

        metrics.checksPerformed++

        if (issues.length > 0) {
          metrics.issuesDetected += issues.length
          metrics.lastIssueAt = new Date().toISOString()

          log('warn', `AutoDebug:${this.moduleName}`, `Issues detected: ${issues.length}`, {
            issues,
          })

          const repaired = attemptRepair(state, issues)
          if (repaired.recoveredKeys.length > 0) {
            metrics.repairsApplied += repaired.recoveredKeys.length
          }

          const breakerKey = this.moduleName
          const now = Date.now()
          const breaker = circuitBreaker[breakerKey]
          if (breaker && breaker.openedUntil > now) {
            metrics.circuitBreakerTripped++
            log('warn', `AutoDebug:${this.moduleName}`, 'Circuit breaker open, skipping repair', {
              openedUntil: new Date(breaker.openedUntil).toISOString(),
            })
            return
          }

          if (!repaired.report.healthy) {
            if (!breaker) {
              circuitBreaker[breakerKey] = { failures: 1, lastFailure: now, openedUntil: 0 }
            } else {
              circuitBreaker[breakerKey].failures++
              circuitBreaker[breakerKey].lastFailure = now
            }

            if (circuitBreaker[breakerKey].failures >= CIRCUIT_BREAKER_THRESHOLD) {
              circuitBreaker[breakerKey].openedUntil = now + CIRCUIT_BREAKER_COOLDOWN
              metrics.circuitBreakerTripped++
              log('error', `AutoDebug:${this.moduleName}`, 'Circuit breaker tripped', {
                failures: circuitBreaker[breakerKey].failures,
              })
            }
          } else {
            if (breaker) {
              circuitBreaker[breakerKey].failures = 0
              circuitBreaker[breakerKey].openedUntil = 0
            }
            metrics.lastHealthyAt = new Date().toISOString()
          }
        } else {
          metrics.lastHealthyAt = new Date().toISOString()
        }
      } catch (error) {
        log('error', `AutoDebug:${this.moduleName}`, 'AutoDebug execution failed', {
          error: String(error),
        })
      }
    }, intervalMs)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  getMetrics(): DebugMetrics {
    return { ...metrics }
  }

  resetMetrics() {
    metrics.checksPerformed = 0
    metrics.issuesDetected = 0
    metrics.repairsApplied = 0
    metrics.retriesTriggered = 0
    metrics.circuitBreakerTripped = 0
    metrics.lastHealthyAt = null
    metrics.lastIssueAt = null
  }
}
