-- =============================================================
-- CONSTRUSMART ERP - ALINEACION COMPLETA SUPABASE <-> APLICACION
-- =============================================================
-- Generado al: 2026-03-06
-- Ejecutar completo en Supabase SQL Editor.
-- =============================================================


-- =============================================================
-- PARTE 1: CORRECCIONES DE ESQUEMA
-- =============================================================

-- 1.1 profiles: Agregar avatar_url y empresa_id
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- 1.2 erp_empleados: Agregar proyecto_id si falta (la app lo necesita como FK simple)
ALTER TABLE public.erp_empleados
  ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES public.erp_proyectos(id);

-- Agregar telefono si falta
ALTER TABLE public.erp_empleados
  ADD COLUMN IF NOT EXISTS telefono text;

-- 1.3 erp_materiales: Agregar proyecto_ids si falta
ALTER TABLE public.erp_materiales
  ADD COLUMN IF NOT EXISTS proyecto_ids uuid[] DEFAULT '{}';

-- 1.4 erp_bitacora: Agregar fotos y firma si faltan
ALTER TABLE public.erp_bitacora
  ADD COLUMN IF NOT EXISTS fotos text[] DEFAULT '{}';
ALTER TABLE public.erp_bitacora
  ADD COLUMN IF NOT EXISTS firma text;

-- 1.5 erp_eventos_calendario: Agregar participantes si falta
ALTER TABLE public.erp_eventos_calendario
  ADD COLUMN IF NOT EXISTS participantes uuid[] DEFAULT '{}';

-- 1.6 erp_proyectos: Agregar factor_sobrecosto si falta
ALTER TABLE public.erp_proyectos
  ADD COLUMN IF NOT EXISTS factor_sobrecosto jsonb
  DEFAULT '{"indirectos": 0, "administracion": 0, "imprevistos": 0, "utilidad": 0}'::jsonb;

-- 1.7 erp_ordenes_compra: Agregar proyecto_id si falta
ALTER TABLE public.erp_ordenes_compra
  ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES public.erp_proyectos(id);

-- 1.8 erp_vales_salida: Default created_at
ALTER TABLE public.erp_vales_salida
  ALTER COLUMN created_at SET DEFAULT now();

-- 1.9 erp_proveedores: Agregar telefono, email, categoria
ALTER TABLE public.erp_proveedores
  ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE public.erp_proveedores
  ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.erp_proveedores
  ADD COLUMN IF NOT EXISTS categoria text;

-- 1.10 erp_movimientos: Agregar factura si falta
ALTER TABLE public.erp_movimientos
  ADD COLUMN IF NOT EXISTS factura text;

-- 1.11 erp_rendimientos_cuadrilla: Agregar created_by, created_at, updated_at
ALTER TABLE public.erp_rendimientos_cuadrilla
  ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.erp_rendimientos_cuadrilla
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.erp_rendimientos_cuadrilla
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- =============================================================
-- PARTE 2: RESTRICCIONES CHECK Y DEFAULTS
-- =============================================================

ALTER TABLE public.erp_proyectos
  DROP CONSTRAINT IF EXISTS erp_proyectos_estado_check;
ALTER TABLE public.erp_proyectos
  ADD CONSTRAINT erp_proyectos_estado_check
  CHECK (estado = ANY (ARRAY['planeacion','ejecucion','pausado','finalizado']));

ALTER TABLE public.erp_proyectos
  ALTER COLUMN presupuesto_total SET DEFAULT 0,
  ALTER COLUMN monto_contrato SET DEFAULT 0,
  ALTER COLUMN avance_fisico SET DEFAULT 0,
  ALTER COLUMN avance_financiero SET DEFAULT 0;

ALTER TABLE public.erp_empleados
  ALTER COLUMN salario_diario SET DEFAULT 0,
  ALTER COLUMN dias_trabajados SET DEFAULT 0;

ALTER TABLE public.erp_materiales
  ALTER COLUMN stock SET DEFAULT 0,
  ALTER COLUMN stock_minimo SET DEFAULT 0,
  ALTER COLUMN precio SET DEFAULT 0,
  ALTER COLUMN critico SET DEFAULT false;

ALTER TABLE public.logs_sistema
  ALTER COLUMN created_at SET DEFAULT now();


