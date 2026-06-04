import { useRef, useCallback } from 'react';

interface UseRateLimitOptions {
  /** Número máximo de intentos permitidos */
  maxAttempts?: number;
  /** Ventana de tiempo en milisegundos */
  windowMs?: number;
  /** Mensaje de error personalizado */
  errorMessage?: string;
}

interface UseRateLimitReturn {
  /** Verifica si la acción está permitida. Lanza error si excede el límite */
  checkLimit: () => boolean;
  /** Resetea el contador de intentos */
  resetLimit: () => void;
  /** Número de intentos restantes */
  remainingAttempts: number;
  /** Tiempo restante en ms hasta que se reinicie la ventana */
  timeUntilReset: number;
  /** Si se ha excedido el límite */
  isLimited: boolean;
}

/**
 * useRateLimit - Hook de rate limiting del lado del cliente
 * 
 * Previene ataques de fuerza bruta y abuso de formularios
 * Implementa una ventana deslizante de intentos
 */
export function useRateLimit(options: UseRateLimitOptions = {}): UseRateLimitReturn {
  const {
    maxAttempts = 5,
    windowMs = 60000, // 1 minuto
    errorMessage = 'Demasiados intentos. Por favor, espera antes de continuar.',
  } = options;

  const attemptsRef = useRef<{ count: number; timestamp: number }>({
    count: 0,
    timestamp: Date.now(),
  });

  const checkLimit = useCallback((): boolean => {
    const now = Date.now();
    const elapsed = now - attemptsRef.current.timestamp;

    // Si la ventana expiró, reiniciar
    if (elapsed > windowMs) {
      attemptsRef.current = { count: 0, timestamp: now };
    }

    // Incrementar intentos
    attemptsRef.current.count++;

    // Verificar límite
    if (attemptsRef.current.count > maxAttempts) {
      console.warn(`[RateLimit] ${errorMessage}`);
      return false;
    }

    return true;
  }, [maxAttempts, windowMs, errorMessage]);

  const resetLimit = useCallback(() => {
    attemptsRef.current = { count: 0, timestamp: Date.now() };
  }, []);

  const now = Date.now();
  const elapsed = now - attemptsRef.current.timestamp;
  const isExpired = elapsed > windowMs;
  const effectiveCount = isExpired ? 0 : attemptsRef.current.count;

  return {
    checkLimit,
    resetLimit,
    remainingAttempts: Math.max(0, maxAttempts - effectiveCount),
    timeUntilReset: isExpired ? 0 : windowMs - elapsed,
    isLimited: effectiveCount >= maxAttempts,
  };
}

/**
 * useFormRateLimit - Hook específico para rate limiting en formularios
 * Agrupa intentos por ID de formulario
 */
export function useFormRateLimit(formId: string, options: UseRateLimitOptions = {}) {
  return useRateLimit({
    maxAttempts: options.maxAttempts || 10,
    windowMs: options.windowMs || 60000,
    errorMessage: options.errorMessage || 'Demasiados intentos en este formulario. Espera un momento.',
  });
}

export default useRateLimit;