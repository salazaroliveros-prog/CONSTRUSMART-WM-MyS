-- ============================================================
-- MIGRACIÓN 0101: TIER 2 - OPERACIONAL
-- Fecha: 2026-12-27
-- Tablas: 8 nuevas (Destajos, Órdenes Cambio, Notificaciones, Centros Costo, etc)
-- ============================================================

-- ============================================================
-- PASO 1: CREAR TABLA erp_destajos (Rendimiento Campo)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_destajos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  renglon_codigo text NOT NULL,
  cuadrilla text NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  cantidad_ejecutada numeric(10,2) NOT NULL,
  unidad text NOT NULL,
  horas_trabajadas numeric(10,2) NOT NULL,
  rendimiento_teorico numeric(10,2) NOT NULL,
  rendimiento_real numeric(10,2) GENERATED ALWAYS AS (
    CASE WHEN horas_trabajadas > 0 
         THEN cantidad_ejecutada / horas_trabajadas 
         ELSE 0 
    END
  ) STORED,
  eficiencia numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN rendimiento_teorico > 0 
         THEN (rendimiento_real / rendimiento_teorico) * 100 
         ELSE 0 
    END
  ) STORED,
  observaciones text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_destajos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_destajos_select" ON public.erp_destajos;
CREATE POLICY "erp_destajos_select" ON public.erp_destajos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_destajos_insert" ON public.erp_destajos;
CREATE POLICY "erp_destajos_insert" ON public.erp_destajos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_destajos_update" ON public.erp_destajos;
CREATE POLICY "erp_destajos_update" ON public.erp_destajos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_destajos_proyecto ON public.erp_destajos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_destajos_fecha ON public.erp_destajos(fecha);
CREATE INDEX IF NOT EXISTS idx_destajos_renglon ON public.erp_destajos(renglon_codigo);
CREATE INDEX IF NOT EXISTS idx_destajos_cuadrilla ON public.erp_destajos(cuadrilla);

