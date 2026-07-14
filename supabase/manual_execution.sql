-- Script compacto para validación rápida y ejecución
-- Ejecutar cada bloque en Supabase Studio → SQL Editor

-- BLOQUE 1: Verificación actual (2 segundos)
SELECT 'ANTES' as fase,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos') as columnas_proyectos,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'erp_%') as total_tablas;

-- BLOQUE 2: ALTER TABLE erp_proyectos (agregar 28 columnas)
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS subtipo text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS tipo_obra text CHECK (tipo_obra IN ('nueva', 'remodelacion', 'ampliacion'));
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS cliente_telefono text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS cliente_email text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS ciudad text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS departamento text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS pais text DEFAULT 'Guatemala';
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS codigo_postal text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS area_construccion numeric(10,2);
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS num_pisos integer;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS plazo_semanas integer;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS ingeniero_residente uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS supervisor uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS arquitecto uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS numero_expediente text UNIQUE;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS numero_licencia text UNIQUE;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS fecha_inicio_real date;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS fecha_fin_estimada date;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS etapa text CHECK (etapa IN ('planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre'));
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS etapa_anterior text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS fecha_cambio_etapa timestamptz;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS margen_utilidad_objetivo numeric(5,2);
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS moneda text DEFAULT 'GTQ' CHECK (moneda IN ('GTQ', 'USD'));
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS motivo_pausa text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS pausado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS fecha_pausa timestamptz;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS fecha_reanudacion_estimada date;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- BLOQUE 3: CREATE TABLE erp_hitos
CREATE TABLE IF NOT EXISTS public.erp_hitos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  fecha date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('inicio', 'hito', 'entrega', 'cierre')),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'retrasado')),
  responsable uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  depende_de uuid[] DEFAULT ARRAY[]::uuid[],
  completado_en timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.erp_hitos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_hitos_proyecto ON public.erp_hitos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_hitos_fecha ON public.erp_hitos(fecha);

-- BLOQUE 4: CREATE TABLE erp_riesgos
CREATE TABLE IF NOT EXISTS public.erp_riesgos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  tipo text NOT NULL CHECK (tipo IN ('tecnico', 'financiero', 'cronograma', 'legal', 'ambiental', 'seguridad', 'otro')),
  probabilidad integer NOT NULL CHECK (probabilidad BETWEEN 1 AND 5),
  impacto integer NOT NULL CHECK (impacto BETWEEN 1 AND 5),
  nivel text GENERATED ALWAYS AS (
    CASE WHEN (probabilidad * impacto) >= 20 THEN 'critico'
         WHEN (probabilidad * impacto) >= 12 THEN 'alto'
         WHEN (probabilidad * impacto) >= 6 THEN 'medio'
         ELSE 'bajo' END
  ) STORED,
  plan_mitigacion text,
  plan_contingencia text,
  responsable uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_identificacion date NOT NULL DEFAULT CURRENT_DATE,
  estado text NOT NULL DEFAULT 'identificado' CHECK (estado IN ('identificado', 'en_mitigacion', 'mitigado', 'materializado')),
  costo_soporte numeric(12,2),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.erp_riesgos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_riesgos_proyecto ON public.erp_riesgos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_riesgos_nivel ON public.erp_riesgos(nivel);

-- BLOQUE 5: CREATE TABLE erp_cuentas_cobrar
CREATE TABLE IF NOT EXISTS public.erp_cuentas_cobrar (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  cliente text NOT NULL,
  concepto text NOT NULL,
  monto numeric(12,2) NOT NULL,
  saldo_pendiente numeric(12,2) NOT NULL,
  fecha_emision date NOT NULL,
  fecha_vencimiento date NOT NULL,
  fecha_cobro date,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'cobrado', 'vencido', 'incobrable')),
  notas text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.erp_cuentas_cobrar ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_proyecto ON public.erp_cuentas_cobrar(proyecto_id);

-- BLOQUE 6: CREATE TABLE erp_cuentas_pagar
CREATE TABLE IF NOT EXISTS public.erp_cuentas_pagar (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  proveedor text NOT NULL,
  concepto text NOT NULL,
  monto numeric(12,2) NOT NULL,
  saldo_pendiente numeric(12,2) NOT NULL,
  fecha_emision date NOT NULL,
  fecha_vencimiento date NOT NULL,
  fecha_pago date,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado', 'vencido')),
  factura_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.erp_cuentas_pagar ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cuentas_pagar_proyecto ON public.erp_cuentas_pagar(proyecto_id);

-- BLOQUE 7: CREATE TABLE erp_empleados_proyectos (M:M)
CREATE TABLE IF NOT EXISTS public.erp_empleados_proyectos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  empleado_id uuid NOT NULL REFERENCES public.erp_empleados(id) ON DELETE CASCADE,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  fecha_asignacion date NOT NULL DEFAULT CURRENT_DATE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(empleado_id, proyecto_id)
);
ALTER TABLE public.erp_empleados_proyectos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_empleados_proyectos_empleado ON public.erp_empleados_proyectos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_empleados_proyectos_proyecto ON public.erp_empleados_proyectos(proyecto_id);

-- BLOQUE 8: CREATE TABLE erp_materiales_proyectos (M:M)
CREATE TABLE IF NOT EXISTS public.erp_materiales_proyectos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  material_id uuid NOT NULL REFERENCES public.erp_materiales(id) ON DELETE CASCADE,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  cantidad_presupuestada numeric(10,2),
  costo_presupuestado numeric(12,2),
  ultima_actualizacion_presupuesto timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(material_id, proyecto_id)
);
ALTER TABLE public.erp_materiales_proyectos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_materiales_proyectos_material ON public.erp_materiales_proyectos(material_id);
CREATE INDEX IF NOT EXISTS idx_materiales_proyectos_proyecto ON public.erp_materiales_proyectos(proyecto_id);

-- BLOQUE 9: Agregar FK a erp_renglones
ALTER TABLE public.erp_renglones ADD COLUMN IF NOT EXISTS presupuesto_id uuid REFERENCES public.erp_presupuestos(id) ON DELETE CASCADE;
ALTER TABLE public.erp_renglones ADD COLUMN IF NOT EXISTS avance_fisico numeric(5,2) DEFAULT 0;
ALTER TABLE public.erp_renglones ADD COLUMN IF NOT EXISTS avance_financiero numeric(5,2) DEFAULT 0;
ALTER TABLE public.erp_renglones ADD COLUMN IF NOT EXISTS predecesores uuid[] DEFAULT ARRAY[]::uuid[];

-- BLOQUE 10: Corregir erp_ordenes_compra
ALTER TABLE public.erp_ordenes_compra ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES public.erp_proyectos(id) ON DELETE SET NULL;
ALTER TABLE public.erp_ordenes_compra ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES public.erp_proveedores(id) ON DELETE SET NULL;

-- BLOQUE 11: Agregar campos financieros a erp_movimientos
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS proveedor text;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS proveedor_nit text;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS factura text;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS forma_pago text CHECK (forma_pago IN ('efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro'));
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS referencia_bancaria text;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS retencion_isr numeric(10,2) DEFAULT 0;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS retencion_iva numeric(10,2) DEFAULT 0;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS notas text;

-- BLOQUE 12: Verificación final
SELECT 'DESPUÉS' as fase,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_proyectos') as columnas_proyectos,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'erp_%') as total_tablas,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('erp_hitos', 'erp_riesgos', 'erp_cuentas_cobrar', 'erp_cuentas_pagar')) as tablas_criticas_nuevas;
