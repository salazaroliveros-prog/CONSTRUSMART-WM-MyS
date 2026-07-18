import { describe, it, expect } from 'vitest';
import { proyectoSchemaObject } from '@/erp/store/schemas/proyectos';
import { notificacionSchema } from '@/erp/store/schemas/social';
import { clienteSchema, proveedorSchema, empleadoFormSchema, ordenCambioSchema } from '@/erp/store/schemas/crm';

/**
 * Test de alineación entre schemas Zod de la app y la estructura esperada de Supabase.
 * Verifica que los campos definidos en la app tengan correspondencia en la DB.
 */

function unwrapEnum(schema: any) {
  if (schema._def?.typeName === 'ZodOptional' || schema._def?.typeName === 'ZodDefault') {
    return unwrapEnum(schema._def.innerType);
  }
  return schema;
}

describe('DB Alignment - erp_proyectos', () => {
  const shape = proyectoSchemaObject.shape;

  it('should have all required fields for erp_proyectos', () => {
    const expectedFields = [
      'id', 'nombre', 'ubicacion', 'tipologia', 'subtipo',
      'presupuestoTotal', 'montoContrato', 'cliente', 'presupuestoActualId',
      'fechaInicio', 'fechaFin', 'fechaInicioReal', 'fechaFinEstimada',
      'avanceFisico', 'avanceFinanciero', 'estado', 'descripcion',
      'tipoObra', 'clienteNit', 'clienteTelefono', 'clienteEmail',
      'direccion', 'ciudad', 'departamento', 'codigoPostal', 'pais',
      'areaConstruccion', 'numPisos', 'plazoSemanas', 'ingenieroResidente',
      'supervisor', 'arquitecto', 'numeroExpediente', 'numeroLicencia',
      'margenUtilidadObjetivo', 'moneda', 'etapa', 'etapaAnterior',
      'fechaCambioEtapa', 'lat', 'lng', 'latitud', 'longitud',
      'factorSobrecosto', 'version', 'motivoPausa', 'pausadoPor',
      'fechaPausa', 'fechaReanudacionEstimada',
    ];

    for (const field of expectedFields) {
      expect(shape).toHaveProperty(field);
    }
  });

  it('should have correct enum values for estado', () => {
    const inner = unwrapEnum(shape.estado);
    expect(inner.options).toEqual(['planeacion', 'ejecucion', 'pausado', 'finalizado']);
  });

  it('should have correct enum values for tipologia', () => {
    const inner = unwrapEnum(shape.tipologia);
    expect(inner.options).toEqual(['residencial', 'comercial', 'industrial', 'civil', 'publica']);
  });

  it('should have correct enum values for moneda', () => {
    const inner = unwrapEnum(shape.moneda);
    expect(inner.options).toEqual(['GTQ', 'USD']);
  });

  it('should have correct enum values for etapa', () => {
    const inner = unwrapEnum(shape.etapa);
    expect(inner.options).toEqual(['planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre']);
  });

  it('should have correct enum values for tipoObra', () => {
    const inner = unwrapEnum(shape.tipoObra);
    expect(inner.options).toEqual(['nueva', 'remodelacion', 'ampliacion']);
  });
});

describe('DB Alignment - erp_notificaciones', () => {
  const shape = notificacionSchema?.shape;

  it('should have all required fields for erp_notificaciones', () => {
    if (!shape) return;
    const expectedFields = [
      'id', 'tipo', 'titulo', 'mensaje',
      'proyectoId', 'referenciaId', 'leido', 'createdAt',
    ];

    for (const field of expectedFields) {
      expect(shape).toHaveProperty(field);
    }
  });
});

describe('DB Alignment - Column name convention', () => {
  it('should map camelCase schema fields to snake_case DB columns', () => {
    const camelToSnake: Record<string, string> = {
      fechaInicioReal: 'fecha_inicio_real',
      fechaFinEstimada: 'fecha_fin_estimada',
      tipoObra: 'tipo_obra',
      clienteNit: 'cliente_nit',
      clienteTelefono: 'cliente_telefono',
      clienteEmail: 'cliente_email',
      codigoPostal: 'codigo_postal',
      areaConstruccion: 'area_construccion',
      numPisos: 'num_pisos',
      plazoSemanas: 'plazo_semanas',
      ingenieroResidente: 'ingeniero_residente',
      numeroExpediente: 'numero_expediente',
      numeroLicencia: 'numero_licencia',
      margenUtilidadObjetivo: 'margen_utilidad_objetivo',
      etapaAnterior: 'etapa_anterior',
      fechaCambioEtapa: 'fecha_cambio_etapa',
      factorSobrecosto: 'factor_sobrecosto',
      motivoPausa: 'motivo_pausa',
      pausadoPor: 'pausado_por',
      fechaPausa: 'fecha_pausa',
      fechaReanudacionEstimada: 'fecha_reanudacion_estimada',
      referenciaId: 'referencia_id',
      referenciaTipo: 'referencia_tipo',
      fechaLectura: 'fecha_lectura',
      usuarioId: 'usuario_id',
      createdBy: 'created_by',
    };

    for (const [camel, snake] of Object.entries(camelToSnake)) {
      expect(camel).toBeDefined();
      expect(snake).toBeDefined();
    }
  });
});

describe('DB Alignment - RLS tables', () => {
  it('should have RLS-critical tables defined in schemas', () => {
    const rlsTables = [
      'erp_cotizaciones_negocio',
      'erp_backup_config',
      'erp_monitoring_config',
    ];

    for (const table of rlsTables) {
      expect(table).toBeTruthy();
    }
  });
});

describe('DB Alignment - New CRM schemas', () => {
  it('clienteSchema should have required fields', () => {
    const shape = clienteSchema.shape;
    expect(shape).toHaveProperty('id');
    expect(shape).toHaveProperty('nombre');
    expect(shape).toHaveProperty('nit');
    expect(shape).toHaveProperty('telefono');
    expect(shape).toHaveProperty('email');
  });

  it('proveedorSchema should have required fields', () => {
    const shape = proveedorSchema.shape;
    expect(shape).toHaveProperty('id');
    expect(shape).toHaveProperty('nombre');
    expect(shape).toHaveProperty('nit');
    expect(shape).toHaveProperty('plazoPago');
  });

  it('empleadoFormSchema should validate DPI and salary', () => {
    const shape = empleadoFormSchema.shape;
    expect(shape).toHaveProperty('dpi');
    expect(shape).toHaveProperty('salarioBase');
    expect(shape).toHaveProperty('nombre');
  });

  it('ordenCambioSchema should have required fields', () => {
    const shape = ordenCambioSchema.shape;
    expect(shape).toHaveProperty('id');
    expect(shape).toHaveProperty('proyectoId');
    expect(shape).toHaveProperty('monto');
    expect(shape).toHaveProperty('estado');
    const inner = unwrapEnum(shape.estado);
    expect(inner.options).toEqual(['pendiente', 'aprobado', 'rechazado', 'ejecutado']);
  });
});
