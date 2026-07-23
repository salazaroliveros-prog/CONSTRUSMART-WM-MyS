-- ============================================================
-- MIGRACIÓN: Crear tablas faltantes y corregir políticas RLS
-- Generado por auditoría remota - 2026-07-18
-- CORREGIDO: Ahora es idempotente para poder aplicarse en remoto
-- ============================================================

-- 1. TABLAS FALTANTES DEL MOTOR DE CÁLCULO
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_dosificaciones_concreto (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  resistencia text NOT NULL CHECK (resistencia IN ('2000psi','2500psi','3000psi','3500psi','4000psi','4500psi','5000psi')),
  tipo text NOT NULL CHECK (tipo IN ('cimentacion','estructura','losa','pavimento','muro')),
  tamaño_agregado text NOT NULL CHECK (tamaño_agregado IN ('3/8"','3/4"','1/2"','1"','1.5"','2"')),
  aditivos text NOT NULL CHECK (aditivos IN ('ninguno','acelerador','retardador','plastificante','impermeabilizante')),
  curado text NOT NULL CHECK (curado IN ('normal','acelerado','prolongado')),
  cemento_sacos_m3 numeric(5,2) NOT NULL,
  arena_m3_m3 numeric(5,3) NOT NULL,
  piedra_m3_m3 numeric(5,3) NOT NULL,
  agua_lt_m3 numeric(6,1) NOT NULL,
  referencia_norma text,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_parametros_movimiento_tierra (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('desmonte','relleno','excavacion','compactacion')),
  suelo text NOT NULL CHECK (suelo IN ('arcilloso','limoso','arenoso','roca','mixto')),
  profundidad text NOT NULL,
  acceso text NOT NULL CHECK (acceso IN ('facil','moderado','dificil')),
  drenaje text NOT NULL CHECK (drenaje IN ('bueno','regular','malo')),
  factor_equipo numeric(3,2) NOT NULL,
  factor_rendimiento numeric(3,2) NOT NULL,
  costo_hora_maquinaria numeric(10,2) NOT NULL,
  rendimiento_m3_hora numeric(6,2) NOT NULL,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_parametros_pavimentos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('concreto','asfalto','adoquin')),
  espesor_cm numeric(4,2) NOT NULL,
  base text NOT NULL,
  subbase text,
  resistencia_mpa numeric(5,2),
  factor_transito numeric(5,2),
  costo_m2 numeric(10,2) NOT NULL,
  vida_util_anos integer,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_parametros_redes_infraestructura (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('agua_potable','aguas_negras','aguas_lluvias','electrica','telecomunicaciones','gas')),
  material text NOT NULL,
  diametro_pulgadas numeric(5,2),
  profundidad_m numeric(5,2),
  costo_ml numeric(10,2) NOT NULL,
  factor_instalacion numeric(3,2) DEFAULT 1.0,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_parametros_muros_contencion (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('gavion','concreto','mamposteria','tablestaca','soil_nailing')),
  altura_maxima_m numeric(5,2) NOT NULL,
  espesor_m numeric(5,2) NOT NULL,
  factor_seguridad numeric(3,2) NOT NULL,
  costo_m3 numeric(10,2) NOT NULL,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_snapshots_estado_calculo (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL,
  tipo_snapshot text NOT NULL,
  datos jsonb NOT NULL,
  costo_total numeric(12,2),
  factor_ajuste numeric(5,4),
  usuario_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_comparaciones_calculos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL,
  calculo_a_id uuid NOT NULL,
  calculo_b_id uuid NOT NULL,
  costo_a numeric(12,2) NOT NULL,
  costo_b numeric(12,2) NOT NULL,
  diferencia numeric(12,2),
  porcentaje_diff numeric(5,2),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_api_keys (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  api_key_hash text NOT NULL UNIQUE,
  scope text[] DEFAULT '{}',
  ultimo_uso timestamptz,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. CORREGIR POLÍTICAS RLS FALTANTES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_cuadros') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_cuadros' AND cmd = 'SELECT') THEN
      CREATE POLICY "cuadros_read" ON erp_cuadros FOR SELECT TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_pagos_proveedor') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_pagos_proveedor' AND cmd = 'SELECT') THEN
      CREATE POLICY "pagos_proveedor_read" ON erp_pagos_proveedor FOR SELECT TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_recepciones') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_recepciones' AND cmd = 'SELECT') THEN
      CREATE POLICY "recepciones_read" ON erp_recepciones FOR SELECT TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_audit_log') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_audit_log' AND cmd = 'SELECT') THEN
      CREATE POLICY "audit_log_select" ON erp_audit_log FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_audit_log' AND cmd = 'INSERT') THEN
      CREATE POLICY "audit_log_insert" ON erp_audit_log FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_audit_log' AND cmd = 'UPDATE') THEN
      CREATE POLICY "audit_log_update" ON erp_audit_log FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_audit_log' AND cmd = 'DELETE') THEN
      CREATE POLICY "audit_log_delete" ON erp_audit_log FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_access_log') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_access_log' AND cmd = 'UPDATE') THEN
      CREATE POLICY "access_log_update" ON erp_access_log FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_access_log' AND cmd = 'DELETE') THEN
      CREATE POLICY "access_log_delete" ON erp_access_log FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_subtipologias') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_subtipologias' AND cmd = 'INSERT') THEN
      CREATE POLICY "subtipologias_insert" ON erp_subtipologias FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_subtipologias' AND cmd = 'UPDATE') THEN
      CREATE POLICY "subtipologias_update" ON erp_subtipologias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_subtipologias' AND cmd = 'DELETE') THEN
      CREATE POLICY "subtipologias_delete" ON erp_subtipologias FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_calculos_proyecto') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_calculos_proyecto' AND cmd = 'SELECT') THEN
      CREATE POLICY "erp_calculos_proyecto_select_admin_gerente" ON erp_calculos_proyecto FOR SELECT TO authenticated USING (true);
    END IF;
  END IF;
