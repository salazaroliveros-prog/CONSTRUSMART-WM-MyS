import { log } from './auto-logger'

export interface SafeFetchOptions extends RequestInit {
  retries?: number
  baseDelay?: number
  timeout?: number
  onRetry?: (attempt: number, error: Error, delay: number) => void
}

const DEFAULT_RETRIES = 3
const DEFAULT_BASE_DELAY = 1000 // 1s
const DEFAULT_TIMEOUT = 30000 // 30s

/**
 * SafeFetch — Wrapper de fetch con autorecuperación inteligente
 * 
 * Características:
 * - Reintentos con backoff exponencial (1s, 2s, 4s)
 * - Timeout configurable por petición
 * - Logging automático de fallos y recuperaciones
 * - Callback onRetry para monitorear intentos
 * - Tipado genérico para respuesta
 */
export async function safeFetch<T>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    baseDelay = DEFAULT_BASE_DELAY,
    timeout = DEFAULT_TIMEOUT,
    onRetry,
    ...fetchOptions
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: fetchOptions.signal || controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} — ${url}`)
      }

      const data = await response.json() as T

      if (attempt > 0) {
        log('recovery', 'safeFetch', `Recovered successfully after ${attempt} retries`, { url })
      }

      return data

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Si es el último intento, no reintentar
      if (attempt >= retries) {
        log('error', 'safeFetch', `Failed after ${retries} retries`, {
          url,
          error: lastError.message,
          attempts: attempt + 1,
        })
        throw lastError
      }

      // Calcular delay con backoff exponencial + jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 500,
        30000 // Max 30s
      )

      log('warn', 'safeFetch', `Attempt ${attempt + 1}/${retries} failed, retrying in ${delay}ms`, {
        url,
        error: lastError.message,
      })

      onRetry?.(attempt + 1, lastError, delay)

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // TypeScript no debería llegar aquí, pero por si acaso
  throw lastError || new Error('Unreachable: safeFetch completed without returning')
}

/**
 * Safe fetch wrapper específico para Supabase REST API
 */
export async function safeSupabaseFetch<T>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<T> {
  return safeFetch<T>(url, {
    ...options,
    retries: options.retries ?? 2,
    baseDelay: options.baseDelay ?? 2000,
    onRetry: (attempt, error, delay) => {
      log('warn', 'safeSupabaseFetch', `Supabase retry ${attempt}`, {
        url,
        error: error.message,
        delay,
      })
    },
  })
}

export default safeFetch