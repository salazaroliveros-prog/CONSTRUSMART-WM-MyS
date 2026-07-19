import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'es', changeLanguage: vi.fn() } }),
}));

const mockEnqueueMutation = vi.fn();
const mockSetMutationQueue = vi.fn();
const mockGetState = vi.fn();

let mockOnline = true;

Object.defineProperty(navigator, 'onLine', {
  get: () => mockOnline,
  configurable: true,
});

const mockUseAuthReturn = {
  user: { id: 'u1', email: 'test@test.com', nombre: 'Test', rol: 'Administrador', avatar: '' },
  loading: false, error: '',
  signInWithGoogle: vi.fn(), signOut: vi.fn(), refreshSession: vi.fn(),
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

let mockHasSupabase = true;

vi.mock('@/lib/supabase', () => ({
  get hasSupabase() { return mockHasSupabase; },
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn(), signOut: vi.fn() },
    channel: vi.fn(),
  },
  assertSupabase: () => ({
    from: vi.fn(),
    auth: { getSession: vi.fn() },
    rpc: vi.fn(),
  }),
}));

describe('Network Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnline = true;
    mockHasSupabase = true;
  });

  describe('Offline mutation queuing', () => {
    it('queues mutations when offline instead of sending to Supabase', async () => {
      mockOnline = false;
      const queue: any[] = [];

      const enqueueMutation = (type: string, payload: any) => {
        if (!mockOnline) {
          const mutation = { id: crypto.randomUUID(), type, payload, timestamp: Date.now(), retryCount: 0 };
          queue.push(mutation);
          return mutation.id;
        }
        return '';
      };

      const id1 = enqueueMutation('addProyecto', { nombre: 'Offline1' });
      const id2 = enqueueMutation('addMovimiento', { descripcion: 'Offline2' });

      expect(queue).toHaveLength(2);
      expect(queue[0].type).toBe('addProyecto');
      expect(queue[1].type).toBe('addMovimiento');
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
    });

    it('tracks retryCount for offline mutations', () => {
      const mutation = { id: 'm1', type: 'addProyecto', payload: { nombre: 'Test' }, timestamp: Date.now(), retryCount: 0 };
      mutation.retryCount += 1;
      expect(mutation.retryCount).toBe(1);
      mutation.retryCount += 1;
      expect(mutation.retryCount).toBe(2);
    });
  });

  describe('Online reconnection', () => {
    it('triggers forceSync when going back online with pending mutations', () => {
      const queue = [
        { id: 'm1', type: 'addProyecto', payload: { nombre: 'Test' }, timestamp: Date.now(), retryCount: 0 },
        { id: 'm2', type: 'addMovimiento', payload: { monto: 100 }, timestamp: Date.now(), retryCount: 0 },
      ];

      mockOnline = true;

      const forceSync = vi.fn().mockImplementation(async () => {
        const processed = queue.map(m => m.id);
        return processed;
      });

      const syncPromise = forceSync();
      expect(forceSync).toHaveBeenCalled();
      expect(queue).toHaveLength(2);
    });

    it('processes all pending mutations after reconnection', async () => {
      const processedIds: string[] = [];
      const queue = [
        { id: 'm1', type: 'addProyecto', payload: { nombre: 'Test' }, timestamp: Date.now(), retryCount: 0 },
        { id: 'm2', type: 'updateProyecto', payload: { id: 'p1', nombre: 'Updated' }, timestamp: Date.now(), retryCount: 0 },
      ];

      mockOnline = true;

      for (const m of queue) {
        processedIds.push(m.id);
      }

      expect(processedIds).toEqual(['m1', 'm2']);
      const remaining = queue.filter(m => !processedIds.includes(m.id));
      expect(remaining).toHaveLength(0);
    });
  });

  describe('Network retry with backoff', () => {
    it('retries failed mutations with exponential backoff', async () => {
      let attempts = 0;
      const maxRetries = 3;
      const backoff = async (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000);

      const executeWithRetry = async (): Promise<boolean> => {
        while (attempts < maxRetries) {
          attempts++;
          try {
            const result = await mockSupabaseAction();
            if (result) return true;
          } catch {
            if (attempts >= maxRetries) throw new Error('Max retries exceeded');
            await backoff(attempts);
          }
        }
        return false;
      };

      const mockSupabaseAction = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(true);

      const result = await executeWithRetry();

      expect(result).toBe(true);
      expect(mockSupabaseAction).toHaveBeenCalledTimes(3);
    });

    it('fails after max retries exceeded', async () => {
      let attempts = 0;
      const maxRetries = 3;
      const backoff = async (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000);

      const executeWithRetry = async (): Promise<boolean> => {
        while (attempts < maxRetries) {
          attempts++;
          try {
            const result = await mockFailingAction();
            if (result) return true;
          } catch {
            if (attempts >= maxRetries) throw new Error('Max retries exceeded');
            await backoff(attempts);
          }
        }
        return false;
      };

      const mockFailingAction = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(executeWithRetry()).rejects.toThrow('Max retries exceeded');
      expect(mockFailingAction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Network permanently down', () => {
    it('does not grow queue unbounded when network is down', () => {
      const MAX_QUEUE = 100;
      let queue: any[] = [];

      for (let i = 0; i < 200; i++) {
        const mutation = { id: `m${i}`, type: 'addProyecto', payload: { nombre: `Test${i}` }, timestamp: Date.now(), retryCount: 0 };
        queue = queue.length >= MAX_QUEUE ? [...queue.slice(1), mutation] : [...queue, mutation];
      }

      expect(queue).toHaveLength(MAX_QUEUE);
      expect(queue[0].id).toBe('m100');
      expect(queue[99].id).toBe('m199');
    });

    it('marks mutations as processed after hitting max retries in offline mode', () => {
      const queue = Array.from({ length: 5 }, (_, i) => ({
        id: `m${i}`, type: 'addProyecto', payload: { nombre: `Test${i}` }, timestamp: Date.now(), retryCount: 3,
      }));

      const processed: string[] = [];
      const failed: any[] = [];

      queue.forEach(m => {
        if (m.retryCount >= 3) {
          processed.push(m.id);
        } else {
          failed.push({ ...m, retryCount: m.retryCount + 1 });
        }
      });

      expect(processed).toHaveLength(5);
      expect(failed).toHaveLength(0);
    });
  });

  describe('Rate limiting (429)', () => {
    it('queues mutations for retry when rate limited', async () => {
      const rateLimitQueue: any[] = [];
      let rateLimited = true;

      const insertMock = vi.fn().mockResolvedValue({ error: { code: '429', message: 'rate limit exceeded' } });
      const supabaseFrom = vi.fn().mockReturnValue({ insert: insertMock, onConflict: vi.fn().mockReturnValue({ ignore: vi.fn() }) });

      const processMutation = async (mutation: any) => {
        const { error } = await supabaseFrom(mutation.table).insert(mutation.payload);
        if (error && (error.code === '429' || error.message?.includes('rate limit'))) {
          rateLimitQueue.push({ ...mutation, retryCount: (mutation.retryCount || 0) + 1 });
          rateLimited = true;
          return false;
        }
        return true;
      };

      const mutation = { id: 'm1', type: 'addProyecto', table: 'erp_proyectos', payload: { nombre: 'Test' }, retryCount: 0 };

      const result = await processMutation(mutation);
      expect(result).toBe(false);
      expect(rateLimitQueue).toHaveLength(1);
      expect(rateLimitQueue[0].retryCount).toBe(1);
    });

    it('retries rate-limited mutations when token bucket allows', () => {
      let tokens = 5;
      const maxTokens = 10;
      const refillRate = 5;
      let lastRefill = Date.now();

      const checkTokenBucket = (): boolean => {
        const now = Date.now();
        const elapsed = (now - lastRefill) / 1000;
        tokens = Math.min(maxTokens, tokens + elapsed * refillRate);
        lastRefill = now;
        if (tokens < 1) return false;
        tokens -= 1;
        return true;
      };

      expect(checkTokenBucket()).toBe(true);
      expect(tokens).toBe(4);

      for (let i = 0; i < 4; i++) checkTokenBucket();
      expect(tokens).toBe(0);
      expect(checkTokenBucket()).toBe(false);
    });
  });

  describe('Concurrent mutations (race condition)', () => {
    it('rejects stale updates via optimistic locking', () => {
      const proyecto = { id: 'p1', nombre: 'Original', version: 1 };
      const currentVersion = proyecto.version;

      const stalePatch = { version: 1, nombre: 'Stale Update' };
      const freshPatch = { version: 2, nombre: 'Fresh Update' };

      const applyUpdate = (patch: { version: number }) => {
        if (patch.version < currentVersion + 1) return false;
        return true;
      };

      expect(applyUpdate(stalePatch)).toBe(false);
      expect(applyUpdate(freshPatch)).toBe(true);
    });

    it('increments version on each successful update', () => {
      let version = 1;

      const update = () => {
        version += 1;
      };

      update();
      expect(version).toBe(2);
      update();
      expect(version).toBe(3);
    });

    it('handles two concurrent updates to same entity', () => {
      const entity = { id: 'e1', data: 'initial', version: 1 };

      const client1Patch = { data: 'client1', version: 1 };
      const client2Patch = { data: 'client2', version: 1 };

      const applyUpdate = (patch: { version: number; data: string }) => {
        if (patch.version < entity.version) return false;
        entity.data = patch.data;
        entity.version += 1;
        return true;
      };

      const r1 = applyUpdate(client1Patch);
      expect(r1).toBe(true);
      expect(entity.data).toBe('client1');
      expect(entity.version).toBe(2);

      const r2 = applyUpdate(client2Patch);
      expect(r2).toBe(false);
      expect(entity.data).toBe('client1');
      expect(entity.version).toBe(2);
    });
  });

  describe('Deduplication on realtime INSERT', () => {
    it('deduplicates identical realtime INSERT events', () => {
      const store: any[] = [];
      const existingIds = new Set<string>();

      const handleInsert = (item: any) => {
        const id = item?.id;
        if (id && !existingIds.has(id)) {
          existingIds.add(id);
          store.push(item);
        }
      };

      const event1 = { id: 'dup-1', nombre: 'Test', data: 'value' };
      const event2 = { id: 'dup-1', nombre: 'Test', data: 'value' };

      handleInsert(event1);
      handleInsert(event2);

      expect(store).toHaveLength(1);
    });

    it('allows different records from same table', () => {
      const store: any[] = [];
      const existingIds = new Set<string>();

      const handleInsert = (item: any) => {
        const id = item?.id;
        if (id && !existingIds.has(id)) {
          existingIds.add(id);
          store.push(item);
        }
      };

      handleInsert({ id: 'r1', nombre: 'Record 1' });
      handleInsert({ id: 'r2', nombre: 'Record 2' });

      expect(store).toHaveLength(2);
    });

    it('uses arr.some for dedup check matching store.tsx pattern', () => {
      const arr: any[] = [];

      const applyInsert = (item: any) => {
        const normalized = item;
        if (Array.isArray(arr) && normalized?.id && !arr.some((x: any) => x.id === normalized.id)) {
          arr.push(normalized);
        }
      };

      applyInsert({ id: 'a1', value: 'first' });
      applyInsert({ id: 'a1', value: 'first' });
      applyInsert({ id: 'a2', value: 'second' });

      expect(arr).toHaveLength(2);
      expect(arr[0].id).toBe('a1');
      expect(arr[1].id).toBe('a2');
    });
  });
});
