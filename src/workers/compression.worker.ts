import lz from 'lz-string';

const compressData = <T>(obj: T): string => {
  const json = JSON.stringify(obj);
  if (json.length > 10240) return lz.compressToUTF16(json);
  return json;
};

const decompressData = <T>(str: string): T => {
  try {
    const json = lz.decompressFromUTF16(str) || '';
    return JSON.parse(json) as T;
  } catch {
    return JSON.parse(str) as T;
  }
};

self.onmessage = (e: MessageEvent<{ type: 'compress' | 'decompress'; payload: string }>) => {
  const { type, payload } = e.data;
  try {
    const result = type === 'compress' ? compressData(JSON.parse(payload)) : decompressData(payload);
    (self as any).postMessage({ success: true, result });
  } catch (err) {
    (self as any).postMessage({ success: false, error: (err as Error).message });
  }
};
