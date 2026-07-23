-- Migración 135: endurecer políticas RLS de tablas con permisividad total (v2)
-- Corrige tipos de datos y relaciones foráneas

-- ============================================================
-- 1. erp_amortizaciones (acceso via anticipos.proyecto_id)
-- ============================================================

DROP POLICY IF EXISTS "amortizaciones_read" ON public.erp_amortizaciones;
DROP POLICY IF EXISTS "amortizaciones_write" ON public.erp_amortizaciones;
DROP POLICY IF EXISTS "amortizaciones_update" ON public.erp_amortizaciones;
DROP POLICY IF EXISTS "amortizaciones_delete" ON public.erp_amortizaciones;

CREATE POLICY "amortizaciones_select" ON public.erp_amortizaciones
  FOR SELECT TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    OR anticipo_id IN (
      SELECT erp_anticipos.id
      FROM erp_anticipos
      WHERE erp_anticipos.proyecto_id IN (SELECT get_accessible_proyectos())
    )
  );

CREATE POLICY "amortizaciones_insert" ON public.erp_amortizaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text, 'Compras'::text])
    AND anticipo_id IN (
      SELECT erp_anticipos.id
      FROM erp_anticipos
      WHERE erp_anticipos.proyecto_id IN (SELECT get_accessible_proyectos())
    )
  );

CREATE POLICY "amortizaciones_update" ON public.erp_amortizaciones
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text, 'Compras'::text])
    AND anticipo_id IN (
      SELECT erp_anticipos.id
      FROM erp_anticipos
      WHERE erp_anticipos.proyecto_id IN (SELECT get_accessible_proyectos())
    )
  );

CREATE POLICY "amortizaciones_delete" ON public.erp_amortizaciones
  FOR DELETE TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    OR anticipo_id IN (
      SELECT erp_anticipos.id
      FROM erp_anticipos
      WHERE erp_anticipos.proyecto_id IN (SELECT get_accessible_proyectos())
    )
  );

-- ============================================================
-- 2. erp_anticipos (acceso directo via proyecto_id)
-- ============================================================

DROP POLICY IF EXISTS "anticipos_read" ON public.erp_anticipos;
DROP POLICY IF EXISTS "anticipos_write" ON public.erp_anticipos;
DROP POLICY IF EXISTS "anticipos_update" ON public.erp_anticipos;
DROP POLICY IF EXISTS "anticipos_delete" ON public.erp_anticipos;

CREATE POLICY "anticipos_select" ON public.erp_anticipos
  FOR SELECT TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    OR proyecto_id IN (SELECT get_accessible_proyectos())
  );

CREATE POLICY "anticipos_insert" ON public.erp_anticipos
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text, 'Compras'::text])
    AND proyecto_id IN (SELECT get_accessible_proyectos())
  );

CREATE POLICY "anticipos_update" ON public.erp_anticipos
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text, 'Compras'::text])
    AND proyecto_id IN (SELECT get_accessible_proyectos())
  );

CREATE POLICY "anticipos_delete" ON public.erp_anticipos
  FOR DELETE TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    OR proyecto_id IN (SELECT get_accessible_proyectos())
  );

-- ============================================================
-- 3. erp_rendimientos_campo
-- ============================================================

DROP POLICY IF EXISTS "rendimientos_campo_read" ON public.erp_rendimientos_campo;
DROP POLICY IF EXISTS "rendimientos_campo_write" ON public.erp_rendimientos_campo;
DROP POLICY IF EXISTS "rendimientos_campo_update" ON public.erp_rendimientos_campo;
DROP POLICY IF EXISTS "rendimientos_campo_delete" ON public.erp_rendimientos_campo;

CREATE POLICY "rendimientos_campo_select" ON public.erp_rendimientos_campo
  FOR SELECT TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    OR proyecto_id IN (SELECT get_accessible_proyectos())
  );

CREATE POLICY "rendimientos_campo_insert" ON public.erp_rendimientos_campo
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text])
    AND proyecto_id IN (SELECT get_accessible_proyectos())
  );

CREATE POLICY "rendimientos_campo_update" ON public.erp_rendimientos_campo
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text])
    AND proyecto_id IN (SELECT get_accessible_proyectos())
  );

CREATE POLICY "rendimientos_campo_delete" ON public.erp_rendimientos_campo
  FOR DELETE TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    OR proyecto_id IN (SELECT get_accessible_proyectos())
  );

-- ============================================================
-- 4. erp_snapshots_estado_calculo (acceso via calculos.proyecto_id, casteado a uuid)
-- ============================================================

DROP POLICY IF EXISTS "snapshots_lectura_autenticados" ON public.erp_snapshots_estado_calculo;
DROP POLICY IF EXISTS "snapshots_escritura_autenticados" ON public.erp_snapshots_estado_calculo;

CREATE POLICY "snapshots_select" ON public.erp_snapshots_estado_calculo
  FOR SELECT TO authenticated
  USING (
    calculo_id IN (
      SELECT erp_calculos_proyecto.id
      FROM erp_calculos_proyecto
      WHERE erp_calculos_proyecto.proyecto_id::uuid IN (SELECT get_accessible_proyectos())
    )
    OR get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
  );

CREATE POLICY "snapshots_insert" ON public.erp_snapshots_estado_calculo
  FOR INSERT TO authenticated
  WITH CHECK (
    calculo_id IN (
      SELECT erp_calculos_proyecto.id
      FROM erp_calculos_proyecto
      WHERE erp_calculos_proyecto.proyecto_id::uuid IN (SELECT get_accessible_proyectos())
    )
    OR get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text])
  );

CREATE POLICY "snapshots_update" ON public.erp_snapshots_estado_calculo
  FOR UPDATE TO authenticated
  USING (
    calculo_id IN (
      SELECT erp_calculos_proyecto.id
      FROM erp_calculos_proyecto
      WHERE erp_calculos_proyecto.proyecto_id::uuid IN (SELECT get_accessible_proyectos())
    )
    OR get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
  );

CREATE POLICY "snapshots_delete" ON public.erp_snapshots_estado_calculo
  FOR DELETE TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    OR calculo_id IN (
      SELECT erp_calculos_proyecto.id
      FROM erp_calculos_proyecto
      WHERE erp_calculos_proyecto.proyecto_id::uuid IN (SELECT get_accessible_proyectos())
    )
  );
