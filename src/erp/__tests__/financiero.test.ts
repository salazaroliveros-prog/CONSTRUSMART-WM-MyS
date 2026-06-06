import { describe, it, expect } from 'vitest';
// Tests de lógica financiera (sin React, sin imports explícitos de vitest)
// Tests de lógica financiera (sin React, solo cálculos)
// ============================================================

// Helper para calcular ingresos/gastos (replicando lógica de Dashboard/Financiero)
function calcIngresos(movimientos: { tipo: string; costoTotal: number }[]) {
  return movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
}

function calcGastos(movimientos: { tipo: string; costoTotal: number }[]) {
  return movimientos.filter(m => m.tipo === 'gasto' || m.tipo === 'egreso').reduce((a, b) => a + b.costoTotal, 0);
}

function calcGastosPorCategoria(movimientos: { tipo: string; categoria: string; costoTotal: number }[]) {
  const gastos = movimientos.filter(m => m.tipo === 'gasto');
  const total = gastos.reduce((a, b) => a + b.costoTotal, 0);
  return [...new Set(gastos.map(m => m.categoria))].map(cat => ({
    categoria: cat,
    monto: gastos.filter(m => m.categoria === cat).reduce((a, b) => a + b.costoTotal, 0),
    porcentaje: total > 0 ? (gastos.filter(m => m.categoria === cat).reduce((a, b) => a + b.costoTotal, 0) / total) * 100 : 0,
  })).sort((a, b) => b.monto - a.monto);
}

function calcVariacion(gastoReal: number, presupuestoTotal: number) {
  return presupuestoTotal > 0 ? ((gastoReal - presupuestoTotal) / presupuestoTotal) * 100 : 0;
}

function calcRentabilidad(ingresos: number, gastos: number) {
  return ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : 0;
}

// Mock data
const movimientos = [
  { tipo: 'ingreso', costoTotal: 50000, categoria: 'ventas', proyectoId: 'p1' },
  { tipo: 'ingreso', costoTotal: 30000, categoria: 'ventas', proyectoId: 'p2' },
  { tipo: 'gasto', costoTotal: 15000, categoria: 'materiales', proyectoId: 'p1' },
  { tipo: 'gasto', costoTotal: 8000, categoria: 'mano_obra', proyectoId: 'p1' },
  { tipo: 'gasto', costoTotal: 5000, categoria: 'equipo', proyectoId: 'p2' },
  { tipo: 'egreso', costoTotal: 2000, categoria: 'transporte', proyectoId: 'p1' },
];

describe('Cálculos financieros de Dashboard', () => {
  it('calcula ingresos totales correctamente', () => {
    expect(calcIngresos(movimientos)).toBe(80000);
  });

  it('calcula gastos totales (gasto + egreso)', () => {
    expect(calcGastos(movimientos)).toBe(30000);
  });

  it('utilidad neta = ingresos - gastos', () => {
    const utilidad = calcIngresos(movimientos) - calcGastos(movimientos);
    expect(utilidad).toBe(50000);
  });

  it('ROI = (ingresos - gastos) / gastos * 100', () => {
    const ingresos = calcIngresos(movimientos);
    const gastos = calcGastos(movimientos);
    const roi = ((ingresos - gastos) / gastos) * 100;
    expect(roi).toBeCloseTo(166.67, 0);
  });

  it('margen neto = (ingresos - gastos) / ingresos * 100', () => {
    const ingresos = calcIngresos(movimientos);
    const gastos = calcGastos(movimientos);
    const margen = ((ingresos - gastos) / ingresos) * 100;
    expect(margen).toBeCloseTo(62.5, 0);
  });
});

