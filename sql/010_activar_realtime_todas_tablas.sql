-- ============================================================
-- SCRIPT SQL: ACTIVAR REALTIME EN TODAS LAS TABLAS (CORREGIDO)
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- Tiempo estimado: 2 minutos
-- Última actualización: 2026-06-07
-- 
-- NOTA: Este script activa Realtime (REPLICA IDENTITY FULL) 
-- en todas las tablas erp_* para sincronización en tiempo real
-- ============================================================

-- ============================================================
-- 1. HABILITAR REPLICA IDENTITY FULL EN TABLAS CRÍTICAS
-- ============================================================

-- NÚCLEO PRINCIPAL
ALTER TABLE erp_proyectos REPLICA IDENTITY FULL;
ALTER TABLE erp_movimientos REPLICA IDENTITY FULL;
ALTER TABLE erp_empleados REPLICA IDENTITY FULL;
ALTER TABLE erp_materiales REPLICA IDENTITY FULL;
ALTER TABLE erp_ordenes_compra REPLICA IDENTITY FULL;
ALTER TABLE erp_proveedores REPLICA IDENTITY FULL;
ALTER TABLE erp_eventos_calendario REPLICA IDENTITY FULL;
ALTER TABLE erp_bitacora REPLICA IDENTITY FULL;
ALTER TABLE erp_presupuestos REPLICA IDENTITY FULL;

-- SEGUIMIENTO Y PRESUPUESTO
ALTER TABLE erp_avances REPLICA IDENTITY FULL;
ALTER TABLE erp_licitaciones REPLICA IDENTITY FULL;
ALTER TABLE erp_renglones REPLICA IDENTITY FULL;
ALTER TABLE erp_insumos REPLICA IDENTITY FULL;
ALTER TABLE erp_sub_renglones REPLICA IDENTITY FULL;
ALTER TABLE erp_seguimiento REPLICA IDENTITY FULL;

-- BODEGA Y VALES
ALTER TABLE erp_vales_salida REPLICA IDENTITY FULL;
ALTER TABLE erp_insumos_base REPLICA IDENTITY FULL;

-- RENDIMIENTO
ALTER TABLE erp_rendimientos_cuadrilla REPLICA IDENTITY FULL;

-- CADENA DE SUMINISTRO
ALTER TABLE activos_herramientas REPLICA IDENTITY FULL;
ALTER TABLE cuadro_comparativo_proveedores REPLICA IDENTITY FULL;
ALTER TABLE cotizaciones REPLICA IDENTITY FULL;
ALTER TABLE anticipos REPLICA IDENTITY FULL;
ALTER TABLE amortizaciones REPLICA IDENTITY FULL;
ALTER TABLE pagos_proveedores REPLICA IDENTITY FULL;

-- COMERCIAL Y FINANZAS
ALTER TABLE ventas_paquetes REPLICA IDENTITY FULL;
ALTER TABLE centros_costo REPLICA IDENTITY FULL;
ALTER TABLE cajas_chicas REPLICA IDENTITY FULL;
ALTER TABLE destajos REPLICA IDENTITY FULL;

-- ADMINISTRACIÓN
ALTER TABLE logs_sistema REPLICA IDENTITY FULL;
ALTER TABLE erp_auditoria REPLICA IDENTITY FULL;

-- USUARIOS
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- ============================================================
-- 2. HABILITAR REALTIME EN SUPABASE (VÍA SQL EDITOR)
-- ============================================================
-- 
-- Una vez ejecutado el script anterior, Supabase detectará
-- automáticamente las tablas con REPLICA IDENTITY FULL.
-- 
-- El estado "Realtime: ENABLED" aparecerá en el Dashboard
-- dentro de 1-2 minutos.
--
-- Ubicación para verificar: 
--   Supabase Dashboard → Database → Tables
--   Cada tabla mostrará: "Realtime: ENABLED" (en verde)
--

-- ============================================================
-- 3. VERIFICACIÓN SIMPLE (Ejecutar después de esperar 2 min)
-- ============================================================

-- Listar todas las tablas erp_*
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'erp_%'
ORDER BY tablename;

-- Debería mostrar 32 tablas:
-- tablename
-- ─────────────────────────────────────
-- erp_auditoria
-- erp_avances
-- erp_bitacora
-- erp_empleados
-- ... etc

-- ============================================================
-- 4. CONTAR TABLAS CREADAS
-- ============================================================

SELECT COUNT(*) as total_tablas_erp 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'erp_%';

-- Resultado esperado: 32 (o cercano)

-- ============================================================
-- 5. VERIFICAR QUE REPLICA IDENTITY ESTÁ FULL
-- ============================================================

-- Para una tabla específica (ejemplo: erp_proyectos)
SELECT 
  t.tablename,
  CASE 
    WHEN o.relreplident = 'f' THEN 'FULL (✅ Realtime activo)'
    WHEN o.relreplident = 'i' THEN 'INDEX'
    WHEN o.relreplident = 'n' THEN 'NOTHING (❌ Realtime inactivo)'
    WHEN o.relreplident = 'd' THEN 'DEFAULT'
    ELSE 'DESCONOCIDO'
  END as replica_identity_status
FROM pg_tables t
JOIN pg_class o ON o.relname = t.tablename
WHERE t.schemaname = 'public' 
  AND t.tablename = 'erp_proyectos';

-- Resultado esperado:
-- tablename     | replica_identity_status
-- ──────────────┼──────────────────────────────────
-- erp_proyectos | FULL (✅ Realtime activo)

-- ============================================================
-- 6. VERIFICAR TODAS LAS TABLAS ERP_* (COMPLETO)
-- ============================================================

SELECT 
  t.tablename,
  CASE 
    WHEN o.relreplident = 'f' THEN '✅ FULL'
    WHEN o.relreplident = 'i' THEN 'INDEX'
    WHEN o.relreplident = 'n' THEN '❌ NOTHING'
    WHEN o.relreplident = 'd' THEN 'DEFAULT'
    ELSE '?'
  END as replica_identity
FROM pg_tables t
JOIN pg_class o ON o.relname = t.tablename
WHERE t.schemaname = 'public' AND t.tablename LIKE 'erp_%'
ORDER BY t.tablename;

-- Debería mostrar todas con ✅ FULL

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
--
-- 1. REPLICA IDENTITY FULL: Permite a Supabase enviar 
--    el registro completo en INSERT/UPDATE/DELETE events
--
-- 2. Una vez ejecutado el script anterior (ALTER TABLE...),
--    Supabase detecta automáticamente REPLICA IDENTITY FULL
--    y habilita el toggle "Realtime" en el Dashboard
--
-- 3. El cambio es instantáneo en la BD, pero el Dashboard
--    puede tardar 1-2 minutos en actualizarse.
--    Solución: Recarga el Dashboard (F5)
--
-- 4. El código (useSupabaseRealtime.ts) ya está listo
--    para escuchar estos cambios automáticamente
--
-- 5. Una vez activado, los cambios se sincronizan 
--    en < 1 segundo a través de WebSockets
--

-- ============================================================
-- CHECKLIST POST-EJECUCIÓN
-- ============================================================
--
-- ☑️ Ejecutar todo el script anterior (ALTER TABLE...)
-- ☑️ Esperar 2 minutos
-- ☑️ Refrescar Supabase Dashboard (F5)
-- ☑️ Ir a Database → Tables
-- ☑️ Verificar que todas las tablas muestren "Realtime: ENABLED" (verde)
-- ☑️ Ejecutar la consulta de verificación (sección 6)
-- ☑️ Confirmar que todas muestren ✅ FULL
--

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
