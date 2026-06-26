import { describe, it, expect, beforeEach } from 'vitest';
import { useErpStore, resetRateLimit } from '../zustandStore';

describe('Timestamps en Mutaciones', () => {
  beforeEach(() => {
    useErpStore.getState().clearAllData();
    resetRateLimit();
  });

  it('addProyecto debe añadir createdAt y updatedAt', () => {
    const mockProyecto = { id: 'proj-1', nombre: 'Test Proyecto', presupuestoTotal: 100000, montoContrato: 100000, cliente: 'Test', fechaInicio: '2024-01-01', fechaFin: '2024-12-31', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', descripcion: '', tipoObra: 'nueva', clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '', ciudad: '', departamento: '', codigoPostal: '', pais: '', areaConstruccion: 0, numPisos: 0, plazoSemanas: 0, ingenieroResidente: '', supervisor: '', arquitecto: '', numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: 0, moneda: 'GTQ', etapa: 'planeacion', lat: 0, lng: 0 };
    useErpStore.getState().addProyecto(mockProyecto);

    const proyectos = useErpStore.getState().proyectos;
    expect(proyectos).toHaveLength(1);
    expect(proyectos[0].createdAt).toBeDefined();
    expect(proyectos[0].updatedAt).toBeDefined();
    expect(typeof proyectos[0].createdAt).toBe('string');
    expect(typeof proyectos[0].updatedAt).toBe('string');
  });

  it('addProveedor debe añadir createdAt y updatedAt', () => {
    const mockProveedor = { id: 'prov-1', nombre: 'Proveedor Test', rfc: 'RFC123', contacto: 'Juan', telefono: '123456', email: 'test@test.com', direccion: 'Calle 1', ciudad: 'Guatemala', pais: 'Guatemala', categoria: 'materiales', rating: 5 };
    useErpStore.getState().addProveedor(mockProveedor);

    const proveedores = useErpStore.getState().proveedores;
    expect(proveedores).toHaveLength(1);
    expect(proveedores[0].createdAt).toBeDefined();
    expect(proveedores[0].updatedAt).toBeDefined();
  });

  it('mutationQueue debe tener timestamps en formato ISO string (snake_case)', () => {
    const mockProyecto = { id: 'proj-1', nombre: 'Test Proyecto', presupuestoTotal: 100000, montoContrato: 100000, cliente: 'Test', fechaInicio: '2024-01-01', fechaFin: '2024-12-31', avanceFisico: 0, avanceFinanciero: 0, estado: 'planeacion', descripcion: '', tipoObra: 'nueva', clienteNit: '', clienteTelefono: '', clienteEmail: '', direccion: '', ciudad: '', departamento: '', codigoPostal: '', pais: '', areaConstruccion: 0, numPisos: 0, plazoSemanas: 0, ingenieroResidente: '', supervisor: '', arquitecto: '', numeroExpediente: '', numeroLicencia: '', margenUtilidadObjetivo: 0, moneda: 'GTQ', etapa: 'planeacion', lat: 0, lng: 0 };
    useErpStore.getState().addProyecto(mockProyecto);

    const queue = useErpStore.getState().mutationQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0].payload.created_at).toBeDefined();
    expect(queue[0].payload.updated_at).toBeDefined();

    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(queue[0].payload.created_at).toMatch(isoRegex);
    expect(queue[0].payload.updated_at).toMatch(isoRegex);
  });
});
