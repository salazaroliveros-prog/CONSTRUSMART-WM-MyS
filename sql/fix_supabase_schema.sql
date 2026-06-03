-- fix_supabase_schema.sql
-- SQL to create missing tables, functions, triggers, indexes and policies
-- Avoids unsupported "IF NOT EXISTS" in CREATE POLICY and ADD CONSTRAINT

-- Ensure extension for uuid generation (safe to run if extension already exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Crear tabla erp_presupuestos (si falta) y elementos relacionados
CREATE TABLE IF NOT EXISTS public.erp_presupuestos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  tipologia text NOT NULL CHECK (tipologia = ANY (ARRAY['residencial','comercial','industrial','civil','publica'])),
  renglones jsonb NOT NULL DEFAULT '[]',
  total_calculado numeric(12,2) NOT NULL DEFAULT 0,
  costo_directo_total numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado = ANY (ARRAY['borrador','aprobado','rechazado'])),
  notas text,
  version_presupuesto integer NOT NULL DEFAULT 1,
  fecha_creacion timestamptz DEFAULT now() NOT NULL,
  fecha_actualizacion timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto ON public.erp_presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_estado ON public.erp_presupuestos(estado);

CREATE OR REPLACE FUNCTION public.update_erp_presupuestos_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_presupuestos_timestamp ON public.erp_presupuestos;
CREATE TRIGGER trg_erp_presupuestos_timestamp
BEFORE UPDATE ON public.erp_presupuestos
FOR EACH ROW EXECUTE FUNCTION public.update_erp_presupuestos_timestamp();

ALTER TABLE public.erp_presupuestos ENABLE ROW LEVEL SECURITY;

-- Policies: DROP IF EXISTS then CREATE (Postgres doesn't support CREATE POLICY IF NOT EXISTS)
DROP POLICY IF EXISTS logs_sistema_select ON public.erp_presupuestos;
CREATE POLICY logs_sistema_select ON public.erp_presupuestos FOR SELECT USING (true);

DROP POLICY IF EXISTS logs_sistema_create ON public.erp_presupuestos;
CREATE POLICY logs_sistema_create ON public.erp_presupuestos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS logs_sistema_update ON public.erp_presupuestos;
CREATE POLICY logs_sistema_update ON public.erp_presupuestos FOR UPDATE USING (true);

DROP POLICY IF EXISTS logs_sistema_delete ON public.erp_presupuestos;
CREATE POLICY logs_sistema_delete ON public.erp_presupuestos FOR DELETE USING (true);


-- 2) Añadir columna presupuesto_actual_id en erp_proyectos (si falta)
ALTER TABLE public.erp_proyectos
  ADD COLUMN IF NOT EXISTS presupuesto_actual_id uuid;


-- 3) Agregar la constraint FK de forma segura (Postgres NO soporta IF NOT EXISTS en ADD CONSTRAINT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'erp_proyectos_presupuesto_actual_id_fkey'
  ) THEN
    ALTER TABLE public.erp_proyectos
      ADD CONSTRAINT erp_proyectos_presupuesto_actual_id_fkey
      FOREIGN KEY (presupuesto_actual_id) REFERENCES public.erp_presupuestos(id) ON DELETE SET NULL;
  END IF;
END$$;