DROP TRIGGER IF EXISTS trg_erp_destajos_updated ON public.erp_destajos;
CREATE TRIGGER trg_erp_destajos_updated
  BEFORE UPDATE ON public.erp_destajos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 2: CREAR TABLA erp_ordenes_cambio (Control de Cambios)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_ordenes_cambio (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  impacto_costo numeric(12,2) NOT NULL DEFAULT 0,
  impacto_plazo integer NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'solicitud' CHECK (estado IN ('solicitud', 'revision', 'aprobado', 'rechazado')),
  solicitante text NOT NULL,
  solicitante_rol text,
  aprobador uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_aprobacion timestamptz,
  observaciones text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_ordenes_cambio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_ordenes_cambio_select" ON public.erp_ordenes_cambio;
CREATE POLICY "erp_ordenes_cambio_select" ON public.erp_ordenes_cambio FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_ordenes_cambio_insert" ON public.erp_ordenes_cambio;
CREATE POLICY "erp_ordenes_cambio_insert" ON public.erp_ordenes_cambio FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_ordenes_cambio_update" ON public.erp_ordenes_cambio;
CREATE POLICY "erp_ordenes_cambio_update" ON public.erp_ordenes_cambio FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_ordenes_cambio_proyecto ON public.erp_ordenes_cambio(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_cambio_estado ON public.erp_ordenes_cambio(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_cambio_fecha ON public.erp_ordenes_cambio(created_at);

DROP TRIGGER IF EXISTS trg_erp_ordenes_cambio_updated ON public.erp_ordenes_cambio;
CREATE TRIGGER trg_erp_ordenes_cambio_updated
  BEFORE UPDATE ON public.erp_ordenes_cambio
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 3: CREAR TABLA erp_notificaciones (Sistema de Alertas)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_notificaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('checklist_rechazado', 'orden_cambio_pendiente', 'stock_critico', 'desviacion_rendimiento', 'avance_registrado', 'alerta', 'exito', 'general')),
  titulo text NOT NULL,
  mensaje text NOT NULL,
  proyecto_id uuid REFERENCES public.erp_proyectos(id) ON DELETE SET NULL,
  referencia_id uuid,
  referencia_tipo text,
  leido boolean NOT NULL DEFAULT false,
  fecha_lectura timestamptz,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prioridad text NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'critica')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_notificaciones_select" ON public.erp_notificaciones;
CREATE POLICY "erp_notificaciones_select" ON public.erp_notificaciones FOR SELECT TO authenticated USING (
  usuario_id = auth.uid()
);

DROP POLICY IF EXISTS "erp_notificaciones_insert" ON public.erp_notificaciones;
CREATE POLICY "erp_notificaciones_insert" ON public.erp_notificaciones FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "erp_notificaciones_update" ON public.erp_notificaciones;
CREATE POLICY "erp_notificaciones_update" ON public.erp_notificaciones FOR UPDATE TO authenticated USING (
  usuario_id = auth.uid()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON public.erp_notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_proyecto ON public.erp_notificaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido ON public.erp_notificaciones(leido);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON public.erp_notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_prioridad ON public.erp_notificaciones(prioridad);

DROP TRIGGER IF EXISTS trg_erp_notificaciones_updated ON public.erp_notificaciones;
CREATE TRIGGER trg_erp_notificaciones_updated
  BEFORE UPDATE ON public.erp_notificaciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 4: CREAR TABLA erp_centros_costo (Contabilidad)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_centros_costo (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  tipo text NOT NULL DEFAULT 'directo' CHECK (tipo IN ('directo', 'indirecto', 'administrativo')),
  presupuesto_asignado numeric(12,2) NOT NULL DEFAULT 0,
  gasto_actual numeric(12,2) NOT NULL DEFAULT 0,
  saldo_disponible numeric(12,2) GENERATED ALWAYS AS (presupuesto_asignado - gasto_actual) STORED,
  porcentaje_ejecucion numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN presupuesto_asignado > 0 
         THEN (gasto_actual / presupuesto_asignado) * 100 
         ELSE 0 
    END
  ) STORED,
  responsable uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(proyecto_id, codigo)
);

ALTER TABLE public.erp_centros_costo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_centros_costo_select" ON public.erp_centros_costo;
CREATE POLICY "erp_centros_costo_select" ON public.erp_centros_costo FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_centros_costo_insert" ON public.erp_centros_costo;
CREATE POLICY "erp_centros_costo_insert" ON public.erp_centros_costo FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

DROP POLICY IF EXISTS "erp_centros_costo_update" ON public.erp_centros_costo;
CREATE POLICY "erp_centros_costo_update" ON public.erp_centros_costo FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

CREATE INDEX IF NOT EXISTS idx_centros_costo_proyecto ON public.erp_centros_costo(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_centros_costo_tipo ON public.erp_centros_costo(tipo);
CREATE INDEX IF NOT EXISTS idx_centros_costo_activo ON public.erp_centros_costo(activo);

DROP TRIGGER IF EXISTS trg_erp_centros_costo_updated ON public.erp_centros_costo;
CREATE TRIGGER trg_erp_centros_costo_updated
  BEFORE UPDATE ON public.erp_centros_costo
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 5: CREAR TABLA erp_recepciones_almacen (Bodega)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_recepciones_almacen (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  orden_compra_id uuid REFERENCES public.erp_ordenes_compra(id) ON DELETE SET NULL,
  proyecto_id uuid REFERENCES public.erp_proyectos(id) ON DELETE SET NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  material_nombre text NOT NULL,
  proveedor_nombre text,
  cantidad_oc numeric(10,2) NOT NULL,
  cantidad_recibida numeric(10,2) NOT NULL,
  diferencia numeric(10,2) GENERATED ALWAYS AS (cantidad_recibida - cantidad_oc) STORED,
  unidad text,
  estado text NOT NULL DEFAULT 'recibido' CHECK (estado IN ('recibido', 'parcial', 'rechazado', 'devuelto')),
  observaciones text,
  almacenero uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_recepciones_almacen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_recepciones_almacen_select" ON public.erp_recepciones_almacen;
CREATE POLICY "erp_recepciones_almacen_select" ON public.erp_recepciones_almacen FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Bodeguero', 'Compras'))
);

DROP POLICY IF EXISTS "erp_recepciones_almacen_insert" ON public.erp_recepciones_almacen;
CREATE POLICY "erp_recepciones_almacen_insert" ON public.erp_recepciones_almacen FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Bodeguero'))
);

DROP POLICY IF EXISTS "erp_recepciones_almacen_update" ON public.erp_recepciones_almacen;
CREATE POLICY "erp_recepciones_almacen_update" ON public.erp_recepciones_almacen FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Bodeguero'))
);

