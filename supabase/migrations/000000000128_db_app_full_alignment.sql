-- ============================================================
-- MIGRACIÓN 128: Alineación completa DB ↔ App (idempotente)
-- Objetivo: Sincronizar 1:1 tablas DB con schemas Zod y types TS
-- Estrategia: 100% defensivo — IF NOT EXISTS en todo
-- ============================================================

-- ============================================================
-- 1. erp_proyectos — columnas faltantes requeridas por Zod
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_proyectos') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='subtipo') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN subtipo text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='factor_sobrecosto') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN factor_sobrecosto jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='motivo_pausa') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN motivo_pausa text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='pausado_por') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN pausado_por text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='fecha_pausa') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN fecha_pausa text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='fecha_reanudacion_estimada') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN fecha_reanudacion_estimada text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='etapa_anterior') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN etapa_anterior text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='fecha_cambio_etapa') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN fecha_cambio_etapa text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='latitud') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN latitud numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='longitud') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN longitud numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='fecha_inicio_real') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN fecha_inicio_real text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='fecha_fin_estimada') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN fecha_fin_estimada text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='version') THEN
      ALTER TABLE public.erp_proyectos ADD COLUMN version integer DEFAULT 1;
    END IF;

  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_erp_proyectos_factor_sobrecosto ON public.erp_proyectos USING gin(factor_sobrecosto) WHERE factor_sobrecosto IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_erp_proyectos_subtipo ON public.erp_proyectos(subtipo) WHERE subtipo IS NOT NULL AND subtipo != '';


