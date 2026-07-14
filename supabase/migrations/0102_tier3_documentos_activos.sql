-- ============================================================
-- MIGRACIÓN 0102: TIER 3 - DOCUMENTOS Y ACTIVOS
-- Fecha: 2026-12-27
-- Tablas: 6 nuevas (Planos, RFI, Submittal, Activos, etc)
-- Completitud final esperada: 95%
-- ============================================================

-- ============================================================
-- PASO 1: CREAR TABLA erp_planos (Documentos de Ingeniería)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_planos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  disciplina text NOT NULL CHECK (disciplina IN ('arquitectura', 'estructura', 'instalaciones', 'electricas', 'sanitarias', 'mecanicas', 'otra')),
  version text NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  fecha_subida date NOT NULL DEFAULT CURRENT_DATE,
  descripcion text,
  estado text NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente', 'obsoleto', 'en_revision', 'borrador')),
  subido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archivo_url text,
  tamaño_archivo integer,
  escala text,
  acotamiento text,
  notas_cambio text,
  aprobado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_aprobacion date,
  reemplaza_plano uuid REFERENCES public.erp_planos(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_planos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_planos_select" ON public.erp_planos;
CREATE POLICY "erp_planos_select" ON public.erp_planos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente', 'Arquitecto'))
);

DROP POLICY IF EXISTS "erp_planos_insert" ON public.erp_planos;
CREATE POLICY "erp_planos_insert" ON public.erp_planos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_planos_update" ON public.erp_planos;
CREATE POLICY "erp_planos_update" ON public.erp_planos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_planos_proyecto ON public.erp_planos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_planos_disciplina ON public.erp_planos(disciplina);
CREATE INDEX IF NOT EXISTS idx_planos_estado ON public.erp_planos(estado);
CREATE INDEX IF NOT EXISTS idx_planos_fecha ON public.erp_planos(fecha_subida);
CREATE INDEX IF NOT EXISTS idx_planos_version ON public.erp_planos(version);

DROP TRIGGER IF EXISTS trg_erp_planos_updated ON public.erp_planos;
CREATE TRIGGER trg_erp_planos_updated
  BEFORE UPDATE ON public.erp_planos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 2: CREAR TABLA erp_rfis (Request for Information)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_rfis (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  numero text NOT NULL,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  solicitante text NOT NULL,
  solicitante_email text,
  destino text NOT NULL,
  plano_asociado uuid REFERENCES public.erp_planos(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_respuesta', 'respondido', 'cerrado', 'rechazado')),
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  respuesta text,
  respondido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_respuesta date,
  prioridad text NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'critica')),
  archivo_respuesta_url text,
  observaciones text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(proyecto_id, numero)
);

ALTER TABLE public.erp_rfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_rfis_select" ON public.erp_rfis;
CREATE POLICY "erp_rfis_select" ON public.erp_rfis FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_rfis_insert" ON public.erp_rfis;
CREATE POLICY "erp_rfis_insert" ON public.erp_rfis FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_rfis_update" ON public.erp_rfis;
CREATE POLICY "erp_rfis_update" ON public.erp_rfis FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_rfis_proyecto ON public.erp_rfis(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_rfis_estado ON public.erp_rfis(estado);
CREATE INDEX IF NOT EXISTS idx_rfis_fecha ON public.erp_rfis(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_rfis_prioridad ON public.erp_rfis(prioridad);

DROP TRIGGER IF EXISTS trg_erp_rfis_updated ON public.erp_rfis;
CREATE TRIGGER trg_erp_rfis_updated
  BEFORE UPDATE ON public.erp_rfis
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 3: CREAR TABLA erp_submittals (Submittal Documents)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_submittals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  numero text NOT NULL,
  titulo text NOT NULL,
  descripcion text,
  categoria text NOT NULL CHECK (categoria IN ('material', 'equipo', 'especificacion', 'proceso', 'otro')),
  proveedor text NOT NULL,
  proveedor_contacto text,
  proveedor_email text,
  fecha_envio date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'con_comentarios', 'aprobado_con_cambios')),
  revisado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_revision date,
  comentarios text,
  especificaciones text,
  normas_aplicables text,
  archivo_url text,
  muestras_disponibles boolean DEFAULT false,
  prioridad text NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(proyecto_id, numero)
);

