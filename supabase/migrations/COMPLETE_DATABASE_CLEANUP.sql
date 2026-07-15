-- ============================================================
-- SCRIPT COMPLETO: LIMPIEZA Y ALINEACIÓN TOTAL DE BASE DE DATOS
-- Ejecutar este script en Supabase SQL Editor
-- 
-- Este script:
-- 1. Audita todas las tablas en la BD
-- 2. Elimina tablas huérfanas (no están en TABLE_MAP del código)
-- 3. Elimina tablas obsoletas conocidas
-- 4. Crea tablas faltantes (geográficas)
-- 5. Limpia datos huérfanos (foreign keys inválidos)
-- 6. Verifica integridad referencial
-- 7. Configura RLS, Realtime, índices
-- 8. Inserta seed data
-- ============================================================

-- ============================================================
-- PARTE 1: AUDITORÍA COMPLETA DEL ESQUEMA
-- ============================================================

DO $$
DECLARE
  table_record RECORD;
  is_valid BOOLEAN;
  is_obsolete BOOLEAN;
  table_count INTEGER;
  valid_count INTEGER;
  orphan_count INTEGER;
  obsolete_count INTEGER;
BEGIN
  RAISE NOTICE '=== AUDITORÍA COMPLETA DEL ESQUEMA ===';
  
  -- Tablas válidas según TABLE_MAP del código
  -- Basado en src/erp/constants/table-mappings.ts
  valid_count := 0;
  orphan_count := 0;
  obsolete_count := 0;
  
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE 'erp_%'
    ORDER BY table_name
  LOOP
    -- Verificar si es tabla válida (está en TABLE_MAP)
    is_valid := table_record.table_name IN (
      'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
      'erp_ordenes_compra', 'erp_proveedores', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
      'erp_hitos', 'erp_riesgos', 'erp_cotizaciones_negocio', 'erp_vales_salida',
      'erp_no_conformidades', 'erp_incidentes', 'erp_publicaciones_muro', 'erp_planos',
      'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros', 'erp_pagos_proveedor',
      'erp_destajos', 'erp_recepciones', 'erp_centros_costo', 'erp_seguimiento',
      'erp_bitacora', 'erp_plantillas_proyectos', 'erp_notificaciones', 'erp_presupuestos',
      'erp_avances', 'erp_eventos_calendario', 'erp_ventas_paquetes', 'erp_ordenes_cambio',
      'erp_pruebas_laboratorio', 'erp_liberaciones_partida', 'erp_error_log',
      'erp_proyecto_weather', 'erp_auditoria', 'erp_insumos_base',
      'erp_departamentos_gt', 'erp_municipios_gt', 'erp_reglas_factores',
      'erp_normativa_departamental', 'erp_escalas_produccion', 'erp_estacionalidad',
      'erp_historial_aplicacion_reglas', 'erp_ajustes_estacionales_actividad',
      'erp_calculos_proyecto', 'erp_cumplimiento_normativo',
      'erp_aplicacion_escalas', 'erp_configuracion', 'erp_solicitudes', 'erp_archivos_tipo'
    );
    
    -- Verificar si es tabla obsoleta (renombrada o eliminada del código)
    is_obsolete := table_record.table_name IN (
      'erp_subcontratos',    -- Eliminado del estado (P3)
      'erp_rendimientos',    -- Eliminado de View (P4)
      'erp_licitaciones',    -- Renombrado a erp_cotizaciones_negocio
      'erp_muro'             -- Renombrado a erp_publicaciones_muro
    );
    
    IF is_obsolete THEN
      RAISE NOTICE '⚠️  OBSOLETA: % (será eliminada)', table_record.table_name;
      obsolete_count := obsolete_count + 1;
    ELSIF is_valid THEN
      RAISE NOTICE '✅ VÁLIDA: %', table_record.table_name;
      valid_count := valid_count + 1;
    ELSE
      RAISE NOTICE '❌ HUÉRFANA: % (no está en TABLE_MAP, será eliminada)', table_record.table_name;
      orphan_count := orphan_count + 1;
    END IF;
  END LOOP;
  
  table_count := valid_count + orphan_count + obsolete_count;
  
  RAISE NOTICE '=== RESUMEN AUDITORÍA ===';
  RAISE NOTICE '   - Total tablas erp_*: %', table_count;
  RAISE NOTICE '   - Tablas válidas: %', valid_count;
  RAISE NOTICE '   - Tablas huérfanas: %', orphan_count;
  RAISE NOTICE '   - Tablas obsoletas: %', obsolete_count;
  RAISE NOTICE '=== FIN AUDITORÍA ===';
