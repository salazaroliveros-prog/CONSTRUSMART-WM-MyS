import { fmtQ, fmtPct, todayISO, costoDirectoUnitario, precioUnitarioVenta, duracionPorRendimiento, CATEGORIA_LABEL, TIPOLOGIA_LABEL, FSR_PRESTACIONES } from '../utils';
import { Categoria, Tipologia } from '../types';

describe('Funciones de formato (fmtQ, fmtPct)', () => {
  it('fmtQ formatea un número como moneda Guatemala', () => {
    const result = fmtQ(12345.67);
    expect(result).toContain('Q');
    expect(result).toContain('12');
  });

  it('fmtQ maneja null/undefined sin crashear', () => {
    expect(fmtQ(null as unknown as number)).toContain('Q');
    expect(fmtQ(undefined as unknown as number)).toContain('Q');
    expect(fmtQ(0)).toContain('Q');
  });

  it('fmtPct formatea un número como porcentaje', () => {
    expect(fmtPct(50)).toBe('50.0%');
    expect(fmtPct(0)).toBe('0.0%');
  });

  it('fmtPct maneja NaN', () => {
    expect(fmtPct(NaN)).toBe('0.0%');
  });
});

describe('todayISO()', () => {
  it('devuelve una fecha en formato YYYY-MM-DD', () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('devuelve la fecha actual', () => {
    const hoy = new Date().toISOString().slice(0, 10);
    expect(todayISO()).toBe(hoy);
  });
});

describe('costoDirectoUnitario()', () => {
  it('calcula costo directo correctamente', () => {
    // materiales + mano_obra * 1.05(herramienta menor) + equipo
    const resultado = costoDirectoUnitario(100, 200, 50);
    const esperado = 100 + 200 * 1.05 + 50;
    expect(resultado).toBe(esperado); // 360
  });

  it('maneja ceros', () => {
    expect(costoDirectoUnitario(0, 0, 0)).toBe(0);
  });

  it('con solo materiales', () => {
    expect(costoDirectoUnitario(100, 0, 0)).toBe(100);
  });
});

describe('precioUnitarioVenta() - fórmula secuencial', () => {
  it('calcula precio con indirectos, admin, imprevistos y utilidad en cascada', () => {
    const costoDirecto = 100;
    // indirectos: 100 * 0.12 = 12
    // admin: (100 + 12) * 0.08 = 8.96
    // imprevistos: (100 + 12 + 8.96) * 0.03 = 3.6888
    // base = 100 + 12 + 8.96 + 3.6888 = 124.6488
    // utilidad: base * 1.10 = 137.11368
    const resultado = precioUnitarioVenta(costoDirecto);
    expect(resultado).toBeCloseTo(137.11, 0);
  });

  it('costo directo cero produce precio cero', () => {
    expect(precioUnitarioVenta(0)).toBe(0);
  });

  it('el precio siempre es mayor al costo directo (hay sobrecosto)', () => {
    expect(precioUnitarioVenta(1000)).toBeGreaterThan(1000);
  });
});

describe('duracionPorRendimiento()', () => {
  it('calcula duración correcta', () => {
    expect(duracionPorRendimiento(100, 10)).toBe(10);
  });

  it('redondea hacia arriba en días fraccionarios', () => {
    expect(duracionPorRendimiento(10, 3)).toBe(4); // ceil(3.33) = 4
  });

  it('maneja rendimiento cero sin dividir por cero', () => {
    expect(duracionPorRendimiento(100, 0)).toBe(0);
  });
});

describe('CATEGORIA_LABEL', () => {
  it('tiene 11 categorías definidas', () => {
    expect(Object.keys(CATEGORIA_LABEL)).toHaveLength(11);
  });

  it('todas las categorías del tipo Categoria tienen label', () => {
    const categorias: Categoria[] = [
      'materiales', 'mano_obra', 'equipo', 'subcontrato', 'administracion',
      'transporte', 'imprevistos', 'marketing', 'licencias', 'seguros', 'otros',
    ];
    categorias.forEach(cat => {
      expect(CATEGORIA_LABEL[cat]).toBeDefined();
      expect(typeof CATEGORIA_LABEL[cat]).toBe('string');
    });
  });

  it('labels no son strings vacíos', () => {
    Object.values(CATEGORIA_LABEL).forEach(label => {
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

describe('TIPOLOGIA_LABEL', () => {
  it('tiene 5 tipologías definidas', () => {
    expect(Object.keys(TIPOLOGIA_LABEL)).toHaveLength(5);
  });

  it('todas las tipologías del tipo Tipologia tienen label', () => {
    const tipologias: Tipologia[] = ['residencial', 'comercial', 'industrial', 'civil', 'publica'];
    tipologias.forEach(tip => {
      expect(TIPOLOGIA_LABEL[tip]).toBeDefined();
    });
  });
});

describe('FSR_PRESTACIONES', () => {
  it('es 43.17% (prestaciones de ley Guatemala)', () => {
    expect(FSR_PRESTACIONES).toBe(0.4317);
  });
});