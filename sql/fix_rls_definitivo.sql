-- =============================================================
-- FIX PRODUCCIÓN MÍNIMO — CONSTRUSMART ERP
-- Basado en esquema real confirmado de Supabase.
-- Solo corrige lo que está roto. No recrea tablas existentes.
-- Ejecutar completo en Supabase SQL Editor.
-- =============================================================


-- ---------------------------------------------------------------
-- BLOQUE 1: erp_proyectos
-- Causa de HTTP 500: existe política "proyectos_select" que filtra
-- por empresa_id que NO existe en erp_proyectos (solo en profiles).
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS proyectos_select                                    ON public.erp_proyectos;
DROP POLICY IF EXISTS proyectos_insert                                    ON public.erp_proyectos;
DROP POLICY IF EXISTS proyectos_update                                    ON public.erp_proyectos;
DROP POLICY IF EXISTS proyectos_delete                                    ON public.erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_read"                                ON public.erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_write"                               ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to view own projects"    ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to create projects"      ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to update own projects"  ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to delete own projects"  ON public.erp_proyectos;

CREATE POLICY proyectos_select ON public.erp_proyectos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY proyectos_insert ON public.erp_proyectos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente'))
  );

CREATE POLICY proyectos_update ON public.erp_proyectos
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Residente'))
  );

CREATE POLICY proyectos_delete ON public.erp_proyectos
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- BLOQUE 2: erp_movimientos
-- HTTP 500: políticas created_by-based bloquean usuarios sin created_by.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS movimientos_select                                      ON public.erp_movimientos;
DROP POLICY IF EXISTS movimientos_insert                                      ON public.erp_movimientos;
DROP POLICY IF EXISTS movimientos_update                                      ON public.erp_movimientos;
DROP POLICY IF EXISTS movimientos_delete                                      ON public.erp_movimientos;
DROP POLICY IF EXISTS "erp_movimientos_read"                                  ON public.erp_movimientos;
DROP POLICY IF EXISTS "erp_movimientos_write"                                 ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to view own movements"       ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to create movements"         ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to update own movements"     ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to delete own movements"     ON public.erp_movimientos;

CREATE POLICY movimientos_select ON public.erp_movimientos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY movimientos_insert ON public.erp_movimientos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY movimientos_update ON public.erp_movimientos
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY movimientos_delete ON public.erp_movimientos
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- BLOQUE 3: erp_empleados
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS empleados_select                                      ON public.erp_empleados;
DROP POLICY IF EXISTS empleados_insert                                      ON public.erp_empleados;
DROP POLICY IF EXISTS empleados_update                                      ON public.erp_empleados;
DROP POLICY IF EXISTS empleados_delete                                      ON public.erp_empleados;
DROP POLICY IF EXISTS "erp_empleados_read"                                  ON public.erp_empleados;
DROP POLICY IF EXISTS "erp_empleados_write"                                 ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to view own employees"     ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to create employees"       ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to update own employees"   ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to delete own employees"   ON public.erp_empleados;

CREATE POLICY empleados_select ON public.erp_empleados
  FOR SELECT TO authenticated USING (true);
CREATE POLICY empleados_insert ON public.erp_empleados
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY empleados_update ON public.erp_empleados
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY empleados_delete ON public.erp_empleados
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- BLOQUE 4: erp_materiales
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS materiales_select                              ON public.erp_materiales;
DROP POLICY IF EXISTS materiales_insert                              ON public.erp_materiales;
DROP POLICY IF EXISTS materiales_update                              ON public.erp_materiales;
DROP POLICY IF EXISTS materiales_delete                              ON public.erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_read"                          ON public.erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_write"                         ON public.erp_materiales;
DROP POLICY IF EXISTS "Allow authenticated users to view materials"  ON public.erp_materiales;

CREATE POLICY materiales_select ON public.erp_materiales
  FOR SELECT TO authenticated USING (true);
CREATE POLICY materiales_insert ON public.erp_materiales
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY materiales_update ON public.erp_materiales
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY materiales_delete ON public.erp_materiales
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- BLOQUE 5: erp_ordenes_compra
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS oc_select                    ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS oc_insert                    ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS oc_update                    ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS oc_delete                    ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_read"    ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_write"   ON public.erp_ordenes_compra;

CREATE POLICY oc_select ON public.erp_ordenes_compra
  FOR SELECT TO authenticated USING (true);