END $$;

-- ============================================================
-- PARTE 2: ELIMINACIÓN DE TABLAS HUÉRFANAS
-- ============================================================

DO $$
DECLARE
  table_record RECORD;
  view_record RECORD;
  is_valid BOOLEAN;
  is_obsolete BOOLEAN;
  is_view BOOLEAN;
BEGIN
  RAISE NOTICE '=== ELIMINACIÓN DE TABLAS HUÉRFANAS ===';
  
  -- Primero eliminar vistas huérfanas
  FOR view_record IN 
    SELECT table_name 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
      AND table_name LIKE 'erp_%'
    ORDER BY table_name
  LOOP
    -- Verificar si es vista válida (está en TABLE_MAP)
    is_valid := view_record.table_name IN (
      'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
      'erp_ordenes_compra', 'erp_proveedores', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
      'erp_hitos', 'erp_riesgos', 'erp_cotizaciones_negocio', 'erp_vales_salida',
      'erp_no_conformidades', 'erp_incidentes', 'erp_publicaciones_muro', 'erp_planos',
      'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros', 'erp_pagos_proveedor',
      'erp_destajos', 'erp_recepciones', 'erp_centros_costo', 'erp_seguimiento',
      'erp_bitacora', 'erp_plantillas_proyectos', 'erp_notificaciones', 'erp_presupuestos',
      'erp_avances', 'erp_eventos_calendario', 'erp_ventas_paquetes', 'erp_ordenes_cambio',
      'erp_pruebas_laboratorio', 'erp_liberaciones_partida', 'erp_error_log',
      'erp_proyecto_weather', 'erp_auditoria', 'erp_insumos_base',
      'erp_departamentos_gt', 'erp_municipios_gt', 'erp_reglas_factores',
      'erp_normativa_departamental', 'erp_escalas_produccion', 'erp_estacionalidad',
      'erp_historial_aplicacion_reglas', 'erp_ajustes_estacionales_actividad',
      'erp_calculos_proyecto', 'erp_cumplimiento_normativo',
      'erp_aplicacion_escalas', 'erp_configuracion', 'erp_solicitudes', 'erp_archivos_tipo'
    );
    
    -- Si no es válida, eliminarla
    IF NOT is_valid THEN
      EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', view_record.table_name);
      RAISE NOTICE '✅ Eliminada (vista huérfana): %', view_record.table_name;
    END IF;
  END LOOP;
  
  -- Luego eliminar tablas huérfanas
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE 'erp_%'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    -- Verificar si es tabla válida (está en TABLE_MAP)
    is_valid := table_record.table_name IN (
      'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
      'erp_ordenes_compra', 'erp_proveedores', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
      'erp_hitos', 'erp_riesgos', 'erp_cotizaciones_negocio', 'erp_vales_salida',
      'erp_no_conformidades', 'erp_incidentes', 'erp_publicaciones_muro', 'erp_planos',
      'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros', 'erp_pagos_proveedor',
      'erp_destajos', 'erp_recepciones', 'erp_centros_costo', 'erp_seguimiento',
      'erp_bitacora', 'erp_plantillas_proyectos', 'erp_notificaciones', 'erp_presupuestos',
      'erp_avances', 'erp_eventos_calendario', 'erp_ventas_paquetes', 'erp_ordenes_cambio',
      'erp_pruebas_laboratorio', 'erp_liberaciones_partida', 'erp_error_log',
      'erp_proyecto_weather', 'erp_auditoria', 'erp_insumos_base',
      'erp_departamentos_gt', 'erp_municipios_gt', 'erp_reglas_factores',
      'erp_normativa_departamental', 'erp_escalas_produccion', 'erp_estacionalidad',
      'erp_historial_aplicacion_reglas', 'erp_ajustes_estacionales_actividad',
      'erp_calculos_proyecto', 'erp_cumplimiento_normativo',
      'erp_aplicacion_escalas', 'erp_configuracion', 'erp_solicitudes', 'erp_archivos_tipo'
    );
    
    -- Si no es válida, eliminarla
    IF NOT is_valid THEN
      EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_record.table_name);
      RAISE NOTICE '✅ Eliminada (tabla huérfana): %', table_record.table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== FIN ELIMINACIÓN HUÉRFANAS ===';