-- =============================================================
-- PARTE 3: FUNCION RPC - verificar_rol_usuario
-- =============================================================

DROP FUNCTION IF EXISTS public.verificar_rol_usuario();

CREATE OR REPLACE FUNCTION public.verificar_rol_usuario()
RETURNS TABLE (
  user_id uuid,
  rol text,
  nombre text,
  authenticated boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.rol,
    p.nombre,
    (auth.uid() IS NOT NULL) AS authenticated
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.verificar_rol_usuario() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_rol_usuario() TO authenticated;


-- =============================================================
-- PARTE 4: TRIGGER - handle_new_user
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol, avatar_url, user_metadata)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'nombre',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    CASE
      WHEN NEW.email = 'salazaroliveros@gmail.com' THEN 'Administrador'
      ELSE 'Residente'
    END,
    COALESCE(NEW.raw_user_meta_data->>'picture', NEW.raw_user_meta_data->>'avatar_url'),
    NEW.raw_user_meta_data
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url    = COALESCE(EXCLUDED.avatar_url,    public.profiles.avatar_url),
    user_metadata = COALESCE(EXCLUDED.user_metadata, public.profiles.user_metadata);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================
-- PARTE 5: HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_bitacora ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sub_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_vales_salida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_insumos_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas_chicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activos_herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadro_comparativo_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amortizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_paquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_auditoria ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- PARTE 6: POLITICAS RLS
-- =============================================================

