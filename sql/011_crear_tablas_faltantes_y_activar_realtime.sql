-- ============================================================
-- CREAR TABLAS FALTANTES + ACTIVAR REALTIME
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- Tiempo estimado: 2 minutos

-- ============================================================
-- 1. CREAR TABLAS QUE NO EXISTEN
-- ============================================================

-- CUENTAS POR COBRAR
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
  estado TEXT NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CUENTAS POR PAGAR
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
  estado TEXT NOT NULL DEFAULT 'pendiente',
  factura_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- HITOS
CREATE TABLE IF NOT EXISTS erp_hitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  responsable TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- INCIDENTES
CREATE TABLE IF NOT EXISTS erp_incidentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME,
  descripcion TEXT NOT NULL,
  afectados TEXT NOT NULL,
  testigos TEXT,
  reportado_por TEXT NOT NULL,
  latitud FLOAT8,
  longitud FLOAT8,
  estado TEXT NOT NULL DEFAULT 'abierto',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- LIBERACIONES PARTIDA
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
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- MURO DE OBRA
CREATE TABLE IF NOT EXISTS erp_muro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  autor_avatar TEXT,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL,
  likes INT DEFAULT 0,
  comentarios JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- NO CONFORMIDADES
CREATE TABLE IF NOT EXISTS erp_no_conformidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  categoria TEXT NOT NULL,
  fecha_deteccion DATE NOT NULL,
  detectado_por TEXT NOT NULL,
  plan_accion TEXT,
  responsable_cierre TEXT,
  fecha_cierre DATE,
  estado TEXT NOT NULL DEFAULT 'detectado',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ÓRDENES DE CAMBIO
CREATE TABLE IF NOT EXISTS erp_ordenes_cambio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  impacto_costo NUMERIC NOT NULL,
  impacto_plazo NUMERIC NOT NULL,
  estado TEXT NOT NULL DEFAULT 'solicitud',
  solicitante TEXT NOT NULL,
  solicitante_rol TEXT NOT NULL,
  aprobador UUID REFERENCES auth.users(id),
  fecha_aprobacion TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PRUEBAS DE LABORATORIO
CREATE TABLE IF NOT EXISTS erp_pruebas_laboratorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_muestra DATE NOT NULL,
  fecha_resultado DATE,
  resultado TEXT NOT NULL DEFAULT 'pendiente',
  responsable TEXT NOT NULL,
  observaciones TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RIESGOS
CREATE TABLE IF NOT EXISTS erp_riesgos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL,
  probabilidad INT,
  impacto INT,
  nivel TEXT,
  plan_mitigacion TEXT,
  plan_contingencia TEXT,
  responsable TEXT,
  fecha_identificacion DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'identificado',
  costo_soporte NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 2. AHORA ACTIVAR REALTIME EN TODAS (32 TABLAS)
-- ============================================================

-- TABLAS CRÍTICAS
ALTER TABLE erp_proyectos REPLICA IDENTITY FULL;
ALTER TABLE erp_movimientos REPLICA IDENTITY FULL;
ALTER TABLE erp_empleados REPLICA IDENTITY FULL;
ALTER TABLE erp_materiales REPLICA IDENTITY FULL;
ALTER TABLE erp_ordenes_compra REPLICA IDENTITY FULL;
ALTER TABLE erp_proveedores REPLICA IDENTITY FULL;
ALTER TABLE erp_eventos_calendario REPLICA IDENTITY FULL;
ALTER TABLE erp_bitacora REPLICA IDENTITY FULL;
ALTER TABLE erp_presupuestos REPLICA IDENTITY FULL;
ALTER TABLE erp_avances REPLICA IDENTITY FULL;
ALTER TABLE erp_licitaciones REPLICA IDENTITY FULL;
ALTER TABLE erp_renglones REPLICA IDENTITY FULL;
ALTER TABLE erp_insumos REPLICA IDENTITY FULL;
ALTER TABLE erp_sub_renglones REPLICA IDENTITY FULL;
ALTER TABLE erp_seguimiento REPLICA IDENTITY FULL;
ALTER TABLE erp_vales_salida REPLICA IDENTITY FULL;
ALTER TABLE erp_insumos_base REPLICA IDENTITY FULL;
ALTER TABLE erp_rendimientos_cuadrilla REPLICA IDENTITY FULL;

-- TABLAS NUEVAS (AHORA CON DATOS)
ALTER TABLE erp_cuentas_cobrar REPLICA IDENTITY FULL;
ALTER TABLE erp_cuentas_pagar REPLICA IDENTITY FULL;
ALTER TABLE erp_hitos REPLICA IDENTITY FULL;
ALTER TABLE erp_incidentes REPLICA IDENTITY FULL;
ALTER TABLE erp_liberaciones_partida REPLICA IDENTITY FULL;
ALTER TABLE erp_muro REPLICA IDENTITY FULL;
ALTER TABLE erp_no_conformidades REPLICA IDENTITY FULL;
ALTER TABLE erp_ordenes_cambio REPLICA IDENTITY FULL;
ALTER TABLE erp_pruebas_laboratorio REPLICA IDENTITY FULL;
ALTER TABLE erp_riesgos REPLICA IDENTITY FULL;

-- OTRAS TABLAS
ALTER TABLE activos_herramientas REPLICA IDENTITY FULL;
ALTER TABLE cuadro_comparativo_proveedores REPLICA IDENTITY FULL;
ALTER TABLE cotizaciones REPLICA IDENTITY FULL;
ALTER TABLE anticipos REPLICA IDENTITY FULL;
ALTER TABLE amortizaciones REPLICA IDENTITY FULL;
ALTER TABLE pagos_proveedores REPLICA IDENTITY FULL;
ALTER TABLE ventas_paquetes REPLICA IDENTITY FULL;
ALTER TABLE centros_costo REPLICA IDENTITY FULL;
ALTER TABLE cajas_chicas REPLICA IDENTITY FULL;
ALTER TABLE destajos REPLICA IDENTITY FULL;
ALTER TABLE logs_sistema REPLICA IDENTITY FULL;
ALTER TABLE erp_auditoria REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- ============================================================
-- 3. VERIFICACIÓN
-- ============================================================

SELECT 
  t.tablename,
  CASE 
    WHEN o.relreplident = 'f' THEN '✅ FULL'
    WHEN o.relreplident = 'd' THEN 'DEFAULT'
    ELSE o.relreplident::text
  END as replica_identity
FROM pg_tables t
JOIN pg_class o ON o.relname = t.tablename
WHERE t.schemaname = 'public' AND (
  t.tablename LIKE 'erp_%' OR 
  t.tablename IN ('activos_herramientas', 'cuadro_comparativo_proveedores', 'cotizaciones', 'anticipos', 'amortizaciones', 'pagos_proveedores', 'ventas_paquetes', 'centros_costo', 'cajas_chicas', 'destajos', 'logs_sistema', 'profiles')
)
ORDER BY t.tablename;

-- Resultado esperado: TODAS muestren ✅ FULL
