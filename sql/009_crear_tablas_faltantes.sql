-- ============================================================
-- SCRIPT SQL: CREAR TABLAS FALTANTES EN SUPABASE
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- Tiempo estimado: 5 minutos
-- Última actualización: 2026-06-07

-- ============================================================
-- 1. HITOS (erp_hitos)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_hitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('inicio', 'hito', 'entrega', 'cierre')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'retrasado')),
  responsable TEXT,
  depends_on TEXT, -- JSON array de IDs de hitos predecesores
  completado_en TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_hitos_proyecto_id ON erp_hitos(proyecto_id);
CREATE INDEX idx_hitos_fecha ON erp_hitos(fecha DESC);

-- ============================================================
-- 2. RIESGOS (erp_riesgos)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_riesgos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('tecnico', 'financiero', 'cronograma', 'legal', 'ambiental', 'seguridad', 'otro')),
  probabilidad INT NOT NULL CHECK (probabilidad BETWEEN 1 AND 5),
  impacto INT NOT NULL CHECK (impacto BETWEEN 1 AND 5),
  nivel TEXT NOT NULL CHECK (nivel IN ('bajo', 'medio', 'alto', 'critico')),
  plan_mitigacion TEXT,
  plan_contingencia TEXT,
  responsable TEXT,
  fecha_identificacion DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'identificado' CHECK (estado IN ('identificado', 'en_mitigacion', 'mitigado', 'materializado')),
  costo_soporte NUMERIC,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_riesgos_proyecto_id ON erp_riesgos(proyecto_id);
CREATE INDEX idx_riesgos_nivel ON erp_riesgos(nivel);

-- ============================================================
-- 3. CUENTAS POR COBRAR (erp_cuentas_cobrar)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_cuentas_cobrar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  cliente TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  saldo_pendiente NUMERIC NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_cobro DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'cobrado', 'vencido', 'incobrable')),
  notas TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_cuentas_cobrar_proyecto_id ON erp_cuentas_cobrar(proyecto_id);
CREATE INDEX idx_cuentas_cobrar_estado ON erp_cuentas_cobrar(estado);
CREATE INDEX idx_cuentas_cobrar_fecha_vencimiento ON erp_cuentas_cobrar(fecha_vencimiento);

-- ============================================================
-- 4. CUENTAS POR PAGAR (erp_cuentas_pagar)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_cuentas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  proveedor TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  saldo_pendiente NUMERIC NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado', 'vencido')),
  factura_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_cuentas_pagar_proyecto_id ON erp_cuentas_pagar(proyecto_id);
CREATE INDEX idx_cuentas_pagar_estado ON erp_cuentas_pagar(estado);
CREATE INDEX idx_cuentas_pagar_fecha_vencimiento ON erp_cuentas_pagar(fecha_vencimiento);

-- ============================================================
-- 5. ÓRDENES DE CAMBIO (erp_ordenes_cambio)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_ordenes_cambio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  impacto_costo NUMERIC NOT NULL,
  impacto_plazo NUMERIC NOT NULL,
  estado TEXT NOT NULL DEFAULT 'solicitud' CHECK (estado IN ('solicitud', 'revision', 'aprobado', 'rechazado')),
  solicitante TEXT NOT NULL,
  solicitante_rol TEXT NOT NULL,
  aprobador UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_aprobacion TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ordenes_cambio_proyecto_id ON erp_ordenes_cambio(proyecto_id);
CREATE INDEX idx_ordenes_cambio_estado ON erp_ordenes_cambio(estado);

-- ============================================================
-- 6. MURO DE OBRA (erp_muro)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_muro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  autor_avatar TEXT,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('avance', 'calidad', 'seguridad', 'general')),
  fotos TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array de URLs
  documento JSONB, -- { nombre, url }
  likes INT DEFAULT 0,
  comentarios JSONB DEFAULT '[]'::jsonb, -- Array de { id, autor, contenido, createdAt }
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_muro_proyecto_id ON erp_muro(proyecto_id);
CREATE INDEX idx_muro_created_at ON erp_muro(created_at DESC);

