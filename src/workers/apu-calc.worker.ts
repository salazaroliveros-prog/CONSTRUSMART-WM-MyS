export interface RenglonInput {
  id: string;
  cantidad: number;
  precioUnitario: number;
  subRenglones?: { cantidadUnitaria: number; precioUnitario: number }[];
  factorSobrecosto?: number;
}

export interface RenglonResult {
  id: string;
  subtotal: number;
  costoDirecto: number;
  precioVenta: number;
  totalMateriales: number;
}

export interface ApuCalcRequest {
  renglones: RenglonInput[];
  factorGlobal?: number;
}

export interface ApuCalcResponse {
  renglones: RenglonResult[];
  totalGeneral: number;
}

function calcularRenglon(r: RenglonInput, factorGlobal: number): RenglonResult {
  const factor = r.factorSobrecosto ?? factorGlobal;
  const subtotal = r.cantidad * r.precioUnitario;
  const totalMateriales = (r.subRenglones ?? []).reduce(
    (acc, s) => acc + s.cantidadUnitaria * r.cantidad * s.precioUnitario,
    0,
  );
  const costoDirecto = subtotal + totalMateriales;
  const precioVenta = costoDirecto * factor;
  return { id: r.id, subtotal, costoDirecto, precioVenta, totalMateriales };
}

self.onmessage = (e: MessageEvent<ApuCalcRequest>) => {
  const { renglones, factorGlobal = 1.35 } = e.data;
  try {
    const results = renglones.map(r => calcularRenglon(r, factorGlobal));
    const totalGeneral = results.reduce((acc, r) => acc + r.precioVenta, 0);
    (self as DedicatedWorkerGlobalScope).postMessage({ success: true, result: { renglones: results, totalGeneral } });
  } catch (err) {
    (self as DedicatedWorkerGlobalScope).postMessage({ success: false, error: (err as Error).message });
  }
};
