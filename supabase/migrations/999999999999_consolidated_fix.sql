-- ============================================================
-- ERP CONSTRUSMART - Consolidated Fix (parche)
-- Solo agrega lo faltante: columnas, constraints, tablas de
-- migraciones 003/006/007/008, triggers, seed data.
-- ============================================================

-- ============================================================
-- PART 1: public.profiles (tabla base para RLS)
-- Se crea completa porque NUNCA se creó en migraciones previas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre text NOT NULL DEFAULT '',
  rol text NOT NULL DEFAULT 'usuario' CHECK (rol = ANY (ARRAY['Administrador','Gerente','Residente','Compras','Bodeguero','usuario'])),
  avatar_url text,
  user_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Insertar usuarios existentes de auth.users
INSERT INTO public.profiles (id, nombre, rol)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1)),
  CASE WHEN email = 'salazaroliveros@gmail.com' THEN 'Administrador' ELSE 'Residente' END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para profiles
DROP POLICY IF EXISTS "profiles_read_self_admin_gerente" ON public.profiles;
CREATE POLICY "profiles_read_self_admin_gerente"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.rol IN ('Administrador','Gerente')
  ));

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- PART 2: Tablas core ERP (migration 001)
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_proyectos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre text NOT NULL,
    cliente text NOT NULL,
    ubicacion text NOT NULL,
    tipologia text NOT NULL CHECK (tipologia = ANY (ARRAY['residencial','comercial','industrial','civil','publica'])),
    estado text NOT NULL DEFAULT 'planeacion' CHECK (estado = ANY (ARRAY['planeacion','ejecucion','pausado','finalizado'])),
    presupuesto_total numeric(12,2) NOT NULL DEFAULT 0,
    monto_contrato numeric(12,2) NOT NULL DEFAULT 0,
    avance_fisico numeric(5,2) NOT NULL DEFAULT 0,
    avance_financiero numeric(5,2) NOT NULL DEFAULT 0,
    lat double precision,
    lng double precision,
    fecha_inicio date,
    fecha_fin date,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_movimientos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tipo text NOT NULL CHECK (tipo = ANY (ARRAY['ingreso','gasto'])),
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    descripcion text NOT NULL,
    cantidad numeric(10,2) NOT NULL DEFAULT 0,
    unidad text NOT NULL,
    categoria text NOT NULL CHECK (categoria = ANY (ARRAY[
      'materiales','mano_obra','herramienta','sub_contrato',
      'administrativo','personal','transporte','fijos',
      'hogar','aporte','trabajos_extra'
    ])),
    costo_unitario numeric(10,2) NOT NULL DEFAULT 0,
    costo_total numeric(12,2) NOT NULL DEFAULT 0,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_empleados (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre text NOT NULL,
    puesto text NOT NULL,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    salario_diario numeric(10,2) NOT NULL DEFAULT 0,
    dias_trabajados integer NOT NULL DEFAULT 0,
    tipo text NOT NULL DEFAULT 'planilla' CHECK (tipo = ANY (ARRAY['planilla','destajo'])),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_materiales (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre text NOT NULL,
    unidad text NOT NULL,
    stock numeric(10,2) NOT NULL DEFAULT 0,
    stock_minimo numeric(10,2) NOT NULL DEFAULT 0,
    precio numeric(10,2) NOT NULL DEFAULT 0,
    critico boolean NOT NULL DEFAULT false,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_ordenes_compra (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proveedor text NOT NULL,
    material text NOT NULL,
    cantidad numeric(10,2) NOT NULL DEFAULT 0,
    monto numeric(12,2) NOT NULL DEFAULT 0,
    estado text NOT NULL DEFAULT 'borrador' CHECK (estado = ANY (ARRAY['borrador','pendiente','aprobado','rechazado','recibida','cancelada'])),
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_proveedores (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre text NOT NULL,
    contacto text,
    telefono text,
    email text,
    rubro text,
    categoria text,
    calificacion integer NOT NULL DEFAULT 3 CHECK (calificacion >= 1 AND calificacion <= 5),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_eventos_calendario (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    fecha date NOT NULL,
    hora time,
    titulo text NOT NULL,
    descripcion text,
    tipo text CHECK (tipo = ANY (ARRAY['Recordatorio','Actividad','Reunión','Visita','reunion','inspeccion','entrega','pago','otros'])),
    completado boolean DEFAULT false,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_bitacora (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    clima text,
    personal integer NOT NULL DEFAULT 0,
    maquinaria text,
    tareas text NOT NULL,
    observaciones text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_seguimiento (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_renglones (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    codigo text NOT NULL,
    nombre text NOT NULL,
    unidad text NOT NULL,
    tipologia text NOT NULL CHECK (tipologia = ANY (ARRAY['residencial','comercial','industrial','civil','publica'])),
    rendimiento_cuadrilla numeric(10,2) NOT NULL DEFAULT 0,
    costo_materiales numeric(12,2) NOT NULL DEFAULT 0,
    costo_mano_obra numeric(12,2) NOT NULL DEFAULT 0,
    costo_equipo numeric(12,2) NOT NULL DEFAULT 0,
    cantidad numeric(10,2) NOT NULL DEFAULT 0,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_insumos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    renglon_id uuid NOT NULL REFERENCES erp_renglones(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    tipo text NOT NULL CHECK (tipo = ANY (ARRAY['material','mano_obra','equipo','subcontrato'])),
    unidad text NOT NULL,
    precio numeric(10,2) NOT NULL DEFAULT 0,
    rendimiento numeric(10,2) NOT NULL DEFAULT 0,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_sub_renglones (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    renglon_id uuid NOT NULL REFERENCES erp_renglones(id) ON DELETE CASCADE,
    nombre_material text NOT NULL,
    unidad text NOT NULL,
    cantidad_unitaria numeric(10,2) NOT NULL DEFAULT 0,
    precio_unitario numeric(10,2) NOT NULL DEFAULT 0,
    total numeric(12,2) GENERATED ALWAYS AS (cantidad_unitaria * precio_unitario) STORED,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_presupuestos (migration 002)
CREATE TABLE IF NOT EXISTS erp_presupuestos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipologia text NOT NULL CHECK (tipologia = ANY (ARRAY['residencial','comercial','industrial','civil','publica'])),
  renglones jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_calculado numeric(12,2) NOT NULL DEFAULT 0,
  costo_directo_total numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado = ANY (ARRAY['borrador','aprobado','revisado','rechazado'])),
  notas text,
  version_presupuesto integer NOT NULL DEFAULT 1,
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  fecha_actualizacion timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- presupuesto_actual_id en erp_proyectos (migration 002)
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS presupuesto_actual_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'erp_proyectos_presupuesto_actual_id_fkey') THEN
    ALTER TABLE erp_proyectos ADD CONSTRAINT erp_proyectos_presupuesto_actual_id_fkey
      FOREIGN KEY (presupuesto_actual_id) REFERENCES erp_presupuestos(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'erp_proyectos_created_by_fkey') THEN
    ALTER TABLE erp_proyectos ADD CONSTRAINT erp_proyectos_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'erp_movimientos_created_by_fkey') THEN
    ALTER TABLE erp_movimientos ADD CONSTRAINT erp_movimientos_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'erp_empleados_created_by_fkey') THEN
    ALTER TABLE erp_empleados ADD CONSTRAINT erp_empleados_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'erp_ordenes_compra_created_by_fkey') THEN
    ALTER TABLE erp_ordenes_compra ADD CONSTRAINT erp_ordenes_compra_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'erp_proveedores_created_by_fkey') THEN
    ALTER TABLE erp_proveedores ADD CONSTRAINT erp_proveedores_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'erp_eventos_calendario_created_by_fkey') THEN
    ALTER TABLE erp_eventos_calendario ADD CONSTRAINT erp_eventos_calendario_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'erp_bitacora_created_by_fkey') THEN
    ALTER TABLE erp_bitacora ADD CONSTRAINT erp_bitacora_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- RLS para tablas core
ALTER TABLE erp_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bitacora ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sub_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_presupuestos ENABLE ROW LEVEL SECURITY;

-- Índices core
CREATE INDEX IF NOT EXISTS idx_erp_proyectos_estado ON erp_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_erp_proyectos_created_by ON erp_proyectos(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_proyecto ON erp_movimientos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_fecha ON erp_movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_erp_empleados_proyecto ON erp_empleados(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_materiales_critico ON erp_materiales(critico);
CREATE INDEX IF NOT EXISTS idx_erp_eventos_proyecto ON erp_eventos_calendario(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_eventos_fecha ON erp_eventos_calendario(fecha);
CREATE INDEX IF NOT EXISTS idx_erp_bitacora_proyecto ON erp_bitacora(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_proyecto ON erp_seguimiento(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_renglones_proyecto ON erp_renglones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_insumos_renglon ON erp_insumos(renglon_id);
CREATE INDEX IF NOT EXISTS idx_erp_sub_renglones_renglon ON erp_sub_renglones(renglon_id);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto ON erp_presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_estado ON erp_presupuestos(estado);

-- ============================================================
-- PART 3: Tablas faltantes (migration 003)
-- logs_sistema, destajos, cajas_chicas, activos_herramientas,
-- cuadro_comparativo_proveedores, cotizaciones, anticipos,
-- amortizaciones, pagos_proveedores, ventas_paquetes, centros_costo
-- ============================================================
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

CREATE TABLE IF NOT EXISTS destajos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  renglon_codigo text NOT NULL,
  cuadrilla text NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  cantidad_ejecutada numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL,
  horas_trabajadas numeric(10,2) NOT NULL DEFAULT 8,
  rendimiento_real numeric(10,2),
  rendimiento_teorico numeric(10,2) NOT NULL DEFAULT 0,
  observaciones text,
  registrado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS cajas_chicas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  descripcion text NOT NULL,
  categoria text NOT NULL,
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

CREATE TABLE IF NOT EXISTS activos_herramientas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  codigo_inventario text UNIQUE NOT NULL,
  tipo text NOT NULL,
  marca text,
  modelo text,
  numero_serie text,
  valor_adquisicion numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'disponible',
  ubicacion text,
  asignado_a text,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  fecha_asignacion date,
  fecha_adquisicion date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS cuadro_comparativo_proveedores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  solicitud text NOT NULL,
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_cierre date,
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado = ANY (ARRAY['abierto','cerrado','adjudicado'])),
  adjudicado_a uuid,
  observaciones text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS cotizaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  cuadro_id uuid NOT NULL REFERENCES cuadro_comparativo_proveedores(id) ON DELETE CASCADE,
  proveedor_id uuid NOT NULL REFERENCES erp_proveedores(id) ON DELETE CASCADE,
  monto_total numeric(12,2) NOT NULL DEFAULT 0,
  plazo_entrega integer,
  condiciones_pago text,
  validez_oferta date,
  seleccionada boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

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
  referencia text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

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

CREATE TABLE IF NOT EXISTS ventas_paquetes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
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

-- ============================================================
-- PART 4: erp_vales_salida (migration 006)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_vales_salida (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  renglon_id uuid,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]',
  observaciones text,
  solicitante text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- PART 5: erp_insumos_base y erp_rendimientos_cuadrilla
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_insumos_base (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  categoria text NOT NULL,
  unidad text NOT NULL,
  precio_referencia numeric(10,2) NOT NULL DEFAULT 0,
  rubro text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  fecha_actualizacion date NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS erp_rendimientos_cuadrilla (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  actividad text NOT NULL,
  cuadrilla text NOT NULL,
  rendimiento_diario numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_auditoria (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accion text NOT NULL,
  tabla text NOT NULL,
  registro_id uuid,
  datos jsonb,
  ip text,
  user_agent text,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_avances (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  presupuesto_id uuid REFERENCES erp_presupuestos(id) ON DELETE SET NULL,
  renglon_id uuid REFERENCES erp_renglones(id) ON DELETE SET NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  avance_fisico numeric(5,2) NOT NULL DEFAULT 0,
  cantidad_ejecutada numeric(10,2) NOT NULL DEFAULT 0,
  foto text,
  latitud double precision,
  longitud double precision,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_licitaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  cliente text NOT NULL,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  fecha_limite date NOT NULL,
  estado text NOT NULL DEFAULT 'activa' CHECK (estado = ANY (ARRAY['activa','ganada','perdida','cancelada'])),
  documentos jsonb NOT NULL DEFAULT '[]',
  notas text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- PART 6: RLS en tablas nuevas
-- ============================================================
ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE destajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas_chicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE activos_herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadro_comparativo_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE amortizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_paquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_vales_salida ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_insumos_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_avances ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_licitaciones ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 7: RLS Policies por rol (granular)
-- ============================================================

-- ERP_PROYECTOS
DROP POLICY IF EXISTS "erp_proyectos_select" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_insert" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_update" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_delete" ON erp_proyectos;
CREATE POLICY "erp_proyectos_select" ON erp_proyectos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')) OR auth.uid() = created_by);
CREATE POLICY "erp_proyectos_insert" ON erp_proyectos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));
CREATE POLICY "erp_proyectos_update" ON erp_proyectos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));
CREATE POLICY "erp_proyectos_delete" ON erp_proyectos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));

-- ERP_MOVIMIENTOS
DROP POLICY IF EXISTS "erp_movimientos_select" ON erp_movimientos;
DROP POLICY IF EXISTS "erp_movimientos_write" ON erp_movimientos;
CREATE POLICY "erp_movimientos_select" ON erp_movimientos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')) OR auth.uid() = created_by);
CREATE POLICY "erp_movimientos_write" ON erp_movimientos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_EMPLEADOS
DROP POLICY IF EXISTS "erp_empleados_select" ON erp_empleados;
DROP POLICY IF EXISTS "erp_empleados_write" ON erp_empleados;
CREATE POLICY "erp_empleados_select" ON erp_empleados FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = created_by);
CREATE POLICY "erp_empleados_write" ON erp_empleados FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_MATERIALES
DROP POLICY IF EXISTS "erp_materiales_select" ON erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_write" ON erp_materiales;
CREATE POLICY "erp_materiales_select" ON erp_materiales FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')) OR auth.uid() = created_by);
CREATE POLICY "erp_materiales_write" ON erp_materiales FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')));

-- ERP_ORDENES_COMPRA
DROP POLICY IF EXISTS "erp_ordenes_compra_select" ON erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_write" ON erp_ordenes_compra;
CREATE POLICY "erp_ordenes_compra_select" ON erp_ordenes_compra FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')) OR auth.uid() = created_by);
CREATE POLICY "erp_ordenes_compra_write" ON erp_ordenes_compra FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));

-- ERP_PROVEEDORES
DROP POLICY IF EXISTS "erp_proveedores_select" ON erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_write" ON erp_proveedores;
CREATE POLICY "erp_proveedores_select" ON erp_proveedores FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')));
CREATE POLICY "erp_proveedores_write" ON erp_proveedores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));

