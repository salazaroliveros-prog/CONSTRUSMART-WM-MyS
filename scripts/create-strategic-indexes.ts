import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// Índices estratégicos para optimizar consultas comunes
const STRATEGIC_INDEXES = [
  // Índices para proyectos
  { table: 'erp_proyectos', columns: ['estado'], name: 'idx_proyectos_estado' },
  { table: 'erp_proyectos', columns: ['cliente'], name: 'idx_proyectos_cliente' },
  { table: 'erp_proyectos', columns: ['estado', 'created_at'], name: 'idx_proyectos_estado_fecha' },
  
  // Índices para movimientos financieros
  { table: 'erp_movimientos', columns: ['proyecto_id', 'fecha'], name: 'idx_movimientos_proyecto_fecha' },
  { table: 'erp_movimientos', columns: ['tipo', 'fecha'], name: 'idx_movimientos_tipo_fecha' },
  { table: 'erp_cuentas_cobrar', columns: ['proyecto_id', 'estado'], name: 'idx_cuentas_cobrar_proyecto_estado' },
  { table: 'erp_cuentas_cobrar', columns: ['estado', 'fecha_vencimiento'], name: 'idx_cuentas_cobrar_estado_vencimiento' },
  { table: 'erp_cuentas_pagar', columns: ['proyecto_id', 'estado'], name: 'idx_cuentas_pagar_proyecto_estado' },
  { table: 'erp_cuentas_pagar', columns: ['proveedor_id', 'estado'], name: 'idx_cuentas_pagar_proveedor_estado' },
  
  // Índices para presupuesto y costos
  { table: 'erp_presupuestos', columns: ['proyecto_id', 'estado'], name: 'idx_presupuestos_proyecto_estado' },
  { table: 'erp_avances', columns: ['proyecto_id', 'fecha'], name: 'idx_avances_proyecto_fecha' },
  { table: 'erp_ordenes_compra', columns: ['proyecto_id', 'estado'], name: 'idx_ordenes_compra_proyecto_estado' },
  { table: 'erp_ordenes_compra', columns: ['proveedor_id', 'estado'], name: 'idx_ordenes_compra_proveedor_estado' },
  
  // Índices para recursos humanos
  { table: 'erp_empleados', columns: ['proyecto_id', 'activo'], name: 'idx_empleados_proyecto_activo' },
  { table: 'erp_empleados', columns: ['puesto', 'activo'], name: 'idx_empleados_puesto_activo' },
  { table: 'erp_destajos', columns: ['proyecto_id', 'fecha'], name: 'idx_destajos_proyecto_fecha' },
  { table: 'erp_rendimientos_campo', columns: ['proyecto_id', 'fecha'], name: 'idx_rendimientos_campo_proyecto_fecha' },
  
  // Índices para inventario y bodega
  { table: 'erp_materiales', columns: ['nombre'], name: 'idx_materiales_nombre' },
  { table: 'erp_bodega', columns: ['proyecto_id', 'estado'], name: 'idx_bodega_proyecto_estado' },
  { table: 'erp_vales_salida', columns: ['proyecto_id', 'fecha'], name: 'idx_vales_salida_proyecto_fecha' },
  
  // Índices para seguimiento y hitos
  { table: 'erp_hitos', columns: ['proyecto_id', 'estado'], name: 'idx_hitos_proyecto_estado' },
  { table: 'erp_riesgos', columns: ['proyecto_id', 'estado'], name: 'idx_riesgos_proyecto_estado' },
  { table: 'erp_riesgos', columns: ['proyecto_id', 'nivel'], name: 'idx_riesgos_proyecto_nivel' },
  { table: 'erp_seguimiento', columns: ['proyecto_id', 'fecha'], name: 'idx_seguimiento_proyecto_fecha' },
  
  // Índices para documentos y comunicación
  { table: 'erp_bitacora', columns: ['proyecto_id', 'fecha'], name: 'idx_bitacora_proyecto_fecha' },
  { table: 'erp_publicaciones_muro', columns: ['proyecto_id', 'created_at'], name: 'idx_publicaciones_proyecto_fecha' },
  { table: 'erp_notificaciones', columns: ['proyecto_id'], name: 'idx_notificaciones_proyecto' },
  { table: 'erp_documentos', columns: ['proyecto_id', 'tipo'], name: 'idx_documentos_proyecto_tipo' },
  
  // Índices para calidad y control
  { table: 'erp_planos', columns: ['proyecto_id', 'estado'], name: 'idx_planos_proyecto_estado' },
  { table: 'erp_rfis', columns: ['proyecto_id', 'estado'], name: 'idx_rfis_proyecto_estado' },
  { table: 'erp_submittals', columns: ['proyecto_id', 'estado'], name: 'idx_submittals_proyecto_estado' },
  { table: 'erp_ordenes_cambio', columns: ['proyecto_id', 'estado'], name: 'idx_ordenes_cambio_proyecto_estado' },
  
  // Índices para activos y config
  { table: 'erp_activos', columns: ['proyecto_id', 'estado'], name: 'idx_activos_proyecto_estado' },
  { table: 'erp_centros_costo', columns: ['proyecto_id', 'activo'], name: 'idx_centros_costo_proyecto_activo' },
  { table: 'erp_checklist', columns: ['proyecto_id', 'estado'], name: 'idx_checklist_proyecto_estado' },
  
  // Índices para motor de cálculo
  { table: 'erp_calculos_proyecto', columns: ['proyecto_id', 'tipo_calculo'], name: 'idx_calculos_proyecto_tipo' },
  { table: 'erp_reglas_factores', columns: ['activo', 'prioridad'], name: 'idx_reglas_factores_activa_prioridad' },
  { table: 'erp_estacionalidad', columns: ['activo'], name: 'idx_estacionalidad_activa' },
  
  // Índices para auditoría y logs
  { table: 'erp_error_log', columns: ['proyecto_id', 'created_at'], name: 'idx_error_log_proyecto_fecha' },
  { table: 'erp_audit_log', columns: ['table_name', 'changed_at'], name: 'idx_audit_log_tabla_fecha' },
  { table: 'erp_access_log', columns: ['user_id', 'created_at'], name: 'idx_access_log_usuario_fecha' },
];

