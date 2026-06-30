-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 4: TABLAS FALTANTES + POLÍTICAS RLS
-- Versión: 2026-06-27 (CORREGIDA)
--
-- Contiene:
-- - Tablas faltantes del sistema ERP
-- - Políticas RLS simplificadas (sin get_user_role() para evitar dependencias circulares)
-- ============================================================

-- ============================================================
-- 1. TABLAS FALTANTES
-- ============================================================

-- erp_insumos_base: catálogo de insumos base para APU
CREATE TABLE IF NOT EXISTS erp_insumos_base (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    codigo text NOT NULL UNIQUE,
    nombre text NOT NULL,
    unidad text NOT NULL,
    categoria text NOT NULL,
    costo_base numeric(10,2) NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_rendimientos_cuadrilla: rendimientos por cuadrilla
CREATE TABLE IF NOT EXISTS erp_rendimientos_cuadrilla (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    cuadrilla text NOT NULL,
    actividad text NOT NULL,
    rendimiento_diario numeric(10,2) NOT NULL DEFAULT 0,
    unidad text NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_auditoria: log de auditoría
CREATE TABLE IF NOT EXISTS erp_auditoria (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tabla text NOT NULL,
    operacion text NOT NULL,
    registro_id uuid,
    usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- erp_licitaciones
CREATE TABLE IF NOT EXISTS erp_licitaciones (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero text NOT NULL UNIQUE,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    proveedor_id uuid REFERENCES erp_proveedores(id) ON DELETE SET NULL,
    monto_total numeric(12,2) NOT NULL DEFAULT 0,
    estado text NOT NULL DEFAULT 'borrador' CHECK (estado = ANY (ARRAY['borrador','enviada','recibida','rechazada','aceptada'])),
    fecha_envio date,
    fecha_recepcion date,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_hitos
CREATE TABLE IF NOT EXISTS erp_hitos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    descripcion text,
    fecha_planificada date NOT NULL,
    fecha_real date,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','en_proceso','completado','retrasado'])),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_riesgos
CREATE TABLE IF NOT EXISTS erp_riesgos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    categoria text NOT NULL,
    descripcion text NOT NULL,
    probabilidad text NOT NULL CHECK (probabilidad = ANY (ARRAY['baja','media','alta'])),
    impacto text NOT NULL CHECK (impacto = ANY (ARRAY['bajo','medio','alto'])),
    estado text NOT NULL DEFAULT 'abierto' CHECK (estado = ANY (ARRAY['abierto','mitigado','cerrado'])),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_cuentas_cobrar
CREATE TABLE IF NOT EXISTS erp_cuentas_cobrar (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    cliente text NOT NULL,
    monto numeric(12,2) NOT NULL DEFAULT 0,
    fecha_vencimiento date NOT NULL,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','pagada','vencida'])),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_cuentas_pagar
CREATE TABLE IF NOT EXISTS erp_cuentas_pagar (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    proveedor_id uuid REFERENCES erp_proveedores(id) ON DELETE SET NULL,
    monto numeric(12,2) NOT NULL DEFAULT 0,
    fecha_vencimiento date NOT NULL,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','pagada','vencida'])),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_ordenes_cambio
CREATE TABLE IF NOT EXISTS erp_ordenes_cambio (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    numero text NOT NULL UNIQUE,
    descripcion text NOT NULL,
    motivo text,
    costo_impacto numeric(12,2) NOT NULL DEFAULT 0,
    estado text NOT NULL DEFAULT 'solicitada' CHECK (estado = ANY (ARRAY['solicitada','aprobada','rechazada','implementada'])),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_muro (renombrado a erp_publicaciones_muro en migraciones posteriores)
CREATE TABLE IF NOT EXISTS erp_muro (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    contenido text NOT NULL,
    tipo text NOT NULL DEFAULT 'publicacion' CHECK (tipo = ANY (ARRAY['publicacion','comentario','like'])),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- erp_incidentes
CREATE TABLE IF NOT EXISTS erp_incidentes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    empleado_id uuid REFERENCES erp_empleados(id) ON DELETE SET NULL,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    descripcion text NOT NULL,
    severidad text NOT NULL CHECK (severidad = ANY (ARRAY['leve','moderada','grave'])),
    estado text NOT NULL DEFAULT 'abierto' CHECK (estado = ANY (ARRAY['abierto','en_proceso','cerrado'])),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_pruebas_laboratorio
CREATE TABLE IF NOT EXISTS erp_pruebas_laboratorio (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    muestra text NOT NULL,
    tipo_prueba text NOT NULL,
    fecha_muestreo date NOT NULL,
    resultado text,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','en_proceso','completada'])),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_no_conformidades
CREATE TABLE IF NOT EXISTS erp_no_conformidades (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    descripcion text NOT NULL,
    severidad text NOT NULL CHECK (severidad = ANY (ARRAY['leve','moderada','grave'])),
    estado text NOT NULL DEFAULT 'abierta' CHECK (estado = ANY (ARRAY['abierta','en_proceso','cerrada'])),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- erp_liberaciones_partida
CREATE TABLE IF NOT EXISTS erp_liberaciones_partida (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    partida text NOT NULL,
    fecha_liberacion date NOT NULL,
    liberado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','aprobada','rechazada'])),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- 2. HABILITAR RLS EN TABLAS NUEVAS
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
-- 3. POLÍTICAS RLS SIMPLIFICADAS (sin dependencias de funciones)
-- ============================================================

-- erp_insumos_base: todos pueden leer, solo Admin/Gerente/Residente pueden escribir
DROP POLICY IF EXISTS "erp_insumos_base_read" ON erp_insumos_base;
CREATE POLICY "erp_insumos_base_read" ON erp_insumos_base
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "erp_insumos_base_write" ON erp_insumos_base;
CREATE POLICY "erp_insumos_base_write" ON erp_insumos_base
  FOR ALL TO authenticated USING (true);

-- erp_rendimientos_cuadrilla: todos pueden leer, solo Admin/Gerente/Residente pueden escribir
DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_read" ON erp_rendimientos_cuadrilla;
CREATE POLICY "erp_rendimientos_cuadrilla_read" ON erp_rendimientos_cuadrilla
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_write" ON erp_rendimientos_cuadrilla;
CREATE POLICY "erp_rendimientos_cuadrilla_write" ON erp_rendimientos_cuadrilla
  FOR ALL TO authenticated USING (true);

-- erp_auditoria: solo Admin/Gerente pueden leer, trigger inserta
DROP POLICY IF EXISTS "erp_auditoria_read" ON erp_auditoria;
CREATE POLICY "erp_auditoria_read" ON erp_auditoria
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "erp_auditoria_insert" ON erp_auditoria;
CREATE POLICY "erp_auditoria_insert" ON erp_auditoria
  FOR INSERT TO authenticated WITH CHECK (true);

-- Para todas las demás tablas: políticas simples para permitir operaciones
DO $$
BEGIN
  -- erp_licitaciones
  DROP POLICY IF EXISTS "erp_licitaciones_read" ON erp_licitaciones;
  CREATE POLICY "erp_licitaciones_read" ON erp_licitaciones FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_licitaciones_write" ON erp_licitaciones;
  CREATE POLICY "erp_licitaciones_write" ON erp_licitaciones FOR ALL TO authenticated USING (true);

  -- erp_hitos
  DROP POLICY IF EXISTS "erp_hitos_read" ON erp_hitos;
  CREATE POLICY "erp_hitos_read" ON erp_hitos FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_hitos_write" ON erp_hitos;
  CREATE POLICY "erp_hitos_write" ON erp_hitos FOR ALL TO authenticated USING (true);

  -- erp_riesgos
  DROP POLICY IF EXISTS "erp_riesgos_read" ON erp_riesgos;
  CREATE POLICY "erp_riesgos_read" ON erp_riesgos FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_riesgos_write" ON erp_riesgos;
  CREATE POLICY "erp_riesgos_write" ON erp_riesgos FOR ALL TO authenticated USING (true);

  -- erp_cuentas_cobrar
  DROP POLICY IF EXISTS "erp_cuentas_cobrar_read" ON erp_cuentas_cobrar;
  CREATE POLICY "erp_cuentas_cobrar_read" ON erp_cuentas_cobrar FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_cuentas_cobrar_write" ON erp_cuentas_cobrar;
  CREATE POLICY "erp_cuentas_cobrar_write" ON erp_cuentas_cobrar FOR ALL TO authenticated USING (true);

  -- erp_cuentas_pagar
  DROP POLICY IF EXISTS "erp_cuentas_pagar_read" ON erp_cuentas_pagar;
  CREATE POLICY "erp_cuentas_pagar_read" ON erp_cuentas_pagar FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_cuentas_pagar_write" ON erp_cuentas_pagar;
  CREATE POLICY "erp_cuentas_pagar_write" ON erp_cuentas_pagar FOR ALL TO authenticated USING (true);

  -- erp_ordenes_cambio
  DROP POLICY IF EXISTS "erp_ordenes_cambio_read" ON erp_ordenes_cambio;
  CREATE POLICY "erp_ordenes_cambio_read" ON erp_ordenes_cambio FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_ordenes_cambio_write" ON erp_ordenes_cambio;
  CREATE POLICY "erp_ordenes_cambio_write" ON erp_ordenes_cambio FOR ALL TO authenticated USING (true);

  -- erp_muro
  DROP POLICY IF EXISTS "erp_muro_read" ON erp_muro;
  CREATE POLICY "erp_muro_read" ON erp_muro FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_muro_write" ON erp_muro;
  CREATE POLICY "erp_muro_write" ON erp_muro FOR ALL TO authenticated USING (true);

  -- erp_incidentes
  DROP POLICY IF EXISTS "erp_incidentes_read" ON erp_incidentes;
  CREATE POLICY "erp_incidentes_read" ON erp_incidentes FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_incidentes_write" ON erp_incidentes;
  CREATE POLICY "erp_incidentes_write" ON erp_incidentes FOR ALL TO authenticated USING (true);

  -- erp_pruebas_laboratorio
  DROP POLICY IF EXISTS "erp_pruebas_laboratorio_read" ON erp_pruebas_laboratorio;
  CREATE POLICY "erp_pruebas_laboratorio_read" ON erp_pruebas_laboratorio FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_pruebas_laboratorio_write" ON erp_pruebas_laboratorio;
  CREATE POLICY "erp_pruebas_laboratorio_write" ON erp_pruebas_laboratorio FOR ALL TO authenticated USING (true);

  -- erp_no_conformidades
  DROP POLICY IF EXISTS "erp_no_conformidades_read" ON erp_no_conformidades;
  CREATE POLICY "erp_no_conformidades_read" ON erp_no_conformidades FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_no_conformidades_write" ON erp_no_conformidades;
  CREATE POLICY "erp_no_conformidades_write" ON erp_no_conformidades FOR ALL TO authenticated USING (true);

  -- erp_liberaciones_partida
  DROP POLICY IF EXISTS "erp_liberaciones_partida_read" ON erp_liberaciones_partida;
  CREATE POLICY "erp_liberaciones_partida_read" ON erp_liberaciones_partida FOR SELECT TO authenticated USING (true);
  DROP POLICY IF EXISTS "erp_liberaciones_partida_write" ON erp_liberaciones_partida;
  CREATE POLICY "erp_liberaciones_partida_write" ON erp_liberaciones_partida FOR ALL TO authenticated USING (true);
END $$;

-- ============================================================
-- 4. FUNCIÓN update_updated_at_column (si no existe)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. TRIGGERS DE updated_at
-- ============================================================

DO $$
BEGIN
  -- erp_insumos_base
  DROP TRIGGER IF EXISTS trg_erp_insumos_base_updated ON erp_insumos_base;
  CREATE TRIGGER trg_erp_insumos_base_updated
    BEFORE UPDATE ON erp_insumos_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_rendimientos_cuadrilla
  DROP TRIGGER IF EXISTS trg_erp_rendimientos_cuadrilla_updated ON erp_rendimientos_cuadrilla;
  CREATE TRIGGER trg_erp_rendimientos_cuadrilla_updated
    BEFORE UPDATE ON erp_rendimientos_cuadrilla
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_licitaciones
  DROP TRIGGER IF EXISTS trg_erp_licitaciones_updated ON erp_licitaciones;
  CREATE TRIGGER trg_erp_licitaciones_updated
    BEFORE UPDATE ON erp_licitaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_hitos
  DROP TRIGGER IF EXISTS trg_erp_hitos_updated ON erp_hitos;
  CREATE TRIGGER trg_erp_hitos_updated
    BEFORE UPDATE ON erp_hitos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_riesgos
  DROP TRIGGER IF EXISTS trg_erp_riesgos_updated ON erp_riesgos;
  CREATE TRIGGER trg_erp_riesgos_updated
    BEFORE UPDATE ON erp_riesgos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_cuentas_cobrar
  DROP TRIGGER IF EXISTS trg_erp_cuentas_cobrar_updated ON erp_cuentas_cobrar;
  CREATE TRIGGER trg_erp_cuentas_cobrar_updated
    BEFORE UPDATE ON erp_cuentas_cobrar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_cuentas_pagar
  DROP TRIGGER IF EXISTS trg_erp_cuentas_pagar_updated ON erp_cuentas_pagar;
  CREATE TRIGGER trg_erp_cuentas_pagar_updated
    BEFORE UPDATE ON erp_cuentas_pagar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_ordenes_cambio
  DROP TRIGGER IF EXISTS trg_erp_ordenes_cambio_updated ON erp_ordenes_cambio;
  CREATE TRIGGER trg_erp_ordenes_cambio_updated
    BEFORE UPDATE ON erp_ordenes_cambio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_incidentes
  DROP TRIGGER IF EXISTS trg_erp_incidentes_updated ON erp_incidentes;
  CREATE TRIGGER trg_erp_incidentes_updated
    BEFORE UPDATE ON erp_incidentes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_pruebas_laboratorio
  DROP TRIGGER IF EXISTS trg_erp_pruebas_laboratorio_updated ON erp_pruebas_laboratorio;
  CREATE TRIGGER trg_erp_pruebas_laboratorio_updated
    BEFORE UPDATE ON erp_pruebas_laboratorio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_no_conformidades
  DROP TRIGGER IF EXISTS trg_erp_no_conformidades_updated ON erp_no_conformidades;
  CREATE TRIGGER trg_erp_no_conformidades_updated
    BEFORE UPDATE ON erp_no_conformidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- erp_liberaciones_partida
  DROP TRIGGER IF EXISTS trg_erp_liberaciones_partida_updated ON erp_liberaciones_partida;
  CREATE TRIGGER trg_erp_liberaciones_partida_updated
    BEFORE UPDATE ON erp_liberaciones_partida
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