-- ERP_EVENTOS_CALENDARIO
DROP POLICY IF EXISTS "erp_eventos_calendario_select" ON erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_write" ON erp_eventos_calendario;
CREATE POLICY "erp_eventos_calendario_select" ON erp_eventos_calendario FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = created_by);
CREATE POLICY "erp_eventos_calendario_write" ON erp_eventos_calendario FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_BITACORA
DROP POLICY IF EXISTS "erp_bitacora_select" ON erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_write" ON erp_bitacora;
CREATE POLICY "erp_bitacora_select" ON erp_bitacora FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = created_by);
CREATE POLICY "erp_bitacora_write" ON erp_bitacora FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_SEGUIMIENTO (EVM)
DROP POLICY IF EXISTS "erp_seguimiento_select" ON erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_write" ON erp_seguimiento;
CREATE POLICY "erp_seguimiento_select" ON erp_seguimiento FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));
CREATE POLICY "erp_seguimiento_write" ON erp_seguimiento FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));

-- ERP_RENGLONES
DROP POLICY IF EXISTS "erp_renglones_select" ON erp_renglones;
DROP POLICY IF EXISTS "erp_renglones_write" ON erp_renglones;
CREATE POLICY "erp_renglones_select" ON erp_renglones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = created_by);
CREATE POLICY "erp_renglones_write" ON erp_renglones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_INSUMOS
DROP POLICY IF EXISTS "erp_insumos_select" ON erp_insumos;
DROP POLICY IF EXISTS "erp_insumos_write" ON erp_insumos;
CREATE POLICY "erp_insumos_select" ON erp_insumos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));
CREATE POLICY "erp_insumos_write" ON erp_insumos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_SUB_RENGLONES
DROP POLICY IF EXISTS "erp_sub_renglones_select" ON erp_sub_renglones;
DROP POLICY IF EXISTS "erp_sub_renglones_write" ON erp_sub_renglones;
CREATE POLICY "erp_sub_renglones_select" ON erp_sub_renglones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));
CREATE POLICY "erp_sub_renglones_write" ON erp_sub_renglones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_PRESUPUESTOS
DROP POLICY IF EXISTS "erp_presupuestos_select" ON erp_presupuestos;
DROP POLICY IF EXISTS "erp_presupuestos_write" ON erp_presupuestos;
CREATE POLICY "erp_presupuestos_select" ON erp_presupuestos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));
CREATE POLICY "erp_presupuestos_write" ON erp_presupuestos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- LOGS_SISTEMA
DROP POLICY IF EXISTS "logs_sistema_select" ON logs_sistema;
DROP POLICY IF EXISTS "logs_sistema_insert" ON logs_sistema;
CREATE POLICY "logs_sistema_select" ON logs_sistema FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));
CREATE POLICY "logs_sistema_insert" ON logs_sistema FOR INSERT TO authenticated
  WITH CHECK (true);

