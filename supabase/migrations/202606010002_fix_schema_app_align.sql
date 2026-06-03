--supabase/migrations/202606010002_fix_schema_app_align.sql

-- 1. Habilitar RLS para todas las tablas afectadas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_bitacora ENABLE ROW LEVEL SECURITY;

-- 2. Asegurar la columna 'id' como UUID y clave primaria
-- Si ya son UUID y PK, estos ALTER TABLE serán redundantes pero seguros.
-- Si hay datos que no son UUIDs, estos comandos fallarán si la tabla no está vacía.

ALTER TABLE public.profiles ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE public.erp_proyectos ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE public.erp_movimientos ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE public.erp_empleados ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE public.erp_materiales ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE public.erp_ordenes_compra ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE public.erp_proveedores ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE public.erp_eventos_calendario ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE public.erp_bitacora ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;

-- 3. Añadir/Actualizar columna 'created_by' y establecer FK a auth.users
-- Aseguramos que created_by sea nullable inicialmente si hay datos existentes que no lo tienen.
-- Luego, se pueden hacer updates para backfill o cambiar a NOT NULL si se desea forzar.

-- erp_proyectos
ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.erp_proyectos ALTER COLUMN created_by DROP NOT NULL; -- Asegurar que sea NULLABLE si hay datos preexistentes
ALTER TABLE public.erp_proyectos ADD CONSTRAINT erp_proyectos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- erp_movimientos
ALTER TABLE public.erp_movimientos ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.erp_movimientos ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.erp_movimientos ADD CONSTRAINT erp_movimientos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Otras tablas donde quieras created_by:
-- erp_empleados
ALTER TABLE public.erp_empleados ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.erp_empleados ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.erp_empleados ADD CONSTRAINT erp_empleados_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- erp_ordenes_compra
ALTER TABLE public.erp_ordenes_compra ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.erp_ordenes_compra ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.erp_ordenes_compra ADD CONSTRAINT erp_ordenes_compra_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- erp_proveedores
ALTER TABLE public.erp_proveedores ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.erp_proveedores ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.erp_proveedores ADD CONSTRAINT erp_proveedores_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- erp_eventos_calendario
ALTER TABLE public.erp_eventos_calendario ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.erp_eventos_calendario ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.erp_eventos_calendario ADD CONSTRAINT erp_eventos_calendario_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- erp_bitacora
ALTER TABLE public.erp_bitacora ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.erp_bitacora ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.erp_bitacora ADD CONSTRAINT erp_bitacora_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


-- 4. Políticas RLS para la tabla 'profiles'
-- Asegura que cada usuario solo puede ver/modificar su propio perfil.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true); -- Permitir que todos lean perfiles (o ajusta a auth.uid() = id)

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile." ON public.profiles;
CREATE POLICY "Users can delete their own profile." ON public.profiles FOR DELETE USING (auth.uid() = id);


-- 5. Políticas RLS básicas para tablas de la aplicación (created_by)
-- Estas políticas asumen que un usuario solo interactúa con los recursos que él creó.
-- Ajusta según tu lógica de negocio (ej. rol 'Administrador' puede ver todo).

-- erp_proyectos
DROP POLICY IF EXISTS "Allow authenticated users to view own projects" ON public.erp_proyectos;
CREATE POLICY "Allow authenticated users to view own projects" ON public.erp_proyectos FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Allow authenticated users to create projects" ON public.erp_proyectos;
CREATE POLICY "Allow authenticated users to create projects" ON public.erp_proyectos FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Allow authenticated users to update own projects" ON public.erp_proyectos;
CREATE POLICY "Allow authenticated users to update own projects" ON public.erp_proyectos FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Allow authenticated users to delete own projects" ON public.erp_proyectos;
CREATE POLICY "Allow authenticated users to delete own projects" ON public.erp_proyectos FOR DELETE USING (auth.uid() = created_by);

-- erp_movimientos
DROP POLICY IF EXISTS "Allow authenticated users to view own movements" ON public.erp_movimientos;
CREATE POLICY "Allow authenticated users to view own movements" ON public.erp_movimientos FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Allow authenticated users to create movements" ON public.erp_movimientos;
CREATE POLICY "Allow authenticated users to create movements" ON public.erp_movimientos FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Allow authenticated users to update own movements" ON public.erp_movimientos;
CREATE POLICY "Allow authenticated users to update own movements" ON public.erp_movimientos FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Allow authenticated users to delete own movements" ON public.erp_movimientos;
CREATE POLICY "Allow authenticated users to delete own movements" ON public.erp_movimientos FOR DELETE USING (auth.uid() = created_by);

-- Repite para otras tablas con created_by (empleados, ordenes_compra, proveedores, eventos_calendario, bitacora)
-- Por ejemplo, para erp_empleados:
DROP POLICY IF EXISTS "Allow authenticated users to view own employees" ON public.erp_empleados;
CREATE POLICY "Allow authenticated users to view own employees" ON public.erp_empleados FOR SELECT USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "Allow authenticated users to create employees" ON public.erp_empleados;
CREATE POLICY "Allow authenticated users to create employees" ON public.erp_empleados FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Allow authenticated users to update own employees" ON public.erp_empleados;
CREATE POLICY "Allow authenticated users to update own employees" ON public.erp_empleados FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "Allow authenticated users to delete own employees" ON public.erp_empleados;
CREATE POLICY "Allow authenticated users to delete own employees" ON public.erp_empleados FOR DELETE USING (auth.uid() = created_by);

-- ... y así sucesivamente para cada tabla que tenga 'created_by' y necesite RLS por usuario.

-- erp_materiales (puede que no necesite created_by si es compartido por todos)
-- Por defecto, permitiremos ver a todos, y sólo administradores/gerentes puedan modificar (no lo defino aquí, es un ejemplo)
-- Si 'materiales' no tiene 'created_by', puedes dejar RLS para 'SELECT' en 'true' para todos.
DROP POLICY IF EXISTS "Allow authenticated users to view materials" ON public.erp_materiales;
CREATE POLICY "Allow authenticated users to view materials" ON public.erp_materiales FOR SELECT USING (true);


-- 6. Trigger para crear perfil en 'profiles' al registrar nuevo usuario
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol, user_metadata)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'Residente', NEW.raw_user_meta_data);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
