-- ============================================================
-- ERP CONSTRUSMART - Esquema completo para Supabase (v1.0.0)
--
-- Este script contiene la definición completa de la base de datos:
-- tablas, políticas RLS, índices, funciones y triggers.
-- Está diseñado para ser copiado y pegado directamente en el SQL Editor de Supabase.
-- ============================================================

-- Extensiones (asegúrate de que estén habilitadas en Supabase si es necesario)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0) Perfiles de usuario (tabla base para RLS)
-- NOTA: Utiliza 'public.profiles' para la gestión de usuarios y RLS.
-- Las columnas aquí usan snake_case para consistencia con el resto del esquema.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre text NOT NULL DEFAULT '',
  rol text NOT NULL DEFAULT 'usuario' CHECK (rol = ANY (ARRAY['Administrador','Gerente','Residente','Compras','Bodeguero','usuario'])),
  user_metadata jsonb, -- Para almacenar metadatos de usuario adicionales (ej. full_name)
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para public.profiles
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);


-- 1) Tablas ERP principales
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS erp_proyectos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tipo text NOT NULL CHECK (tipo = ANY (ARRAY['ingreso','gasto'])),
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    descripcion text NOT NULL,
    cantidad numeric(10,2) NOT NULL DEFAULT 0,
    unidad text NOT NULL,
    categoria text NOT NULL CHECK (categoria = ANY (ARRAY[
      'materiales','mano_obra','herramienta','sub_contrato',
      'administrativo','personal','transporte','fijos',
      'hogar','aporte','trabajos_extra'
    ])),
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
    estado text NOT NULL DEFAULT 'borrador' CHECK (estado = ANY (ARRAY['borrador','pendiente','aprobado','rechazado'])),
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
    hora time, -- Nueva columna
    titulo text NOT NULL,
    descripcion text, -- Nueva columna
    tipo text CHECK (tipo = ANY (ARRAY['Recordatorio','Actividad','Reunión','Visita'])), -- Nueva columna
    completado boolean DEFAULT false, -- Nueva columna
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

-- 2) Tablas de Renglones, Insumos y SubRenglones (detalles del presupuesto)
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS erp_renglones (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    codigo text NOT NULL,
    nombre text NOT NULL,
    unidad text NOT NULL,
    tipologia text NOT NULL CHECK (tipologia = ANY (ARRAY['residencial','comercial','industrial','civil','publica'])),
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

-- 3) Habilitar RLS en todas las tablas ERP
------------------------------------------------------------

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

-- 4) Políticas RLS ERP (integradas con public.profiles y created_by)
------------------------------------------------------------

-- Políticas base: permitir acceso por rol o por created_by
-- Administrador: Acceso total a todas las tablas (excepto public.profiles donde es auto-manejo)
-- Gerente: Acceso total a todas las tablas (excepto public.profiles)
-- Residente: Acceso a movimientos, bitácora, eventos, renglones, insumos, subrenglones
-- Compras: Acceso a materiales, órdenes de compra, proveedores
-- Bodeguero: Acceso a materiales

-- Nota: Para simplificar, muchas políticas usan 'true' para SELECT y luego un EXISTS para WRITE.
-- Si se necesita RLS más granular para SELECT, ajustar 'true' por 'auth.uid() = created_by' o roles.


-- erp_proyectos: Admin/Gerente acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_proyectos_read" ON erp_proyectos;
CREATE POLICY "erp_proyectos_read" ON erp_proyectos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_proyectos_write" ON erp_proyectos;
CREATE POLICY "erp_proyectos_write" ON erp_proyectos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

-- erp_movimientos: Admin/Gerente/Residente acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_movimientos_read" ON erp_movimientos;
CREATE POLICY "erp_movimientos_read" ON erp_movimientos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_movimientos_write" ON erp_movimientos;
CREATE POLICY "erp_movimientos_write" ON erp_movimientos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- erp_empleados: Admin/Gerente acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_empleados_read" ON erp_empleados;
CREATE POLICY "erp_empleados_read" ON erp_empleados FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_empleados_write" ON erp_empleados;
CREATE POLICY "erp_empleados_write" ON erp_empleados FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

-- erp_materiales: Admin/Gerente/Compras/Bodeguero acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_materiales_read" ON erp_materiales;
CREATE POLICY "erp_materiales_read" ON erp_materiales FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_materiales_write" ON erp_materiales;
CREATE POLICY "erp_materiales_write" ON erp_materiales FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero'))
);

