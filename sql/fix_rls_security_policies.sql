-- =============================================================
-- FIX: POLÍTICAS RLS SEGURAS + CORRECCIÓN VULNERABILIDADES
-- =============================================================
-- Reemplaza todas las políticas USING(true) por políticas
-- granulares basadas en el rol del usuario desde profiles
--
-- Fecha: 06/03/2026
-- =============================================================

-- 1) CORREGIR erp_presupuestos
ALTER TABLE public.erp_presupuestos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS presupuestos_select ON public.erp_presupuestos;
CREATE POLICY presupuestos_select ON public.erp_presupuestos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS presupuestos_insert ON public.erp_presupuestos;
CREATE POLICY presupuestos_insert ON public.erp_presupuestos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
  );

DROP POLICY IF EXISTS presupuestos_update ON public.erp_presupuestos;
CREATE POLICY presupuestos_update ON public.erp_presupuestos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS presupuestos_delete ON public.erp_presupuestos;
CREATE POLICY presupuestos_delete ON public.erp_presupuestos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'Administrador'
    )
    OR auth.uid() = created_by
  );


-- 2) CORREGIR logs_sistema
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS logs_sistema_insert ON public.logs_sistema;
DROP POLICY IF EXISTS logs_sistema_select ON public.logs_sistema;

CREATE POLICY logs_sistema_insert ON public.logs_sistema
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero')
    )
  );

CREATE POLICY logs_sistema_select ON public.logs_sistema
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );


-- 3) FIX: SECURITY DEFINER → SECURITY INVOKER en funciones de auditoría
CREATE OR REPLACE FUNCTION public.fn_log_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_old_json jsonb;
  v_new_json jsonb;
  v_user_name text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old_json = to_jsonb(OLD);
    v_new_json = to_jsonb(NEW);
    SELECT COALESCE(nombre, 'unknown') INTO v_user_name FROM public.profiles WHERE id = auth.uid();
    INSERT INTO public.logs_sistema (usuario_id, usuario_nombre, accion, entidad, entidad_id, valores_anteriores, valores_nuevos)
      VALUES (auth.uid(), v_user_name, 'UPDATE', TG_TABLE_NAME, COALESCE(OLD.id::text, NEW.id::text), v_old_json, v_new_json);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_json = to_jsonb(OLD);
    SELECT COALESCE(nombre, 'unknown') INTO v_user_name FROM public.profiles WHERE id = auth.uid();
    INSERT INTO public.logs_sistema (usuario_id, usuario_nombre, accion, entidad, entidad_id, valores_anteriores)
      VALUES (auth.uid(), v_user_name, 'DELETE', TG_TABLE_NAME, OLD.id::text, v_old_json);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.fn_recalcular_presupuestos_por_insumo()
RETURNS TRIGGER AS $$
DECLARE
  v_renglon_ids uuid[];
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.precio IS DISTINCT FROM NEW.precio THEN
    SELECT array_agg(DISTINCT ri.renglon_id) INTO v_renglon_ids FROM public.erp_insumos ri WHERE ri.id = NEW.id;
    INSERT INTO public.logs_sistema (usuario_id, usuario_nombre, accion, entidad, entidad_id, valores_anteriores, valores_nuevos)
      VALUES (auth.uid(), 'system', 'PRECIO_INSUMO_CAMBIADO', 'erp_insumos', NEW.id::text,
        jsonb_build_object('precio_anterior', OLD.precio),
        jsonb_build_object('precio_nuevo', NEW.precio, 'renglones_afectados', v_renglon_ids));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;


-- 4) FUNCIÓN AUXILIAR: Verificar rol del usuario
CREATE OR REPLACE FUNCTION public.verificar_rol_usuario()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'user_id', auth.uid(),
    'rol', (SELECT rol FROM public.profiles WHERE id = auth.uid()),
    'nombre', (SELECT nombre FROM public.profiles WHERE id = auth.uid()),
    'authenticated', (auth.role() = 'authenticated')
  );
$$;

REVOKE ALL ON FUNCTION public.verificar_rol_usuario FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_rol_usuario TO authenticated;


-- 5) POLÍTICAS de perfil
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR (
    SELECT rol FROM public.profiles WHERE id = auth.uid()
  ) IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- 6) POLÍTICAS de proyecto
DROP POLICY IF EXISTS proyectos_select ON public.erp_proyectos;
CREATE POLICY proyectos_select ON public.erp_proyectos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS proyectos_insert ON public.erp_proyectos;
CREATE POLICY proyectos_insert ON public.erp_proyectos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );


-- 7) POLÍTICAS para erp_materiales
DROP POLICY IF EXISTS materiales_select ON public.erp_materiales;
CREATE POLICY materiales_select ON public.erp_materiales
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS materiales_update ON public.erp_materiales;
CREATE POLICY materiales_update ON public.erp_materiales
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS materiales_insert ON public.erp_materiales;
CREATE POLICY materiales_insert ON public.erp_materiales
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero')
    )
  );


-- 8) POLÍTICAS para tablas recientes
ALTER TABLE public.destajos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS destajos_select ON public.destajos;
CREATE POLICY destajos_select ON public.destajos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
    OR auth.uid() = registrado_por
  );