describe('Cálculos por categoría', () => {
  it('agrupa gastos por categoría correctamente', () => {
    const porCat = calcGastosPorCategoria(movimientos);
    expect(porCat).toHaveLength(3);
    expect(porCat[0].categoria).toBe('materiales'); // Mayor gasto
    expect(porCat[0].monto).toBe(15000);
  });

  it('los porcentajes suman 100%', () => {
    const porCat = calcGastosPorCategoria(movimientos);
    const totalPct = porCat.reduce((a, c) => a + c.porcentaje, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it('ordena de mayor a menor gasto', () => {
    const porCat = calcGastosPorCategoria(movimientos);
    for (let i = 1; i < porCat.length; i++) {
      expect(porCat[i - 1].monto).toBeGreaterThanOrEqual(porCat[i].monto);
    }
  });

  it('maneja movimientos sin gastos', () => {
    const soloIngresos = movimientos.filter(m => m.tipo === 'ingreso');
    const porCat = calcGastosPorCategoria(soloIngresos);
    expect(porCat).toHaveLength(0);
  });
});

describe('Cálculos por proyecto', () => {
  it('filtra ingresos por proyecto correctamente', () => {
    const p1Ingresos = movimientos.filter(m => m.proyectoId === 'p1' && m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
    expect(p1Ingresos).toBe(50000);
  });

  it('filtra gastos por proyecto correctamente', () => {
    const p1Gastos = movimientos.filter(m => m.proyectoId === 'p1' && (m.tipo === 'gasto' || m.tipo === 'egreso')).reduce((a, b) => a + b.costoTotal, 0);
    expect(p1Gastos).toBe(25000); // 15000 + 8000 + 2000
  });

  it('proyecto sin movimientos tiene ceros', () => {
    const p99Ingresos = movimientos.filter(m => m.proyectoId === 'p99' && m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
    expect(p99Ingresos).toBe(0);
  });
});

describe('Variación presupuestaria', () => {
  it('positiva significa sobrecosto', () => {
    expect(calcVariacion(120, 100)).toBe(20); // +20%
  });

  it('negativa significa ahorro', () => {
    expect(calcVariacion(80, 100)).toBe(-20); // -20%
  });

  it('presupuesto cero retorna 0', () => {
    expect(calcVariacion(50, 0)).toBe(0);
  });

  it('ambos cero retorna 0', () => {
    expect(calcVariacion(0, 0)).toBe(0);
  });
});

describe('Rentabilidad por proyecto', () => {
  it('calcula margen correctamente', () => {
    expect(calcRentabilidad(100000, 60000)).toBe(40); // 40% margen
  });

  it('ingresos cero retorna 0', () => {
    expect(calcRentabilidad(0, 50000)).toBe(0);
  });

  it('proyecto con pérdida tiene rentabilidad negativa', () => {
    expect(calcRentabilidad(50000, 80000)).toBe(-60);
  });
});

describe('Densidad de costo Q/m²', () => {
  it('calcula densidad correctamente', () => {
    const gastos = 150000;
    const area = 500;
    expect(gastos / area).toBe(300);
  });

  it('área cero no produce NaN', () => {
    const area = 0;
    const densidad = area > 0 ? 100000 / area : 0;
    expect(densidad).toBe(0);
  });
});

describe('Horas-hombre acumuladas', () => {
  it('calcula total horas correctamente', () => {
    const totalDias = 100;
    const horasPorDia = 8;
    expect(totalDias * horasPorDia).toBe(800);
  });

  it('sin días trabajados retorna 0', () => {
    const empleados = [
      { activo: true, diasTrabajados: 0 },
      { activo: false, diasTrabajados: 50 },
    ];
    const totalDias = empleados.filter(e => e.activo).reduce((sum, e) => sum + (e.diasTrabajados || 0), 0);
    expect(totalDias).toBe(0);
  });
});

describe('Utilización de recursos', () => {
  it('calcula % de empleados con horas', () => {
    const empleados = [
      { activo: true, diasTrabajados: 10 },
      { activo: true, diasTrabajados: 5 },
      { activo: true, diasTrabajados: 0 },
    ];
    const activos = empleados.filter(e => e.activo);
    const conHoras = activos.filter(e => (e.diasTrabajados || 0) > 0);
    const pct = (conHoras.length / Math.max(activos.length, 1)) * 100;
    expect(pct).toBeCloseTo(66.67, 0);
  });

  it('sin empleados activos retorna 0%', () => {
    const pct = (0 / Math.max(0, 1)) * 100;
    expect(pct).toBe(0);
  });
});

describe('Predicción de fecha de fin', () => {
  it('calcula tasa diaria correctamente', () => {
    const avanceFisico = 60;
    const diasTranscurridos = 30;
    const tasaDiaria = avanceFisico / diasTranscurridos;
    expect(tasaDiaria).toBe(2); // 2% por día
  });

  it('calcula días restantes correctamente', () => {
    const avanceFisico = 60;
    const tasaDiaria = 2;
    const diasRestantes = Math.round((100 - avanceFisico) / tasaDiaria);
    expect(diasRestantes).toBe(20);
  });

  it('avance 100% = 0 días restantes', () => {
    const avanceFisico = 100;
    const tasaDiaria = 2;
    const diasRestantes = tasaDiaria > 0 ? Math.round((100 - avanceFisico) / tasaDiaria) : 0;
    expect(diasRestantes).toBe(0);
  });
});

describe('Alertas de retraso', () => {
  it('detecta proyecto retrasado', () => {
    const hoy = '2026-04-06';
    const fechaFin = '2026-04-01';
    const avanceFisico = 75;
    const retrasado = fechaFin < hoy && avanceFisico < 100;
    expect(retrasado).toBe(true);
  });

  it('proyecto al día no es retrasado', () => {
    const hoy = '2026-04-06';
    const fechaFin = '2026-04-10';
    const avanceFisico = 50;
    const retrasado = fechaFin < hoy && avanceFisico < 100;
    expect(retrasado).toBe(false);
  });

  it('proyecto completado no es retrasado aunque fecha pasó', () => {
    const hoy = '2026-04-06';
    const fechaFin = '2026-04-01';
    const avanceFisico = 100;
    const retrasado = fechaFin < hoy && avanceFisico < 100;
    expect(retrasado).toBe(false);
  });

  it('calcula días de retraso correctamente', () => {
    const hoy = new Date('2026-04-06');
    const fechaFin = new Date('2026-04-01');
    const diasRetraso = Math.round((hoy.getTime() - fechaFin.getTime()) / 86400000);
    expect(diasRetraso).toBe(5);
  });
});

describe('EERR por categoría', () => {
  it('total ingresos > 0', () => {
    expect(calcIngresos(movimientos)).toBeGreaterThan(0);
  });

  it('total gastos > 0', () => {
    expect(calcGastos(movimientos)).toBeGreaterThan(0);
  });

  it('utilidad puede ser negativa (pérdida)', () => {
    const perdida = calcIngresos([{ tipo: 'ingreso', costoTotal: 100 }]) - calcGastos([{ tipo: 'gasto', costoTotal: 200 }]);
    expect(perdida).toBe(-100);
  });
});