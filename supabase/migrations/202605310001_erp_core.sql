--
-- ERP CONSTRUSMART - Database Schema
-- Supabase / PostgreSQL
-- Cobertura: Proyectos, Presupuestos, Financiero, RRHH, Bodega, Seguimiento
-- ⚠️ Bajo RLS: usa auth.uid() desde tablas de auth del proyecto.
--

-- ========================
-- Catálogos / referencias
-- ========================

CREATE TABLE erp_catalogos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  modulo text NOT NULL,
  clave text NOT NULL,
  nombre text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_erp_catalogos_modulo_clave ON erp_catalogos (modulo, clave);

-- ========================
-- Proyectos
-- ========================
CREATE TABLE erp_proyectos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- Empleados
-- ========================
CREATE TABLE erp_empleados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  puesto text NOT NULL,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  salario_diario numeric(10,2) NOT NULL DEFAULT 0,
  dias_trabajados integer NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'planilla' CHECK (tipo = ANY (ARRAY['planilla','destajo'])),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- Materiales / Inventario
-- ========================
CREATE TABLE erp_materiales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  unidad text NOT NULL,
  stock numeric(10,2) NOT NULL DEFAULT 0,
  stock_minimo numeric(10,2) NOT NULL DEFAULT 0,
  precio numeric(10,2) NOT NULL DEFAULT 0,
  critico boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- Proveedores
-- ========================
CREATE TABLE erp_proveedores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  contacto text,
  rubro text,
  calificacion integer NOT NULL DEFAULT 3 CHECK (calificacion >= 1 AND calificacion <= 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- Órdenes de compra
-- ========================
CREATE TABLE erp_ordenes_compra (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor text NOT NULL,
  material text NOT NULL,
  cantidad numeric(10,2) NOT NULL DEFAULT 0,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado = ANY (ARRAY['borrador','pendiente','aprobado','rechazado'])),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- Movimientos financieros
-- ========================
CREATE TABLE erp_movimientos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['ingreso','gasto'])),
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  descripcion text NOT NULL,
  cantidad numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL,
  categoria text NOT NULL,
  costo_unitario numeric(10,2) NOT NULL DEFAULT 0,
  costo_total numeric(12,2) NOT NULL DEFAULT 0,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- Eventos de calendario
-- ========================
CREATE TABLE erp_eventos_calendario (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha date NOT NULL,
  titulo text NOT NULL,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- Bitácora digital
-- ========================
CREATE TABLE erp_bitacora (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  clima text,
  personal integer NOT NULL DEFAULT 0,
  maquinaria text,
  tareas text NOT NULL,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- Seguimiento / EVM snapshots
-- ========================
CREATE TABLE erp_seguimiento (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- Índices
-- ========================
CREATE INDEX IF NOT EXISTS idx_erp_proyectos_estado ON erp_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_erp_empleados_proyecto ON erp_empleados(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_materiales_nombre ON erp_materiales(nombre);
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_proyecto ON erp_movimientos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_fecha ON erp_movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_erp_eventos_proyecto ON erp_eventos_calendario(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_eventos_fecha ON erp_eventos_calendario(fecha);
CREATE INDEX IF NOT EXISTS idx_erp_bitacora_proyecto ON erp_bitacora(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_proyecto ON erp_seguimiento(proyecto_id);

-- ========================
-- RLS
-- ========================
ALTER TABLE erp_catalogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bitacora ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_seguimiento ENABLE ROW LEVEL SECURITY;

-- Lectura base para autenticados
CREATE POLICY "erp_read_authenticated" ON erp_proyectos FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_read_authenticated" ON erp_movimientos FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_read_authenticated" ON erp_empleados FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_read_authenticated" ON erp_materiales FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_read_authenticated" ON erp_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_read_authenticated" ON erp_ordenes_compra FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_read_authenticated" ON erp_eventos_calendario FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_read_authenticated" ON erp_bitacora FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_read_authenticated" ON erp_seguimiento FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_read_authenticated" ON erp_catalogos FOR SELECT TO authenticated USING (true);

-- Escritura restringida por rol (usa la tabla profiles de Supabase Auth)
-- Administrador y Gerente: proyectos, empleados, seguimiento
CREATE POLICY "erp_admin_gerente_write" ON erp_proyectos FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente'])));
CREATE POLICY "erp_admin_gerente_write" ON erp_empleados FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente'])));
CREATE POLICY "erp_admin_gerente_write" ON erp_seguimiento FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente'])));

-- Residente: movimientos, eventos, bitácora
CREATE POLICY "erp_residente_write" ON erp_movimientos FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Residente'])));
CREATE POLICY "erp_residente_write" ON erp_eventos_calendario FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Residente'])));
CREATE POLICY "erp_residente_write" ON erp_bitacora FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Residente'])));

-- Compras / Bodeguero: materiales, órdenes, proveedores
CREATE POLICY "erp_compras_bodega_write" ON erp_materiales FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Compras','Bodeguero'])));
CREATE POLICY "erp_compras_bodega_write" ON erp_ordenes_compra FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Compras'])));
CREATE POLICY "erp_compras_bodega_write" ON erp_proveedores FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Compras'])));

-- Autocreated: todos pueden insertar en catálogos si hace falta, sin borrar
CREATE POLICY "erp_catalogos_insert" ON erp_catalogos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "erp_catalogos_update" ON erp_catalogos FOR UPDATE TO authenticated USING (true);

-- ========================
-- Helper: updated_at
-- ========================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_proyectos_updated ON erp_proyectos;
CREATE TRIGGER trg_erp_proyectos_updated
BEFORE UPDATE ON erp_proyectos FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();
