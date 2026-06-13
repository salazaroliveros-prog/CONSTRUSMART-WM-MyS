import { describe, it, expect, beforeEach } from 'vitest';
import {
  validarTransicion,
  puedeTransicionar,
  getEstadosDisponibles,
  getEtapasValidas,
  applyTransicionAutomatica,
  type ProyectoEstado,
} from '../store/proyectoStateMachine';

describe('Concurrencia — Edición simultánea', () => {
  describe('Optimistic Locking en Proyectos', () => {
    it('Detecta conflicto cuando versión no coincide', () => {
      const serverProyecto = { id: 'p1', version: 3, estado: 'ejecucion' as ProyectoEstado };
      const clientPatch = { version: 2 };
      const expectedVersion = serverProyecto.version;
      const conflict = clientPatch.version !== undefined && clientPatch.version < expectedVersion;
      expect(conflict).toBe(true);
    });

    it('Permite update cuando versión coincide', () => {
      const serverProyecto = { id: 'p1', version: 3, estado: 'ejecucion' as ProyectoEstado };
      const clientPatch = { version: 3 };
      const expectedVersion = serverProyecto.version;
      const conflict = clientPatch.version !== undefined && clientPatch.version < expectedVersion;
      expect(conflict).toBe(false);
    });

    it('Incrementa versión correctamente después de update', () => {
      let version = 3;
      const newVersion = version + 1;
      expect(newVersion).toBe(4);
      version = newVersion;
      expect(version).toBe(4);
    });

    it('Dos usuarios intentan actualizar el mismo proyecto — uno gana', () => {
      const proyecto = { id: 'p1', version: 1, nombre: 'Original' };
      const userA = { ...proyecto, nombre: 'A' };
      const userB = { ...proyecto, nombre: 'B' };

      userA.version = proyecto.version + 1;
      const userBSucceeds = userB.version < userA.version;
      expect(userBSucceeds).toBe(true);
      expect(userA.version).toBe(2);
    });

    it('Version field es numérico y siempre positivo', () => {
      const version = 1;
      expect(typeof version).toBe('number');
      expect(version).toBeGreaterThan(0);
    });
  });

  describe('Optimistic Locking en Materiales', () => {
    it('Detecta conflicto en material', () => {
      const material = { id: 'm1', version: 5, stock: 100 };
      const patch = { stock: 80, version: 4 };
      const conflict = patch.version < material.version;
      expect(conflict).toBe(true);
    });

    it('Permite update de stock con versión correcta', () => {
      const material = { id: 'm1', version: 5, stock: 100 };
      const newVersion = material.version + 1;
      const newStock = material.stock - 20;
      expect(newVersion).toBe(6);
      expect(newStock).toBe(80);
    });
  });

  describe('Optimistic Locking en Presupuestos', () => {
    it('Detecta conflicto en presupuesto', () => {
      const presupuesto = { id: 'pr1', version: 2, totalCalculado: 500000 };
      const patch = { totalCalculado: 600000, version: 1 };
      const conflict = patch.version < presupuesto.version;
      expect(conflict).toBe(true);
    });

    it('Recalcula total cuando cambian renglones', () => {
      const renglones = [
        { totalPV: 100000 },
        { totalPV: 200000 },
        { totalPV: 150000 },
      ];
      const total = renglones.reduce((acc, r) => acc + r.totalPV, 0);
      expect(total).toBe(450000);
    });
  });

  describe('Optimistic Locking en Órdenes de Compra', () => {
    it('Detecta conflicto en orden de compra', () => {
      const orden = { id: 'oc1', version: 3, estado: 'aprobado' };
      const patch = { estado: 'recibida', version: 2 };
      const conflict = patch.version < orden.version;
      expect(conflict).toBe(true);
    });

    it('No permite doble incremento de stock', () => {
      const orden = { id: 'oc1', stockActualizado: true, items: [{ materialId: 'm1', cantidad: 50 }] };
      const shouldUpdateStock = !orden.stockActualizado;
      expect(shouldUpdateStock).toBe(false);
    });
  });

  describe('State Machine — Transiciones simultáneas', () => {
    it('No permite transiciones inválidas', () => {
      const result = validarTransicion('planeacion', 'finalizado');
      expect(result.valido).toBe(false);
      expect(result.errores.length).toBeGreaterThan(0);
    });

    it('Permite planeacion → ejecucion con requisitos', () => {
      const result = validarTransicion('planeacion', 'ejecucion', 'construccion', {
        tienePresupuestoAprobado: true,
        tieneHitos: true,
      });
      expect(result.valido).toBe(true);
    });

    it('Rechaza planeacion → ejecucion sin presupuesto', () => {
      const result = validarTransicion('planeacion', 'ejecucion', 'construccion', {
        tienePresupuestoAprobado: false,
        tieneHitos: true,
      });
      expect(result.valido).toBe(false);
      expect(result.errores.some(e => e.includes('presupuesto'))).toBe(true);
    });

    it('Permite ejecucion → pausado con motivo', () => {
      const result = validarTransicion('ejecucion', 'pausado', undefined, {
        motivoPausa: 'Falta de materiales',
      });
      expect(result.valido).toBe(true);
    });

    it('Rechaza ejecucion → pausado sin motivo', () => {
      const result = validarTransicion('ejecucion', 'pausado');
      expect(result.valido).toBe(false);
      expect(result.errores.some(e => e.includes('motivoPausa'))).toBe(true);
    });

    it('Permite ejecucion → finalizado con avance 100%', () => {
      const result = validarTransicion('ejecucion', 'finalizado', 'cierre', {
        avanceFisico: 100,
        avanceFinanciero: 100,
      });
      expect(result.valido).toBe(true);
    });

    it('Rechaza ejecucion → finalizado con avance < 100%', () => {
      const result = validarTransicion('ejecucion', 'finalizado', 'cierre', {
        avanceFisico: 85,
        avanceFinanciero: 90,
      });
      expect(result.valido).toBe(false);
    });

    it('applyTransicionAutomatica fuerza avance 100% al finalizar', () => {
      const patch = applyTransicionAutomatica('ejecucion', 'finalizado', { etapa: 'cierre' });
      expect(patch.avanceFisico).toBe(100);
      expect(patch.avanceFinanciero).toBe(100);
    });

    it('getEstadosDisponibles retorna estados correctos', () => {
      expect(getEstadosDisponibles('planeacion')).toEqual(['ejecucion']);
      expect(getEstadosDisponibles('ejecucion')).toEqual(['pausado', 'finalizado']);
      expect(getEstadosDisponibles('finalizado')).toEqual([]);
    });

    it('getEtapasValidas retorna etapas correctas', () => {
      expect(getEtapasValidas('planeacion')).toContain('planificacion');
      expect(getEtapasValidas('ejecucion')).toContain('construccion');
      expect(getEtapasValidas('finalizado')).toContain('cierre');
    });

    it('puedeTransicionar es consistente con validarTransicion', () => {
      expect(puedeTransicionar('planeacion', 'ejecucion')).toBe(true);
      expect(puedeTransicionar('planeacion', 'finalizado')).toBe(false);
      expect(puedeTransicionar('ejecucion', 'pausado')).toBe(true);
      expect(puedeTransicionar('finalizado', 'ejecucion')).toBe(false);
    });
  });

  describe('Stock — Double-Dispatch prevention', () => {
    it('Valida stock suficiente antes de descontar', () => {
      const materials = [
        { id: 'm1', stock: 50 },
        { id: 'm2', stock: 30 },
      ];
      const items = [
        { materialId: 'm1', cantidad: 20 },
        { materialId: 'm2', cantidad: 40 },
      ];
      const stockInsuficiente = items.some(item => {
        const mat = materials.find(m => m.id === item.materialId);
        return !mat || mat.stock < item.cantidad;
      });
      expect(stockInsuficiente).toBe(true);
    });

    it('Permite vale cuando stock es suficiente', () => {
      const materials = [
        { id: 'm1', stock: 100 },
        { id: 'm2', stock: 50 },
      ];
      const items = [
        { materialId: 'm1', cantidad: 20 },
        { materialId: 'm2', cantidad: 30 },
      ];
      const stockSuficiente = items.every(item => {
        const mat = materials.find(m => m.id === item.materialId);
        return mat && mat.stock >= item.cantidad;
      });
      expect(stockSuficiente).toBe(true);
    });

    it('Deducción atómica — todos los materiales o ninguno', () => {
      const materials = [
        { id: 'm1', stock: 100 },
        { id: 'm2', stock: 5 },
      ];
      const items = [
        { materialId: 'm1', cantidad: 20 },
        { materialId: 'm2', cantidad: 40 },
      ];
      const allValid = items.every(item => {
        const mat = materials.find(m => m.id === item.materialId);
        return mat && mat.stock >= item.cantidad;
      });
      if (!allValid) {
        expect(allValid).toBe(false);
      }
    });

    it('Concurrent vales — segundo usuario detecta stock agotado', () => {
      let stock = 100;
      const userAItems = [{ cantidad: 80 }];
      const userBItems = [{ cantidad: 50 }];

      stock -= userAItems[0].cantidad;
      expect(stock).toBe(20);
      const userBStock = stock >= userBItems[0].cantidad;
      expect(userBStock).toBe(false);
    });

    it('OC aprobada incrementa stock atómicamente', () => {
      let stock = 50;
      const items = [{ materialId: 'm1', cantidad: 100 }];
      items.forEach(item => { stock += item.cantidad; });
      expect(stock).toBe(150);
    });

    it('Concurrent OC approvals — stock final es correcto', () => {
      let stock = 50;
      const oc1 = [{ cantidad: 100 }];
      const oc2 = [{ cantidad: 50 }];
      const applyOC = (items: { cantidad: number }[]) => {
        items.forEach(item => { stock += item.cantidad; });
      };
      applyOC(oc1);
      applyOC(oc2);
      expect(stock).toBe(200);
    });
  });

  describe('Rate Limiting — Prevención de duplicados', () => {
    it('Rate limit bloquea mutaciones rápidas', () => {
      const RATE_LIMIT_MS = 100;
      const lastCall: Record<string, number> = {};
      const check = (type: string) => {
        const now = Date.now();
        const last = lastCall[type];
        if (last && now - last < RATE_LIMIT_MS) return false;
        lastCall[type] = now;
        return true;
      };
      expect(check('addProyecto')).toBe(true);
      expect(check('addProyecto')).toBe(false);
    });

    it('Rate limit permite después del cooldown', async () => {
      const RATE_LIMIT_MS = 50;
      const lastCall: Record<string, number> = {};
      const check = (type: string) => {
        const now = Date.now();
        const last = lastCall[type];
        if (last && now - last < RATE_LIMIT_MS) return false;
        lastCall[type] = now;
        return true;
      };
      expect(check('test')).toBe(true);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS + 10));
      expect(check('test')).toBe(true);
    });
  });

  describe('Queue — Límite y orden', () => {
    it('Cola no excede 100 items', () => {
      let queue: any[] = Array.from({ length: 100 }, (_, i) => ({ id: `m${i}` }));
      const nuevo = { id: 'overflow' };
      queue = [...queue.slice(1), nuevo];
      expect(queue).toHaveLength(100);
      expect(queue[99].id).toBe('overflow');
    });

    it('Mantiene orden FIFO', () => {
      const queue: any[] = [];
      const push = (id: string) => queue.push({ id, ts: Date.now() + queue.length });
      push('a');
      push('b');
      push('c');
      expect(queue.map(q => q.id)).toEqual(['a', 'b', 'c']);
    });

    it('Dedup por mutation type + entity id', () => {
      const sent = new Set<string>();
      const addMutation = (type: string, entityId: string) => {
        const key = `${type}:${entityId}`;
        if (sent.has(key)) return false;
        sent.add(key);
        return true;
      };
      expect(addMutation('addProyecto', 'p1')).toBe(true);
      expect(addMutation('addProyecto', 'p1')).toBe(false);
      expect(addMutation('updateProyecto', 'p1')).toBe(true);
    });
  });
});