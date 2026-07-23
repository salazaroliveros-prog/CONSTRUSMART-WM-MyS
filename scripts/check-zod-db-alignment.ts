import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54260/postgres';
const SCHEMAS_DIR = path.join(process.cwd(), 'src', 'erp', 'store', 'schemas');

// Mapa de schemas Zod a tablas de DB (actualizado con tablas existentes)
const SCHEMA_TO_TABLE_MAP: Record<string, string> = {
  'proyectoSchema': 'erp_proyectos',
  'movimientoSchema': 'erp_movimientos',
  'cuentaCobrarSchema': 'erp_cuentas_cobrar',
  'cuentaPagarSchema': 'erp_cuentas_pagar',
  'ventaPaqueteSchema': 'erp_ventas_paquetes',
  'presupuestoSchema': 'erp_presupuestos',
  'cotizacionSchema': 'erp_cotizaciones_negocio',
  'empleadoSchema': 'erp_empleados',
  'incidenteSchema': 'erp_incidentes',
  'materialSchema': 'erp_materiales',
  'ordenSchema': 'erp_ordenes_compra',
  'valeSalidaSchema': 'erp_vales_salida',
  'eventoSchema': 'erp_eventos_calendario', // Actualizado
  'bitacoraSchema': 'erp_bitacora',
  'seguimientoSchema': 'erp_seguimiento',
  'avanceObraSchema': 'erp_avances',
  'hitoSchema': 'erp_hitos',
  'riesgoSchema': 'erp_riesgos',
  'muroSchema': 'erp_publicaciones_muro',
  'notificacionSchema': 'erp_notificaciones',
  'clienteSchema': 'erp_cotizaciones_negocio', // Los clientes están en cotizaciones
  'proveedorSchema': 'erp_proveedores',
  'ordenCambioSchema': 'erp_ordenes_cambio',
  'activoSchema': 'erp_activos',
  'licitacionSchema': 'erp_cuadros', // Las licitaciones son cuadros comparativos
  'cuadroSchema': 'erp_cuadros',
  'pagoProveedorSchema': 'erp_pagos_proveedor',
  'planoSchema': 'erp_planos',
  'rfiSchema': 'erp_rfis',
  'submittalSchema': 'erp_submittals',
  'destajoSchema': 'erp_destajos',
  'recepcionAlmacenSchema': 'erp_recepciones_almacen',
  'insumosBaseSchema': 'erp_insumos_base',
  'centroCostoSchema': 'erp_centros_costo',
  'plantillaSchema': 'erp_plantillas_proyectos',
  'weatherDataSchema': 'erp_proyecto_weather', // Integrado en proyecto_weather
  'proyectoWeatherSchema': 'erp_proyecto_weather',
  'errorLogSchema': 'erp_error_log',
  'auditLogSchema': 'erp_audit_log',
  'appSettingsSchema': 'erp_app_config',
  'accessLogSchema': 'erp_access_log',
  'cajaChicaSchema': 'erp_cajas_chicas',
  'anticipoSchema': 'erp_anticipos',
  'amortizacionSchema': 'erp_amortizaciones',
  'rendimientoCuadrillaSchema': 'erp_rendimientos_cuadrilla',
  'rendimientoCampoSchema': 'erp_rendimientos_campo',
  'bodegaSchema': 'erp_bodega',
  'documentoSchema': 'erp_documentos',
  'permisoSchema': 'erp_permisos',
  'checklistSchema': 'erp_checklist',
  'configuracionSchema': 'erp_configuracion',
  'apiKeySchema': 'erp_api_keys',
  // Schemas de cálculo (motor de cálculo)
  'calculoProyectoSchema': 'erp_calculos_proyecto',
  'reglaFactorSchema': 'erp_reglas_factores',
  'normativaDepartamentalSchema': 'erp_normativa_departamental',
  'escalaProduccionSchema': 'erp_escalas_produccion',
  'estacionalidadSchema': 'erp_estacionalidad',
  'historialAplicacionReglaSchema': 'erp_historial_aplicacion_reglas',
  'ajusteEstacionalActividadSchema': 'erp_ajustes_estacionales_actividad',
  'aplicacionEscalaSchema': 'erp_aplicacion_escalas',
  'cumplimientoNormativoSchema': 'erp_cumplimiento_normativo',
  'snapshotCalculoSchema': 'erp_snapshots_estado_calculo',
  'comparacionCalculosSchema': 'erp_comparaciones_calculos',
};

async function checkZodDbAlignment() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Obtener todas las tablas ERP
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'erp_%'
      ORDER BY table_name
    `);

    const dbTables = new Set(tables.rows.map(r => r.table_name));
    console.log(`Tablas ERP en DB: ${dbTables.size}\n`);

    // Verificar tablas en DB que no tienen schema Zod
    const tablesWithoutSchema = [];
    for (const tableName of dbTables) {
      const hasSchema = Object.values(SCHEMA_TO_TABLE_MAP).includes(tableName);
      if (!hasSchema) {
        tablesWithoutSchema.push(tableName);
      }
    }

    if (tablesWithoutSchema.length > 0) {
      console.log(`⚠️ Tablas en DB sin schema Zod (${tablesWithoutSchema.length}):\n`);
      for (const table of tablesWithoutSchema) {
        console.log(`  - ${table}`);
      }
      console.log('');
    } else {
      console.log('✅ Todas las tablas DB tienen schema Zod correspondiente\n');
    }

    // Verificar schemas Zod que no tienen tabla en DB
    const schemasWithoutTable = [];
    for (const [schema, table] of Object.entries(SCHEMA_TO_TABLE_MAP)) {
      if (!dbTables.has(table)) {
        schemasWithoutTable.push({ schema, table });
      }
    }

    if (schemasWithoutTable.length > 0) {
      console.log(`⚠️ Schemas Zod sin tabla en DB (${schemasWithoutTable.length}):\n`);
      for (const { schema, table } of schemasWithoutTable) {
        console.log(`  - ${schema} → ${table}`);
      }
      console.log('');
    } else {
      console.log('✅ Todos los schemas Zod tienen tabla DB correspondiente\n');
    }

    // Identificar tablas potencialmente obsoletas
    const potentiallyObsolete = [
      'erp_empresas',
      'erp_empresas_secure',
      'erp_usuarios',
      'erp_licitaciones', // Duplicado con erp_cuadros?
    ];

    const obsoleteFound = potentiallyObsolete.filter(t => dbTables.has(t));
    if (obsoleteFound.length > 0) {
      console.log(`⚠️ Tablas potencialmente obsoletas:\n`);
      for (const table of obsoleteFound) {
        console.log(`  - ${table}`);
      }
      console.log('');
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

checkZodDbAlignment();