-- ============================================================
-- ERP CONSTRUSMART - Migración: Tablas faltantes + Seed Data
-- Versión: 1.1.0
-- ============================================================

-- ============================================================
-- PARTE 1: NUEVAS TABLAS
-- ============================================================

------------------------------------------------------------
-- 1.1 logs_sistema — Auditoría imborrable
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_sistema (
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

ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;

-- Solo INSERT permitido (imborrable: no UPDATE ni DELETE)
CREATE POLICY "logs_sistema_insert" ON logs_sistema
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "logs_sistema_select" ON logs_sistema
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
  );

CREATE INDEX IF NOT EXISTS idx_logs_sistema_entidad ON logs_sistema(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_fecha ON logs_sistema(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_usuario ON logs_sistema(usuario_id);

------------------------------------------------------------
-- 1.2 destajos — Rendimiento real por cuadrilla
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS destajos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  renglon_codigo text NOT NULL,
  cuadrilla text NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  cantidad_ejecutada numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL,
  horas_trabajadas numeric(5,2) NOT NULL DEFAULT 8,
  rendimiento_real numeric(10,2) GENERATED ALWAYS AS (
    CASE WHEN horas_trabajadas > 0 
      THEN cantidad_ejecutada / (horas_trabajadas / 8) 
      ELSE 0 END
  ) STORED,
  rendimiento_teorico numeric(10,2) NOT NULL DEFAULT 0,
  observaciones text,
  registrado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE destajos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "destajos_read" ON destajos FOR SELECT TO authenticated USING (true);
CREATE POLICY "destajos_write" ON destajos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_destajos_proyecto ON destajos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_destajos_fecha ON destajos(fecha);

------------------------------------------------------------
-- 1.3 cajas_chicas — Facturas desde campo
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cajas_chicas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
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

ALTER TABLE cajas_chicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cajas_chicas_read" ON cajas_chicas FOR SELECT TO authenticated USING (true);
CREATE POLICY "cajas_chicas_write" ON cajas_chicas FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_cajas_chicas_proyecto ON cajas_chicas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cajas_chicas_estado ON cajas_chicas(estado);

------------------------------------------------------------
-- 1.4 activos_herramientas — Control de activos
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activos_herramientas (
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
  asignado_a text, -- nombre del operador/cuadrilla
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  fecha_asignacion date,
  fecha_adquisicion date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE activos_herramientas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activos_read" ON activos_herramientas FOR SELECT TO authenticated USING (true);
CREATE POLICY "activos_write" ON activos_herramientas FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Bodeguero'))
);

CREATE INDEX IF NOT EXISTS idx_activos_estado ON activos_herramientas(estado);
CREATE INDEX IF NOT EXISTS idx_activos_proyecto ON activos_herramientas(proyecto_id);

------------------------------------------------------------
-- 1.5 cuadro_comparativo_proveedores — Cotizaciones
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuadro_comparativo_proveedores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  solicitud text NOT NULL, -- descripción de lo que se cotiza
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_cierre date,
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado = ANY (ARRAY['abierto','cerrado','adjudicado'])),
  adjudicado_a uuid REFERENCES erp_proveedores(id) ON DELETE SET NULL,
  observaciones text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS cotizaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  cuadro_id uuid NOT NULL REFERENCES cuadro_comparativo_proveedores(id) ON DELETE CASCADE,
  proveedor_id uuid NOT NULL REFERENCES erp_proveedores(id) ON DELETE CASCADE,
  monto_total numeric(12,2) NOT NULL DEFAULT 0,
  plazo_entrega integer, -- días
  condiciones_pago text,
  validez_oferta date,
  seleccionada boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(cuadro_id, proveedor_id)
);

ALTER TABLE cuadro_comparativo_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cuadro_read" ON cuadro_comparativo_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "cuadro_write" ON cuadro_comparativo_proveedores FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
);

CREATE POLICY "cotizaciones_read" ON cotizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "cotizaciones_write" ON cotizaciones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
);

CREATE INDEX IF NOT EXISTS idx_cuadro_estado ON cuadro_comparativo_proveedores(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cuadro ON cotizaciones(cuadro_id);

------------------------------------------------------------
-- 1.6 anticipos — Gestión y amortización
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anticipos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS amortizaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  anticipo_id uuid NOT NULL REFERENCES anticipos(id) ON DELETE CASCADE,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  referencia text, -- ej: "Valuación #3", "Factura #001"
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE amortizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anticipos_read" ON anticipos FOR SELECT TO authenticated USING (true);
CREATE POLICY "anticipos_write" ON anticipos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE POLICY "amortizaciones_read" ON amortizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "amortizaciones_write" ON amortizaciones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_anticipos_proyecto ON anticipos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_estado ON anticipos(estado);
CREATE INDEX IF NOT EXISTS idx_amortizaciones_anticipo ON amortizaciones(anticipo_id);

------------------------------------------------------------
-- 1.7 pagos_proveedores — Programación de pagos
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos_proveedores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  proveedor_id uuid NOT NULL REFERENCES erp_proveedores(id) ON DELETE CASCADE,
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

ALTER TABLE pagos_proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_read" ON pagos_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "pagos_write" ON pagos_proveedores FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
);

