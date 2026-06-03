-- =============================================================
-- FIX TABLAS SECUNDARIAS — Solo crea políticas que NO existen
-- Ejecutar en Supabase SQL Editor
-- =============================================================

DO $$
BEGIN

  -- ── erp_seguimiento ──────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_seguimiento' AND policyname='seguimiento_select') THEN
    CREATE POLICY seguimiento_select ON public.erp_seguimiento FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_seguimiento' AND policyname='seguimiento_insert') THEN
    CREATE POLICY seguimiento_insert ON public.erp_seguimiento FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_seguimiento' AND policyname='seguimiento_update') THEN
    CREATE POLICY seguimiento_update ON public.erp_seguimiento FOR UPDATE TO authenticated USING (true);
  END IF;

  -- ── erp_renglones ─────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_renglones' AND policyname='renglones_select') THEN
    CREATE POLICY renglones_select ON public.erp_renglones FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_renglones' AND policyname='renglones_insert') THEN
    CREATE POLICY renglones_insert ON public.erp_renglones FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_renglones' AND policyname='renglones_update') THEN
    CREATE POLICY renglones_update ON public.erp_renglones FOR UPDATE TO authenticated USING (true);
  END IF;

  -- ── erp_insumos ───────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_insumos' AND policyname='insumos_select') THEN
    CREATE POLICY insumos_select ON public.erp_insumos FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_insumos' AND policyname='insumos_insert') THEN
    CREATE POLICY insumos_insert ON public.erp_insumos FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_insumos' AND policyname='insumos_update') THEN
    CREATE POLICY insumos_update ON public.erp_insumos FOR UPDATE TO authenticated USING (true);
  END IF;

  -- ── erp_sub_renglones ─────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_sub_renglones' AND policyname='subrenglones_select') THEN
    CREATE POLICY subrenglones_select ON public.erp_sub_renglones FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_sub_renglones' AND policyname='subrenglones_insert') THEN
    CREATE POLICY subrenglones_insert ON public.erp_sub_renglones FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_sub_renglones' AND policyname='subrenglones_update') THEN
    CREATE POLICY subrenglones_update ON public.erp_sub_renglones FOR UPDATE TO authenticated USING (true);
  END IF;

  -- ── destajos ──────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='destajos' AND policyname='destajos_read') THEN
    CREATE POLICY destajos_read ON public.destajos FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='destajos' AND policyname='destajos_write') THEN
    CREATE POLICY destajos_write ON public.destajos FOR ALL TO authenticated USING (true);
  END IF;

  -- ── cajas_chicas ──────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cajas_chicas' AND policyname='cajas_chicas_read') THEN
    CREATE POLICY cajas_chicas_read ON public.cajas_chicas FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cajas_chicas' AND policyname='cajas_chicas_write') THEN
    CREATE POLICY cajas_chicas_write ON public.cajas_chicas FOR ALL TO authenticated USING (true);
  END IF;

  -- ── activos_herramientas ──────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activos_herramientas' AND policyname='activos_read') THEN
    CREATE POLICY activos_read ON public.activos_herramientas FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activos_herramientas' AND policyname='activos_write') THEN
    CREATE POLICY activos_write ON public.activos_herramientas FOR ALL TO authenticated USING (true);
  END IF;

  -- ── anticipos ─────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='anticipos' AND policyname='anticipos_read') THEN
    CREATE POLICY anticipos_read ON public.anticipos FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='anticipos' AND policyname='anticipos_write') THEN
    CREATE POLICY anticipos_write ON public.anticipos FOR ALL TO authenticated USING (true);
  END IF;

  -- ── amortizaciones ────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='amortizaciones' AND policyname='amortizaciones_read') THEN
    CREATE POLICY amortizaciones_read ON public.amortizaciones FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='amortizaciones' AND policyname='amortizaciones_write') THEN
    CREATE POLICY amortizaciones_write ON public.amortizaciones FOR ALL TO authenticated USING (true);
  END IF;

  -- ── pagos_proveedores ─────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pagos_proveedores' AND policyname='pagos_read') THEN
    CREATE POLICY pagos_read ON public.pagos_proveedores FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pagos_proveedores' AND policyname='pagos_write') THEN
    CREATE POLICY pagos_write ON public.pagos_proveedores FOR ALL TO authenticated USING (true);
  END IF;

  -- ── ventas_paquetes ───────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ventas_paquetes' AND policyname='ventas_read') THEN
    CREATE POLICY ventas_read ON public.ventas_paquetes FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ventas_paquetes' AND policyname='ventas_write') THEN
    CREATE POLICY ventas_write ON public.ventas_paquetes FOR ALL TO authenticated USING (true);
  END IF;

  -- ── centros_costo ─────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='centros_costo' AND policyname='centros_costo_read') THEN
    CREATE POLICY centros_costo_read ON public.centros_costo FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='centros_costo' AND policyname='centros_costo_write') THEN
    CREATE POLICY centros_costo_write ON public.centros_costo FOR ALL TO authenticated USING (true);
  END IF;

  -- ── cuadro_comparativo_proveedores ────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cuadro_comparativo_proveedores' AND policyname='cuadro_read') THEN
    CREATE POLICY cuadro_read ON public.cuadro_comparativo_proveedores FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cuadro_comparativo_proveedores' AND policyname='cuadro_write') THEN
    CREATE POLICY cuadro_write ON public.cuadro_comparativo_proveedores FOR ALL TO authenticated USING (true);
  END IF;

  -- ── cotizaciones ──────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cotizaciones' AND policyname='cotizaciones_read') THEN
    CREATE POLICY cotizaciones_read ON public.cotizaciones FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cotizaciones' AND policyname='cotizaciones_write') THEN
    CREATE POLICY cotizaciones_write ON public.cotizaciones FOR ALL TO authenticated USING (true);
  END IF;

  -- ── erp_insumos_base ──────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_insumos_base' AND policyname='insumos_base_read') THEN
    CREATE POLICY insumos_base_read ON public.erp_insumos_base FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_insumos_base' AND policyname='insumos_base_write') THEN
    CREATE POLICY insumos_base_write ON public.erp_insumos_base FOR ALL TO authenticated USING (true);
  END IF;

  -- ── erp_rendimientos_cuadrilla ────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_rendimientos_cuadrilla' AND policyname='rendimientos_read') THEN
    CREATE POLICY rendimientos_read ON public.erp_rendimientos_cuadrilla FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='erp_rendimientos_cuadrilla' AND policyname='rendimientos_write') THEN
    CREATE POLICY rendimientos_write ON public.erp_rendimientos_cuadrilla FOR ALL TO authenticated USING (true);
  END IF;

  -- ── logs_sistema ──────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='logs_sistema' AND policyname='logs_sistema_insert') THEN
    CREATE POLICY logs_sistema_insert ON public.logs_sistema FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='logs_sistema' AND policyname='logs_sistema_select') THEN
    CREATE POLICY logs_sistema_select ON public.logs_sistema FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente'))
    );
  END IF;

END$$;


-- ── FIX trigger handle_new_user: ON CONFLICT DO UPDATE ────────
-- Evita HTTP 409 en re-login Google OAuth
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


-- ── FIX constraint pausado (si migración _008 no se ejecutó) ──
ALTER TABLE public.erp_proyectos
  DROP CONSTRAINT IF EXISTS erp_proyectos_estado_check;
ALTER TABLE public.erp_proyectos
  ADD CONSTRAINT erp_proyectos_estado_check
  CHECK (estado = ANY (ARRAY['planeacion','ejecucion','pausado','finalizado']));


-- ── VERIFICACIÓN FINAL ────────────────────────────────────────
SELECT tablename, COUNT(*) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
