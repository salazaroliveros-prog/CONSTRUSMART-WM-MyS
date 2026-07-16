-- ============================================================================
-- MIGRACIÓN 115: Columnas faltantes en tablas operacionales
-- Fecha: 2026-07-16
-- Motivo: Cerrar brechas entre Zod schemas (fuente de verdad del app) y
--         las columnas reales en Supabase. Idempotente (ADD COLUMN IF NOT EXISTS).
-- ============================================================================

-- ── 1. erp_seguimiento ────────────────────────────────────────────────────────
-- seguimientoSchema espera: cv, sv, valor_planeado, valor_ganado, costo_planeado,
-- costo_real, avance_fisico, avance_financiero

ALTER TABLE public.erp_seguimiento
  ADD COLUMN IF NOT EXISTS avance_fisico        numeric(5,2)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avance_financiero     numeric(5,2)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_planeado        numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_real            numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_planeado        numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_ganado          numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cv                    numeric(14,2),
  ADD COLUMN IF NOT EXISTS sv                    numeric(14,2),
  ADD COLUMN IF NOT EXISTS created_at            timestamptz   DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz   DEFAULT now();

DROP TRIGGER IF EXISTS trg_erp_seguimiento_updated ON public.erp_seguimiento;
CREATE TRIGGER trg_erp_seguimiento_updated
  BEFORE UPDATE ON public.erp_seguimiento
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ── 2. erp_avances ────────────────────────────────────────────────────────────
-- avanceObraSchema espera: presupuesto_id, renglon_id, renglon_codigo,
-- renglon_nombre, latitud, longitud, avance_fisico, cantidad_ejecutada

