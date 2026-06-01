-- ============================================================
-- ERP CONSTRUSMART - Migración completa para Supabase
-- Ejecutar TODO en el SQL Editor.
-- NOTA: para re-ejecutar, usar el script completo con DROP IF EXISTS
-- ============================================================

DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS erp_bitacora CASCADE;
DROP TABLE IF EXISTS erp_eventos_calendario CASCADE;
DROP TABLE IF EXISTS erp_proveedores CASCADE;
DROP TABLE IF EXISTS erp_ordenes_compra CASCADE;
DROP TABLE IF EXISTS erp_materiales CASCADE;
DROP TABLE IF EXISTS erp_empleados CASCADE;
DROP TABLE IF EXISTS erp_movimientos CASCADE;
DROP TABLE IF EXISTS erp_proyectos CASCADE;
DROP TABLE IF EXISTS erp_seguimiento CASCADE;

-- 0) Perfiles de usuario (tabla base para RLS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre text NOT NULL DEFAULT '',
  rol text NOT NULL DEFAULT 'usuario' CHECK (rol = ANY (ARRAY['Administrador','Gerente','Residente','Compras','Bodeguero','usuario'])),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;

CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================================
-- 1) Tablas ERP
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_proyectos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    cliente text NOT NULL,
    ubicacion text NOT NULL,
    tipologia text NOT NULL CHECK (tipologia = ANY (ARRAY['residencial','comercial','industrial','civil','publica'])),
    estado text NOT NULL DEFAULT 'planeacion' CHECK (estado = ANY (ARRAY['planeacion','ejecucion','finalizado'])),
    presupuesto_total numeric(12,2) NOT NULL DEFAULT 0,
    monto_contrato numeric(12,2) NOT NULL DEFAULT 0,
    avance_fisico numeric(5,2) NOT NULL DEFAULT 0,
    avance_financiero numeric(5,2) NOT NULL DEFAULT 0,
    lat double precision,
    lng double precision,
    fecha_inicio date,
    fecha_fin date,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_movimientos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo text NOT NULL CHECK (tipo = ANY (ARRAY['ingreso','gasto'])),
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    descripcion text NOT NULL,
    cantidad numeric(10,2) NOT NULL DEFAULT 0,
    unidad text NOT NULL,
    categoria text NOT NULL,
    costo_unitario numeric(10,2) NOT NULL DEFAULT 0,
    costo_total numeric(12,2) NOT NULL DEFAULT 0,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_empleados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    puesto text NOT NULL,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    salario_diario numeric(10,2) NOT NULL DEFAULT 0,
    dias_trabajados integer NOT NULL DEFAULT 0,
    tipo text NOT NULL DEFAULT 'planilla' CHECK (tipo = ANY (ARRAY['planilla','destajo'])),
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_materiales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    unidad text NOT NULL,
    stock numeric(10,2) NOT NULL DEFAULT 0,
    stock_minimo numeric(10,2) NOT NULL DEFAULT 0,
    precio numeric(10,2) NOT NULL DEFAULT 0,
    critico boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_ordenes_compra (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proveedor text NOT NULL,
    material text NOT NULL,
    cantidad numeric(10,2) NOT NULL DEFAULT 0,
    monto numeric(12,2) NOT NULL DEFAULT 0,
    estado text NOT NULL DEFAULT 'borrador' CHECK (estado = ANY (ARRAY['borrador','pendiente','aprobado','rechazado'])),
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_proveedores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    contacto text,
    rubro text,
    calificacion integer NOT NULL DEFAULT 3 CHECK (calificacion >= 1 AND calificacion <= 5),
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_eventos_calendario (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha date NOT NULL,
    titulo text NOT NULL,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_bitacora (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    clima text,
    personal integer NOT NULL DEFAULT 0,
    maquinaria text,
    tareas text NOT NULL,
    observaciones text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_seguimiento (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    avance_fisico numeric(5,2) NOT NULL DEFAULT 0,
    avance_financiero numeric(5,2) NOT NULL DEFAULT 0,
    costo_planeado numeric(12,2) NOT NULL DEFAULT 0,
    costo_real numeric(12,2) NOT NULL DEFAULT 0,
    valor_planeado numeric(12,2) NOT NULL DEFAULT 0,
    valor_ganado numeric(12,2) NOT NULL DEFAULT 0,
    cv numeric(12,2) GENERATED ALWAYS AS (valor_ganado - costo_real) STORED,
    sv numeric(12,2) GENERATED ALWAYS AS (valor_ganado - valor_planeado) STORED,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- 2) RLS - Habilitar en todas las tablas ERP
-- ============================================================

ALTER TABLE erp_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bitacora ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_seguimiento ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3) Políticas RLS ERP (ahora sí con public.profiles)
-- ============================================================

-- Proyectos: todos leen, solo Admin/Gerente escriben
CREATE POLICY "erp_proyectos_read" ON erp_proyectos FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_proyectos_write" ON erp_proyectos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente']))
);

-- Movimientos: todos leen, Admin/Gerente/Residente escriben
CREATE POLICY "erp_movimientos_read" ON erp_movimientos FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_movimientos_write" ON erp_movimientos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Residente']))
);

