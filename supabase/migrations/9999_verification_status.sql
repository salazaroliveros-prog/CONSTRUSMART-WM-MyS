-- ============================================================
-- VERIFICACIÓN DE ESTADO ACTUAL: SUPABASE LOCAL
-- Script de análisis sin duplicaciones
-- ============================================================

-- 1. VER TODAS LAS TABLAS ERP
SELECT table_name, column_count, 
       CASE WHEN table_name LIKE '%hito%' THEN '⚠️ HITOS' 
            WHEN table_name LIKE '%riesgo%' THEN '⚠️ RIESGOS'
            WHEN table_name LIKE '%cuenta%' THEN '⚠️ CUENTAS'
            WHEN table_name LIKE '%empleados_proyectos%' THEN '✅ M:M'
            WHEN table_name LIKE '%materiales_proyectos%' THEN '✅ M:M'
            ELSE '✅ BASE' END as estado
FROM (
  SELECT table_name, COUNT(*) as column_count
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name LIKE 'erp_%'
  GROUP BY table_name
  ORDER BY table_name
) subq;

-- 2. VERIFICAR COLUMNAS EN erp_proyectos (debe tener ~46, tiene ~17)
SELECT COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'erp_proyectos';

-- 3. LISTAR COLUMNAS FALTANTES EN erp_proyectos
WITH expected AS (
  SELECT UNNEST(ARRAY[
    'descripcion', 'subtipo', 'tipo_obra', 'cliente_telefono', 'cliente_email',
    'direccion', 'ciudad', 'departamento', 'pais', 'codigo_postal',
    'area_construccion', 'num_pisos', 'plazo_semanas',
    'ingeniero_residente', 'supervisor', 'arquitecto',
    'numero_expediente', 'numero_licencia',
    'fecha_inicio_real', 'fecha_fin_estimada',
    'etapa', 'etapa_anterior', 'fecha_cambio_etapa',
    'margen_utilidad_objetivo', 'moneda',
    'motivo_pausa', 'pausado_por', 'fecha_pausa', 'fecha_reanudacion_estimada', 'version'
  ]) as col_name
),
existing AS (
  SELECT column_name as col_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'erp_proyectos'
)
SELECT e.col_name as "❌ FALTA COLUMNA" 
FROM expected e
LEFT JOIN existing ex ON e.col_name = ex.col_name
WHERE ex.col_name IS NULL
ORDER BY e.col_name;

-- 4. VERIFICAR SI EXISTEN TABLAS CRÍTICAS FALTANTES
SELECT 
  'erp_hitos' as tabla,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='erp_hitos') as existe
UNION ALL
SELECT 'erp_riesgos', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='erp_riesgos')
UNION ALL
SELECT 'erp_cuentas_cobrar', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='erp_cuentas_cobrar')
UNION ALL
SELECT 'erp_cuentas_pagar', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='erp_cuentas_pagar')
UNION ALL
SELECT 'erp_empleados_proyectos', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='erp_empleados_proyectos')
UNION ALL
SELECT 'erp_materiales_proyectos', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='erp_materiales_proyectos')
UNION ALL
SELECT 'erp_ordenes_cambio', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='erp_ordenes_cambio')
UNION ALL
SELECT 'erp_notificaciones', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='erp_notificaciones');

-- 5. VERIFICAR FK FALTANTES EN erp_ordenes_compra
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'erp_ordenes_compra'
ORDER BY ordinal_position;

-- 6. VERIFICAR FK FALTANTES EN erp_renglones
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'erp_renglones'
WHERE column_name IN ('presupuesto_id', 'avance_fisico', 'avance_financiero', 'predecesores');

-- 7. CONTAR CAMPOS EN erp_movimientos
SELECT COUNT(*) as campos_movimientos,
       STRING_AGG(column_name, ', ' ORDER BY column_name) as columnas
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'erp_movimientos';