-- profiles
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile." ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- erp_proyectos
DROP POLICY IF EXISTS proyectos_select ON public.erp_proyectos;
DROP POLICY IF EXISTS proyectos_insert ON public.erp_proyectos;
DROP POLICY IF EXISTS proyectos_update ON public.erp_proyectos;
DROP POLICY IF EXISTS proyectos_delete ON public.erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_read" ON public.erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_write" ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to view own projects" ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to create projects" ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to update own projects" ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to delete own projects" ON public.erp_proyectos;
CREATE POLICY proyectos_select ON public.erp_proyectos FOR SELECT TO authenticated USING (true);
CREATE POLICY proyectos_insert ON public.erp_proyectos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente'))
);
CREATE POLICY proyectos_update ON public.erp_proyectos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente'))
);
CREATE POLICY proyectos_delete ON public.erp_proyectos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_movimientos
DROP POLICY IF EXISTS movimientos_select ON public.erp_movimientos;
DROP POLICY IF EXISTS movimientos_insert ON public.erp_movimientos;
DROP POLICY IF EXISTS movimientos_update ON public.erp_movimientos;
DROP POLICY IF EXISTS movimientos_delete ON public.erp_movimientos;
DROP POLICY IF EXISTS "erp_movimientos_read" ON public.erp_movimientos;
DROP POLICY IF EXISTS "erp_movimientos_write" ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to view own movements" ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to create movements" ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to update own movements" ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to delete own movements" ON public.erp_movimientos;
CREATE POLICY movimientos_select ON public.erp_movimientos FOR SELECT TO authenticated USING (true);
CREATE POLICY movimientos_insert ON public.erp_movimientos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY movimientos_update ON public.erp_movimientos FOR UPDATE TO authenticated USING (true);
CREATE POLICY movimientos_delete ON public.erp_movimientos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_empleados
DROP POLICY IF EXISTS empleados_select ON public.erp_empleados;
DROP POLICY IF EXISTS empleados_insert ON public.erp_empleados;
DROP POLICY IF EXISTS empleados_update ON public.erp_empleados;
DROP POLICY IF EXISTS empleados_delete ON public.erp_empleados;
DROP POLICY IF EXISTS "erp_empleados_read" ON public.erp_empleados;
DROP POLICY IF EXISTS "erp_empleados_write" ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to view own employees" ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to create employees" ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to update own employees" ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to delete own employees" ON public.erp_empleados;
CREATE POLICY empleados_select ON public.erp_empleados FOR SELECT TO authenticated USING (true);
CREATE POLICY empleados_insert ON public.erp_empleados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY empleados_update ON public.erp_empleados FOR UPDATE TO authenticated USING (true);
CREATE POLICY empleados_delete ON public.erp_empleados FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_materiales
DROP POLICY IF EXISTS materiales_select ON public.erp_materiales;
DROP POLICY IF EXISTS materiales_insert ON public.erp_materiales;
DROP POLICY IF EXISTS materiales_update ON public.erp_materiales;
DROP POLICY IF EXISTS materiales_delete ON public.erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_read" ON public.erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_write" ON public.erp_materiales;
DROP POLICY IF EXISTS "Allow authenticated users to view materials" ON public.erp_materiales;
CREATE POLICY materiales_select ON public.erp_materiales FOR SELECT TO authenticated USING (true);
CREATE POLICY materiales_insert ON public.erp_materiales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY materiales_update ON public.erp_materiales FOR UPDATE TO authenticated USING (true);
CREATE POLICY materiales_delete ON public.erp_materiales FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_ordenes_compra
DROP POLICY IF EXISTS oc_select ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS oc_insert ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS oc_update ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS oc_delete ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_read" ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_write" ON public.erp_ordenes_compra;
CREATE POLICY oc_select ON public.erp_ordenes_compra FOR SELECT TO authenticated USING (true);
CREATE POLICY oc_insert ON public.erp_ordenes_compra FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY oc_update ON public.erp_ordenes_compra FOR UPDATE TO authenticated USING (true);
CREATE POLICY oc_delete ON public.erp_ordenes_compra FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_proveedores
DROP POLICY IF EXISTS proveedores_select ON public.erp_proveedores;
DROP POLICY IF EXISTS proveedores_insert ON public.erp_proveedores;
DROP POLICY IF EXISTS proveedores_update ON public.erp_proveedores;
DROP POLICY IF EXISTS proveedores_delete ON public.erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_read" ON public.erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_write" ON public.erp_proveedores;
CREATE POLICY proveedores_select ON public.erp_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY proveedores_insert ON public.erp_proveedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY proveedores_update ON public.erp_proveedores FOR UPDATE TO authenticated USING (true);
CREATE POLICY proveedores_delete ON public.erp_proveedores FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_eventos_calendario
DROP POLICY IF EXISTS eventos_select ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS eventos_insert ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS eventos_update ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS eventos_delete ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_read" ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_write" ON public.erp_eventos_calendario;
CREATE POLICY eventos_select ON public.erp_eventos_calendario FOR SELECT TO authenticated USING (true);
CREATE POLICY eventos_insert ON public.erp_eventos_calendario FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY eventos_update ON public.erp_eventos_calendario FOR UPDATE TO authenticated USING (true);
CREATE POLICY eventos_delete ON public.erp_eventos_calendario FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_bitacora
DROP POLICY IF EXISTS bitacora_select ON public.erp_bitacora;
DROP POLICY IF EXISTS bitacora_insert ON public.erp_bitacora;
DROP POLICY IF EXISTS bitacora_update ON public.erp_bitacora;
DROP POLICY IF EXISTS bitacora_delete ON public.erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_read" ON public.erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_write" ON public.erp_bitacora;
CREATE POLICY bitacora_select ON public.erp_bitacora FOR SELECT TO authenticated USING (true);
CREATE POLICY bitacora_insert ON public.erp_bitacora FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY bitacora_update ON public.erp_bitacora FOR UPDATE TO authenticated USING (true);
CREATE POLICY bitacora_delete ON public.erp_bitacora FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_presupuestos
DROP POLICY IF EXISTS presupuestos_select ON public.erp_presupuestos;
DROP POLICY IF EXISTS presupuestos_insert ON public.erp_presupuestos;
DROP POLICY IF EXISTS presupuestos_update ON public.erp_presupuestos;
DROP POLICY IF EXISTS presupuestos_delete ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_select ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_create ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_update ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_delete ON public.erp_presupuestos;
CREATE POLICY presupuestos_select ON public.erp_presupuestos FOR SELECT TO authenticated USING (true);
CREATE POLICY presupuestos_insert ON public.erp_presupuestos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente'))
);
CREATE POLICY presupuestos_update ON public.erp_presupuestos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente'))
);
CREATE POLICY presupuestos_delete ON public.erp_presupuestos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_seguimiento
DROP POLICY IF EXISTS seguimiento_select ON public.erp_seguimiento;
DROP POLICY IF EXISTS seguimiento_insert ON public.erp_seguimiento;
DROP POLICY IF EXISTS seguimiento_update ON public.erp_seguimiento;
DROP POLICY IF EXISTS seguimiento_delete ON public.erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_read" ON public.erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_write" ON public.erp_seguimiento;
CREATE POLICY seguimiento_select ON public.erp_seguimiento FOR SELECT TO authenticated USING (true);
CREATE POLICY seguimiento_insert ON public.erp_seguimiento FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY seguimiento_update ON public.erp_seguimiento FOR UPDATE TO authenticated USING (true);
CREATE POLICY seguimiento_delete ON public.erp_seguimiento FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_renglones
DROP POLICY IF EXISTS renglones_select ON public.erp_renglones;
DROP POLICY IF EXISTS renglones_insert ON public.erp_renglones;
DROP POLICY IF EXISTS renglones_update ON public.erp_renglones;
DROP POLICY IF EXISTS renglones_delete ON public.erp_renglones;
DROP POLICY IF EXISTS "erp_renglones_read" ON public.erp_renglones;
DROP POLICY IF EXISTS "erp_renglones_write" ON public.erp_renglones;
CREATE POLICY renglones_select ON public.erp_renglones FOR SELECT TO authenticated USING (true);
CREATE POLICY renglones_insert ON public.erp_renglones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY renglones_update ON public.erp_renglones FOR UPDATE TO authenticated USING (true);
CREATE POLICY renglones_delete ON public.erp_renglones FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_insumos
DROP POLICY IF EXISTS insumos_select ON public.erp_insumos;
DROP POLICY IF EXISTS insumos_insert ON public.erp_insumos;
DROP POLICY IF EXISTS insumos_update ON public.erp_insumos;
DROP POLICY IF EXISTS insumos_delete ON public.erp_insumos;
DROP POLICY IF EXISTS "erp_insumos_read" ON public.erp_insumos;
DROP POLICY IF EXISTS "erp_insumos_write" ON public.erp_insumos;
CREATE POLICY insumos_select ON public.erp_insumos FOR SELECT TO authenticated USING (true);
CREATE POLICY insumos_insert ON public.erp_insumos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY insumos_update ON public.erp_insumos FOR UPDATE TO authenticated USING (true);
CREATE POLICY insumos_delete ON public.erp_insumos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_sub_renglones
DROP POLICY IF EXISTS subrenglones_select ON public.erp_sub_renglones;
DROP POLICY IF EXISTS subrenglones_insert ON public.erp_sub_renglones;
DROP POLICY IF EXISTS subrenglones_update ON public.erp_sub_renglones;
DROP POLICY IF EXISTS subrenglones_delete ON public.erp_sub_renglones;
DROP POLICY IF EXISTS "erp_sub_renglones_read" ON public.erp_sub_renglones;
DROP POLICY IF EXISTS "erp_sub_renglones_write" ON public.erp_sub_renglones;
CREATE POLICY subrenglones_select ON public.erp_sub_renglones FOR SELECT TO authenticated USING (true);
CREATE POLICY subrenglones_insert ON public.erp_sub_renglones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY subrenglones_update ON public.erp_sub_renglones FOR UPDATE TO authenticated USING (true);
CREATE POLICY subrenglones_delete ON public.erp_sub_renglones FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_vales_salida
DROP POLICY IF EXISTS vales_salida_select ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_insert ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_update ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_delete ON public.erp_vales_salida;
DROP POLICY IF EXISTS "erp_vales_salida_read" ON public.erp_vales_salida;
DROP POLICY IF EXISTS "erp_vales_salida_write" ON public.erp_vales_salida;
CREATE POLICY vales_salida_select ON public.erp_vales_salida FOR SELECT TO authenticated USING (true);
CREATE POLICY vales_salida_insert ON public.erp_vales_salida FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vales_salida_update ON public.erp_vales_salida FOR UPDATE TO authenticated USING (true);
CREATE POLICY vales_salida_delete ON public.erp_vales_salida FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_insumos_base
DROP POLICY IF EXISTS insumos_base_select ON public.erp_insumos_base;
DROP POLICY IF EXISTS insumos_base_insert ON public.erp_insumos_base;
DROP POLICY IF EXISTS insumos_base_update ON public.erp_insumos_base;
DROP POLICY IF EXISTS insumos_base_delete ON public.erp_insumos_base;
DROP POLICY IF EXISTS insumos_base_read ON public.erp_insumos_base;
DROP POLICY IF EXISTS insumos_base_write ON public.erp_insumos_base;
CREATE POLICY insumos_base_select ON public.erp_insumos_base FOR SELECT TO authenticated USING (true);
CREATE POLICY insumos_base_insert ON public.erp_insumos_base FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY insumos_base_update ON public.erp_insumos_base FOR UPDATE TO authenticated USING (true);
CREATE POLICY insumos_base_delete ON public.erp_insumos_base FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_rendimientos_cuadrilla
DROP POLICY IF EXISTS rendimientos_select ON public.erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS rendimientos_insert ON public.erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS rendimientos_update ON public.erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS rendimientos_delete ON public.erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS rendimientos_read ON public.erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS rendimientos_write ON public.erp_rendimientos_cuadrilla;
CREATE POLICY rendimientos_select ON public.erp_rendimientos_cuadrilla FOR SELECT TO authenticated USING (true);
CREATE POLICY rendimientos_insert ON public.erp_rendimientos_cuadrilla FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY rendimientos_update ON public.erp_rendimientos_cuadrilla FOR UPDATE TO authenticated USING (true);
CREATE POLICY rendimientos_delete ON public.erp_rendimientos_cuadrilla FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- destajos
DROP POLICY IF EXISTS destajos_select ON public.destajos;
DROP POLICY IF EXISTS destajos_insert ON public.destajos;
DROP POLICY IF EXISTS destajos_update ON public.destajos;
DROP POLICY IF EXISTS destajos_delete ON public.destajos;
DROP POLICY IF EXISTS destajos_read ON public.destajos;
DROP POLICY IF EXISTS destajos_write ON public.destajos;
CREATE POLICY destajos_select ON public.destajos FOR SELECT TO authenticated USING (true);
CREATE POLICY destajos_insert ON public.destajos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY destajos_update ON public.destajos FOR UPDATE TO authenticated USING (true);
CREATE POLICY destajos_delete ON public.destajos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- cajas_chicas
DROP POLICY IF EXISTS cajas_chicas_select ON public.cajas_chicas;
DROP POLICY IF EXISTS cajas_chicas_insert ON public.cajas_chicas;
DROP POLICY IF EXISTS cajas_chicas_update ON public.cajas_chicas;
DROP POLICY IF EXISTS cajas_chicas_delete ON public.cajas_chicas;
DROP POLICY IF EXISTS cajas_chicas_read ON public.cajas_chicas;
DROP POLICY IF EXISTS cajas_chicas_write ON public.cajas_chicas;
CREATE POLICY cajas_chicas_select ON public.cajas_chicas FOR SELECT TO authenticated USING (true);
CREATE POLICY cajas_chicas_insert ON public.cajas_chicas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY cajas_chicas_update ON public.cajas_chicas FOR UPDATE TO authenticated USING (true);
CREATE POLICY cajas_chicas_delete ON public.cajas_chicas FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- activos_herramientas
DROP POLICY IF EXISTS activos_select ON public.activos_herramientas;
DROP POLICY IF EXISTS activos_insert ON public.activos_herramientas;
DROP POLICY IF EXISTS activos_update ON public.activos_herramientas;
DROP POLICY IF EXISTS activos_delete ON public.activos_herramientas;
DROP POLICY IF EXISTS activos_read ON public.activos_herramientas;
DROP POLICY IF EXISTS activos_write ON public.activos_herramientas;
CREATE POLICY activos_select ON public.activos_herramientas FOR SELECT TO authenticated USING (true);
CREATE POLICY activos_insert ON public.activos_herramientas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY activos_update ON public.activos_herramientas FOR UPDATE TO authenticated USING (true);
CREATE POLICY activos_delete ON public.activos_herramientas FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- cuadro_comparativo_proveedores
DROP POLICY IF EXISTS cuadro_select ON public.cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS cuadro_insert ON public.cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS cuadro_update ON public.cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS cuadro_delete ON public.cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS cuadro_read ON public.cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS cuadro_write ON public.cuadro_comparativo_proveedores;
CREATE POLICY cuadro_select ON public.cuadro_comparativo_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY cuadro_insert ON public.cuadro_comparativo_proveedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY cuadro_update ON public.cuadro_comparativo_proveedores FOR UPDATE TO authenticated USING (true);
CREATE POLICY cuadro_delete ON public.cuadro_comparativo_proveedores FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- cotizaciones
DROP POLICY IF EXISTS cotizaciones_select ON public.cotizaciones;
DROP POLICY IF EXISTS cotizaciones_insert ON public.cotizaciones;
DROP POLICY IF EXISTS cotizaciones_update ON public.cotizaciones;
DROP POLICY IF EXISTS cotizaciones_delete ON public.cotizaciones;
DROP POLICY IF EXISTS cotizaciones_read ON public.cotizaciones;
DROP POLICY IF EXISTS cotizaciones_write ON public.cotizaciones;
CREATE POLICY cotizaciones_select ON public.cotizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY cotizaciones_insert ON public.cotizaciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY cotizaciones_update ON public.cotizaciones FOR UPDATE TO authenticated USING (true);
CREATE POLICY cotizaciones_delete ON public.cotizaciones FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- anticipos
DROP POLICY IF EXISTS anticipos_select ON public.anticipos;
DROP POLICY IF EXISTS anticipos_insert ON public.anticipos;
DROP POLICY IF EXISTS anticipos_update ON public.anticipos;
DROP POLICY IF EXISTS anticipos_delete ON public.anticipos;
DROP POLICY IF EXISTS anticipos_read ON public.anticipos;
DROP POLICY IF EXISTS anticipos_write ON public.anticipos;
CREATE POLICY anticipos_select ON public.anticipos FOR SELECT TO authenticated USING (true);
CREATE POLICY anticipos_insert ON public.anticipos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY anticipos_update ON public.anticipos FOR UPDATE TO authenticated USING (true);
CREATE POLICY anticipos_delete ON public.anticipos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- amortizaciones
DROP POLICY IF EXISTS amortizaciones_select ON public.amortizaciones;
DROP POLICY IF EXISTS amortizaciones_insert ON public.amortizaciones;
DROP POLICY IF EXISTS amortizaciones_update ON public.amortizaciones;
DROP POLICY IF EXISTS amortizaciones_delete ON public.amortizaciones;
DROP POLICY IF EXISTS amortizaciones_read ON public.amortizaciones;
DROP POLICY IF EXISTS amortizaciones_write ON public.amortizaciones;
CREATE POLICY amortizaciones_select ON public.amortizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY amortizaciones_insert ON public.amortizaciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY amortizaciones_update ON public.amortizaciones FOR UPDATE TO authenticated USING (true);
CREATE POLICY amortizaciones_delete ON public.amortizaciones FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- pagos_proveedores
DROP POLICY IF EXISTS pagos_select ON public.pagos_proveedores;
DROP POLICY IF EXISTS pagos_insert ON public.pagos_proveedores;
DROP POLICY IF EXISTS pagos_update ON public.pagos_proveedores;
DROP POLICY IF EXISTS pagos_delete ON public.pagos_proveedores;
DROP POLICY IF EXISTS pagos_read ON public.pagos_proveedores;
DROP POLICY IF EXISTS pagos_write ON public.pagos_proveedores;
CREATE POLICY pagos_select ON public.pagos_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY pagos_insert ON public.pagos_proveedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY pagos_update ON public.pagos_proveedores FOR UPDATE TO authenticated USING (true);
CREATE POLICY pagos_delete ON public.pagos_proveedores FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- ventas_paquetes
DROP POLICY IF EXISTS ventas_select ON public.ventas_paquetes;
DROP POLICY IF EXISTS ventas_insert ON public.ventas_paquetes;
DROP POLICY IF EXISTS ventas_update ON public.ventas_paquetes;
DROP POLICY IF EXISTS ventas_delete ON public.ventas_paquetes;
DROP POLICY IF EXISTS ventas_read ON public.ventas_paquetes;
DROP POLICY IF EXISTS ventas_write ON public.ventas_paquetes;
CREATE POLICY ventas_select ON public.ventas_paquetes FOR SELECT TO authenticated USING (true);
CREATE POLICY ventas_insert ON public.ventas_paquetes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ventas_update ON public.ventas_paquetes FOR UPDATE TO authenticated USING (true);
CREATE POLICY ventas_delete ON public.ventas_paquetes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- centros_costo
DROP POLICY IF EXISTS centros_costo_select ON public.centros_costo;
DROP POLICY IF EXISTS centros_costo_insert ON public.centros_costo;
DROP POLICY IF EXISTS centros_costo_update ON public.centros_costo;
DROP POLICY IF EXISTS centros_costo_delete ON public.centros_costo;
DROP POLICY IF EXISTS centros_costo_read ON public.centros_costo;
DROP POLICY IF EXISTS centros_costo_write ON public.centros_costo;
CREATE POLICY centros_costo_select ON public.centros_costo FOR SELECT TO authenticated USING (true);
CREATE POLICY centros_costo_insert ON public.centros_costo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY centros_costo_update ON public.centros_costo FOR UPDATE TO authenticated USING (true);
CREATE POLICY centros_costo_delete ON public.centros_costo FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- logs_sistema
DROP POLICY IF EXISTS logs_sistema_insert ON public.logs_sistema;
DROP POLICY IF EXISTS logs_sistema_select ON public.logs_sistema;
DROP POLICY IF EXISTS logs_sistema_create ON public.logs_sistema;
DROP POLICY IF EXISTS logs_sistema_update ON public.logs_sistema;
DROP POLICY IF EXISTS logs_sistema_delete ON public.logs_sistema;
CREATE POLICY logs_sistema_insert ON public.logs_sistema FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY logs_sistema_select ON public.logs_sistema FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente'))
);

