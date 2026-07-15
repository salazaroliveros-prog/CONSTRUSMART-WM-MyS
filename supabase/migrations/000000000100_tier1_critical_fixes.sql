-- ============================================================
-- MIGRACIÓN 0100: TIER 1 - FIXES CRÍTICOS
-- Fecha: 2026-12-27
-- Estado: Idempotente (no falla si ya existen)
-- ============================================================

-- ============================================================
-- PASO 1: AGREGAR 28 COLUMNAS FALTANTES A erp_proyectos
-- ============================================================

ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS subtipo text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS tipo_obra text 
  CHECK (tipo_obra IN ('nueva', 'remodelacion', 'ampliacion'));

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

ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS etapa text 
  CHECK (etapa IN ('planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre'));
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS etapa_anterior text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS fecha_cambio_etapa timestamptz;

ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS margen_utilidad_objetivo numeric(5,2);
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS moneda text DEFAULT 'GTQ' 
  CHECK (moneda IN ('GTQ', 'USD'));

ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS motivo_pausa text;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS pausado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS fecha_pausa timestamptz;
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS fecha_reanudacion_estimada date;

ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- ============================================================
-- PASO 2: CREAR TABLA erp_hitos (CRÍTICA - Gantt/Cronograma)
-- ============================================================

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

DROP POLICY IF EXISTS "erp_hitos_select" ON public.erp_hitos;
CREATE POLICY "erp_hitos_select" ON public.erp_hitos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_hitos_insert" ON public.erp_hitos;
CREATE POLICY "erp_hitos_insert" ON public.erp_hitos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_hitos_update" ON public.erp_hitos;
CREATE POLICY "erp_hitos_update" ON public.erp_hitos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_hitos_proyecto ON public.erp_hitos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_hitos_fecha ON public.erp_hitos(fecha);
CREATE INDEX IF NOT EXISTS idx_hitos_estado ON public.erp_hitos(estado);

DROP TRIGGER IF EXISTS trg_erp_hitos_updated ON public.erp_hitos;
CREATE TRIGGER trg_erp_hitos_updated
  BEFORE UPDATE ON public.erp_hitos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 3: CREAR TABLA erp_riesgos (CRÍTICA - Gestión Riesgos)
-- ============================================================

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

DROP POLICY IF EXISTS "erp_riesgos_select" ON public.erp_riesgos;
CREATE POLICY "erp_riesgos_select" ON public.erp_riesgos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_riesgos_insert" ON public.erp_riesgos;
CREATE POLICY "erp_riesgos_insert" ON public.erp_riesgos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_riesgos_update" ON public.erp_riesgos;
CREATE POLICY "erp_riesgos_update" ON public.erp_riesgos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_riesgos_proyecto ON public.erp_riesgos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_riesgos_nivel ON public.erp_riesgos(nivel);
CREATE INDEX IF NOT EXISTS idx_riesgos_estado ON public.erp_riesgos(estado);

DROP TRIGGER IF EXISTS trg_erp_riesgos_updated ON public.erp_riesgos;
CREATE TRIGGER trg_erp_riesgos_updated
  BEFORE UPDATE ON public.erp_riesgos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 4: CREAR TABLA erp_cuentas_cobrar (CRÍTICA - Financiero)
-- ============================================================

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

DROP POLICY IF EXISTS "erp_cuentas_cobrar_select" ON public.erp_cuentas_cobrar;
CREATE POLICY "erp_cuentas_cobrar_select" ON public.erp_cuentas_cobrar FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_cuentas_cobrar_insert" ON public.erp_cuentas_cobrar;
CREATE POLICY "erp_cuentas_cobrar_insert" ON public.erp_cuentas_cobrar FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_cuentas_cobrar_update" ON public.erp_cuentas_cobrar;
CREATE POLICY "erp_cuentas_cobrar_update" ON public.erp_cuentas_cobrar FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_proyecto ON public.erp_cuentas_cobrar(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_estado ON public.erp_cuentas_cobrar(estado);
CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_fecha_vencimiento ON public.erp_cuentas_cobrar(fecha_vencimiento);

DROP TRIGGER IF EXISTS trg_erp_cuentas_cobrar_updated ON public.erp_cuentas_cobrar;
CREATE TRIGGER trg_erp_cuentas_cobrar_updated
  BEFORE UPDATE ON public.erp_cuentas_cobrar
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 5: CREAR TABLA erp_cuentas_pagar (CRÍTICA - Financiero)
-- ============================================================

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

DROP POLICY IF EXISTS "erp_cuentas_pagar_select" ON public.erp_cuentas_pagar;
CREATE POLICY "erp_cuentas_pagar_select" ON public.erp_cuentas_pagar FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_cuentas_pagar_insert" ON public.erp_cuentas_pagar;
CREATE POLICY "erp_cuentas_pagar_insert" ON public.erp_cuentas_pagar FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_cuentas_pagar_update" ON public.erp_cuentas_pagar;
CREATE POLICY "erp_cuentas_pagar_update" ON public.erp_cuentas_pagar FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_cuentas_pagar_proyecto ON public.erp_cuentas_pagar(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_pagar_estado ON public.erp_cuentas_pagar(estado);
CREATE INDEX IF NOT EXISTS idx_cuentas_pagar_fecha_vencimiento ON public.erp_cuentas_pagar(fecha_vencimiento);

DROP TRIGGER IF EXISTS trg_erp_cuentas_pagar_updated ON public.erp_cuentas_pagar;
CREATE TRIGGER trg_erp_cuentas_pagar_updated
  BEFORE UPDATE ON public.erp_cuentas_pagar
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 6: CREAR TABLA RELACIONAL erp_empleados_proyectos (M:M)
-- ============================================================

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

DROP POLICY IF EXISTS "erp_empleados_proyectos_select" ON public.erp_empleados_proyectos;
CREATE POLICY "erp_empleados_proyectos_select" ON public.erp_empleados_proyectos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_empleados_proyectos_insert" ON public.erp_empleados_proyectos;
CREATE POLICY "erp_empleados_proyectos_insert" ON public.erp_empleados_proyectos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_empleados_proyectos_update" ON public.erp_empleados_proyectos;
CREATE POLICY "erp_empleados_proyectos_update" ON public.erp_empleados_proyectos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_empleados_proyectos_empleado ON public.erp_empleados_proyectos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_empleados_proyectos_proyecto ON public.erp_empleados_proyectos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_empleados_proyectos_activo ON public.erp_empleados_proyectos(activo);

DROP TRIGGER IF EXISTS trg_erp_empleados_proyectos_updated ON public.erp_empleados_proyectos;
CREATE TRIGGER trg_erp_empleados_proyectos_updated
  BEFORE UPDATE ON public.erp_empleados_proyectos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 7: CREAR TABLA RELACIONAL erp_materiales_proyectos (M:M)
-- ============================================================

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

DROP POLICY IF EXISTS "erp_materiales_proyectos_select" ON public.erp_materiales_proyectos;
CREATE POLICY "erp_materiales_proyectos_select" ON public.erp_materiales_proyectos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero'))
);

DROP POLICY IF EXISTS "erp_materiales_proyectos_insert" ON public.erp_materiales_proyectos;
CREATE POLICY "erp_materiales_proyectos_insert" ON public.erp_materiales_proyectos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
);

