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

CREATE TABLE IF NOT EXISTS erp_error_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mensaje text NOT NULL,
  tipo text NOT NULL,
  severidad text DEFAULT 'media',
  componente text,
  funcion text,
  stack text,
  contexto jsonb DEFAULT '{}'::jsonb,
  resuelto boolean DEFAULT false,
  notas_resolucion text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 6) RLS para nuevas tablas
ALTER TABLE erp_destajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_recepciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_pagos_proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_centros_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_error_logs ENABLE ROW LEVEL SECURITY;

-- 7) Realtime para nuevas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_destajos;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_recepciones;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_pagos_proveedor;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_centros_costo;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_error_logs;
