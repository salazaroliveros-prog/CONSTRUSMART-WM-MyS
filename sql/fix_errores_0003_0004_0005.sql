-- ============================================================
-- CONSTRUSMART ERP - Fix errores de ejecución en migraciones
-- Generado: 2026-06-03
--
-- ERRORES REPORTADOS (3):
-- 1) POLICY "logs_sistema_insert" already exists (0003)
-- 2) column "proyecto_id" does not exist en erp_empleados (0004 seed data)
-- 3) POLICY "erp_auditoria_select" already exists (0003) - ya corregido antes
-- 4) DROP FUNCTION necesita CASCADE (0005) - ya corregido antes
-- ============================================================

-- ============================================================
-- PASO 1: POLÍTICAS DUPLICADAS — Usar schema explícito public.
-- ============================================================

-- logs_sistema: usar schema explícito para evitar ambigüedad
DROP POLICY IF EXISTS "logs_sistema_select" ON public.logs_sistema;
DROP POLICY IF EXISTS "logs_sistema_insert" ON public.logs_sistema;

CREATE POLICY "logs_sistema_select"
  ON public.logs_sistema FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente'))
  );

CREATE POLICY "logs_sistema_insert"
  ON public.logs_sistema FOR INSERT TO authenticated
  WITH CHECK (true);

-- erp_auditoria_select (schema explícito)
DROP POLICY IF EXISTS "erp_auditoria_select" ON public.erp_auditoria;
CREATE POLICY "erp_auditoria_select"
  ON public.erp_auditoria FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente'))
  );

-- ============================================================
-- PASO 2: Función unique administrator - DROP con CASCADE
-- ============================================================
DROP FUNCTION IF EXISTS public.fn_force_administrator_unique() CASCADE;

CREATE OR REPLACE FUNCTION public.fn_force_administrator_unique()
RETURNS TRIGGER AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.rol = 'Administrador' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
    IF v_email != 'salazaroliveros@gmail.com' THEN
      NEW.rol := 'Gerente';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_force_administrator_unique
  BEFORE INSERT OR UPDATE OF rol ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_force_administrator_unique();

-- ============================================================
-- PASO 3: RPC verificar_rol_usuario
-- ============================================================
DROP FUNCTION IF EXISTS public.verificar_rol_usuario() CASCADE;

CREATE OR REPLACE FUNCTION public.verificar_rol_usuario()
RETURNS TABLE (
  usuario_id uuid,
  rol text,
  nombre text,
  authenticated boolean
) AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  
  RETURN QUERY
  SELECT
    p.id,
    CASE 
      WHEN v_email = 'salazaroliveros@gmail.com' THEN 'Administrador'::text
      WHEN p.rol = 'Administrador' AND v_email != 'salazaroliveros@gmail.com' THEN 'Gerente'::text
      ELSE p.rol
    END,
    p.nombre,
    (auth.uid() IS NOT NULL) AS authenticated
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.verificar_rol_usuario() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_rol_usuario() TO authenticated;

-- ============================================================
-- PASO 4: Migrar Administradores no autorizados a Gerente
-- ============================================================
UPDATE public.profiles
SET rol = 'Gerente'
WHERE rol = 'Administrador'
  AND id IN (
    SELECT id FROM auth.users 
    WHERE email != 'salazaroliveros@gmail.com'
  );

-- ============================================================
-- PASO 5: CORREGIR SEED DATA — erp_empleados
-- La columna se llama proyecto_ids (array), NO proyecto_id (single)
-- ============================================================

-- Insertar empleados solo si la tabla está vacía
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_empleados LIMIT 1) THEN
    INSERT INTO erp_empleados (id, nombre, puesto, proyecto_ids, salario_diario, dias_trabajados, tipo) VALUES
      ('00000000-0000-0000-0000-000000000021', 'Carlos Méndez', 'Maestro de obra', ARRAY['00000000-0000-0000-0000-000000000001'::uuid], 175, 26, 'planilla'),
      ('00000000-0000-0000-0000-000000000022', 'José Ramírez', 'Albañil', ARRAY['00000000-0000-0000-0000-000000000001'::uuid], 130, 24, 'destajo'),
      ('00000000-0000-0000-0000-000000000023', 'Luis García', 'Armador', ARRAY['00000000-0000-0000-0000-000000000002'::uuid], 140, 25, 'planilla'),
      ('00000000-0000-0000-0000-000000000024', 'Ana López', 'Ing. Residente', ARRAY['00000000-0000-0000-0000-000000000003'::uuid], 380, 26, 'planilla'),
      ('00000000-0000-0000-0000-000000000025', 'Pedro Cux', 'Ayudante', ARRAY['00000000-0000-0000-0000-000000000004'::uuid], 95, 23, 'destajo'),
      ('00000000-0000-0000-0000-000000000026', 'Marvin Tzoc', 'Operador', ARRAY['00000000-0000-0000-0000-000000000002'::uuid], 165, 26, 'planilla'),
      ('00000000-0000-0000-0000-000000000027', 'Sandra Pérez', 'Bodeguero', ARRAY['00000000-0000-0000-0000-000000000001'::uuid], 120, 26, 'planilla');
  END IF;
END $$;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
-- SELECT * FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- SELECT * FROM public.verificar_rol_usuario();
-- SELECT id, nombre, puesto, proyecto_ids FROM erp_empleados;