-- DESTAJOS
DROP POLICY IF EXISTS "destajos_select" ON destajos;
DROP POLICY IF EXISTS "destajos_write" ON destajos;
CREATE POLICY "destajos_select" ON destajos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = registrado_por);
CREATE POLICY "destajos_write" ON destajos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- CAJAS_CHICAS
DROP POLICY IF EXISTS "cajas_chicas_select" ON cajas_chicas;
DROP POLICY IF EXISTS "cajas_chicas_write" ON cajas_chicas;
CREATE POLICY "cajas_chicas_select" ON cajas_chicas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero','Residente')));
CREATE POLICY "cajas_chicas_write" ON cajas_chicas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Residente')));

-- ACTIVOS_HERRAMIENTAS
DROP POLICY IF EXISTS "activos_herramientas_select" ON activos_herramientas;
DROP POLICY IF EXISTS "activos_herramientas_write" ON activos_herramientas;
CREATE POLICY "activos_herramientas_select" ON activos_herramientas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero','Residente')));
CREATE POLICY "activos_herramientas_write" ON activos_herramientas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')));

-- CUADRO_COMPARATIVO_PROVEEDORES
DROP POLICY IF EXISTS "cuadro_comparativo_select" ON cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS "cuadro_comparativo_write" ON cuadro_comparativo_proveedores;
CREATE POLICY "cuadro_comparativo_select" ON cuadro_comparativo_proveedores FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')) OR auth.uid() = created_by);
CREATE POLICY "cuadro_comparativo_write" ON cuadro_comparativo_proveedores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));