DROP POLICY IF EXISTS destajos_write ON public.destajos;
CREATE POLICY destajos_write ON public.destajos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
  );

ALTER TABLE public.cajas_chicas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cajas_chicas_select ON public.cajas_chicas;
CREATE POLICY cajas_chicas_select ON public.cajas_chicas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS cajas_chicas_write ON public.cajas_chicas;
CREATE POLICY cajas_chicas_write ON public.cajas_chicas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente', 'Compras')
    )
  );

ALTER TABLE public.activos_herramientas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS activos_herramientas_select ON public.activos_herramientas;
CREATE POLICY activos_herramientas_select ON public.activos_herramientas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero', 'Residente')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS activos_herramientas_write ON public.activos_herramientas;
CREATE POLICY activos_herramientas_write ON public.activos_herramientas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero')
    )
  );

ALTER TABLE public.cuadro_comparativo_proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cuadro_select ON public.cuadro_comparativo_proveedores;
CREATE POLICY cuadro_select ON public.cuadro_comparativo_proveedores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS cuadro_write ON public.cuadro_comparativo_proveedores;
CREATE POLICY cuadro_write ON public.cuadro_comparativo_proveedores
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
  );

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cotizaciones_select ON public.cotizaciones;
CREATE POLICY cotizaciones_select ON public.cotizaciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
    OR EXISTS (
      SELECT 1 FROM public.cuadro_comparativo_proveedores c
      WHERE c.id = cotizaciones.cuadro_id
      AND c.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS cotizaciones_write ON public.cotizaciones;
CREATE POLICY cotizaciones_write ON public.cotizaciones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
  );

ALTER TABLE public.anticipos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anticipos_select ON public.anticipos;
CREATE POLICY anticipos_select ON public.anticipos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS anticipos_write ON public.anticipos;
CREATE POLICY anticipos_write ON public.anticipos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
  );

ALTER TABLE public.amortizaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amortizaciones_select ON public.amortizaciones;
CREATE POLICY amortizaciones_select ON public.amortizaciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS amortizaciones_write ON public.amortizaciones;
CREATE POLICY amortizaciones_write ON public.amortizaciones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
  );

ALTER TABLE public.pagos_proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pagos_proveedores_select ON public.pagos_proveedores;
CREATE POLICY pagos_proveedores_select ON public.pagos_proveedores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS pagos_proveedores_write ON public.pagos_proveedores;
CREATE POLICY pagos_proveedores_write ON public.pagos_proveedores
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
  );

ALTER TABLE public.ventas_paquetes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ventas_paquetes_select ON public.ventas_paquetes;
CREATE POLICY ventas_paquetes_select ON public.ventas_paquetes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS ventas_paquetes_write ON public.ventas_paquetes;
CREATE POLICY ventas_paquetes_write ON public.ventas_paquetes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

ALTER TABLE public.centros_costo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS centros_costo_select ON public.centros_costo;
CREATE POLICY centros_costo_select ON public.centros_costo
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
  );

DROP POLICY IF EXISTS centros_costo_write ON public.centros_costo;
CREATE POLICY centros_costo_write ON public.centros_costo
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

ALTER TABLE public.erp_avances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS erp_avances_select ON public.erp_avances;
CREATE POLICY erp_avances_select ON public.erp_avances
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS erp_avances_write ON public.erp_avances;
CREATE POLICY erp_avances_write ON public.erp_avances
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
  );

ALTER TABLE public.erp_licitaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS erp_licitaciones_select ON public.erp_licitaciones;
CREATE POLICY erp_licitaciones_select ON public.erp_licitaciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS erp_licitaciones_write ON public.erp_licitaciones;
CREATE POLICY erp_licitaciones_write ON public.erp_licitaciones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras')
    )
  );

ALTER TABLE public.erp_vales_salida ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS erp_vales_salida_select ON public.erp_vales_salida;
CREATE POLICY erp_vales_salida_select ON public.erp_vales_salida
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
    OR auth.uid() = created_by
  );

DROP POLICY IF EXISTS erp_vales_salida_write ON public.erp_vales_salida;
CREATE POLICY erp_vales_salida_write ON public.erp_vales_salida
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
  );

ALTER TABLE public.erp_insumos_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS erp_insumos_base_select ON public.erp_insumos_base;
CREATE POLICY erp_insumos_base_select ON public.erp_insumos_base
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS erp_insumos_base_write ON public.erp_insumos_base;
CREATE POLICY erp_insumos_base_write ON public.erp_insumos_base
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

ALTER TABLE public.erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS erp_rendimientos_cuadrilla_select ON public.erp_rendimientos_cuadrilla;
CREATE POLICY erp_rendimientos_cuadrilla_select ON public.erp_rendimientos_cuadrilla
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS erp_rendimientos_cuadrilla_write ON public.erp_rendimientos_cuadrilla;
CREATE POLICY erp_rendimientos_cuadrilla_write ON public.erp_rendimientos_cuadrilla
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );


-- 9) VERIFICAR estado RLS en todas las tablas ERP
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE 'erp_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END$$;