async function createStrategicIndexes() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('=== CREACIÓN DE ÍNDICES ESTRATÉGICOS ===\n');
    console.log(`Índices a crear: ${STRATEGIC_INDEXES.length}\n`);

    let created = 0;
    let skipped = 0;

    for (const index of STRATEGIC_INDEXES) {
      try {
        // Verificar si el índice ya existe
        const exists = await client.query(`
          SELECT EXISTS (
            SELECT FROM pg_indexes 
            WHERE tablename = $1 
            AND indexname = $2
          );
        `, [index.table, index.name]);

        if (exists.rows[0].exists) {
          console.log(`⏭️ ${index.name}: ya existe, salto`);
          skipped++;
          continue;
        }

        // Crear el índice
        const columns = index.columns.join(', ');
        await client.query(`
          CREATE INDEX IF NOT EXISTS ${index.name} 
          ON ${index.table} (${columns})
        `);
        
        console.log(`✅ ${index.name}: creado en ${index.table} (${columns})`);
        created++;
      } catch (err) {
        console.log(`❌ ${index.name}: error - ${err.message}`);
      }
    }

    console.log(`\n=== RESUMEN ===\n`);
    console.log(`✅ Índices creados: ${created}`);
    console.log(`⏭️ Índices ya existentes: ${skipped}`);
    console.log(`❌ Índices fallidos: ${STRATEGIC_INDEXES.length - created - skipped}\n`);

    // Verificar índices finales
    const finalIndexes = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename LIKE 'erp_%'
    `);

    console.log(`Total de índices ERP: ${finalIndexes.rows[0].count}\n`);

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

createStrategicIndexes();