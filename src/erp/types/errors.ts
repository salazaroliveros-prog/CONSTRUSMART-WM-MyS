/**
 * Tipos compartidos de errores para el ERP CONSTRUSMART
 * Centraliza la gestión de errores de la aplicación
 */

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
  timestamp: number;
  source: 'supabase' | 'local' | 'network' | 'validation';
  table?: string;
  operation?: 'select' | 'insert' | 'update' | 'delete' | 'auth';
}

export type ErrorCode =
  | 'RLS_BLOCKED'
  | 'TABLE_NOT_FOUND'
  | 'COLUMN_MISSING'
  | 'NETWORK_OFFLINE'
  | 'AUTH_EXPIRED'
  | 'AUTH_NOT_AUTHENTICATED'
  | 'VALIDATION_FAILED'
  | 'STORAGE_FULL'
  | 'MUTATION_FAILED'
  | 'UNKNOWN';

/**
 * Mapea mensajes de error de Supabase a códigos internos
 */
export function classifyError(
  message: string,
  source: AppError['source'] = 'supabase',
  table?: string,
  operation?: AppError['operation']
): AppError {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('row level security') || lowerMsg.includes('permission denied')) {
    return { code: 'RLS_BLOCKED', message: 'Acceso denegado por políticas de seguridad', details: message, timestamp: Date.now(), source, table, operation };
  }
  if (lowerMsg.includes('does not exist') && lowerMsg.includes('table')) {
    return { code: 'TABLE_NOT_FOUND', message: `La tabla "${table ?? 'desconocida'}" no existe en la base de datos`, details: message, timestamp: Date.now(), source, table, operation };
  }
  if (lowerMsg.includes('column') && lowerMsg.includes('does not exist')) {
    return { code: 'COLUMN_MISSING', message: 'Columna no encontrada en la tabla', details: message, timestamp: Date.now(), source, table, operation };
  }
  if (lowerMsg.includes('network') || lowerMsg.includes('fetch') || lowerMsg.includes('failed to fetch')) {
    return { code: 'NETWORK_OFFLINE', message: 'Sin conexión a internet', details: message, timestamp: Date.now(), source: 'network', table, operation };
  }
  if (lowerMsg.includes('expired') || lowerMsg.includes('token')) {
    return { code: 'AUTH_EXPIRED', message: 'Sesión expirada. Inicia sesión nuevamente.', details: message, timestamp: Date.now(), source: 'supabase', table, operation };
  }
  if (lowerMsg.includes('not authenticated') || lowerMsg.includes('unauthorized')) {
    return { code: 'AUTH_NOT_AUTHENTICATED', message: 'No autenticado', details: message, timestamp: Date.now(), source: 'supabase', table, operation };
  }
  if (lowerMsg.includes('quota') || lowerMsg.includes('quotaexceedederror')) {
    return { code: 'STORAGE_FULL', message: 'Almacenamiento local lleno', details: message, timestamp: Date.now(), source: 'local', table, operation };
  }

  return { code: 'UNKNOWN', message: message || 'Error desconocido', details: message, timestamp: Date.now(), source, table, operation };
}

/**
 * Muestra un toast de error con el mensaje apropiado
 */
export function showError(error: AppError, toastFn?: (msg: string) => void): void {
  const fn = toastFn ?? ((msg: string) => console.error(msg));
  
  switch (error.code) {
    case 'RLS_BLOCKED':
      fn('Acceso denegado. Contacta al administrador para verificar los permisos.');
      break;
    case 'NETWORK_OFFLINE':
      fn('Sin conexión. Los cambios se sincronizarán cuando vuelva la conexión.');
      break;
    case 'AUTH_EXPIRED':
      fn('Sesión expirada. Por favor, inicia sesión nuevamente.');
      break;
    case 'STORAGE_FULL':
      fn('Almacenamiento lleno. Limpia la caché del navegador.');
      break;
    default:
      fn(error.message || 'Error al procesar la solicitud.');
  }
}