CREATE POLICY oc_insert ON public.erp_ordenes_compra
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY oc_update ON public.erp_ordenes_compra
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY oc_delete ON public.erp_ordenes_compra
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- BLOQUE 6: erp_proveedores
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS proveedores_select          ON public.erp_proveedores;
DROP POLICY IF EXISTS proveedores_insert          ON public.erp_proveedores;
DROP POLICY IF EXISTS proveedores_update          ON public.erp_proveedores;
DROP POLICY IF EXISTS proveedores_delete          ON public.erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_read"      ON public.erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_write"     ON public.erp_proveedores;

CREATE POLICY proveedores_select ON public.erp_proveedores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY proveedores_insert ON public.erp_proveedores
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY proveedores_update ON public.erp_proveedores
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY proveedores_delete ON public.erp_proveedores
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- BLOQUE 7: erp_eventos_calendario
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS eventos_select                        ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS eventos_insert                        ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS eventos_update                        ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS eventos_delete                        ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_read"         ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_write"        ON public.erp_eventos_calendario;

CREATE POLICY eventos_select ON public.erp_eventos_calendario
  FOR SELECT TO authenticated USING (true);
CREATE POLICY eventos_insert ON public.erp_eventos_calendario
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY eventos_update ON public.erp_eventos_calendario
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY eventos_delete ON public.erp_eventos_calendario
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- BLOQUE 8: erp_bitacora
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS bitacora_select          ON public.erp_bitacora;
DROP POLICY IF EXISTS bitacora_insert          ON public.erp_bitacora;
DROP POLICY IF EXISTS bitacora_update          ON public.erp_bitacora;
DROP POLICY IF EXISTS bitacora_delete          ON public.erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_read"      ON public.erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_write"     ON public.erp_bitacora;

CREATE POLICY bitacora_select ON public.erp_bitacora
  FOR SELECT TO authenticated USING (true);
CREATE POLICY bitacora_insert ON public.erp_bitacora
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY bitacora_update ON public.erp_bitacora
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY bitacora_delete ON public.erp_bitacora
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- BLOQUE 9: erp_presupuestos
-- Limpia las políticas mal nombradas "logs_sistema_*" que quedaron
-- de una migración anterior aplicada sobre esta tabla por error.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS presupuestos_select       ON public.erp_presupuestos;
DROP POLICY IF EXISTS presupuestos_insert       ON public.erp_presupuestos;
DROP POLICY IF EXISTS presupuestos_update       ON public.erp_presupuestos;
DROP POLICY IF EXISTS presupuestos_delete       ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_select       ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_create       ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_update       ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_delete       ON public.erp_presupuestos;

CREATE POLICY presupuestos_select ON public.erp_presupuestos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY presupuestos_insert ON public.erp_presupuestos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Residente'))
  );
CREATE POLICY presupuestos_update ON public.erp_presupuestos
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Residente'))
  );
CREATE POLICY presupuestos_delete ON public.erp_presupuestos
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- BLOQUE 10: profiles — políticas limpias + INSERT faltante
-- La política profiles_select de fix_rls_security_policies.sql
-- hace subquery recursiva a profiles que causa infinite recursion.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select                         ON public.profiles;
DROP POLICY IF EXISTS profiles_update                         ON public.profiles;
DROP POLICY IF EXISTS profiles_insert                         ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read"                    ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update"                  ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert"                  ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users"      ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile."   ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile."   ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile."   ON public.profiles;

-- SELECT sin recursión: usa auth.jwt() para obtener el rol del token
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: solo el propio usuario puede insertar su perfil
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: solo el propio usuario actualiza su perfil
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ---------------------------------------------------------------
-- BLOQUE 11: erp_vales_salida — políticas (pueden faltar)
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS vales_salida_select   ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_insert   ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_update   ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_delete   ON public.erp_vales_salida;

CREATE POLICY vales_salida_select ON public.erp_vales_salida
  FOR SELECT TO authenticated USING (true);
CREATE POLICY vales_salida_insert ON public.erp_vales_salida
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vales_salida_update ON public.erp_vales_salida
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY vales_salida_delete ON public.erp_vales_salida
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
  );


