-- Fix missing columns and RLS policies
-- Migration: 000000000121

-- Add missing columns to erp_proyectos
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS subtipo TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS tipo_obra TEXT DEFAULT 'nueva';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS cliente_nit TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS cliente_telefono TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS cliente_email TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS direccion TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS ciudad TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS departamento TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Guatemala';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS codigo_postal TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS area_construccion NUMERIC;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS num_pisos INTEGER;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS plazo_semanas INTEGER;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS ingeniero_residente TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS supervisor TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS arquitecto TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS numero_expediente TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS numero_licencia TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS margen_utilidad_objetivo NUMERIC;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'GTQ';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS etapa TEXT DEFAULT 'planificacion';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS fecha_inicio_real TEXT;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS fecha_fin_estimada TEXT;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS motivo_pausa TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS pausado_por TEXT DEFAULT '';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS fecha_pausa TEXT;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS fecha_reanudacion_estimada TEXT;

-- Add missing columns to erp_notificaciones
ALTER TABLE erp_notificaciones ADD COLUMN IF NOT EXISTS referencia_id TEXT;
ALTER TABLE erp_notificaciones ADD COLUMN IF NOT EXISTS leido BOOLEAN DEFAULT FALSE;
ALTER TABLE erp_notificaciones ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Enable RLS on tables that don't have it
ALTER TABLE erp_cotizaciones_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_backup_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_monitoring_config ENABLE ROW LEVEL SECURITY;

-- NOTE: duplicate policy cleanup for catalog tables is handled in migration 000000000121 via idempotent DDL above.

-- Create RLS policies for tables without them
-- erp_cotizaciones_negocio
CREATE POLICY cotizaciones_negocio_read_all ON erp_cotizaciones_negocio FOR SELECT TO authenticated USING (true);
CREATE POLICY cotizaciones_negocio_insert_auth ON erp_cotizaciones_negocio FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY cotizaciones_negocio_update_auth ON erp_cotizaciones_negocio FOR UPDATE TO authenticated USING (true);
CREATE POLICY cotizaciones_negocio_delete_admin ON erp_cotizaciones_negocio FOR DELETE TO authenticated USING (auth.uid() IN (SELECT id FROM erp_usuarios WHERE rol = 'admin'));

-- erp_backup_config (admin only)
CREATE POLICY backup_config_admin_all ON erp_backup_config FOR ALL TO authenticated USING (auth.uid() IN (SELECT id FROM erp_usuarios WHERE rol = 'admin'));

-- erp_monitoring_config (admin only)
CREATE POLICY monitoring_config_admin_all ON erp_monitoring_config FOR ALL TO authenticated USING (auth.uid() IN (SELECT id FROM erp_usuarios WHERE rol = 'admin'));
