-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 21: RPC para Stock Double-Dispatch
-- Fecha: 2026-06-13
--
-- Previene race conditions en vales de salida simultáneos
-- usando SELECT ... FOR UPDATE dentro de una transacción RPC.
-- ============================================================

-- ============================================================
-- RPC: descontar_stock_vale
-- Descripción: Descuenta stock de materiales de forma atómica.
-- Usa SELECT ... FOR UPDATE para evitar double-dispatch.
-- Si algún material tiene stock insuficiente, revierte todo.
-- ============================================================
CREATE OR REPLACE FUNCTION public.descontar_stock_vale(
  p_items JSONB,
  p_vale_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_material_id UUID;
  v_cantidad NUMERIC;
  v_stock_actual NUMERIC;
  v_error TEXT;
  v_result JSONB;
BEGIN
  -- Iniciar transacción implícita (cada llamada RPC es una transacción)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_material_id := (v_item->>'materialId')::UUID;
    v_cantidad := (v_item->>'cantidad')::NUMERIC;

    IF v_material_id IS NULL OR v_cantidad IS NULL THEN
      RAISE EXCEPTION 'Item inválido: materialId o cantidad faltante';
    END IF;

    -- SELECT ... FOR UPDATE bloquea la fila hasta que termine la transacción
    SELECT stock INTO v_stock_actual
    FROM erp_materiales
    WHERE id = v_material_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Material no encontrado: %', v_material_id;
    END IF;

    IF v_stock_actual < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para material %: disponible %, requerido %',
        v_material_id, v_stock_actual, v_cantidad;
    END IF;

    -- Descontar stock atómicamente
    UPDATE erp_materiales
    SET stock = stock - v_cantidad,
        updated_at = now()
    WHERE id = v_material_id;
  END LOOP;

  -- Si se proporcionó un vale_id, registrarlo como procesado
  IF p_vale_id IS NOT NULL THEN
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Stock descontado exitosamente',
      'valeId', p_vale_id
    );
  ELSE
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Stock descontado exitosamente'
    );
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback implícito de toda la transacción
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', COALESCE(SQLSTATE, '')
    );
    RETURN v_result;
END;
$$;

-- ============================================================
-- RPC: incrementar_stock_oc
-- Descripción: Incrementa stock de materiales al aprobar/recibir OC.
-- Usa SELECT ... FOR UPDATE para evitar double-dispatch.
-- ============================================================
CREATE OR REPLACE FUNCTION public.incrementar_stock_oc(
  p_items JSONB,
  p_oc_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_material_id UUID;
  v_cantidad NUMERIC;
  v_stock_actual NUMERIC;
  v_result JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_material_id := (v_item->>'materialId')::UUID;
    v_cantidad := (v_item->>'cantidad')::NUMERIC;

    IF v_material_id IS NULL OR v_cantidad IS NULL THEN
      RAISE EXCEPTION 'Item inválido: materialId o cantidad faltante';
    END IF;

    SELECT stock INTO v_stock_actual
    FROM erp_materiales
    WHERE id = v_material_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Material no encontrado: %', v_material_id;
    END IF;

    UPDATE erp_materiales
    SET stock = stock + v_cantidad,
        updated_at = now()
    WHERE id = v_material_id;
  END LOOP;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Stock incrementado exitosamente',
    'ocId', p_oc_id
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', COALESCE(SQLSTATE, '')
    );
    RETURN v_result;
END;
$$;

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.descontar_stock_vale TO authenticated;
GRANT EXECUTE ON FUNCTION public.incrementar_stock_oc TO authenticated;

-- ============================================================
-- RPC: verificar_stock_vale
-- Descripción: Verifica disponibilidad de stock sin descontar
-- (útil para validación previa en UI).
-- ============================================================
CREATE OR REPLACE FUNCTION public.verificar_stock_vale(
  p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_material_id UUID;
  v_cantidad NUMERIC;
  v_stock_actual NUMERIC;
  v_insuficientes JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_material_id := (v_item->>'materialId')::UUID;
    v_cantidad := (v_item->>'cantidad')::NUMERIC;

    SELECT stock INTO v_stock_actual
    FROM erp_materiales
    WHERE id = v_material_id;

    IF v_stock_actual < v_cantidad THEN
      v_insuficientes := v_insuficientes || jsonb_build_object(
        'materialId', v_material_id,
        'disponible', v_stock_actual,
        'requerido', v_cantidad
      );
    END IF;
  END LOOP;

  v_result := jsonb_build_object(
    'success', jsonb_array_length(v_insuficientes) = 0,
    'insuficientes', v_insuficientes
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verificar_stock_vale TO authenticated;