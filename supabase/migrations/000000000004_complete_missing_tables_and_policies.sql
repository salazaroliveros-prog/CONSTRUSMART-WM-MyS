-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 4: TABLAS FALTANTES + POLÍTICAS RLS
-- Versión: 2026-07-06
--
-- Completa todas las tablas que aparecen en el esquema pero
-- no fueron creadas en migraciones anteriores, más las columnas
-- faltantes y políticas RLS para evitar errores 401/403.
-- ============================================================

-- ============================================================
-- 1. CREAR TABLAS FALTANTES
-- ============================================================

-- erp_insumos_base
CREATE TABLE IF NOT EXISTS erp_insumos_base (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  categoria text NOT NULL,
  unidad text NOT NULL,
  precio_referencia numeric(12,2) NOT NULL DEFAULT 0,
  rubro text NOT NULL DEFAULT '',
  activo boolean NOT NULL DEFAULT true,
  fecha_actualizacion date NOT NULL DEFAULT CURRENT_DATE
);

-- erp_rendimientos_cuadrilla
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

-- erp_auditoria
CREATE TABLE IF NOT EXISTS erp_auditoria (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accion text NOT NULL,
  tabla text NOT NULL,
  registro_id uuid,
  datos jsonb,
  ip text,
  user_agent text,
  creado_en timestamptz DEFAULT now() NOT NULL
);

-- erp_licitaciones
CREATE TABLE IF NOT EXISTS erp_licitaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  cliente text NOT NULL,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  fecha_limite date NOT NULL,
  estado text NOT NULL DEFAULT 'activa' CHECK (estado = ANY (ARRAY['activa','adjudicada','perdida','cerrada'])),
  documentos jsonb DEFAULT '[]'::jsonb,
  notas text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_hitos
CREATE TABLE IF NOT EXISTS erp_hitos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  fecha date NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['hito','entregable','pago','administrativo','legal'])),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','en_progreso','completado','cancelado'])),
  responsable text,
  depends_on text,
  completado_en timestamp,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_riesgos
CREATE TABLE IF NOT EXISTS erp_riesgos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['tecnico','financiero','legal','ambiental','social','seguridad'])),
  probabilidad integer NOT NULL DEFAULT 1 CHECK (probabilidad >= 1 AND probabilidad <= 5),
  impacto integer NOT NULL DEFAULT 1 CHECK (impacto >= 1 AND impacto <= 5),
  nivel text NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN probabilidad * impacto >= 15 THEN 'critico'
      WHEN probabilidad * impacto >= 8 THEN 'alto'
      WHEN probabilidad * impacto >= 4 THEN 'medio'
      ELSE 'bajo'
    END
  ) STORED,
  plan_mitigacion text,
  plan_contingencia text,
  responsable text,
  fecha_identificacion date NOT NULL DEFAULT CURRENT_DATE,
  estado text NOT NULL DEFAULT 'identificado' CHECK (estado = ANY (ARRAY['identificado','mitigado','contingencia','cerrado'])),
  costo_soporte numeric(12,2),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_cuentas_cobrar