DROP POLICY IF EXISTS "erp_materiales_proyectos_update" ON public.erp_materiales_proyectos;
CREATE POLICY "erp_materiales_proyectos_update" ON public.erp_materiales_proyectos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
);

CREATE INDEX IF NOT EXISTS idx_materiales_proyectos_material ON public.erp_materiales_proyectos(material_id);
CREATE INDEX IF NOT EXISTS idx_materiales_proyectos_proyecto ON public.erp_materiales_proyectos(proyecto_id);

DROP TRIGGER IF EXISTS trg_erp_materiales_proyectos_updated ON public.erp_materiales_proyectos;
CREATE TRIGGER trg_erp_materiales_proyectos_updated
  BEFORE UPDATE ON public.erp_materiales_proyectos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 8: AGREGAR COLUMNAS FALTANTES a erp_renglones
-- ============================================================

ALTER TABLE public.erp_renglones ADD COLUMN IF NOT EXISTS presupuesto_id uuid REFERENCES public.erp_presupuestos(id) ON DELETE CASCADE;
ALTER TABLE public.erp_renglones ADD COLUMN IF NOT EXISTS avance_fisico numeric(5,2) DEFAULT 0;
ALTER TABLE public.erp_renglones ADD COLUMN IF NOT EXISTS avance_financiero numeric(5,2) DEFAULT 0;
ALTER TABLE public.erp_renglones ADD COLUMN IF NOT EXISTS predecesores uuid[] DEFAULT ARRAY[]::uuid[];

-- ============================================================
-- PASO 9: CORREGIR erp_ordenes_compra (FK PROJECT + PROVEEDOR)
-- ============================================================

ALTER TABLE public.erp_ordenes_compra ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES public.erp_proyectos(id) ON DELETE SET NULL;
ALTER TABLE public.erp_ordenes_compra ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES public.erp_proveedores(id) ON DELETE SET NULL;

-- ============================================================
-- PASO 10: AGREGAR CAMPOS FINANCIEROS a erp_movimientos
-- ============================================================

ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS proveedor text;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS proveedor_nit text;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS factura text;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS forma_pago text CHECK (forma_pago IN ('efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro'));
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS referencia_bancaria text;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS retencion_isr numeric(10,2) DEFAULT 0;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS retencion_iva numeric(10,2) DEFAULT 0;
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS notas text;

-- Actualizar CHECK para tipo = 'egreso'
ALTER TABLE public.erp_movimientos DROP CONSTRAINT IF EXISTS erp_movimientos_tipo_check;
ALTER TABLE public.erp_movimientos ADD CONSTRAINT erp_movimientos_tipo_check 
  CHECK (tipo = ANY(ARRAY['ingreso','gasto','egreso']));

-- ============================================================
-- PASO 11: AGREGAR ÍNDICES ESTRATÉGICOS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_proyectos_etapa ON public.erp_proyectos(etapa);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON public.erp_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_renglones_presupuesto ON public.erp_renglones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proyecto ON public.erp_ordenes_compra(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON public.erp_ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_forma_pago ON public.erp_movimientos(forma_pago);

-- ============================================================
-- FIN MIGRACIÓN TIER 1
-- ============================================================

-- Resumen de cambios:
-- ✅ 28 columnas agregadas a erp_proyectos
-- ✅ 4 tablas críticas creadas (hitos, riesgos, cuentas_cobrar, cuentas_pagar)
-- ✅ 2 tablas relacionales M:M creadas (empleados_proyectos, materiales_proyectos)
-- ✅ FK y columnas agregadas a ordenes_compra y renglones
-- ✅ Campos financieros agregados a movimientos
-- ✅ RLS policies configuradas en todas las nuevas tablas
-- ✅ Índices de performance agregados
-- ✅ Triggers de updated_at configurados

-- Completitud esperada después: 70%