-- ============================================================
-- 2. erp_cajas_chicas — alinear con cajaChicaSchema Zod
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_cajas_chicas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  monto_asignado numeric(12,2) NOT NULL DEFAULT 0,
  monto_utilizado numeric(12,2) NOT NULL DEFAULT 0,
  saldo numeric(12,2) NOT NULL DEFAULT 0,
  fecha_apertura text NOT NULL DEFAULT '',
  fecha_cierre text,
  estado text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada','cancelada')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_cajas_chicas') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_cajas_chicas' AND column_name='nombre') THEN
      ALTER TABLE public.erp_cajas_chicas ADD COLUMN nombre text NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_cajas_chicas' AND column_name='monto_utilizado') THEN
      ALTER TABLE public.erp_cajas_chicas ADD COLUMN monto_utilizado numeric(12,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_cajas_chicas' AND column_name='saldo') THEN
      ALTER TABLE public.erp_cajas_chicas ADD COLUMN saldo numeric(12,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_cajas_chicas' AND column_name='fecha_apertura') THEN
      ALTER TABLE public.erp_cajas_chicas ADD COLUMN fecha_apertura text NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_cajas_chicas' AND column_name='estado') THEN
      ALTER TABLE public.erp_cajas_chicas ADD COLUMN estado text NOT NULL DEFAULT 'abierta';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_cajas_chicas' AND column_name='created_by') THEN
      ALTER TABLE public.erp_cajas_chicas ADD COLUMN created_by uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_cajas_chicas' AND column_name='updated_by') THEN
      ALTER TABLE public.erp_cajas_chicas ADD COLUMN updated_by uuid;
    END IF;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.erp_cajas_chicas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_cajas_chicas' AND policyname='cajas_chicas_select') THEN
    CREATE POLICY "cajas_chicas_select" ON public.erp_cajas_chicas FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_cajas_chicas' AND policyname='cajas_chicas_insert') THEN
    CREATE POLICY "cajas_chicas_insert" ON public.erp_cajas_chicas FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_cajas_chicas' AND policyname='cajas_chicas_update') THEN
    CREATE POLICY "cajas_chicas_update" ON public.erp_cajas_chicas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_cajas_chicas' AND policyname='cajas_chicas_delete') THEN
    CREATE POLICY "cajas_chicas_delete" ON public.erp_cajas_chicas FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_cajas_chicas TO authenticated;
GRANT ALL ON public.erp_cajas_chicas TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_cajas_chicas_proyecto ON public.erp_cajas_chicas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_cajas_chicas_estado ON public.erp_cajas_chicas(estado);

-- ============================================================
-- 3. erp_anticipos — alinear con anticipoSchema Zod
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_anticipos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  proveedor_id uuid,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  motivo text NOT NULL DEFAULT '',
  fecha_solicitud text NOT NULL DEFAULT '',
  fecha_aprobacion text,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','pagado','rechazado')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_anticipos') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_anticipos' AND column_name='motivo') THEN
      ALTER TABLE public.erp_anticipos ADD COLUMN motivo text NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_anticipos' AND column_name='fecha_solicitud') THEN
      ALTER TABLE public.erp_anticipos ADD COLUMN fecha_solicitud text NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_anticipos' AND column_name='fecha_aprobacion') THEN
      ALTER TABLE public.erp_anticipos ADD COLUMN fecha_aprobacion text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_anticipos' AND column_name='proveedor_id') THEN
      ALTER TABLE public.erp_anticipos ADD COLUMN proveedor_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_anticipos' AND column_name='estado') THEN
      ALTER TABLE public.erp_anticipos ADD COLUMN estado text NOT NULL DEFAULT 'pendiente';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_anticipos' AND column_name='created_by') THEN
      ALTER TABLE public.erp_anticipos ADD COLUMN created_by uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_anticipos' AND column_name='updated_by') THEN
      ALTER TABLE public.erp_anticipos ADD COLUMN updated_by uuid;
    END IF;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.erp_anticipos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_anticipos' AND policyname='anticipos_select') THEN
    CREATE POLICY "anticipos_select" ON public.erp_anticipos FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_anticipos' AND policyname='anticipos_insert') THEN
    CREATE POLICY "anticipos_insert" ON public.erp_anticipos FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_anticipos' AND policyname='anticipos_update') THEN
    CREATE POLICY "anticipos_update" ON public.erp_anticipos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_anticipos' AND policyname='anticipos_delete') THEN
    CREATE POLICY "anticipos_delete" ON public.erp_anticipos FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_anticipos TO authenticated;
GRANT ALL ON public.erp_anticipos TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_anticipos_proyecto ON public.erp_anticipos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_anticipos_estado ON public.erp_anticipos(estado);


-- ============================================================
-- 4. erp_amortizaciones — alinear con amortizacionSchema Zod
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_amortizaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  anticipo_id uuid REFERENCES public.erp_anticipos(id) ON DELETE CASCADE,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  fecha text NOT NULL DEFAULT '',
  metodo text NOT NULL DEFAULT 'mensual' CHECK (metodo IN ('mensual','trimestral','anual')),
  numero_cuota integer NOT NULL DEFAULT 1,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_amortizaciones') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_amortizaciones' AND column_name='anticipo_id') THEN
      ALTER TABLE public.erp_amortizaciones ADD COLUMN anticipo_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_amortizaciones' AND column_name='metodo') THEN
      ALTER TABLE public.erp_amortizaciones ADD COLUMN metodo text NOT NULL DEFAULT 'mensual';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_amortizaciones' AND column_name='numero_cuota') THEN
      ALTER TABLE public.erp_amortizaciones ADD COLUMN numero_cuota integer NOT NULL DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_amortizaciones' AND column_name='observaciones') THEN
      ALTER TABLE public.erp_amortizaciones ADD COLUMN observaciones text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_amortizaciones' AND column_name='fecha') THEN
      ALTER TABLE public.erp_amortizaciones ADD COLUMN fecha text NOT NULL DEFAULT '';
    END IF;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.erp_amortizaciones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_amortizaciones' AND policyname='amortizaciones_select') THEN
    CREATE POLICY "amortizaciones_select" ON public.erp_amortizaciones FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_amortizaciones' AND policyname='amortizaciones_insert') THEN
    CREATE POLICY "amortizaciones_insert" ON public.erp_amortizaciones FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_amortizaciones' AND policyname='amortizaciones_update') THEN
    CREATE POLICY "amortizaciones_update" ON public.erp_amortizaciones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_amortizaciones' AND policyname='amortizaciones_delete') THEN
    CREATE POLICY "amortizaciones_delete" ON public.erp_amortizaciones FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_amortizaciones TO authenticated;
GRANT ALL ON public.erp_amortizaciones TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_amortizaciones_anticipo ON public.erp_amortizaciones(anticipo_id);

