-- ============================================================
-- ALINEACIÓN FINAL: TABLAS FALTANTES EN SUPABASE
-- Solo se crean las tablas que realmente faltan
-- ============================================================

-- ============================================================
-- 1. TABLA DE COMENTARIOS DEL MURO
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_comentarios_muro (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  publicacion_id uuid NOT NULL REFERENCES erp_muro(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comentarios_muro_publicacion ON erp_comentarios_muro(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_muro_usuario ON erp_comentarios_muro(usuario_id);

-- ============================================================
-- 2. TABLA DE VENTAS PAQUETES
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_ventas_paquetes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  cliente_id uuid NOT NULL,
  nombre_paquete text NOT NULL,
  monto_total numeric(12,2) NOT NULL,
  moneda text DEFAULT 'GTQ',
  estado text NOT NULL CHECK (estado IN ('disponible','reservado','vendido','cancelado')),
  fecha_venta timestamptz,
  fecha_entrega timestamptz,
  observaciones text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ventas_paquetes_proyecto ON erp_ventas_paquetes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_paquetes_cliente ON erp_ventas_paquetes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_paquetes_estado ON erp_ventas_paquetes(estado);

-- ============================================================
-- NOTA: Las siguientes tablas ya existen en la base de datos
-- ============================================================
-- erp_incidentes_sso - ya existe como VIEW
-- erp_activos_herramienta - ya existe como VIEW
-- erp_error_log_recent - ya existe como VIEW
-- erp_error_log_stats - ya existe como VIEW
-- erp_audit_log_summary - ya existe como VIEW
-- erp_cuadros_comparativos - ya existe como VIEW
-- erp_normativas_departamentales - ya existe como BASE TABLE
-- erp_cumplimiento_normativo - ya existe como BASE TABLE

-- ============================================================
-- RLS POLICIES PARA LAS NUEVAS TABLAS
-- ============================================================

-- Comentarios Muro
ALTER TABLE erp_comentarios_muro ENABLE ROW LEVEL SECURITY;
CREATE POLICY comentarios_muro_select ON erp_comentarios_muro FOR SELECT TO authenticated USING (true);
CREATE POLICY comentarios_muro_insert ON erp_comentarios_muro FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
CREATE POLICY comentarios_muro_update ON erp_comentarios_muro FOR UPDATE TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
CREATE POLICY comentarios_muro_delete ON erp_comentarios_muro FOR DELETE TO authenticated USING (usuario_id = auth.uid() OR get_current_user_role() = 'Administrador');

-- Ventas Paquetes
ALTER TABLE erp_ventas_paquetes ENABLE ROW LEVEL SECURITY;
CREATE POLICY ventas_paquetes_select ON erp_ventas_paquetes FOR SELECT TO authenticated USING (true);
CREATE POLICY ventas_paquetes_insert ON erp_ventas_paquetes FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR get_current_user_role() = ANY (ARRAY['Administrador','Gerente']));
CREATE POLICY ventas_paquetes_update ON erp_ventas_paquetes FOR UPDATE TO authenticated USING (created_by = auth.uid() OR get_current_user_role() = ANY (ARRAY['Administrador','Gerente'])) WITH CHECK (created_by = auth.uid() OR get_current_user_role() = ANY (ARRAY['Administrador','Gerente']));
CREATE POLICY ventas_paquetes_delete ON erp_ventas_paquetes FOR DELETE TO authenticated USING (created_by = auth.uid() OR get_current_user_role() = 'Administrador');

-- ============================================================
-- COMENTARIOS
-- ============================================================
-- Esta migración crea solo las tablas que realmente faltan:
-- 1. erp_comentarios_muro - Comentarios del muro de obra
-- 2. erp_ventas_paquetes - Ventas de paquetes de servicios
-- Las demás tablas ya existen como VIEWS o BASE TABLES