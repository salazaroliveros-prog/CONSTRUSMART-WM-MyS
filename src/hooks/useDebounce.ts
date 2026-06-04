import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDebounceOptions {
  /** Tiempo de espera en ms (default: 300) */
  delay?: number;
  /** Llamar inmediatamente al primer cambio */
  immediate?: boolean;
  /** Función a ejecutar después del debounce */
  fn?: (...args: unknown[]) => void;
}

/**
 * useDebounce - Hook para debounce de valores
 * Útil para búsquedas, filtros, y cualquier campo que dispare llamadas API
 * 
 * Previene llamadas excesivas a la base de datos y mejora rendimiento
 */
export function useDebounce<T>(value: T, options: UseDebounceOptions = {}): T {
  const { delay = 300, immediate = false } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (immediate) {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, immediate]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - Hook para debounce de funciones
 * Útil para evitar múltiples ejecuciones de una función (ej: submit)
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFn = useCallback(
    (...args: unknown[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as unknown as T;

  return debouncedFn;
}

/**
 * useDebouncedSearch - Hook específico para búsquedas con debounce
 * Ideal para inputs de búsqueda en tablas y listas
 */
export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 400
): [string, string, (value: string) => void] {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearch = useDebounce(searchTerm, { delay });

  return [searchTerm, debouncedSearch, setSearchTerm];
}

export default useDebounce;