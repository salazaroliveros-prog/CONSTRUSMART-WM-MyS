-- =============================================================
-- FIX PRODUCCIÓN DEFINITIVO — CONSTRUSMART ERP
-- Esquema confirmado según tabla real en Supabase
-- EJECUTAR COMPLETO en Supabase SQL Editor
-- =============================================================

-- ---------------------------------------------------------------
-- 1. PROFILES — fix trigger 409 (ON CONFLICT upsert)
--    + limpiar políticas duplicadas
-- ---------------------------------------------------------------
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
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    user_metadata = COALESCE(EXCLUDED.user_metadata, public.profiles.user_metadata);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Limpiar todas las políticas de profiles y recrear limpias
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile." ON public.profiles;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() AND p2.rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ---------------------------------------------------------------
-- 2. erp_proyectos — limpiar TODAS las políticas conflictivas
--    (la política con empresa_id causaba HTTP 500 porque esa
--     columna NO existe en erp_proyectos, solo en profiles)
-- ---------------------------------------------------------------
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

ALTER TABLE public.erp_proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY proyectos_select ON public.erp_proyectos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY proyectos_insert ON public.erp_proyectos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente'))
  );

CREATE POLICY proyectos_update ON public.erp_proyectos
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente'))
  );

CREATE POLICY proyectos_delete ON public.erp_proyectos
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- 3. erp_movimientos
-- ---------------------------------------------------------------
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

ALTER TABLE public.erp_movimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY movimientos_select ON public.erp_movimientos FOR SELECT TO authenticated USING (true);
CREATE POLICY movimientos_insert ON public.erp_movimientos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY movimientos_update ON public.erp_movimientos FOR UPDATE TO authenticated USING (true);
CREATE POLICY movimientos_delete ON public.erp_movimientos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);


-- ---------------------------------------------------------------
-- 4. erp_empleados
-- ---------------------------------------------------------------
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

ALTER TABLE public.erp_empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY empleados_select ON public.erp_empleados FOR SELECT TO authenticated USING (true);
CREATE POLICY empleados_insert ON public.erp_empleados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY empleados_update ON public.erp_empleados FOR UPDATE TO authenticated USING (true);
CREATE POLICY empleados_delete ON public.erp_empleados FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);


-- ---------------------------------------------------------------
-- 5. erp_materiales
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS materiales_select ON public.erp_materiales;
DROP POLICY IF EXISTS materiales_insert ON public.erp_materiales;
DROP POLICY IF EXISTS materiales_update ON public.erp_materiales;
DROP POLICY IF EXISTS materiales_delete ON public.erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_read" ON public.erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_write" ON public.erp_materiales;
DROP POLICY IF EXISTS "Allow authenticated users to view materials" ON public.erp_materiales;

ALTER TABLE public.erp_materiales ENABLE ROW LEVEL SECURITY;

CREATE POLICY materiales_select ON public.erp_materiales FOR SELECT TO authenticated USING (true);
CREATE POLICY materiales_insert ON public.erp_materiales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY materiales_update ON public.erp_materiales FOR UPDATE TO authenticated USING (true);
CREATE POLICY materiales_delete ON public.erp_materiales FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);


-- ---------------------------------------------------------------
-- 6. erp_ordenes_compra
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS oc_select ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS oc_insert ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS oc_update ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS oc_delete ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_read" ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_write" ON public.erp_ordenes_compra;

ALTER TABLE public.erp_ordenes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY oc_select ON public.erp_ordenes_compra FOR SELECT TO authenticated USING (true);
CREATE POLICY oc_insert ON public.erp_ordenes_compra FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY oc_update ON public.erp_ordenes_compra FOR UPDATE TO authenticated USING (true);
CREATE POLICY oc_delete ON public.erp_ordenes_compra FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);


-- ---------------------------------------------------------------
-- 7. erp_proveedores
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS proveedores_select ON public.erp_proveedores;
DROP POLICY IF EXISTS proveedores_insert ON public.erp_proveedores;
DROP POLICY IF EXISTS proveedores_update ON public.erp_proveedores;
DROP POLICY IF EXISTS proveedores_delete ON public.erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_read" ON public.erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_write" ON public.erp_proveedores;

ALTER TABLE public.erp_proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY proveedores_select ON public.erp_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY proveedores_insert ON public.erp_proveedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY proveedores_update ON public.erp_proveedores FOR UPDATE TO authenticated USING (true);
CREATE POLICY proveedores_delete ON public.erp_proveedores FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);


-- ---------------------------------------------------------------
-- 8. erp_eventos_calendario
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS eventos_select ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS eventos_insert ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS eventos_update ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS eventos_delete ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_read" ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_write" ON public.erp_eventos_calendario;

ALTER TABLE public.erp_eventos_calendario ENABLE ROW LEVEL SECURITY;

CREATE POLICY eventos_select ON public.erp_eventos_calendario FOR SELECT TO authenticated USING (true);
CREATE POLICY eventos_insert ON public.erp_eventos_calendario FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY eventos_update ON public.erp_eventos_calendario FOR UPDATE TO authenticated USING (true);
CREATE POLICY eventos_delete ON public.erp_eventos_calendario FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);


-- ---------------------------------------------------------------
-- 9. erp_bitacora
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS bitacora_select ON public.erp_bitacora;
DROP POLICY IF EXISTS bitacora_insert ON public.erp_bitacora;
DROP POLICY IF EXISTS bitacora_update ON public.erp_bitacora;
DROP POLICY IF EXISTS bitacora_delete ON public.erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_read" ON public.erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_write" ON public.erp_bitacora;

