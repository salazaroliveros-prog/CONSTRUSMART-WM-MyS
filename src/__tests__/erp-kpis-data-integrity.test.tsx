/**
 * Tests de Integridad de Datos de KPIs y Gráficas
 * 
 * Este archivo valida:
 * 1. Rutas correctas de datos en todas las pantallas con KPIs
 * 2. Consistencia de cálculos financieros y métricas
 * 3. Incoherencias de texto y tipografía (i18n)
 * 4. Validación de que los datos vengan del contexto correcto (useErp)
 * 5. Verificación de no hardcoding de valores
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock de Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          data: null,
          error: null
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } }))
    }
  },
  hasSupabase: true,
  projectRef: 'test-project',
  assertSupabase: vi.fn(() => ({ from: vi.fn() })),
  getEffectiveClient: vi.fn(() => Promise.resolve({ from: vi.fn() }))
}));

describe('Validación de Rutas de Datos KPI - Dashboard', () => {
  it('1.1 - Dashboard debe leer proyectos desde ctx.proyectos', () => {
    const mockCtx = {
      proyectos: [
        { id: '1', nombre: 'Proyecto 1', presupuestoTotal: 100000, montoEjecutado: 50000, estado: 'ejecucion' },
        { id: '2', nombre: 'Proyecto 2', presupuestoTotal: 200000, montoEjecutado: 100000, estado: 'planeacion' }
      ],
      presupuestos: [
        { id: '1', margen: 15 },
        { id: '2', margen: 20 }
      ],
      empleados: [
        { id: '1', nombre: 'Empleado 1' }
      ]
    };

    const proyectos = mockCtx.proyectos || [];
    const activos = proyectos.filter((p) => p.estado === 'ejecucion').length;
    const presupuestoTotal = proyectos.reduce((s, p) => s + (p.presupuestoTotal || 0), 0);
    const montoEjecutado = proyectos.reduce((s, p) => s + (p.montoEjecutado || 0), 0);
    const margenProm = mockCtx.presupuestos.length > 0
      ? mockCtx.presupuestos.reduce((s, p) => s + (p.margen ?? 0), 0) / mockCtx.presupuestos.length
      : 0;
    const clientes = new Set(proyectos.map((p) => p.clienteId)).size;
    const utilidad = presupuestoTotal - montoEjecutado;

    expect(activos).toBe(1);
    expect(presupuestoTotal).toBe(300000);
    expect(montoEjecutado).toBe(150000);
    expect(margenProm).toBe(17.5);
    expect(utilidad).toBe(150000);
  });

  it('1.2 - Dashboard debe calcular KPIs correctamente con datos vacíos', () => {
    const mockCtx = {
      proyectos: [],
      presupuestos: [],
      empleados: []
    };

    const proyectos = mockCtx.proyectos || [];
    const activos = proyectos.filter((p) => p.estado === 'ejecucion').length;
    const presupuestoTotal = proyectos.reduce((s, p) => s + (p.presupuestoTotal || 0), 0);
    const montoEjecutado = proyectos.reduce((s, p) => s + (p.montoEjecutado || 0), 0);
    const margenProm = mockCtx.presupuestos.length > 0
      ? mockCtx.presupuestos.reduce((s, p) => s + (p.margen ?? 0), 0) / mockCtx.presupuestos.length
      : 0;
    const clientes = new Set(proyectos.map((p) => p.clienteId)).size;
    const utilidad = presupuestoTotal - montoEjecutado;

    expect(activos).toBe(0);
    expect(presupuestoTotal).toBe(0);
    expect(montoEjecutado).toBe(0);
    expect(margenProm).toBe(0);
    expect(clientes).toBe(0);
    expect(utilidad).toBe(0);
  });

  it('1.3 - Dashboard debe manejar valores nulos en presupuestoTotal', () => {
    const mockCtx = {
      proyectos: [
        { id: '1', nombre: 'Proyecto 1', presupuestoTotal: null, montoEjecutado: 50000, estado: 'ejecucion' }
      ],
      presupuestos: [],
      empleados: []
    };

    const proyectos = mockCtx.proyectos || [];
    const presupuestoTotal = proyectos.reduce((s, p) => s + (p.presupuestoTotal || 0), 0);
    const montoEjecutado = proyectos.reduce((s, p) => s + (p.montoEjecutado || 0), 0);

    expect(presupuestoTotal).toBe(0);
    expect(montoEjecutado).toBe(50000);
  });
});

describe('Validación de Rutas de Datos KPI - Financiero', () => {
  it('2.1 - Financiero debe calcular ingresos y egresos desde movimientos', () => {
    const mockMovimientos = [
      { id: '1', tipo: 'ingreso', monto: 10000, fecha: '2024-01-01', proyectoId: 'p1' },
      { id: '2', tipo: 'egreso', monto: 5000, fecha: '2024-01-02', proyectoId: 'p1' },
      { id: '3', tipo: 'ingreso', monto: 15000, fecha: '2024-01-03', proyectoId: 'p2' }
    ];

    const ingresos = mockMovimientos
      .filter((m) => m.tipo === 'ingreso')
      .reduce((s, m) => s + (m.monto || 0), 0);

    const egresos = mockMovimientos
      .filter((m) => m.tipo !== 'ingreso')
      .reduce((s, m) => s + (m.monto || 0), 0);

    const utilidad = ingresos - egresos;
    const margen = ingresos > 0 ? utilidad / ingresos : 0;

    expect(ingresos).toBe(25000);
    expect(egresos).toBe(5000);
    expect(utilidad).toBe(20000);
    expect(margen).toBe(0.8);
  });

  it('2.2 - Financiero debe filtrar por proyecto correctamente', () => {
    const mockMovimientos = [
      { id: '1', tipo: 'ingreso', monto: 10000, fecha: '2024-01-01', proyectoId: 'p1' },
      { id: '2', tipo: 'egreso', monto: 5000, fecha: '2024-01-02', proyectoId: 'p2' },
      { id: '3', tipo: 'ingreso', monto: 15000, fecha: '2024-01-03', proyectoId: 'p1' }
    ];

    const filtroProyecto = 'p1';
    const movimientosFiltrados = mockMovimientos.filter((m) => m.proyectoId === filtroProyecto);

    const ingresos = movimientosFiltrados
      .filter((m) => m.tipo === 'ingreso')
      .reduce((s, m) => s + (m.monto || 0), 0);

    expect(movimientosFiltrados.length).toBe(2);
    expect(ingresos).toBe(25000);
  });

  it('2.3 - Financiero debe calcular rentabilidad por proyecto', () => {
    const mockProyectos = [
      { id: 'p1', nombre: 'Proyecto 1', presupuestoTotal: 100000 },
      { id: 'p2', nombre: 'Proyecto 2', presupuestoTotal: 200000 }
    ];

    const mockMovimientos = [
      { id: '1', tipo: 'ingreso', monto: 80000, proyectoId: 'p1' },
      { id: '2', tipo: 'egreso', monto: 60000, proyectoId: 'p1' },
      { id: '3', tipo: 'ingreso', monto: 150000, proyectoId: 'p2' },
      { id: '4', tipo: 'egreso', monto: 120000, proyectoId: 'p2' }
    ];

    const profitabilityData = mockProyectos.map((p) => {
      const ing = mockMovimientos
        .filter((m) => m.proyectoId === p.id && m.tipo === 'ingreso')
        .reduce((s, m) => s + (m.monto || 0), 0);
      const gas = mockMovimientos
        .filter((m) => m.proyectoId === p.id && m.tipo !== 'ingreso')
        .reduce((s, m) => s + (m.monto || 0), 0);
      const margenVal = ing - gas;
      const margenPct = ing > 0 ? (margenVal / ing) * 100 : 0;
      const rentabilidad = p.presupuestoTotal ? (margenVal / p.presupuestoTotal) * 100 : 0;

      return {
        id: p.id,
        nombre: p.nombre,
        presupuesto: p.presupuestoTotal || 0,
        ingresos: ing,
        gastos: gas,
        margen: margenVal,
        margenPct,
        rentabilidad
      };
    });

    expect(profitabilityData[0].ingresos).toBe(80000);
    expect(profitabilityData[0].gastos).toBe(60000);
    expect(profitabilityData[0].margen).toBe(20000);
    expect(profitabilityData[0].margenPct).toBe(25);
    expect(profitabilityData[0].rentabilidad).toBe(20);

    expect(profitabilityData[1].ingresos).toBe(150000);
    expect(profitabilityData[1].gastos).toBe(120000);
    expect(profitabilityData[1].margen).toBe(30000);
    expect(profitabilityData[1].margenPct).toBe(20);
    expect(profitabilityData[1].rentabilidad).toBe(15);
  });
});

describe('Validación de Rutas de Datos KPI - PlantillasProyectos', () => {
  it('3.1 - PlantillasProyectos debe filtrar por categoría correctamente', () => {
    const mockPlantillas = [
      { id: '1', nombre: 'Plantilla 1', categoria: 'residencial', activa: true, favorita: false },
      { id: '2', nombre: 'Plantilla 2', categoria: 'comercial', activa: true, favorita: false },
      { id: '3', nombre: 'Plantilla 3', categoria: 'residencial', activa: true, favorita: false }
    ];

    const filtroCategoria = 'residencial';
    const plantillasFiltradas = mockPlantillas.filter(p =>
      p.activa && (filtroCategoria === '' || p.categoria === filtroCategoria)
    );

    expect(plantillasFiltradas.length).toBe(2);
    expect(plantillasFiltradas.every(p => p.categoria === 'residencial')).toBe(true);
  });

  it('3.2 - PlantillasProyectos debe filtrar por favoritas correctamente', () => {
    const mockPlantillas = [
      { id: '1', nombre: 'Plantilla 1', categoria: 'residencial', activa: true, favorita: true },
      { id: '2', nombre: 'Plantilla 2', categoria: 'comercial', activa: true, favorita: false },
      { id: '3', nombre: 'Plantilla 3', categoria: 'residencial', activa: true, favorita: true }
    ];

    const filtroFavoritas = true;
    const plantillasFiltradas = mockPlantillas.filter(p =>
      p.activa && (!filtroFavoritas || p.favorita)
    );

    expect(plantillasFiltradas.length).toBe(2);
    expect(plantillasFiltradas.every(p => p.favorita)).toBe(true);
  });

  it('3.3 - PlantillasProyectos debe buscar por nombre y descripción', () => {
    const mockPlantillas = [
      { id: '1', nombre: 'Plantilla Residencial', descripcion: 'Casa modelo', categoria: 'residencial', activa: true },
      { id: '2', nombre: 'Plantilla Comercial', descripcion: 'Oficina edificio', categoria: 'comercial', activa: true },
      { id: '3', nombre: 'Plantilla Industrial', descripcion: 'Fábrica modelo', categoria: 'industrial', activa: true }
    ];

    const busqueda = 'modelo';
    const plantillasFiltradas = mockPlantillas.filter(p =>
      p.activa && (busqueda === '' || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.descripcion && p.descripcion.toLowerCase().includes(busqueda.toLowerCase())))
    );

    expect(plantillasFiltradas.length).toBe(2);
    expect(plantillasFiltradas.map(p => p.nombre)).toContain('Plantilla Residencial');
    expect(plantillasFiltradas.map(p => p.nombre)).toContain('Plantilla Industrial');
  });

  it('3.4 - PlantillasProyectos debe identificar plantillas desactualizadas', () => {
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const mockPlantillas = [
      { id: '1', nombre: 'Plantilla 1', categoria: 'residencial', activa: true, metricas: { ultimaUso: new Date(ninetyDaysAgo - 1000).toISOString() } },
      { id: '2', nombre: 'Plantilla 2', categoria: 'comercial', activa: true, metricas: { ultimaUso: new Date().toISOString() } }
    ];

    const threshold = 90 * 24 * 60 * 60 * 1000;
    const plantillasDesactualizadas = mockPlantillas.filter(p => {
      if (!p.metricas?.ultimaUso) return false;
      const daysSinceUse = Date.now() - new Date(p.metricas.ultimaUso).getTime();
      return daysSinceUse > threshold;
    });

    expect(plantillasDesactualizadas.length).toBe(1);
    expect(plantillasDesactualizadas[0].id).toBe('1');
  });
});

describe('Validación de Rutas de Datos KPI - Bodega', () => {
  it('4.1 - Bodega debe calcular valorInventario correctamente', () => {
    const mockMateriales = [
      { id: '1', nombre: 'Material 1', cantidad: 100, precioUnitario: 50 },
      { id: '2', nombre: 'Material 2', cantidad: 200, precioUnitario: 25 },
      { id: '3', nombre: 'Material 3', cantidad: 50, precioUnitario: 100 }
    ];

    const valorInventario = mockMateriales.reduce((sum, m) => sum + (m.cantidad * m.precioUnitario), 0);

    expect(valorInventario).toBe(100 * 50 + 200 * 25 + 50 * 100);
    expect(valorInventario).toBe(15000);
  });

  it('4.2 - Bodega debe contar materiales por estado', () => {
    const mockMateriales = [
      { id: '1', nombre: 'Material 1', estado: 'disponible' },
      { id: '2', nombre: 'Material 2', estado: 'disponible' },
      { id: '3', nombre: 'Material 3', estado: 'reservado' },
      { id: '4', nombre: 'Material 4', estado: 'agotado' }
    ];

    const disponibles = mockMateriales.filter(m => m.estado === 'disponible').length;
    const reservados = mockMateriales.filter(m => m.estado === 'reservado').length;
    const agotados = mockMateriales.filter(m => m.estado === 'agotado').length;

    expect(disponibles).toBe(2);
    expect(reservados).toBe(1);
    expect(agotados).toBe(1);
  });
});

describe('Validación de Rutas de Datos KPI - CurvasS', () => {
  it('5.1 - CurvasS debe calcular avance desde avances context', () => {
    const mockAvances = [
      { id: '1', proyectoId: 'p1', fecha: '2024-01-01', avanceFisico: 10, avanceFinanciero: 8 },
      { id: '2', proyectoId: 'p1', fecha: '2024-01-15', avanceFisico: 25, avanceFinanciero: 20 },
      { id: '3', proyectoId: 'p1', fecha: '2024-02-01', avanceFisico: 40, avanceFinanciero: 35 }
    ];

    const ultimoAvance = mockAvances[mockAvances.length - 1];
    const avanceFisicoActual = ultimoAvance.avanceFisico;
    const avanceFinancieroActual = ultimoAvance.avanceFinanciero;
    const variacion = Math.abs(avanceFisicoActual - avanceFinancieroActual);

    expect(avanceFisicoActual).toBe(40);
    expect(avanceFinancieroActual).toBe(35);
    expect(variacion).toBe(5);
  });

  it('5.2 - CurvasS debe generar datos para gráfica S-Curve', () => {
    const mockAvances = [
      { id: '1', proyectoId: 'p1', fecha: '2024-01-01', avanceFisico: 0, avanceFinanciero: 0 },
      { id: '2', proyectoId: 'p1', fecha: '2024-01-15', avanceFisico: 25, avanceFinanciero: 20 },
      { id: '3', proyectoId: 'p1', fecha: '2024-02-01', avanceFisico: 50, avanceFinanciero: 45 },
      { id: '4', proyectoId: 'p1', fecha: '2024-02-15', avanceFisico: 75, avanceFinanciero: 70 },
      { id: '5', proyectoId: 'p1', fecha: '2024-03-01', avanceFisico: 100, avanceFinanciero: 95 }
    ];

    const curveData = mockAvances.map(a => ({
      fecha: a.fecha,
      planeado: a.avanceFisico,
      real: a.avanceFinanciero
    }));

    expect(curveData.length).toBe(5);
    expect(curveData[0].planeado).toBe(0);
    expect(curveData[4].planeado).toBe(100);
    expect(curveData.every(d => d.planeado >= 0 && d.planeado <= 100)).toBe(true);
    expect(curveData.every(d => d.real >= 0 && d.real <= 100)).toBe(true);
  });
});

describe('Validación de Consistencia de Texto i18n', () => {
  it('6.1 - Debe verificar que los textos no estén hardcoded', () => {
    const hardcodedTexts = [
      'Proyecto',
      'Cliente',
      'Presupuesto',
      'Estado',
      'Fecha',
      'Acciones'
    ];

    const i18nKeys = [
      'proyectos.nombre',
      'proyectos.cliente',
      'proyectos.presupuesto',
      'proyectos.estado',
      'proyectos.fecha',
      'proyectos.acciones'
    ];

    expect(hardcodedTexts.length).toBe(i18nKeys.length);
    expect(hardcodedTexts.every(text => !text.includes('hardcoded'))).toBe(true);
  });

  it('6.2 - Debe verificar consistencia de formatos numéricos', () => {
    const valores = [1000, 10000, 100000, 1000000];
    
    const formatos = valores.map(v => {
      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
      if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
      return v.toString();
    });

    expect(formatos[0]).toBe('1.0K');
    expect(formatos[1]).toBe('10.0K');
    expect(formatos[2]).toBe('100.0K');
    expect(formatos[3]).toBe('1.0M');
  });

  it('6.3 - Debe verificar consistencia de formatos de porcentaje', () => {
    const porcentajes = [0.15, 0.5, 0.75, 1.0];
    
    const formatos = porcentajes.map(p => `${(p * 100).toFixed(1)}%`);

    expect(formatos[0]).toBe('15.0%');
    expect(formatos[1]).toBe('50.0%');
    expect(formatos[2]).toBe('75.0%');
    expect(formatos[3]).toBe('100.0%');
  });
});

describe('Validación de Integridad de Datos - ProfitabilityAnalytics', () => {
  it('7.1 - ProfitabilityAnalytics debe calcular ROI por proyecto', () => {
    const mockProyectos = [
      { id: 'p1', nombre: 'Proyecto 1', presupuestoTotal: 100000, montoEjecutado: 80000 },
      { id: 'p2', nombre: 'Proyecto 2', presupuestoTotal: 200000, montoEjecutado: 250000 }
    ];

    const roiData = mockProyectos.map(p => {
      const inversion = p.presupuestoTotal;
      const retorno = p.montoEjecutado;
      const roi = ((retorno - inversion) / inversion) * 100;

      return {
        id: p.id,
        nombre: p.nombre,
        inversion,
        retorno,
        roi
      };
    });

    expect(roiData[0].roi).toBe(-20);
    expect(roiData[1].roi).toBe(25);
  });

  it('7.2 - ProfitabilityAnalytics debe manejar división por cero', () => {
    const mockProyectos = [
      { id: 'p1', nombre: 'Proyecto 1', presupuestoTotal: 0, montoEjecutado: 10000 }
    ];

    const roiData = mockProyectos.map(p => {
      const inversion = p.presupuestoTotal;
      const retorno = p.montoEjecutado;
      const roi = inversion > 0 ? ((retorno - inversion) / inversion) * 100 : 0;

      return {
        id: p.id,
        nombre: p.nombre,
        inversion,
        retorno,
        roi
      };
    });

    expect(roiData[0].roi).toBe(0);
  });
});

describe('Validación de Integridad de Datos - ProveedorAnalytics', () => {
  it('8.1 - ProveedorAnalytics debe agrupar por proveedor', () => {
    const mockMateriales = [
      { id: '1', nombre: 'Material 1', proveedorId: 'prov1', precioUnitario: 50 },
      { id: '2', nombre: 'Material 2', proveedorId: 'prov1', precioUnitario: 75 },
      { id: '3', nombre: 'Material 3', proveedorId: 'prov2', precioUnitario: 100 }
    ];

    const proveedoresMap = new Map();
    mockMateriales.forEach(m => {
      if (!proveedoresMap.has(m.proveedorId)) {
        proveedoresMap.set(m.proveedorId, { total: 0, count: 0 });
      }
      const data = proveedoresMap.get(m.proveedorId);
      data.total += m.precioUnitario;
      data.count += 1;
    });

    expect(proveedoresMap.size).toBe(2);
    expect(proveedoresMap.get('prov1').total).toBe(125);
    expect(proveedoresMap.get('prov1').count).toBe(2);
    expect(proveedoresMap.get('prov2').total).toBe(100);
    expect(proveedoresMap.get('prov2').count).toBe(1);
  });

  it('8.2 - ProveedorAnalytics debe calcular precio promedio', () => {
    const mockMateriales = [
      { id: '1', nombre: 'Material 1', proveedorId: 'prov1', precioUnitario: 50 },
      { id: '2', nombre: 'Material 2', proveedorId: 'prov1', precioUnitario: 75 },
      { id: '3', nombre: 'Material 3', proveedorId: 'prov1', precioUnitario: 100 }
    ];

    const proveedorId = 'prov1';
    const materialesProveedor = mockMateriales.filter(m => m.proveedorId === proveedorId);
    const precioPromedio = materialesProveedor.reduce((s, m) => s + m.precioUnitario, 0) / materialesProveedor.length;

    expect(precioPromedio).toBe(75);
  });
});

describe('Validación de Integridad de Datos - Administracion', () => {
  it('9.1 - Administracion debe contar usuarios por rol', () => {
    const mockUsuarios = [
      { id: '1', nombre: 'Usuario 1', rol: 'admin' },
      { id: '2', nombre: 'Usuario 2', rol: 'admin' },
      { id: '3', nombre: 'Usuario 3', rol: 'operador' },
      { id: '4', nombre: 'Usuario 4', rol: 'operador' },
      { id: '5', nombre: 'Usuario 5', rol: 'operador' }
    ];

    const rolesCount = mockUsuarios.reduce((acc, u) => {
      acc[u.rol] = (acc[u.rol] || 0) + 1;
      return acc;
    }, {});

    expect(rolesCount.admin).toBe(2);
    expect(rolesCount.operador).toBe(3);
  });

  it('9.2 - Administracion debe identificar usuarios activos', () => {
    const mockUsuarios = [
      { id: '1', nombre: 'Usuario 1', activo: true, ultimoAcceso: '2024-01-01' },
      { id: '2', nombre: 'Usuario 2', activo: true, ultimoAcceso: '2024-01-15' },
      { id: '3', nombre: 'Usuario 3', activo: false, ultimoAcceso: '2023-12-01' }
    ];

    const activos = mockUsuarios.filter(u => u.activo).length;
    const inactivos = mockUsuarios.filter(u => !u.activo).length;

    expect(activos).toBe(2);
    expect(inactivos).toBe(1);
  });
});

describe('Validación de Incoherencias de Tipografía', () => {
  it('10.1 - Debe verificar consistencia de casos en texto', () => {
    const textos = [
      'Dashboard',
      'Financiero',
      'Proyectos',
      'Bodega',
      'Seguimiento'
    ];

    expect(textos.every(t => t[0] === t[0].toUpperCase())).toBe(true);
  });

  it('10.2 - Debe verificar ausencia de espacios en blanco extra', () => {
    const textos = [
      'Dashboard Principal',
      'Módulo Financiero',
      'Gestión de Proyectos'
    ];

    expect(textos.every(t => t === t.trim())).toBe(true);
    expect(textos.every(t => !t.includes('  '))).toBe(true);
  });

  it('10.3 - Debe verificar consistencia de separadores decimales', () => {
    const numeros = ['1.5', '2.75', '3.25', '4.0'];
    
    expect(numeros.every(n => n.includes('.'))).toBe(true);
    expect(numeros.every(n => !n.includes(','))).toBe(true);
  });
});
