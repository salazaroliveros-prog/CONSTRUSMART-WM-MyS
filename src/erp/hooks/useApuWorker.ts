import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApuCalcRequest, ApuCalcResponse } from '@/workers/apu-calc.worker';

interface UseApuWorkerResult {
  calculate: (req: ApuCalcRequest) => Promise<ApuCalcResponse>;
  isCalculating: boolean;
}

export function useApuWorker(): UseApuWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('@/workers/apu-calc.worker.ts', import.meta.url),
      { type: 'module' },
    );
    return () => { workerRef.current?.terminate(); };
  }, []);

  const calculate = useCallback((req: ApuCalcRequest): Promise<ApuCalcResponse> => {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        // Fallback: run synchronously if worker not available
        const results = req.renglones.map(r => {
          const factor = r.factorSobrecosto ?? req.factorGlobal ?? 1.35;
          const subtotal = r.cantidad * r.precioUnitario;
          const totalMateriales = (r.subRenglones ?? []).reduce(
            (acc, s) => acc + s.cantidadUnitaria * r.cantidad * s.precioUnitario, 0,
          );
          const costoDirecto = subtotal + totalMateriales;
          return { id: r.id, subtotal, costoDirecto, precioVenta: costoDirecto * factor, totalMateriales };
        });
        resolve({ renglones: results, totalGeneral: results.reduce((a, r) => a + r.precioVenta, 0) });
        return;
      }

      setIsCalculating(true);
      const handler = (e: MessageEvent<{ success: boolean; result?: ApuCalcResponse; error?: string }>) => {
        worker.removeEventListener('message', handler);
        setIsCalculating(false);
        if (e.data.success && e.data.result) resolve(e.data.result);
        else reject(new Error(e.data.error ?? 'APU worker error'));
      };
      worker.addEventListener('message', handler);
      worker.postMessage(req);
    });
  }, []);

  return { calculate, isCalculating };
}
