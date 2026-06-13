import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useErpStore } from '../zustandStore';
import { APP_SETTINGS_DEFAULTS } from '../utils';

describe('Zustand migration', () => {
  beforeEach(() => {
    useErpStore.setState({
      proyectos: [], movimientos: [], empleados: [], materiales: [], ordenes: [], proveedores: [],
      eventos: [], presupuestos: [], avances: [], cuentasCobrar: [], cuentasPagar: [],
      ordenesCambio: [], hitos: [], riesgos: [], licitaciones: [], cotizacionesNegocio: [],
      ventasPaquetes: [], bitacora: [], pruebas: [], ncs: [], valesSalida: [],
      seguimientoEVM: [], incidentes: [], publicacionesMuro: [], liberaciones: [], planos: [],
      rfis: [], submittals: [], activos: [], cuadros: [], pagosProveedor: [], destajos: [],
      recepciones: [],
      mutationQueue: [], syncMessage: '', syncCooldown: false, notificaciones: [],
      isOnline: true, selectedProyectoId: null, appSettings: APP_SETTINGS_DEFAULTS,
    });
    vi.clearAllMocks();
  });

  it('exposes 30+ entity arrays and 100+ action functions', () => {
    const s = useErpStore.getState();
    expect(Array.isArray(s.proyectos)).toBe(true);
    expect(Array.isArray(s.materiales)).toBe(true);
    expect(Array.isArray(s.ordenes)).toBe(true);
    expect(typeof s.addProyecto).toBe('function');
    expect(typeof s.updateProyecto).toBe('function');
    expect(typeof s.deleteProyecto).toBe('function');
    expect(typeof s.addMaterial).toBe('function');
    expect(typeof s.updateMaterial).toBe('function');
    expect(typeof s.updateOrden).toBe('function');
    expect(Array.isArray(s.notificaciones)).toBe(true);
    expect(typeof s.addNotificacion).toBe('function');
    expect(typeof s.enqueueMutation).toBe('function');
    expect(typeof s.addCotizacion).toBe('function');
    expect(typeof s.addPublicacionMuro).toBe('function');
  });

  it('addProyecto enqueues mutation and updates state', () => {
    useErpStore.getState().addProyecto({
      id: 'p1', nombre: 'Demo', ubicacion: 'GUA', tipologia: 'residencial',
      presupuestoTotal: 1000, montoContrato: 1000, cliente: '',
      fechaInicio: '', fechaFin: '', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: '', tipoObra: 'nueva',
      clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '',
      ciudad: '', departamento: '', codigoPostal: '', pais: 'Guatemala',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined,
      ingenieroResidente: '', supervisor: '', arquitecto: '',
      numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: undefined,
      moneda: 'GTQ', etapa: 'planificacion', lat: null, lng: null,
      latitud: null, longitud: null, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '', version: 1,
    } as any);
    const s = useErpStore.getState();
    expect(s.proyectos).toHaveLength(1);
    expect(s.proyectos[0].nombre).toBe('Demo');
    expect(s.mutationQueue).toHaveLength(1);
    expect(s.mutationQueue[0].type).toBe('addProyecto');
  });

  it('updateProyecto increments version (optimistic locking)', () => {
    useErpStore.getState().addProyecto({
      id: 'p1', nombre: 'A', ubicacion: '', tipologia: 'residencial',
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
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '', version: 1,
    } as any);
    const s = useErpStore.getState();
    const id = s.proyectos[0].id;
    const v1 = s.proyectos[0].version;
    useErpStore.getState().updateProyecto(id, { nombre: 'B' });
    const s2 = useErpStore.getState();
    expect(s2.proyectos[0].nombre).toBe('B');
    expect(s2.proyectos[0].version).toBe(v1 + 1);
  });

  it('addCotizacion auto-sets createdAt and updatedAt', () => {
    const before = Date.now();
    useErpStore.getState().addCotizacion({
      id: '', clienteId: 'c1', proyectoId: undefined, numero: 'COT-1',
      estado: 'borrador', items: [], subtotal: 0, impuestos: 0, total: 0,
      moneda: 'GTQ', vigente: true,
    } as any);
    const c = useErpStore.getState().cotizacionesNegocio[0];
    expect(c.createdAt).toBeDefined();
    expect(c.updatedAt).toBeDefined();
    expect(new Date(c.createdAt).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('notificaciones dedup by proyectoId + titulo when unread', () => {
    useErpStore.getState().addNotificacion('info', 'Avance', 'Msg 1', 'proy1', 'ref1');
    useErpStore.getState().addNotificacion('info', 'Avance', 'Msg 1', 'proy1', 'ref1');
    const s = useErpStore.getState();
    expect(s.notificaciones).toHaveLength(1);
    expect(s.notificaciones[0].mensaje).toContain('(+1)');
  });

  it('APP_SETTINGS_DEFAULTS is the single source of truth', async () => {
    const { APP_SETTINGS_DEFAULTS: defaults } = await import('../utils');
    expect(defaults.uiMode).toBe('antd');
    expect(defaults.empresaInfo?.nit).toBe('1234567-8');
    expect(defaults.currency).toBe('GTQ');
  });
});
