-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 1: ESQUEMA BASE + POLÍTICAS RLS
-- Versión: 2026-06-07
--
-- Contiene:
-- - Tablas principales (12 tablas)
-- - Políticas RLS por rol (Admin, Gerente, Residente, Compras, Bodeguero)
-- - Índices para performance
-- - Triggers de auditoría básicos
-- - Extensiones necesarias
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLA BASE: public.profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre text NOT NULL DEFAULT '',
  rol text NOT NULL DEFAULT 'usuario' CHECK (rol = ANY (ARRAY['Administrador','Gerente','Residente','Compras','Bodeguero','usuario'])),
  user_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================================
-- 1.5 FUNCIONES BASE (necesarias para RLS)
-- ============================================================

-- FUNCIÓN: get_user_role()
-- Retorna el rol del usuario actual desde public.profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT rol FROM public.profiles WHERE id = auth.uid()),
    'usuario'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- FUNCIÓN: get_current_user_role()
-- Alias para get_user_role() para consistencia
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT public.get_user_role();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- FUNCIÓN: get_accessible_proyectos()
-- Retorna los proyectos accesibles según el rol del usuario
CREATE OR REPLACE FUNCTION public.get_accessible_proyectos()
RETURNS SETOF uuid AS $$
  DECLARE
    user_rol TEXT := public.get_user_role();
  BEGIN
    -- Admin y Gerente ven TODOS los proyectos
    IF user_rol IN ('Administrador', 'Gerente') THEN
      RETURN QUERY SELECT id FROM erp_proyectos;
    -- Residente: proyectos donde es created_by O está asignado
    ELSIF user_rol = 'Residente' THEN
      RETURN QUERY SELECT p.id FROM erp_proyectos p
        WHERE p.created_by = auth.uid()
        OR p.id IN (
          SELECT e.proyecto_id FROM erp_empleados e
          WHERE e.created_by = auth.uid()
        );
    -- Compras: proyectos con órdenes de compra creadas por él
    ELSIF user_rol = 'Compras' THEN
      RETURN QUERY SELECT DISTINCT o.proyecto_id FROM erp_ordenes_compra o
        WHERE o.created_by = auth.uid();
    -- Bodeguero: proyectos con vales de salida creados por él
    ELSIF user_rol = 'Bodeguero' THEN
      RETURN QUERY SELECT DISTINCT v.proyecto_id FROM erp_vales_salida v
        WHERE v.created_by = auth.uid();
    ELSE
      -- Usuario normal: solo proyectos donde es miembro
      RETURN QUERY SELECT p.id FROM erp_proyectos p
        WHERE p.created_by = auth.uid();
    END IF;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. TABLAS ERP PRINCIPALES
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_proyectos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre text NOT NULL,
    cliente text NOT NULL,
    ubicacion text NOT NULL,
    tipologia text NOT NULL CHECK (tipologia = ANY (ARRAY['residencial','comercial','industrial','civil','publica'])),
    estado text NOT NULL DEFAULT 'planeacion' CHECK (estado = ANY (ARRAY['planeacion','ejecucion','finalizado','pausado'])),
    presupuesto_total numeric(12,2) NOT NULL DEFAULT 0,
    monto_contrato numeric(12,2) NOT NULL DEFAULT 0,
    avance_fisico numeric(5,2) NOT NULL DEFAULT 0,
    avance_financiero numeric(5,2) NOT NULL DEFAULT 0,
    lat double precision,
    lng double precision,
    fecha_inicio date,
    fecha_fin date,
    presupuesto_actual_id uuid,
    factor_sobrecosto jsonb,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_movimientos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_empleados (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre text NOT NULL,
    puesto text NOT NULL,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    salario_diario numeric(10,2) NOT NULL DEFAULT 0,
    dias_trabajados integer NOT NULL DEFAULT 0,
    tipo text NOT NULL DEFAULT 'planilla' CHECK (tipo = ANY (ARRAY['planilla','destajo'])),
    avatar_url text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_materiales (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre text NOT NULL,
    unidad text NOT NULL,
    stock numeric(10,2) NOT NULL DEFAULT 0,
    stock_minimo numeric(10,2) NOT NULL DEFAULT 0,
    precio numeric(10,2) NOT NULL DEFAULT 0,
    critico boolean NOT NULL DEFAULT false,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_ordenes_compra (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proveedor text NOT NULL,
    material text NOT NULL,
    cantidad numeric(10,2) NOT NULL DEFAULT 0,
    monto numeric(12,2) NOT NULL DEFAULT 0,
    items jsonb DEFAULT '[]'::jsonb,
    estado text NOT NULL DEFAULT 'borrador' CHECK (estado = ANY (ARRAY['borrador','pendiente','aprobado','rechazado','recibida'])),
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_proveedores (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre text NOT NULL,
    contacto text,
    rubro text,
    calificacion integer NOT NULL DEFAULT 3 CHECK (calificacion >= 1 AND calificacion <= 5),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_eventos_calendario (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    fecha date NOT NULL,
    hora time,
    titulo text NOT NULL,
    descripcion text,
    tipo text CHECK (tipo = ANY (ARRAY['Recordatorio','Actividad','Reunión','Visita'])),
    completado boolean DEFAULT false,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_bitacora (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    clima text,
    personal integer NOT NULL DEFAULT 0,
    maquinaria text,
    tareas text NOT NULL,
    observaciones text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_seguimiento (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_renglones (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    codigo text NOT NULL,
    nombre text NOT NULL,
    unidad text NOT NULL,
    tipologia text NOT NULL,
    rendimiento_cuadrilla numeric(10,2) NOT NULL DEFAULT 0,
    costo_materiales numeric(12,2) NOT NULL DEFAULT 0,
    costo_mano_obra numeric(12,2) NOT NULL DEFAULT 0,
    costo_equipo numeric(12,2) NOT NULL DEFAULT 0,
    cantidad numeric(10,2) NOT NULL DEFAULT 0,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_insumos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    renglon_id uuid NOT NULL REFERENCES erp_renglones(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    tipo text NOT NULL CHECK (tipo = ANY (ARRAY['material','mano_obra','equipo','subcontrato'])),
    unidad text NOT NULL,
    precio numeric(10,2) NOT NULL DEFAULT 0,
    rendimiento numeric(10,2) NOT NULL DEFAULT 0,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_sub_renglones (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    renglon_id uuid NOT NULL REFERENCES erp_renglones(id) ON DELETE CASCADE,
    nombre_material text NOT NULL,
    unidad text NOT NULL,
    cantidad_unitaria numeric(10,2) NOT NULL DEFAULT 0,
    precio_unitario numeric(10,2) NOT NULL DEFAULT 0,
    total numeric(12,2) GENERATED ALWAYS AS (cantidad_unitaria * precio_unitario) STORED,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_presupuestos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipologia text NOT NULL,
  renglones jsonb NOT NULL DEFAULT '[]',
  total_calculado numeric(12,2) NOT NULL DEFAULT 0,
  costo_directo_total numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'borrador',
  notas text,
  version_presupuesto integer NOT NULL DEFAULT 1,
  fecha_creacion timestamptz DEFAULT now() NOT NULL,
  fecha_actualizacion timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS erp_vales_salida (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    items jsonb NOT NULL DEFAULT '[]',
    solicitante text NOT NULL,
    responsable text,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    observaciones text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_avances (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    renglon_id uuid REFERENCES erp_renglones(id) ON DELETE SET NULL,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    avance_fisico numeric(5,2) NOT NULL DEFAULT 0,
    cantidad_ejecutada numeric(10,2) NOT NULL DEFAULT 0,
    unidad text,
    foto_url text,
    geolocation text,
    observaciones text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- 3. HABILITAR RLS EN TODAS LAS TABLAS
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
ALTER TABLE erp_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sub_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_vales_salida ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_avances ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. POLÍTICAS RLS (Admin/Gerente/Residente/Compras/Bodeguero)
-- ============================================================

-- Proyectos: Admin/Gerente acceso total
DROP POLICY IF EXISTS "erp_proyectos_read" ON erp_proyectos;
CREATE POLICY "erp_proyectos_read" ON erp_proyectos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_proyectos_write" ON erp_proyectos;
CREATE POLICY "erp_proyectos_write" ON erp_proyectos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

-- Movimientos: Admin/Gerente/Residente
DROP POLICY IF EXISTS "erp_movimientos_read" ON erp_movimientos;
CREATE POLICY "erp_movimientos_read" ON erp_movimientos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_movimientos_write" ON erp_movimientos;
CREATE POLICY "erp_movimientos_write" ON erp_movimientos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- Empleados: Admin/Gerente
DROP POLICY IF EXISTS "erp_empleados_read" ON erp_empleados;
CREATE POLICY "erp_empleados_read" ON erp_empleados FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_empleados_write" ON erp_empleados;
CREATE POLICY "erp_empleados_write" ON erp_empleados FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

-- Materiales: Admin/Gerente/Compras/Bodeguero
DROP POLICY IF EXISTS "erp_materiales_read" ON erp_materiales;
CREATE POLICY "erp_materiales_read" ON erp_materiales FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_materiales_write" ON erp_materiales;
CREATE POLICY "erp_materiales_write" ON erp_materiales FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero'))
);

-- Órdenes de Compra: Admin/Gerente/Compras
DROP POLICY IF EXISTS "erp_ordenes_compra_read" ON erp_ordenes_compra;
CREATE POLICY "erp_ordenes_compra_read" ON erp_ordenes_compra FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_ordenes_compra_write" ON erp_ordenes_compra;
CREATE POLICY "erp_ordenes_compra_write" ON erp_ordenes_compra FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
);

-- Proveedores: Admin/Gerente/Compras
DROP POLICY IF EXISTS "erp_proveedores_read" ON erp_proveedores;
CREATE POLICY "erp_proveedores_read" ON erp_proveedores FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_proveedores_write" ON erp_proveedores;
CREATE POLICY "erp_proveedores_write" ON erp_proveedores FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
);

-- Eventos: Admin/Gerente/Residente
DROP POLICY IF EXISTS "erp_eventos_calendario_read" ON erp_eventos_calendario;
CREATE POLICY "erp_eventos_calendario_read" ON erp_eventos_calendario FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_eventos_calendario_write" ON erp_eventos_calendario;
CREATE POLICY "erp_eventos_calendario_write" ON erp_eventos_calendario FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- Bitácora: Admin/Gerente/Residente
DROP POLICY IF EXISTS "erp_bitacora_read" ON erp_bitacora;
CREATE POLICY "erp_bitacora_read" ON erp_bitacora FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_bitacora_write" ON erp_bitacora;
CREATE POLICY "erp_bitacora_write" ON erp_bitacora FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- Seguimiento: Admin/Gerente
DROP POLICY IF EXISTS "erp_seguimiento_read" ON erp_seguimiento;
CREATE POLICY "erp_seguimiento_read" ON erp_seguimiento FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_seguimiento_write" ON erp_seguimiento;
CREATE POLICY "erp_seguimiento_write" ON erp_seguimiento FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

-- Renglones: Admin/Gerente/Residente
DROP POLICY IF EXISTS "erp_renglones_read" ON erp_renglones;
CREATE POLICY "erp_renglones_read" ON erp_renglones FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_renglones_write" ON erp_renglones;
CREATE POLICY "erp_renglones_write" ON erp_renglones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- Insumos: Admin/Gerente/Residente
DROP POLICY IF EXISTS "erp_insumos_read" ON erp_insumos;
CREATE POLICY "erp_insumos_read" ON erp_insumos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_insumos_write" ON erp_insumos;
CREATE POLICY "erp_insumos_write" ON erp_insumos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- Sub-renglones: Admin/Gerente/Residente
DROP POLICY IF EXISTS "erp_sub_renglones_read" ON erp_sub_renglones;
CREATE POLICY "erp_sub_renglones_read" ON erp_sub_renglones FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_sub_renglones_write" ON erp_sub_renglones;
CREATE POLICY "erp_sub_renglones_write" ON erp_sub_renglones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- Presupuestos: Admin/Gerente/Residente
DROP POLICY IF EXISTS "erp_presupuestos_read" ON erp_presupuestos;
CREATE POLICY "erp_presupuestos_read" ON erp_presupuestos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "erp_presupuestos_write" ON erp_presupuestos;
CREATE POLICY "erp_presupuestos_write" ON erp_presupuestos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- Vales de Salida: Admin/Gerente/Bodeguero/Residente
DROP POLICY IF EXISTS "erp_vales_salida_read" ON erp_vales_salida;
CREATE POLICY "erp_vales_salida_read" ON erp_vales_salida FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Bodeguero', 'Residente'))
);

DROP POLICY IF EXISTS "erp_vales_salida_write" ON erp_vales_salida;
CREATE POLICY "erp_vales_salida_write" ON erp_vales_salida FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Bodeguero', 'Residente'))
);

-- Avances: Admin/Gerente/Residente
DROP POLICY IF EXISTS "erp_avances_read" ON erp_avances;
CREATE POLICY "erp_avances_read" ON erp_avances FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_avances_write" ON erp_avances;
CREATE POLICY "erp_avances_write" ON erp_avances FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- ============================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_erp_proyectos_estado ON erp_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_erp_proyectos_created_by ON erp_proyectos(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_proyecto ON erp_movimientos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_fecha ON erp_movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_created_by ON erp_movimientos(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_empleados_proyecto ON erp_empleados(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_empleados_created_by ON erp_empleados(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_materiales_created_by ON erp_materiales(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_created_by ON erp_ordenes_compra(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_proveedores_created_by ON erp_proveedores(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_eventos_proyecto ON erp_eventos_calendario(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_eventos_fecha ON erp_eventos_calendario(fecha);
CREATE INDEX IF NOT EXISTS idx_erp_bitacora_proyecto ON erp_bitacora(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_bitacora_created_by ON erp_bitacora(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_proyecto ON erp_seguimiento(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_fecha ON erp_seguimiento(fecha);
CREATE INDEX IF NOT EXISTS idx_erp_renglones_proyecto ON erp_renglones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_renglones_codigo ON erp_renglones(codigo);
CREATE INDEX IF NOT EXISTS idx_erp_insumos_renglon ON erp_insumos(renglon_id);
CREATE INDEX IF NOT EXISTS idx_erp_sub_renglones_renglon ON erp_sub_renglones(renglon_id);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto ON erp_presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_estado ON erp_presupuestos(estado);
CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_proyecto ON erp_vales_salida(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_avances_proyecto ON erp_avances(proyecto_id);

-- ============================================================
-- 6. FUNCIONES Y TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_proyectos_updated ON erp_proyectos;
CREATE TRIGGER trg_erp_proyectos_updated
  BEFORE UPDATE ON erp_proyectos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_movimientos_updated ON erp_movimientos;
CREATE TRIGGER trg_erp_movimientos_updated
  BEFORE UPDATE ON erp_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_empleados_updated ON erp_empleados;
CREATE TRIGGER trg_erp_empleados_updated
  BEFORE UPDATE ON erp_empleados
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_materiales_updated ON erp_materiales;
CREATE TRIGGER trg_erp_materiales_updated
  BEFORE UPDATE ON erp_materiales
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_ordenes_compra_updated ON erp_ordenes_compra;
CREATE TRIGGER trg_erp_ordenes_compra_updated
  BEFORE UPDATE ON erp_ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_proveedores_updated ON erp_proveedores;
CREATE TRIGGER trg_erp_proveedores_updated
  BEFORE UPDATE ON erp_proveedores
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_eventos_calendario_updated ON erp_eventos_calendario;
CREATE TRIGGER trg_erp_eventos_calendario_updated
  BEFORE UPDATE ON erp_eventos_calendario
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_bitacora_updated ON erp_bitacora;
CREATE TRIGGER trg_erp_bitacora_updated
  BEFORE UPDATE ON erp_bitacora
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_seguimiento_updated ON erp_seguimiento;
CREATE TRIGGER trg_erp_seguimiento_updated
  BEFORE UPDATE ON erp_seguimiento
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_renglones_updated ON erp_renglones;
CREATE TRIGGER trg_erp_renglones_updated
  BEFORE UPDATE ON erp_renglones
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_insumos_updated ON erp_insumos;
CREATE TRIGGER trg_erp_insumos_updated
  BEFORE UPDATE ON erp_insumos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_sub_renglones_updated ON erp_sub_renglones;
CREATE TRIGGER trg_erp_sub_renglones_updated
  BEFORE UPDATE ON erp_sub_renglones
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_presupuestos_timestamp ON erp_presupuestos;
CREATE TRIGGER trg_erp_presupuestos_timestamp
  BEFORE UPDATE ON erp_presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_vales_salida_updated ON erp_vales_salida;
CREATE TRIGGER trg_erp_vales_salida_updated
  BEFORE UPDATE ON erp_vales_salida
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_erp_avances_updated ON erp_avances;
CREATE TRIGGER trg_erp_avances_updated
  BEFORE UPDATE ON erp_avances
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol)
  VALUES (NEW.id, '', 'usuario');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FIN MIGRACIÓN 1
-- ============================================================