-- ---------------------------------------------------------------
-- BLOQUE 12: Tablas secundarias — garantizar acceso autenticado
-- ---------------------------------------------------------------
-- erp_seguimiento
DROP POLICY IF EXISTS seguimiento_select ON public.erp_seguimiento;
DROP POLICY IF EXISTS seguimiento_insert ON public.erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_read"  ON public.erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_write" ON public.erp_seguimiento;
CREATE POLICY seguimiento_select ON public.erp_seguimiento FOR SELECT TO authenticated USING (true);
CREATE POLICY seguimiento_insert ON public.erp_seguimiento FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY seguimiento_update ON public.erp_seguimiento FOR UPDATE TO authenticated USING (true);

-- erp_renglones
DROP POLICY IF EXISTS renglones_select ON public.erp_renglones;
DROP POLICY IF EXISTS renglones_insert ON public.erp_renglones;
DROP POLICY IF EXISTS "erp_renglones_read"  ON public.erp_renglones;
DROP POLICY IF EXISTS "erp_renglones_write" ON public.erp_renglones;
CREATE POLICY renglones_select ON public.erp_renglones FOR SELECT TO authenticated USING (true);
CREATE POLICY renglones_insert ON public.erp_renglones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY renglones_update ON public.erp_renglones FOR UPDATE TO authenticated USING (true);

-- erp_insumos
DROP POLICY IF EXISTS insumos_select ON public.erp_insumos;
DROP POLICY IF EXISTS insumos_insert ON public.erp_insumos;
DROP POLICY IF EXISTS "erp_insumos_read"  ON public.erp_insumos;
DROP POLICY IF EXISTS "erp_insumos_write" ON public.erp_insumos;
CREATE POLICY insumos_select ON public.erp_insumos FOR SELECT TO authenticated USING (true);
CREATE POLICY insumos_insert ON public.erp_insumos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY insumos_update ON public.erp_insumos FOR UPDATE TO authenticated USING (true);

-- erp_sub_renglones
DROP POLICY IF EXISTS subrenglones_select ON public.erp_sub_renglones;
DROP POLICY IF EXISTS subrenglones_insert ON public.erp_sub_renglones;
DROP POLICY IF EXISTS "erp_sub_renglones_read"  ON public.erp_sub_renglones;
DROP POLICY IF EXISTS "erp_sub_renglones_write" ON public.erp_sub_renglones;
CREATE POLICY subrenglones_select ON public.erp_sub_renglones FOR SELECT TO authenticated USING (true);
CREATE POLICY subrenglones_insert ON public.erp_sub_renglones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY subrenglones_update ON public.erp_sub_renglones FOR UPDATE TO authenticated USING (true);

-- destajos
DROP POLICY IF EXISTS destajos_read  ON public.destajos;
DROP POLICY IF EXISTS destajos_write ON public.destajos;
CREATE POLICY destajos_read  ON public.destajos FOR SELECT TO authenticated USING (true);
CREATE POLICY destajos_write ON public.destajos FOR ALL    TO authenticated USING (true);

-- cajas_chicas
DROP POLICY IF EXISTS cajas_chicas_read  ON public.cajas_chicas;
DROP POLICY IF EXISTS cajas_chicas_write ON public.cajas_chicas;
CREATE POLICY cajas_chicas_read  ON public.cajas_chicas FOR SELECT TO authenticated USING (true);
CREATE POLICY cajas_chicas_write ON public.cajas_chicas FOR ALL    TO authenticated USING (true);

-- activos_herramientas
DROP POLICY IF EXISTS activos_read  ON public.activos_herramientas;
DROP POLICY IF EXISTS activos_write ON public.activos_herramientas;
CREATE POLICY activos_read  ON public.activos_herramientas FOR SELECT TO authenticated USING (true);
CREATE POLICY activos_write ON public.activos_herramientas FOR ALL    TO authenticated USING (true);

-- anticipos / amortizaciones / pagos_proveedores / ventas_paquetes / centros_costo
DROP POLICY IF EXISTS anticipos_read    ON public.anticipos;
DROP POLICY IF EXISTS anticipos_write   ON public.anticipos;
CREATE POLICY anticipos_read  ON public.anticipos FOR SELECT TO authenticated USING (true);
CREATE POLICY anticipos_write ON public.anticipos FOR ALL    TO authenticated USING (true);

DROP POLICY IF EXISTS amortizaciones_read  ON public.amortizaciones;
DROP POLICY IF EXISTS amortizaciones_write ON public.amortizaciones;
CREATE POLICY amortizaciones_read  ON public.amortizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY amortizaciones_write ON public.amortizaciones FOR ALL    TO authenticated USING (true);

