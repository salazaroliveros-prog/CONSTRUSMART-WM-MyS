import { supabase } from './supabase';

const ERROR_QUEUE_KEY = 'erp_error_queue';

export interface ErrorLogInput {
  error_message: string;
  error_code?: string;
  error_stack?: string;
  error_type?: 'client' | 'server' | 'database' | 'network' | 'validation' | 'auth' | 'permission' | 'other';
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  component?: string;
  function_name?: string;
  line_number?: number;
  proyecto_id?: string;
  request_id?: string;
  request_method?: string;
  request_path?: string;
  request_params?: Record<string, unknown>;
  request_headers?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface ErrorResolveInput {
  error_id: string;
  resolution_notes?: string;
}

interface PendingError {
  id: string;
  input: ErrorLogInput;
  timestamp: number;
}

function getErrorQueue(): PendingError[] {
  try {
    const raw = localStorage.getItem(ERROR_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveErrorQueue(queue: PendingError[]): void {
  try {
    localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    console.warn('[error-logger] No se pudo guardar la cola de errores en localStorage');
  }
}

export async function logError(input: ErrorLogInput): Promise<string | null> {
  const errorId = crypto.randomUUID?.() || Date.now().toString();

  const pending: PendingError = { id: errorId, input, timestamp: Date.now() };

  const queue = getErrorQueue();
  queue.push(pending);
  saveErrorQueue(queue);

  try {
    const { data, error } = await supabase.rpc('log_error', {
      p_error_message: input.error_message,
      p_error_code: input.error_code || null,
      p_error_stack: input.error_stack || null,
      p_error_type: input.error_type || 'other',
      p_severity: input.severity || 'error',
      p_component: input.component || null,
      p_function_name: input.function_name || null,
      p_line_number: input.line_number || null,
      p_proyecto_id: input.proyecto_id || null,
      p_request_id: input.request_id || null,
      p_request_method: input.request_method || null,
      p_request_path: input.request_path || null,
      p_request_params: input.request_params || null,
      p_request_headers: input.request_headers || null,
      p_context: input.context || null
    });

    if (!error) {
      const updated = getErrorQueue().filter(e => e.id !== errorId);
      saveErrorQueue(updated);
      return data as string;
    }

    return errorId;
  } catch {
    return errorId;
  }
}

export async function syncPendingErrors(): Promise<number> {
  const queue = getErrorQueue();
  if (queue.length === 0) return 0;

  let synced = 0;
  const remaining: PendingError[] = [];

  for (const pending of queue) {
    try {
      const { error } = await supabase.rpc('log_error', {
        p_error_message: pending.input.error_message,
        p_error_code: pending.input.error_code || null,
        p_error_stack: pending.input.error_stack || null,
        p_error_type: pending.input.error_type || 'other',
        p_severity: pending.input.severity || 'error',
        p_component: pending.input.component || null,
        p_function_name: pending.input.function_name || null,
        p_line_number: pending.input.line_number || null,
        p_proyecto_id: pending.input.proyecto_id || null,
        p_request_id: pending.input.request_id || null,
        p_request_method: pending.input.request_method || null,
        p_request_path: pending.input.request_path || null,
        p_request_params: pending.input.request_params || null,
        p_request_headers: pending.input.request_headers || null,
        p_context: pending.input.context || null
      });

      if (!error) synced++;
      else remaining.push(pending);
    } catch {
      remaining.push(pending);
    }
  }

  saveErrorQueue(remaining);
  return synced;
}

export async function resolveError(input: ErrorResolveInput): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('resolve_error', {
      p_error_id: input.error_id,
      p_resolution_notes: input.resolution_notes || null
    });

    if (error) {
      console.error('Failed to resolve error:', error);
      return false;
    }

    return data as boolean;
  } catch (e) {
    console.error('Exception in resolveError:', e);
    return false;
  }
}

export async function logErrorFromException(
  error: Error,
  context?: {
    component?: string;
    function_name?: string;
    proyecto_id?: string;
    severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
    error_type?: 'client' | 'server' | 'database' | 'network' | 'validation' | 'auth' | 'permission' | 'other';
    additional_context?: Record<string, unknown>;
  }
): Promise<string | null> {
  return logError({
    error_message: error.message,
    error_stack: error.stack,
    error_code: (error as any).code,
    error_type: context?.error_type || 'other',
    severity: context?.severity || 'error',
    component: context?.component,
    function_name: context?.function_name,
    proyecto_id: context?.proyecto_id,
    context: context?.additional_context
  });
}

export async function cleanupOldErrorsInDatabase(daysOld = 90): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_old_error_logs', {
      days_to_keep: daysOld,
    });

    if (error) {
      console.error('[ErrorLogger] Failed to cleanup errors:', error);
      return 0;
    }

    return (data as number) || 0;
  } catch (e) {
    console.error('[ErrorLogger] Exception in cleanupOldErrorsInDatabase:', e);
    return 0;
  }
}

export function getErrorContext(): {
  user_agent?: string;
  request_path?: string;
} {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    user_agent: navigator.userAgent,
    request_path: window.location.pathname
  };
}
