/**
 * Tests para lógica pura del Motor de Cálculo APU
 * Sin dependencias de Supabase — funciones extraídas/replicadas de los servicios
 */
import { describe, it, expect } from 'vitest';
import { ValidacionCalculos, type AlertaInconsistencia } from '../services/validacionCalculos';

// ─── Funciones puras extraídas de ServicioMotorCalculo (privadas) ─────────────

function calcularFactorAltitud(altitud: number): number {
  if (altitud > 2000) return 1.05;
  if (altitud > 1000) return 1.0;
  return 0.98;
}

function calcularFactorCurado(curado: string): number {
  if (curado === 'acelerado') return 1.2;
  if (curado === 'prolongado') return 1.3;
  return 1.0;
}

const FACTORES_TEMPERATURA: Record<string, number> = {
  'GT-01': 1.0,
  'GT-02': 0.95,
  'GT-03': 0.95,
  'GT-08': 1.4,
  'GT-12': 1.5,
  'GT-15': 1.2,
};

function calcularFactorTemperatura(departamento?: string): number {
  if (!departamento) return 1.0;
  return FACTORES_TEMPERATURA[departamento] ?? 1.0;
}

// ─── Función pura de calcularImpactoEstacional (lógica de suma) ───────────────

function calcularImpactoEstacionalPuro(
  costoBase: number,
  factoresPorMes: number[],
  mesInicio: number,
  mesFin: number
): { costoTotal: number; costoAjustado: number; impactoTotal: number; porcentajeImpacto: number } {
  let costoTotal = 0;
  let costoAjustado = 0;
  for (let mes = mesInicio; mes <= mesFin; mes++) {
    const factor = factoresPorMes[mes - 1] ?? 1.0;
    costoTotal += costoBase;
    costoAjustado += costoBase * factor;
  }
  const impactoTotal = costoAjustado - costoTotal;
  const porcentajeImpacto = costoTotal > 0 ? (impactoTotal / costoTotal) * 100 : 0;
  return { costoTotal, costoAjustado, impactoTotal, porcentajeImpacto };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('APU Motor — calcularFactorAltitud', () => {
  it('retorna 1.05 para altitud > 2000 msnm', () => {
    expect(calcularFactorAltitud(2500)).toBe(1.05);
    expect(calcularFactorAltitud(2001)).toBe(1.05);
  });

  it('retorna 1.0 para altitud entre 1001 y 2000 msnm', () => {
    expect(calcularFactorAltitud(1500)).toBe(1.0);
    expect(calcularFactorAltitud(1001)).toBe(1.0);
  });

  it('retorna 0.98 para altitud <= 1000 msnm', () => {
    expect(calcularFactorAltitud(1000)).toBe(0.98);
    expect(calcularFactorAltitud(0)).toBe(0.98);
    expect(calcularFactorAltitud(500)).toBe(0.98);
  });

  it('retorna 1.05 exactamente en el límite 2001', () => {
    expect(calcularFactorAltitud(2001)).toBe(1.05);
  });
});

describe('APU Motor — calcularFactorCurado', () => {
  it('retorna 1.2 para curado acelerado', () => {
    expect(calcularFactorCurado('acelerado')).toBe(1.2);
  });

  it('retorna 1.3 para curado prolongado', () => {
    expect(calcularFactorCurado('prolongado')).toBe(1.3);
  });

  it('retorna 1.0 para curado normal', () => {
    expect(calcularFactorCurado('normal')).toBe(1.0);
  });

  it('retorna 1.0 para valor desconocido', () => {
    expect(calcularFactorCurado('')).toBe(1.0);
    expect(calcularFactorCurado('otro')).toBe(1.0);
  });
});

describe('APU Motor — calcularFactorTemperatura', () => {
  it('retorna 1.0 sin departamento', () => {
    expect(calcularFactorTemperatura()).toBe(1.0);
    expect(calcularFactorTemperatura(undefined)).toBe(1.0);
  });

  it('retorna 1.0 para Guatemala (GT-01)', () => {
    expect(calcularFactorTemperatura('GT-01')).toBe(1.0);
  });

  it('retorna 0.95 para zonas calientes (GT-02, GT-03)', () => {
    expect(calcularFactorTemperatura('GT-02')).toBe(0.95);
    expect(calcularFactorTemperatura('GT-03')).toBe(0.95);
  });

  it('retorna 1.4 para Quetzaltenango (GT-08)', () => {
    expect(calcularFactorTemperatura('GT-08')).toBe(1.4);
  });

  it('retorna 1.5 para Huehuetenango (GT-12)', () => {
    expect(calcularFactorTemperatura('GT-12')).toBe(1.5);
  });

  it('retorna 1.0 para departamento desconocido', () => {
    expect(calcularFactorTemperatura('GT-99')).toBe(1.0);
  });
});

describe('APU Motor — factor combinado altitud × curado', () => {
  it('calcula factor combinado correctamente para altitud alta + curado acelerado', () => {
    const fa = calcularFactorAltitud(2500); // 1.05
    const fc = calcularFactorCurado('acelerado'); // 1.2
    expect(fa * fc).toBeCloseTo(1.26, 5);
  });

  it('calcula factor combinado para altitud baja + curado normal', () => {
    const fa = calcularFactorAltitud(500); // 0.98
    const fc = calcularFactorCurado('normal'); // 1.0
    expect(fa * fc).toBeCloseTo(0.98, 5);
  });
});

describe('APU Motor — calcularImpactoEstacional (lógica pura)', () => {
  const factoresNeutrales = Array(12).fill(1.0);
  const factoresConImpacto = [1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 1.0, 1.0]; // meses 5-9 con impacto

  it('sin impacto estacional: costoAjustado === costoTotal', () => {
    const r = calcularImpactoEstacionalPuro(1000, factoresNeutrales, 1, 12);
    expect(r.costoTotal).toBe(12000);
    expect(r.costoAjustado).toBe(12000);
    expect(r.impactoTotal).toBe(0);
    expect(r.porcentajeImpacto).toBe(0);
  });

  it('calcula impacto positivo en temporada lluviosa', () => {
    const r = calcularImpactoEstacionalPuro(1000, factoresConImpacto, 5, 9);
    expect(r.costoTotal).toBe(5000);
    expect(r.costoAjustado).toBeCloseTo(5900, 5); // 1100+1200+1300+1200+1100
    expect(r.impactoTotal).toBeCloseTo(900, 5);
    expect(r.porcentajeImpacto).toBeCloseTo(18, 5);
  });

  it('retorna 0 de porcentaje cuando costoBase es 0', () => {
    const r = calcularImpactoEstacionalPuro(0, factoresConImpacto, 1, 3);
    expect(r.porcentajeImpacto).toBe(0);
  });

  it('calcula correctamente para un solo mes', () => {
    const factores = Array(12).fill(1.0);
    factores[6] = 1.3; // mes 7
    const r = calcularImpactoEstacionalPuro(500, factores, 7, 7);
    expect(r.costoTotal).toBe(500);
    expect(r.costoAjustado).toBeCloseTo(650, 5);
    expect(r.impactoTotal).toBeCloseTo(150, 5);
  });
});

describe('ValidacionCalculos — calcularScoreConsistencia', () => {
  const svc = new ValidacionCalculos();
  // Acceso via cast para testear método privado
  const calcScore = (alertas: AlertaInconsistencia[]) =>
    (svc as any).calcularScoreConsistencia(alertas);

  it('retorna 100 sin alertas', () => {
    expect(calcScore([])).toBe(100);
  });

  it('penaliza 25 por alerta crítica', () => {
    const alertas: AlertaInconsistencia[] = [{
      id: '1', tipo: 'critica', categoria: 'logica',
      mensaje: 'test', descripcion: 'test', origen: 'test',
      contexto: {}, fecha_deteccion: '', estado: 'pendiente',
    }];
    expect(calcScore(alertas)).toBe(75);
  });

  it('penaliza 15 por alerta alta', () => {
    const alertas: AlertaInconsistencia[] = [{
      id: '1', tipo: 'alta', categoria: 'tecnica',
      mensaje: 'test', descripcion: 'test', origen: 'test',
      contexto: {}, fecha_deteccion: '', estado: 'pendiente',
    }];
    expect(calcScore(alertas)).toBe(85);
  });

  it('penaliza 8 por alerta media', () => {
    const alertas: AlertaInconsistencia[] = [{
      id: '1', tipo: 'media', categoria: 'tecnica',
      mensaje: 'test', descripcion: 'test', origen: 'test',
      contexto: {}, fecha_deteccion: '', estado: 'pendiente',
    }];
    expect(calcScore(alertas)).toBe(92);
  });

  it('penaliza 3 por alerta baja', () => {
    const alertas: AlertaInconsistencia[] = [{
      id: '1', tipo: 'baja', categoria: 'tecnica',
      mensaje: 'test', descripcion: 'test', origen: 'test',
      contexto: {}, fecha_deteccion: '', estado: 'pendiente',
    }];
    expect(calcScore(alertas)).toBe(97);
  });

  it('no baja de 0 con muchas alertas críticas', () => {
    const alertas: AlertaInconsistencia[] = Array(10).fill({
      id: '1', tipo: 'critica', categoria: 'logica',
      mensaje: 'test', descripcion: 'test', origen: 'test',
      contexto: {}, fecha_deteccion: '', estado: 'pendiente',
    });
    expect(calcScore(alertas)).toBe(0);
  });

  it('acumula penalizaciones de múltiples tipos', () => {
    const alertas: AlertaInconsistencia[] = [
      { id: '1', tipo: 'critica', categoria: 'logica', mensaje: '', descripcion: '', origen: '', contexto: {}, fecha_deteccion: '', estado: 'pendiente' },
      { id: '2', tipo: 'alta', categoria: 'tecnica', mensaje: '', descripcion: '', origen: '', contexto: {}, fecha_deteccion: '', estado: 'pendiente' },
      { id: '3', tipo: 'media', categoria: 'tecnica', mensaje: '', descripcion: '', origen: '', contexto: {}, fecha_deteccion: '', estado: 'pendiente' },
    ];
    // 100 - 25 - 15 - 8 = 52
    expect(calcScore(alertas)).toBe(52);
  });
});

describe('ValidacionCalculos — generarRecomendaciones', () => {
  const svc = new ValidacionCalculos();
  const genRec = (alertas: AlertaInconsistencia[]) =>
    (svc as any).generarRecomendaciones(alertas);

  it('retorna mensaje de éxito sin alertas', () => {
    const recs: string[] = genRec([]);
    expect(recs).toHaveLength(1);
    expect(recs[0]).toContain('exitosamente');
  });

  it('incluye recomendación crítica cuando hay alertas críticas', () => {
    const alertas: AlertaInconsistencia[] = [{
      id: '1', tipo: 'critica', categoria: 'logica',
      mensaje: '', descripcion: '', origen: '',
      contexto: {}, fecha_deteccion: '', estado: 'pendiente',
    }];
    const recs: string[] = genRec(alertas);
    expect(recs.some((r: string) => r.includes('críticas'))).toBe(true);
  });

  it('incluye recomendación normativa cuando hay alertas normativas', () => {
    const alertas: AlertaInconsistencia[] = [{
      id: '1', tipo: 'alta', categoria: 'normativa',
      mensaje: '', descripcion: '', origen: '',
      contexto: {}, fecha_deteccion: '', estado: 'pendiente',
    }];
    const recs: string[] = genRec(alertas);
    expect(recs.some((r: string) => r.includes('normativa'))).toBe(true);
  });

  it('incluye recomendación de consistencia cuando hay alertas de consistencia', () => {
    const alertas: AlertaInconsistencia[] = [{
      id: '1', tipo: 'media', categoria: 'consistencia',
      mensaje: '', descripcion: '', origen: '',
      contexto: {}, fecha_deteccion: '', estado: 'pendiente',
    }];
    const recs: string[] = genRec(alertas);
    expect(recs.some((r: string) => r.includes('consistencia'))).toBe(true);
  });
});

describe('ValidacionCalculos — validarPavimento (público)', () => {
  const svc = new ValidacionCalculos();

  it('genera alerta alta si falta uso', async () => {
    const alertas = await svc.validarPavimento({}, {});
    expect(alertas.some(a => a.mensaje.includes('Uso'))).toBe(true);
    expect(alertas.some(a => a.tipo === 'alta')).toBe(true);
  });

  it('genera alerta alta si falta tipo', async () => {
    const alertas = await svc.validarPavimento({ uso: 'vehicular' }, {});
    expect(alertas.some(a => a.mensaje.includes('Tipo'))).toBe(true);
  });

  it('genera alerta media si costo_final_m2 < 100', async () => {
    const alertas = await svc.validarPavimento(
      { uso: 'peatonal', tipo: 'concreto' },
      { costo_final_m2: 50 }
    );
    expect(alertas.some(a => a.categoria === 'logica')).toBe(true);
  });

  it('genera alerta media si costo_final_m2 > 800', async () => {
    const alertas = await svc.validarPavimento(
      { uso: 'vehicular', tipo: 'asfalto' },
      { costo_final_m2: 1000 }
    );
    expect(alertas.some(a => a.categoria === 'logica')).toBe(true);
  });

  it('no genera alertas con parámetros válidos', async () => {
    const alertas = await svc.validarPavimento(
      { uso: 'vehicular', tipo: 'concreto' },
      { costo_final_m2: 400 }
    );
    expect(alertas).toHaveLength(0);
  });
});

describe('ValidacionCalculos — validarMuroContencion (público)', () => {
  const svc = new ValidacionCalculos();

  it('genera alerta alta si falta altura', async () => {
    const alertas = await svc.validarMuroContencion({}, {});
    expect(alertas.some(a => a.mensaje.includes('Altura'))).toBe(true);
  });

  it('genera alerta media si altura < 0.5m', async () => {
    const alertas = await svc.validarMuroContencion({ altura: 0.3 }, {});
    expect(alertas.some(a => a.mensaje.includes('baja'))).toBe(true);
  });

  it('genera alerta alta si altura > 10m', async () => {
    const alertas = await svc.validarMuroContencion({ altura: 12 }, {});
    expect(alertas.some(a => a.tipo === 'alta' && a.categoria === 'normativa')).toBe(true);
  });

  it('genera alerta media si costo_final_m2 fuera de rango (500-3000)', async () => {
    const alertas = await svc.validarMuroContencion(
      { altura: 3, tipo: 'concreto' },
      { costo_final_m2: 200 }
    );
    expect(alertas.some(a => a.categoria === 'logica')).toBe(true);
  });

  it('no genera alertas con parámetros válidos', async () => {
    const alertas = await svc.validarMuroContencion(
      { altura: 3, tipo: 'concreto' },
      { costo_final_m2: 1500 }
    );
    expect(alertas).toHaveLength(0);
  });
});

describe('ValidacionCalculos — validarRedInfraestructura (público)', () => {
  const svc = new ValidacionCalculos();

  it('genera alerta alta si falta tipo', async () => {
    const alertas = await svc.validarRedInfraestructura({}, {});
    expect(alertas.some((a: AlertaInconsistencia) => a.mensaje.includes('Tipo'))).toBe(true);
  });

  it('genera alerta alta si falta diámetro', async () => {
    const alertas = await svc.validarRedInfraestructura({ tipo: 'agua_potable' }, {});
    expect(alertas.some((a: AlertaInconsistencia) => a.mensaje.includes('Diámetro'))).toBe(true);
  });

  it('genera alerta media si costo_final_ml fuera de rango (10-500)', async () => {
    const alertas = await svc.validarRedInfraestructura(
      { tipo: 'agua_potable', diametro: '4"' },
      { costo_final_ml: 5 }
    );
    expect(alertas.some((a: AlertaInconsistencia) => a.categoria === 'logica')).toBe(true);
  });

  it('no genera alertas con parámetros válidos', async () => {
    const alertas = await svc.validarRedInfraestructura(
      { tipo: 'agua_potable', diametro: '4"' },
      { costo_final_ml: 150 }
    );
    expect(alertas).toHaveLength(0);
  });
});

describe('ValidacionCalculos — validarCalculoGenerico (privado)', () => {
  const svc = new ValidacionCalculos();
  const validarGenerico = (p: Record<string, unknown>, r: Record<string, unknown>) =>
    (svc as any).validarCalculoGenerico(p, r);

  it('genera alerta crítica para costo negativo', async () => {
    const alertas = await validarGenerico({}, { costo_total: -500 });
    expect(alertas.some((a: AlertaInconsistencia) => a.tipo === 'critica')).toBe(true);
  });

  it('genera alerta media para valor extremo > 1,000,000', async () => {
    const alertas = await validarGenerico({}, { costo_total: 2_000_000 });
    expect(alertas.some((a: AlertaInconsistencia) => a.tipo === 'media')).toBe(true);
  });

  it('no genera alertas para valores normales', async () => {
    const alertas = await validarGenerico({}, { costo_total: 50000 });
    expect(alertas).toHaveLength(0);
  });

  it('ignora campos que no son costos para validación de negativos', async () => {
    const alertas = await validarGenerico({}, { cantidad: -5, costo_total: 100 });
    // 'cantidad' no contiene 'costo', no debe generar alerta crítica
    expect(alertas.filter((a: AlertaInconsistencia) => a.tipo === 'critica')).toHaveLength(0);
  });
});