END $$;

-- 3. HABILITAR RLS EN TABLAS NUEVAS
-- ============================================================

ALTER TABLE IF EXISTS erp_dosificaciones_concreto ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS erp_parametros_movimiento_tierra ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS erp_parametros_pavimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS erp_parametros_redes_infraestructura ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS erp_parametros_muros_contencion ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS erp_snapshots_estado_calculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS erp_comparaciones_calculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS erp_api_keys ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS BÁSICAS PARA TABLAS NUEVAS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_dosificaciones_concreto') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_dosificaciones_concreto' AND cmd = 'SELECT' AND policyname = 'dosificaciones_concreto_read_all') THEN
      CREATE POLICY "dosificaciones_concreto_read_all" ON erp_dosificaciones_concreto FOR SELECT TO authenticated USING (activo = true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_movimiento_tierra') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_movimiento_tierra' AND cmd = 'SELECT' AND policyname = 'parametros_movimiento_tierra_read_all') THEN
      CREATE POLICY "parametros_movimiento_tierra_read_all" ON erp_parametros_movimiento_tierra FOR SELECT TO authenticated USING (activo = true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_pavimentos') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_pavimentos' AND cmd = 'SELECT' AND policyname = 'parametros_pavimentos_read_all') THEN
      CREATE POLICY "parametros_pavimentos_read_all" ON erp_parametros_pavimentos FOR SELECT TO authenticated USING (activo = true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_redes_infraestructura') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_redes_infraestructura' AND cmd = 'SELECT' AND policyname = 'parametros_redes_read_all') THEN
      CREATE POLICY "parametros_redes_read_all" ON erp_parametros_redes_infraestructura FOR SELECT TO authenticated USING (activo = true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_muros_contencion') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_muros_contencion' AND cmd = 'SELECT' AND policyname = 'parametros_muros_read_all') THEN
      CREATE POLICY "parametros_muros_read_all" ON erp_parametros_muros_contencion FOR SELECT TO authenticated USING (activo = true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_snapshots_estado_calculo') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_snapshots_estado_calculo' AND cmd = 'SELECT' AND policyname = 'snapshots_calculo_read') THEN
      CREATE POLICY "snapshots_calculo_read" ON erp_snapshots_estado_calculo FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_snapshots_estado_calculo' AND cmd = 'INSERT' AND policyname = 'snapshots_calculo_insert') THEN
      CREATE POLICY "snapshots_calculo_insert" ON erp_snapshots_estado_calculo FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_comparaciones_calculos') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_comparaciones_calculos' AND cmd = 'SELECT' AND policyname = 'comparaciones_read') THEN
      CREATE POLICY "comparaciones_read" ON erp_comparaciones_calculos FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_comparaciones_calculos' AND cmd = 'INSERT' AND policyname = 'comparaciones_insert') THEN
      CREATE POLICY "comparaciones_insert" ON erp_comparaciones_calculos FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_cuadros') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_cuadros' AND cmd = 'SELECT' AND policyname = 'cuadros_read') THEN
      CREATE POLICY "cuadros_read" ON erp_cuadros FOR SELECT TO authenticated USING (true);
    END IF;
  END IF;
END $$;

-- 5. ÍNDICES PARA TABLAS NUEVAS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_snapshots_proyecto ON erp_snapshots_estado_calculo(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_tipo ON erp_snapshots_estado_calculo(tipo_snapshot);
CREATE INDEX IF NOT EXISTS idx_comparaciones_proyecto ON erp_comparaciones_calculos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_comparaciones_calculos ON erp_comparaciones_calculos(calculo_a_id, calculo_b_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON erp_api_keys(api_key_hash);
