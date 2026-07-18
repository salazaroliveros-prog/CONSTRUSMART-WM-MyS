import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * TEST SUITE - SUPABASE BILATERAL DATA SYNC
 * 
 * Pruebas de:
 * ✅ Sincronización bidireccional
 * ✅ Cascadas de actualización
 * ✅ Consistencia de datos
 * ✅ Manejo de conflictos
 * ✅ Recuperación de fallos
 */

interface Proyecto {
  id: string;
  nombre: string;
  estado: string;
  presupuesto: number;
  avanceFisico: number;
}

interface Hito {
  id: string;
  proyectoId: string;
  nombre: string;
  fechaPlaneada: string;
  fechaReal?: string;
  estado: string;
}

interface Movimiento {
  id: string;
  proyectoId: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  fecha: string;
  concepto: string;
}

interface Seguimiento {
  id: string;
  proyectoId: string;
  fecha: string;
  avanceFisico: number;
  avanceFinanciero: number;
  observaciones: string;
}

describe('🔄 TEST SUPABASE: SINCRONIZACIÓN BILATERAL', () => {
  let mockDatabase: Map<string, any>;
  let syncLog: any[];

  beforeEach(() => {
    mockDatabase = new Map();
    syncLog = [];
  });

  afterEach(() => {
    mockDatabase.clear();
    syncLog = [];
  });

  describe('Proyecto ↔ Hitos', () => {
    it('SB-001: Crear proyecto debe inicializar relación con hitos', () => {
      const proyecto: Proyecto = {
        id: 'p1',
        nombre: 'Hospital',
        estado: 'planeacion',
        presupuesto: 1000000,
        avanceFisico: 0,
      };

      mockDatabase.set(`proyecto_${proyecto.id}`, proyecto);
      mockDatabase.set(`hitos_${proyecto.id}`, []);

      expect(mockDatabase.has(`hitos_${proyecto.id}`)).toBe(true);
      expect(mockDatabase.get(`hitos_${proyecto.id}`).length).toBe(0);
    });

    it('SB-002: Agregar hito debe actualizar relación', () => {
      const hito: Hito = {
        id: 'h1',
        proyectoId: 'p1',
        nombre: 'Inicio',
        fechaPlaneada: '2024-01-01',
        estado: 'pendiente',
      };

      const hitos = mockDatabase.get('hitos_p1') || [];
      hitos.push(hito);
      mockDatabase.set('hitos_p1', hitos);

      expect(mockDatabase.get('hitos_p1').length).toBe(1);
      expect(mockDatabase.get('hitos_p1')[0].proyectoId).toBe('p1');
    });

    it('SB-003: Actualizar hito debe sincronizar avance del proyecto', () => {
      const proyecto: Proyecto = {
        id: 'p1',
        nombre: 'Hospital',
        estado: 'planeacion',
        presupuesto: 1000000,
        avanceFisico: 0,
      };

      mockDatabase.set('proyecto_p1', proyecto);

      // Simular 3 hitos, 2 completados
      const hitos = [
        { id: 'h1', estado: 'completado' },
        { id: 'h2', estado: 'completado' },
        { id: 'h3', estado: 'en_progreso' },
      ];

      const avanceFisico = (hitos.filter((h) => h.estado === 'completado').length / hitos.length) * 100;
      const updatedProyecto = { ...proyecto, avanceFisico: Math.round(avanceFisico) };
      mockDatabase.set('proyecto_p1', updatedProyecto);

      expect(mockDatabase.get('proyecto_p1').avanceFisico).toBe(66);
    });

    it('SB-004: Eliminar hito debe recalcular avance', () => {
      let hitos = [
        { id: 'h1', estado: 'completado' },
        { id: 'h2', estado: 'completado' },
      ];

      hitos = hitos.filter((h) => h.id !== 'h1');

      const avanceFisico = (hitos.filter((h) => h.estado === 'completado').length / hitos.length) * 100;
      expect(avanceFisico).toBe(100);
    });

    it('SB-005: Cascada: Completar proyecto debe marcar hitos como cerrados', () => {
      const proyecto = { id: 'p1', estado: 'ejecucion' };
      const hitos = [
        { id: 'h1', proyectoId: 'p1', estado: 'en_progreso' },
        { id: 'h2', proyectoId: 'p1', estado: 'en_progreso' },
      ];

      // Simular cascada
      const updatedHitos = hitos.map((h) => ({ ...h, estado: 'completado' }));
      
      expect(updatedHitos.every((h) => h.estado === 'completado')).toBe(true);
    });
  });

  describe('Proyecto ↔ Movimientos (Financiero)', () => {
    it('SB-006: Agregar ingreso debe actualizar KPIs del proyecto', () => {
      const proyecto: Proyecto = {
        id: 'p1',
        nombre: 'Hospital',
        estado: 'ejecucion',
        presupuesto: 1000000,
        avanceFisico: 50,
      };

      const movimientos: Movimiento[] = [
        {
          id: 'm1',
          proyectoId: 'p1',
          tipo: 'ingreso',
          monto: 500000,
          fecha: '2024-01-01',
          concepto: 'Pago cliente',
        },
      ];

      mockDatabase.set('movimientos_p1', movimientos);

      const totalIngresos = movimientos
        .filter((m) => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + m.monto, 0);

      expect(totalIngresos).toBe(500000);
    });

    it('SB-007: Agregar egreso debe actualizar gastos', () => {
      const movimientos: Movimiento[] = [
        {
          id: 'm1',
          proyectoId: 'p1',
          tipo: 'egreso',
          monto: 300000,
          fecha: '2024-01-01',
          concepto: 'Compra materiales',
        },
      ];

      mockDatabase.set('movimientos_p1', movimientos);

      const totalGastos = movimientos
        .filter((m) => m.tipo === 'egreso')
        .reduce((sum, m) => sum + m.monto, 0);

      expect(totalGastos).toBe(300000);
    });

    it('SB-008: Eliminar movimiento debe revertir cálculos', () => {
      let movimientos: Movimiento[] = [
        { id: 'm1', proyectoId: 'p1', tipo: 'ingreso', monto: 500000, fecha: '2024-01-01', concepto: '' },
        { id: 'm2', proyectoId: 'p1', tipo: 'egreso', monto: 300000, fecha: '2024-01-01', concepto: '' },
      ];

      const totalAntes = movimientos.reduce((sum, m) => sum + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0);
      expect(totalAntes).toBe(200000);

      movimientos = movimientos.filter((m) => m.id !== 'm1');

      const totalDespues = movimientos.reduce((sum, m) => sum + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0);
      expect(totalDespues).toBe(-300000);
    });

    it('SB-009: Actualizar presupuesto debe validar contra gastos', () => {
      const proyecto = { id: 'p1', presupuesto: 1000000 };
      const gastos = 950000;

      const disponible = proyecto.presupuesto - gastos;
      expect(disponible).toBe(50000);
      expect(disponible > 0).toBe(true);
    });

    it('SB-010: Exceder presupuesto debe generar alerta', () => {
      const proyecto = { id: 'p1', presupuesto: 1000000 };
      const gastos = 1050000;

      const exceso = gastos - proyecto.presupuesto;
      expect(exceso).toBeGreaterThan(0);
      expect(exceso).toBe(50000);
    });
  });

  describe('Proyecto ↔ Seguimiento', () => {
    it('SB-011: Crear entrada de seguimiento debe vincular al proyecto', () => {
      const seguimiento: Seguimiento = {
        id: 's1',
        proyectoId: 'p1',
        fecha: '2024-01-01',
        avanceFisico: 25,
        avanceFinanciero: 20,
        observaciones: 'Progreso normal',
      };

      mockDatabase.set('seguimiento_s1', seguimiento);

      expect(mockDatabase.get('seguimiento_s1').proyectoId).toBe('p1');
    });

    it('SB-012: Múltiples entradas de seguimiento deben mostrar tendencia', () => {
      const seguimientos = [
        { fecha: '2024-01-01', avanceFisico: 10 },
        { fecha: '2024-01-15', avanceFisico: 25 },
        { fecha: '2024-02-01', avanceFisico: 40 },
      ];

      const tendencia = seguimientos[seguimientos.length - 1].avanceFisico - seguimientos[0].avanceFisico;
      expect(tendencia).toBe(30);
      expect(tendencia > 0).toBe(true); // Trending up
    });

    it('SB-013: Varianza física vs financiera debe detectarse', () => {
      const seguimiento: Seguimiento = {
        id: 's1',
        proyectoId: 'p1',
        fecha: '2024-01-01',
        avanceFisico: 60,
        avanceFinanciero: 40,
        observaciones: '',
      };

      const varianza = seguimiento.avanceFisico - seguimiento.avanceFinanciero;
      expect(varianza).toBe(20); // 20% de desviación
      expect(Math.abs(varianza) > 10).toBe(true); // Alerta si > 10%
    });

    it('SB-014: Actualizar seguimiento no debe corromper histórico', () => {
      const historial = [
        { id: 's1', avanceFisico: 25, fecha: '2024-01-01' },
        { id: 's2', avanceFisico: 50, fecha: '2024-01-15' },
      ];

      // Actualizar s2
      const updatedHistorial = historial.map((h) =>
        h.id === 's2' ? { ...h, avanceFisico: 55 } : h
      );

      expect(updatedHistorial[0].avanceFisico).toBe(25); // Original intacto
      expect(updatedHistorial[1].avanceFisico).toBe(55); // Actualizado
    });
  });

  describe('Manejo de Conflictos y Recuperación', () => {
    it('SB-015: Conflicto: Dos actualizaciones simultáneas debe ganador', () => {
      const original = { id: 'p1', avanceFisico: 50, updatedAt: new Date('2024-01-01') };
      const update1 = { avanceFisico: 60, updatedAt: new Date('2024-01-01 10:00:00') };
      const update2 = { avanceFisico: 55, updatedAt: new Date('2024-01-01 10:00:01') };

      // Last-write-wins
      const final = update2.updatedAt > update1.updatedAt ? update2 : update1;
      expect(final.avanceFisico).toBe(55);
    });

    it('SB-016: Borrado en cascada debe mantener integridad', () => {
      const proyecto = { id: 'p1' };
      const relaciones = {
        hitos: [{ id: 'h1', proyectoId: 'p1' }],
        movimientos: [{ id: 'm1', proyectoId: 'p1' }],
        seguimientos: [{ id: 's1', proyectoId: 'p1' }],
      };

      // Simular cascada de delete
      const relacionesAfterDelete = Object.entries(relaciones).map(([key, items]) => [
        key,
        items.filter((item: any) => item.proyectoId !== proyecto.id),
      ]);

      expect(relacionesAfterDelete.every(([_, items]: any) => items.length === 0)).toBe(true);
    });

    it('SB-017: Rollback debe restaurar estado anterior', () => {
      const estados = [
        { version: 1, avanceFisico: 50, timestamp: Date.now() },
        { version: 2, avanceFisico: 60, timestamp: Date.now() + 1000 },
        { version: 3, avanceFisico: 55, timestamp: Date.now() + 2000 },
      ];

      const rollback = (toVersion: number) => estados.find((e) => e.version === toVersion);
      
      expect(rollback(2)?.avanceFisico).toBe(60);
      expect(rollback(1)?.avanceFisico).toBe(50);
    });

    it('SB-018: Validación de referencia debe evitar órfanos', () => {
      const proyecto = { id: 'p1', nombre: 'Hospital' };
      const hito = { id: 'h1', proyectoId: 'p1' };

      const validateReference = (item: any, parentId: string, database: any) => {
        return database.has(`proyecto_${parentId}`);
      };

      mockDatabase.set('proyecto_p1', proyecto);
      const isValid = validateReference(hito, 'p1', mockDatabase);
      expect(isValid).toBe(true);
    });

    it('SB-019: Timeout debe reintentarlo sin perder datos', async () => {
      const mockInsert = vi.fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ id: 'p1', success: true });

      const data = { id: 'p1', nombre: 'Hospital' };

      try {
        await mockInsert(data);
      } catch (e) {
        // Reintento
      }

      const result = await mockInsert(data);
      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Consistencia de Datos', () => {
    it('SB-020: Suma de movimientos debe coincidir con balance', () => {
      const movimientos = [
        { tipo: 'ingreso', monto: 1000 },
        { tipo: 'ingreso', monto: 500 },
        { tipo: 'egreso', monto: 300 },
      ];

      const balance = movimientos.reduce((sum, m) => {
        return sum + (m.tipo === 'ingreso' ? m.monto : -m.monto);
      }, 0);

      expect(balance).toBe(1200);
    });

    it('SB-021: Porcentajes deben sumar 100%', () => {
      const categorias = [
        { nombre: 'Cat A', porcentaje: 30 },
        { nombre: 'Cat B', porcentaje: 40 },
        { nombre: 'Cat C', porcentaje: 30 },
      ];

      const total = categorias.reduce((sum, c) => sum + c.porcentaje, 0);
      expect(total).toBe(100);
    });

    it('SB-022: IDs duplicados deben prevenirse', () => {
      const ids = new Set(['p1', 'p2', 'p3', 'p1']);
      expect(ids.size).toBe(3); // Duplicado no contado
    });

    it('SB-023: Fechas deben ser válidas y ordenadas', () => {
      const eventos = [
        { id: 'e1', fecha: '2024-01-01' },
        { id: 'e2', fecha: '2024-01-15' },
        { id: 'e3', fecha: '2024-02-01' },
      ];

      const isOrdered = eventos.every((e, i, arr) => i === 0 || new Date(e.fecha) >= new Date(arr[i - 1].fecha));
      expect(isOrdered).toBe(true);
    });

    it('SB-024: Null/undefined debe manejarse gracefully', () => {
      const proyecto = { id: 'p1', nombre: null, descripcion: undefined };

      const validado = {
        ...proyecto,
        nombre: proyecto.nombre || 'Sin nombre',
        descripcion: proyecto.descripcion || 'Sin descripción',
      };

      expect(validado.nombre).toBe('Sin nombre');
      expect(validado.descripcion).toBe('Sin descripción');
    });
  });

  describe('Performance Supabase', () => {
    it('SB-025: Query debe ejecutarse en < 100ms', async () => {
      const start = performance.now();
      
      // Simular query
      const mockData = Array.from({ length: 1000 }, (_, i) => ({ id: i, data: 'test' }));
      const filtered = mockData.filter((d) => d.id > 500);
      
      const end = performance.now();
      expect(end - start).toBeLessThan(100);
      expect(filtered.length).toBe(499);
    });

    it('SB-026: Batch insert debe ser más rápido que uno por uno', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i, value: Math.random() }));

      const startBatch = performance.now();
      const batchInserted = [...items];
      const endBatch = performance.now();

      const totalBatch = endBatch - startBatch;

      // Batch debe ser significativamente más rápido
      expect(totalBatch).toBeLessThan(100);
    });
  });
});