-- erp_auditoria
DROP POLICY IF EXISTS auditoria_select ON public.erp_auditoria;
DROP POLICY IF EXISTS auditoria_insert ON public.erp_auditoria;
DROP POLICY IF EXISTS auditoria_update ON public.erp_auditoria;
DROP POLICY IF EXISTS auditoria_delete ON public.erp_auditoria;
CREATE POLICY auditoria_select ON public.erp_auditoria FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente'))
);
CREATE POLICY auditoria_insert ON public.erp_auditoria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auditoria_update ON public.erp_auditoria FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);
CREATE POLICY auditoria_delete ON public.erp_auditoria FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);


-- =============================================================
-- PARTE 7: TRIGGER updated_at AUTOMATICO
-- =============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_proyectos;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_proyectos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_movimientos;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_movimientos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_empleados;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_empleados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_materiales;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_materiales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_ordenes_compra;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_ordenes_compra FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_proveedores;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_proveedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_eventos_calendario;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_eventos_calendario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_bitacora;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_bitacora FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_seguimiento;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_seguimiento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_renglones;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_renglones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_insumos;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_insumos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_sub_renglones;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_sub_renglones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_vales_salida;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_vales_salida FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.erp_rendimientos_cuadrilla;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_rendimientos_cuadrilla FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =============================================================
-- PARTE 8: SOLO salazaroliveros@gmail.com = Administrador
-- =============================================================

