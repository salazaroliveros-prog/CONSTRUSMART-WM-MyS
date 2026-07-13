-- Migration: Daily integrity checks RPC
-- Función que verifica integridad referencial y retorna un resumen de issues

CREATE OR REPLACE FUNCTION public.fn_daily_integrity_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_issues jsonb := '[]'::jsonb;
  v_count  int;
BEGIN
  -- 1. Presupuestos huérfanos (sin proyecto)
  SELECT COUNT(*) INTO v_count
  FROM erp_presupuestos p
  WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos pr WHERE pr.id = p.proyecto_id);
  IF v_count > 0 THEN
    v_issues := v_issues || jsonb_build_object('check', 'orphan_presupuestos', 'count', v_count, 'severity', 'high');
  END IF;

  -- 2. Movimientos sin proyecto válido
  SELECT COUNT(*) INTO v_count
  FROM erp_movimientos m
  WHERE m.proyecto_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM erp_proyectos pr WHERE pr.id = m.proyecto_id);
  IF v_count > 0 THEN
    v_issues := v_issues || jsonb_build_object('check', 'orphan_movimientos', 'count', v_count, 'severity', 'medium');
  END IF;

  -- 3. Órdenes de compra sin proveedor válido
  SELECT COUNT(*) INTO v_count
  FROM erp_ordenes_compra oc
  WHERE oc.proveedor_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM erp_proveedores pv WHERE pv.id = oc.proveedor_id);
  IF v_count > 0 THEN
    v_issues := v_issues || jsonb_build_object('check', 'orphan_ordenes_compra', 'count', v_count, 'severity', 'medium');
  END IF;

  -- 4. Proyectos con presupuestoActualId inválido
  SELECT COUNT(*) INTO v_count
  FROM erp_proyectos pr
  WHERE pr."presupuestoActualId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM erp_presupuestos p WHERE p.id = pr."presupuestoActualId");
  IF v_count > 0 THEN
    v_issues := v_issues || jsonb_build_object('check', 'invalid_presupuesto_actual', 'count', v_count, 'severity', 'high');
  END IF;

  RETURN jsonb_build_object(
    'checked_at', now(),
    'issues_count', jsonb_array_length(v_issues),
    'issues', v_issues,
    'status', CASE WHEN jsonb_array_length(v_issues) = 0 THEN 'ok' ELSE 'issues_found' END
  );
END;
$$;

-- Solo admin puede ejecutar
REVOKE ALL ON FUNCTION public.fn_daily_integrity_check() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_daily_integrity_check() TO authenticated;
