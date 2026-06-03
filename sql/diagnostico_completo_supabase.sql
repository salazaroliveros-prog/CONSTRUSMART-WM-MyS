-- =============================================================
-- DIAGNOSTICO COMPLETO SUPABASE - CONSTRUSMART ERP
-- =============================================================
-- Ejecutar este SQL en Supabase SQL Editor para extraer
-- TODO el estado actual de la base de datos.
-- =============================================================


-- =============================================================
-- 1. TODAS LAS TABLAS EXISTENTES
-- =============================================================
SELECT
  t.tablename,
  t.tableowner,
  c.reltuples::bigint AS estimated_rows,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = t.tablename) AS column_count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename;


-- =============================================================
-- 2. COLUMNAS DE CADA TABLA
-- =============================================================
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE WHEN character_maximum_length IS NOT NULL
    THEN character_maximum_length::text
    WHEN numeric_precision IS NOT NULL
    THEN numeric_precision::text
    ELSE ''
  END AS max_length
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;


-- =============================================================
-- 3. TODAS LAS POLITICAS RLS (CRITICO)
-- =============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- =============================================================
-- 4. DUPLICIDAD DE POLITICAS (NOMBRE O ACCION)
-- =============================================================
SELECT
  tablename,
  cmd,
  COUNT(*) AS veces,
  string_agg(policyname, ' | ') AS nombres_politicas
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tabla, veces DESC;


-- =============================================================
-- 5. RLS HABILITADO EN QUE TABLAS
-- =============================================================
SELECT
  c.relname AS tabla,
  c.relrowsecurity AS rls_habilitado,
  c.relforcerowsecurity AS rls_forzado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;


-- =============================================================
-- 6. FUNCIONES EXISTENTES
-- =============================================================
SELECT
  routine_name,
  routine_type,
  security_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;


-- =============================================================
-- 7. TRIGGERS EXISTENTES
-- =============================================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;


-- =============================================================
-- 8. RESTRICCIONES CHECK
-- =============================================================
SELECT
  conname AS constraint_name,
  conrelid::regclass AS tabla,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND contype = 'c'
ORDER BY conrelid::regclass::text;


-- =============================================================
-- 9. KEYS PRIMARIAS Y UNIQUE
-- =============================================================
SELECT
  tc.table_name,
  tc.constraint_type,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type;


-- =============================================================
-- 10. FOREIGN KEYS
-- =============================================================
SELECT
  tc.table_name AS tabla_origen,
  kcu.column_name AS columna_origen,
  ccu.table_name AS tabla_referencia,
  ccu.column_name AS columna_referencia
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;


-- =============================================================
-- 11. TABLAS QUE LA APP USA PERO NO EXISTEN EN DB
-- =============================================================
SELECT 'erp_auditoria' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_auditoria' AND schemaname = 'public')
UNION ALL
SELECT 'erp_avances' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_avances' AND schemaname = 'public')
UNION ALL
SELECT 'erp_licitaciones' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_licitaciones' AND schemaname = 'public')
UNION ALL
SELECT 'erp_notificaciones' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_notificaciones' AND schemaname = 'public')
UNION ALL
SELECT 'erp_incidentes' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_incidentes' AND schemaname = 'public')
UNION ALL
SELECT 'erp_pruebas_laboratorio' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_pruebas_laboratorio' AND schemaname = 'public')
UNION ALL
SELECT 'erp_no_conformidades' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_no_conformidades' AND schemaname = 'public')
UNION ALL
SELECT 'erp_liberaciones_partida' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_liberaciones_partida' AND schemaname = 'public')
UNION ALL
SELECT 'erp_ordenes_cambio' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_ordenes_cambio' AND schemaname = 'public')
UNION ALL
SELECT 'erp_muro_publicaciones' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_muro_publicaciones' AND schemaname = 'public')
UNION ALL
SELECT 'erp_checklist_calidad' AS tabla_faltante
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'erp_checklist_calidad' AND schemaname = 'public');


-- =============================================================
-- 12. POLITICAS CON ERRORES COMUNES
-- =============================================================
-- Politicas que referencian columnas que no existen
SELECT
  p.tablename,
  p.policyname,
  p.cmd,
  CASE
    WHEN p.qual LIKE '%empresa_id%'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = p.tablename
          AND column_name = 'empresa_id'
      )
      THEN 'ERROR: empresa_id no existe en ' || p.tablename
    WHEN p.qual LIKE '%empresa_id%'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = p.tablename
          AND column_name = 'empresa_id'
      )
      THEN 'OK: empresa_id existe en ' || p.tablename
    ELSE 'OTRO'
  END AS verificacion
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.qual LIKE '%empresa_id%'
ORDER BY p.tablename;


-- =============================================================
-- 13. VERIFICAR QUE auth.users EXISTE Y TIENE USUARIOS
-- =============================================================
SELECT
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;


-- =============================================================
-- 14. VERIFICAR profiles vs auth.users
-- =============================================================
SELECT
  'profiles sin auth.users' AS problema,
  p.id, p.nombre, p.rol
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL
UNION ALL
SELECT
  'auth.users sin profiles' AS problema,
  u.id, COALESCE(u.raw_user_meta_data->>'full_name', 'Sin nombre')::text, 'SIN PERFIL'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;


-- =============================================================
-- 15. POLITICAS QUE USAN auth.uid() CORRECTAMENTE
-- =============================================================
SELECT
  tablename,
  COUNT(*) AS total_politicas,
  string_agg(
    policyname || ' (' || cmd || ')',
    chr(10) ORDER BY cmd
  ) AS detalles
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;