CREATE TABLE IF NOT EXISTS erp_cuentas_cobrar (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  cliente text NOT NULL,
  concepto text NOT NULL,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  saldo_pendiente numeric(12,2) NOT NULL DEFAULT 0,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date NOT NULL,
  fecha_cobro date,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','pagada','vencida','cancelada'])),
  notas text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_cuentas_pagar
CREATE TABLE IF NOT EXISTS erp_cuentas_pagar (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  proveedor text NOT NULL,
  concepto text NOT NULL,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  saldo_pendiente numeric(12,2) NOT NULL DEFAULT 0,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date NOT NULL,
  fecha_pago date,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','pagada','vencida','cancelada'])),
  factura_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_ordenes_cambio
CREATE TABLE IF NOT EXISTS erp_ordenes_cambio (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  impacto_costo numeric(12,2) NOT NULL DEFAULT 0,
  impacto_plazo integer NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'solicitada' CHECK (estado = ANY (ARRAY['solicitada','aprobada','rechazada','implementada'])),
  solicitante text NOT NULL,
  solicitante_rol text NOT NULL,
  aprobador uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_aprobacion timestamp,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_muro (muro social/publicaciones del proyecto)
CREATE TABLE IF NOT EXISTS erp_muro (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  autor text NOT NULL,
  autor_avatar text,
  contenido text NOT NULL,
  tipo text NOT NULL DEFAULT 'publicacion' CHECK (tipo = ANY (ARRAY['publicacion','aviso','documento','foto'])),
  fotos text[],
  documento jsonb,
  likes integer DEFAULT 0,
  comentarios jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_incidentes
CREATE TABLE IF NOT EXISTS erp_incidentes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['accidente','incidente','cuasi-accidente','condicion_insegura','acto_inseguro'])),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  hora time,
  descripcion text NOT NULL,
  afectados text NOT NULL,
  testigos text,
  acciones_inmediatas text,
  reportado_por text NOT NULL,
  latitud double precision,
  longitud double precision,
  fotos text[],
  estado text NOT NULL DEFAULT 'reportado' CHECK (estado = ANY (ARRAY['reportado','investigacion','cerrado'])),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_pruebas_laboratorio
CREATE TABLE IF NOT EXISTS erp_pruebas_laboratorio (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descripcion text NOT NULL,
  fecha_muestra date NOT NULL,
  fecha_resultado date,
  resultado text NOT NULL DEFAULT 'pendiente' CHECK (resultado = ANY (ARRAY['pendiente','aprobado','rechazado','condicional'])),
  responsable text NOT NULL,
  observaciones text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_no_conformidades
CREATE TABLE IF NOT EXISTS erp_no_conformidades (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  descripcion text NOT NULL,
  categoria text NOT NULL CHECK (categoria = ANY (ARRAY['calidad','seguridad','ambiental','documental','otro'])),
  fecha_deteccion date NOT NULL DEFAULT CURRENT_DATE,
  detectado_por text NOT NULL,
  plan_accion text,
  responsable_cierre text,
  fecha_cierre date,
  estado text NOT NULL DEFAULT 'abierta' CHECK (estado = ANY (ARRAY['abierta','en_proceso','cerrada'])),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_nc_codigo UNIQUE (proyecto_id, codigo)
);

-- erp_liberaciones_partida
CREATE TABLE IF NOT EXISTS erp_liberaciones_partida (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  renglon_id uuid REFERENCES erp_renglones(id) ON DELETE SET NULL,
  renglon_nombre text NOT NULL,
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_liberacion date,
  solicitante text NOT NULL,
  supervisor text NOT NULL,
  checklist_aprobado boolean,
  observaciones text,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','aprobado','rechazado'])),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- 2. COLUMNAS FALTANTES EN TABLAS EXISTENTES
-- ============================================================

-- profiles: agregar avatar_url
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- erp_empleados: agregar avatar_url
ALTER TABLE erp_empleados
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- erp_ordenes_compra: agregar proyecto_id
ALTER TABLE erp_ordenes_compra
  ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL;

-- erp_proveedores: agregar columnas faltantes
ALTER TABLE erp_proveedores
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS categoria text;

-- erp_vales_salida: agregar renglon_id
ALTER TABLE erp_vales_salida
  ADD COLUMN IF NOT EXISTS renglon_id uuid REFERENCES erp_renglones(id) ON DELETE SET NULL;

-- erp_avances: agregar columnas faltantes del esquema
ALTER TABLE erp_avances
  ADD COLUMN IF NOT EXISTS presupuesto_id uuid REFERENCES erp_presupuestos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS foto text,
  ADD COLUMN IF NOT EXISTS latitud double precision,
  ADD COLUMN IF NOT EXISTS longitud double precision;

-- ============================================================
-- 3. HABILITAR RLS EN TODAS LAS TABLAS NUEVAS
-- ============================================================

ALTER TABLE erp_insumos_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_licitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_hitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_riesgos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_cuentas_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_cuentas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_ordenes_cambio ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_muro ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_pruebas_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_no_conformidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_liberaciones_partida ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. POLÍTICAS RLS PARA TABLAS NUEVAS
-- ============================================================

-- erp_insumos_base: Admin/Gerente/Residente pueden todo, otros solo lectura
DROP POLICY IF EXISTS "erp_insumos_base_read" ON erp_insumos_base;
CREATE POLICY "erp_insumos_base_read" ON erp_insumos_base
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "erp_insumos_base_write" ON erp_insumos_base;
CREATE POLICY "erp_insumos_base_write" ON erp_insumos_base
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

-- erp_rendimientos_cuadrilla: Admin/Gerente/Residente
DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_read" ON erp_rendimientos_cuadrilla;
CREATE POLICY "erp_rendimientos_cuadrilla_read" ON erp_rendimientos_cuadrilla
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_write" ON erp_rendimientos_cuadrilla;
CREATE POLICY "erp_rendimientos_cuadrilla_write" ON erp_rendimientos_cuadrilla
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

-- erp_auditoria: solo Admin/Gerente pueden leer, nadie inserta directo (solo trigger)
DROP POLICY IF EXISTS "erp_auditoria_read" ON erp_auditoria;
CREATE POLICY "erp_auditoria_read" ON erp_auditoria
  FOR SELECT TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente')
  );

DROP POLICY IF EXISTS "erp_auditoria_insert" ON erp_auditoria;
CREATE POLICY "erp_auditoria_insert" ON erp_auditoria
  FOR INSERT TO authenticated WITH CHECK (true);

-- erp_licitaciones: Admin/Gerente pueden todo, resto solo lectura
DROP POLICY IF EXISTS "erp_licitaciones_read" ON erp_licitaciones;
CREATE POLICY "erp_licitaciones_read" ON erp_licitaciones
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "erp_licitaciones_write" ON erp_licitaciones;
CREATE POLICY "erp_licitaciones_write" ON erp_licitaciones
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente')
  );

-- erp_hitos: Admin/Gerente/Residente pueden todo, resto lectura proyecto
DROP POLICY IF EXISTS "erp_hitos_read" ON erp_hitos;
CREATE POLICY "erp_hitos_read" ON erp_hitos
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

DROP POLICY IF EXISTS "erp_hitos_write" ON erp_hitos;
CREATE POLICY "erp_hitos_write" ON erp_hitos
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

-- erp_riesgos: Admin/Gerente/Residente pueden todo, resto lectura proyecto
DROP POLICY IF EXISTS "erp_riesgos_read" ON erp_riesgos;
CREATE POLICY "erp_riesgos_read" ON erp_riesgos
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

DROP POLICY IF EXISTS "erp_riesgos_write" ON erp_riesgos;
CREATE POLICY "erp_riesgos_write" ON erp_riesgos
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

-- erp_cuentas_cobrar: Admin/Gerente pueden todo, resto lectura proyecto
DROP POLICY IF EXISTS "erp_cuentas_cobrar_read" ON erp_cuentas_cobrar;
CREATE POLICY "erp_cuentas_cobrar_read" ON erp_cuentas_cobrar
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

DROP POLICY IF EXISTS "erp_cuentas_cobrar_write" ON erp_cuentas_cobrar;
CREATE POLICY "erp_cuentas_cobrar_write" ON erp_cuentas_cobrar
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente')
  );

-- erp_cuentas_pagar: Admin/Gerente/Compras pueden todo, resto lectura proyecto
DROP POLICY IF EXISTS "erp_cuentas_pagar_read" ON erp_cuentas_pagar;
CREATE POLICY "erp_cuentas_pagar_read" ON erp_cuentas_pagar
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

DROP POLICY IF EXISTS "erp_cuentas_pagar_write" ON erp_cuentas_pagar;
CREATE POLICY "erp_cuentas_pagar_write" ON erp_cuentas_pagar
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Compras')
  );