-- Empleados: todos leen, Admin/Gerente escriben
CREATE POLICY "erp_empleados_read" ON erp_empleados FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_empleados_write" ON erp_empleados FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente']))
);

-- Materiales: todos leen, Admin/Gerente/Compras/Bodeguero escriben
CREATE POLICY "erp_materiales_read" ON erp_materiales FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_materiales_write" ON erp_materiales FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Compras','Bodeguero']))
);

-- Órdenes de compra: todos leen, Admin/Gerente/Compras escriben
CREATE POLICY "erp_ordenes_read" ON erp_ordenes_compra FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_ordenes_write" ON erp_ordenes_compra FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Compras']))
);

-- Proveedores: todos leen, Admin/Gerente/Compras escriben
CREATE POLICY "erp_proveedores_read" ON erp_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_proveedores_write" ON erp_proveedores FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Compras']))
);

-- Eventos de calendario: todos leen y escriben
CREATE POLICY "erp_eventos_read" ON erp_eventos_calendario FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_eventos_write" ON erp_eventos_calendario FOR ALL TO authenticated USING (true);

-- Bitácora: todos leen y escriben
CREATE POLICY "erp_bitacora_read" ON erp_bitacora FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_bitacora_write" ON erp_bitacora FOR ALL TO authenticated USING (true);

-- Seguimiento (EVM): solo Admin/Gerente
CREATE POLICY "erp_seguimiento_read" ON erp_seguimiento FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente']))
);
CREATE POLICY "erp_seguimiento_write" ON erp_seguimiento FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente']))
);

-- ============================================================
-- 4) Índices para rendimiento
-- ============================================================

CREATE INDEX idx_erp_proyectos_estado ON erp_proyectos(estado);
CREATE INDEX idx_erp_movimientos_proyecto ON erp_movimientos(proyecto_id);
CREATE INDEX idx_erp_movimientos_fecha ON erp_movimientos(fecha);
CREATE INDEX idx_erp_empleados_proyecto ON erp_empleados(proyecto_id);
CREATE INDEX idx_erp_eventos_proyecto ON erp_eventos_calendario(proyecto_id);
CREATE INDEX idx_erp_eventos_fecha ON erp_eventos_calendario(fecha);
CREATE INDEX idx_erp_seguimiento_proyecto ON erp_seguimiento(proyecto_id);
CREATE INDEX idx_erp_bitacora_proyecto ON erp_bitacora(proyecto_id);
CREATE INDEX idx_erp_seguimiento_fecha ON erp_seguimiento(fecha);

-- ============================================================
-- 5) Trigger updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_proyectos_updated ON erp_proyectos;
CREATE TRIGGER trg_erp_proyectos_updated
  BEFORE UPDATE ON erp_proyectos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- FIN - Copiá y pegá TODO el bloque en el SQL Editor de Supabase
-- ============================================================
