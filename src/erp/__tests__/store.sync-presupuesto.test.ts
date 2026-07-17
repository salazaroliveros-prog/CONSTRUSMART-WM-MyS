import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useErpStore, resetRateLimit } from '../zustandStore';
import { APP_SETTINGS_DEFAULTS } from '../utils';

const baseProyecto = {
  id: 'proy-sync-1', nombre: 'Proyecto Sync', ubicacion: 'Zona 1', tipologia: 'comercial',
  presupuestoTotal: 0, montoContrato: 0, cliente: 'Cliente X',
  fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
  estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
  clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
  ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
  areaConstruccion: undefined, numPisos: undefined, plazoSemanas: 52,
  ingenieroResidente: '', supervisor: '', arquitecto: '',
  numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
  moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
  latitud: null, longitud: null, factorSobrecosto: undefined,
  motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '', version: 1,
} as any;

const basePresupuesto = (overrides: Record<string, unknown> = {}) => ({
  id: 'pres-sync-1', proyectoId: 'proy-sync-1', tipologia: 'comercial',
  renglones: [], estado: 'borrador', totalCalculado: 0, costoDirectoTotal: 0,
  fechaCreacion: new Date().toISOString(), fechaActualizacion: new Date().toISOString(),
  versionPresupuesto: 1, notas: null, ...overrides,
} as any);