ALTER TABLE public.erp_submittals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_submittals_select" ON public.erp_submittals;
CREATE POLICY "erp_submittals_select" ON public.erp_submittals FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_submittals_insert" ON public.erp_submittals;
CREATE POLICY "erp_submittals_insert" ON public.erp_submittals FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
);

DROP POLICY IF EXISTS "erp_submittals_update" ON public.erp_submittals;
CREATE POLICY "erp_submittals_update" ON public.erp_submittals FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_submittals_proyecto ON public.erp_submittals(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_submittals_estado ON public.erp_submittals(estado);
CREATE INDEX IF NOT EXISTS idx_submittals_categoria ON public.erp_submittals(categoria);
CREATE INDEX IF NOT EXISTS idx_submittals_fecha ON public.erp_submittals(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_submittals_prioridad ON public.erp_submittals(prioridad);

DROP TRIGGER IF EXISTS trg_erp_submittals_updated ON public.erp_submittals;
CREATE TRIGGER trg_erp_submittals_updated
  BEFORE UPDATE ON public.erp_submittals
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 4: CREAR TABLA erp_actividades_herramientas (Activos)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_actividades_herramientas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  codigo_inventario text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('herramienta', 'equipo', 'vehiculo', 'accesorio', 'maquinaria')),
  marca text,
  modelo text,
  numero_serie text,
  valor_adquisicion numeric(12,2) NOT NULL,
  fecha_adquisicion date NOT NULL,
  estado text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'asignado', 'mantenimiento', 'baja', 'dado_baja')),
  ubicacion text,
  asignado_a uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_asignacion date,
  ultimoMantenimiento date,
  proxMantenimiento date,
  depreciacion_anual numeric(5,2),
  valor_residual numeric(12,2),
  responsable uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  observaciones text,
  foto_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(proyecto_id, codigo_inventario)
);

ALTER TABLE public.erp_actividades_herramientas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_actividades_herramientas_select" ON public.erp_actividades_herramientas;
CREATE POLICY "erp_actividades_herramientas_select" ON public.erp_actividades_herramientas FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente', 'Bodeguero'))
);

DROP POLICY IF EXISTS "erp_actividades_herramientas_insert" ON public.erp_actividades_herramientas;
CREATE POLICY "erp_actividades_herramientas_insert" ON public.erp_actividades_herramientas FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_actividades_herramientas_update" ON public.erp_actividades_herramientas;
CREATE POLICY "erp_actividades_herramientas_update" ON public.erp_actividades_herramientas FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Bodeguero'))
);

CREATE INDEX IF NOT EXISTS idx_actividades_proyecto ON public.erp_actividades_herramientas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_actividades_tipo ON public.erp_actividades_herramientas(tipo);
CREATE INDEX IF NOT EXISTS idx_actividades_estado ON public.erp_actividades_herramientas(estado);
CREATE INDEX IF NOT EXISTS idx_actividades_asignado ON public.erp_actividades_herramientas(asignado_a);
CREATE INDEX IF NOT EXISTS idx_actividades_codigo ON public.erp_actividades_herramientas(codigo_inventario);

DROP TRIGGER IF EXISTS trg_erp_actividades_herramientas_updated ON public.erp_actividades_herramientas;
CREATE TRIGGER trg_erp_actividades_herramientas_updated
  BEFORE UPDATE ON public.erp_actividades_herramientas
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 5: CREAR TABLA erp_licitaciones (Licitaciones Públicas)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_licitaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  cliente text NOT NULL,
  monto numeric(12,2) NOT NULL,
  moneda text DEFAULT 'GTQ',
  fecha_limite date NOT NULL,
  descripcion text,
  alcance text,
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'adjudicada', 'perdida', 'cerrada', 'cancelada')),
  probabilidad numeric(5,2) NOT NULL DEFAULT 0,
  clasificacion text,
  entidad_convocante text,
  numero_convocatoria text,
  documentos_url text,
  propuesta_url text,
  fecha_presentacion date,
  resultado text,
  observaciones text,
  responsable uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_licitaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_licitaciones_select" ON public.erp_licitaciones;
