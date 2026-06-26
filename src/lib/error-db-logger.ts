import { supabase } from './supabase';

export async function logErrorToDatabase(
  error: Error,
  context: {
    error_type?: string;
    severity?: 'error' | 'warning' | 'info';
    component?: string;
    function_name?: string;
    additional_context?: Record<string, any>;
  }
) {
  if (!supabase) return null;

  const { data, error: rpcError } = await supabase.rpc('log_error', {
    p_error_type: context.error_type || 'unknown',
    p_error_message: error.message,
    p_severity: context.severity || 'error',
    p_component: context.component,
    p_function_name: context.function_name,
    p_stack_trace: error.stack,
    p_additional_context: context.additional_context,
  });

  if (rpcError) {
    console.error('[ErrorDBLogger] Failed to log to database:', rpcError);
    return null;
  }

  return data;
}

export async function resolveErrorInDatabase(id: string, notes?: string) {
  if (!supabase) return;

  const { error } = await supabase.rpc('resolve_error', {
    p_error_id: id,
    p_resolution_notes: notes,
  });

  if (error) {
    console.error('[ErrorDBLogger] Failed to resolve error:', error);
    throw error;
  }
}

export async function cleanupOldErrorsInDatabase(daysOld = 30) {
  if (!supabase) return;

  const { error } = await supabase.rpc('cleanup_old_error_logs', {
    p_days_old: daysOld,
  });

  if (error) {
    console.error('[ErrorDBLogger] Failed to cleanup errors:', error);
    throw error;
  }
}
