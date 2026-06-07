-- Migration 000000000007: Tablas persistencia pendiente (CuentasCobrar, CuentasPagar, OrdenesCambio, Hitos, Riesgos)

-- ============================================================
-- erp_cuentas_cobrar
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_cuentas_cobrar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  cliente TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC DEFAULT 0,
  saldo_pendiente NUMERIC DEFAULT 0,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_cobro DATE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','parcial','cobrado','vencido','incobrable')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE erp_cuentas_cobrar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cuentas_cobrar_select" ON erp_cuentas_cobrar
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente','Compras'))
  );
CREATE POLICY "cuentas_cobrar_all" ON erp_cuentas_cobrar
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente'))
  );

-- ============================================================
-- erp_cuentas_pagar
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_cuentas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  proveedor TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC DEFAULT 0,
  saldo_pendiente NUMERIC DEFAULT 0,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','parcial','pagado','vencido')),
  factura_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE erp_cuentas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cuentas_pagar_select" ON erp_cuentas_pagar
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Compras'))
  );
CREATE POLICY "cuentas_pagar_all" ON erp_cuentas_pagar
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Compras'))
  );

-- ============================================================
-- erp_ordenes_cambio
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_ordenes_cambio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  impacto_costo NUMERIC DEFAULT 0,
  impacto_plazo INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'solicitud' CHECK (estado IN ('solicitud','revision','aprobado','rechazado')),
  solicitante TEXT NOT NULL,
  solicitante_rol TEXT,
  aprobador TEXT,
  fecha_aprobacion DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE erp_ordenes_cambio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ordenes_cambio_select" ON erp_ordenes_cambio
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente'))
  );
CREATE POLICY "ordenes_cambio_insert" ON erp_ordenes_cambio
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente'))
  );
CREATE POLICY "ordenes_cambio_update" ON erp_ordenes_cambio
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente'))
  );
CREATE POLICY "ordenes_cambio_delete" ON erp_ordenes_cambio
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente'))
  );

-- ============================================================
-- erp_hitos
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_hitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  tipo TEXT DEFAULT 'hito' CHECK (tipo IN ('inicio','hito','entrega','cierre')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','completado','retrasado')),
  responsable TEXT,
  depende_de UUID[],
  completado_en DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE erp_hitos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hitos_select" ON erp_hitos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente'))
  );
CREATE POLICY "hitos_all" ON erp_hitos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente'))
  );

-- ============================================================
-- erp_riesgos
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_riesgos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT DEFAULT 'tecnico',
  probabilidad INTEGER DEFAULT 1 CHECK (probabilidad BETWEEN 1 AND 5),
  impacto INTEGER DEFAULT 1 CHECK (impacto BETWEEN 1 AND 5),
  nivel TEXT DEFAULT 'bajo' CHECK (nivel IN ('bajo','medio','alto','critico')),
  plan_mitigacion TEXT,
  plan_contingencia TEXT,
  responsable TEXT,
  fecha_identificacion DATE NOT NULL,
  estado TEXT DEFAULT 'identificado' CHECK (estado IN ('identificado','en_mitigacion','mitigado','materializado')),
  costo_soporte NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE erp_riesgos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "riesgos_select" ON erp_riesgos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente'))
  );
CREATE POLICY "riesgos_all" ON erp_riesgos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente'))
  );

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_proyecto ON erp_cuentas_cobrar(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_pagar_proyecto ON erp_cuentas_pagar(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_cambio_proyecto ON erp_ordenes_cambio(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_hitos_proyecto ON erp_hitos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_riesgos_proyecto ON erp_riesgos(proyecto_id);

-- ============================================================
-- Realtime (seguro: solo agrega si no está ya en la publicación)
-- ============================================================
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['erp_cuentas_cobrar','erp_cuentas_pagar','erp_ordenes_cambio','erp_hitos','erp_riesgos'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END;
$$;
