// Placeholder para Sentry - implementación futura
// Por ahora solo usa el sistema de error reporting local en errorReporting.ts

let sentryInitialized = false;

export async function initSentry(): Promise<void> {
  if (sentryInitialized) {
    return;
  }
  
  console.log('[Sentry] Placeholder - Sentry será implementado cuando se configure DSN');
  sentryInitialized = true;
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  console.error('[Sentry Placeholder] Error capturado (usar errorReporting.ts):', error);
}

export function captureMessage(message: string, level: string = 'info', context?: Record<string, unknown>): void {
  console.log(`[Sentry Placeholder] Mensaje: ${message}`);
}

export function setUser(user: { id: string; email?: string; username?: string }): void {
  console.log('[Sentry Placeholder] Usuario:', user);
}

export function clearUser(): void {
  console.log('[Sentry Placeholder] Usuario limpiado');
}

export function addBreadcrumb(breadcrumb: any): void {
  console.log('[Sentry Placeholder] Breadcrumb:', breadcrumb);
}

export function startTransaction(name: string, op: string): any {
  console.log('[Sentry Placeholder] Transaction:', name, op);
  return undefined;
}

export function isSentryInitialized(): boolean {
  return sentryInitialized;
}