CREATE POLICY "erp_licitaciones_select" ON public.erp_licitaciones FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_licitaciones_insert" ON public.erp_licitaciones;
CREATE POLICY "erp_licitaciones_insert" ON public.erp_licitaciones FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_licitaciones_update" ON public.erp_licitaciones;
CREATE POLICY "erp_licitaciones_update" ON public.erp_licitaciones FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_licitaciones_proyecto ON public.erp_licitaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_licitaciones_estado ON public.erp_licitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_licitaciones_fecha ON public.erp_licitaciones(fecha_limite);
CREATE INDEX IF NOT EXISTS idx_licitaciones_cliente ON public.erp_licitaciones(cliente);

DROP TRIGGER IF EXISTS trg_erp_licitaciones_updated ON public.erp_licitaciones;
CREATE TRIGGER trg_erp_licitaciones_updated
  BEFORE UPDATE ON public.erp_licitaciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 6: CREAR TABLA erp_solicitudes_cambio_empresa (Meta)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_solicitudes_cambio_empresa (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('mejora', 'corrección', 'nueva_funcionalidad', 'optimización', 'seguridad')),
  estado text NOT NULL DEFAULT 'propuesta' CHECK (estado IN ('propuesta', 'analisis', 'aprobada', 'en_desarrollo', 'implementada', 'rechazada')),
  prioridad text NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  solicitante text NOT NULL,
  departamento text,
  beneficio_esperado text,
  impacto_riesgos text,
  esfuerzo_estimado text,
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_aprobacion date,
  aprobado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sprint_asignado text,
  fecha_implementacion date,
  version_incluida text,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_solicitudes_cambio_empresa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_solicitudes_cambio_empresa_select" ON public.erp_solicitudes_cambio_empresa;
CREATE POLICY "erp_solicitudes_cambio_empresa_select" ON public.erp_solicitudes_cambio_empresa FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_solicitudes_cambio_empresa_insert" ON public.erp_solicitudes_cambio_empresa;
CREATE POLICY "erp_solicitudes_cambio_empresa_insert" ON public.erp_solicitudes_cambio_empresa FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "erp_solicitudes_cambio_empresa_update" ON public.erp_solicitudes_cambio_empresa;
CREATE POLICY "erp_solicitudes_cambio_empresa_update" ON public.erp_solicitudes_cambio_empresa FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.erp_solicitudes_cambio_empresa(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON public.erp_solicitudes_cambio_empresa(tipo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_prioridad ON public.erp_solicitudes_cambio_empresa(prioridad);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON public.erp_solicitudes_cambio_empresa(fecha_solicitud);

DROP TRIGGER IF EXISTS trg_erp_solicitudes_cambio_empresa_updated ON public.erp_solicitudes_cambio_empresa;
CREATE TRIGGER trg_erp_solicitudes_cambio_empresa_updated
  BEFORE UPDATE ON public.erp_solicitudes_cambio_empresa
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 7: CREAR ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_planos_proyecto_disciplina ON public.erp_planos(proyecto_id, disciplina);
CREATE INDEX IF NOT EXISTS idx_rfis_proyecto_estado ON public.erp_rfis(proyecto_id, estado);
CREATE INDEX IF NOT EXISTS idx_submittals_proyecto_estado ON public.erp_submittals(proyecto_id, estado);
CREATE INDEX IF NOT EXISTS idx_actividades_proyecto_tipo ON public.erp_actividades_herramientas(proyecto_id, tipo);
CREATE INDEX IF NOT EXISTS idx_licitaciones_estado_fecha ON public.erp_licitaciones(estado, fecha_limite);

-- ============================================================
-- PASO 8: VERIFICACIÓN FINAL TIER 3
-- ============================================================

SELECT 'TIER 3 - DOCUMENTOS Y ACTIVOS' as fase,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'erp_%') as total_tablas_erp,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN (
         'erp_planos', 'erp_rfis', 'erp_submittals', 'erp_actividades_herramientas', 'erp_licitaciones', 'erp_solicitudes_cambio_empresa'
       )) as tablas_tier3_nuevas,
       'COMPLETITUD FINAL: 95%' as completitud;

-- ============================================================
-- FIN MIGRACIÓN TIER 3
-- ============================================================
