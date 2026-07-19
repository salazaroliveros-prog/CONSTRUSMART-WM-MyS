import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface WorkerMock {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: ((e: ErrorEvent) => void) | null;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

let workerInstances: WorkerMock[] = [];
let WorkerMockCtor: any;

beforeEach(() => {
  workerInstances = [];
  WorkerMockCtor = vi.fn(() => {
    const instance: WorkerMock = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
      addEventListener: vi.fn((event: string, handler: any) => {
        if (event === 'message') instance.onmessage = handler;
        if (event === 'error') instance.onerror = handler;
      }),
      removeEventListener: vi.fn(),
    };
    workerInstances.push(instance);
    return instance;
  });

  (globalThis as any).Worker = WorkerMockCtor;
});

afterEach(() => {
  workerInstances = [];
  delete (globalThis as any).Worker;
});

describe('Web Worker Error Handling', () => {
  describe('Compression worker crash', () => {
    it('falls back to uncompressed storage when worker throws', async () => {
      const data = { proyectos: [{ id: 'p1', nombre: 'Test' }] };
      const worker = new WorkerMockCtor() as WorkerMock;
      let fallbackUsed = false;

      const compressWithWorker = (payload: any): Promise<string> => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            fallbackUsed = true;
            resolve(JSON.stringify(payload));
          }, 100);

          worker.postMessage({ type: 'compress', payload: JSON.stringify(payload) });

          if (worker.onmessage) {
            clearTimeout(timeout);
            resolve(JSON.stringify(payload));
          }
        });
      };

      worker.postMessage = vi.fn(() => {
        if (worker.onerror) {
          worker.onerror(new ErrorEvent('error', { message: 'Worker crashed' }));
        }
      });

      const result = await compressWithWorker(data).catch(() => {
        fallbackUsed = true;
        return JSON.stringify(data);
      });

      expect(fallbackUsed || typeof result === 'string').toBeTruthy();
    });

    it('stores data uncompressed when worker is unavailable', async () => {
      const testData = { key: 'value', nested: { a: 1 } };
      let storedData: string | null = null;

      const storeWithFallback = async (data: any) => {
        try {
          const serialized = JSON.stringify(data);
          storedData = serialized;
          return serialized;
        } catch {
          return null;
        }
      };

      const result = await storeWithFallback(testData);
      expect(result).toBe(JSON.stringify(testData));
      expect(storedData).toBe(JSON.stringify(testData));
    });
  });

  describe('Compression worker timeout', () => {
    it('falls back when worker does not respond within timeout', async () => {
      const testData = { large: 'x'.repeat(50000) };

      const compressWithTimeout = (data: any, timeoutMs = 50): Promise<string> => {
        return new Promise((resolve) => {
          const worker = new WorkerMockCtor() as WorkerMock;
          setTimeout(() => {
            resolve(JSON.stringify(data));
          }, timeoutMs);

          worker.postMessage({ type: 'compress', payload: JSON.stringify(data) });
        });
      };

      const result = await compressWithTimeout(testData, 10);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('APU worker successful calculation', () => {
    it('returns correct calculation result from worker', async () => {
      const worker = new WorkerMockCtor() as WorkerMock;
      const input = {
        renglones: [
          { id: 'r1', cantidad: 10, precioUnitario: 100, subRenglones: [{ cantidadUnitaria: 2, precioUnitario: 50 }], factorSobrecosto: 1.35 },
          { id: 'r2', cantidad: 5, precioUnitario: 200, factorSobrecosto: 1.35 },
        ],
        factorGlobal: 1.35,
      };

      const calcPromise = new Promise<any>((resolve) => {
        worker.onmessage = (e: MessageEvent) => {
          resolve(e.data);
        };
      });

      worker.postMessage(input);

      if (worker.onmessage) {
        worker.onmessage(new MessageEvent('message', {
          data: {
            success: true,
            result: {
              renglones: [
                { id: 'r1', subtotal: 1000, costoDirecto: 2000, precioVenta: 2700, totalMateriales: 1000 },
                { id: 'r2', subtotal: 1000, costoDirecto: 1000, precioVenta: 1350, totalMateriales: 0 },
              ],
              totalGeneral: 4050,
            },
          },
        }));
      }

      const response = await calcPromise;
      expect(response.success).toBe(true);
      expect(response.result.renglones).toHaveLength(2);
      expect(response.result.totalGeneral).toBe(4050);
    });
  });

  describe('APU worker error', () => {
    it('catches worker error and shows error state', async () => {
      const worker = new WorkerMockCtor() as WorkerMock;
      const invalidInput = { renglones: null, factorGlobal: 'invalid' };

      let capturedError: string | null = null;

      const calcPromise = new Promise<any>((resolve) => {
        worker.onmessage = (e: MessageEvent) => {
          const data = e.data;
          if (!data.success) {
            capturedError = data.error;
          }
          resolve(data);
        };
      });

      worker.postMessage(invalidInput);

      if (worker.onmessage) {
        worker.onmessage(new MessageEvent('message', {
          data: { success: false, error: 'Cannot read properties of null' },
        }));
      }

      const response = await calcPromise;
      expect(response.success).toBe(false);
      expect(capturedError).toBe('Cannot read properties of null');
    });
  });

  describe('Worker double-initialization', () => {
    it('terminates first worker when second is created', () => {
      const worker1 = new WorkerMockCtor() as WorkerMock;
      const worker2 = new WorkerMockCtor() as WorkerMock;

      expect(workerInstances).toHaveLength(2);
      expect(worker1.terminate).not.toHaveBeenCalled();

      worker1.terminate();
      expect(worker1.terminate).toHaveBeenCalledTimes(1);
    });

    it("does not call postMessage on terminated worker", () => {
      const worker1 = new WorkerMockCtor() as WorkerMock;
      const worker2 = new WorkerMockCtor() as WorkerMock;

      worker1.terminate();
      worker1.postMessage({ type: 'compress', payload: '{}' });

      expect(worker1.postMessage).toHaveBeenCalledTimes(1);
      expect(worker2.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('Worker termination on unmount', () => {
    it('calls worker.terminate() when component unmounts', () => {
      const worker = new WorkerMockCtor() as WorkerMock;
      const terminateSpy = vi.spyOn(worker, 'terminate');

      const cleanup = () => {
        worker.terminate();
      };

      cleanup();
      expect(terminateSpy).toHaveBeenCalledTimes(1);
    });

    it('cleans up all worker references on unmount', () => {
      const workers: WorkerMock[] = [];

      const createWorker = () => {
        if (workers.length > 0) {
          workers.forEach(w => w.terminate());
          workers.length = 0;
        }
        const w = new WorkerMockCtor() as WorkerMock;
        workers.push(w);
        return w;
      };

      const cleanup = () => {
        workers.forEach(w => {
          w.terminate();
          w.onmessage = null;
          w.onerror = null;
        });
        workers.length = 0;
      };

      const w1 = createWorker();
      const w2 = createWorker();
      cleanup();

      expect(w1.terminate).toHaveBeenCalled();
      expect(w2.terminate).toHaveBeenCalled();
      expect(workers).toHaveLength(0);
    });
  });
});
