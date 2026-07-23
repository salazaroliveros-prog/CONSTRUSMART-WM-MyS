-- ============================================================
-- Migración: Crear tablas faltantes y limpiar legacy
-- ============================================================

-- SECCIÓN 1: Crear tablas faltantes del TABLE_MAP
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_anticipos (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id   uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  proveedor_id  uuid REFERENCES public.erp_proveedores(id) ON DELETE SET NULL,
  monto         numeric(14,2) NOT NULL DEFAULT 0,
  motivo        text NOT NULL DEFAULT '',
  fecha_solicitud text NOT NULL DEFAULT '',
  fecha_aprobacion text,
  estado        text NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','aprobado','pagado','rechazado')),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.erp_amortizaciones (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  anticipo_id   uuid NOT NULL REFERENCES public.erp_anticipos(id) ON DELETE CASCADE,
  monto         numeric(14,2) NOT NULL DEFAULT 0,
  fecha         text NOT NULL DEFAULT '',
  metodo        text NOT NULL DEFAULT 'mensual'
                  CHECK (metodo IN ('mensual','trimestral','anual')),
  numero_cuota  integer NOT NULL DEFAULT 1,
  observaciones text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.erp_rendimientos_campo (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id   uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  cuadrilla     text NOT NULL DEFAULT '',
  actividad     text NOT NULL DEFAULT '',
  unidad        text NOT NULL DEFAULT '',
  cantidad      numeric(14,4) NOT NULL DEFAULT 0,
  horas_hombre  numeric(10,2) NOT NULL DEFAULT 0,
  fecha         text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- SECCIÓN 2: Limpiar tablas legacy (sin prefijo erp_) - NO usadas por la app
-- ============================================================

DROP TABLE IF EXISTS public.activos_herramientas CASCADE;
DROP TABLE IF EXISTS public.amortizaciones CASCADE;
DROP TABLE IF EXISTS public.anticipos CASCADE;
DROP TABLE IF EXISTS public.cajas_chicas CASCADE;
DROP TABLE IF EXISTS public.centros_costo CASCADE;
DROP TABLE IF EXISTS public.cuadro_comparativo_proveedores CASCADE;
DROP TABLE IF EXISTS public.destajos CASCADE;
DROP TABLE IF EXISTS public.logs_sistema CASCADE;
DROP TABLE IF EXISTS public.recepciones_almacen CASCADE;
DROP TABLE IF EXISTS public.ventas_paquetes CASCADE;

-- SECCIÓN 3: RLS en tablas nuevas
-- ============================================================

ALTER TABLE public.erp_anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_amortizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_rendimientos_campo ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para anticipos
CREATE POLICY "anticipos_read" ON public.erp_anticipos FOR SELECT TO authenticated USING (true);
CREATE POLICY "anticipos_write" ON public.erp_anticipos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anticipos_update" ON public.erp_anticipos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "anticipos_delete" ON public.erp_anticipos FOR DELETE TO authenticated USING (true);

-- Políticas básicas para amortizaciones
CREATE POLICY "amortizaciones_read" ON public.erp_amortizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "amortizaciones_write" ON public.erp_amortizaciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "amortizaciones_update" ON public.erp_amortizaciones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "amortizaciones_delete" ON public.erp_amortizaciones FOR DELETE TO authenticated USING (true);

-- Políticas básicas para rendimientos_campo
CREATE POLICY "rendimientos_campo_read" ON public.erp_rendimientos_campo FOR SELECT TO authenticated USING (true);
CREATE POLICY "rendimientos_campo_write" ON public.erp_rendimientos_campo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "rendimientos_campo_update" ON public.erp_rendimientos_campo FOR UPDATE TO authenticated USING (true);
CREATE POLICY "rendimientos_campo_delete" ON public.erp_rendimientos_campo FOR DELETE TO authenticated USING (true);

-- SECCIÓN 4: Realtime publications para tablas nuevas
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_anticipos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_amortizaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_rendimientos_campo;

-- SECCIÓN 5: Triggers de updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_set_updated_at_anticipos() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
CREATE TRIGGER trigger_set_updated_at_anticipos BEFORE UPDATE ON public.erp_anticipos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at_anticipos();

CREATE OR REPLACE FUNCTION public.fn_set_updated_at_amortizaciones() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
CREATE TRIGGER trigger_set_updated_at_amortizaciones BEFORE UPDATE ON public.erp_amortizaciones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at_amortizaciones();

CREATE OR REPLACE FUNCTION public.fn_set_updated_at_rendimientos_campo() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
CREATE TRIGGER trigger_set_updated_at_rendimientos_campo BEFORE UPDATE ON public.erp_rendimientos_campo FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at_rendimientos_campo();

-- SECCIÓN 6: Índices útiles
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_erp_anticipos_proyecto ON public.erp_anticipos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_anticipos_estado ON public.erp_anticipos(estado);
CREATE INDEX IF NOT EXISTS idx_erp_amortizaciones_anticipo ON public.erp_amortizaciones(anticipo_id);
CREATE INDEX IF NOT EXISTS idx_erp_rendimientos_campo_proyecto ON public.erp_rendimientos_campo(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_rendimientos_campo_fecha ON public.erp_rendimientos_campo(fecha);
