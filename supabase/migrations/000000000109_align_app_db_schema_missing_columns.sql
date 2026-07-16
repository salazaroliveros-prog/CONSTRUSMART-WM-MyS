-- ============================================================
-- Migration: align_app_db_schema_missing_columns
-- Objetivo: cerrar brechas DB vs Zod schemas / TABLE_MAP
-- ============================================================

-- 1) proyectos: latitud/longitud opcionales (ademas de lat/lng)
ALTER TABLE public.erp_proyectos
  ADD COLUMN IF NOT EXISTS latitud  double precision,
  ADD COLUMN IF NOT EXISTS longitud double precision;

-- 2) materiales: proyecto_id directo y campos presupuesto/material-proyecto
ALTER TABLE public.erp_materiales
  ADD COLUMN IF NOT EXISTS proyecto_id uuid;

-- 3) proveedores: datos de contacto/categoria
ALTER TABLE public.erp_proveedores
  ADD COLUMN IF NOT EXISTS telefono   text,
  ADD COLUMN IF NOT EXISTS email      text,
  ADD COLUMN IF NOT EXISTS categoria  text DEFAULT 'materiales';

-- 4) vales_salida: renglon_id
ALTER TABLE public.erp_vales_salida
  ADD COLUMN IF NOT EXISTS renglon_id uuid;

-- 5) movimientos: monto alias a costo_total (para alinear con Zod)
ALTER TABLE public.erp_movimientos
  ADD COLUMN IF NOT EXISTS monto numeric DEFAULT 0;

-- 6) cuentas_cobrar: campos de gestion de cobro
ALTER TABLE public.erp_cuentas_cobrar
  ADD COLUMN IF NOT EXISTS concepto         text DEFAULT '',
  ADD COLUMN IF NOT EXISTS saldo_pendiente  numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fecha_emision    date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS fecha_cobro      date,
  ADD COLUMN IF NOT EXISTS notas            text;

-- 7) cuentas_pagar: datos de pago y proveedor (text para compatibilidad)
ALTER TABLE public.erp_cuentas_pagar
  ADD COLUMN IF NOT EXISTS proveedor        text,
  ADD COLUMN IF NOT EXISTS concepto         text DEFAULT '',
  ADD COLUMN IF NOT EXISTS saldo_pendiente  numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fecha_emision    date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS fecha_pago       date,
  ADD COLUMN IF NOT EXISTS factura_url      text;

-- 8) notificaciones: campos de contexto/usuario
ALTER TABLE public.erp_notificaciones
  ADD COLUMN IF NOT EXISTS referencia_tipo text,
  ADD COLUMN IF NOT EXISTS fecha_lectura   timestamp with time zone,
  ADD COLUMN IF NOT EXISTS usuario_id      uuid,
  ADD COLUMN IF NOT EXISTS prioridad       text DEFAULT 'normal';

-- 9) eventos_calendario: participantes
ALTER TABLE public.erp_eventos_calendario
  ADD COLUMN IF NOT EXISTS participantes text[] DEFAULT '{}';

-- 10) bitacora: campos clima/avanzados y created_by
ALTER TABLE public.erp_bitacora
  ADD COLUMN IF NOT EXISTS personal_presente      integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tareas_realizadas      text DEFAULT '',
  ADD COLUMN IF NOT EXISTS condicion_climatica    text,
  ADD COLUMN IF NOT EXISTS clima_capturado        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS weather_data_captured  boolean,
  ADD COLUMN IF NOT EXISTS weather_data_timestamp timestamp with time zone,
  ADD COLUMN IF NOT EXISTS created_by             uuid;

-- 11) publicaciones_muro: campos de contenido enriquecido
ALTER TABLE public.erp_publicaciones_muro
  ADD COLUMN IF NOT EXISTS autor_avatar text,
  ADD COLUMN IF NOT EXISTS documento    jsonb;

-- 12) incidentes: ampliar a esquema RRHH Zod
ALTER TABLE public.erp_incidentes
  ADD COLUMN IF NOT EXISTS tipo             text DEFAULT 'acto_inseguro',
  ADD COLUMN IF NOT EXISTS hora             text DEFAULT '00:00',
  ADD COLUMN IF NOT EXISTS afectados        text DEFAULT '',
  ADD COLUMN IF NOT EXISTS testigos         text,
  ADD COLUMN IF NOT EXISTS acciones_inmediatas text,
  ADD COLUMN IF NOT EXISTS reportado_por    text DEFAULT '',
  ADD COLUMN IF NOT EXISTS fotos            text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by       uuid;

-- 13) plantillas_proyectos: campos de negocio/cliente
ALTER TABLE public.erp_plantillas_proyectos
  ADD COLUMN IF NOT EXISTS proyecto_origen_id uuid,
  ADD COLUMN IF NOT EXISTS cliente_id         text,
  ADD COLUMN IF NOT EXISTS cliente_nombre    text;

-- 14) cotizaciones_negocio: proyecto_id para trazabilidad
ALTER TABLE public.erp_cotizaciones_negocio
  ADD COLUMN IF NOT EXISTS proyecto_id uuid;

-- 15) renglones: campos de avance/planificacion adicionales
ALTER TABLE public.erp_renglones
  ADD COLUMN IF NOT EXISTS avance_fisico_plan numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avance_financiero_plan numeric DEFAULT 0;

-- ============================================================
-- Ajustes de datos / defaults
-- ============================================================

-- Asegurar defaults de moneda/pais en proyectos donde sea NULL
UPDATE public.erp_proyectos
   SET pais = COALESCE(pais, 'Guatemala'),
       moneda = COALESCE(moneda, 'GTQ')
 WHERE pais IS NULL OR moneda IS NULL;

-- Asegurar categoria por defecto en proveedores
UPDATE public.erp_proveedores
   SET categoria = COALESCE(categoria, 'materiales')
 WHERE categoria IS NULL;

-- Asegurar prioridad por defecto en notificaciones
UPDATE public.erp_notificaciones
   SET prioridad = COALESCE(prioridad, 'normal')
 WHERE prioridad IS NULL;
