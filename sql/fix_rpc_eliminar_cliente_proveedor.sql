-- ============================================================
-- RPC: eliminar_cliente_admin
-- Elimina un cliente con verificación de permisos y auditoría
-- ============================================================
CREATE OR REPLACE FUNCTION eliminar_cliente_admin(p_cliente_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_cliente_nombre TEXT;
  v_result JSONB;
BEGIN
  -- Obtener ID del usuario actual
  v_admin_id := auth.uid();
  
  -- Verificar que el usuario existe y es admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_admin_id 
    AND rol = 'admin'
    AND activo = true
  ) THEN
    RAISE EXCEPTION 'ACCESO_DENEGADO: Solo administradores pueden eliminar clientes'
      USING HINT = 'Se requiere rol admin';
  END IF;

  -- Obtener nombre del cliente para auditoría
  SELECT nombre INTO v_cliente_nombre FROM clientes WHERE id = p_cliente_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CLIENTE_NO_ENCONTRADO: El cliente con ID % no existe', p_cliente_id;
  END IF;

  -- Realizar soft delete (marcar como inactivo)
  UPDATE clientes 
  SET 
    activo = false,
    updated_at = NOW(),
    updated_by = v_admin_id
  WHERE id = p_cliente_id;

  -- Registrar en auditoría
  INSERT INTO audit_log (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles,
    created_at
  ) VALUES (
    v_admin_id,
    'ELIMINAR_CLIENTE',
    'clientes',
    p_cliente_id::TEXT,
    jsonb_build_object(
      'cliente_nombre', v_cliente_nombre,
      'accion', 'soft_delete',
      'admin_id', v_admin_id
    ),
    NOW()
  );

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Cliente eliminado correctamente',
    'cliente_id', p_cliente_id,
    'cliente_nombre', v_cliente_nombre
  );

  RETURN v_result;
END;
$$;

-- ============================================================
-- RPC: eliminar_proveedor_admin
-- Elimina un proveedor con verificación de permisos y auditoría
-- ============================================================
CREATE OR REPLACE FUNCTION eliminar_proveedor_admin(p_proveedor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_proveedor_nombre TEXT;
  v_result JSONB;
BEGIN
  -- Obtener ID del usuario actual
  v_admin_id := auth.uid();
  
  -- Verificar que el usuario existe y es admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_admin_id 
    AND rol = 'admin'
    AND activo = true
  ) THEN
    RAISE EXCEPTION 'ACCESO_DENEGADO: Solo administradores pueden eliminar proveedores'
      USING HINT = 'Se requiere rol admin';
  END IF;

  -- Obtener nombre del proveedor para auditoría
  SELECT nombre INTO v_proveedor_nombre FROM proveedores WHERE id = p_proveedor_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROVEEDOR_NO_ENCONTRADO: El proveedor con ID % no existe', p_proveedor_id;
  END IF;

  -- Realizar soft delete (marcar como inactivo)
  UPDATE proveedores 
  SET 
    activo = false,
    updated_at = NOW(),
    updated_by = v_admin_id
  WHERE id = p_proveedor_id;

  -- Registrar en auditoría
  INSERT INTO audit_log (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles,
    created_at
  ) VALUES (
    v_admin_id,
    'ELIMINAR_PROVEEDOR',
    'proveedores',
    p_proveedor_id::TEXT,
    jsonb_build_object(
      'proveedor_nombre', v_proveedor_nombre,
      'accion', 'soft_delete',
      'admin_id', v_admin_id
    ),
    NOW()
  );

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Proveedor eliminado correctamente',
    'proveedor_id', p_proveedor_id,
    'proveedor_nombre', v_proveedor_nombre
  );

  RETURN v_result;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION eliminar_cliente_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION eliminar_proveedor_admin(UUID) TO authenticated;

-- ============================================================
-- RPC: verificar_sesion_activa
-- Verifica si la sesión del usuario sigue activa y válida
-- ============================================================
CREATE OR REPLACE FUNCTION verificar_sesion_activa()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('activa', false, 'motivo', 'No hay sesión activa');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
  
  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('activa', false, 'motivo', 'Perfil no encontrado');
  END IF;

  IF v_profile.activo = false THEN
    RETURN jsonb_build_object('activa', false, 'motivo', 'Usuario desactivado');
  END IF;

  RETURN jsonb_build_object(
    'activa', true,
    'usuario_id', v_user_id,
    'rol', v_profile.rol,
    'nombre', v_profile.nombre,
    'ultimo_acceso', v_profile.ultimo_acceso
  );
END;
$$;

GRANT EXECUTE ON FUNCTION verificar_sesion_activa() TO authenticated;