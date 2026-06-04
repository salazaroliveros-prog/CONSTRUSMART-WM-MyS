/**
 * Módulo de auditoría de seguridad en tiempo real
 * 
 * Monitorea operaciones sospechosas y registra eventos de seguridad
 * para detección temprana de ataques o abusos.
 */

const SECURITY_LOG_KEY = 'wm_security_events';
const MAX_SECURITY_EVENTS = 100;

export type SecurityEventType = 
  | 'access_denied'
  | 'rate_limit_exceeded'
  | 'invalid_input_detected'
  | 'suspicious_operation'
  | 'auth_failure'
  | 'storage_quota_exceeded'
  | 'xss_attempt_blocked'
  | 'session_expired'
  | 'unauthorized_delete'
  | 'data_integrity_violation';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, unknown>;
  userId?: string;
  url?: string;
}

/**
 * Registra un evento de seguridad en localStorage y consola
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'url'>): void {
  const securityEvent: SecurityEvent = {
    ...event,
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  // Log a consola con nivel de severidad
  const logFn = event.severity === 'critical' || event.severity === 'high' 
    ? console.error 
    : event.severity === 'medium' 
      ? console.warn 
      : console.info;
  
  logFn(`[SECURITY:${event.severity.toUpperCase()}] ${event.message}`, event.details || '');

  // Persistir en localStorage
  try {
    const stored: SecurityEvent[] = JSON.parse(localStorage.getItem(SECURITY_LOG_KEY) || '[]');
    stored.push(securityEvent);
    if (stored.length > MAX_SECURITY_EVENTS) stored.splice(0, stored.length - MAX_SECURITY_EVENTS);
    localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(stored));
  } catch {
    console.warn('[SecurityAudit] No se pudo persistir evento de seguridad');
  }
}

/**
 * Obtiene el historial de eventos de seguridad
 */
export function getSecurityEvents(): SecurityEvent[] {
  try {
    return JSON.parse(localStorage.getItem(SECURITY_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Valida que un valor no contenga intentos de inyección
 */
export function detectInjection(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  const patterns = [
    /<script[\s>]/i,
    /javascript\s*:/i,
    /on\w+\s*=\s*['"]/i,
    /data\s*:\s*text\/html/i,
    /--\s*$/m,
    /'\s*OR\s*['"]/i,
    /'\s*--\s*/i,
    /\/\*!\s*\w+/i,
  ];

  return patterns.some(pattern => pattern.test(value));
}

/**
 * Valida la integridad de un objeto contra schemas esperados
 */
export function validateDataIntegrity<T extends Record<string, unknown>>(
  data: T,
  schema: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, expectedType] of Object.entries(schema)) {
    const value = data[key];
    
    if (value === null || value === undefined) {
      errors.push(`Campo '${key}': valor nulo o indefinido`);
      continue;
    }

    if (expectedType === 'array' && !Array.isArray(value)) {
      errors.push(`Campo '${key}': se esperaba un array, se recibió ${typeof value}`);
    } else if (expectedType !== 'array' && typeof value !== expectedType) {
      errors.push(`Campo '${key}': se esperaba ${expectedType}, se recibió ${typeof value}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  logSecurityEvent,
  getSecurityEvents,
  detectInjection,
  validateDataIntegrity,
};