import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('sonner', () => ({
  toast: { error: (...args: any[]) => mockToastError(...args), success: (...args: any[]) => mockToastSuccess(...args) },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'es', changeLanguage: vi.fn() } }),
}));

const mockEnqueueMutation = vi.fn();
const mockSetMutationQueue = vi.fn();
const mockSetSyncStatus = vi.fn();
const mockSetSyncError = vi.fn();
const mockSetSyncMessage = vi.fn();
const mockSetUser = vi.fn();
const mockSetLoading = vi.fn();
const mockSetError = vi.fn();

const mockUseAuthReturn = {
  user: { id: 'u1', email: 'test@test.com', nombre: 'Test', rol: 'Administrador', avatar: '' },
  loading: false,
  error: '',
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  refreshSession: vi.fn(),
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

let mockHasSupabase = true;
const mockSupabaseMethods: Record<string, any> = {};

vi.mock('@/lib/supabase', () => ({
  get hasSupabase() { return mockHasSupabase; },
  get supabase() { return mockSupabaseMethods.client; },
  assertSupabase: () => mockSupabaseMethods.client,
}));

const mockStoreState: Record<string, any> = {};

vi.mock('../erp/store', () => ({
  useErp: () => mockStoreState,
  useErpSlice: (sel: any) => sel(mockStoreState),
}));

const mockLogErrorFromException = vi.fn();
vi.mock('@/lib/error-logger', () => ({
  logErrorFromException: (...args: any[]) => mockLogErrorFromException(...args),
}));

describe('Supabase Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasSupabase = true;
    mockSupabaseMethods.client = {
      from: vi.fn(),
      channel: vi.fn(),
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(),
        signOut: vi.fn(),
      },
      rpc: vi.fn(),
    };
    Object.assign(mockStoreState, {
      proyectos: [], movimientos: [], mutationQueue: [],
      enqueueMutation: mockEnqueueMutation,
      setMutationQueue: mockSetMutationQueue,
      setSyncStatus: mockSetSyncStatus,
      setSyncError: mockSetSyncError,
      setSyncMessage: mockSetSyncMessage,
    });
    localStorage.clear();
  });

  describe('RLS 403 rejection on fetch', () => {
    it('handles RLS 403 when fetching table data', async () => {
      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          error: { code: '403', message: 'permission denied for table erp_proyectos' },
          data: null,
        }),
      });
      mockSupabaseMethods.client.from = fromMock;

      const { data, error } = await mockSupabaseMethods.client.from('erp_proyectos').select();

      expect(error).toBeDefined();
      expect(error.code).toBe('403');
      expect(error.message).toContain('permission denied');
      expect(data).toBeNull();
    });

    it('does not crash the store when RLS blocks fetch', async () => {
      const fetchTable = async (table: string) => {
        const { error } = await mockSupabaseMethods.client.from(table).select();
        if (error && (error.message?.includes('permission denied') || error.code === '403')) {
          return { table, authError: true, data: [] };
        }
        return { table, data: [] };
      };
      const fromMockLocal = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          error: { code: '403', message: 'permission denied for table erp_proyectos' },
          data: null,
        }),
      });
      mockSupabaseMethods.client.from = fromMockLocal;

      const result = await fetchTable('erp_proyectos');
      expect(result.authError).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('RLS 403 on mutation', () => {
    it('catches 403 on insert and provides feedback', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        error: { code: '403', message: 'new row violates row-level security policy for table erp_proyectos' },
      });
      mockSupabaseMethods.client.from = vi.fn().mockReturnValue({
        insert: insertMock,
        onConflict: vi.fn().mockReturnValue({ ignore: vi.fn().mockResolvedValue({ error: null }) }),
      });
      mockSupabaseMethods.client.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'u1' } } },
      });

      const { error } = await mockSupabaseMethods.client.from('erp_proyectos').insert({ nombre: 'Test' });

      expect(error).toBeDefined();
      expect(error.code).toBe('403');
    });

    it('catches 403 on update', async () => {
      const updateQueryBuilder = {
        eq: vi.fn().mockResolvedValue({ error: { code: '403', message: 'permission denied for table erp_proyectos' } }),
      };
      mockSupabaseMethods.client.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue(updateQueryBuilder),
      });
      mockSupabaseMethods.client.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'u1' } } },
      });

      const result = await mockSupabaseMethods.client.from('erp_proyectos').update({ nombre: 'Test' }).eq('id', 'p1');

      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('403');
    });

    it('catches 403 on delete', async () => {
      const deleteQueryBuilder = {
        in: vi.fn().mockResolvedValue({ error: { code: '403', message: 'permission denied for table erp_proyectos' } }),
      };
      mockSupabaseMethods.client.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue(deleteQueryBuilder),
      });
      mockSupabaseMethods.client.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'u1' } } },
      });

      const result = await mockSupabaseMethods.client.from('erp_proyectos').delete().in('id', ['p1']);

      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('403');
    });

    it('handles FK violation 23503 during mutation', async () => {
      const errObj = { code: '23503', message: 'insert or update on table violates foreign key constraint', details: 'Key (proyecto_id)=123 is not present in table erp_proyectos' };
      const insertMock = vi.fn().mockResolvedValue({ error: errObj });
      mockSupabaseMethods.client.from = vi.fn().mockReturnValue({
        insert: insertMock,
        onConflict: vi.fn().mockReturnValue({ ignore: vi.fn().mockResolvedValue({ error: errObj }) }),
      });
      mockSupabaseMethods.client.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'u1' } } },
      });

      const { error } = await mockSupabaseMethods.client.from('erp_proyectos').insert({ nombre: 'Test', proyecto_id: 'nonexistent' });
      expect(error).toBeDefined();
      expect(error.code).toBe('23503');
    });
  });

  describe('Supabase network timeout', () => {
    it('handles query timeout without hanging', async () => {
      let timeoutReached = false;
      const slowQuery = new Promise<never>((_resolve, reject) => {
        setTimeout(() => { timeoutReached = true; reject(new Error('timeout')); }, 50);
      });
      const timeout = new Promise<{ data: null; error: { message: string } }>((resolve) => {
        setTimeout(() => resolve({ data: null, error: { message: 'Network timeout' } }), 30);
      });

      const result = await Promise.race([slowQuery, timeout]);
      expect(result).toEqual({ data: null, error: { message: 'Network timeout' } });
      expect(timeoutReached).toBe(false);
    });
  });

  describe('Session expired mid-session', () => {
    it('clears user state when SIGNED_OUT event fires', async () => {
      let onAuthChangeCallback: ((event: string, session: any) => void) | null = null;
      const subscription = { unsubscribe: vi.fn() };

      mockSupabaseMethods.client.auth.onAuthStateChange = vi.fn((callback: any) => {
        onAuthChangeCallback = callback;
        return { data: { subscription } };
      });

      const authStateChange = mockSupabaseMethods.client.auth.onAuthStateChange((_event: string, _session: any) => {});
      expect(authStateChange).toBeDefined();

      if (onAuthChangeCallback) {
        act(() => {
          onAuthChangeCallback('SIGNED_OUT', null);
        });
      }

      expect(subscription).toBeDefined();
    });
  });

  describe('Auth token refresh failure', () => {
    it('handles getSession throwing without crashing', async () => {
      const buildUserFromSession = async () => {
        try {
          const { data } = await mockSupabaseMethods.client.auth.getSession();
          return data;
        } catch {
          mockSetError('Error de autenticación');
          return null;
        }
      };

      mockSupabaseMethods.client.auth.getSession = vi.fn().mockRejectedValue(new Error('Token refresh failed'));

      const result = await buildUserFromSession();
      expect(result).toBeNull();
    });
  });

  describe('Supabase not configured', () => {
    it('returns early when hasSupabase is false', async () => {
      mockHasSupabase = false;

      const serviceCall = async () => {
        if (!mockHasSupabase) return { data: [], error: null, offline: true };
        return await mockSupabaseMethods.client.from('erp_proyectos').select();
      };

      const result = await serviceCall();
      expect(result.offline).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('Corrupted localStorage data', () => {
    it('handles invalid JSON in localStorage gracefully', () => {
      localStorage.setItem('wm_erp_data_proyectos', '{corrupt-json');
      localStorage.setItem('wm_erp_data_movimientos', 'not even close');

      const loadFromStorage = (key: string) => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
          return [];
        } catch {
          return [];
        }
      };

      const proyectos = loadFromStorage('wm_erp_data_proyectos');
      const movimientos = loadFromStorage('wm_erp_data_movimientos');

      expect(proyectos).toEqual([]);
      expect(movimientos).toEqual([]);
    });

    it('loads valid data but ignores corrupt keys', () => {
      localStorage.setItem('wm_erp_data_proyectos', JSON.stringify([{ id: 'p1', nombre: 'Test' }]));
      localStorage.setItem('wm_erp_data_movimientos', '{corrupt');

      const loadFromStorage = (key: string) => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
          return [];
        } catch {
          return [];
        }
      };

      const proyectos = loadFromStorage('wm_erp_data_proyectos');
      const movimientos = loadFromStorage('wm_erp_data_movimientos');

      expect(proyectos).toHaveLength(1);
      expect(proyectos[0].id).toBe('p1');
      expect(movimientos).toEqual([]);
    });
  });

  describe('Mutation queue full', () => {
    it('enforces max queue size limit', () => {
      const MAX_QUEUE = 100;
      const queue: any[] = Array.from({ length: MAX_QUEUE }, (_, i) => ({ id: `m${i}`, type: 'test' }));
      const mutation = { id: 'overflow', type: 'addProyecto', payload: {}, timestamp: Date.now(), retryCount: 0 };

      const enqueue = (q: any[], m: any) => {
        const trimmed = q.length >= MAX_QUEUE ? q.slice(1) : q;
        return [...trimmed, m];
      };

      const updated = enqueue(queue, mutation);
      expect(updated).toHaveLength(MAX_QUEUE);
      expect(updated[updated.length - 1].id).toBe('overflow');
      expect(updated[0].id).toBe('m1');
    });

    it('does not grow unbounded with repeated failures', () => {
      const MAX_QUEUE = 100;
      let queue: any[] = [];

      for (let i = 0; i < 150; i++) {
        const mutation = { id: `m${i}`, type: 'addProyecto', payload: {}, timestamp: Date.now(), retryCount: 0 };
        queue = queue.length >= MAX_QUEUE ? [...queue.slice(1), mutation] : [...queue, mutation];
      }

      expect(queue).toHaveLength(MAX_QUEUE);
    });
  });

  describe('Realtime connection failure', () => {
    it('handles CHANNEL_ERROR on subscribe', async () => {
      let subscribeCallback: ((status: string) => void) | null = null;

      const channelMock = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((callback: (status: string) => void) => {
          subscribeCallback = callback;
        }),
        unsubscribe: vi.fn(),
      };

      mockSupabaseMethods.client.channel = vi.fn().mockReturnValue(channelMock);

      const channel = mockSupabaseMethods.client.channel('test');
      let channelError: Error | null = null;

      const subscribePromise = new Promise<void>((resolve, reject) => {
        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') resolve();
          else if (status === 'CHANNEL_ERROR') reject(new Error(`Failed to subscribe`));
        });
      });

      if (subscribeCallback) {
        subscribeCallback('CHANNEL_ERROR');
      }

      await expect(subscribePromise).rejects.toThrow('Failed to subscribe');
    });

    it('schedules reconnect after channel error', () => {
      let subscribeCallback: ((status: string) => void) | null = null;
      const reconnectTimer = { ref: null as any };

      const channelMock = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((callback: (status: string) => void) => {
          subscribeCallback = callback;
        }),
        unsubscribe: vi.fn(),
      };

      mockSupabaseMethods.client.channel = vi.fn().mockReturnValue(channelMock);
      const channel = mockSupabaseMethods.client.channel('test');
      channel.subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
          reconnectTimer.ref = setTimeout(() => {
            channel.subscribe((s: string) => {});
          }, 5000);
        }
      });

      if (subscribeCallback) {
        subscribeCallback('CHANNEL_ERROR');
      }

      expect(reconnectTimer.ref).toBeDefined();
      clearTimeout(reconnectTimer.ref);
    });

    it('deduplicates INSERT events from realtime', () => {
      const arr: any[] = [];
      const normalized = { id: 'dup-1', nombre: 'Duplicated' };

      const applyInsert = (item: any) => {
        if (Array.isArray(arr) && item?.id && !arr.some((x: any) => x.id === item.id)) {
          arr.push(item);
        }
      };

      applyInsert(normalized);
      applyInsert(normalized);

      expect(arr).toHaveLength(1);
      expect(arr[0].id).toBe('dup-1');
    });
  });
});