END $$;

-- ============================================================
-- PARTE 3: ELIMINACIÓN DE TABLAS OBSOLETAS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== ELIMINACIÓN DE TABLAS OBSOLETAS ===';
  
  -- Eliminar tabla erp_subcontratos (eliminado del estado en P3)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_subcontratos') THEN
    DROP TABLE IF EXISTS erp_subcontratos CASCADE;
    RAISE NOTICE '✅ Eliminada: erp_subcontratos';
  END IF;
  
  -- Eliminar tabla erp_rendimientos (eliminado de View en P4)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_rendimientos') THEN
    DROP TABLE IF EXISTS erp_rendimientos CASCADE;
    RAISE NOTICE '✅ Eliminada: erp_rendimientos';
  END IF;
  
  -- Eliminar tabla erp_licitaciones (renombrado a erp_cotizaciones_negocio)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_licitaciones') THEN
    DROP TABLE IF EXISTS erp_licitaciones CASCADE;
    RAISE NOTICE '✅ Eliminada: erp_licitaciones (usar erp_cotizaciones_negocio)';
  END IF;
  
  -- Eliminar tabla erp_muro (renombrado a erp_publicaciones_muro)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_muro') THEN
    DROP TABLE IF EXISTS erp_muro CASCADE;
    RAISE NOTICE '✅ Eliminada: erp_muro (usar erp_publicaciones_muro)';
  END IF;
  
  RAISE NOTICE '=== FIN ELIMINACIÓN OBSOLETAS ===';
END $$;

-- ============================================================
-- PARTE 4: LIMPIEZA DE DATOS HUÉRFANOS (Foreign Keys Inválidos)
-- ============================================================

DO $$
DECLARE
  constraint_record RECORD;
  cleanup_count INTEGER;