CREATE INDEX IF NOT EXISTS idx_pagos_vencimiento ON pagos_proveedores(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos_proveedores(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_proveedor ON pagos_proveedores(proveedor_id);

------------------------------------------------------------
-- 1.8 ventas_paquetes — Preventa de unidades
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas_paquetes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['unidad','lote','paquete'])),
  identificador text NOT NULL, -- ej: "Torre A - Apt 301", "Lote 15"
  precio_venta numeric(12,2) NOT NULL DEFAULT 0,
  precio_contrato numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'disponible' CHECK (estado = ANY (ARRAY['disponible','reservado','vendido','entregado'])),
  cliente text,
  fecha_reserva date,
  fecha_venta date,
  plan_pago text, -- JSON con cuotas
  notas text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE ventas_paquetes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventas_read" ON ventas_paquetes FOR SELECT TO authenticated USING (true);
CREATE POLICY "ventas_write" ON ventas_paquetes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_ventas_proyecto ON ventas_paquetes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas_paquetes(estado);

------------------------------------------------------------
-- 1.9 Centros de Costo
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS centros_costo (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nombre text NOT NULL,
  presupuesto_asignado numeric(12,2) NOT NULL DEFAULT 0,
  gasto_actual numeric(12,2) NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'directo' CHECK (tipo = ANY (ARRAY['directo','indirecto','administrativo'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(proyecto_id, codigo)
);

ALTER TABLE centros_costo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "centros_costo_read" ON centros_costo FOR SELECT TO authenticated USING (true);
CREATE POLICY "centros_costo_write" ON centros_costo FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_centros_costo_proyecto ON centros_costo(proyecto_id);

-- ============================================================
-- PARTE 2: SEED DATA
-- ============================================================

-- Solo insertar si las tablas están vacías
DO $$
BEGIN
  -- Seed: Insumos Base (24 registros)
  IF NOT EXISTS (SELECT 1 FROM erp_insumos LIMIT 1) THEN
    INSERT INTO erp_insumos (id, renglon_id, nombre, tipo, unidad, precio, rendimiento) VALUES
    -- Estos se insertarán a través de la app desde data.ts
    -- Por ahora, dejamos plantilla para inserción manual
    NULL;
  END IF;
END $$;

-- ============================================================
-- PARTE 3: FUNCIÓN DE AUDITORÍA (trigger genérico)
-- ============================================================

CREATE OR REPLACE FUNCTION fn_log_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_old_json jsonb;
  v_new_json jsonb;
  v_user_name text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old_json = to_jsonb(OLD);
    v_new_json = to_jsonb(NEW);
    
    SELECT COALESCE(nombre, 'unknown') INTO v_user_name 
    FROM public.profiles WHERE id = auth.uid();
    
    INSERT INTO logs_sistema (
      usuario_id, usuario_nombre, accion, entidad, 
      entidad_id, valores_anteriores, valores_nuevos
    ) VALUES (
      auth.uid(), v_user_name, 'UPDATE', TG_TABLE_NAME,
      COALESCE(OLD.id::text, NEW.id::text),
      v_old_json, v_new_json
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_json = to_jsonb(OLD);
    
    SELECT COALESCE(nombre, 'unknown') INTO v_user_name 
    FROM public.profiles WHERE id = auth.uid();
    
    INSERT INTO logs_sistema (
      usuario_id, usuario_nombre, accion, entidad,
      entidad_id, valores_anteriores
    ) VALUES (
      auth.uid(), v_user_name, 'DELETE', TG_TABLE_NAME,
      OLD.id::text, v_old_json
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PARTE 4: FUNCIÓN RECÁLCULO GLOBAL DESDE CATÁLOGO
-- ============================================================

CREATE OR REPLACE FUNCTION fn_recalcular_presupuestos_por_insumo()
RETURNS TRIGGER AS $$
DECLARE
  v_renglon_ids uuid[];
BEGIN
  -- Cuando se actualiza un precio en erp_insumos
  IF TG_OP = 'UPDATE' AND OLD.precio IS DISTINCT FROM NEW.precio THEN
    -- Obtener renglones afectados
    SELECT array_agg(DISTINCT ri.renglon_id) INTO v_renglon_ids
    FROM erp_insumos ri WHERE ri.id = NEW.id;
    
    -- Aquí se podría lanzar un evento o actualizar un flag para recalcular
    -- Por ahora, registramos en logs
    INSERT INTO logs_sistema (
      usuario_id, usuario_nombre, accion, entidad,
      entidad_id, valores_anteriores, valores_nuevos
    ) VALUES (
      auth.uid(), 'system', 'PRECIO_INSUMO_CAMBIADO', 'erp_insumos',
      NEW.id::text,
      jsonb_build_object('precio_anterior', OLD.precio),
      jsonb_build_object('precio_nuevo', NEW.precio, 'renglones_afectados', v_renglon_ids)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para recálculo
DROP TRIGGER IF EXISTS trg_insumos_recalculo ON erp_insumos;
CREATE TRIGGER trg_insumos_recalculo
  AFTER UPDATE OF precio ON erp_insumos
  FOR EACH ROW
  EXECUTE FUNCTION fn_recalcular_presupuestos_por_insumo();