-- ============================================================
-- MIGRACIÓN 130: Alineación final DB ↔ App
-- Objetivo: Crear tablas faltantes del TABLE_MAP y agregar
--           columnas faltantes en tablas existentes según
--           schemas Zod canónicos.
-- Estrategia: 100% idempotente — IF NOT EXISTS en todo.
-- Tablas nuevas: erp_anticipos, erp_rendimientos_campo,
--   erp_bodega, erp_documentos, erp_permisos,
--   erp_checklist, erp_configuracion
-- ============================================================

-- ============================================================
-- SECCIÓN 1: erp_anticipos
-- Schema: anticipoSchema (id, proyectoId, proveedorId, monto,
--   motivo, fechaSolicitud, fechaAprobacion, estado,
--   createdBy, updatedBy, createdAt, updatedAt)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_anticipos (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id   uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  proveedor_id  uuid REFERENCES public.erp_proveedores(id) ON DELETE SET NULL,
  monto         numeric(14,2) NOT NULL DEFAULT 0,
  motivo        text NOT NULL DEFAULT '',
  fecha_solicitud text NOT NULL DEFAULT '',
  fecha_aprobacion text,
  estado        text NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','aprobado','pagado','rechazado')),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECCIÓN 2: erp_rendimientos_campo
-- Schema: rendimientoCampoSchema (id, proyectoId, cuadrilla,
--   actividad, unidad, cantidad, horasHombre, fecha)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_rendimientos_campo (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id   uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  cuadrilla     text NOT NULL DEFAULT '',
  actividad     text NOT NULL DEFAULT '',
  unidad        text NOT NULL DEFAULT '',
  cantidad      numeric(14,4) NOT NULL DEFAULT 0,
  horas_hombre  numeric(10,2) NOT NULL DEFAULT 0,
  fecha         text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECCIÓN 3: erp_bodega
-- Schema: bodegaSchema (id, proyectoId, materialId, codigo,
--   nombre, categoria, unidad, stock, stockMinimo, ubicacion,
--   createdBy, updatedBy, createdAt, updatedAt)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_bodega (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id   uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  material_id   uuid REFERENCES public.erp_materiales(id) ON DELETE SET NULL,
  codigo        text NOT NULL DEFAULT '',
  nombre        text NOT NULL DEFAULT '',
  categoria     text,
  unidad        text NOT NULL DEFAULT '',
  stock         numeric(14,4) NOT NULL DEFAULT 0,
  stock_minimo  numeric(14,4) NOT NULL DEFAULT 0,
  ubicacion     text,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECCIÓN 4: erp_documentos
-- Schema: documentoSchema (id, proyectoId, tipo, nombre, url,
--   tamanoBytes, subidoPor, createdAt, updatedAt)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_documentos (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id   uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  tipo          text NOT NULL DEFAULT '',
  nombre        text NOT NULL DEFAULT '',
  url           text NOT NULL DEFAULT '',
  tamano_bytes  bigint,
  subido_por    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECCIÓN 5: erp_permisos
-- Schema: permisoSchema (id, usuarioId, proyectoId, rol,
--   permisos jsonb, createdAt, updatedAt)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_permisos (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id   uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  rol           text,
  permisos      jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, proyecto_id)
);

-- ============================================================
-- SECCIÓN 6: erp_checklist
-- Schema: checklistSchema (id, proyectoId, nombre,
--   items jsonb[], estado, createdBy, updatedBy,
--   createdAt, updatedAt)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_checklist (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id   uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre        text NOT NULL DEFAULT '',
  items         jsonb NOT NULL DEFAULT '[]'::jsonb,
  estado        text NOT NULL DEFAULT 'borrador'
                  CHECK (estado IN ('borrador','en_progreso','completado','cancelado')),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECCIÓN 7: erp_configuracion
-- Schema: configuracionSchema (id, proyectoId, nombre, valor,
--   tipo, descripcion, updatedBy, updatedAt)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_configuracion (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id   uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre        text NOT NULL DEFAULT '',
  valor         text NOT NULL DEFAULT '',
  tipo          text NOT NULL DEFAULT 'texto'
                  CHECK (tipo IN ('texto','numero','booleano','json')),
  descripcion   text,
  updated_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proyecto_id, nombre)
);


-- ============================================================
-- SECCIÓN 8: Columnas faltantes — erp_activos
-- activoSchema espera: marca, modelo, numero_serie,
--   ubicacion, fecha_asignacion, asignado_a
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_activos') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_activos'
                   AND column_name='marca') THEN
      ALTER TABLE public.erp_activos ADD COLUMN marca text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_activos'
                   AND column_name='modelo') THEN
      ALTER TABLE public.erp_activos ADD COLUMN modelo text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_activos'
                   AND column_name='numero_serie') THEN
      ALTER TABLE public.erp_activos ADD COLUMN numero_serie text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_activos'
                   AND column_name='ubicacion') THEN
      ALTER TABLE public.erp_activos ADD COLUMN ubicacion text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_activos'
                   AND column_name='fecha_asignacion') THEN
      ALTER TABLE public.erp_activos ADD COLUMN fecha_asignacion text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_activos'
                   AND column_name='asignado_a') THEN
      ALTER TABLE public.erp_activos ADD COLUMN asignado_a text DEFAULT '';
    END IF;

  END IF;
