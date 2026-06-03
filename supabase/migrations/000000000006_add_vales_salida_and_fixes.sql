-- ============================================================
-- ERP CONSTRUSMART - Migration 000000000006
-- Fixes missing table + constraints identified by schema audit
-- ============================================================

-- ============================================================
-- PART 1: Create missing erp_vales_salida table
-- Referenced in store.tsx mutation queue (addValeSalida / deleteValeSalida)
-- but never created in any migration
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_vales_salida (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  renglon_id uuid,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]',
  observaciones text,
  solicitante text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE erp_vales_salida ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vales_salida_read" ON erp_vales_salida
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "vales_salida_write" ON erp_vales_salida
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente', 'Bodeguero'))
  );

CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_proyecto ON erp_vales_salida(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_fecha ON erp_vales_salida(fecha);

-- ============================================================
-- PART 2: Add UNIQUE constraint on erp_presupuestos(proyecto_id, version_presupuesto)
-- Documented in SQL specs but never included in migration 000000000002
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'erp_presupuestos_proyecto_id_version_presupuesto_key'
    AND conrelid = 'erp_presupuestos'::regclass
  ) THEN
    ALTER TABLE erp_presupuestos
      ADD CONSTRAINT erp_presupuestos_proyecto_id_version_presupuesto_key
      UNIQUE (proyecto_id, version_presupuesto);
  END IF;
END $$;

-- ============================================================
-- PART 3: Attach fn_log_audit trigger to key tables
-- The function exists (created in migration 000000000003) but
-- was never attached to any table
-- ============================================================
CREATE OR REPLACE FUNCTION fn_log_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO logs_sistema (usuario_id, usuario_nombre, accion, entidad, entidad_id, valores_anteriores, valores_nuevos)
  VALUES (
    auth.uid(),
    COALESCE((SELECT nombre FROM public.profiles WHERE id = auth.uid()), 'Sistema'),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to erp_presupuestos (audit budget changes)
DROP TRIGGER IF EXISTS trg_log_audit_presupuestos ON erp_presupuestos;
CREATE TRIGGER trg_log_audit_presupuestos
  AFTER INSERT OR UPDATE OR DELETE ON erp_presupuestos
  FOR EACH ROW EXECUTE FUNCTION fn_log_audit_trigger();

-- Attach to erp_proyectos (audit project changes)
DROP TRIGGER IF EXISTS trg_log_audit_proyectos ON erp_proyectos;
CREATE TRIGGER trg_log_audit_proyectos
  AFTER INSERT OR UPDATE OR DELETE ON erp_proyectos
  FOR EACH ROW EXECUTE FUNCTION fn_log_audit_trigger();

-- ============================================================
-- PART 4: Trigger for erp_vales_salida updated_at
-- ============================================================
DROP TRIGGER IF EXISTS trg_erp_vales_salida_updated ON erp_vales_salida;
CREATE TRIGGER trg_erp_vales_salida_updated
  BEFORE UPDATE ON erp_vales_salida
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();
