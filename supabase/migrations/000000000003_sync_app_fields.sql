-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 3: SINCRONIZAR CAMPOS DE LA APP
-- Versión: 2026-06-06
--
-- Agrega las columnas que ya existen en la interfaz (types.ts,
-- formularios) pero faltan en la base de datos de Supabase.
-- ============================================================

-- ============================================================
-- erp_proyectos: +22 columnas
-- ============================================================
ALTER TABLE erp_proyectos
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS tipo_obra text CHECK (tipo_obra = ANY (ARRAY['nueva','remodelacion','ampliacion'])),
  ADD COLUMN IF NOT EXISTS cliente_nit text,
  ADD COLUMN IF NOT EXISTS cliente_telefono text,
  ADD COLUMN IF NOT EXISTS cliente_email text,
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS departamento text,
  ADD COLUMN IF NOT EXISTS pais text DEFAULT 'Guatemala',
  ADD COLUMN IF NOT EXISTS codigo_postal text,
  ADD COLUMN IF NOT EXISTS area_construccion numeric(10,2),
  ADD COLUMN IF NOT EXISTS num_pisos integer,
  ADD COLUMN IF NOT EXISTS plazo_semanas integer,
  ADD COLUMN IF NOT EXISTS ingeniero_residente text,
  ADD COLUMN IF NOT EXISTS supervisor text,
  ADD COLUMN IF NOT EXISTS arquitecto text,
  ADD COLUMN IF NOT EXISTS numero_expediente text,
  ADD COLUMN IF NOT EXISTS numero_licencia text,
  ADD COLUMN IF NOT EXISTS margen_utilidad_objetivo numeric(5,2),
  ADD COLUMN IF NOT EXISTS moneda text DEFAULT 'GTQ' CHECK (moneda = ANY (ARRAY['GTQ','USD'])),
  ADD COLUMN IF NOT EXISTS etapa text CHECK (etapa = ANY (ARRAY['planificacion','diseno','preconstruccion','construccion','cierre'])),
  ADD COLUMN IF NOT EXISTS fecha_inicio_real date,
  ADD COLUMN IF NOT EXISTS fecha_fin_estimada date;

-- ============================================================
-- erp_movimientos: +7 columnas
-- ============================================================
ALTER TABLE erp_movimientos
  ADD COLUMN IF NOT EXISTS proveedor_nit text,
  ADD COLUMN IF NOT EXISTS forma_pago text CHECK (forma_pago = ANY (ARRAY['efectivo','transferencia','cheque','tarjeta','otro'])),
  ADD COLUMN IF NOT EXISTS referencia_bancaria text,
  ADD COLUMN IF NOT EXISTS retencion_isr numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retencion_iva numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notas text,
  ADD COLUMN IF NOT EXISTS factura text;

-- ============================================================
-- ÍNDICES PARA NUEVAS COLUMNAS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON erp_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_etapa ON erp_proyectos(etapa);
CREATE INDEX IF NOT EXISTS idx_proyectos_ciudad ON erp_proyectos(ciudad);
CREATE INDEX IF NOT EXISTS idx_movimientos_forma_pago ON erp_movimientos(forma_pago);

-- ============================================================
-- ACTUALIZAR POLÍTICAS RLS EXISTENTES (opcional, por seguridad)
-- No se requieren cambios porque las políticas existentes
-- ya usan SELECT/INSERT/UPDATE genéricos.
-- ============================================================

-- Nota: Ejecutar después: CREATE POLICY si se requiere control
-- específico sobre alguna columna nueva (ej: solo Admin puede
-- modificar etapa).
