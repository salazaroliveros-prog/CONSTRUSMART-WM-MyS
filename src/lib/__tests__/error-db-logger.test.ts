import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logError, resolveError, cleanupOldErrorsInDatabase } from '../error-logger';

const { mockRpc } = vi.hoisted(() => {
  return { mockRpc: vi.fn() };
});

vi.mock('../supabase', () => ({
  supabase: {
    rpc: mockRpc,
  },
}));

describe('Error Database Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logError', () => {
    it('debe llamar log_error RPC con parámetros correctos', async () => {
      mockRpc.mockResolvedValue({ data: 'error-123', error: null });

      const result = await logError({
        error_message: 'Test error',
        error_stack: 'stack trace',
        error_type: 'validation',
        severity: 'error',
        component: 'test-component',
        function_name: 'testFunction',
        context: { key: 'value' },
      });

      expect(mockRpc).toHaveBeenCalledWith('log_error', {
        p_error_message: 'Test error',
        p_error_code: null,
        p_error_stack: 'stack trace',
        p_error_type: 'validation',
        p_severity: 'error',
        p_component: 'test-component',
        p_function_name: 'testFunction',
        p_line_number: null,
        p_proyecto_id: null,
        p_request_id: null,
        p_request_method: null,
        p_request_path: null,
        p_request_params: null,
        p_request_headers: null,
        p_context: { key: 'value' },
      });
      expect(result).toBe('error-123');
    });

    it('debe usar valores por defecto cuando no se especifican', async () => {
      mockRpc.mockResolvedValue({ data: 'error-123', error: null });

      await logError({ error_message: 'Test error' });

      expect(mockRpc).toHaveBeenCalledWith('log_error', {
        p_error_message: 'Test error',
        p_error_code: null,
        p_error_stack: null,
        p_error_type: 'other',
        p_severity: 'error',
        p_component: null,
        p_function_name: null,
        p_line_number: null,
        p_proyecto_id: null,
        p_request_id: null,
        p_request_method: null,
        p_request_path: null,
        p_request_params: null,
        p_request_headers: null,
        p_context: null,
      });
    });

    it('debe retornar el error local cuando RPC falla', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('RPC failed') });

      const result = await logError({ error_message: 'Test error' });

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('resolveError', () => {
    it('debe llamar resolve_error RPC con parámetros correctos', async () => {
      mockRpc.mockResolvedValue({ data: true, error: null });

      await resolveError({ error_id: 'error-123', resolution_notes: 'Fixed it' });

      expect(mockRpc).toHaveBeenCalledWith('resolve_error', {
        p_error_id: 'error-123',
        p_resolution_notes: 'Fixed it',
      });
    });
  });

  describe('cleanupOldErrorsInDatabase', () => {
    it('debe llamar cleanup_old_error_logs RPC con parámetros correctos', async () => {
      mockRpc.mockResolvedValue({ data: 5, error: null });

      await cleanupOldErrorsInDatabase(90);

      expect(mockRpc).toHaveBeenCalledWith('cleanup_old_error_logs', {
        days_to_keep: 90,
      });
    });

    it('debe usar valor por defecto de 90 días', async () => {
      mockRpc.mockResolvedValue({ data: 5, error: null });

      await cleanupOldErrorsInDatabase();

      expect(mockRpc).toHaveBeenCalledWith('cleanup_old_error_logs', {
        days_to_keep: 90,
      });
    });
  });
});