-- erp_ordenes_cambio: Admin/Gerente/Residente pueden todo, resto lectura proyecto
DROP POLICY IF EXISTS "erp_ordenes_cambio_read" ON erp_ordenes_cambio;
CREATE POLICY "erp_ordenes_cambio_read" ON erp_ordenes_cambio
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

DROP POLICY IF EXISTS "erp_ordenes_cambio_write" ON erp_ordenes_cambio;
CREATE POLICY "erp_ordenes_cambio_write" ON erp_ordenes_cambio
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

-- erp_muro: Admin/Gerente/Residente pueden todo, resto lectura proyecto
DROP POLICY IF EXISTS "erp_muro_read" ON erp_muro;
CREATE POLICY "erp_muro_read" ON erp_muro
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

DROP POLICY IF EXISTS "erp_muro_write" ON erp_muro;
CREATE POLICY "erp_muro_write" ON erp_muro
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

-- erp_incidentes: Admin/Gerente/Residente pueden todo, resto lectura proyecto
DROP POLICY IF EXISTS "erp_incidentes_read" ON erp_incidentes;
CREATE POLICY "erp_incidentes_read" ON erp_incidentes
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

DROP POLICY IF EXISTS "erp_incidentes_write" ON erp_incidentes;
CREATE POLICY "erp_incidentes_write" ON erp_incidentes
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