-- 4) Tablas y funciones adicionales que faltaban (solo si no existen)
-- logs_sistema
CREATE TABLE IF NOT EXISTS public.logs_sistema (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nombre text NOT NULL DEFAULT '',
  accion text NOT NULL,
  entidad text NOT NULL,
  entidad_id text,
  valores_anteriores jsonb,
  valores_nuevos jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

-- Policies for logs_sistema: DROP then CREATE
DROP POLICY IF EXISTS logs_sistema_insert ON public.logs_sistema;
CREATE POLICY logs_sistema_insert ON public.logs_sistema FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS logs_sistema_select ON public.logs_sistema;
CREATE POLICY logs_sistema_select ON public.logs_sistema FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_logs_sistema_entidad ON public.logs_sistema(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_fecha ON public.logs_sistema(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_usuario ON public.logs_sistema(usuario_id);


-- destajos
CREATE TABLE IF NOT EXISTS public.destajos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  renglon_codigo text NOT NULL,
  cuadrilla text NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  cantidad_ejecutada numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL,
  horas_trabajadas numeric(5,2) NOT NULL DEFAULT 8,
  rendimiento_real numeric(10,2) GENERATED ALWAYS AS (
    CASE WHEN horas_trabajadas > 0 THEN cantidad_ejecutada / (horas_trabajadas / 8) ELSE 0 END
  ) STORED,
  rendimiento_teorico numeric(10,2) NOT NULL DEFAULT 0,
  observaciones text,
  registrado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.destajos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS destajos_read ON public.destajos;
CREATE POLICY destajos_read ON public.destajos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS destajos_write ON public.destajos;
CREATE POLICY destajos_write ON public.destajos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente'))
);

CREATE INDEX IF NOT EXISTS idx_destajos_proyecto ON public.destajos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_destajos_fecha ON public.destajos(fecha);


-- cajas_chicas
CREATE TABLE IF NOT EXISTS public.cajas_chicas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  descripcion text NOT NULL,
  categoria text NOT NULL CHECK (categoria = ANY (ARRAY['materiales','herramientas','transporte','comidas','otros'])),
  fecha_gasto date NOT NULL DEFAULT CURRENT_DATE,
  factura_url text,
  foto_url text,
  solicitante text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','aprobada','rechazada'])),
  aprobado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_aprobacion timestamptz,
  latitud double precision,
  longitud double precision,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.cajas_chicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cajas_chicas_read ON public.cajas_chicas;
CREATE POLICY cajas_chicas_read ON public.cajas_chicas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS cajas_chicas_write ON public.cajas_chicas;
CREATE POLICY cajas_chicas_write ON public.cajas_chicas FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente'))
);

CREATE INDEX IF NOT EXISTS idx_cajas_chicas_proyecto ON public.cajas_chicas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cajas_chicas_estado ON public.cajas_chicas(estado);


-- activos_herramientas
CREATE TABLE IF NOT EXISTS public.activos_herramientas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  codigo_inventario text UNIQUE NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['herramienta','equipo','vehiculo','accesorio'])),
  marca text,
  modelo text,
  numero_serie text,
  valor_adquisicion numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'disponible' CHECK (estado = ANY (ARRAY['disponible','asignado','mantenimiento','baja'])),
  ubicacion text,
  asignado_a text,
  proyecto_id uuid REFERENCES public.erp_proyectos(id) ON DELETE SET NULL,
  fecha_asignacion date,
  fecha_adquisicion date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.activos_herramientas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activos_read ON public.activos_herramientas;
CREATE POLICY activos_read ON public.activos_herramientas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS activos_write ON public.activos_herramientas;
CREATE POLICY activos_write ON public.activos_herramientas FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Bodeguero'))
);

CREATE INDEX IF NOT EXISTS idx_activos_estado ON public.activos_herramientas(estado);
CREATE INDEX IF NOT EXISTS idx_activos_proyecto ON public.activos_herramientas(proyecto_id);


-- cuadro_comparativo_proveedores y cotizaciones
CREATE TABLE IF NOT EXISTS public.cuadro_comparativo_proveedores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid REFERENCES public.erp_proyectos(id) ON DELETE SET NULL,
  solicitud text NOT NULL,
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_cierre date,
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado = ANY (ARRAY['abierto','cerrado','adjudicado'])),
  adjudicado_a uuid REFERENCES public.erp_proveedores(id) ON DELETE SET NULL,
  observaciones text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.cuadro_comparativo_proveedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cuadro_read ON public.cuadro_comparativo_proveedores;
CREATE POLICY cuadro_read ON public.cuadro_comparativo_proveedores FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS cuadro_write ON public.cuadro_comparativo_proveedores;
CREATE POLICY cuadro_write ON public.cuadro_comparativo_proveedores FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras'))
);

CREATE INDEX IF NOT EXISTS idx_cuadro_estado ON public.cuadro_comparativo_proveedores(estado);

CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  cuadro_id uuid NOT NULL REFERENCES public.cuadro_comparativo_proveedores(id) ON DELETE CASCADE,
  proveedor_id uuid NOT NULL REFERENCES public.erp_proveedores(id) ON DELETE CASCADE,
  monto_total numeric(12,2) NOT NULL DEFAULT 0,
  plazo_entrega integer,
  condiciones_pago text,
  validez_oferta date,
  seleccionada boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(cuadro_id, proveedor_id)
);
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cotizaciones_read ON public.cotizaciones;
CREATE POLICY cotizaciones_read ON public.cotizaciones FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS cotizaciones_write ON public.cotizaciones;
CREATE POLICY cotizaciones_write ON public.cotizaciones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras'))
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_cuadro ON public.cotizaciones(cuadro_id);


-- anticipos y amortizaciones
CREATE TABLE IF NOT EXISTS public.anticipos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  monto_total numeric(12,2) NOT NULL DEFAULT 0,
  saldo_pendiente numeric(12,2) NOT NULL DEFAULT 0,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['cliente','proveedor','empleado'])),
  beneficiario text NOT NULL,
  concepto text NOT NULL,
  fecha_entrega date NOT NULL DEFAULT CURRENT_DATE,
  fecha_ultima_amortizacion date,
  estado text NOT NULL DEFAULT 'activo' CHECK (estado = ANY (ARRAY['activo','amortizado','cancelado'])),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.anticipos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anticipos_read ON public.anticipos;
