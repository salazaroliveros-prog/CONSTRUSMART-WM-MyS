-- ============================================================
-- MIGRACIÓN 118: Crear tablas faltantes del motor de cálculo
-- ============================================================
-- Fecha: 2026-07-17
-- Propósito: Crear tablas referenciadas en migraciones anteriores
-- pero sin sentencia CREATE TABLE propia.
-- ============================================================

-- ============================================================
-- 1) erp_ajustes_estacionales_actividad
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_ajustes_estacionales_actividad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estacionalidad_id text NOT NULL,
  tipo_actividad text NOT NULL,
  factor_especifico numeric(5,3) DEFAULT 1.0,
  impacto_duracion integer,
  recomendaciones text[] DEFAULT '{}',
  medidas_mitigacion text[] DEFAULT '{}',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_ajustes_estacionales_actividad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ajustes_estacionales_read_all"
  ON public.erp_ajustes_estacionales_actividad
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ajustes_estacionales_write_roles"
  ON public.erp_ajustes_estacionales_actividad
  FOR ALL TO authenticated
  USING ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])))
  WITH CHECK ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])));

CREATE INDEX IF NOT EXISTS idx_ajustes_estacionales_actividad_estacionalidad
  ON public.erp_ajustes_estacionales_actividad (estacionalidad_id);

CREATE INDEX IF NOT EXISTS idx_ajustes_estacionales_actividad_tipo
  ON public.erp_ajustes_estacionales_actividad (tipo_actividad);

CREATE OR REPLACE FUNCTION public.fn_set_updated_at_ajustes_estacionales_actividad()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_ajustes_estacionales_actividad_updated
  ON public.erp_ajustes_estacionales_actividad;
CREATE TRIGGER trg_erp_ajustes_estacionales_actividad_updated
  BEFORE UPDATE ON public.erp_ajustes_estacionales_actividad
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at_ajustes_estacionales_actividad();

-- ============================================================
-- 2) erp_calculos_proyecto
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_calculos_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id text NOT NULL,
  tipo_calculo text NOT NULL DEFAULT 'apu',
  fecha_calculo text,
  usuario_id text,
  parametros jsonb DEFAULT '{}'::jsonb,
  resultados jsonb DEFAULT '{}'::jsonb,
  version_calculo integer,
  origen_calculo text,
  observaciones text,
  validado boolean DEFAULT false,
  validado_por text,
  fecha_validacion text,
  notas_validacion text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_calculos_proyecto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calculos_proyecto_read_all"
  ON public.erp_calculos_proyecto
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "calculos_proyecto_write_roles"
  ON public.erp_calculos_proyecto
  FOR ALL TO authenticated
  USING ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text])))
  WITH CHECK ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text])));

CREATE INDEX IF NOT EXISTS idx_calculos_proyecto_proyecto
  ON public.erp_calculos_proyecto (proyecto_id);

CREATE INDEX IF NOT EXISTS idx_calculos_proyecto_tipo
  ON public.erp_calculos_proyecto (tipo_calculo);

CREATE INDEX IF NOT EXISTS idx_calculos_proyecto_fecha
  ON public.erp_calculos_proyecto (fecha_calculo);

CREATE OR REPLACE FUNCTION public.fn_set_updated_at_calculos_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_calculos_proyecto_updated
  ON public.erp_calculos_proyecto;
CREATE TRIGGER trg_erp_calculos_proyecto_updated
  BEFORE UPDATE ON public.erp_calculos_proyecto
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at_calculos_proyecto();

-- ============================================================
-- 3) erp_cumplimiento_normativo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_cumplimiento_normativo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id text NOT NULL,
  norma_id text NOT NULL,
  estado_cumplimiento text,
  fecha_verificacion text,
  responsable_verificacion text,
  evidencias_cumplimiento jsonb DEFAULT '{}'::jsonb,
  observaciones text,
  requiere_acciones_correctivas boolean DEFAULT false,
  acciones_correctivas text[] DEFAULT '{}',
  fecha_limite_correccion text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_cumplimiento_normativo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cumplimiento_read_all"
  ON public.erp_cumplimiento_normativo
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cumplimiento_write_roles"
  ON public.erp_cumplimiento_normativo
  FOR ALL TO authenticated
  USING ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text])))
  WITH CHECK ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text])));

CREATE INDEX IF NOT EXISTS idx_cumplimiento_proyecto
  ON public.erp_cumplimiento_normativo (proyecto_id);

CREATE INDEX IF NOT EXISTS idx_cumplimiento_norma
  ON public.erp_cumplimiento_normativo (norma_id);

CREATE INDEX IF NOT EXISTS idx_cumplimiento_estado
  ON public.erp_cumplimiento_normativo (estado_cumplimiento);

CREATE OR REPLACE FUNCTION public.fn_set_updated_at_cumplimiento_normativo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_cumplimiento_normativo_updated
  ON public.erp_cumplimiento_normativo;
CREATE TRIGGER trg_erp_cumplimiento_normativo_updated
  BEFORE UPDATE ON public.erp_cumplimiento_normativo
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at_cumplimiento_normativo();

-- ============================================================
-- 4) erp_aplicacion_escalas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_aplicacion_escalas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id text NOT NULL,
  escala_id text NOT NULL,
  tamano_proyecto numeric,
  presupuesto_estimado numeric,
  cantidad_renglones integer,
  factor_economia_aplicado numeric,
  factor_administracion_aplicado numeric,
  factor_imprevistos_aplicado numeric,
  factor_logistica_aplicado numeric,
  factor_financiero_aplicado numeric,
  factor_total numeric,
  costo_ajustado numeric,
  ahorro_estimado numeric,
  usuario_aplicacion text,
  fecha_aplicacion text,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_aplicacion_escalas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aplicacion_escalas_read_all"
  ON public.erp_aplicacion_escalas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "aplicacion_escalas_write_roles"
  ON public.erp_aplicacion_escalas
  FOR ALL TO authenticated
  USING ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])))
  WITH CHECK ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])));

CREATE INDEX IF NOT EXISTS idx_aplicacion_escalas_proyecto
  ON public.erp_aplicacion_escalas (proyecto_id);

CREATE INDEX IF NOT EXISTS idx_aplicacion_escalas_escala
  ON public.erp_aplicacion_escalas (escala_id);

CREATE OR REPLACE FUNCTION public.fn_set_updated_at_aplicacion_escalas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_aplicacion_escalas_updated
  ON public.erp_aplicacion_escalas;
CREATE TRIGGER trg_erp_aplicacion_escalas_updated
  BEFORE UPDATE ON public.erp_aplicacion_escalas
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at_aplicacion_escalas();

-- ============================================================
-- 5) erp_snapshots_estado_calculo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_snapshots_estado_calculo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calculo_id text NOT NULL,
  nombre text NOT NULL,
  parametros_snapshot jsonb DEFAULT '{}'::jsonb,
  resultados_snapshot jsonb DEFAULT '{}'::jsonb,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_snapshots_estado_calculo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_lectura_autenticados"
  ON public.erp_snapshots_estado_calculo
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "snapshots_escritura_autenticados"
  ON public.erp_snapshots_estado_calculo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_snapshots_calculo
  ON public.erp_snapshots_estado_calculo (calculo_id);

CREATE OR REPLACE FUNCTION public.fn_set_updated_at_snapshots_estado_calculo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_snapshots_estado_calculo_updated
  ON public.erp_snapshots_estado_calculo;
CREATE TRIGGER trg_erp_snapshots_estado_calculo_updated
  BEFORE UPDATE ON public.erp_snapshots_estado_calculo
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at_snapshots_estado_calculo();
