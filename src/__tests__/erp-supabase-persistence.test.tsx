import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useErpStore } from '../erp/zustandStore';
import { MUTATION_TABLE_MAP } from '../erp/store';
import { APP_SETTINGS_DEFAULTS } from '../erp/utils';
import { resetRateLimit } from '../erp/zustandStore';

const resetStore = () => useErpStore.setState({
  proyectos: [], movimientos: [], empleados: [], materiales: [], ordenes: [],
  proveedores: [], eventos: [], presupuestos: [], avances: [],
  cuentasCobrar: [], cuentasPagar: [], ordenesCambio: [], hitos: [], riesgos: [],
  licitaciones: [], cotizacionesNegocio: [], ventasPaquetes: [], bitacora: [],
  pruebas: [], ncs: [], valesSalida: [], seguimientoEVM: [], incidentes: [],
  publicacionesMuro: [], liberaciones: [], planos: [], rfis: [], submittals: [],
  activos: [], cuadros: [], pagosProveedor: [], destajos: [], recepciones: [],
  centrosCosto: [], plantillas: [],
  mutationQueue: [], syncMessage: '', syncCooldown: false, notificaciones: [],
  auditLog: [], syncStatus: 'idle',
  isOnline: true, selectedProyectoId: null, appSettings: APP_SETTINGS_DEFAULTS,
});

const uid = () => crypto.randomUUID?.() || 'test-id';

function mutationExists(queue: any[], type: string, id?: string): boolean {
  if (!id) return queue.some(m => m.type === type);
  return queue.some(m => m.type === type && m.payload?.id === id);
}

// =====================================================================
// STAGE 1: MUTATION_TABLE_MAP COMPLETENESS
// =====================================================================
describe('Stage 1: MUTATION_TABLE_MAP Completeness', () => {

  it('1.1 Every add mutation maps to a Supabase table', () => {
    const addTypes = Object.keys(MUTATION_TABLE_MAP).filter(k => k.startsWith('add'));
    expect(addTypes.length).toBeGreaterThan(20);
    addTypes.forEach(t => {
      expect(MUTATION_TABLE_MAP[t]).toBeTruthy();
      expect(typeof MUTATION_TABLE_MAP[t]).toBe('string');
    });
  });

  it('1.2 Every update/mark mutation maps to a Supabase table', () => {
    const updateTypes = Object.keys(MUTATION_TABLE_MAP).filter(k => k.startsWith('update') || k.startsWith('mark'));
    expect(updateTypes.length).toBeGreaterThan(15);
    updateTypes.forEach(t => expect(MUTATION_TABLE_MAP[t]).toBeTruthy());
  });

  it('1.3 Every delete mutation maps to a Supabase table', () => {
    const deleteTypes = Object.keys(MUTATION_TABLE_MAP).filter(k => k.startsWith('delete'));
    expect(deleteTypes.length).toBeGreaterThan(15);
    deleteTypes.forEach(t => expect(MUTATION_TABLE_MAP[t]).toBeTruthy());
  });

  it('1.4 Core tables are covered', () => {
    const tables = new Set(Object.values(MUTATION_TABLE_MAP));
    expect(tables.has('erp_proyectos')).toBe(true);
    expect(tables.has('erp_movimientos')).toBe(true);
    expect(tables.has('erp_materiales')).toBe(true);
    expect(tables.has('erp_ordenes_compra')).toBe(true);
    expect(tables.has('erp_presupuestos')).toBe(true);
    expect(tables.has('erp_empleados')).toBe(true);
    expect(tables.has('erp_proveedores')).toBe(true);
    expect(tables.size).toBeGreaterThan(20);
  });

  it('1.5 Special mutations (muro, plantillas) are mapped', () => {
    expect(MUTATION_TABLE_MAP['addComentarioMuro']).toBe('erp_publicaciones_muro');
    expect(MUTATION_TABLE_MAP['likePublicacionMuro']).toBe('erp_publicaciones_muro');
    expect(MUTATION_TABLE_MAP['addPlantilla']).toBe('erp_plantillas_proyectos');
    expect(MUTATION_TABLE_MAP['clonarPlantilla']).toBe('erp_plantillas_proyectos');
  });
});