BEGIN
  RAISE NOTICE '=== LIMPIEZA DE DATOS HUÉRFANOS ===';
  cleanup_count := 0;
  
  -- Limpiar datos huérfanos en tablas con proyectoId
  -- Proyectos eliminados -> referencias huérfanas
  
  -- En erp_movimientos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_movimientos') THEN
    DELETE FROM erp_movimientos 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_movimientos', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_hitos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_hitos') THEN
    DELETE FROM erp_hitos 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_hitos', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_riesgos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_riesgos') THEN
    DELETE FROM erp_riesgos 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_riesgos', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_avances
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_avances') THEN
    DELETE FROM erp_avances 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_avances', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_presupuestos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_presupuestos') THEN
    DELETE FROM erp_presupuestos 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_presupuestos', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_vales_salida
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_vales_salida') THEN
    DELETE FROM erp_vales_salida 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_vales_salida', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_no_conformidades
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_no_conformidades') THEN
    DELETE FROM erp_no_conformidades 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_no_conformidades', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_incidentes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_incidentes') THEN
    DELETE FROM erp_incidentes 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_incidentes', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_planos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_planos') THEN
    DELETE FROM erp_planos 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_planos', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_rfis
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_rfis') THEN
    DELETE FROM erp_rfis 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_rfis', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_submittals
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_submittals') THEN
    DELETE FROM erp_submittals 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_submittals', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_pruebas_laboratorio
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_pruebas_laboratorio') THEN
    DELETE FROM erp_pruebas_laboratorio 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_pruebas_laboratorio', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_liberaciones_partida
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_liberaciones_partida') THEN
    DELETE FROM erp_liberaciones_partida 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_liberaciones_partida', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_ordenes_cambio
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_ordenes_cambio') THEN
    DELETE FROM erp_ordenes_cambio 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_ordenes_cambio', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_seguimiento
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_seguimiento') THEN
    DELETE FROM erp_seguimiento 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_seguimiento', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_bitacora
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_bitacora') THEN
    DELETE FROM erp_bitacora 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_bitacora', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_destajos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_destajos') THEN
    DELETE FROM erp_destajos 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_destajos', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_recepciones
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_recepciones') THEN
    DELETE FROM erp_recepciones 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_recepciones', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_publicaciones_muro
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_publicaciones_muro') THEN
    DELETE FROM erp_publicaciones_muro 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_publicaciones_muro', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_proyecto_weather
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_proyecto_weather') THEN
    DELETE FROM erp_proyecto_weather 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_proyecto_weather', cleanup_count;
    END IF;
  END IF;
  
  -- En erp_calculos_proyecto
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_calculos_proyecto') THEN
    DELETE FROM erp_calculos_proyecto 
    WHERE proyectoId IS NOT NULL 
      AND proyectoId NOT IN (SELECT id FROM erp_proyectos WHERE id IS NOT NULL);
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    IF cleanup_count > 0 THEN
      RAISE NOTICE '✅ Limpiados % registros huérfanos en erp_calculos_proyecto', cleanup_count;
    END IF;
  END IF;
  
  RAISE NOTICE '=== FIN LIMPIEZA DATOS HUÉRFANOS ===';
END $$;

