--
-- ERP CONSTRUSMART - Database Schema
-- Tablas para módulos: Proyectos, Presupuestos, Financiero, RRHH, Bodega, Seguimiento
--

-- Tabla: erp_proyectos
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
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tabla: erp_movimientos (ingresos/gastos financieros)
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
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabla: erp_empleados
CREATE TABLE erp_empleados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    puesto text NOT NULL,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    salario_diario numeric(10,2) NOT NULL DEFAULT 0,
    dias_trabajados integer NOT NULL DEFAULT 0,
    tipo text NOT NULL DEFAULT 'planilla' CHECK (tipo = ANY (ARRAY['planilla','destajo'])),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabla: erp_materiales (inventario de bodega)
CREATE TABLE erp_materiales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    unidad text NOT NULL,
    stock numeric(10,2) NOT NULL DEFAULT 0,
    stock_minimo numeric(10,2) NOT NULL DEFAULT 0,
    precio numeric(10,2) NOT NULL DEFAULT 0,
    critico boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabla: erp_ordenes_compra
CREATE TABLE erp_ordenes_compra (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proveedor text NOT NULL,
    material text NOT NULL,
    cantidad numeric(10,2) NOT NULL DEFAULT 0,
    monto numeric(12,2) NOT NULL DEFAULT 0,
    estado text NOT NULL DEFAULT 'borrador' CHECK (estado = ANY (ARRAY['borrador','pendiente','aprobado','rechazado'])),
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabla: erp_proveedores
CREATE TABLE erp_proveedores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    contacto text,
    rubro text,
    calificacion integer NOT NULL DEFAULT 3 CHECK (calificacion >= 1 AND calificacion <= 5),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabla: erp_eventos_calendario
CREATE TABLE erp_eventos_calendario (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha date NOT NULL,
    titulo text NOT NULL,
    proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabla: erp_bitacora
CREATE TABLE erp_bitacora (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id uuid NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    clima text,
    personal integer NOT NULL DEFAULT 0,
    maquinaria text,
    tareas text NOT NULL,
    observaciones text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabla: erp_seguimiento (avances y EVM por proyecto)
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
    created_at timestamptz DEFAULT now() NOT NULL
);

--
-- ROW LEVEL SECURITY para tablas ERP
--

ALTER TABLE erp_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bitacora ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_seguimiento ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer proyectos
CREATE POLICY "ERP proyectos readable" ON erp_proyectos
    FOR SELECT TO authenticated USING (true);

-- Solo Administrador y Gerente pueden modificar proyectos
CREATE POLICY "ERP proyectos writable" ON erp_proyectos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.rol = ANY (ARRAY['Administrador','Gerente'])
        )
    );

-- Movimientos: lectura para todos autenticados, escritura para Administrador, Gerente, Residente
CREATE POLICY "ERP movimientos readable" ON erp_movimientos
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ERP movimientos writable" ON erp_movimientos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Residente'])
        )
    );

-- Empleados: lectura para todos, escritura para Administrador y Gerente
CREATE POLICY "ERP empleados readable" ON erp_empleados
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ERP empleados writable" ON erp_empleados
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.rol = ANY (ARRAY['Administrador','Gerente'])
        )
    );

-- Bodega: lectura para autenticados, escritura para Administrador, Compras, Bodeguero
CREATE POLICY "ERP materiales readable" ON erp_materiales
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ERP materiales writable" ON erp_materiales
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Compras','Bodeguero'])
        )
    );

CREATE POLICY "ERP ordenes readable" ON erp_ordenes_compra
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ERP ordenes writable" ON erp_ordenes_compra
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Compras'])
        )
    );

CREATE POLICY "ERP proveedores readable" ON erp_proveedores
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ERP proveedores writable" ON erp_proveedores
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.rol = ANY (ARRAY['Administrador','Gerente','Compras'])
        )
    );

-- Eventos y bitácora: lectura para autenticados, escritura para todos con acceso al proyecto
CREATE POLICY "ERP eventos readable" ON erp_eventos_calendario
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ERP eventos writable" ON erp_eventos_calendario
    FOR ALL TO authenticated USING (true);

CREATE POLICY "ERP bitacora readable" ON erp_bitacora
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ERP bitacora writable" ON erp_bitacora
    FOR ALL TO authenticated USING (true);

-- Seguimiento: solo Administrador y Gerente
CREATE POLICY "ERP seguimiento readable" ON erp_seguimiento
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.rol = ANY (ARRAY['Administrador','Gerente'])
        )
    );

CREATE POLICY "ERP seguimiento writable" ON erp_seguimiento
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.rol = ANY (ARRAY['Administrador','Gerente'])
        )
    );

-- Índices para rendimiento
CREATE INDEX idx_erp_proyectos_estado ON erp_proyectos(estado);
CREATE INDEX idx_erp_movimientos_proyecto ON erp_movimientos(proyecto_id);
CREATE INDEX idx_erp_movimientos_fecha ON erp_movimientos(fecha);
CREATE INDEX idx_erp_empleados_proyecto ON erp_empleados(proyecto_id);
CREATE INDEX idx_erp_eventos_proyecto ON erp_eventos_calendario(proyecto_id);
CREATE INDEX idx_erp_eventos_fecha ON erp_eventos_calendario(fecha);
CREATE INDEX idx_erp_bitacora_proyecto ON erp_bitacora(proyecto_id);
CREATE INDEX idx_erp_seguimiento_proyecto ON erp_seguimiento(proyecto_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION fn_erp_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_erp_proyectos_updated
    BEFORE UPDATE ON erp_proyectos
    FOR EACH ROW EXECUTE FUNCTION fn_erp_set_updated_at();