-- ============================================================
-- 5. erp_bodega — agregar columnas faltantes (stock=cantidad_actual, codigo, nombre)
-- Schema Zod usa: id, proyectoId, materialId, codigo, nombre, categoria, unidad, stock, stockMinimo
-- DB tiene: cantidad_actual (alias de stock), pero falta codigo y nombre
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_bodega') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_bodega' AND column_name='codigo') THEN
      ALTER TABLE public.erp_bodega ADD COLUMN codigo text DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_bodega' AND column_name='nombre') THEN
      ALTER TABLE public.erp_bodega ADD COLUMN nombre text DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_bodega' AND column_name='stock') THEN
      ALTER TABLE public.erp_bodega ADD COLUMN stock numeric DEFAULT 0;
      UPDATE public.erp_bodega SET stock = COALESCE(cantidad_actual, 0) WHERE stock IS NULL OR stock = 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_bodega' AND column_name='stock_minimo') THEN
      ALTER TABLE public.erp_bodega ADD COLUMN stock_minimo numeric DEFAULT 0;
      UPDATE public.erp_bodega SET stock_minimo = COALESCE(cantidad_minima, 0) WHERE stock_minimo IS NULL OR stock_minimo = 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_bodega' AND column_name='created_by') THEN
      ALTER TABLE public.erp_bodega ADD COLUMN created_by uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_bodega' AND column_name='updated_by') THEN
      ALTER TABLE public.erp_bodega ADD COLUMN updated_by uuid;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_erp_bodega_codigo ON public.erp_bodega(codigo) WHERE codigo IS NOT NULL AND codigo != '';
CREATE INDEX IF NOT EXISTS idx_erp_bodega_stock ON public.erp_bodega(stock);


-- ============================================================
-- 6. erp_documentos — agregar tamano_bytes (alias de tamano)
-- Schema Zod usa: tamanoBytes; DB usa: tamano
-- Solución: agregar tamano_bytes como alias y sincronizar
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_documentos') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_documentos' AND column_name='tamano_bytes') THEN
      ALTER TABLE public.erp_documentos ADD COLUMN tamano_bytes numeric;
      UPDATE public.erp_documentos SET tamano_bytes = tamano WHERE tamano_bytes IS NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_documentos' AND column_name='subido_por_texto') THEN
      ALTER TABLE public.erp_documentos ADD COLUMN subido_por_texto text DEFAULT '';
    END IF;
  END IF;
END $$;

-- ============================================================
-- 7. erp_permisos — crear/alinear con permisoSchema Zod
-- Schema Zod usa: id, usuarioId, proyectoId, rol, permisos (JSONB record)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_permisos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  rol text,
  permisos jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_permisos') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_permisos' AND column_name='usuario_id') THEN
      ALTER TABLE public.erp_permisos ADD COLUMN usuario_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_permisos' AND column_name='proyecto_id') THEN
      ALTER TABLE public.erp_permisos ADD COLUMN proyecto_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_permisos' AND column_name='rol') THEN
      ALTER TABLE public.erp_permisos ADD COLUMN rol text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_permisos' AND column_name='permisos') THEN
      ALTER TABLE public.erp_permisos ADD COLUMN permisos jsonb DEFAULT '{}'::jsonb;
    END IF;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.erp_permisos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_permisos' AND policyname='permisos_select') THEN
    CREATE POLICY "permisos_select" ON public.erp_permisos FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_permisos' AND policyname='permisos_insert') THEN
    CREATE POLICY "permisos_insert" ON public.erp_permisos FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_permisos' AND policyname='permisos_update') THEN
    CREATE POLICY "permisos_update" ON public.erp_permisos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_permisos' AND policyname='permisos_delete') THEN
    CREATE POLICY "permisos_delete" ON public.erp_permisos FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_permisos TO authenticated;
GRANT ALL ON public.erp_permisos TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_permisos_usuario ON public.erp_permisos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_erp_permisos_proyecto ON public.erp_permisos(proyecto_id);

-- ============================================================
-- 8. erp_checklist — crear/alinear con checklistSchema Zod
-- Schema Zod usa: id, proyectoId, nombre, items (JSONB), estado, createdBy, updatedBy
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_checklist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','en_progreso','completado','cancelado')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_checklist') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_checklist' AND column_name='nombre') THEN
      ALTER TABLE public.erp_checklist ADD COLUMN nombre text NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_checklist' AND column_name='items') THEN
      ALTER TABLE public.erp_checklist ADD COLUMN items jsonb NOT NULL DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_checklist' AND column_name='estado') THEN
      ALTER TABLE public.erp_checklist ADD COLUMN estado text NOT NULL DEFAULT 'borrador';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_checklist' AND column_name='created_by') THEN
      ALTER TABLE public.erp_checklist ADD COLUMN created_by uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_checklist' AND column_name='updated_by') THEN
      ALTER TABLE public.erp_checklist ADD COLUMN updated_by uuid;
    END IF;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.erp_checklist ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_checklist' AND policyname='checklist_select') THEN
    CREATE POLICY "checklist_select" ON public.erp_checklist FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_checklist' AND policyname='checklist_insert') THEN
    CREATE POLICY "checklist_insert" ON public.erp_checklist FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_checklist' AND policyname='checklist_update') THEN
    CREATE POLICY "checklist_update" ON public.erp_checklist FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_checklist' AND policyname='checklist_delete') THEN
    CREATE POLICY "checklist_delete" ON public.erp_checklist FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_checklist TO authenticated;
