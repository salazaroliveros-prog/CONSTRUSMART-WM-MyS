-- ============================================================
-- CONSTRUSMART ERP - Fix gaps between Supabase schema and code
-- Generado: 2026-06-03
-- 
-- Discrepancias encontradas vs esquema actual de Supabase:
--   Tablas faltantes: erp_avances, erp_licitaciones
--   Columnas faltantes: erp_empleados.activo, erp_materiales.categoria
-- ============================================================

-- ============================================================
-- 1. TABLA: erp_avances
-- (Referenciada en src/erp/store.tsx: addAvance, deleteAvance)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_avances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  presupuesto_id uuid REFERENCES public.erp_presupuestos(id) ON DELETE SET NULL,
  renglon_id uuid REFERENCES public.erp_renglones(id) ON DELETE SET NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  avance_fisico numeric(5,2) NOT NULL DEFAULT 0 CHECK (avance_fisico >= 0 AND avance_fisico <= 100),
  cantidad_ejecutada numeric(10,2) NOT NULL DEFAULT 0,
  foto text,
  latitud double precision,
  longitud double precision,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_avances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para erp_avances
DROP POLICY IF EXISTS "erp_avances_select" ON public.erp_avances;
CREATE POLICY "erp_avances_select"
  ON public.erp_avances FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS "erp_avances_insert" ON public.erp_avances;
CREATE POLICY "erp_avances_insert"
  ON public.erp_avances FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

DROP POLICY IF EXISTS "erp_avances_delete" ON public.erp_avances;
CREATE POLICY "erp_avances_delete"
  ON public.erp_avances FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

-- ============================================================
-- 2. TABLA: erp_licitaciones
-- (Referenciada en src/erp/store.tsx: addLicitacion, updateLicitacion, deleteLicitacion)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_licitaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  cliente text NOT NULL,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  fecha_limite date NOT NULL,
  estado text NOT NULL DEFAULT 'activa' CHECK (estado = ANY (ARRAY['activa','ganada','perdida','cancelada'])),
  documentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  notas text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_licitaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para erp_licitaciones
DROP POLICY IF EXISTS "erp_licitaciones_select" ON public.erp_licitaciones;
CREATE POLICY "erp_licitaciones_select"
  ON public.erp_licitaciones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS "erp_licitaciones_insert" ON public.erp_licitaciones;
CREATE POLICY "erp_licitaciones_insert"
  ON public.erp_licitaciones FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

DROP POLICY IF EXISTS "erp_licitaciones_update" ON public.erp_licitaciones;
CREATE POLICY "erp_licitaciones_update"
  ON public.erp_licitaciones FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

DROP POLICY IF EXISTS "erp_licitaciones_delete" ON public.erp_licitaciones;
CREATE POLICY "erp_licitaciones_delete"
  ON public.erp_licitaciones FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

-- ============================================================
-- 3. COLUMNAS FALTANTES EN TABLAS EXISTENTES
-- ============================================================

-- 3a. erp_empleados: agregar columna activo
-- (usado en src/erp/types.ts linea 137 y store.tsx forEmpleado())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'erp_empleados' AND column_name = 'activo'
  ) THEN
    ALTER TABLE public.erp_empleados ADD COLUMN activo boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- 3b. erp_materiales: agregar columna categoria
-- (usado en src/erp/types.ts linea 119-126, store.tsx materialSchema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'erp_materiales' AND column_name = 'categoria'
  ) THEN
    ALTER TABLE public.erp_materiales ADD COLUMN categoria text NOT NULL DEFAULT 'general';
  END IF;
END $$;

-- ============================================================
-- 4. VERIFICACIÓN: Resumen de políticas RLS activas
-- ============================================================
-- Ejecutar después: SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;