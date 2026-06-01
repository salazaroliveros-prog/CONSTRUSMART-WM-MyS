-- ============================================================
-- ERP CONSTRUSMART - Script para reinicio completo de la base de datos
-- Elimina todas las tablas de ERP y public.profiles. 
-- Usar con EXTREMA PRECAUCIÓN en entornos de producción.
-- ============================================================

-- Eliminar políticas RLS de todas las tablas antes de eliminar.
-- Esto evita dependencias que puedan bloquear el DROP TABLE.

-- Políticas de public.profiles
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile." ON public.profiles;

-- Políticas de erp_proyectos
DROP POLICY IF EXISTS "erp_proyectos_read" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_write" ON erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to view own projects" ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to create projects" ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to update own projects" ON public.erp_proyectos;
DROP POLICY IF EXISTS "Allow authenticated users to delete own projects" ON public.erp_proyectos;

-- Políticas de erp_movimientos
DROP POLICY IF EXISTS "erp_movimientos_read" ON erp_movimientos;
DROP POLICY IF EXISTS "erp_movimientos_write" ON erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to view own movements" ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to create movements" ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to update own movements" ON public.erp_movimientos;
DROP POLICY IF EXISTS "Allow authenticated users to delete own movements" ON public.erp_movimientos;

-- Políticas de erp_empleados
DROP POLICY IF EXISTS "erp_empleados_read" ON erp_empleados;
DROP POLICY IF EXISTS "erp_empleados_write" ON erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to view own employees" ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to create employees" ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to update own employees" ON public.erp_empleados;
DROP POLICY IF EXISTS "Allow authenticated users to delete own employees" ON public.erp_empleados;

-- Políticas de erp_materiales
DROP POLICY IF EXISTS "erp_materiales_read" ON erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_write" ON erp_materiales;
DROP POLICY IF EXISTS "Allow authenticated users to view materials" ON public.erp_materiales;

-- Políticas de erp_ordenes_compra
DROP POLICY IF EXISTS "erp_ordenes_read" ON erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_write" ON erp_ordenes_compra;
DROP POLICY IF EXISTS "Allow authenticated users to view own order" ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS "Allow authenticated users to create order" ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS "Allow authenticated users to update own order" ON public.erp_ordenes_compra;
DROP POLICY IF EXISTS "Allow authenticated users to delete own order" ON public.erp_ordenes_compra;

-- Políticas de erp_proveedores
DROP POLICY IF EXISTS "erp_proveedores_read" ON erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_write" ON erp_proveedores;
DROP POLICY IF EXISTS "Allow authenticated users to view own provider" ON public.erp_proveedores;
DROP POLICY IF EXISTS "Allow authenticated users to create provider" ON public.erp_proveedores;
DROP POLICY IF EXISTS "Allow authenticated users to update own provider" ON public.erp_proveedores;
DROP POLICY IF EXISTS "Allow authenticated users to delete own provider" ON public.erp_proveedores;

-- Políticas de erp_eventos_calendario
DROP POLICY IF EXISTS "erp_eventos_read" ON erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_write" ON erp_eventos_calendario;
DROP POLICY IF EXISTS "Allow authenticated users to view own calendar_events" ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS "Allow authenticated users to create calendar_events" ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS "Allow authenticated users to update own calendar_events" ON public.erp_eventos_calendario;
DROP POLICY IF EXISTS "Allow authenticated users to delete own calendar_events" ON public.erp_eventos_calendario;

-- Políticas de erp_bitacora
DROP POLICY IF EXISTS "erp_bitacora_read" ON erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_write" ON erp_bitacora;
DROP POLICY IF EXISTS "Allow authenticated users to view own logbook_entry" ON public.erp_bitacora;
DROP POLICY IF EXISTS "Allow authenticated users to create logbook_entry" ON public.erp_bitacora;
DROP POLICY IF EXISTS "Allow authenticated users to update own logbook_entry" ON public.erp_bitacora;
DROP POLICY IF EXISTS "Allow authenticated users to delete own logbook_entry" ON public.erp_bitacora;

-- Políticas de erp_seguimiento
DROP POLICY IF EXISTS "erp_seguimiento_read" ON erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_write" ON erp_seguimiento;

-- Políticas de erp_renglones
DROP POLICY IF EXISTS "erp_renglones_read" ON erp_renglones;
DROP POLICY IF EXISTS "erp_renglones_write" ON erp_renglones;

-- Políticas de erp_insumos
DROP POLICY IF EXISTS "erp_insumos_read" ON erp_insumos;
DROP POLICY IF EXISTS "erp_insumos_write" ON erp_insumos;

-- Políticas de erp_sub_renglones
DROP POLICY IF EXISTS "erp_sub_renglones_read" ON erp_sub_renglones;
DROP POLICY IF EXISTS "erp_sub_renglones_write" ON erp_sub_renglones;


-- Eliminar disparadores (triggers) antes de eliminar las funciones o tablas
DROP TRIGGER IF EXISTS trg_erp_proyectos_updated ON erp_proyectos;
DROP TRIGGER IF EXISTS trg_erp_renglones_updated ON erp_renglones;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar funciones
DROP FUNCTION IF EXISTS public.fn_set_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;


-- Eliminar todas las tablas ERP y public.profiles
DROP TABLE IF EXISTS erp_seguimiento CASCADE;
DROP TABLE IF EXISTS erp_bitacora CASCADE;
DROP TABLE IF EXISTS erp_eventos_calendario CASCADE;
DROP TABLE IF EXISTS erp_proveedores CASCADE;
DROP TABLE IF EXISTS erp_ordenes_compra CASCADE;
DROP TABLE IF EXISTS erp_materiales CASCADE;
DROP TABLE IF EXISTS erp_empleados CASCADE;
DROP TABLE IF EXISTS erp_movimientos CASCADE;
DROP TABLE IF EXISTS erp_sub_renglones CASCADE;
DROP TABLE IF EXISTS erp_insumos CASCADE;
DROP TABLE IF EXISTS erp_renglones CASCADE;
DROP TABLE IF EXISTS erp_proyectos CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Opcional: Eliminar la extensión pgcrypto si ya no se necesita o se va a recrear
-- DROP EXTENSION IF EXISTS pgcrypto;