CREATE INDEX IF NOT EXISTS idx_recepciones_almacen_oc ON public.erp_recepciones_almacen(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_recepciones_almacen_proyecto ON public.erp_recepciones_almacen(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_recepciones_almacen_fecha ON public.erp_recepciones_almacen(fecha);
CREATE INDEX IF NOT EXISTS idx_recepciones_almacen_estado ON public.erp_recepciones_almacen(estado);

DROP TRIGGER IF EXISTS trg_erp_recepciones_almacen_updated ON public.erp_recepciones_almacen;
CREATE TRIGGER trg_erp_recepciones_almacen_updated
  BEFORE UPDATE ON public.erp_recepciones_almacen
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 6: CREAR TABLA erp_liberaciones_partida (Calidad)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_liberaciones_partida (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  renglon_id uuid REFERENCES public.erp_renglones(id) ON DELETE SET NULL,
  renglon_nombre text NOT NULL,
  renglon_codigo text,
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_liberacion date,
  solicitante text NOT NULL,
  supervisor text NOT NULL,
  checklist_aprobado boolean NOT NULL DEFAULT false,
  observaciones text,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'liberado', 'rechazado')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_liberaciones_partida ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_liberaciones_partida_select" ON public.erp_liberaciones_partida;
CREATE POLICY "erp_liberaciones_partida_select" ON public.erp_liberaciones_partida FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_liberaciones_partida_insert" ON public.erp_liberaciones_partida;
CREATE POLICY "erp_liberaciones_partida_insert" ON public.erp_liberaciones_partida FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_liberaciones_partida_update" ON public.erp_liberaciones_partida;
CREATE POLICY "erp_liberaciones_partida_update" ON public.erp_liberaciones_partida FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_liberaciones_partida_proyecto ON public.erp_liberaciones_partida(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_liberaciones_partida_renglon ON public.erp_liberaciones_partida(renglon_id);
CREATE INDEX IF NOT EXISTS idx_liberaciones_partida_estado ON public.erp_liberaciones_partida(estado);
CREATE INDEX IF NOT EXISTS idx_liberaciones_partida_fecha ON public.erp_liberaciones_partida(fecha_solicitud);

DROP TRIGGER IF EXISTS trg_erp_liberaciones_partida_updated ON public.erp_liberaciones_partida;
CREATE TRIGGER trg_erp_liberaciones_partida_updated
  BEFORE UPDATE ON public.erp_liberaciones_partida
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 7: CREAR TABLA erp_pruebas_laboratorio (Calidad)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_pruebas_laboratorio (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('concreto', 'suelos', 'acero', 'asfalto', 'otro')),
  descripcion text NOT NULL,
  fecha_muestra date NOT NULL,
  fecha_resultado date,
  resultado text NOT NULL DEFAULT 'pendiente' CHECK (resultado IN ('pendiente', 'pasa', 'no_pasa', 'revision')),
  responsable text NOT NULL,
  laboratorio text,
  numero_referencia text,
  observaciones text,
  documento_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.erp_pruebas_laboratorio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_pruebas_laboratorio_select" ON public.erp_pruebas_laboratorio;
CREATE POLICY "erp_pruebas_laboratorio_select" ON public.erp_pruebas_laboratorio FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_pruebas_laboratorio_insert" ON public.erp_pruebas_laboratorio;
CREATE POLICY "erp_pruebas_laboratorio_insert" ON public.erp_pruebas_laboratorio FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_pruebas_laboratorio_update" ON public.erp_pruebas_laboratorio;
CREATE POLICY "erp_pruebas_laboratorio_update" ON public.erp_pruebas_laboratorio FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_pruebas_laboratorio_proyecto ON public.erp_pruebas_laboratorio(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_pruebas_laboratorio_tipo ON public.erp_pruebas_laboratorio(tipo);
CREATE INDEX IF NOT EXISTS idx_pruebas_laboratorio_resultado ON public.erp_pruebas_laboratorio(resultado);
CREATE INDEX IF NOT EXISTS idx_pruebas_laboratorio_fecha ON public.erp_pruebas_laboratorio(fecha_muestra);

DROP TRIGGER IF EXISTS trg_erp_pruebas_laboratorio_updated ON public.erp_pruebas_laboratorio;
CREATE TRIGGER trg_erp_pruebas_laboratorio_updated
  BEFORE UPDATE ON public.erp_pruebas_laboratorio
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 8: CREAR TABLA erp_no_conformidades (Calidad)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_no_conformidades (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  descripcion text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('material', 'proceso', 'documentacion', 'seguridad', 'otro')),
  fecha_deteccion date NOT NULL DEFAULT CURRENT_DATE,
  detectado_por text NOT NULL,
  nivel_severidad text NOT NULL DEFAULT 'media' CHECK (nivel_severidad IN ('baja', 'media', 'alta', 'critica')),
  plan_accion text,
  responsable_cierre uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_cierre date,
  estado text NOT NULL DEFAULT 'detectado' CHECK (estado IN ('detectado', 'plan_accion', 'corregido', 'cerrado', 'rechazado')),
  evidencia_cierre text,
  observaciones text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(proyecto_id, codigo)
);

ALTER TABLE public.erp_no_conformidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_no_conformidades_select" ON public.erp_no_conformidades;
CREATE POLICY "erp_no_conformidades_select" ON public.erp_no_conformidades FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_no_conformidades_insert" ON public.erp_no_conformidades;
CREATE POLICY "erp_no_conformidades_insert" ON public.erp_no_conformidades FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

DROP POLICY IF EXISTS "erp_no_conformidades_update" ON public.erp_no_conformidades;
CREATE POLICY "erp_no_conformidades_update" ON public.erp_no_conformidades FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
);

CREATE INDEX IF NOT EXISTS idx_no_conformidades_proyecto ON public.erp_no_conformidades(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_no_conformidades_categoria ON public.erp_no_conformidades(categoria);
CREATE INDEX IF NOT EXISTS idx_no_conformidades_estado ON public.erp_no_conformidades(estado);
CREATE INDEX IF NOT EXISTS idx_no_conformidades_severidad ON public.erp_no_conformidades(nivel_severidad);
CREATE INDEX IF NOT EXISTS idx_no_conformidades_fecha ON public.erp_no_conformidades(fecha_deteccion);

DROP TRIGGER IF EXISTS trg_erp_no_conformidades_updated ON public.erp_no_conformidades;
CREATE TRIGGER trg_erp_no_conformidades_updated
  BEFORE UPDATE ON public.erp_no_conformidades
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 9: AGREGAR COLUMNAS FALTANTES A erp_bitacora
-- ============================================================

ALTER TABLE public.erp_bitacora ADD COLUMN IF NOT EXISTS fotos text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.erp_bitacora ADD COLUMN IF NOT EXISTS firma text;
ALTER TABLE public.erp_bitacora ADD COLUMN IF NOT EXISTS latitud numeric(10,6);
ALTER TABLE public.erp_bitacora ADD COLUMN IF NOT EXISTS longitud numeric(10,6);
ALTER TABLE public.erp_bitacora ADD COLUMN IF NOT EXISTS clima_capturado boolean DEFAULT false;
ALTER TABLE public.erp_bitacora ADD COLUMN IF NOT EXISTS temperatura numeric(5,1);
ALTER TABLE public.erp_bitacora ADD COLUMN IF NOT EXISTS humedad numeric(5,1);
ALTER TABLE public.erp_bitacora ADD COLUMN IF NOT EXISTS viento_velocidad numeric(5,1);

-- ============================================================
-- PASO 10: AGREGAR COLUMNAS A erp_avances
-- ============================================================

ALTER TABLE public.erp_avances ADD COLUMN IF NOT EXISTS renglon_codigo text;
ALTER TABLE public.erp_avances ADD COLUMN IF NOT EXISTS renglon_nombre text;
ALTER TABLE public.erp_avances ADD COLUMN IF NOT EXISTS latitud numeric(10,6);
ALTER TABLE public.erp_avances ADD COLUMN IF NOT EXISTS longitud numeric(10,6);

-- ============================================================
-- PASO 11: CREAR ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_erp_movimientos_proyecto_fecha ON public.erp_movimientos(proyecto_id, fecha);
CREATE INDEX IF NOT EXISTS idx_erp_empleados_proyecto_activo ON public.erp_empleados(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto_estado ON public.erp_presupuestos(proyecto_id, estado);
CREATE INDEX IF NOT EXISTS idx_erp_bitacora_proyecto_fecha ON public.erp_bitacora(proyecto_id, fecha);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_proyecto_fecha ON public.erp_seguimiento(proyecto_id, fecha);

-- ============================================================
-- PASO 12: VERIFICACIÓN FINAL
-- ============================================================

SELECT 'TIER 2 - OPERACIONAL' as fase,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'erp_%') as total_tablas,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN (
         'erp_destajos', 'erp_ordenes_cambio', 'erp_notificaciones', 'erp_centros_costo',
         'erp_recepciones_almacen', 'erp_liberaciones_partida', 'erp_pruebas_laboratorio', 'erp_no_conformidades'
       )) as tablas_tier2_nuevas,
       'COMPLETITUD ESPERADA: 85%' as estado;

-- ============================================================
-- FIN MIGRACIÓN TIER 2
-- ============================================================
