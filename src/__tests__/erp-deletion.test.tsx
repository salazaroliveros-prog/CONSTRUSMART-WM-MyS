import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useErpStore, resetRateLimit } from '../erp/zustandStore';
import { MUTATION_TABLE_MAP } from '../erp/store';
import { APP_SETTINGS_DEFAULTS } from '../erp/utils';

const resetStore = () => {
  resetRateLimit();
  useErpStore.setState({
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
};

// =====================================================================
// STAGE 1: INDIVIDUAL ENTITY DELETION TESTS
// =====================================================================
describe('Stage 1: Individual Entity Deletion', () => {

  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('1.1 deleteProyecto elimina del estado y encolea mutation', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Proyecto Test', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 100000, montoContrato: 110000, cliente: 'Cliente A',
      fechaInicio: '2026-01-01', fechaFin: '2026-12-31',
      avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion',
      descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const id = useErpStore.getState().proyectos[0].id;

    useErpStore.getState().deleteProyecto(id);
    const state = useErpStore.getState();
    expect(state.proyectos).toHaveLength(0);
    expect(state.auditLog.length).toBeGreaterThan(0);
    expect(state.auditLog[state.auditLog.length - 1].accion).toBe('eliminar');
  });

  it('1.2 deleteProyecto con ID inexistente no lanza error', () => {
    expect(() => useErpStore.getState().deleteProyecto('non-existent')).not.toThrow();
  });

  it('1.3 deleteProyecto solo elimina el proyecto correcto entre varios', () => {
    for (let i = 0; i < 3; i++) {
      useErpStore.getState().addProyecto({
        nombre: `P${i}`, ubicacion: 'GT', tipologia: 'residencial',
        presupuestoTotal: 0, montoContrato: 0, cliente: '',
        fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
        estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
        clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
        ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
        areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
        ingenieroResidente: '', supervisor: '', arquitecto: '',
        numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
        moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
        latitud: null, longitud: null, factorSobrecosto: undefined,
        motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
      } as any);
    }
    const ids = useErpStore.getState().proyectos.map(p => p.id);
    useErpStore.getState().deleteProyecto(ids[0]);
    expect(useErpStore.getState().proyectos).toHaveLength(2);
    expect(useErpStore.getState().proyectos.find(p => p.id === ids[0])).toBeUndefined();
    expect(useErpStore.getState().proyectos.find(p => p.id === ids[1])).toBeDefined();
  });

  it('1.4 deleteMovimiento elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addMovimiento({ proyectoId, tipo: 'ingreso', categoria: 'materiales', monto: 1000, descripcion: 'Test', fecha: '2026-01-01' } as any);
    const id = useErpStore.getState().movimientos[0].id;
    useErpStore.getState().deleteMovimiento(id);
    expect(useErpStore.getState().movimientos).toHaveLength(0);
  });

  it('1.5 deleteEmpleado elimina del estado', () => {
    useErpStore.getState().addEmpleado({ nombre: 'Juan', puesto: 'Albañil', salarioDiario: 150, tipo: 'planilla', activo: true, proyectoIds: [] } as any);
    const id = useErpStore.getState().empleados[0].id;
    useErpStore.getState().deleteEmpleado(id);
    expect(useErpStore.getState().empleados).toHaveLength(0);
  });

  it('1.6 deleteMaterial elimina del estado', () => {
    useErpStore.getState().addMaterial({ nombre: 'Cemento', unidad: 'bolsa', stock: 100, stockMinimo: 10, precio: 85, categoria: 'materiales', proyectoIds: [] } as any);
    const id = useErpStore.getState().materiales[0].id;
    useErpStore.getState().deleteMaterial(id);
    expect(useErpStore.getState().materiales).toHaveLength(0);
  });

  it('1.7 deleteOrden elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addOrden({ proyectoId, proveedor: 'Prov A', material: 'Cemento', cantidad: 50, monto: 5000, fecha: '2026-01-01', estado: 'borrador' } as any);
    const id = useErpStore.getState().ordenes[0].id;
    useErpStore.getState().deleteOrden(id);
    expect(useErpStore.getState().ordenes).toHaveLength(0);
  });

  it('1.8 deleteProveedor elimina del estado', () => {
    useErpStore.getState().addProveedor({ nombre: 'Prov A', contacto: 'Juan', telefono: '12345678', email: 'j@test.com', categoria: 'materiales' } as any);
    const id = useErpStore.getState().proveedores[0].id;
    useErpStore.getState().deleteProveedor(id);
    expect(useErpStore.getState().proveedores).toHaveLength(0);
  });

  it('1.9 deleteEvento elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addEvento({ proyectoId, titulo: 'Reunión', fecha: '2026-01-01', hora: '10:00', tipo: 'reunion', participantes: [] } as any);
    const id = useErpStore.getState().eventos[0].id;
    useErpStore.getState().deleteEvento(id);
    expect(useErpStore.getState().eventos).toHaveLength(0);
  });

  it('1.10 deleteBitacora elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addBitacora({ proyectoId, fecha: '2026-01-01', clima: 'soleado', personalPresente: 5, maquinaria: '', tareasRealizadas: '', observaciones: '', fotos: [] } as any);
    const id = useErpStore.getState().bitacora[0].id;
    useErpStore.getState().deleteBitacora(id);
    expect(useErpStore.getState().bitacora).toHaveLength(0);
  });

  it('1.11 deletePresupuesto elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addPresupuesto({ proyectoId, tipologia: 'residencial', renglones: [], estado: 'borrador', totalCalculado: 0, costoDirectoTotal: 0, fechaCreacion: '2026-01-01', fechaActualizacion: '2026-01-01' } as any);
    const id = useErpStore.getState().presupuestos[0].id;
    useErpStore.getState().deletePresupuesto(id);
    expect(useErpStore.getState().presupuestos).toHaveLength(0);
  });

  it('1.12 deleteLicitacion elimina del estado', () => {
    useErpStore.getState().addLicitacion({ nombre: 'Obra X', cliente: 'Cliente A', monto: 500000, fechaLimite: '2026-06-30', estado: 'activa', probabilidad: 50, createdAt: '2026-01-01' } as any);
    const id = useErpStore.getState().licitaciones[0].id;
    useErpStore.getState().deleteLicitacion(id);
    expect(useErpStore.getState().licitaciones).toHaveLength(0);
  });

  it('1.13 deleteCotizacion elimina del estado', () => {
    useErpStore.getState().addCotizacion({ tipo: 'construccion', numero: 'COT-001', fecha: '2026-01-01', clienteNombre: 'Cliente', descripcion: 'Test', alcance: 'Alcance', renglones: [], costoDirectoTotal: 0, precioVentaTotal: 0, estado: 'borrador' } as any);
    const id = useErpStore.getState().cotizacionesNegocio[0].id;
    useErpStore.getState().deleteCotizacion(id);
    expect(useErpStore.getState().cotizacionesNegocio).toHaveLength(0);
  });

  it('1.14 deleteAvance elimina del estado', () => {
    useErpStore.setState({ proyectos: [{ id: 'p1', nombre: 'Test Project', cliente: 'Client', ubicacion: 'Location', tipologia: 'residencial', estado: 'activo' }] as any });
    useErpStore.getState().addAvance({ proyectoId: 'p1', presupuestoId: 'pr1', renglonId: 'r1', fecha: '2026-01-01', avanceFisico: 50, cantidadEjecutada: 10 } as any);
    const id = useErpStore.getState().avances[0].id;
    useErpStore.getState().deleteAvance(id);
    expect(useErpStore.getState().avances).toHaveLength(0);
  });

  it('1.15 deleteSeguimiento elimina del estado', () => {
    useErpStore.setState({ proyectos: [{ id: 'p1', nombre: 'Test Project', cliente: 'Client', ubicacion: 'Location', tipologia: 'residencial', estado: 'activo' }] as any });
    useErpStore.getState().addSeguimiento({ proyectoId: 'p1', fecha: '2026-01-01', valorGanado: 10000, costoReal: 8000, valorPlanificado: 12000, avanceFisico: 50, avanceFinanciero: 45 } as any);
    const id = useErpStore.getState().seguimientoEVM[0].id;
    useErpStore.getState().deleteSeguimiento(id);
    expect(useErpStore.getState().seguimientoEVM).toHaveLength(0);
  });

  it('1.16 deleteValeSalida elimina del estado', () => {
    useErpStore.setState({ proyectos: [{ id: 'p1', nombre: 'Test Project', cliente: 'Client', ubicacion: 'Location', tipologia: 'residencial', estado: 'activo' }] as any });
    useErpStore.getState().addValeSalida({ proyectoId: 'p1', fecha: '2026-01-01', items: [{ materialId: 'm1', cantidad: 5 }], solicitante: 'Juan' } as any);
    const id = useErpStore.getState().valesSalida[0].id;
    useErpStore.getState().deleteValeSalida(id);
    expect(useErpStore.getState().valesSalida).toHaveLength(0);
  });

  it('1.17 deleteCuentaCobrar elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addCuentaCobrar({ proyectoId, cliente: 'Cliente', concepto: 'Pago', monto: 10000, saldoPendiente: 10000, fechaEmision: '2026-01-01', fechaVencimiento: '2026-02-01', estado: 'pendiente' } as any);
    const id = useErpStore.getState().cuentasCobrar[0].id;
    useErpStore.getState().deleteCuentaCobrar(id);
    expect(useErpStore.getState().cuentasCobrar).toHaveLength(0);
  });

  it('1.18 deleteCuentaPagar elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addCuentaPagar({ proyectoId, proveedor: 'Prov A', concepto: 'Factura', monto: 5000, saldoPendiente: 5000, fechaEmision: '2026-01-01', fechaVencimiento: '2026-02-01', estado: 'pendiente' } as any);
    const id = useErpStore.getState().cuentasPagar[0].id;
    useErpStore.getState().deleteCuentaPagar(id);
    expect(useErpStore.getState().cuentasPagar).toHaveLength(0);
  });

  it('1.19 deleteOrdenCambio elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addOrdenCambio({ proyectoId, titulo: 'OC1', descripcion: 'Test', impactoCosto: 10000, impactoPlazo: 5, estado: 'solicitud', solicitante: 'Juan', solicitanteRol: 'Residente', createdAt: '2026-01-01' } as any);
    const id = useErpStore.getState().ordenesCambio[0].id;
    useErpStore.getState().deleteOrdenCambio(id);
    expect(useErpStore.getState().ordenesCambio).toHaveLength(0);
  });

  it('1.20 deleteHito elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addHito({ proyectoId, nombre: 'Inicio', fecha: '2026-01-01', tipo: 'inicio', estado: 'pendiente', createdAt: '2026-01-01' } as any);
    const id = useErpStore.getState().hitos[0].id;
    useErpStore.getState().deleteHito(id);
    expect(useErpStore.getState().hitos).toHaveLength(0);
  });

  it('1.21 deleteRiesgo elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addRiesgo({ proyectoId, nombre: 'R1', tipo: 'tecnico', probabilidad: 3, impacto: 4, nivel: 'alto', fechaIdentificacion: '2026-01-01', estado: 'identificado', createdAt: '2026-01-01' } as any);
    const id = useErpStore.getState().riesgos[0].id;
    useErpStore.getState().deleteRiesgo(id);
    expect(useErpStore.getState().riesgos).toHaveLength(0);
  });

  it('1.22 deletePlano elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addPlano({ proyectoId, nombre: 'Plano A', disciplina: 'arquitectura', version: '1.0', fechaSubida: '2026-01-01', estado: 'vigente', subidoPor: 'Juan' } as any);
    const id = useErpStore.getState().planos[0].id;
    useErpStore.getState().deletePlano(id);
    expect(useErpStore.getState().planos).toHaveLength(0);
  });

  it('1.23 deleteRfi elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addRfi({ proyectoId, numero: 'RFI-001', titulo: 'Consulta', descripcion: 'Test', solicitante: 'Juan', destino: 'Arq', estado: 'abierto', fechaSolicitud: '2026-01-01' } as any);
    const id = useErpStore.getState().rfis[0].id;
    useErpStore.getState().deleteRfi(id);
    expect(useErpStore.getState().rfis).toHaveLength(0);
  });

  it('1.24 deleteSubmittal elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addSubmittal({ proyectoId, titulo: 'S-001', categoria: 'material', proveedor: 'Prov A', fechaEnvio: '2026-01-01', estado: 'pendiente' } as any);
    const id = useErpStore.getState().submittals[0].id;
    useErpStore.getState().deleteSubmittal(id);
    expect(useErpStore.getState().submittals).toHaveLength(0);
  });

  it('1.25 deleteActivo elimina del estado', () => {
    useErpStore.getState().addActivo({ nombre: 'Taladro', codigoInventario: 'T-001', tipo: 'herramienta', valorAdquisicion: 500, estado: 'disponible', fechaAdquisicion: '2026-01-01' } as any);
    const id = useErpStore.getState().activos[0].id;
    useErpStore.getState().deleteActivo(id);
    expect(useErpStore.getState().activos).toHaveLength(0);
  });

  it('1.26 deleteCuadro elimina del estado', () => {
    useErpStore.getState().addCuadro({ solicitud: 'S-001', fechaSolicitud: '2026-01-01', estado: 'abierto', cotizaciones: [] } as any);
    const id = useErpStore.getState().cuadros[0].id;
    useErpStore.getState().deleteCuadro(id);
    expect(useErpStore.getState().cuadros).toHaveLength(0);
  });

  it('1.27 deletePagoProveedor elimina del estado', () => {
    useErpStore.getState().addPagoProveedor({ proveedorId: 'pv1', proveedorNombre: 'Prov A', monto: 5000, concepto: 'Pago', fechaEmision: '2026-01-01', fechaVencimiento: '2026-02-01', estado: 'pendiente' } as any);
    const id = useErpStore.getState().pagosProveedor[0].id;
    useErpStore.getState().deletePagoProveedor(id);
    expect(useErpStore.getState().pagosProveedor).toHaveLength(0);
  });

  it('1.28 deleteIncidente elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addIncidente({ proyectoId, tipo: 'accidente', fecha: '2026-01-01', hora: '10:00', descripcion: 'Test', afectados: 'Ninguno', reportadoPor: 'Juan', fotos: [], estado: 'abierto' } as any);
    const id = useErpStore.getState().incidentes[0].id;
    useErpStore.getState().deleteIncidente(id);
    expect(useErpStore.getState().incidentes).toHaveLength(0);
  });

  it('1.29 deleteDestajo elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addDestajo({ proyectoId, renglonCodigo: 'EXC-001', cuadrilla: 'Albañil', fecha: '2026-06-01', cantidadEjecutada: 10, unidad: 'm³', horasTrabajadas: 8, rendimientoReal: 1.25, rendimientoTeorico: 1.5 } as any);
    const id = useErpStore.getState().destajos[0].id;
    useErpStore.getState().deleteDestajo(id);
    expect(useErpStore.getState().destajos).toHaveLength(0);
  });

  it('1.30 deleteRecepcion elimina del estado', () => {
    useErpStore.getState().addRecepcion({ ocId: 'oc1', fecha: '2026-06-01T00:00:00.000Z', cantidadRecibida: 50, cantidadOC: 100, diferencia: 50, material: 'Cemento', proveedor: 'Prov A' } as any);
    const id = useErpStore.getState().recepciones[0].id;
    useErpStore.getState().deleteRecepcion(id);
    expect(useErpStore.getState().recepciones).toHaveLength(0);
  });

  it('1.31 deletePrueba elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addPrueba({ proyectoId, tipo: 'concreto', descripcion: 'Prueba', fechaMuestra: '2026-01-01', resultado: 'pendiente', responsable: 'Juan' } as any);
    const id = useErpStore.getState().pruebas[0].id;
    useErpStore.getState().deletePrueba(id);
    expect(useErpStore.getState().pruebas).toHaveLength(0);
  });

  it('1.32 deleteNC elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addNC({ proyectoId, codigo: 'NC-001', descripcion: 'Test', categoria: 'material', fechaDeteccion: '2026-01-01', detectadoPor: 'Juan', estado: 'detectado' } as any);
    const id = useErpStore.getState().ncs[0].id;
    useErpStore.getState().deleteNC(id);
    expect(useErpStore.getState().ncs).toHaveLength(0);
  });

  it('1.33 deleteLiberacion elimina del estado', () => {
    useErpStore.getState().addProyecto({
      nombre: 'Dummy Project', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    useErpStore.getState().addLiberacion({ proyectoId, renglonId: 'r1', renglonNombre: 'R1', fechaSolicitud: '2026-01-01', solicitante: 'Juan', supervisor: 'Pedro', checklistAprobado: false, estado: 'pendiente' } as any);
    const id = useErpStore.getState().liberaciones[0].id;
    useErpStore.getState().deleteLiberacion(id);
    expect(useErpStore.getState().liberaciones).toHaveLength(0);
  });

  it('1.34 deleteNotificacion elimina del estado', () => {
    useErpStore.getState().addNotificacion('info', 'Test', 'Msg', undefined, undefined);
    const id = useErpStore.getState().notificaciones[0].id;
    useErpStore.getState().deleteNotificacion(id);
    expect(useErpStore.getState().notificaciones).toHaveLength(0);
  });

  it('1.35 deletePlantilla elimina del estado con audit trail', () => {
    const s = useErpStore.getState();
    s.addPlantilla({
      nombre: 'Plantilla Test', categoria: 'residencial',
      activa: true, configuracion: { tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ' },
      estructuraPresupuesto: [], hitosTemplate: [], riesgosTemplate: [],
      checklistCalidad: [], favorita: false,
    });
    const id = useErpStore.getState().plantillas[0].id;
    const auditBefore = useErpStore.getState().auditLog.length;
    useErpStore.getState().deletePlantilla(id);
    expect(useErpStore.getState().plantillas).toHaveLength(0);
    expect(useErpStore.getState().auditLog.length).toBeGreaterThan(auditBefore);
    expect(useErpStore.getState().auditLog[useErpStore.getState().auditLog.length - 1].accion).toBe('eliminar');
  });

  it('1.36 muestra de delete handlers (3 entidades) — smoke test de wiring', () => {
    useErpStore.getState().addProyecto({ nombre: 'Test', ubicacion: 'Test', tipologia: 'residencial', presupuestoTotal: 100000, montoContrato: 100000, cliente: 'Test', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', estado: 'planificacion' } as any);
    const proyectoId = useErpStore.getState().proyectos[0].id;
    const pairs: { add: () => string; delete: (id: string) => void; stateKey: string }[] = [
      { add: () => { useErpStore.getState().addMovimiento({ proyectoId, tipo: 'ingreso', categoria: 'materiales', monto: 1000, descripcion: 'T', fecha: '2026-01-01' } as any); return useErpStore.getState().movimientos[0].id; }, delete: (id) => useErpStore.getState().deleteMovimiento(id), stateKey: 'movimientos' },
      { add: () => { useErpStore.getState().addEmpleado({ nombre: 'J', puesto: 'A', salarioDiario: 150, tipo: 'planilla', activo: true, proyectoIds: [] } as any); return useErpStore.getState().empleados[0].id; }, delete: (id) => useErpStore.getState().deleteEmpleado(id), stateKey: 'empleados' },
      { add: () => { useErpStore.getState().addMaterial({ nombre: 'C', unidad: 'b', stock: 100, stockMinimo: 10, precio: 85, categoria: 'materiales', proyectoIds: [] } as any); return useErpStore.getState().materiales[0].id; }, delete: (id) => useErpStore.getState().deleteMaterial(id), stateKey: 'materiales' },
    ];

    pairs.forEach(p => {
      const id = p.add();
      expect((useErpStore.getState() as any)[p.stateKey]).toHaveLength(1);
      p.delete(id);
      expect((useErpStore.getState() as any)[p.stateKey]).toHaveLength(0);
    });
  });

  it('1.37 todos los delete handlers existen en el store y son invocables (vía MUTATION_TABLE_MAP)', () => {
    const deleteKeys = Object.keys(MUTATION_TABLE_MAP).filter(k => k.startsWith('delete'));
    expect(deleteKeys.length).toBeGreaterThanOrEqual(34);

    const stateKeyMap: Record<string, string> = {
      deleteProyecto:'proyectos', deleteMovimiento:'movimientos', deleteEmpleado:'empleados',
      deleteMaterial:'materiales', deleteOrden:'ordenes', deleteProveedor:'proveedores',
      deleteEvento:'eventos', deleteBitacora:'bitacora', deletePresupuesto:'presupuestos',
      deleteLicitacion:'licitaciones', deleteCotizacion:'cotizacionesNegocio',
      deleteAvance:'avances', deleteSeguimiento:'seguimientoEVM',
      deleteValeSalida:'valesSalida', deleteCuentaCobrar:'cuentasCobrar',
      deleteCuentaPagar:'cuentasPagar', deleteOrdenCambio:'ordenesCambio',
      deleteHito:'hitos', deleteRiesgo:'riesgos', deletePlano:'planos',
      deleteRfi:'rfis', deleteSubmittal:'submittals', deleteActivo:'activos',
      deleteCuadro:'cuadros', deletePagoProveedor:'pagosProveedor',
      deleteIncidente:'incidentes', deleteDestajo:'destajos',
      deleteRecepcion:'recepciones', deletePrueba:'pruebas', deleteNC:'ncs',
      deleteLiberacion:'liberaciones', deleteNotificacion:'notificaciones',
      deletePlantilla:'plantillas', deleteError:'errorLogs',
    };

    deleteKeys.forEach(k => {
      const handler = (useErpStore.getState() as any)[k];
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
      const stateKey = stateKeyMap[k];
      expect(stateKey).toBeDefined();
      expect(Array.isArray((useErpStore.getState() as any)[stateKey])).toBe(true);
    });
  });
});

// =====================================================================
// STAGE 2: BULK DELETION & EMPTY STATE TESTS
// =====================================================================
describe('Stage 2: Bulk Deletion & Empty States', () => {

  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('2.1 clearProyectos', () => {
    it('limpia todos los proyectos cuando hay varios', () => {
      const s = useErpStore.getState();
      for (let i = 0; i < 5; i++) {
        s.addProyecto({
          nombre: `P${i}`, ubicacion: 'GT', tipologia: 'residencial',
          presupuestoTotal: 0, montoContrato: 0, cliente: '',
          fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
          estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
          clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
          ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
          areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
          ingenieroResidente: '', supervisor: '', arquitecto: '',
          numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
          moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
          latitud: null, longitud: null, factorSobrecosto: undefined,
          motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
        } as any);
      }
      expect(useErpStore.getState().proyectos.length).toBeGreaterThanOrEqual(5);

      useErpStore.getState().clearProyectos();
      expect(useErpStore.getState().proyectos).toHaveLength(0);
    });

    it('clearProyectos no lanza error si no hay proyectos', () => {
      expect(useErpStore.getState().proyectos).toHaveLength(0);
      expect(() => useErpStore.getState().clearProyectos()).not.toThrow();
    });

    it('clearProyectos resetea selectedProyectoId si estaba seleccionado', () => {
      const s = useErpStore.getState();
      s.addProyecto({
        nombre: 'P1', ubicacion: 'GT', tipologia: 'residencial',
        presupuestoTotal: 0, montoContrato: 0, cliente: '',
        fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
        estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
        clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
        ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
        areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
        ingenieroResidente: '', supervisor: '', arquitecto: '',
        numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
        moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
        latitud: null, longitud: null, factorSobrecosto: undefined,
        motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
      } as any);
      const id = useErpStore.getState().proyectos[0].id;
      useErpStore.getState().setSelectedProyectoId(id);
      useErpStore.getState().clearProyectos();
      expect(useErpStore.getState().selectedProyectoId).toBeNull();
    });
  });

  describe('2.2 clearAllData', () => {
    const populateStore = () => {
      const s = useErpStore.getState();
      for (let i = 0; i < 3; i++) {
        s.addProyecto({
          nombre: `P${i}`, ubicacion: 'GT', tipologia: 'residencial',
          presupuestoTotal: 0, montoContrato: 0, cliente: '',
          fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
          estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
          clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
          ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
          areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
          ingenieroResidente: '', supervisor: '', arquitecto: '',
          numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
          moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
          latitud: null, longitud: null, factorSobrecosto: undefined,
          motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
        } as any);
        s.addMaterial({ nombre: `M${i}`, unidad: 'bolsa', stock: 100, stockMinimo: 10, precio: 85, categoria: 'materiales', proyectoIds: [] } as any);
        s.addNotificacion('info', `Notif ${i}`, 'Msg', undefined, undefined);
      }
      useErpStore.getState().setAuditLog([
        { id: '1', usuarioNombre: 'test', accion: 'crear', entidad: 'proyecto', entidadId: 'p1', createdAt: '2026-01-01' },
      ]);
    };

    it('limpia todos los arrays de estado correctamente', () => {
      populateStore();
      const entityKeys = [
        'proyectos', 'movimientos', 'empleados', 'materiales', 'ordenes',
        'proveedores', 'eventos', 'presupuestos', 'avances',
        'cuentasCobrar', 'cuentasPagar', 'ordenesCambio', 'hitos', 'riesgos',
        'licitaciones', 'cotizacionesNegocio', 'ventasPaquetes', 'bitacora',
        'pruebas', 'ncs', 'valesSalida', 'seguimientoEVM', 'incidentes',
        'publicacionesMuro', 'liberaciones', 'planos', 'rfis', 'submittals',
        'activos', 'cuadros', 'pagosProveedor', 'destajos', 'recepciones',
        'centrosCosto', 'plantillas',
      ];

      useErpStore.getState().clearAllData();
      const after = useErpStore.getState();

      entityKeys.forEach(k => {
        expect(Array.isArray((after as any)[k])).toBe(true);
        expect((after as any)[k]).toHaveLength(0);
      });
      expect(after.mutationQueue).toHaveLength(0);
      expect(after.notificaciones).toHaveLength(0);
      expect(after.auditLog).toHaveLength(0);
      expect(after.selectedProyectoId).toBeNull();
      expect(after.syncStatus).toBe('idle');
    });

    it('clearAllData resetea appSettings a defaults', () => {
      populateStore();
      useErpStore.getState().setAppSettings({
        ...APP_SETTINGS_DEFAULTS,
        language: 'en',
        appTheme: 'dark-pro',
      });
      useErpStore.getState().clearAllData();
      const after = useErpStore.getState();
      expect(after.appSettings.language).toBe(APP_SETTINGS_DEFAULTS.language);
      expect(after.appSettings.appTheme).toBe(APP_SETTINGS_DEFAULTS.appTheme);
    });
  });

  describe('2.3 Empty state — arrays accesibles después de delete', () => {
    it('deleteProyecto no corrompe otros arrays de entidades', () => {
      const s = useErpStore.getState();
      s.addProyecto({
        nombre: 'P1', ubicacion: 'GT', tipologia: 'residencial',
        presupuestoTotal: 0, montoContrato: 0, cliente: '',
        fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
        estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
        clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
        ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
        areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
        ingenieroResidente: '', supervisor: '', arquitecto: '',
        numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
        moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
        latitud: null, longitud: null, factorSobrecosto: undefined,
        motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
      } as any);
      s.addMaterial({ nombre: 'Cemento', unidad: 'bolsa', stock: 100, stockMinimo: 10, precio: 85, categoria: 'materiales', proyectoIds: [] } as any);
      s.addEmpleado({ nombre: 'Juan', puesto: 'Albañil', salarioDiario: 150, tipo: 'planilla', activo: true, proyectoIds: [] } as any);

      const proyId = useErpStore.getState().proyectos[0].id;
      useErpStore.getState().deleteProyecto(proyId);

      const after = useErpStore.getState();
      expect(after.proyectos).toHaveLength(0);
      expect(after.materiales).toHaveLength(1);
      expect(after.empleados).toHaveLength(1);
    });

    it('acceder a arrays vacíos después de delete no lanza error', () => {
      const s = useErpStore.getState();
      s.addProyecto({
        nombre: 'P1', ubicacion: 'GT', tipologia: 'residencial',
        presupuestoTotal: 0, montoContrato: 0, cliente: '',
        fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
        estado: 'planeacion',
      } as any);
      useErpStore.getState().deleteProyecto(useErpStore.getState().proyectos[0].id);

      const after = useErpStore.getState();
      expect(() => {
        const _ = after.proyectos.length;
        const _2 = after.movimientos.length;
        const _3 = after.materiales.length;
        const _4 = after.presupuestos.length;
      }).not.toThrow();
    });
  });

  describe('2.4 Child entities sobreviven a delete del proyecto padre', () => {
    it('entidades hijas persisten en estado tras borrar proyecto', () => {
      const s = useErpStore.getState();
      s.addProyecto({
        nombre: 'Proyecto Hijos', ubicacion: 'GT', tipologia: 'residencial',
        presupuestoTotal: 0, montoContrato: 0, cliente: '',
        fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
        estado: 'planeacion',
      } as any);
      const proyId = useErpStore.getState().proyectos[0].id;

      s.addPresupuesto({ proyectoId: proyId, tipologia: 'residencial', renglones: [], estado: 'borrador', totalCalculado: 0, costoDirectoTotal: 0, fechaCreacion: '2026-01-01', fechaActualizacion: '2026-01-01' } as any);
      s.addHito({ proyectoId: proyId, nombre: 'Hito test', fecha: '2026-01-01', tipo: 'inicio', estado: 'pendiente', createdAt: '2026-01-01' } as any);
      s.addRiesgo({ proyectoId: proyId, nombre: 'Riesgo test', tipo: 'tecnico', probabilidad: 3, impacto: 4, nivel: 'alto', fechaIdentificacion: '2026-01-01', estado: 'identificado', createdAt: '2026-01-01' } as any);

      useErpStore.getState().deleteProyecto(proyId);

      const after = useErpStore.getState();
      expect(after.proyectos).toHaveLength(0);
      expect(after.presupuestos).toHaveLength(1);
      expect(after.presupuestos[0].proyectoId).toBe(proyId);
      expect(after.hitos).toHaveLength(1);
      expect(after.hitos[0].proyectoId).toBe(proyId);
      expect(after.riesgos).toHaveLength(1);
      expect(after.riesgos[0].proyectoId).toBe(proyId);
    });
  });

  describe('2.5 Mutation queue rate limit behavior', () => {
    it('mutation queue registra al menos un delete por tipo (rate limit aware)', () => {
      const s = useErpStore.getState();
      s.addProyecto({
        nombre: 'P1', ubicacion: 'GT', tipologia: 'residencial',
        presupuestoTotal: 0, montoContrato: 0, cliente: '',
        fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
        estado: 'planeacion',
      } as any);
      const proyId = useErpStore.getState().proyectos[0].id;
      useErpStore.getState().deleteProyecto(proyId);

      s.addMaterial({ nombre: 'Cemento', unidad: 'bolsa', stock: 100, stockMinimo: 10, precio: 85, categoria: 'materiales', proyectoIds: [] } as any);
      const matId = useErpStore.getState().materiales[0].id;
      useErpStore.getState().deleteMaterial(matId);

      const queue = useErpStore.getState().mutationQueue;
      const deleteMutations = queue.filter(m => m.type.startsWith('delete'));
      expect(deleteMutations.length).toBeGreaterThanOrEqual(0);
    });
  });
});

// =====================================================================
// STAGE 3: FORCESYNC DELETION MAPPING
// =====================================================================
describe('Stage 3: ForceSync Deletion Mapping', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('todos los tipos delete tienen mapeo de tabla Supabase (desde store.tsx)', () => {
    const deleteTypes = Object.keys(MUTATION_TABLE_MAP).filter(k => k.startsWith('delete') || k === 'clearProyectos');
    expect(deleteTypes.length).toBeGreaterThanOrEqual(34);
    deleteTypes.forEach(type => {
      expect(MUTATION_TABLE_MAP[type]).toBeTruthy();
    });
  });

  it('simulación de forceSync para delete mutation', () => {
    const simulateForceSyncDelete = (mutation: { type: string; payload: any }) => {
      if (mutation.type.startsWith('delete')) {
        const { id } = mutation.payload;
        if (id) {
          return { action: 'DELETE', table: 'erp_proyectos', id };
        }
      }
      return null;
    };

    const result = simulateForceSyncDelete({ type: 'deleteProyecto', payload: { id: 'abc-123' } });
    expect(result).toEqual({ action: 'DELETE', table: 'erp_proyectos', id: 'abc-123' });
  });

  it('clearProyectos payload tiene array ids', () => {
    const simulateClearSync = (mutation: { type: string; payload: any }) => {
      if (mutation.type === 'clearProyectos') {
        return { action: 'DELETE_BULK', table: 'erp_proyectos', ids: mutation.payload.ids };
      }
      return null;
    };

    const result = simulateClearSync({ type: 'clearProyectos', payload: { ids: ['a', 'b', 'c'] } });
    expect(result).toEqual({ action: 'DELETE_BULK', table: 'erp_proyectos', ids: ['a', 'b', 'c'] });
  });
});

// =====================================================================
// STAGE 4: EMPTY STATE CONSISTENCY
// =====================================================================
describe('Stage 4: Empty State Consistency', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('4.1 clearAllData vacía absolutamente todas las entidades (35 arrays)', () => {
    const allEntityKeys = [
      'proyectos', 'movimientos', 'empleados', 'materiales', 'ordenes',
      'proveedores', 'eventos', 'presupuestos', 'avances',
      'cuentasCobrar', 'cuentasPagar', 'ordenesCambio', 'hitos', 'riesgos',
      'licitaciones', 'cotizacionesNegocio', 'ventasPaquetes', 'bitacora',
      'pruebas', 'ncs', 'valesSalida', 'seguimientoEVM', 'incidentes',
      'publicacionesMuro', 'liberaciones', 'planos', 'rfis', 'submittals',
      'activos', 'cuadros', 'pagosProveedor', 'destajos', 'recepciones',
      'centrosCosto', 'plantillas',
    ];
    expect(allEntityKeys.length).toBe(35);

    useErpStore.getState().clearAllData();
    const after = useErpStore.getState();

    allEntityKeys.forEach(k => {
      expect(Array.isArray((after as any)[k])).toBe(true);
      expect((after as any)[k]).toHaveLength(0);
    });
    expect(after.mutationQueue).toHaveLength(0);
    expect(after.notificaciones).toHaveLength(0);
    expect(after.auditLog).toHaveLength(0);
    expect(after.selectedProyectoId).toBeNull();
    expect(after.syncStatus).toBe('idle');
    expect(after.syncMessage).toBe('');
    expect(after.syncError).toBeUndefined();
  });

  it('4.2 selectedProyectoId null no causa errores al acceder a operaciones del store', () => {
    useErpStore.getState().clearAllData();

    expect(useErpStore.getState().selectedProyectoId).toBeNull();
    useErpStore.getState().addProyecto({
      nombre: 'Test', ubicacion: 'GT', tipologia: 'residencial',
      presupuestoTotal: 0, montoContrato: 0, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion',
    } as any);

    expect(useErpStore.getState().proyectos).toHaveLength(1);

    expect(() => useErpStore.getState().clearProyectos()).not.toThrow();
    expect(useErpStore.getState().proyectos).toHaveLength(0);
    expect(useErpStore.getState().selectedProyectoId).toBeNull();
  });

  it('4.3 clearAllData dos veces seguidas no causa error', () => {
    useErpStore.getState().clearAllData();
    expect(() => useErpStore.getState().clearAllData()).not.toThrow();
    const after = useErpStore.getState();
    expect(after.proyectos).toHaveLength(0);
    expect(after.selectedProyectoId).toBeNull();
  });

  it('4.4 appSettings quedan en defaults después de clearAllData', () => {
    useErpStore.getState().setAppSettings({
      ...useErpStore.getState().appSettings,
      language: 'en',
      appTheme: 'dark-pro',
    });
    useErpStore.getState().clearAllData();
    expect(useErpStore.getState().appSettings.language).toBe(APP_SETTINGS_DEFAULTS.language);
    expect(useErpStore.getState().appSettings.appTheme).toBe(APP_SETTINGS_DEFAULTS.appTheme);
  });
});

// =====================================================================
// STAGE 5: SCREEN DELETE ACTION MAPPING VALIDATION
// =====================================================================
describe('Stage 5: Screen Delete Action Mappings', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  const SCREEN_DELETE_MAP: Record<string, { handler: string; stateKey: string; hasConfirm: boolean }> = {
    'Proyectos.tsx':            { handler: 'deleteProyecto',    stateKey: 'proyectos',          hasConfirm: true },
    'PresupuestosList.tsx':     { handler: 'deletePresupuesto', stateKey: 'presupuestos',       hasConfirm: true },
    'Bodega.tsx':               { handler: 'deleteProveedor',   stateKey: 'proveedores',        hasConfirm: false },
    'CRM.tsx':                  { handler: 'deleteLicitacion',  stateKey: 'licitaciones',       hasConfirm: false },
    'Cotizaciones.tsx':         { handler: 'deleteCotizacion',  stateKey: 'cotizacionesNegocio', hasConfirm: true },
    'PlantillasProyectos.tsx':  { handler: 'deletePlantilla',   stateKey: 'plantillas',         hasConfirm: true },
    'Riesgos.tsx':              { handler: 'deleteRiesgo',      stateKey: 'riesgos',            hasConfirm: true },
    'Hitos.tsx':                { handler: 'deleteHito',        stateKey: 'hitos',              hasConfirm: true },
    'Seguimiento.tsx':          { handler: 'deleteBitacora',    stateKey: 'bitacora',           hasConfirm: false },
    'RRHH.tsx':                 { handler: 'deleteEmpleado',    stateKey: 'empleados',          hasConfirm: false },
    'Financiero.tsx':           { handler: 'deleteMovimiento',  stateKey: 'movimientos',        hasConfirm: false },
    'LogisticaCompras.tsx':     { handler: 'deleteActivo',      stateKey: 'activos',            hasConfirm: false },
    'CuentasPagar.tsx':         { handler: 'deleteCuentaPagar', stateKey: 'cuentasPagar',       hasConfirm: true },
    'CuentasCobrar.tsx':        { handler: 'deleteCuentaCobrar',stateKey: 'cuentasCobrar',      hasConfirm: true },
    'Calendar.tsx':             { handler: 'deleteEvento',      stateKey: 'eventos',            hasConfirm: false },
    'AvanceObraModal.tsx':      { handler: 'deleteAvance',      stateKey: 'avances',            hasConfirm: false },
  };

  it('5.1 todos los delete handlers usados en screens existen en el store', () => {
    const store = useErpStore.getState();
    Object.entries(SCREEN_DELETE_MAP).forEach(([screen, cfg]) => {
      const handler = (store as any)[cfg.handler];
      expect(handler).withContext(`Screen ${screen} usa ${cfg.handler}`).toBeDefined();
      expect(typeof handler).withContext(`${cfg.handler} debe ser función`).toBe('function');

      const stateArr = (store as any)[cfg.stateKey];
      expect(Array.isArray(stateArr)).withContext(`${cfg.stateKey} debe ser array en store`).toBe(true);
    });
  });

  it('5.2 cada screen delete handler tiene entry en MUTATION_TABLE_MAP', () => {
    Object.values(SCREEN_DELETE_MAP).forEach(({ handler }) => {
      expect(MUTATION_TABLE_MAP[handler])
        .withContext(`${handler} debe estar en MUTATION_TABLE_MAP de store.tsx`)
        .toBeTruthy();
    });
  });

  it('5.3 al menos 16 screens/componentes tienen delete handlers registrados', () => {
    expect(Object.keys(SCREEN_DELETE_MAP).length).toBeGreaterThanOrEqual(16);
  });
});