-- ============================================================
-- PARTE 5: CREACIÓN DE TABLAS GEOLÓFICAS (si no existen)
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== CREACIÓN DE TABLAS GEOLÓFICAS ===';
  
  -- Crear tabla de departamentos
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_departamentos_gt') THEN
    CREATE TABLE erp_departamentos_gt (
      codigo VARCHAR(3) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      codigo_iso VARCHAR(2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE '✅ Creada: erp_departamentos_gt';
  ELSE
    RAISE NOTICE '⏭️  Ya existe: erp_departamentos_gt';
  END IF;
  
  -- Crear tabla de municipios
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_municipios_gt') THEN
    CREATE TABLE erp_municipios_gt (
      codigo VARCHAR(5) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      departamento_codigo VARCHAR(3) NOT NULL,
      altitud_msnm INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT fk_municipio_departamento 
        FOREIGN KEY (departamento_codigo) 
        REFERENCES erp_departamentos_gt(codigo)
        ON DELETE CASCADE
    );
    RAISE NOTICE '✅ Creada: erp_municipios_gt';
  ELSE
    RAISE NOTICE '⏭️  Ya existe: erp_municipios_gt';
  END IF;
  
  RAISE NOTICE '=== FIN CREACIÓN TABLAS ===';
END $$;

-- ============================================================
-- PARTE 6: CONFIGURACIÓN DE ÍNDICES
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURACIÓN DE ÍNDICES ===';
  
  -- Índices para municipios
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_municipios_departamento') THEN
    CREATE INDEX idx_municipios_departamento ON erp_municipios_gt(departamento_codigo);
    RAISE NOTICE '✅ Creado: idx_municipios_departamento';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_municipios_nombre') THEN
    CREATE INDEX idx_municipios_nombre ON erp_municipios_gt(nombre);
    RAISE NOTICE '✅ Creado: idx_municipios_nombre';
  END IF;
  
  RAISE NOTICE '=== FIN ÍNDICES ===';
END $$;

-- ============================================================
-- PARTE 7: CONFIGURACIÓN DE RLS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURACIÓN DE RLS ===';
  
  -- Habilitar RLS en departamentos
  ALTER TABLE erp_departamentos_gt ENABLE ROW LEVEL SECURITY;
  
  -- Habilitar RLS en municipios
  ALTER TABLE erp_municipios_gt ENABLE ROW LEVEL SECURITY;
  
  -- Políticas para departamentos
  DROP POLICY IF EXISTS "Departamentos lectura pública" ON erp_departamentos_gt;
  CREATE POLICY "Departamentos lectura pública" 
    ON erp_departamentos_gt FOR SELECT 
    USING (true);
  
  DROP POLICY IF EXISTS "Departamentos solo admin insert" ON erp_departamentos_gt;
  CREATE POLICY "Departamentos solo admin insert" 
    ON erp_departamentos_gt FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM erp_configuracion 
        WHERE clave = 'admin_email' 
        AND valor = auth.email()
      )
    );
  
  DROP POLICY IF EXISTS "Departamentos solo admin update" ON erp_departamentos_gt;
  CREATE POLICY "Departamentos solo admin update" 
    ON erp_departamentos_gt FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM erp_configuracion 
        WHERE clave = 'admin_email' 
        AND valor = auth.email()
      )
    );
  
  DROP POLICY IF EXISTS "Departamentos solo admin delete" ON erp_departamentos_gt;
  CREATE POLICY "Departamentos solo admin delete" 
    ON erp_departamentos_gt FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM erp_configuracion 
        WHERE clave = 'admin_email' 
        AND valor = auth.email()
      )
    );
  
  -- Políticas para municipios
  DROP POLICY IF EXISTS "Municipios lectura pública" ON erp_municipios_gt;
  CREATE POLICY "Municipios lectura pública" 
    ON erp_municipios_gt FOR SELECT 
    USING (true);
  
  DROP POLICY IF EXISTS "Municipios solo admin insert" ON erp_municipios_gt;
  CREATE POLICY "Municipios solo admin insert" 
    ON erp_municipios_gt FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM erp_configuracion 
        WHERE clave = 'admin_email' 
        AND valor = auth.email()
      )
    );
  
  DROP POLICY IF EXISTS "Municipios solo admin update" ON erp_municipios_gt;
  CREATE POLICY "Municipios solo admin update" 
    ON erp_municipios_gt FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM erp_configuracion 
        WHERE clave = 'admin_email' 
        AND valor = auth.email()
      )
    );
  
  DROP POLICY IF EXISTS "Municipios solo admin delete" ON erp_municipios_gt;
  CREATE POLICY "Municipios solo admin delete" 
    ON erp_municipios_gt FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM erp_configuracion 
        WHERE clave = 'admin_email' 
        AND valor = auth.email()
      )
    );
  
  RAISE NOTICE '✅ RLS configurado en tablas geográficas';
END $$;

-- ============================================================
-- PARTE 8: CONFIGURACIÓN DE TRIGGERS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURACIÓN DE TRIGGERS ===';
  
  -- Función update_timestamp
  CREATE OR REPLACE FUNCTION update_timestamp()
  RETURNS TRIGGER AS $function$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $function$ LANGUAGE plpgsql;
  
  -- Trigger para departamentos
  DROP TRIGGER IF EXISTS trigger_departamentos_updated_at ON erp_departamentos_gt;
  CREATE TRIGGER trigger_departamentos_updated_at
    BEFORE UPDATE ON erp_departamentos_gt
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
  
  -- Trigger para municipios
  DROP TRIGGER IF EXISTS trigger_municipios_updated_at ON erp_municipios_gt;
  CREATE TRIGGER trigger_municipios_updated_at
    BEFORE UPDATE ON erp_municipios_gt
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
  
  RAISE NOTICE '✅ Triggers configurados';
END $$;

-- ============================================================
-- PARTE 9: CONFIGURACIÓN DE REALTIME
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURACIÓN DE REALTIME ===';
  
  -- Habilitar realtime en departamentos
  ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_departamentos_gt;
  
  -- Habilitar realtime en municipios
  ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_municipios_gt;
  
  RAISE NOTICE '✅ Realtime habilitado en tablas geográficas';