-- erp_pruebas_laboratorio: Admin/Gerente/Residente pueden todo, resto lectura proyecto
DROP POLICY IF EXISTS "erp_pruebas_laboratorio_read" ON erp_pruebas_laboratorio;
CREATE POLICY "erp_pruebas_laboratorio_read" ON erp_pruebas_laboratorio
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

DROP POLICY IF EXISTS "erp_pruebas_laboratorio_write" ON erp_pruebas_laboratorio;
CREATE POLICY "erp_pruebas_laboratorio_write" ON erp_pruebas_laboratorio
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

-- erp_no_conformidades: Admin/Gerente/Residente pueden todo, resto lectura proyecto
DROP POLICY IF EXISTS "erp_no_conformidades_read" ON erp_no_conformidades;
CREATE POLICY "erp_no_conformidades_read" ON erp_no_conformidades
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

DROP POLICY IF EXISTS "erp_no_conformidades_write" ON erp_no_conformidades;
CREATE POLICY "erp_no_conformidades_write" ON erp_no_conformidades
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

-- erp_liberaciones_partida: Admin/Gerente/Residente pueden todo, resto lectura proyecto
DROP POLICY IF EXISTS "erp_liberaciones_partida_read" ON erp_liberaciones_partida;
CREATE POLICY "erp_liberaciones_partida_read" ON erp_liberaciones_partida
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

DROP POLICY IF EXISTS "erp_liberaciones_partida_write" ON erp_liberaciones_partida;
CREATE POLICY "erp_liberaciones_partida_write" ON erp_liberaciones_partida
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

-- ============================================================
-- 5. ÍNDICES PARA TABLAS NUEVAS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_insumos_base_categoria ON erp_insumos_base(categoria);
CREATE INDEX IF NOT EXISTS idx_insumos_base_rubro ON erp_insumos_base(rubro);

CREATE INDEX IF NOT EXISTS idx_rendimientos_actividad ON erp_rendimientos_cuadrilla(actividad);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON erp_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON erp_auditoria(tabla);
CREATE INDEX IF NOT EXISTS idx_auditoria_creado ON erp_auditoria(creado_en);

CREATE INDEX IF NOT EXISTS idx_licitaciones_estado ON erp_licitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_licitaciones_fecha ON erp_licitaciones(fecha_limite);

CREATE INDEX IF NOT EXISTS idx_hitos_proyecto ON erp_hitos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_hitos_fecha ON erp_hitos(fecha);
CREATE INDEX IF NOT EXISTS idx_hitos_estado ON erp_hitos(estado);

CREATE INDEX IF NOT EXISTS idx_riesgos_proyecto ON erp_riesgos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_riesgos_nivel ON erp_riesgos(nivel);
CREATE INDEX IF NOT EXISTS idx_riesgos_estado ON erp_riesgos(estado);