UPDATE public.profiles
SET rol = 'Residente'
WHERE rol = 'Administrador'
  AND id NOT IN (
    SELECT id FROM auth.users WHERE email = 'salazaroliveros@gmail.com'
  );

INSERT INTO public.profiles (id, nombre, rol)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Admin'), 'Administrador'
FROM auth.users
WHERE email = 'salazaroliveros@gmail.com'
ON CONFLICT (id) DO UPDATE SET rol = 'Administrador';


-- =============================================================
-- PARTE 9: TRIGGER PERMANENTE - Solo 1 Administrador
-- =============================================================
-- Evita que cualquier usuario distinto de salazaroliveros@gmail.com
-- obtenga el rol Administrador en cualquier momento futuro.
-- =============================================================

CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rol = 'Administrador' THEN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users WHERE id = NEW.id AND email = 'salazaroliveros@gmail.com'
    ) THEN
      NEW.rol = 'Residente';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_single_admin ON public.profiles;
CREATE TRIGGER enforce_single_admin
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();


-- =============================================================
-- VERIFICACION FINAL
-- =============================================================

SELECT tablename, COUNT(*) AS total_politicas,
  string_agg(policyname, ', ' ORDER BY cmd) AS politicas
FROM pg_policies WHERE schemaname = 'public'
GROUP BY tablename ORDER BY tablename;

SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'verificar_rol_usuario';

SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND trigger_name = 'enforce_single_admin';