END $$;

-- ============================================================
-- SECCIÓN 9: Columnas faltantes — erp_empleados
-- empleadoSchema espera: dias_trabajados, fecha_asignacion
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_empleados') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_empleados'
                   AND column_name='dias_trabajados') THEN
      ALTER TABLE public.erp_empleados ADD COLUMN dias_trabajados numeric DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_empleados'
                   AND column_name='fecha_asignacion') THEN
      ALTER TABLE public.erp_empleados ADD COLUMN fecha_asignacion text DEFAULT '';
    END IF;

  END IF;
END $$;

-- ============================================================
-- SECCIÓN 10: Columnas faltantes — erp_materiales
-- materialSchema espera: proyecto_ids jsonb, cantidad_presupuestada,
--   costo_presupuestado, version, ultima_actualizacion_presupuesto
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_materiales') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_materiales'
                   AND column_name='proyecto_ids') THEN
      ALTER TABLE public.erp_materiales ADD COLUMN proyecto_ids jsonb DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_materiales'
                   AND column_name='cantidad_presupuestada') THEN
      ALTER TABLE public.erp_materiales ADD COLUMN cantidad_presupuestada numeric DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_materiales'
                   AND column_name='costo_presupuestado') THEN
      ALTER TABLE public.erp_materiales ADD COLUMN costo_presupuestado numeric DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_materiales'
                   AND column_name='version') THEN
      ALTER TABLE public.erp_materiales ADD COLUMN version integer DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_materiales'
                   AND column_name='ultima_actualizacion_presupuesto') THEN
      ALTER TABLE public.erp_materiales ADD COLUMN ultima_actualizacion_presupuesto text DEFAULT NULL;
    END IF;

  END IF;
END $$;

-- ============================================================
-- SECCIÓN 11: Columnas faltantes — erp_ordenes_compra
-- ordenSchema espera: proveedor_id, total, items jsonb,
--   stock_actualizado, version
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_ordenes_compra') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_ordenes_compra'
                   AND column_name='total') THEN
      ALTER TABLE public.erp_ordenes_compra ADD COLUMN total numeric(14,2) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_ordenes_compra'
                   AND column_name='items') THEN
      ALTER TABLE public.erp_ordenes_compra ADD COLUMN items jsonb DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_ordenes_compra'
                   AND column_name='stock_actualizado') THEN
      ALTER TABLE public.erp_ordenes_compra ADD COLUMN stock_actualizado boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_ordenes_compra'
                   AND column_name='version') THEN
      ALTER TABLE public.erp_ordenes_compra ADD COLUMN version integer DEFAULT 1;
    END IF;

  END IF;
END $$;

-- ============================================================
-- SECCIÓN 12: Columnas faltantes — erp_movimientos
-- movimientoSchema espera: costo_total, costo_unitario,
--   cantidad, unidad, proveedor_nit, factura, forma_pago,
--   referencia_bancaria, retencion_isr, retencion_iva, notas
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_movimientos') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='costo_total') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN costo_total numeric(14,2) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='costo_unitario') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN costo_unitario numeric(14,4) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='cantidad') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN cantidad numeric(14,4) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='unidad') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN unidad text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='proveedor_nit') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN proveedor_nit text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='factura') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN factura text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='forma_pago') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN forma_pago text DEFAULT NULL
        CHECK (forma_pago IS NULL OR forma_pago IN ('efectivo','transferencia','cheque','tarjeta','otro'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='referencia_bancaria') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN referencia_bancaria text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='retencion_isr') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN retencion_isr numeric(14,2) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='retencion_iva') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN retencion_iva numeric(14,2) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_movimientos'
                   AND column_name='notas') THEN
      ALTER TABLE public.erp_movimientos ADD COLUMN notas text DEFAULT NULL;
    END IF;

  END IF;