-- erp_ordenes_compra: Admin/Gerente/Compras acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_ordenes_compra_read" ON erp_ordenes_compra;
CREATE POLICY "erp_ordenes_compra_read" ON erp_ordenes_compra FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_ordenes_compra_write" ON erp_ordenes_compra;
CREATE POLICY "erp_ordenes_compra_write" ON erp_ordenes_compra FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
);

-- erp_proveedores: Admin/Gerente/Compras acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_proveedores_read" ON erp_proveedores;
CREATE POLICY "erp_proveedores_read" ON erp_proveedores FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_proveedores_write" ON erp_proveedores;
CREATE POLICY "erp_proveedores_write" ON erp_proveedores FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
);

-- erp_eventos_calendario: Admin/Gerente/Residente acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_eventos_calendario_read" ON erp_eventos_calendario;
CREATE POLICY "erp_eventos_calendario_read" ON erp_eventos_calendario FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_eventos_calendario_write" ON erp_eventos_calendario;
CREATE POLICY "erp_eventos_calendario_write" ON erp_eventos_calendario FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- erp_bitacora: Admin/Gerente/Residente acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_bitacora_read" ON erp_bitacora;
CREATE POLICY "erp_bitacora_read" ON erp_bitacora FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_bitacora_write" ON erp_bitacora;
CREATE POLICY "erp_bitacora_write" ON erp_bitacora FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- erp_seguimiento (EVM): Solo Admin/Gerente acceso total
DROP POLICY IF EXISTS "erp_seguimiento_read" ON erp_seguimiento;
CREATE POLICY "erp_seguimiento_read" ON erp_seguimiento FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_seguimiento_write" ON erp_seguimiento;
CREATE POLICY "erp_seguimiento_write" ON erp_seguimiento FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

-- erp_renglones: Admin/Gerente/Residente acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_renglones_read" ON erp_renglones;
CREATE POLICY "erp_renglones_read" ON erp_renglones FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_renglones_write" ON erp_renglones;
CREATE POLICY "erp_renglones_write" ON erp_renglones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- erp_insumos: Admin/Gerente/Residente acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_insumos_read" ON erp_insumos;
CREATE POLICY "erp_insumos_read" ON erp_insumos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_insumos_write" ON erp_insumos;
CREATE POLICY "erp_insumos_write" ON erp_insumos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

-- erp_sub_renglones: Admin/Gerente/Residente acceso total, otros solo lectura (si el created_by es suyo)
DROP POLICY IF EXISTS "erp_sub_renglones_read" ON erp_sub_renglones;
CREATE POLICY "erp_sub_renglones_read" ON erp_sub_renglones FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "erp_sub_renglones_write" ON erp_sub_renglones;
CREATE POLICY "erp_sub_renglones_write" ON erp_sub_renglones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);


-- 5) Índices para rendimiento
------------------------------------------------------------

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
CREATE INDEX IF NOT EXISTS idx_erp_eventos_calendario_created_by ON erp_eventos_calendario(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_bitacora_proyecto ON erp_bitacora(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_bitacora_created_by ON erp_bitacora(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_proyecto ON erp_seguimiento(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_fecha ON erp_seguimiento(fecha);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_created_by ON erp_seguimiento(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_renglones_proyecto ON erp_renglones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_renglones_codigo ON erp_renglones(codigo);
CREATE INDEX IF NOT EXISTS idx_erp_renglones_created_by ON erp_renglones(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_insumos_renglon ON erp_insumos(renglon_id);
CREATE INDEX IF NOT EXISTS idx_erp_insumos_created_by ON erp_insumos(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_sub_renglones_renglon ON erp_sub_renglones(renglon_id);
CREATE INDEX IF NOT EXISTS idx_erp_sub_renglones_created_by ON erp_sub_renglones(created_by);


-- 6) Funciones y Triggers para automatización
------------------------------------------------------------

-- Función para actualizar automáticamente la columna 'updated_at'
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Disparadores (triggers) para 'updated_at' en tablas con esta columna
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


-- Función para crear un perfil público para nuevos usuarios registrados en 'auth.users'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol)
  VALUES (NEW.id, '', 'usuario');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador (trigger) para 'handle_new_user'
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();