ALTER TABLE public.erp_bitacora ENABLE ROW LEVEL SECURITY;

CREATE POLICY bitacora_select ON public.erp_bitacora FOR SELECT TO authenticated USING (true);
CREATE POLICY bitacora_insert ON public.erp_bitacora FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY bitacora_update ON public.erp_bitacora FOR UPDATE TO authenticated USING (true);
CREATE POLICY bitacora_delete ON public.erp_bitacora FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);


-- ---------------------------------------------------------------
-- 10. erp_presupuestos — limpiar las políticas con nombre incorrecto
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS presupuestos_select ON public.erp_presupuestos;
DROP POLICY IF EXISTS presupuestos_insert ON public.erp_presupuestos;
DROP POLICY IF EXISTS presupuestos_update ON public.erp_presupuestos;
DROP POLICY IF EXISTS presupuestos_delete ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_select ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_create ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_update ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_delete ON public.erp_presupuestos;

ALTER TABLE public.erp_presupuestos ENABLE ROW LEVEL SECURITY;

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


-- ---------------------------------------------------------------
-- 11. Resto de tablas con políticas simples
-- ---------------------------------------------------------------
-- erp_vales_salida
DROP POLICY IF EXISTS vales_salida_select ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_insert ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_update ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_delete ON public.erp_vales_salida;
ALTER TABLE public.erp_vales_salida ENABLE ROW LEVEL SECURITY;
CREATE POLICY vales_salida_select ON public.erp_vales_salida FOR SELECT TO authenticated USING (true);
CREATE POLICY vales_salida_insert ON public.erp_vales_salida FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vales_salida_update ON public.erp_vales_salida FOR UPDATE TO authenticated USING (true);
CREATE POLICY vales_salida_delete ON public.erp_vales_salida FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- erp_seguimiento
DROP POLICY IF EXISTS seguimiento_select ON public.erp_seguimiento;
DROP POLICY IF EXISTS seguimiento_insert ON public.erp_seguimiento;
DROP POLICY IF EXISTS seguimiento_update ON public.erp_seguimiento;
DROP POLICY IF EXISTS seguimiento_delete ON public.erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_read" ON public.erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_write" ON public.erp_seguimiento;
ALTER TABLE public.erp_seguimiento ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.erp_renglones ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.erp_insumos ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.erp_sub_renglones ENABLE ROW LEVEL SECURITY;
CREATE POLICY subrenglones_select ON public.erp_sub_renglones FOR SELECT TO authenticated USING (true);
CREATE POLICY subrenglones_insert ON public.erp_sub_renglones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY subrenglones_update ON public.erp_sub_renglones FOR UPDATE TO authenticated USING (true);
CREATE POLICY subrenglones_delete ON public.erp_sub_renglones FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- logs_sistema
DROP POLICY IF EXISTS logs_sistema_insert ON public.logs_sistema;
DROP POLICY IF EXISTS logs_sistema_select ON public.logs_sistema;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_sistema_insert ON public.logs_sistema FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY logs_sistema_select ON public.logs_sistema FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente'))
);

-- destajos, cajas_chicas, activos_herramientas, anticipos, pagos_proveedores,
-- ventas_paquetes, centros_costo, erp_insumos_base, erp_rendimientos_cuadrilla
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'destajos','cajas_chicas','activos_herramientas',
    'cuadro_comparativo_proveedores','cotizaciones',
    'anticipos','amortizaciones','pagos_proveedores',
    'ventas_paquetes','centros_costo',
    'erp_insumos_base','erp_rendimientos_cuadrilla'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    -- DROP generic old policies
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I;', tbl, tbl);
    -- Recreate simple policies
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true);',
      tbl || '_select', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true);',
      tbl || '_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true);',
      tbl || '_update', tbl);
    EXECUTE format($fmt$CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
    );$fmt$, tbl || '_delete', tbl);
  END LOOP;
END$$;


-- ---------------------------------------------------------------
-- 12. Fix estado CHECK en erp_ordenes_compra
--     El código usa 'recibida' y 'cancelada' pero la DB solo tenía
--     borrador|pendiente|aprobado|rechazado
-- ---------------------------------------------------------------
ALTER TABLE public.erp_ordenes_compra
  DROP CONSTRAINT IF EXISTS erp_ordenes_compra_estado_check;

ALTER TABLE public.erp_ordenes_compra
  ADD CONSTRAINT erp_ordenes_compra_estado_check
  CHECK (estado = ANY (ARRAY['borrador','pendiente','aprobado','rechazado','recibida','cancelada']));


-- ---------------------------------------------------------------
-- 13. Fix estado CHECK en erp_presupuestos
--     El código usa 'revisado' pero la DB no lo tenía
-- ---------------------------------------------------------------
ALTER TABLE public.erp_presupuestos
  DROP CONSTRAINT IF EXISTS erp_presupuestos_estado_check;

ALTER TABLE public.erp_presupuestos
  ADD CONSTRAINT erp_presupuestos_estado_check
  CHECK (estado = ANY (ARRAY['borrador','aprobado','revisado','rechazado']));


-- ---------------------------------------------------------------
-- 14. VERIFICACIÓN FINAL
-- ---------------------------------------------------------------
SELECT
  t.tablename,
  t.rowsecurity,
  COUNT(p.policyname) AS num_policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'profiles','erp_proyectos','erp_movimientos','erp_empleados',
    'erp_materiales','erp_ordenes_compra','erp_proveedores',
    'erp_eventos_calendario','erp_bitacora','erp_presupuestos',
    'erp_vales_salida','erp_seguimiento'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