END $$;


-- ============================================================
-- SECCIÓN 13: Columnas faltantes — erp_cuentas_cobrar
-- cuentaCobrarSchema espera: saldo_pendiente, fecha_cobro
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_cuentas_cobrar') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_cuentas_cobrar'
                   AND column_name='saldo_pendiente') THEN
      ALTER TABLE public.erp_cuentas_cobrar ADD COLUMN saldo_pendiente numeric(14,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_cuentas_cobrar'
                   AND column_name='fecha_cobro') THEN
      ALTER TABLE public.erp_cuentas_cobrar ADD COLUMN fecha_cobro text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_cuentas_cobrar'
                   AND column_name='notas') THEN
      ALTER TABLE public.erp_cuentas_cobrar ADD COLUMN notas text DEFAULT NULL;
    END IF;

  END IF;
END $$;

-- ============================================================
-- SECCIÓN 14: Columnas faltantes — erp_cuentas_pagar
-- cuentaPagarSchema espera: saldo_pendiente, fecha_pago,
--   factura_url
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_cuentas_pagar') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_cuentas_pagar'
                   AND column_name='saldo_pendiente') THEN
      ALTER TABLE public.erp_cuentas_pagar ADD COLUMN saldo_pendiente numeric(14,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_cuentas_pagar'
                   AND column_name='fecha_pago') THEN
      ALTER TABLE public.erp_cuentas_pagar ADD COLUMN fecha_pago text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_cuentas_pagar'
                   AND column_name='factura_url') THEN
      ALTER TABLE public.erp_cuentas_pagar ADD COLUMN factura_url text DEFAULT NULL;
    END IF;

  END IF;
END $$;

-- ============================================================
-- SECCIÓN 15: Columnas faltantes — erp_hitos
-- hitoSchema espera: tipo, responsable, depende_de jsonb,
--   completado_en
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_hitos') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_hitos'
                   AND column_name='tipo') THEN
      ALTER TABLE public.erp_hitos ADD COLUMN tipo text DEFAULT 'hito'
        CHECK (tipo IN ('inicio','hito','entrega','cierre'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_hitos'
                   AND column_name='responsable') THEN
      ALTER TABLE public.erp_hitos ADD COLUMN responsable text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_hitos'
                   AND column_name='depende_de') THEN
      ALTER TABLE public.erp_hitos ADD COLUMN depende_de jsonb DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_hitos'
                   AND column_name='completado_en') THEN
      ALTER TABLE public.erp_hitos ADD COLUMN completado_en text DEFAULT NULL;
    END IF;

  END IF;
END $$;

-- ============================================================
-- SECCIÓN 16: Columnas faltantes — erp_riesgos
-- riesgoSchema espera: plan_contingencia, costo_soporte,
--   fecha_identificacion
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_riesgos') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_riesgos'
                   AND column_name='plan_contingencia') THEN
      ALTER TABLE public.erp_riesgos ADD COLUMN plan_contingencia text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_riesgos'
                   AND column_name='costo_soporte') THEN
      ALTER TABLE public.erp_riesgos ADD COLUMN costo_soporte numeric(14,2) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_riesgos'
                   AND column_name='fecha_identificacion') THEN
      ALTER TABLE public.erp_riesgos ADD COLUMN fecha_identificacion text
        DEFAULT (current_date::text);
    END IF;

  END IF;
END $$;

-- ============================================================
-- SECCIÓN 17: Columnas faltantes — erp_ventas_paquetes
-- ventaPaqueteSchema espera: precio_contrato, plan_pago
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_ventas_paquetes') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_ventas_paquetes'
                   AND column_name='precio_contrato') THEN
      ALTER TABLE public.erp_ventas_paquetes ADD COLUMN precio_contrato numeric(14,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_ventas_paquetes'
                   AND column_name='plan_pago') THEN
      ALTER TABLE public.erp_ventas_paquetes ADD COLUMN plan_pago text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_ventas_paquetes'
                   AND column_name='notas') THEN
      ALTER TABLE public.erp_ventas_paquetes ADD COLUMN notas text DEFAULT NULL;
    END IF;

  END IF;
END $$;

-- ============================================================
-- SECCIÓN 18: Columnas faltantes — erp_vales_salida
-- valeSalidaSchema espera: renglon_id, observaciones, solicitante
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_vales_salida') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_vales_salida'
                   AND column_name='renglon_id') THEN
      ALTER TABLE public.erp_vales_salida ADD COLUMN renglon_id text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_vales_salida'
                   AND column_name='solicitante') THEN
      ALTER TABLE public.erp_vales_salida ADD COLUMN solicitante text DEFAULT '';
    END IF;

  END IF;