CREATE POLICY anticipos_read ON public.anticipos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS anticipos_write ON public.anticipos;
CREATE POLICY anticipos_write ON public.anticipos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_anticipos_proyecto ON public.anticipos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_estado ON public.anticipos(estado);

CREATE TABLE IF NOT EXISTS public.amortizaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  anticipo_id uuid NOT NULL REFERENCES public.anticipos(id) ON DELETE CASCADE,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  referencia text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.amortizaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS amortizaciones_read ON public.amortizaciones;
CREATE POLICY amortizaciones_read ON public.amortizaciones FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS amortizaciones_write ON public.amortizaciones;
CREATE POLICY amortizaciones_write ON public.amortizaciones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_amortizaciones_anticipo ON public.amortizaciones(anticipo_id);


-- pagos_proveedores
CREATE TABLE IF NOT EXISTS public.pagos_proveedores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid REFERENCES public.erp_proyectos(id) ON DELETE SET NULL,
  proveedor_id uuid NOT NULL REFERENCES public.erp_proveedores(id) ON DELETE CASCADE,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  concepto text NOT NULL,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date NOT NULL,
  fecha_pago date,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','pagado','vencido','cancelado'])),
  factura_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.pagos_proveedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pagos_read ON public.pagos_proveedores;
CREATE POLICY pagos_read ON public.pagos_proveedores FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS pagos_write ON public.pagos_proveedores;
CREATE POLICY pagos_write ON public.pagos_proveedores FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras'))
);

CREATE INDEX IF NOT EXISTS idx_pagos_vencimiento ON public.pagos_proveedores(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos_proveedores(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_proveedor ON public.pagos_proveedores(proveedor_id);


-- ventas_paquetes
CREATE TABLE IF NOT EXISTS public.ventas_paquetes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['unidad','lote','paquete'])),
  identificador text NOT NULL,
  precio_venta numeric(12,2) NOT NULL DEFAULT 0,
  precio_contrato numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'disponible' CHECK (estado = ANY (ARRAY['disponible','reservado','vendido','entregado'])),
  cliente text,
  fecha_reserva date,
  fecha_venta date,
  plan_pago text,
  notas text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.ventas_paquetes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ventas_read ON public.ventas_paquetes;
CREATE POLICY ventas_read ON public.ventas_paquetes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS ventas_write ON public.ventas_paquetes;
CREATE POLICY ventas_write ON public.ventas_paquetes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_ventas_proyecto ON public.ventas_paquetes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON public.ventas_paquetes(estado);


-- centros_costo
CREATE TABLE IF NOT EXISTS public.centros_costo (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nombre text NOT NULL,
  presupuesto_asignado numeric(12,2) NOT NULL DEFAULT 0,
  gasto_actual numeric(12,2) NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'directo' CHECK (tipo = ANY (ARRAY['directo','indirecto','administrativo'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(proyecto_id, codigo)
);
ALTER TABLE public.centros_costo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS centros_costo_read ON public.centros_costo;
CREATE POLICY centros_costo_read ON public.centros_costo FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS centros_costo_write ON public.centros_costo;
CREATE POLICY centros_costo_write ON public.centros_costo FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_centros_costo_proyecto ON public.centros_costo(proyecto_id);


-- catálogo: erp_insumos_base y erp_rendimientos_cuadrilla
CREATE TABLE IF NOT EXISTS public.erp_insumos_base (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  categoria text NOT NULL,
  unidad text NOT NULL,
  precio_referencia numeric(10,2) NOT NULL DEFAULT 0,
  rubro text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  fecha_actualizacion date NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE public.erp_insumos_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insumos_base_read ON public.erp_insumos_base;
CREATE POLICY insumos_base_read ON public.erp_insumos_base FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS insumos_base_write ON public.erp_insumos_base;
CREATE POLICY insumos_base_write ON public.erp_insumos_base FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente'))
);

CREATE TABLE IF NOT EXISTS public.erp_rendimientos_cuadrilla (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  actividad text NOT NULL,
  cuadrilla text NOT NULL,
  rendimiento_diario numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL
);
ALTER TABLE public.erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rendimientos_read ON public.erp_rendimientos_cuadrilla;
CREATE POLICY rendimientos_read ON public.erp_rendimientos_cuadrilla FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS rendimientos_write ON public.erp_rendimientos_cuadrilla;
CREATE POLICY rendimientos_write ON public.erp_rendimientos_cuadrilla FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente'))
);


-- Función de auditoría y trigger de recalculo (si no existen)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_insumos_recalculo ON public.erp_insumos;
CREATE TRIGGER trg_insumos_recalculo AFTER UPDATE OF precio ON public.erp_insumos FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_presupuestos_por_insumo();

-- End of file
