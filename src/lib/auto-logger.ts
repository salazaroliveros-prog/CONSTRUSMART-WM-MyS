/**
 * Auto-Logger — Sistema de logging persistente y autorecuperable
 * 
 * Características:
 * - Niveles: info, warn, error, recovery
 * - Persistencia en localStorage (últimos 100 logs)
 * - Rotación automática de logs antiguos
 * - Exportación para diagnóstico
 * - Integración con ErrorBoundary, safeFetch, safeParse, store-health
 * 
 * @example
 * import { log } from '@/lib/auto-logger'
 * log('error', 'CRM', 'Failed to fetch leads', { leadId: 123 })
 * log('recovery', 'Store', 'Auto-recovered after retry', { attempts: 3 })
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'recovery'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: unknown
  userAgent?: string
  url?: string
}

const STORAGE_KEY = 'wm_erp_logs'
const MAX_LOG_ENTRIES = 100
const MAX_DATA_DEPTH = 3 // Evitar objetos circulares en serialización

let isInitialized = false

/**
 * Inicializa el módulo de logging
 * Se llama automáticamente en el primer uso
 */
function initialize(): void {
  if (isInitialized) return
  isInitialized = true

  // En desarrollo, mostrar en consola cuántos logs existen
  if (process.env.NODE_ENV === 'development') {
    try {
      const existingLogs = getLogs()
      if (existingLogs.length > 0) {
        console.log(`[AutoLogger] ${existingLogs.length} existing logs found in localStorage`)
      }
    } catch {
      // Silencio — localStorage puede no estar disponible
    }
  }

  // Escuchar errores globales no capturados
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      log('error', 'GlobalErrorHandler', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString(),
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason
      const msg = reason?.message || String(reason)
      if (msg.includes('toLocaleLowerCase is not a function') || msg.includes('Unexpected character: }')) {
        event.preventDefault()
        return
      }
      log('error', 'UnhandledPromise', msg, {
        stack: reason?.stack,
      })
    })
  }
}

/**
 * Obtiene todos los logs almacenados
 */
export function getLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Si el localStorage está corrupto, limpiarlo
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Silencio
    }
    return []
  }
}

/**
 * Limpieza automática de logs antiguos
 */
function trimLogs(logs: LogEntry[]): LogEntry[] {
  if (logs.length <= MAX_LOG_ENTRIES) return logs
  return logs.slice(logs.length - MAX_LOG_ENTRIES)
}

/**
 * Serializa datos de forma segura, evitando objetos circulares
 */
function safeSerialize(data: unknown, depth = 0): unknown {
  if (depth > MAX_DATA_DEPTH) return '[Max Depth]'
  if (data === null) return null
  if (data === undefined) return undefined
  
  const type = typeof data
  if (type === 'string' || type === 'number' || type === 'boolean') return data
  if (type === 'bigint') return data.toString()
  if (type === 'symbol') return data.toString()
  if (type === 'function') return '[Function]'

  if (Array.isArray(data)) {
    return data.slice(0, 10).map(item => safeSerialize(item, depth + 1))
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack?.split('\n').slice(0, 5).join('\n'),
    }
  }

  if (data instanceof Date) {
    return data.toISOString()
  }

  if (type === 'object') {
    const obj = data as Record<string, unknown>
    const keys = Object.keys(obj).slice(0, 10) // Máximo 10 keys
    const result: Record<string, unknown> = {}
    for (const key of keys) {
      try {
        result[key] = safeSerialize(obj[key], depth + 1)
      } catch {
        result[key] = '[Serialization Error]'
      }
    }
    return result
  }

  return String(data)
}

/**
 * Registra un evento en el log persistente
 */
export function log(
  level: LogLevel,
  module: string,
  message: string,
  data?: unknown
): void {
  try {
    initialize()

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data: data !== undefined ? safeSerialize(data) : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : undefined,
      url: typeof window !== 'undefined' ? window.location.href.slice(0, 500) : undefined,
    }

    // Console output
    const prefix = `[${level.toUpperCase()}][${module}]`
    switch (level) {
      case 'error':
        console.error(prefix, message, data || '')
        break
      case 'recovery':
        console.warn('🔄', prefix, message, data || '')
        break
      case 'warn':
        console.warn(prefix, message, data || '')
        break
      default:
        console.log(prefix, message, data || '')
    }

    // Persistencia
    try {
      const logs = getLogs()
      logs.push(entry)
      const trimmed = trimLogs(logs)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
      // Si localStorage está lleno, limpiar logs viejos
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([entry]))
      } catch {
        // Silencio total — no podemos loggear si no hay storage
      }
    }
  } catch {
    // Failsafe absoluto — nunca debe lanzar error
    try {
      console.log(`[${level}][${module}]`, message)
    } catch {
      // Silencio absoluto
    }
  }
}

/**
 * Exporta logs para diagnóstico (descarga como JSON)
 */
export function exportLogs(): void {
  try {
    const logs = getLogs()
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `construsmart-logs-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    log('info', 'AutoLogger', `Exported ${logs.length} logs`, { filename: a.download })
  } catch (error) {
    console.error('[AutoLogger] Failed to export logs:', error)
  }
}

/**
 * Limpia todos los logs almacenados
 */
export function clearLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    log('info', 'AutoLogger', 'All logs cleared')
  } catch {
    // Silencio
  }
}

export default log