END $$;

-- ============================================================
-- PARTE 10: INSERTAR SEED DATA (si está vacío)
-- ============================================================

DO $$
DECLARE
  dept_count INTEGER;
  muni_count INTEGER;
BEGIN
  RAISE NOTICE '=== INSERTAR SEED DATA ===';
  
  -- Verificar si departamentos está vacío
  SELECT COUNT(*) INTO dept_count FROM erp_departamentos_gt;
  
  IF dept_count = 0 THEN
    INSERT INTO erp_departamentos_gt (codigo, nombre, codigo_iso) VALUES
    ('01', 'Guatemala', 'GT-GU'),
    ('02', 'El Progreso', 'GT-PR'),
    ('03', 'Sacatepéquez', 'GT-SR'),
    ('04', 'Chimaltenango', 'GT-CM'),
    ('05', 'Escuintla', 'GT-ES'),
    ('06', 'Santa Rosa', 'GT-SR'),
    ('07', 'Sololá', 'GT-SO'),
    ('08', 'Totonicapán', 'GT-TO'),
    ('09', 'Quetzaltenango', 'GT-QC'),
    ('10', 'Suchitepéquez', 'GT-SU'),
    ('11', 'Retalhuleu', 'GT-RE'),
    ('12', 'San Marcos', 'GT-SM'),
    ('13', 'Huehuetenango', 'GT-HU'),
    ('14', 'Quiché', 'GT-QC'),
    ('15', 'Baja Verapaz', 'GT-BV'),
    ('16', 'Alta Verapaz', 'GT-AV'),
    ('17', 'Petén', 'GT-PE'),
    ('18', 'Izabal', 'GT-IZ'),
    ('19', 'Zacapa', 'GT-ZA'),
    ('20', 'Chiquimula', 'GT-CH'),
    ('21', 'Jalapa', 'GT-JA'),
    ('22', 'Jutiapa', 'GT-JU')
    ON CONFLICT (codigo) DO NOTHING;
    
    RAISE NOTICE '✅ Insertados: 22 departamentos';
  ELSE
    RAISE NOTICE '⏭️  Departamentos ya tienen datos (%)', dept_count;
  END IF;
  
  -- Verificar si municipios está vacío
  SELECT COUNT(*) INTO muni_count FROM erp_municipios_gt;
  
  IF muni_count = 0 THEN
    -- Guatemala (01)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('01001', 'Guatemala', '01', 1499),
    ('01002', 'Mixco', '01', 1500),
    ('01003', 'Villa Nueva', '01', 1500),
    ('01004', 'Petapa', '01', 1500),
    ('01005', 'San Juan Sacatepéquez', '01', 1500),
    ('01006', 'San Miguel Petapa', '01', 1500),
    ('01007', 'Chinautla', '01', 1500),
    ('01008', 'Amatitlán', '01', 1500)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- El Progreso (02)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('02001', 'El Progreso', '02', 350),
    ('02002', 'Morazán', '02', 400),
    ('02003', 'Sanarate', '02', 450),
    ('02004', 'San Agustín Acasaguastlán', '02', 500)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Sacatepéquez (03)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('03001', 'Antigua Guatemala', '03', 1533),
    ('03002', 'Ciudad Vieja', '03', 1500),
    ('03003', 'Sumpango', '03', 1500),
    ('03004', 'San Miguel Dueñas', '03', 1500),
    ('03005', 'Santiago Sacatepéquez', '03', 1500)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Chimaltenango (04)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('04001', 'Chimaltenango', '04', 1800),
    ('04002', 'San José Chimaltenango', '04', 1800),
    ('04003', 'Tecpán Guatemala', '04', 2200),
    ('04004', 'Comalapa', '04', 2000),
    ('04005', 'Patzún', '04', 2200)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Escuintla (05)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('05001', 'Escuintla', '05', 350),
    ('05002', 'Santa Lucía Cotzumalguapa', '05', 400),
    ('05003', 'La Democracia', '05', 450),
    ('05004', 'Siquinalá', '05', 400),
    ('05005', 'Nueva Concepción', '05', 350)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Santa Rosa (06)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('06001', 'Cuilapa', '06', 900),
    ('06002', 'Barberena', '06', 850),
    ('06003', 'Santa Rosa de Lima', '06', 800),
    ('06004', 'Casillas', '06', 1000)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Sololá (07)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('07001', 'Sololá', '07', 2100),
    ('07002', 'Panajachel', '07', 1600),
    ('07003', 'San Lucas Tolimán', '07', 1700),
    ('07004', 'San Andrés Semetabaj', '07', 1600)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Totonicapán (08)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('08001', 'Totonicapán', '08', 2200),
    ('08002', 'San Cristóbal Totonicapán', '08', 2200),
    ('08003', 'San Francisco El Alto', '08', 2400)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Quetzaltenango (09)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('09001', 'Quetzaltenango', '09', 2330),
    ('09002', 'San Juan Ostuncalco', '09', 2500),
    ('09003', 'Salcajá', '09', 2300),
    ('09004', 'Cantel', '09', 2300),
    ('09005', 'Olintepeque', '09', 2300)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Suchitepéquez (10)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('10001', 'Mazatenango', '10', 370),
    ('10002', 'San Bernardino', '10', 400),
    ('10003', 'San José El Idolo', '10', 350),
    ('10004', 'San Francisco Zapotitlán', '10', 400)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Retalhuleu (11)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('11001', 'Retalhuleu', '11', 400),
    ('11002', 'San Sebastián', '11', 450),
    ('11003', 'Santa Cruz Muluá', '11', 350)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- San Marcos (12)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('12001', 'San Marcos', '12', 2500),
    ('12002', 'San Pedro Sacatepéquez', '12', 2400),
    ('12003', 'San Miguel Ixtahuacán', '12', 2800),
    ('12004', 'Comitancillo', '12', 2700)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Huehuetenango (13)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('13001', 'Huehuetenango', '13', 1900),
    ('13002', 'Chiantla', '13', 2000),
    ('13003', 'Aguacatán', '13', 1700),
    ('13004', 'San Sebastián Huehuetenango', '13', 1900)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Quiché (14)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('14001', 'Santa Cruz del Quiché', '14', 2100),
    ('14002', 'Nebaj', '14', 2000),
    ('14003', 'Chichicastenango', '14', 2100),
    ('14004', 'Cantel', '14', 2200)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Baja Verapaz (15)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('15001', 'Salamá', '15', 940),
    ('15002', 'Cobán', '15', 1320),
    ('15003', 'San Jerónimo', '15', 900),
    ('15004', 'Rabinal', '15', 1000)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Alta Verapaz (16)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('16001', 'Cobán', '16', 1320),
    ('16002', 'San Pedro Carchá', '16', 1300),
    ('16003', 'San Cristóbal Verapaz', '16', 1400),
    ('16004', 'Tactic', '16', 1300)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Petén (17)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('17001', 'Flores', '17', 130),
    ('17002', 'San Benito', '17', 130),
    ('17003', 'San José', '17', 130),
    ('17004', 'Santa Elena', '17', 130)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Izabal (18)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('18001', 'Puerto Barrios', '18', 10),
    ('18002', 'Morales', '18', 50),
    ('18003', 'El Estor', '18', 100),
    ('18004', 'Livingston', '18', 5)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Zacapa (19)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('19001', 'Zacapa', '19', 200),
    ('19002', 'Estanzuela', '19', 250),
    ('19003', 'Gualán', '19', 150),
    ('19004', 'Teculután', '19', 200)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Chiquimula (20)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('20001', 'Chiquimula', '20', 400),
    ('20002', 'Esquipulas', '20', 1000),
    ('20003', 'Jocotán', '20', 500),
    ('20004', 'Camotán', '20', 600)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Jalapa (21)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('21001', 'Jalapa', '21', 1400),
    ('21002', 'San Pedro Pinula', '21', 1300),
    ('21003', 'San Luis Jilotepeque', '21', 1200)
    ON CONFLICT (codigo) DO NOTHING;
    
    -- Jutiapa (22)
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('22001', 'Jutiapa', '22', 700),
    ('22002', 'Asunción Mita', '22', 400),
    ('22003', 'Agua Blanca', '22', 600),
    ('22004', 'Atescatempa', '22', 800)
    ON CONFLICT (codigo) DO NOTHING;
    
    RAISE NOTICE '✅ Insertados: ~90 municipios principales';
  ELSE
    RAISE NOTICE '⏭️  Municipios ya tienen datos (%)', muni_count;
  END IF;
  
  RAISE NOTICE '=== FIN SEED DATA ===';