END $$;

-- ============================================================
-- SECCIÓN 19: Columnas faltantes — erp_incidentes
-- incidenteSchema espera: hora, afectados, testigos,
--   acciones_inmediatas, reportado_por, fotos jsonb
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='erp_incidentes') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_incidentes'
                   AND column_name='hora') THEN
      ALTER TABLE public.erp_incidentes ADD COLUMN hora text DEFAULT '00:00';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_incidentes'
                   AND column_name='afectados') THEN
      ALTER TABLE public.erp_incidentes ADD COLUMN afectados text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_incidentes'
                   AND column_name='testigos') THEN
      ALTER TABLE public.erp_incidentes ADD COLUMN testigos text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_incidentes'
                   AND column_name='acciones_inmediatas') THEN
      ALTER TABLE public.erp_incidentes ADD COLUMN acciones_inmediatas text DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_incidentes'
                   AND column_name='reportado_por') THEN
      ALTER TABLE public.erp_incidentes ADD COLUMN reportado_por text DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='erp_incidentes'
                   AND column_name='fotos') THEN
      ALTER TABLE public.erp_incidentes ADD COLUMN fotos jsonb DEFAULT '[]'::jsonb;
    END IF;

  END IF;
END $$;


-- ============================================================
-- SECCIÓN 20: RLS en tablas nuevas
-- ============================================================

ALTER TABLE public.erp_anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_rendimientos_campo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_bodega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_configuracion ENABLE ROW LEVEL SECURITY;

-- erp_anticipos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_anticipos' AND policyname='anticipos_auth_select') THEN
    CREATE POLICY anticipos_auth_select ON public.erp_anticipos
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_anticipos' AND policyname='anticipos_auth_insert') THEN
    CREATE POLICY anticipos_auth_insert ON public.erp_anticipos
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_anticipos' AND policyname='anticipos_auth_update') THEN
    CREATE POLICY anticipos_auth_update ON public.erp_anticipos
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_anticipos' AND policyname='anticipos_auth_delete') THEN
    CREATE POLICY anticipos_auth_delete ON public.erp_anticipos
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- erp_rendimientos_campo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_rendimientos_campo' AND policyname='rendimientos_campo_auth_select') THEN
    CREATE POLICY rendimientos_campo_auth_select ON public.erp_rendimientos_campo
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_rendimientos_campo' AND policyname='rendimientos_campo_auth_insert') THEN
    CREATE POLICY rendimientos_campo_auth_insert ON public.erp_rendimientos_campo
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_rendimientos_campo' AND policyname='rendimientos_campo_auth_update') THEN
    CREATE POLICY rendimientos_campo_auth_update ON public.erp_rendimientos_campo
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_rendimientos_campo' AND policyname='rendimientos_campo_auth_delete') THEN
    CREATE POLICY rendimientos_campo_auth_delete ON public.erp_rendimientos_campo
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- erp_bodega
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_bodega' AND policyname='bodega_auth_select') THEN
    CREATE POLICY bodega_auth_select ON public.erp_bodega
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_bodega' AND policyname='bodega_auth_insert') THEN
    CREATE POLICY bodega_auth_insert ON public.erp_bodega
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_bodega' AND policyname='bodega_auth_update') THEN
    CREATE POLICY bodega_auth_update ON public.erp_bodega
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_bodega' AND policyname='bodega_auth_delete') THEN
    CREATE POLICY bodega_auth_delete ON public.erp_bodega
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- erp_documentos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_documentos' AND policyname='documentos_auth_select') THEN
    CREATE POLICY documentos_auth_select ON public.erp_documentos
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_documentos' AND policyname='documentos_auth_insert') THEN
    CREATE POLICY documentos_auth_insert ON public.erp_documentos
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_documentos' AND policyname='documentos_auth_update') THEN
    CREATE POLICY documentos_auth_update ON public.erp_documentos
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_documentos' AND policyname='documentos_auth_delete') THEN
    CREATE POLICY documentos_auth_delete ON public.erp_documentos
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- erp_permisos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_permisos' AND policyname='permisos_auth_select') THEN
    CREATE POLICY permisos_auth_select ON public.erp_permisos
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_permisos' AND policyname='permisos_auth_insert') THEN
    CREATE POLICY permisos_auth_insert ON public.erp_permisos
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_permisos' AND policyname='permisos_auth_update') THEN
    CREATE POLICY permisos_auth_update ON public.erp_permisos
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_permisos' AND policyname='permisos_auth_delete') THEN
    CREATE POLICY permisos_auth_delete ON public.erp_permisos
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- erp_checklist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_checklist' AND policyname='checklist_auth_select') THEN
    CREATE POLICY checklist_auth_select ON public.erp_checklist
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_checklist' AND policyname='checklist_auth_insert') THEN
    CREATE POLICY checklist_auth_insert ON public.erp_checklist
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_checklist' AND policyname='checklist_auth_update') THEN
    CREATE POLICY checklist_auth_update ON public.erp_checklist
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_checklist' AND policyname='checklist_auth_delete') THEN
    CREATE POLICY checklist_auth_delete ON public.erp_checklist
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- erp_configuracion
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_configuracion' AND policyname='configuracion_auth_select') THEN
    CREATE POLICY configuracion_auth_select ON public.erp_configuracion
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_configuracion' AND policyname='configuracion_auth_insert') THEN
    CREATE POLICY configuracion_auth_insert ON public.erp_configuracion
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_configuracion' AND policyname='configuracion_auth_update') THEN
    CREATE POLICY configuracion_auth_update ON public.erp_configuracion
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_configuracion' AND policyname='configuracion_auth_delete') THEN
    CREATE POLICY configuracion_auth_delete ON public.erp_configuracion
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;


