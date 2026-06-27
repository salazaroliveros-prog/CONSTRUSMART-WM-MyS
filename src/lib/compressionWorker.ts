type CompressionResult<T> = { success: true; result: T } | { success: false; error: string };

const workerUrl = new URL('./compression.worker.ts', import.meta.url);

let worker: Worker | null = null;
const pending: Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }> = new Map();
let msgId = 0;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(workerUrl, { type: 'module' });
    worker.onmessage = (e: MessageEvent<any>) => {
      const pending_ = pending.get(e.data._id);
      if (!pending_) return;
      pending.delete(e.data._id);
      if (e.data.success) pending_.resolve(e.data.result);
      else pending_.reject(new Error(e.data.error));
    };
  }
  return worker;
}

export async function compressAsync<T>(obj: T): Promise<string> {
  const id = String(++msgId);
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ _id: id, type: 'compress', payload: JSON.stringify(obj) });
  });
}

export async function decompressAsync<T>(str: string): Promise<T> {
  const id = String(++msgId);
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ _id: id, type: 'decompress', payload: str });
  });
}