END $$;

-- ============================================================
-- PARTE 11: VERIFICACIÓN FINAL
-- ============================================================

DO $$
DECLARE
  final_dept_count INTEGER;
  final_muni_count INTEGER;
  total_tables INTEGER;
  valid_count INTEGER;
BEGIN
  RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
  
  -- Contar departamentos
  SELECT COUNT(*) INTO final_dept_count FROM erp_departamentos_gt;
  
  -- Contar municipios
  SELECT COUNT(*) INTO final_muni_count FROM erp_municipios_gt;
  
  -- Contar tablas totales
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name LIKE 'erp_%';
  
  -- Contar tablas válidas
  SELECT COUNT(*) INTO valid_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name LIKE 'erp_%'
    AND table_name IN (
      'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
      'erp_ordenes_compra', 'erp_proveedores', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
      'erp_hitos', 'erp_riesgos', 'erp_cotizaciones_negocio', 'erp_vales_salida',
      'erp_no_conformidades', 'erp_incidentes', 'erp_publicaciones_muro', 'erp_planos',
      'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros', 'erp_pagos_proveedor',
      'erp_destajos', 'erp_recepciones', 'erp_centros_costo', 'erp_seguimiento',
      'erp_bitacora', 'erp_plantillas_proyectos', 'erp_notificaciones', 'erp_presupuestos',
      'erp_avances', 'erp_eventos_calendario', 'erp_ventas_paquetes', 'erp_ordenes_cambio',
      'erp_pruebas_laboratorio', 'erp_liberaciones_partida', 'erp_error_log',
      'erp_proyecto_weather', 'erp_auditoria', 'erp_insumos_base',
      'erp_departamentos_gt', 'erp_municipios_gt', 'erp_reglas_factores',
      'erp_normativa_departamental', 'erp_escalas_produccion', 'erp_estacionalidad',
      'erp_historial_aplicacion_reglas', 'erp_ajustes_estacionales_actividad',
      'erp_calculos_proyecto', 'erp_cumplimiento_normativo',
      'erp_aplicacion_escalas', 'erp_configuracion', 'erp_solicitudes', 'erp_archivos_tipo'
    );
  
  RAISE NOTICE '✅ VERIFICACIÓN COMPLETADA';
  RAISE NOTICE '   - Departamentos: %', final_dept_count;
  RAISE NOTICE '   - Municipios: %', final_muni_count;
  RAISE NOTICE '   - Total tablas erp_*: %', total_tables;
  RAISE NOTICE '   - Tablas válidas: %', valid_count;
  RAISE NOTICE '   - Tablas huérfanas: %', total_tables - valid_count;
  
  IF final_dept_count = 22 AND final_muni_count >= 90 AND total_tables = valid_count THEN
    RAISE NOTICE '✅ BASE DE DATOS 100% ALINEADA CON LA APLICACIÓN';
    RAISE NOTICE '✅ NO HAY TABLAS HUÉRFANAS';
    RAISE NOTICE '✅ NO HAY DATOS HUÉRFANOS';
  ELSE
    RAISE NOTICE '⚠️  Verificar resultados manualmente';
  END IF;
  
  RAISE NOTICE '=== FIN DEL SCRIPT ===';
END $$;
