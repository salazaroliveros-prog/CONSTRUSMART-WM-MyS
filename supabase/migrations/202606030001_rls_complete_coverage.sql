-- CONSTRUSMART ERP - RLS completo multi-rol (cobertura total del esquema)
-- Ejecutar en Supabase SQL Editor tras confirmar tablas creadas.
-- Compatible con la base compartida incluyendo tablas de fases 2-4: destajos,
-- cajas_chicas, activos_herramientas, cuadro_comparativo_proveedores, cotizaciones,
-- anticipos, amortizaciones, pagos_proveedores, ventas_paquetes, centros_costo,
-- erp_insumos_base, erp_rendimientos_cuadrilla, erp_vales_salida.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_orden') THEN
    CREATE TYPE estado_orden AS ENUM ('borrador','pendiente','aprobado','rechazado','recibida','cancelada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_proyecto') THEN
    CREATE TYPE estado_proyecto AS ENUM ('planeacion','ejecucion','pausado','finalizado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_presupuesto') THEN
    CREATE TYPE estado_presupuesto AS ENUM ('borrador','aprobado','revisado','rechazado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_licitacion') THEN
    CREATE TYPE estado_licitacion AS ENUM ('activa','ganada','perdida','cancelada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_anticipo') THEN
    CREATE TYPE estado_anticipo AS ENUM ('activo','amortizado','cancelado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_pago') THEN
    CREATE TYPE estado_pago AS ENUM ('pendiente','pagado','vencido','cancelado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_venta') THEN
    CREATE TYPE estado_venta AS ENUM ('disponible','reservado','vendido','entregado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_cuadro') THEN
    CREATE TYPE estado_cuadro AS ENUM ('abierto','cerrado','adjudicado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_caja') THEN
    CREATE TYPE tipo_caja AS ENUM ('materiales','herramientas','transporte','comidas','otros');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_caja') THEN
    CREATE TYPE estado_caja AS ENUM ('pendiente','aprobada','rechazada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_activo') THEN
    CREATE TYPE tipo_activo AS ENUM ('herramienta','equipo','vehiculo','accesorio');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_activo') THEN
    CREATE TYPE estado_activo AS ENUM ('disponible','asignado','mantenimiento','baja');
  END IF;
END $$;

-- Tablas producers (no altera columnas existentes; crea las faltantes)
-- Nota: si una tabla ya existe, se salta.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre text NOT NULL DEFAULT '',
  rol text NOT NULL DEFAULT 'usuario' CHECK (rol = ANY (ARRAY['Administrador','Gerente','Residente','Compras','Bodeguero','usuario'])),
  user_metadata jsonb,
  avatar_url text,
  empresa_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.erp_auditoria (
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
ALTER TABLE public.erp_auditoria ENABLE ROW LEVEL SECURITY;

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
  updated_at timestamptz DEFAULT now() NOT NULL,
  presupuesto_actual_id uuid
);
ALTER TABLE erp_proyectos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS erp_movimientos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['ingreso','gasto','egreso'])),
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  descripcion text NOT NULL,
  cantidad numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL,
  categoria text NOT NULL CHECK (categoria = ANY (ARRAY[
    'materiales','mano_obra','equipo','subcontrato',
    'administracion','transporte','imprevistos','marketing',
    'licencias','seguros','otros'
  ])),
  costo_unitario numeric(10,2) NOT NULL DEFAULT 0,
  costo_total numeric(12,2) NOT NULL DEFAULT 0,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE erp_movimientos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS erp_empleados (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  puesto text NOT NULL,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  salario_diario numeric(10,2) NOT NULL DEFAULT 0,
  dias_trabajados integer NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'planilla' CHECK (tipo = ANY (ARRAY['planilla','destajo','administrativo','operativo'])),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE erp_empleados ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_materiales ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_ordenes_compra ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_proveedores ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_eventos_calendario ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_bitacora ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_seguimiento ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_renglones ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_insumos ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_sub_renglones ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_presupuestos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS logs_sistema (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nombre text NOT NULL,
  accion text NOT NULL,
  entidad text NOT NULL,
  entidad_id text,
  valores_anteriores jsonb,
  valores_nuevos jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS destajos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  renglon_codigo text NOT NULL,
  cuadrilla text NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  cantidad_ejecutada numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL,
  horas_trabajadas numeric(10,2) NOT NULL DEFAULT 0,
  rendimiento_real numeric(10,2),
  rendimiento_teorico numeric(10,2) NOT NULL DEFAULT 0,
  observaciones text,
  registrado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE destajos ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE cajas_chicas ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS activos_herramientas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  codigo_inventario text NOT NULL UNIQUE,
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
ALTER TABLE activos_herramientas ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE cuadro_comparativo_proveedores ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE anticipos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS amortizaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  anticipo_id uuid NOT NULL REFERENCES anticipos(id) ON DELETE CASCADE,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  referencia text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE amortizaciones ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE ventas_paquetes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS centros_costo (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nombre text NOT NULL,
  presupuesto_asignado numeric(12,2) NOT NULL DEFAULT 0,
  gasto_actual numeric(12,2) NOT NULL DEFAULT 0,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['directo','indirecto','administrativo'])),
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE centros_costo ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE erp_insumos_base ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS erp_rendimientos_cuadrilla (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  actividad text NOT NULL,
  cuadrilla text NOT NULL,
  rendimiento_diario numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL
);
ALTER TABLE erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS erp_vales_salida (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  renglon_id uuid REFERENCES erp_renglones(id) ON DELETE SET NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  observaciones text,
  solicitante text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE erp_vales_salida ENABLE ROW LEVEL SECURITY;
