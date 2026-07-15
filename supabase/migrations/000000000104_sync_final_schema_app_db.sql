-- ============================================================
-- MIGRACIÓN 0104: Sincronización final schema código ↔ BD
-- Fecha: 2026-07-15
-- Propósito: Alinear columnas faltantes/divergentes detectadas
--            en tablas ERP ya existentes, sin redefinir tablas.
-- ============================================================

-- ============================================================
-- 1. erp_proyectos
-- ============================================================

ALTER TABLE public.erp_proyectos
  ADD COLUMN IF NOT EXISTS latitud numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitud numeric(9,6);

-- ============================================================
-- 2. erp_hitos
-- ============================================================

ALTER TABLE public.erp_hitos
  ADD COLUMN IF NOT EXISTS depende_de uuid[] DEFAULT ARRAY[]::uuid[],
  ADD COLUMN IF NOT EXISTS completado_en timestamptz;

-- ============================================================
-- 3. erp_riesgos
-- ============================================================

ALTER TABLE public.erp_riesgos
  ADD COLUMN IF NOT EXISTS nombre text,
  ADD COLUMN IF NOT EXISTS nivel text DEFAULT 'bajo',
  ADD COLUMN IF NOT EXISTS costo_soporte numeric(12,2),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- 4. erp_plantillas_proyectos
-- ============================================================

ALTER TABLE public.erp_plantillas_proyectos
  ADD COLUMN IF NOT EXISTS favorita boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS version_historial jsonb DEFAULT '[]'::jsonb;

-- ============================================================
-- 5. erp_notificaciones
-- ============================================================

ALTER TABLE public.erp_notificaciones
  ADD COLUMN IF NOT EXISTS referencia_id uuid,
  ADD COLUMN IF NOT EXISTS referencia_tipo text,
  ADD COLUMN IF NOT EXISTS fecha_lectura timestamptz,
  ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS prioridad text DEFAULT 'normal';

-- ============================================================
-- 6. erp_error_log
-- ============================================================

ALTER TABLE public.erp_error_log
  ADD COLUMN IF NOT EXISTS entidad text,
  ADD COLUMN IF NOT EXISTS entidad_id text;

-- ============================================================
-- 7. Índices útiles
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_erp_notificaciones_usuario
  ON public.erp_notificaciones(usuario_id);

CREATE INDEX IF NOT EXISTS idx_erp_notificaciones_proyecto_leido
  ON public.erp_notificaciones(proyecto_id, leido);

CREATE INDEX IF NOT EXISTS idx_erp_plantillas_favorita
  ON public.erp_plantillas_proyectos(favorita)
  WHERE favorita = TRUE;

CREATE INDEX IF NOT EXISTS idx_erp_riesgos_nombre
  ON public.erp_riesgos(nombre);

CREATE INDEX IF NOT EXISTS idx_erp_riesgos_nivel
  ON public.erp_riesgos(nivel);

-- ============================================================
-- FIN MIGRACIÓN 0104
-- ============================================================