GRANT ALL ON public.erp_checklist TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_checklist_proyecto ON public.erp_checklist(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_checklist_estado ON public.erp_checklist(estado);
CREATE INDEX IF NOT EXISTS idx_erp_checklist_items ON public.erp_checklist USING gin(items);


-- ============================================================
-- 9. erp_configuracion — crear/alinear con configuracionSchema Zod
-- Schema Zod usa: id, proyectoId, nombre, valor, tipo, descripcion, updatedBy
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_configuracion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  valor text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto','numero','booleano','json')),
  descripcion text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_configuracion') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_configuracion' AND column_name='proyecto_id') THEN
      ALTER TABLE public.erp_configuracion ADD COLUMN proyecto_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_configuracion' AND column_name='nombre') THEN
      ALTER TABLE public.erp_configuracion ADD COLUMN nombre text NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_configuracion' AND column_name='valor') THEN
      ALTER TABLE public.erp_configuracion ADD COLUMN valor text NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_configuracion' AND column_name='tipo') THEN
      ALTER TABLE public.erp_configuracion ADD COLUMN tipo text NOT NULL DEFAULT 'texto';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_configuracion' AND column_name='descripcion') THEN
      ALTER TABLE public.erp_configuracion ADD COLUMN descripcion text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_configuracion' AND column_name='updated_by') THEN
      ALTER TABLE public.erp_configuracion ADD COLUMN updated_by uuid;
    END IF;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.erp_configuracion ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_configuracion' AND policyname='configuracion_select') THEN
    CREATE POLICY "configuracion_select" ON public.erp_configuracion FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_configuracion' AND policyname='configuracion_insert') THEN
    CREATE POLICY "configuracion_insert" ON public.erp_configuracion FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_configuracion' AND policyname='configuracion_update') THEN
    CREATE POLICY "configuracion_update" ON public.erp_configuracion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='erp_configuracion' AND policyname='configuracion_delete') THEN
    CREATE POLICY "configuracion_delete" ON public.erp_configuracion FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_configuracion TO authenticated;
GRANT ALL ON public.erp_configuracion TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_configuracion_proyecto ON public.erp_configuracion(proyecto_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_erp_configuracion_proyecto_nombre ON public.erp_configuracion(proyecto_id, nombre);

-- ============================================================
-- 10. erp_api_keys — alinear con apiKeySchema Zod
-- Schema Zod usa: keyHash, ultimos4, rol, expiracion, activa, ultimoUso, createdBy
-- DB tiene: api_key_hash — agregar ultimos4, rol, expiracion, created_by
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_api_keys') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_api_keys' AND column_name='key_hash') THEN
      ALTER TABLE public.erp_api_keys ADD COLUMN key_hash text;
      UPDATE public.erp_api_keys SET key_hash = api_key_hash WHERE key_hash IS NULL AND api_key_hash IS NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_api_keys' AND column_name='ultimos4') THEN
      ALTER TABLE public.erp_api_keys ADD COLUMN ultimos4 text DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_api_keys' AND column_name='rol') THEN
      ALTER TABLE public.erp_api_keys ADD COLUMN rol text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_api_keys' AND column_name='expiracion') THEN
      ALTER TABLE public.erp_api_keys ADD COLUMN expiracion timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_api_keys' AND column_name='created_by') THEN
      ALTER TABLE public.erp_api_keys ADD COLUMN created_by uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_api_keys' AND column_name='ultimo_uso') THEN
      ALTER TABLE public.erp_api_keys ADD COLUMN ultimo_uso timestamptz;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_erp_api_keys_hash ON public.erp_api_keys(key_hash) WHERE key_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_erp_api_keys_activa ON public.erp_api_keys(activa);

-- ============================================================
-- 11. TRIGGERS updated_at para tablas nuevas
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'erp_cajas_chicas','erp_anticipos','erp_amortizaciones',
    'erp_bodega','erp_checklist','erp_configuracion','erp_permisos'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='updated_at')
    AND NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema='public' AND event_object_table=t AND trigger_name='set_updated_at_' || t) THEN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 12. REALTIME para tablas nuevas
-- ============================================================

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'erp_cajas_chicas','erp_anticipos','erp_amortizaciones',
    'erp_bodega','erp_checklist','erp_configuracion','erp_permisos'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 13. GRANTS finales de seguridad
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