-- ============================================================
-- 7. INCIDENTES (erp_incidentes) — SSO/Calidad
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_incidentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('accidente', 'cuasi_accidente', 'incidente', 'condicion_insegura')),
  fecha DATE NOT NULL,
  hora TIME,
  descripcion TEXT NOT NULL,
  afectados TEXT NOT NULL,
  testigos TEXT,
  acciones_inmediatas TEXT,
  reportado_por TEXT NOT NULL,
  latitud FLOAT8,
  longitud FLOAT8,
  fotos TEXT[] DEFAULT ARRAY[]::TEXT[],
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'investigacion', 'cerrado')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidentes_proyecto_id ON erp_incidentes(proyecto_id);
CREATE INDEX idx_incidentes_tipo ON erp_incidentes(tipo);

-- ============================================================
-- 8. PRUEBAS DE LABORATORIO (erp_pruebas_laboratorio)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_pruebas_laboratorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('concreto', 'suelos', 'acero', 'asfalto', 'otro')),
  descripcion TEXT NOT NULL,
  fecha_muestra DATE NOT NULL,
  fecha_resultado DATE,
  resultado TEXT NOT NULL DEFAULT 'pendiente' CHECK (resultado IN ('pendiente', 'pasa', 'no_pasa')),
  responsable TEXT NOT NULL,
  observaciones TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_pruebas_proyecto_id ON erp_pruebas_laboratorio(proyecto_id);

-- ============================================================
-- 9. NO CONFORMIDADES (erp_no_conformidades)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_no_conformidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('material', 'proceso', 'documentacion', 'seguridad', 'otro')),
  fecha_deteccion DATE NOT NULL,
  detectado_por TEXT NOT NULL,
  plan_accion TEXT,
  responsable_cierre TEXT,
  fecha_cierre DATE,
  estado TEXT NOT NULL DEFAULT 'detectado' CHECK (estado IN ('detectado', 'plan_accion', 'cerrado')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_no_conformidades_proyecto_id ON erp_no_conformidades(proyecto_id);
CREATE INDEX idx_no_conformidades_estado ON erp_no_conformidades(estado);

-- ============================================================
-- 10. LIBERACIÓN DE PARTIDAS (erp_liberaciones_partida)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_liberaciones_partida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  renglon_id UUID,
  renglon_nombre TEXT NOT NULL,
  fecha_solicitud DATE NOT NULL,
  fecha_liberacion DATE,
  solicitante TEXT NOT NULL,
  supervisor TEXT NOT NULL,
  checklist_aprobado BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'liberado', 'rechazado')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_liberaciones_proyecto_id ON erp_liberaciones_partida(proyecto_id);

-- ============================================================
-- AGREGAR COLUMNAS FALTANTES A TABLAS EXISTENTES
-- ============================================================

-- 1. erp_ordenes_compra: agregar items JSONB
ALTER TABLE erp_ordenes_compra 
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- 2. erp_empleados: agregar avatar_url (opcional)
ALTER TABLE erp_empleados 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. erp_proyectos: agregar factor_sobrecosto
ALTER TABLE erp_proyectos 
ADD COLUMN IF NOT EXISTS factor_sobrecosto JSONB DEFAULT '{"indirectos":0,"administracion":0,"imprevistos":0,"utilidad":0}'::jsonb;

-- ============================================================
-- CREAR ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto_id ON erp_presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_proyecto_id ON erp_movimientos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON erp_movimientos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_empleados_proyecto_id ON erp_empleados(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_proyecto_id ON erp_ordenes_compra(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON erp_ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_avances_proyecto_id ON erp_avances(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_proyecto_id ON erp_bitacora(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_vales_proyecto_id ON erp_vales_salida(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_vales_fecha ON erp_vales_salida(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_proyecto_id ON erp_eventos_calendario(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_licitaciones_estado ON erp_licitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON erp_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON erp_presupuestos(estado);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar después para verificar:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Debería mostrar todas las nuevas tablas.

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