-- ============================================================
-- SECCIÓN 21: Índices en tablas nuevas
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_erp_anticipos_proyecto
  ON public.erp_anticipos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_anticipos_estado
  ON public.erp_anticipos(estado);
CREATE INDEX IF NOT EXISTS idx_erp_anticipos_created_at
  ON public.erp_anticipos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_erp_rendimientos_campo_proyecto
  ON public.erp_rendimientos_campo(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_rendimientos_campo_fecha
  ON public.erp_rendimientos_campo(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_erp_rendimientos_campo_cuadrilla
  ON public.erp_rendimientos_campo(cuadrilla);

CREATE INDEX IF NOT EXISTS idx_erp_bodega_proyecto
  ON public.erp_bodega(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_bodega_codigo
  ON public.erp_bodega(codigo);
CREATE INDEX IF NOT EXISTS idx_erp_bodega_material
  ON public.erp_bodega(material_id) WHERE material_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_erp_documentos_proyecto
  ON public.erp_documentos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_documentos_tipo
  ON public.erp_documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_erp_documentos_created_at
  ON public.erp_documentos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_erp_permisos_usuario
  ON public.erp_permisos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_erp_permisos_proyecto
  ON public.erp_permisos(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_erp_checklist_proyecto
  ON public.erp_checklist(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_checklist_estado
  ON public.erp_checklist(estado);

CREATE INDEX IF NOT EXISTS idx_erp_configuracion_proyecto
  ON public.erp_configuracion(proyecto_id);

-- ============================================================
-- SECCIÓN 22: Trigger updated_at en tablas nuevas
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger LANGUAGE plpgsql AS $fn$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $fn$;
  END IF;
END $$;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'erp_anticipos','erp_rendimientos_campo','erp_bodega',
    'erp_documentos','erp_checklist','erp_configuracion'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- SECCIÓN 23: Realtime — tablas nuevas
-- ============================================================

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'erp_anticipos','erp_rendimientos_campo','erp_bodega',
    'erp_documentos','erp_permisos','erp_checklist','erp_configuracion'
  ] LOOP
    BEGIN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        tbl
      );
    EXCEPTION WHEN duplicate_object OR SQLSTATE '42710' THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- SECCIÓN 24: GRANT service_role en tablas nuevas
-- ============================================================

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'erp_anticipos','erp_rendimientos_campo','erp_bodega',
    'erp_documentos','erp_permisos','erp_checklist','erp_configuracion'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', tbl);
  END LOOP;
END $$;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

DO $$
DECLARE
  tbl text;
  cnt integer := 0;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'erp_anticipos','erp_rendimientos_campo','erp_bodega',
    'erp_documentos','erp_permisos','erp_checklist','erp_configuracion'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = tbl) THEN
      cnt := cnt + 1;
      RAISE NOTICE 'OK: tabla % existe', tbl;
    ELSE
      RAISE WARNING 'FALTA: tabla % no fue creada', tbl;
    END IF;
  END LOOP;
  RAISE NOTICE 'Migración 130 completada: %/7 tablas nuevas verificadas', cnt;
END $$;