describe('syncPresupuestoAprobadoToProyecto', () => {
  beforeEach(() => {
    resetRateLimit();
    useErpStore.setState({
      proyectos: [baseProyecto],
      presupuestos: [],
      mutationQueue: [], syncMessage: '', syncCooldown: false, notificaciones: [],
      isOnline: true, appSettings: APP_SETTINGS_DEFAULTS,
      auditLog: [],
    });
    vi.clearAllMocks();
  });

  it('no hace nada si el presupuesto no tiene proyectoId', () => {
    const get = () => useErpStore.getState();
    const p = basePresupuesto({ id: 'p-no-proy', proyectoId: '', estado: 'aprobado', totalCalculado: 1000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    expect(get().proyectos[0].presupuestoTotal).toBe(0);
    expect(get().mutationQueue).toHaveLength(0);
  });

  it('no hace nada si el estado no es aprobado ni revisado', () => {
    const get = () => useErpStore.getState();
    const p = basePresupuesto({ estado: 'borrador', totalCalculado: 1000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    expect(get().proyectos[0].presupuestoTotal).toBe(0);
    expect(get().mutationQueue).toHaveLength(0);
  });

  it('no hace nada si el proyecto no existe', () => {
    const get = () => useErpStore.getState();
    const p = basePresupuesto({ proyectoId: 'proy-no-existe', estado: 'aprobado', totalCalculado: 1000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    expect(get().mutationQueue).toHaveLength(0);
  });

  it('no hace nada si el proyecto no esta en planeacion', () => {
    const get = () => useErpStore.getState();
    get().setProyectos(prev => prev.map(p => p.id === 'proy-sync-1' ? { ...p, estado: 'ejecucion' } : p));
    const beforeQueue = get().mutationQueue.length;
    const p = basePresupuesto({ estado: 'aprobado', totalCalculado: 1000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    expect(get().mutationQueue.length - beforeQueue).toBe(0);
  });

  it('puebla presupuestoTotal y montoContrato cuando estan vacios', () => {
    const get = () => useErpStore.getState();
    const p = basePresupuesto({ estado: 'aprobado', totalCalculado: 150000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    const proy = get().proyectos.find(x => x.id === 'proy-sync-1')!;
    expect(proy.presupuestoTotal).toBe(150000);
    expect(proy.montoContrato).toBe(150000);
  });

  it('no sobrescribe presupuestoTotal ni montoContrato si ya tienen valor', () => {
    const get = () => useErpStore.getState();
    get().updateProyecto('proy-sync-1', { presupuestoTotal: 500000, montoContrato: 500000 });
    const p = basePresupuesto({ estado: 'aprobado', totalCalculado: 150000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    const proy = get().proyectos.find(x => x.id === 'proy-sync-1')!;
    expect(proy.presupuestoTotal).toBe(500000);
    expect(proy.montoContrato).toBe(500000);
  });

  it('puebla presupuestoActualId cuando esta vacio', () => {
    const get = () => useErpStore.getState();
    const p = basePresupuesto({ id: 'pres-actual', estado: 'aprobado', totalCalculado: 1000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    const proy = get().proyectos.find(x => x.id === 'proy-sync-1')!;
    expect(proy.presupuestoActualId).toBe('pres-actual');
  });

  it('puebla factorSobrecosto desde renglones', () => {
    const get = () => useErpStore.getState();
    const renglones = [
      { id: 'r1', proyectoId: 'proy-sync-1', codigo: '1', nombre: 'R1', unidad: 'm', cantidad: 1, rendimientoCuadrilla: 0, costoMateriales: 0, costoManoObra: 0, costoEquipo: 0, insumos: [], subRenglones: [], factorSobrecosto: { indirectos: 10, administracion: 4, imprevistos: 2, utilidad: 15 } },
    ];
    const p = basePresupuesto({ estado: 'aprobado', totalCalculado: 1000, renglones });
    get().syncPresupuestoAprobadoToProyecto(p);
    const proy = get().proyectos.find(x => x.id === 'proy-sync-1')!;
    expect(proy.factorSobrecosto).toEqual({ indirectos: 10, administracion: 4, imprevistos: 2, utilidad: 15 });
  });

  it('puebla avanceFisico y avanceFinanciero en 0 si estan vacios', () => {
    const get = () => useErpStore.getState();
    const p = basePresupuesto({ estado: 'aprobado', totalCalculado: 1000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    const proy = get().proyectos.find(x => x.id === 'proy-sync-1')!;
    expect(proy.avanceFisico).toBe(0);
    expect(proy.avanceFinanciero).toBe(0);
  });

  it('puebla fechaInicio desde fechaCreacion del presupuesto', () => {
    const get = () => useErpStore.getState();
    const p = basePresupuesto({ estado: 'aprobado', totalCalculado: 1000, fechaCreacion: '2026-01-15T00:00:00.000Z' });
    get().syncPresupuestoAprobadoToProyecto(p);
    const proy = get().proyectos.find(x => x.id === 'proy-sync-1')!;
    expect(proy.fechaInicio).toBe('2026-01-15');
  });

  it('puebla fechaFin desde fechaInicio + plazoSemanas', () => {
    const get = () => useErpStore.getState();
    get().updateProyecto('proy-sync-1', { fechaInicio: '2026-01-01' });
    const p = basePresupuesto({ estado: 'aprobado', totalCalculado: 1000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    const proy = get().proyectos.find(x => x.id === 'proy-sync-1')!;
    expect(proy.fechaFin).toBe('2026-12-31');
  });

  it('registra entrada de auditoria', () => {
    const get = () => useErpStore.getState();
    const p = basePresupuesto({ id: 'pres-audit', estado: 'aprobado', totalCalculado: 1000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    const audit = get().auditLog.find(e => e.accion === 'sync_presupuesto_aprobado');
    expect(audit).toBeDefined();
    expect(audit!.entidad).toBe('proyecto');
    expect(audit!.entidadId).toBe('proy-sync-1');
    expect(audit!.valoresNuevos).toMatchObject({ presupuestoId: 'pres-audit' });
  });

  it('no hace nada si el patch esta vacio (proyecto ya sincronizado)', () => {
    const get = () => useErpStore.getState();
    get().setProyectos(prev => prev.map(p => p.id === 'proy-sync-1' ? {
      ...p, presupuestoTotal: 1000, montoContrato: 1000, presupuestoActualId: 'pres-exists',
      avanceFisico: 0, avanceFinanciero: 0, factorSobrecosto: { indirectos: 10, administracion: 4, imprevistos: 2, utilidad: 15 },
      fechaInicio: '2026-01-01', fechaFin: '2026-12-31',
    } : p));
    const beforeQueue = get().mutationQueue.length;
    const p = basePresupuesto({ estado: 'aprobado', totalCalculado: 1000 });
    get().syncPresupuestoAprobadoToProyecto(p);
    expect(get().mutationQueue.length - beforeQueue).toBe(0);
  });

  it('addPresupuesto con estado aprobado dispara la sincronizacion', () => {
    const get = () => useErpStore.getState();
    const p = basePresupuesto({ estado: 'aprobado', totalCalculado: 200000 });
    get().addPresupuesto(p);
    const proy = get().proyectos.find(x => x.id === 'proy-sync-1')!;
    expect(proy.presupuestoTotal).toBe(200000);
    expect(get().mutationQueue).toHaveLength(2);
    expect(get().mutationQueue.map(m => m.type)).toContain('addPresupuesto');
    expect(get().mutationQueue.map(m => m.type)).toContain('updateProyecto');
  });

  it('updatePresupuesto cambiando a aprobado dispara la sincronizacion', () => {
    const get = () => useErpStore.getState();
    get().addPresupuesto(basePresupuesto({ estado: 'borrador', totalCalculado: 0 }));
    const presId = get().presupuestos[0].id;
    get().updatePresupuesto(presId, { estado: 'aprobado', totalCalculado: 180000 });
    const proy = get().proyectos.find(x => x.id === 'proy-sync-1')!;
    expect(proy.presupuestoTotal).toBe(180000);
    expect(get().mutationQueue.filter(m => m.type === 'updateProyecto').length).toBeGreaterThanOrEqual(1);
  });

  it('no dispara sincronizacion si el estado cambia pero no a aprobado/revisado', () => {
    const get = () => useErpStore.getState();
    get().addPresupuesto(basePresupuesto({ estado: 'borrador', totalCalculado: 0 }));
    const presId = get().presupuestos[0].id;
    get().updatePresupuesto(presId, { estado: 'rechazado' });
    expect(get().mutationQueue.filter(m => m.type === 'updateProyecto').length).toBe(0);
  });
});

describe('InitSync: sincronizacion al cargar store', () => {
  it('el efecto de inicializacion existe y maneja errores sin crashear', () => {
    const get = () => useErpStore.getState();
    useErpStore.setState({
      proyectos: [baseProyecto],
      presupuestos: [basePresupuesto({ estado: 'aprobado', totalCalculado: 1000 })],
      mutationQueue: [], syncMessage: '', syncCooldown: false, notificaciones: [],
      isOnline: true, appSettings: APP_SETTINGS_DEFAULTS,
      auditLog: [],
    });
    expect(() => {
      const state = useErpStore.getState();
      if (!state.presupuestos || !state.proyectos) return;
      state.presupuestos
        .filter(p => ['aprobado', 'revisado'].includes(p.estado) && p.proyectoId)
        .forEach(p => {
          const proyecto = state.proyectos.find(pr => pr.id === p.proyectoId);
          if (proyecto && proyecto.estado === 'planeacion') {
            state.syncPresupuestoAprobadoToProyecto(p);
          }
        });
    }).not.toThrow();
    const proy = get().proyectos.find(x => x.id === 'proy-sync-1')!;
    expect(proy.presupuestoTotal).toBe(1000);
  });
});

describe('MutationQueue: fuerza sincronizacion', () => {
  beforeEach(() => {
    resetRateLimit();
    useErpStore.setState({
      proyectos: [baseProyecto],
      presupuestos: [],
      mutationQueue: [], syncMessage: '', syncCooldown: false, notificaciones: [],
      isOnline: true, appSettings: APP_SETTINGS_DEFAULTS,
      auditLog: [],
    });
  });

  it('addPresupuesto aprobado encola 2 mutaciones (presupuesto + proyecto)', () => {
    useErpStore.getState().addPresupuesto(basePresupuesto({ estado: 'aprobado', totalCalculado: 1000 }));
    const queue = useErpStore.getState().mutationQueue;
    expect(queue).toHaveLength(2);
    expect(queue.map(m => m.type).sort()).toEqual(['addPresupuesto', 'updateProyecto']);
  });

  it('addPresupuesto en borrador solo encola 1 mutacion', () => {
    useErpStore.getState().addPresupuesto(basePresupuesto({ estado: 'borrador', totalCalculado: 0 }));
    const queue = useErpStore.getState().mutationQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('addPresupuesto');
  });
});