-- COTIZACIONES
DROP POLICY IF EXISTS "cotizaciones_select" ON cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_write" ON cotizaciones;
CREATE POLICY "cotizaciones_select" ON cotizaciones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));
CREATE POLICY "cotizaciones_write" ON cotizaciones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));

-- ANTICIPOS
DROP POLICY IF EXISTS "anticipos_select" ON anticipos;
DROP POLICY IF EXISTS "anticipos_write" ON anticipos;
CREATE POLICY "anticipos_select" ON anticipos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')) OR auth.uid() = created_by);
CREATE POLICY "anticipos_write" ON anticipos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));

-- AMORTIZACIONES
DROP POLICY IF EXISTS "amortizaciones_select" ON amortizaciones;
DROP POLICY IF EXISTS "amortizaciones_write" ON amortizaciones;
CREATE POLICY "amortizaciones_select" ON amortizaciones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));
CREATE POLICY "amortizaciones_write" ON amortizaciones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));

-- PAGOS_PROVEEDORES
DROP POLICY IF EXISTS "pagos_proveedores_select" ON pagos_proveedores;
DROP POLICY IF EXISTS "pagos_proveedores_write" ON pagos_proveedores;
CREATE POLICY "pagos_proveedores_select" ON pagos_proveedores FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));
CREATE POLICY "pagos_proveedores_write" ON pagos_proveedores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));

