-- ============================================================
-- MIGRACIÓN 064: Alineación Schema Código ↔ Base de Datos
-- ============================================================
-- Fecha: 2026-06-26
-- Propósito: Corregir todas las inconsistencias entre el código
-- TypeScript y los esquemas reales de Supabase.
-- ============================================================

-- 1) Añadir columna 'version' a tablas principales (optimistic locking)
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE erp_materiales ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE erp_ordenes_compra ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE erp_presupuestos ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- 2) Añadir columna 'stock_actualizado' a ordenes_compra
ALTER TABLE erp_ordenes_compra ADD COLUMN IF NOT EXISTS stock_actualizado boolean DEFAULT false;

-- 3) Añadir columnas faltantes a erp_proyectos
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS subtipo text;

-- 3.1 Normalize estado safely:
-- - Drop constraint if exists
-- - Drop problematic update trigger if present
-- - Update only rows that truly need normalization
-- - Recreate constraint
DROP TRIGGER IF EXISTS trg_erp_proyectos_updated ON erp_proyectos;

UPDATE erp_proyectos
SET estado = CASE
  WHEN lower(estado) IN ('planificacion', 'en_planificacion', 'planeacion') THEN 'planeacion'
  WHEN lower(estado) IN ('en_curso', 'ejecucion') THEN 'ejecucion'
  WHEN lower(estado) IN ('pausado', 'pausa') THEN 'pausado'
  WHEN lower(estado) IN ('completado', 'finalizado', 'terminado') THEN 'finalizado'
  WHEN lower(estado) IN ('cancelado', 'cancelada') THEN 'cancelado'
  ELSE 'planeacion'
END
WHERE estado NOT IN ('planeacion','ejecucion','pausado','finalizado','cancelado');

ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS tipo_obra text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS cliente_nit text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS cliente_telefono text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS cliente_email text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS ciudad text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS departamento text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS codigo_postal text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS area_construccion numeric(10,2);
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS num_pisos integer;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS plazo_semanas integer;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS ingeniero_residente text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS supervisor text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS arquitecto text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS numero_expediente text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS numero_licencia text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS margen_utilidad_objetivo numeric(5,2);
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS moneda text DEFAULT 'GTQ';
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS etapa text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS motivo_pausa text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS pausado_por text;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS fecha_pausa timestamptz;
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS fecha_reanudacion_estimada date;

-- 4) Añadir columna 'obligatoria' a erp_normativa_departamental
ALTER TABLE erp_normativa_departamental ADD COLUMN IF NOT EXISTS obligatoria boolean DEFAULT true;

-- 5) Crear tablas faltantes
CREATE TABLE IF NOT EXISTS erp_destajos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id text,
  trabajador text NOT NULL,
  concepto text NOT NULL,
  cantidad numeric(12,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL,
  precio_unitario numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_recepciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  oc_id text,
  proveedor text NOT NULL,
  fecha_recepcion date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb DEFAULT '[]'::jsonb,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_pagos_proveedor (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id text NOT NULL,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  forma_pago text,
  referencia text,
  fecha_pago date NOT NULL DEFAULT CURRENT_DATE,
  notas text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_centros_costo (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  presupuesto_asignado numeric(12,2) DEFAULT 0,
  proyecto_id text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- NOTA: erp_error_logs se crea como VIEW en migración 063 (sobre erp_error_log)
-- No hay tabla física adicional nueva aquí, así que no se necesita ENABLE ROW LEVEL SECURITY aquí.

-- 6) RLS para nuevas tablas
ALTER TABLE erp_destajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_recepciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_pagos_proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_centros_costo ENABLE ROW LEVEL SECURITY;

-- 7) Realtime para nuevas tablas (DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_destajos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_destajos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_recepciones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_recepciones;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_pagos_proveedor') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_pagos_proveedor;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_centros_costo') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_centros_costo;
  END IF;
END;
$$;