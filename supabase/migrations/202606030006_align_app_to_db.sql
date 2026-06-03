-- ============================================================
-- CONSTRUSMART ERP - Alineación de Esquema BD vs Aplicación
-- ============================================================

-- 1. erp_empleados: Cambiar proyecto_id a array proyecto_ids
ALTER TABLE erp_empleados DROP COLUMN IF EXISTS proyecto_id;
ALTER TABLE erp_empleados ADD COLUMN IF NOT EXISTS proyecto_ids uuid[] DEFAULT '{}';

-- 2. erp_materiales: Agregar proyecto_ids
ALTER TABLE erp_materiales ADD COLUMN IF NOT EXISTS proyecto_ids uuid[] DEFAULT '{}';

-- 3. erp_movimientos: Agregar factura
ALTER TABLE erp_movimientos ADD COLUMN IF NOT EXISTS factura text;

-- 4. erp_eventos_calendario: Agregar participantes
ALTER TABLE erp_eventos_calendario ADD COLUMN IF NOT EXISTS participantes uuid[] DEFAULT '{}';

-- 5. erp_bitacora: Agregar fotos y firma
ALTER TABLE erp_bitacora ADD COLUMN IF NOT EXISTS fotos text[] DEFAULT '{}';
ALTER TABLE erp_bitacora ADD COLUMN IF NOT EXISTS firma text;

-- 6. erp_proyectos: Agregar factor_sobrecosto
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS factor_sobrecosto jsonb DEFAULT '{"indirectos": 0, "administracion": 0, "imprevistos": 0, "utilidad": 0}'::jsonb;