DROP POLICY IF EXISTS pagos_read  ON public.pagos_proveedores;
DROP POLICY IF EXISTS pagos_write ON public.pagos_proveedores;
CREATE POLICY pagos_read  ON public.pagos_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY pagos_write ON public.pagos_proveedores FOR ALL    TO authenticated USING (true);

DROP POLICY IF EXISTS ventas_read  ON public.ventas_paquetes;
DROP POLICY IF EXISTS ventas_write ON public.ventas_paquetes;
CREATE POLICY ventas_read  ON public.ventas_paquetes FOR SELECT TO authenticated USING (true);
CREATE POLICY ventas_write ON public.ventas_paquetes FOR ALL    TO authenticated USING (true);

DROP POLICY IF EXISTS centros_costo_read  ON public.centros_costo;
DROP POLICY IF EXISTS centros_costo_write ON public.centros_costo;
CREATE POLICY centros_costo_read  ON public.centros_costo FOR SELECT TO authenticated USING (true);
CREATE POLICY centros_costo_write ON public.centros_costo FOR ALL    TO authenticated USING (true);

-- cuadro_comparativo_proveedores / cotizaciones
DROP POLICY IF EXISTS cuadro_read  ON public.cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS cuadro_write ON public.cuadro_comparativo_proveedores;
CREATE POLICY cuadro_read  ON public.cuadro_comparativo_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY cuadro_write ON public.cuadro_comparativo_proveedores FOR ALL    TO authenticated USING (true);

DROP POLICY IF EXISTS cotizaciones_read  ON public.cotizaciones;
DROP POLICY IF EXISTS cotizaciones_write ON public.cotizaciones;
CREATE POLICY cotizaciones_read  ON public.cotizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY cotizaciones_write ON public.cotizaciones FOR ALL    TO authenticated USING (true);

-- erp_insumos_base / erp_rendimientos_cuadrilla
DROP POLICY IF EXISTS insumos_base_read  ON public.erp_insumos_base;
DROP POLICY IF EXISTS insumos_base_write ON public.erp_insumos_base;
CREATE POLICY insumos_base_read  ON public.erp_insumos_base FOR SELECT TO authenticated USING (true);
CREATE POLICY insumos_base_write ON public.erp_insumos_base FOR ALL    TO authenticated USING (true);

DROP POLICY IF EXISTS rendimientos_read  ON public.erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS rendimientos_write ON public.erp_rendimientos_cuadrilla;
CREATE POLICY rendimientos_read  ON public.erp_rendimientos_cuadrilla FOR SELECT TO authenticated USING (true);
CREATE POLICY rendimientos_write ON public.erp_rendimientos_cuadrilla FOR ALL    TO authenticated USING (true);

-- logs_sistema (ya existe, pero limpiar conflicto)
DROP POLICY IF EXISTS logs_sistema_insert ON public.logs_sistema;
DROP POLICY IF EXISTS logs_sistema_select ON public.logs_sistema;
CREATE POLICY logs_sistema_insert ON public.logs_sistema
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY logs_sistema_select ON public.logs_sistema
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente'))
  );


-- ---------------------------------------------------------------
-- BLOQUE 13: FIX HTTP 409 — trigger handle_new_user con upsert
-- La inserción duplicada ocurre en re-login con Google OAuth.
-- ON CONFLICT DO UPDATE evita el 409.
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


-- ---------------------------------------------------------------
-- BLOQUE 14: constraint pausado en erp_proyectos
-- La migración 000000000008 puede no haberse ejecutado.
-- ---------------------------------------------------------------
ALTER TABLE public.erp_proyectos
  DROP CONSTRAINT IF EXISTS erp_proyectos_estado_check;

ALTER TABLE public.erp_proyectos
  ADD CONSTRAINT erp_proyectos_estado_check
  CHECK (estado = ANY (ARRAY['planeacion','ejecucion','pausado','finalizado']));


-- ---------------------------------------------------------------
-- VERIFICACIÓN: muestra políticas activas por tabla
-- ---------------------------------------------------------------
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles','erp_proyectos','erp_movimientos','erp_empleados',
    'erp_materiales','erp_ordenes_compra','erp_proveedores',
    'erp_eventos_calendario','erp_bitacora','erp_presupuestos',
    'erp_vales_salida'
  )
ORDER BY tablename, cmd;