-- VENTAS_PAQUETES
DROP POLICY IF EXISTS "ventas_paquetes_select" ON ventas_paquetes;
DROP POLICY IF EXISTS "ventas_paquetes_write" ON ventas_paquetes;
CREATE POLICY "ventas_paquetes_select" ON ventas_paquetes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Residente','Bodeguero')));
CREATE POLICY "ventas_paquetes_write" ON ventas_paquetes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Residente')));

-- CENTROS_COSTO
DROP POLICY IF EXISTS "centros_costo_select" ON centros_costo;
DROP POLICY IF EXISTS "centros_costo_write" ON centros_costo;
CREATE POLICY "centros_costo_select" ON centros_costo FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));
CREATE POLICY "centros_costo_write" ON centros_costo FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras')));

-- ERP_INSUMOS_BASE
DROP POLICY IF EXISTS "erp_insumos_base_select" ON erp_insumos_base;
DROP POLICY IF EXISTS "erp_insumos_base_write" ON erp_insumos_base;
CREATE POLICY "erp_insumos_base_select" ON erp_insumos_base FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));
CREATE POLICY "erp_insumos_base_write" ON erp_insumos_base FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));

-- ERP_RENDIMIENTOS_CUADRILLA
DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_select" ON erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_write" ON erp_rendimientos_cuadrilla;
CREATE POLICY "erp_rendimientos_cuadrilla_select" ON erp_rendimientos_cuadrilla FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));
CREATE POLICY "erp_rendimientos_cuadrilla_write" ON erp_rendimientos_cuadrilla FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));

