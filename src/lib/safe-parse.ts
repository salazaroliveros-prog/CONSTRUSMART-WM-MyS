import { z } from 'zod'
import { log } from './auto-logger'

/**
 * SafeParse — Wrapper de Zod con fallback automático
 * 
 * Características:
 * - Valida datos runtime con Zod
 * - Si falla, retorna un fallback en lugar de tirar error
 * - Registra warnings de validación en auto-logger
 * - Tipado completo: infiere T del schema
 * - Útil para: respuestas API, inputs de formularios, datos de localStorage
 * 
 * @example
 * const user = safeParse(userSchema, apiResponse, defaultUser)
 * // Si apiResponse es inválido → retorna defaultUser, loggea warning
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T,
  context?: string
): T {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return result.data
  }

  const ctx = context || 'safeParse'

  // Extraer issues de forma segura
  const issues = result.error?.issues?.map(i => ({
    path: i.path.join('.'),
    message: i.message,
    code: i.code,
  })) || []

  log('warn', ctx, `Validation failed — using fallback`, {
    issues,
    dataType: typeof data,
    isArray: Array.isArray(data),
    isNull: data === null,
    isUndefined: data === undefined,
  })

  // En desarrollo, mostrar más detalle
  if (import.meta.env.DEV) {
    console.groupCollapsed(`[safeParse] Validation error in "${ctx}"`)
    console.warn('Issues:', issues)
    console.warn('Received:', data)
    console.warn('Fallback:', fallback)
    console.groupEnd()
  }

  return fallback
}

/**
 * SafeParseArray — Valida un array completo, filtrando items inválidos
 * Útil para respuestas de API que deben ser arrays
 * 
 * @example
 * const users = safeParseArray(userSchema, apiResponse, [])
 * // Items inválidos se filtran, se loggean, el resto se conserva
 */
export function safeParseArray<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T[] = [],
  context?: string
): T[] {
  if (!Array.isArray(data)) {
    log('warn', context || 'safeParseArray', 'Expected array, received non-array', {
      receivedType: typeof data,
    })
    return fallback
  }

  const ctx = context || 'safeParseArray'
  const validItems: T[] = []
  const invalidIndices: number[] = []

  data.forEach((item, index) => {
    const result = schema.safeParse(item)
    if (result.success) {
      validItems.push(result.data)
    } else {
      invalidIndices.push(index)
    }
  })

  if (invalidIndices.length > 0) {
    log('warn', ctx, `${invalidIndices.length}/${data.length} items failed validation`, {
      invalidIndices,
      totalItems: data.length,
      validItems: validItems.length,
    })
  }

  return validItems.length > 0 ? validItems : fallback
}

/**
 * Validación estricta: Lanza error si la validación falla
 * Útil para datos críticos donde no se acepta fallback
 */
export function strictParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return result.data
  }

  const ctx = context || 'strictParse'
  const message = `[${ctx}] Strict validation failed: ${result.error?.issues?.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`

  log('error', ctx, 'Strict validation failed', {
    issues: result.error?.issues,
    data,
  })

  throw new Error(message)
}

export default safeParse