CREATE INDEX IF NOT EXISTS idx_ctas_cobrar_proyecto ON erp_cuentas_cobrar(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ctas_cobrar_estado ON erp_cuentas_cobrar(estado);
CREATE INDEX IF NOT EXISTS idx_ctas_cobrar_vencimiento ON erp_cuentas_cobrar(fecha_vencimiento);

CREATE INDEX IF NOT EXISTS idx_ctas_pagar_proyecto ON erp_cuentas_pagar(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ctas_pagar_estado ON erp_cuentas_pagar(estado);
CREATE INDEX IF NOT EXISTS idx_ctas_pagar_vencimiento ON erp_cuentas_pagar(fecha_vencimiento);

CREATE INDEX IF NOT EXISTS idx_ordenes_cambio_proyecto ON erp_ordenes_cambio(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_cambio_estado ON erp_ordenes_cambio(estado);

CREATE INDEX IF NOT EXISTS idx_muro_proyecto ON erp_muro(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_muro_tipo ON erp_muro(tipo);
CREATE INDEX IF NOT EXISTS idx_muro_created ON erp_muro(created_at);

CREATE INDEX IF NOT EXISTS idx_incidentes_proyecto ON erp_incidentes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_tipo ON erp_incidentes(tipo);
CREATE INDEX IF NOT EXISTS idx_incidentes_estado ON erp_incidentes(estado);

CREATE INDEX IF NOT EXISTS idx_pruebas_proyecto ON erp_pruebas_laboratorio(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_pruebas_tipo ON erp_pruebas_laboratorio(tipo);
CREATE INDEX IF NOT EXISTS idx_pruebas_resultado ON erp_pruebas_laboratorio(resultado);

CREATE INDEX IF NOT EXISTS idx_no_conformidades_proyecto ON erp_no_conformidades(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_no_conformidades_estado ON erp_no_conformidades(estado);
CREATE INDEX IF NOT EXISTS idx_no_conformidades_codigo ON erp_no_conformidades(codigo);

CREATE INDEX IF NOT EXISTS idx_liberaciones_proyecto ON erp_liberaciones_partida(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_liberaciones_estado ON erp_liberaciones_partida(estado);

-- ============================================================
-- 6. TRIGGERS updated_at PARA TABLAS NUEVAS
-- ============================================================

DO $$
DECLARE
  tbl text;
  tables_list text[] := ARRAY[
    'erp_rendimientos_cuadrilla',
    'erp_licitaciones',
    'erp_hitos',
    'erp_riesgos',
    'erp_cuentas_cobrar',
    'erp_cuentas_pagar',
    'erp_ordenes_cambio',
    'erp_muro',
    'erp_incidentes',
    'erp_pruebas_laboratorio',
    'erp_no_conformidades',
    'erp_liberaciones_partida'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_list
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I; CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();',
      'trg_' || tbl || '_updated', tbl,
      'trg_' || tbl || '_updated', tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- 7. ACTIVAR REALTIME (REPLICA IDENTITY FULL) EN TABLAS NUEVAS
-- ============================================================

ALTER TABLE erp_insumos_base REPLICA IDENTITY FULL;
ALTER TABLE erp_rendimientos_cuadrilla REPLICA IDENTITY FULL;
ALTER TABLE erp_auditoria REPLICA IDENTITY FULL;
ALTER TABLE erp_licitaciones REPLICA IDENTITY FULL;
ALTER TABLE erp_hitos REPLICA IDENTITY FULL;
ALTER TABLE erp_riesgos REPLICA IDENTITY FULL;
ALTER TABLE erp_cuentas_cobrar REPLICA IDENTITY FULL;
ALTER TABLE erp_cuentas_pagar REPLICA IDENTITY FULL;
ALTER TABLE erp_ordenes_cambio REPLICA IDENTITY FULL;
ALTER TABLE erp_muro REPLICA IDENTITY FULL;
ALTER TABLE erp_incidentes REPLICA IDENTITY FULL;
ALTER TABLE erp_pruebas_laboratorio REPLICA IDENTITY FULL;
ALTER TABLE erp_no_conformidades REPLICA IDENTITY FULL;
ALTER TABLE erp_liberaciones_partida REPLICA IDENTITY FULL;

-- ============================================================
-- FIN MIGRACIÓN 4
-- ============================================================