-- ERP_VALES_SALIDA
DROP POLICY IF EXISTS "erp_vales_salida_select" ON erp_vales_salida;
DROP POLICY IF EXISTS "erp_vales_salida_write" ON erp_vales_salida;
CREATE POLICY "erp_vales_salida_select" ON erp_vales_salida FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')) OR auth.uid() = created_by);
CREATE POLICY "erp_vales_salida_write" ON erp_vales_salida FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));

-- ERP_AUDITORIA (solo SELECT para Admin/Gerente)
DROP POLICY IF EXISTS "erp_auditoria_select" ON erp_auditoria;
CREATE POLICY "erp_auditoria_select" ON erp_auditoria FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));

-- ERP_AVANCES
DROP POLICY IF EXISTS "erp_avances_select" ON erp_avances;
DROP POLICY IF EXISTS "erp_avances_write" ON erp_avances;
CREATE POLICY "erp_avances_select" ON erp_avances FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = created_by);
CREATE POLICY "erp_avances_write" ON erp_avances FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_LICITACIONES
DROP POLICY IF EXISTS "erp_licitaciones_select" ON erp_licitaciones;
DROP POLICY IF EXISTS "erp_licitaciones_write" ON erp_licitaciones;
CREATE POLICY "erp_licitaciones_select" ON erp_licitaciones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = created_by);
CREATE POLICY "erp_licitaciones_write" ON erp_licitaciones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ============================================================
-- PART 8: UNIQUE constraint erp_presupuestos (migration 006)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'erp_presupuestos_proyecto_id_version_presupuesto_key'
  ) THEN
    ALTER TABLE erp_presupuestos
      ADD CONSTRAINT erp_presupuestos_proyecto_id_version_presupuesto_key
      UNIQUE (proyecto_id, version_presupuesto);
  END IF;
END $$;

