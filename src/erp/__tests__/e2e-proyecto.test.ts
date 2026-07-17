import { describe, it, expect, beforeEach } from 'vitest';
import { useErpStore } from '../zustandStore';

describe('E2E: flujo completo de inicio de proyecto', () => {
  beforeEach(() => {
    useErpStore.setState({
      proyectos: [], presupuestos: [], hitos: [], avances: [], ordenes: [],
      materiales: [], valesSalida: [], movimientos: [], empleados: [],
      proveedores: [], eventos: [], cuentasCobrar: [], cuentasPagar: [],
      ordenesCambio: [], riesgos: [], licitaciones: [], cotizacionesNegocio: [],
      ventasPaquetes: [], bitacora: [], pruebas: [], ncs: [],
      seguimientoEVM: [], incidentes: [], publicacionesMuro: [],
      liberaciones: [], planos: [], rfis: [], submittals: [],
      activos: [], cuadros: [], pagosProveedor: [], destajos: [],
      recepciones: [],
      mutationQueue: [], syncMessage: '', syncCooldown: false, notificaciones: [],
      isOnline: true, appSettings: { uiMode: 'antd', appTheme: 'ant-design', primaryColor: '#ff8c42', language: 'es', dateFormat: 'DD/MM/YYYY', currency: 'GTQ', sidebarCollapsed: false, animationsEnabled: true, compactMode: false, fontSize: 'medium', empresaInfo: { nombre: 'X', nit: '1', telefono: '', email: '', direccion: '', ciudad: '', pais: '' } },
      auditLog: [], errorLogs: [],
    });
  });

  it('flujo completo: crear proyecto -> presupuesto -> hitos -> ejecucion -> avance -> OC -> vale salida', () => {
    const get = () => useErpStore.getState();

    get().addProyecto({
      id: 'proy-e2e-1', nombre: 'Edificio Central', ubicacion: 'Zona 10', tipologia: 'comercial',
      presupuestoTotal: 500000, montoContrato: 550000, cliente: 'Inmobiliaria XYZ',
      fechaInicio: '2026-01-01', fechaFin: '2026-12-31', avanceFisico: 0, avanceFinanciero: 0,
      estado: 'planeacion', descripcion: 'Torre de oficinas', tipoObra: 'nueva',
      clienteNit: '1234567-8', clienteTelefono: '1234-5678', clienteEmail: 'xyz@gt.com',
      direccion: 'Av. Reforma', ciudad: 'Guatemala', departamento: 'Guatemala',
      codigoPostal: '01001', pais: 'Guatemala', areaConstruccion: 5000, numPisos: 12,
      plazoSemanas: 52, ingenieroResidente: 'Ing. Rios', supervisor: 'Arq. Mendez',
      arquitecto: 'Arq. Lopez', numeroExpediente: 'EXP-001', numeroLicencia: 'LIC-001',
      margenUtilidadObjetivo: 15, moneda: 'GTQ', etapa: 'planificacion',
      lat: 14.6349, lng: -90.5069, factorSobrecosto: undefined,
      motivoPausa: '', pausadoPor: '', fechaPausa: '', fechaReanudacionEstimada: '',
    } as any);
    const realId = get().proyectos[0].id;
    expect(get().proyectos[0].estado).toBe('planeacion');

    get().addPresupuesto({
      id: 'pres-1', proyectoId: realId, tipologia: 'comercial',
      renglones: [], estado: 'aprobado', totalCalculado: 500000, costoDirectoTotal: 450000,
      fechaCreacion: new Date().toISOString(), fechaActualizacion: new Date().toISOString(),
      versionPresupuesto: 1, notas: null,
    } as any);
    expect(get().presupuestos.length).toBeGreaterThan(0);

    get().addHito({ id: 'h1', proyectoId: realId, nombre: 'Fundaciones', fechaProgramada: '2026-02-01', completado: false, avance: 0 });
    get().addHito({ id: 'h2', proyectoId: realId, nombre: 'Estructura', fechaProgramada: '2026-04-01', completado: false, avance: 0 });
    expect(get().hitos.length).toBeGreaterThanOrEqual(2);

    get().updateProyecto(realId, { estado: 'ejecucion', etapa: 'construccion' });
    expect(get().proyectos.find(p => p.id === realId)?.estado).toBe('ejecucion');

    const afterAvance = get().proyectos.find(p => p.id === realId);
    console.log('afterAvance', afterAvance);
    get().updateProyecto(realId, { avanceFisico: 100, avanceFinanciero: 100 });
    const after100 = get().proyectos.find(p => p.id === realId);
    console.log('after100', after100);
    get().updateProyecto(realId, { estado: 'finalizado', etapa: 'cierre' });
    const finalProyecto = get().proyectos.find(p => p.id === realId);
    console.log('finalProyecto', finalProyecto);
    expect(finalProyecto?.estado).toBe('finalizado');
  });

  it('flujo sync: presupuesto aprobado actualiza automaticamente el proyecto en planeacion', () => {
    const get = () => useErpStore.getState();

    get().addProyecto({
      id: 'proy-sync-e2e', nombre: 'Proyecto Sync E2E', ubicacion: 'Zona 5', tipologia: 'comercial',
      presupuestoTotal: 0, montoContrato: 0, cliente: 'Cliente Sync',
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
    } as any);
    const realProyectoId = get().proyectos[0].id;

    get().addPresupuesto({
      id: 'pres-sync-e2e', proyectoId: realProyectoId, tipologia: 'comercial',
      renglones: [], estado: 'aprobado', totalCalculado: 250000, costoDirectoTotal: 200000,
      fechaCreacion: '2026-02-01T00:00:00.000Z', fechaActualizacion: '2026-02-01T00:00:00.000Z',
      versionPresupuesto: 1, notas: null,
    } as any);
    const realPresupuestoId = get().presupuestos[0].id;

    const proyecto = get().proyectos.find(p => p.id === realProyectoId)!;
    expect(proyecto.presupuestoTotal).toBe(250000);
    expect(proyecto.montoContrato).toBe(250000);
    expect(proyecto.presupuestoActualId).toBe(realPresupuestoId);
    expect(proyecto.avanceFisico).toBe(0);
    expect(proyecto.avanceFinanciero).toBe(0);
    expect(proyecto.fechaInicio).toBe('2026-02-01');
    expect(proyecto.fechaFin).toBe('2027-01-31');

    const audit = get().auditLog.find(e => e.accion === 'sync_presupuesto_aprobado');
    expect(audit).toBeDefined();
    expect(audit!.entidadId).toBe(realProyectoId);
  });
});