ALTER TABLE public.erp_avances
  ADD COLUMN IF NOT EXISTS presupuesto_id        uuid,
  ADD COLUMN IF NOT EXISTS renglon_id            uuid,
  ADD COLUMN IF NOT EXISTS renglon_codigo        text,
  ADD COLUMN IF NOT EXISTS renglon_nombre        text,
  ADD COLUMN IF NOT EXISTS latitud               double precision,
  ADD COLUMN IF NOT EXISTS longitud              double precision,
  ADD COLUMN IF NOT EXISTS avance_fisico         numeric(5,2)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cantidad_ejecutada    numeric(12,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz   DEFAULT now();

DROP TRIGGER IF EXISTS trg_erp_avances_updated ON public.erp_avances;
CREATE TRIGGER trg_erp_avances_updated
  BEFORE UPDATE ON public.erp_avances
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_erp_avances_proyecto
  ON public.erp_avances(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_avances_fecha
  ON public.erp_avances(fecha DESC);

-- ── 3. erp_empleados ──────────────────────────────────────────────────────────
-- empleadoSchema espera: proyecto_ids (array), dias_trabajados, telefono,
-- fecha_asignacion, tipo (planilla|destajo)

ALTER TABLE public.erp_empleados
  ADD COLUMN IF NOT EXISTS proyecto_ids          uuid[]        DEFAULT ARRAY[]::uuid[],
  ADD COLUMN IF NOT EXISTS dias_trabajados       integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tipo                  text          DEFAULT 'planilla'
    CHECK (tipo IN ('planilla','destajo')),
  ADD COLUMN IF NOT EXISTS activo                boolean       DEFAULT true,
  ADD COLUMN IF NOT EXISTS fecha_asignacion      date,
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz   DEFAULT now();

DROP TRIGGER IF EXISTS trg_erp_empleados_updated ON public.erp_empleados;
CREATE TRIGGER trg_erp_empleados_updated
  BEFORE UPDATE ON public.erp_empleados
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ── 4. erp_incidentes ─────────────────────────────────────────────────────────
-- incidenteSchema espera: lat/lng (aliases de latitud/longitud), hora, hora formato text

ALTER TABLE public.erp_incidentes
  ADD COLUMN IF NOT EXISTS lat                   double precision,
  ADD COLUMN IF NOT EXISTS lng                   double precision,
  ADD COLUMN IF NOT EXISTS hora                  text          DEFAULT '00:00',
  ADD COLUMN IF NOT EXISTS estado                text          DEFAULT 'abierto'
    CHECK (estado IN ('abierto','investigacion','cerrado'));

-- ── 5. erp_ordenes_cambio ─────────────────────────────────────────────────────
-- ordenCambioSchema espera: solicitante_rol

ALTER TABLE public.erp_ordenes_cambio
  ADD COLUMN IF NOT EXISTS solicitante_rol       text          DEFAULT '';

-- ── 6. erp_presupuestos ───────────────────────────────────────────────────────
-- presupuestoSchema espera: version_presupuesto, estado, version (optimistic lock)

ALTER TABLE public.erp_presupuestos
  ADD COLUMN IF NOT EXISTS version_presupuesto   integer       DEFAULT 1,
  ADD COLUMN IF NOT EXISTS version               integer       DEFAULT 1;

-- ── 7. erp_no_conformidades ───────────────────────────────────────────────────
-- noConformidadSchema espera: codigo, categoria, detectado_por, plan_accion,
-- responsable_cierre, fecha_cierre

ALTER TABLE public.erp_no_conformidades
  ADD COLUMN IF NOT EXISTS codigo                text          DEFAULT '',
  ADD COLUMN IF NOT EXISTS categoria             text          DEFAULT 'otro'
    CHECK (categoria IN ('material','proceso','documentacion','seguridad','otro')),
  ADD COLUMN IF NOT EXISTS detectado_por         text          DEFAULT '',
  ADD COLUMN IF NOT EXISTS plan_accion           text          DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsable_cierre    text          DEFAULT '',
  ADD COLUMN IF NOT EXISTS fecha_cierre          date;

-- ── 8. erp_pruebas_laboratorio ────────────────────────────────────────────────
-- pruebaSchema espera: tipo (concreto|suelos|acero|asfalto|otro), fecha_muestra,
-- fecha_resultado, resultado, responsable

ALTER TABLE public.erp_pruebas_laboratorio
  ADD COLUMN IF NOT EXISTS tipo                  text          DEFAULT 'concreto'
    CHECK (tipo IN ('concreto','suelos','acero','asfalto','otro')),
  ADD COLUMN IF NOT EXISTS fecha_muestra         date          DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS fecha_resultado       date,
  ADD COLUMN IF NOT EXISTS resultado             text          DEFAULT 'pendiente'
    CHECK (resultado IN ('pendiente','pasa','no_pasa')),
  ADD COLUMN IF NOT EXISTS responsable           text          DEFAULT '';

-- ── 9. erp_liberaciones_partida ───────────────────────────────────────────────
-- liberacionSchema espera: renglon_id, renglon_nombre, fecha_solicitud,
-- fecha_liberacion, solicitante, supervisor, checklist_aprobado

ALTER TABLE public.erp_liberaciones_partida
  ADD COLUMN IF NOT EXISTS renglon_nombre        text          DEFAULT '',
  ADD COLUMN IF NOT EXISTS fecha_solicitud       date          DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS fecha_liberacion      date,
  ADD COLUMN IF NOT EXISTS checklist_aprobado    boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS supervisor            text          DEFAULT '';

-- ── 10. erp_cuadros ───────────────────────────────────────────────────────────
-- cuadroSchema espera: solicitud, fecha_solicitud, fecha_cierre, adjudicado_a

ALTER TABLE public.erp_cuadros
  ADD COLUMN IF NOT EXISTS solicitud             text          DEFAULT '',
  ADD COLUMN IF NOT EXISTS fecha_solicitud       date          DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS fecha_cierre          date,
  ADD COLUMN IF NOT EXISTS adjudicado_a          text,
  ADD COLUMN IF NOT EXISTS observaciones         text;

-- ── 11. erp_pagos_proveedor ───────────────────────────────────────────────────
-- pagoProveedorSchema espera: proveedor_nombre, fecha_emision, fecha_vencimiento,
-- factura_url, estado

ALTER TABLE public.erp_pagos_proveedor
  ADD COLUMN IF NOT EXISTS proveedor_nombre      text          DEFAULT '',
  ADD COLUMN IF NOT EXISTS fecha_emision         date          DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento     date,
  ADD COLUMN IF NOT EXISTS factura_url           text,
  ADD COLUMN IF NOT EXISTS estado                text          DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','pagado','vencido','cancelado'));

-- ── 12. erp_destajos ──────────────────────────────────────────────────────────
-- destajoSchema espera: eficiencia (computed pero guardada)

ALTER TABLE public.erp_destajos
  ADD COLUMN IF NOT EXISTS eficiencia            numeric(5,2)  DEFAULT 0;

-- ── 13. erp_submittals ────────────────────────────────────────────────────────
-- submittalSchema espera: categoria, proveedor, fecha_envio, descripcion

ALTER TABLE public.erp_submittals
  ADD COLUMN IF NOT EXISTS categoria             text          DEFAULT 'otro'
    CHECK (categoria IN ('material','equipo','especificacion','otro')),
  ADD COLUMN IF NOT EXISTS proveedor             text          DEFAULT '',
  ADD COLUMN IF NOT EXISTS fecha_envio           date          DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS descripcion           text          DEFAULT '';

-- ── 14. erp_planos ────────────────────────────────────────────────────────────
-- planoSchema espera: subido_por (text en app, uuid en DB — añadir alias text)

ALTER TABLE public.erp_planos
  ADD COLUMN IF NOT EXISTS subido_por_texto      text;

-- ── Actualizar defaults en filas existentes ───────────────────────────────────
UPDATE public.erp_incidentes
  SET lat = latitud, lng = longitud
  WHERE (lat IS NULL OR lng IS NULL)
    AND (latitud IS NOT NULL OR longitud IS NOT NULL);

UPDATE public.erp_empleados
  SET activo = COALESCE(activo, true)
  WHERE activo IS NULL;

-- ── Índices nuevos ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_proyecto
  ON public.erp_seguimiento(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_fecha
  ON public.erp_seguimiento(fecha DESC);

CREATE INDEX IF NOT EXISTS idx_erp_empleados_proyecto
  ON public.erp_empleados(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_empleados_activo
  ON public.erp_empleados(activo)
  WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_erp_incidentes_proyecto
  ON public.erp_incidentes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_incidentes_estado
  ON public.erp_incidentes(estado);

CREATE INDEX IF NOT EXISTS idx_erp_nc_proyecto
  ON public.erp_no_conformidades(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_nc_estado
  ON public.erp_no_conformidades(estado);