-- ============================================================
-- PART 9: Trigger audit (fn_log_audit_trigger de migration 006)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_log_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO logs_sistema (usuario_id, usuario_nombre, accion, entidad, entidad_id, valores_anteriores, valores_nuevos)
  VALUES (
    auth.uid(),
    COALESCE((SELECT nombre FROM public.profiles WHERE id = auth.uid()), 'Sistema'),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_audit_presupuestos ON erp_presupuestos;
CREATE TRIGGER trg_log_audit_presupuestos
  AFTER INSERT OR UPDATE OR DELETE ON erp_presupuestos
  FOR EACH ROW EXECUTE FUNCTION fn_log_audit_trigger();

DROP TRIGGER IF EXISTS trg_log_audit_proyectos ON erp_proyectos;
CREATE TRIGGER trg_log_audit_proyectos
  AFTER INSERT OR UPDATE OR DELETE ON erp_proyectos
  FOR EACH ROW EXECUTE FUNCTION fn_log_audit_trigger();

-- fn_set_updated_at para triggers
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at para tablas core
DROP TRIGGER IF EXISTS trg_erp_proyectos_updated ON erp_proyectos;
CREATE TRIGGER trg_erp_proyectos_updated BEFORE UPDATE ON erp_proyectos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_movimientos_updated ON erp_movimientos;
CREATE TRIGGER trg_erp_movimientos_updated BEFORE UPDATE ON erp_movimientos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_empleados_updated ON erp_empleados;
CREATE TRIGGER trg_erp_empleados_updated BEFORE UPDATE ON erp_empleados
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_materiales_updated ON erp_materiales;
CREATE TRIGGER trg_erp_materiales_updated BEFORE UPDATE ON erp_materiales
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_ordenes_compra_updated ON erp_ordenes_compra;
CREATE TRIGGER trg_erp_ordenes_compra_updated BEFORE UPDATE ON erp_ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_proveedores_updated ON erp_proveedores;
CREATE TRIGGER trg_erp_proveedores_updated BEFORE UPDATE ON erp_proveedores
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_eventos_calendario_updated ON erp_eventos_calendario;
CREATE TRIGGER trg_erp_eventos_calendario_updated BEFORE UPDATE ON erp_eventos_calendario
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_bitacora_updated ON erp_bitacora;
CREATE TRIGGER trg_erp_bitacora_updated BEFORE UPDATE ON erp_bitacora
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_seguimiento_updated ON erp_seguimiento;
CREATE TRIGGER trg_erp_seguimiento_updated BEFORE UPDATE ON erp_seguimiento
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_renglones_updated ON erp_renglones;
CREATE TRIGGER trg_erp_renglones_updated BEFORE UPDATE ON erp_renglones
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_insumos_updated ON erp_insumos;
CREATE TRIGGER trg_erp_insumos_updated BEFORE UPDATE ON erp_insumos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_erp_sub_renglones_updated ON erp_sub_renglones;
CREATE TRIGGER trg_erp_sub_renglones_updated BEFORE UPDATE ON erp_sub_renglones
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
-- erp_presupuestos usa fecha_actualizacion, no updated_at
CREATE OR REPLACE FUNCTION public.update_erp_presupuestos_timestamp()
RETURNS trigger AS $$
BEGIN NEW.fecha_actualizacion = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_erp_presupuestos_timestamp ON erp_presupuestos;
CREATE TRIGGER trg_erp_presupuestos_timestamp
  BEFORE UPDATE ON erp_presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.update_erp_presupuestos_timestamp();

-- Trigger updated_at para erp_vales_salida
DROP TRIGGER IF EXISTS trg_erp_vales_salida_updated ON erp_vales_salida;
CREATE TRIGGER trg_erp_vales_salida_updated
  BEFORE UPDATE ON erp_vales_salida
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- updated_at para erp_licitaciones
DROP TRIGGER IF EXISTS trg_erp_licitaciones_updated ON erp_licitaciones;
CREATE TRIGGER trg_erp_licitaciones_updated
  BEFORE UPDATE ON erp_licitaciones
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- PART 10: handle_new_user actualizado (migration 007)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol, avatar_url, user_metadata)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
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
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PART 11: Fix perfiles existentes (migration 007)
-- ============================================================
UPDATE public.profiles
SET rol = 'Administrador'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'salazaroliveros@gmail.com')
AND rol IS DISTINCT FROM 'Administrador';