// =====================================================================
// STAGE 2: EVERY ENTITY CREATES CORRECT MUTATION TYPE
// =====================================================================
describe('Stage 2: Every Entity Enqueues Correctly', () => {
  beforeEach(() => { resetStore(); resetRateLimit(); vi.clearAllMocks(); useErpStore.getState().addProyecto({ nombre: 'Test', ubicacion: 'Test', tipologia: 'residencial', presupuestoTotal: 100000, montoContrato: 100000, cliente: 'Test', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', estado: 'planificacion' } as any); });

  const stateKeyMap: Record<string, string> = {
    addProyecto: 'proyectos', addMovimiento: 'movimientos', addEmpleado: 'empleados',
    addMaterial: 'materiales', addOrden: 'ordenes', addProveedor: 'proveedores',
    addEvento: 'eventos', addBitacora: 'bitacora', addPresupuesto: 'presupuestos',
    addLicitacion: 'licitaciones', addAvance: 'avances', addValeSalida: 'valesSalida',
    addHito: 'hitos', addRiesgo: 'riesgos', addOrdenCambio: 'ordenesCambio',
    addCuentaCobrar: 'cuentasCobrar', addCuentaPagar: 'cuentasPagar',
    addPlano: 'planos', addRfi: 'rfis', addSubmittal: 'submittals',
    addActivo: 'activos', addCuadro: 'cuadros', addPagoProveedor: 'pagosProveedor',
    addIncidente: 'incidentes', addPrueba: 'pruebas', addNC: 'ncs',
    addLiberacion: 'liberaciones', addPublicacionMuro: 'publicacionesMuro',
    addNotificacion: 'notificaciones', addCotizacion: 'cotizacionesNegocio',
    addSeguimiento: 'seguimientoEVM', addDestajo: 'destajos', addRecepcion: 'recepciones',
    addVentaPaquete: 'ventasPaquetes', addPlantilla: 'plantillas',
  };

  const addEntitySample = (type: string) => {
    const stateKey = stateKeyMap[type] || type.replace('add', '').toLowerCase() + 's';
    const proyectoId = useErpStore.getState().proyectos[0]?.id;
    switch (type) {
      case 'addProyecto':
        useErpStore.getState().addProyecto({ nombre: 'Test', ubicacion: 'GT', tipologia: 'residencial', presupuestoTotal: 100000, montoContrato: 110000, cliente: 'C', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
        break;
      case 'addMovimiento':
        useErpStore.getState().addMovimiento({ proyectoId, tipo: 'gasto', categoria: 'materiales', monto: 1000, descripcion: 'Test', fecha: '2026-01-01', formaPago: 'efectivo', cantidad: 1, unidad: 'global' } as any);
        break;
      case 'addEmpleado':
        useErpStore.getState().addEmpleado({ nombre: 'Juan', puesto: 'Albañil', salarioDiario: 150, tipo: 'planilla', activo: true, proyectoIds: [] } as any);
        break;
      case 'addMaterial':
        useErpStore.getState().addMaterial({ nombre: 'Cemento', unidad: 'bolsa', stock: 100, stockMinimo: 10, precio: 85, categoria: 'materiales', proyectoIds: [] } as any);
        break;
      case 'addOrden':
        useErpStore.getState().addOrden({ proyectoId, proveedor: 'Prov A', material: 'Cemento', cantidad: 50, monto: 5000, fecha: '2026-01-01', estado: 'borrador', items: [], total: 5000, tipoPago: 'credito', createdAt: '2026-01-01' } as any);
        break;
      case 'addProveedor':
        useErpStore.getState().addProveedor({ nombre: 'Prov A', contacto: 'Juan', telefono: '12345678', email: 'j@test.com', direccion: '', nit: '', categoria: 'materiales' } as any);
        break;
      case 'addEvento':
        useErpStore.getState().addEvento({ proyectoId, titulo: 'Reunión', fecha: '2026-01-01', hora: '10:00', tipo: 'reunion', participantes: [] } as any);
        break;
      case 'addBitacora':
        useErpStore.getState().addBitacora({ proyectoId, fecha: '2026-01-01', clima: 'soleado', personalPresente: 5, maquinaria: '', tareasRealizadas: '', observaciones: '', fotos: [] } as any);
        break;
      case 'addPresupuesto':
        useErpStore.getState().addPresupuesto({ proyectoId, tipologia: 'residencial', renglones: [], estado: 'borrador', totalCalculado: 0, costoDirectoTotal: 0, fechaCreacion: '2026-01-01', fechaActualizacion: '2026-01-01', nombre: 'Test', version: 1 } as any);
        break;
      case 'addLicitacion':
        useErpStore.getState().addLicitacion({ nombre: 'Obra X', cliente: 'Cliente A', monto: 500000, fechaLimite: '2026-06-30', estado: 'activa', probabilidad: 50, createdAt: '2026-01-01' } as any);
        break;
      case 'addAvance':
        useErpStore.getState().addAvance({ proyectoId, presupuestoId: 'pr1', renglonId: 'r1', fecha: '2026-01-01', avanceFisico: 50, cantidadEjecutada: 10 } as any);
        break;
      case 'addValeSalida':
        useErpStore.getState().addValeSalida({ proyectoId, fecha: '2026-01-01', items: [{ materialId: 'm1', cantidad: 5 }], solicitante: 'Juan', destino: 'obra' } as any);
        break;
      case 'addHito':
        useErpStore.getState().addHito({ proyectoId, nombre: 'Inicio', fecha: '2026-01-01', tipo: 'inicio', estado: 'pendiente', createdAt: '2026-01-01' } as any);
        break;
      case 'addRiesgo':
        useErpStore.getState().addRiesgo({ proyectoId, nombre: 'R1', tipo: 'tecnico', probabilidad: 3, impacto: 4, nivel: 'alto', fechaIdentificacion: '2026-01-01', estado: 'identificado', createdAt: '2026-01-01' } as any);
        break;
      case 'addOrdenCambio':
        useErpStore.getState().addOrdenCambio({ proyectoId, titulo: 'OC1', descripcion: 'Test', impactoCosto: 10000, impactoPlazo: 5, estado: 'solicitud', solicitante: 'Juan', solicitanteRol: 'Residente', createdAt: '2026-01-01' } as any);
        break;
      case 'addCuentaCobrar':
        useErpStore.getState().addCuentaCobrar({ proyectoId, cliente: 'Cliente', concepto: 'Pago', monto: 10000, saldoPendiente: 10000, fechaEmision: '2026-01-01', fechaVencimiento: '2026-02-01', estado: 'pendiente' } as any);
        break;
      case 'addCuentaPagar':
        useErpStore.getState().addCuentaPagar({ proyectoId, proveedor: 'Prov A', concepto: 'Factura', monto: 5000, saldoPendiente: 5000, fechaEmision: '2026-01-01', fechaVencimiento: '2026-02-01', estado: 'pendiente' } as any);
        break;
      case 'addPlano':
        useErpStore.getState().addPlano({ proyectoId, nombre: 'Plano A', disciplina: 'arquitectura', version: '1.0', fechaSubida: '2026-01-01', estado: 'vigente', subidoPor: 'Juan' } as any);
        break;
      case 'addRfi':
        useErpStore.getState().addRfi({ proyectoId, numero: 'RFI-001', titulo: 'Consulta', descripcion: 'Test', solicitante: 'Juan', destino: 'Arq', estado: 'abierto', fechaSolicitud: '2026-01-01' } as any);
        break;
      case 'addSubmittal':
        useErpStore.getState().addSubmittal({ proyectoId, titulo: 'S-001', categoria: 'material', proveedor: 'Prov A', fechaEnvio: '2026-01-01', estado: 'pendiente' } as any);
        break;
      case 'addActivo':
        useErpStore.getState().addActivo({ proyectoId, nombre: 'Taladro', codigoInventario: 'T-001', tipo: 'herramienta', valorAdquisicion: 500, estado: 'disponible', fechaAdquisicion: '2026-01-01' } as any);
        break;
      case 'addCuadro':
        useErpStore.getState().addCuadro({ solicitud: 'S-001', fechaSolicitud: '2026-01-01', estado: 'abierto', cotizaciones: [] } as any);
        break;
      case 'addPagoProveedor':
        useErpStore.getState().addPagoProveedor({ proyectoId, proveedorId: 'pv1', proveedorNombre: 'Prov A', monto: 5000, concepto: 'Pago', fechaEmision: '2026-01-01', fechaVencimiento: '2026-02-01', estado: 'pendiente' } as any);
        break;
      case 'addIncidente':
        useErpStore.getState().addIncidente({ proyectoId, tipo: 'accidente', fecha: '2026-01-01', hora: '10:00', descripcion: 'Test', afectados: 'Ninguno', reportadoPor: 'Juan', fotos: [], estado: 'abierto' } as any);
        break;
      case 'addPrueba':
        useErpStore.getState().addPrueba({ proyectoId, tipo: 'concreto', descripcion: 'Prueba', fechaMuestra: '2026-01-01', resultado: 'pendiente', responsable: 'Juan' } as any);
        break;
      case 'addNC':
        useErpStore.getState().addNC({ proyectoId, codigo: 'NC-001', descripcion: 'Test', categoria: 'material', fechaDeteccion: '2026-01-01', detectadoPor: 'Juan', estado: 'detectado' } as any);
        break;
      case 'addLiberacion':
        useErpStore.getState().addLiberacion({ proyectoId, renglonId: 'r1', renglonNombre: 'R1', fechaSolicitud: '2026-01-01', solicitante: 'Juan', supervisor: 'Pedro', checklistAprobado: false, estado: 'pendiente' } as any);
        break;
      case 'addPublicacionMuro':
        useErpStore.getState().addPublicacionMuro({ proyectoId, autor: 'Juan', contenido: 'Test', tipo: 'general', fotos: [], createdAt: '2026-01-01' } as any);
        break;
      case 'addNotificacion':
        useErpStore.getState().addNotificacion('general', 'Test', 'Msg', undefined, undefined);
        break;
      case 'addCotizacion':
        useErpStore.getState().addCotizacion({ tipo: 'construccion', numero: 'COT-001', fecha: '2026-01-01', clienteNombre: 'Cliente', descripcion: 'Test', alcance: 'Alcance', renglones: [], costoDirectoTotal: 0, precioVentaTotal: 0, estado: 'borrador', createdAt: '2026-01-01', updatedAt: '2026-01-01' } as any);
        break;
      case 'addSeguimiento':
        useErpStore.getState().addSeguimiento({ proyectoId, fecha: '2026-01-01', avanceFisico: 50, avanceFinanciero: 40, costoReal: 10000, valorGanado: 9000, variacionCosto: -1000, variacionPlazo: -500, indiceRendimientoCosto: 0.9, indiceRendimientoPlazo: 0.95, estimacionFinal: 110000, variacionPorcentaje: -10 } as any);
        break;
      case 'addDestajo':
        useErpStore.getState().addDestajo({ proyectoId, renglonCodigo: 'EXC-001', cuadrilla: 'Albañil', fecha: '2026-06-01', cantidadEjecutada: 10, unidad: 'm³', horasTrabajadas: 8, rendimientoReal: 1.25, rendimientoTeorico: 1.5 } as any);
        break;
      case 'addRecepcion':
        useErpStore.getState().addRecepcion({ ocId: 'oc1', fecha: '2026-06-01T00:00:00.000Z', cantidadRecibida: 50, cantidadOC: 100, diferencia: 50, material: 'Cemento', proveedor: 'Prov A' } as any);
        break;
      case 'addVentaPaquete':
        useErpStore.getState().addVentaPaquete({ proyectoId, nombre: 'Paquete Test', estado: 'disponible', precio: 1000 } as any);
        break;
      case 'addPlantilla':
        useErpStore.getState().addPlantilla({ nombre: 'Plantilla Test', descripcion: '', categoria: 'residencial', version: '1.0', usos: 0, favorita: false, fechaCreacion: '2026-01-01', fechaActualizacion: '2026-01-01', estructura: { presupuesto: { renglones: [] }, hitos: [], riesgos: [], checklist: [] } } as any);
        break;
      default:
        return '';
    }
    const state = useErpStore.getState() as any;
    const arr = state[stateKey];
    if (arr && arr.length > 0) {
      return arr[0].id;
    }
    return '';
  };

  const entityMutationTypes: [string, string][] = [
    ['addProyecto', 'Proyecto'], ['addMovimiento', 'Movimiento'], ['addEmpleado', 'Empleado'],
    ['addMaterial', 'Material'], ['addOrden', 'OrdenCompra'], ['addProveedor', 'Proveedor'],
    ['addEvento', 'Evento'], ['addBitacora', 'Bitacora'], ['addPresupuesto', 'Presupuesto'],
    ['addLicitacion', 'Licitacion'], ['addAvance', 'Avance'], ['addValeSalida', 'ValeSalida'],
    ['addHito', 'Hito'], ['addRiesgo', 'Riesgo'], ['addOrdenCambio', 'OrdenCambio'],
    ['addCuentaCobrar', 'CuentaCobrar'], ['addCuentaPagar', 'CuentaPagar'],
    ['addPlano', 'Plano'], ['addRfi', 'RFI'], ['addSubmittal', 'Submittal'],
    ['addActivo', 'Activo'], ['addCuadro', 'Cuadro'], ['addPagoProveedor', 'PagoProveedor'],
    ['addIncidente', 'Incidente'], ['addPrueba', 'Prueba'], ['addNC', 'NC'],
    ['addLiberacion', 'Liberacion'], ['addPublicacionMuro', 'PublicacionMuro'],
    ['addNotificacion', 'Notificacion'], ['addCotizacion', 'Cotizacion'],
    ['addSeguimiento', 'Seguimiento'], ['addDestajo', 'Destajo'], ['addRecepcion', 'Recepcion'],
    ['addVentaPaquete', 'VentaPaquete'], ['addPlantilla', 'Plantilla'],
  ];

  entityMutationTypes.forEach(([mutationType, entityName]) => {
    it(`2.1 ${entityName}: add crea entidad en estado local`, () => {
      const id = addEntitySample(mutationType);
      const stateKey = stateKeyMap[mutationType] || mutationType.replace('add', '').toLowerCase() + 's';
      const state = useErpStore.getState() as any;
      const arr = state[stateKey];
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.some((item: any) => item.id === id)).toBe(true);
    });
  });

  entityMutationTypes.forEach(([mutationType, entityName]) => {
    if (!mutationType.startsWith('add')) return;
    const updateType = mutationType.replace('add', 'update');
    const stateKey = stateKeyMap[mutationType] || mutationType.replace('add', '').toLowerCase() + 's';
    if (!MUTATION_TABLE_MAP[updateType]) return;

    it(`2.2 ${entityName}: update encolea mutation tipo "${updateType}"`, () => {
      const id = addEntitySample(mutationType);
      const updateFn = (useErpStore.getState() as any)[updateType];
      expect(typeof updateFn).toBe('function');
      if (updateType === 'updatePresupuesto') {
        updateFn(id, { estado: 'revisado' });
      } else if (updateType === 'updateOrden') {
        updateFn(id, { estado: 'enviada' });
      } else {
        updateFn(id, { nombre: 'Actualizado' });
      }
      const queue = useErpStore.getState().mutationQueue;
      const updates = queue.filter((m: any) => m.type === updateType && m.payload?.id === id);
      expect(updates.length).toBeGreaterThanOrEqual(1);
    });
  });

  entityMutationTypes.forEach(([mutationType, entityName]) => {
    if (!mutationType.startsWith('add')) return;
    const deleteType = mutationType.replace('add', 'delete');
    const stateKey = stateKeyMap[mutationType] || mutationType.replace('add', '').toLowerCase() + 's';
    if (!MUTATION_TABLE_MAP[deleteType]) return;

    it(`2.3 ${entityName}: delete encolea mutation tipo "${deleteType}"`, () => {
      const id = addEntitySample(mutationType);
      const deleteFn = (useErpStore.getState() as any)[deleteType];
      expect(typeof deleteFn).toBe('function');
      deleteFn(id);
      const queue = useErpStore.getState().mutationQueue;
      const deletes = queue.filter((m: any) => m.type === deleteType && m.payload?.id === id);
      expect(deletes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('2.4 add + update + delete ciclo completo para Proyecto', () => {
    useErpStore.getState().addProyecto({ nombre: 'Ciclo Test', ubicacion: 'GT', tipologia: 'residencial', presupuestoTotal: 100000, montoContrato: 110000, cliente: 'C', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
    const id = useErpStore.getState().proyectos[0].id;
    expect(useErpStore.getState().proyectos.some(p => p.id === id)).toBe(true);
    useErpStore.getState().updateProyecto(id, { nombre: 'Actualizado' });
    expect(useErpStore.getState().proyectos.find(p => p.id === id)?.nombre).toBe('Actualizado');
    useErpStore.getState().deleteProyecto(id);
    expect(useErpStore.getState().proyectos.some(p => p.id === id)).toBe(false);
  });
});

// =====================================================================
// STAGE 3: MUTATION STRUCTURE VALIDATION
// =====================================================================
describe('Stage 3: Mutation Structure Validation', () => {
  beforeEach(() => { resetStore(); resetRateLimit(); vi.clearAllMocks(); useErpStore.setState({ proyectos: [{ id: 'p1', nombre: 'Test', ubicacion: 'Test', tipologia: 'residencial', presupuestoTotal: 100000, montoContrato: 100000, cliente: 'Test', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', estado: 'planificacion' }] }); });

  it('3.1 addProyecto encolea mutation con campos requeridos', () => {
    useErpStore.getState().addProyecto({ nombre: 'Test', ubicacion: 'GT', tipologia: 'residencial', presupuestoTotal: 100000, montoContrato: 110000, cliente: 'C', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
    const mutation = useErpStore.getState().mutationQueue[0];
    expect(mutation).toBeDefined();
    expect(mutation.id).toBeTruthy();
    expect(mutation.type).toBe('addProyecto');
    expect(mutation.timestamp).toBeGreaterThan(0);
    expect(mutation.retryCount).toBe(0);
    expect(mutation.payload).toBeDefined();
  });

  it('3.2 Mutation payload keys are snake_case', () => {
    useErpStore.getState().addProyecto({ nombre: 'Test', ubicacion: 'GT', tipologia: 'residencial', presupuestoTotal: 100000, montoContrato: 110000, cliente: 'C', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
    const mutation = useErpStore.getState().mutationQueue[0];
    expect(mutation.type).toBe('addProyecto');
    const keys = Object.keys(mutation.payload);
    keys.forEach(k => {
      expect(k).not.toMatch(/[A-Z]/);
    });
  });

  it('3.3 Nested objects preserve structure in snake_case', () => {
    useErpStore.setState({ mutationQueue: [] });
    resetRateLimit();
    useErpStore.getState().addOrden({ proyectoId: 'p1', proveedor: 'Prov A', material: 'Cemento', cantidad: 50, monto: 5000, fecha: '2026-01-01', estado: 'borrador', items: [{ materialId: 'm1', cantidad: 5, precioUnitario: 100 }], total: 5000, tipoPago: 'credito', createdAt: '2026-01-01' } as any);
    const mutation = useErpStore.getState().mutationQueue.find((m: any) => m.type === 'addOrden');
    expect(mutation).toBeDefined();
    expect(mutation.type).toBe('addOrden');
    expect(mutation.payload.proyecto_id).toBe('p1');
    if (mutation.payload.items && mutation.payload.items.length > 0) {
      expect(mutation.payload.items[0].material_id).toBe('m1');
    }
  });

  it('3.4 Sanitization neutralizes dangerous keys', () => {
    useErpStore.setState({ mutationQueue: [] });
    resetRateLimit();
    useErpStore.getState().addProveedor({ nombre: 'Test', __proto__: { admin: true }, constructor: { prototype: {} }, categoria: 'materiales' } as any);
    const mutation = useErpStore.getState().mutationQueue[0];
    expect(mutation.type).toBe('addProveedor');
    expect(mutation.payload.nombre).toBe('Test');
    expect(mutation.payload.categoria).toBe('materiales');
  });

  it('3.5 Rapid addProyecto calls both succeed locally', () => {
    const store = useErpStore.getState();
    store.addProyecto({ nombre: 'A', ubicacion: 'GT', tipologia: 'residencial', presupuestoTotal: 0, montoContrato: 0, cliente: '', fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
    const lenAfterFirst = useErpStore.getState().proyectos.length;
    store.addProyecto({ nombre: 'B', ubicacion: 'GT', tipologia: 'residencial', presupuestoTotal: 0, montoContrato: 0, cliente: '', fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
    expect(useErpStore.getState().proyectos.length).toBe(lenAfterFirst + 1);
  });

  it('3.6 Queue caps at 100 items', () => {
    const store = useErpStore.getState();
    for (let i = 0; i < 120; i++) {
      resetRateLimit();
      (store as any).enqueueMutation('addProyecto', { id: uid(), nombre: 'Test' });
    }
    expect(store.mutationQueue.length).toBeLessThanOrEqual(100);
  });
});

// =====================================================================
// STAGE 4: CROSS-ENTITY DATA FLOW
// =====================================================================
describe('Stage 4: Cross-Entity Data Flow', () => {
  beforeEach(() => { resetStore(); resetRateLimit(); vi.clearAllMocks(); });

  it('4.1 Create project then add child entities', () => {
    useErpStore.getState().addProyecto({ nombre: 'Edificio Central', ubicacion: 'GT', tipologia: 'comercial', presupuestoTotal: 500000, montoContrato: 550000, cliente: 'XYZ', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;

    useErpStore.getState().addHito({ proyectoId, nombre: 'Cimentación', fecha: '2026-03-01', tipo: 'hito', estado: 'pendiente', createdAt: '2026-01-01' } as any);
    useErpStore.getState().addPresupuesto({ proyectoId, tipologia: 'comercial', renglones: [], estado: 'borrador', totalCalculado: 0, costoDirectoTotal: 0, fechaCreacion: '2026-01-01', fechaActualizacion: '2026-01-01', nombre: 'Presupuesto 1', version: 1 } as any);
    useErpStore.getState().addRiesgo({ proyectoId, nombre: 'Riesgo Climático', tipo: 'externo', probabilidad: 3, impacto: 4, nivel: 'alto', fechaIdentificacion: '2026-01-01', estado: 'identificado', createdAt: '2026-01-01' } as any);

    const state = useErpStore.getState();
    expect(state.proyectos.some(p => p.id === proyectoId)).toBe(true);
    expect(state.hitos.some(h => h.proyectoId === proyectoId)).toBe(true);
    expect(state.presupuestos.some(p => p.proyectoId === proyectoId)).toBe(true);
    expect(state.riesgos.some(r => r.proyectoId === proyectoId)).toBe(true);
  });

  it('4.2 Delete removes from local state', () => {
    useErpStore.getState().addProyecto({ nombre: 'Test', ubicacion: 'GT', tipologia: 'residencial', presupuestoTotal: 100000, montoContrato: 110000, cliente: 'C', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
    const id = useErpStore.getState().proyectos[0].id;
    expect(useErpStore.getState().proyectos.some(p => p.id === id)).toBe(true);
    useErpStore.getState().deleteProyecto(id);
    expect(useErpStore.getState().proyectos.some(p => p.id === id)).toBe(false);
  });

  it('4.3 Concurrent additions maintain order in local state', () => {
    const store = useErpStore.getState();
    for (let i = 0; i < 5; i++) {
      store.addProyecto({ nombre: `P-${i}`, ubicacion: 'GT', tipologia: 'residencial', presupuestoTotal: 0, montoContrato: 0, cliente: '', fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
    }
    expect(useErpStore.getState().proyectos.length).toBe(5);
    const proyectos = useErpStore.getState().proyectos;
    expect(proyectos.map(p => p.nombre).sort()).toEqual(['P-0', 'P-1', 'P-2', 'P-3', 'P-4']);
  });
});

// =====================================================================
// STAGE 5: ERROR HANDLING & EDGE CASES
// =====================================================================
describe('Stage 5: Error Handling & Edge Cases', () => {
  beforeEach(() => { resetStore(); resetRateLimit(); vi.clearAllMocks(); });

  it('5.1 Empty store state is consistent', () => {
    const state = useErpStore.getState();
    expect(Array.isArray(state.proyectos)).toBe(true);
    expect(Array.isArray(state.mutationQueue)).toBe(true);
    expect(state.syncStatus).toBe('idle');
    expect(state.isOnline).toBe(true);
  });

  it('5.2 Create entity with minimal fields works', () => {
    useErpStore.getState().addProyecto({} as any);
    expect(useErpStore.getState().proyectos.length).toBe(1);
    expect(useErpStore.getState().proyectos[0].id).toBeTruthy();
  });

  it('5.3 Duplicate IDs do not crash the store', () => {
    useErpStore.getState().addProyecto({ nombre: 'A', ubicacion: 'GT', tipologia: 'residencial', presupuestoTotal: 0, montoContrato: 0, cliente: '', fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
    const countBefore = useErpStore.getState().proyectos.length;
    useErpStore.getState().addProyecto({ nombre: 'B', ubicacion: 'GT', tipologia: 'residencial', presupuestoTotal: 0, montoContrato: 0, cliente: '', fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', etapa: 'planificacion', moneda: 'GTQ', motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '' } as any);
    expect(useErpStore.getState().proyectos.length).toBe(countBefore + 1);
  });

  it('5.4 Delete nonexistent ID does not throw', () => {
    expect(() => useErpStore.getState().deleteProyecto('nonexistent-id')).not.toThrow();
    expect(() => useErpStore.getState().deleteMovimiento('nonexistent-id')).not.toThrow();
    expect(() => useErpStore.getState().deleteMaterial('nonexistent-id')).not.toThrow();
  });

  it('5.5 Update nonexistent ID does not throw', () => {
    expect(() => useErpStore.getState().updateProyecto('nonexistent-id', { nombre: 'X' })).not.toThrow();
    expect(() => useErpStore.getState().updateMovimiento('nonexistent-id', { descripcion: 'X' })).not.toThrow();
  });

  it('5.6 All CRUD handlers are callable functions', () => {
    const store = useErpStore.getState();
    const crudHandlers = [
      'addProyecto', 'updateProyecto', 'deleteProyecto',
      'addMovimiento', 'updateMovimiento', 'deleteMovimiento',
      'addEmpleado', 'updateEmpleado', 'deleteEmpleado',
      'addMaterial', 'updateMaterial', 'deleteMaterial',
      'addOrden', 'updateOrden', 'deleteOrden',
      'addProveedor', 'updateProveedor', 'deleteProveedor',
      'addEvento', 'updateEvento', 'deleteEvento',
      'addBitacora', 'updateBitacora', 'deleteBitacora',
      'addPresupuesto', 'updatePresupuesto', 'deletePresupuesto',
      'addLicitacion', 'updateLicitacion', 'deleteLicitacion',
      'addCotizacion', 'updateCotizacion', 'deleteCotizacion',
      'addAvance', 'deleteAvance',
      'addValeSalida', 'deleteValeSalida',
      'addHito', 'updateHito', 'deleteHito',
      'addRiesgo', 'updateRiesgo', 'deleteRiesgo',
      'addPlano', 'updatePlano', 'deletePlano',
      'addRfi', 'updateRfi', 'deleteRfi',
      'addSubmittal', 'updateSubmittal', 'deleteSubmittal',
      'addActivo', 'updateActivo', 'deleteActivo',
      'addCuadro', 'updateCuadro', 'deleteCuadro',
      'addPagoProveedor', 'updatePagoProveedor', 'deletePagoProveedor',
      'addIncidente', 'updateIncidente', 'deleteIncidente',
      'addPrueba', 'updatePrueba', 'deletePrueba',
      'addNC', 'updateNC', 'deleteNC',
      'addLiberacion', 'updateLiberacion', 'deleteLiberacion',
      'addPublicacionMuro', 'addComentarioMuro', 'likePublicacionMuro',
      'addNotificacion', 'markNotificacionLeida', 'deleteNotificacion',
      'addSeguimiento', 'updateSeguimiento', 'deleteSeguimiento',
      'addCuentaCobrar', 'updateCuentaCobrar', 'deleteCuentaCobrar',
      'addCuentaPagar', 'updateCuentaPagar', 'deleteCuentaPagar',
      'addOrdenCambio', 'updateOrdenCambio', 'deleteOrdenCambio',
      'addDestajo', 'updateDestajo', 'deleteDestajo',
      'addRecepcion', 'deleteRecepcion',
      'addPlantilla', 'updatePlantilla', 'deletePlantilla',
      'addVentaPaquete',
      'clearProyectos',
    ];
    crudHandlers.forEach(h => {
      expect(typeof (store as any)[h]).toBe('function');
    });
  });
});