UPDATE public.profiles
SET avatar_url = user_metadata->>'picture'
WHERE avatar_url IS NULL
AND user_metadata IS NOT NULL
AND user_metadata->>'picture' IS NOT NULL;

-- ============================================================
-- PART 12: Seed data (migration 004)
-- ============================================================
INSERT INTO erp_insumos_base (nombre, categoria, unidad, precio_referencia, rubro)
VALUES
  ('Cemento Portland Tipo I', 'materiales', 'bolsa', 12.50, 'estructura'),
  ('Varilla corrugada 3/8', 'materiales', 'ton', 850.00, 'estructura'),
  ('Arena gruesa', 'materiales', 'm3', 180.00, 'estructura'),
  ('Grava 3/4', 'materiales', 'm3', 220.00, 'estructura'),
  ('Block hueco 15x20x40', 'materiales', 'pza', 8.50, 'mamposteria'),
  ('Mortero premezclado', 'materiales', 'bolsa', 6.80, 'mamposteria'),
  ('Cable THW calibre 12', 'materiales', 'm', 3.50, 'instalaciones'),
  ('Tubería PVC 4"', 'materiales', 'tramo', 45.00, 'instalaciones'),
  ('Pintura vinílica blanca', 'materiales', 'galon', 95.00, 'acabados'),
  ('Mano de obra albañil', 'mano_obra', 'jornal', 350.00, 'general')
ON CONFLICT DO NOTHING;

INSERT INTO erp_rendimientos_cuadrilla (actividad, cuadrilla, rendimiento_diario, unidad)
VALUES
  ('Muros de block', 'Cuadrilla A', 12.00, 'm2'),
  ('Losas de concreto', 'Cuadrilla B', 8.00, 'm3'),
  ('Enjarre', 'Cuadrilla C', 20.00, 'm2'),
  ('Pisos de cerámica', 'Cuadrilla D', 15.00, 'm2'),
  ('Instalación eléctrica', 'Cuadrilla E', 50.00, 'pto')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART 13: Índices para tablas nuevas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_logs_sistema_entidad ON logs_sistema(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_fecha ON logs_sistema(created_at);
CREATE INDEX IF NOT EXISTS idx_destajos_proyecto ON destajos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_destajos_fecha ON destajos(fecha);
CREATE INDEX IF NOT EXISTS idx_cajas_chicas_proyecto ON cajas_chicas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cajas_chicas_estado ON cajas_chicas(estado);
CREATE INDEX IF NOT EXISTS idx_activos_estado ON activos_herramientas(estado);
CREATE INDEX IF NOT EXISTS idx_activos_proyecto ON activos_herramientas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cuadro_estado ON cuadro_comparativo_proveedores(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cuadro ON cotizaciones(cuadro_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_proyecto ON anticipos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_estado ON anticipos(estado);
CREATE INDEX IF NOT EXISTS idx_amortizaciones_anticipo ON amortizaciones(anticipo_id);
CREATE INDEX IF NOT EXISTS idx_pagos_vencimiento ON pagos_proveedores(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos_proveedores(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_proveedor ON pagos_proveedores(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ventas_proyecto ON ventas_paquetes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas_paquetes(estado);
CREATE INDEX IF NOT EXISTS idx_centros_costo_proyecto ON centros_costo(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_proyecto ON erp_vales_salida(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_fecha ON erp_vales_salida(fecha);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_usuario ON logs_sistema(usuario_id);
CREATE INDEX IF NOT EXISTS idx_erp_auditoria_tabla ON erp_auditoria(tabla);
CREATE INDEX IF NOT EXISTS idx_erp_auditoria_creado ON erp_auditoria(creado_en);
CREATE INDEX IF NOT EXISTS idx_erp_avances_proyecto ON erp_avances(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_avances_fecha ON erp_avances(fecha);
CREATE INDEX IF NOT EXISTS idx_erp_licitaciones_estado ON erp_licitaciones(estado);
