# Guía de Verificación RLS (Row Level Security) - CONSTRUSMART ERP

## Overview

RLS (Row Level Security) está habilitado en todas las tablas operacionales para garantizar que los usuarios solo puedan acceder a sus propios datos.

---

## Verificación Manual vía SQL

### 1. Verificar que RLS está habilitado en todas las tablas

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'erp_%'
ORDER BY tablename;
```

**Esperado**: Todas las tablas deben mostrar `rls_enabled = true`

---

### 2. Verificar políticas por tabla

```sql
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
  AND tablename LIKE 'erp_%'
ORDER BY tablename, policyname;
```

**Esperado**: Cada tabla debe tener políticas para SELECT, INSERT, UPDATE, DELETE

---

### 3. Verificar políticas específicas por tipo de usuario

#### 3.1 Políticas para usuarios autenticados (auth.uid())

```sql
-- Verificar políticas que usan auth.uid()
SELECT 
  tablename,
  policyname,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'erp_%'
  AND (qual LIKE '%auth.uid%' OR with_check LIKE '%auth.uid%');
```

**Esperado**: Tablas con datos de usuario deben filtrar por `auth.uid()`

#### 3.2 Políticas para admin

```sql
-- Verificar políticas que usan admin_email
SELECT 
  tablename,
  policyname,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'erp_%'
  AND (qual LIKE '%admin_email%' OR with_check LIKE '%admin_email%');
```

**Esperado**: Tablas de configuración deben verificar admin email

---

## Verificación de Tablas Críticas

### Tablas de Usuario (deben filtrar por auth.uid())

```sql
-- Proyectos
SELECT policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'erp_proyectos';

-- Movimientos
SELECT policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'erp_movimientos';

-- Ordenes de compra
SELECT policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'erp_ordenes_compra';
```

**Esperado**: Policies con `auth.uid() = user_id` o similar

---

### Tablas de Referencia (lectura pública)

```sql
-- Departamentos
SELECT policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'erp_departamentos_gt';

-- Municipios
SELECT policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'erp_municipios_gt';

-- Insumos base
SELECT policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'erp_insumos_base';
```

**Esperado**: Policies con `USING (true)` para SELECT

---

### Tablas de Configuración (solo admin)

```sql
-- Configuración
SELECT policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'erp_configuracion';

-- Reglas factores
SELECT policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'erp_reglas_factores';
```

**Esperado**: Policies que verifican admin email

---

## Pruebas de Acceso

### Test 1: Usuario no autenticado no puede leer datos

```sql
-- Desconectar usuario (set role to anon)
SET ROLE anon;

-- Intentar leer proyectos
SELECT * FROM erp_proyectos LIMIT 1;

-- Esperado: ERROR: permission denied for table erp_proyectos
```

### Test 2: Usuario autenticado solo lee sus datos

```sql
-- Simular usuario autenticado (set role a authenticated)
SET ROLE authenticated;

-- Intentar leer todos los proyectos
SELECT * FROM erp_proyectos;

-- Esperado: Solo filas donde user_id = auth.uid()
```

### Test 3: Admin puede leer todo

```sql
-- Verificar que admin tiene acceso completo
-- Esto requiere ejecutar como usuario con admin_email en erp_configuracion

SELECT * FROM erp_configuracion;

-- Esperado: Todas las filas
```

---

## Verificación via Supabase Dashboard

### Método 1: Table Editor

1. Ir a Supabase Dashboard → Table Editor
2. Seleccionar tabla `erp_proyectos`
3. Ver icono de candado 🔒 al lado del nombre de la tabla
4. Click en el candado → "Policies"
5. Verificar que existan políticas para SELECT, INSERT, UPDATE, DELETE

### Método 2: SQL Editor

1. Ir a SQL Editor
2. Ejecutar queries de verificación anteriores
3. Verificar resultados

---

## Checklist de Verificación RLS

### Estado RLS:
- [ ] RLS habilitado en todas las tablas `erp_*`
- [ ] Cada tabla tiene políticas SELECT
- [ ] Cada tabla tiene políticas INSERT (excepto tablas de solo lectura)
- [ ] Cada tabla tiene políticas UPDATE (excepto tablas de solo lectura)
- [ ] Cada tabla tiene políticas DELETE (excepto tablas de solo lectura)

### Políticas de Usuario:
- [ ] Tablas de usuario filtran por `auth.uid()`
- [ ] Usuarios no pueden ver datos de otros usuarios
- [ ] Usuarios no pueden modificar datos de otros usuarios

### Políticas de Referencia:
- [ ] Tablas de referencia (departamentos, municipios) tienen lectura pública
- [ ] Tablas de referencia solo admin puede insertar/actualizar/eliminar

### Políticas de Configuración:
- [ ] Tablas de configuración solo accesibles por admin
- [ ] Verificación usa `erp_configuracion.admin_email`

---

## Problemas Comunes y Soluciones

### Problema: "permission denied" para operaciones legítimas

**Causa**: Policy demasiado restrictiva  
**Solución**: 
```sql
-- Revisar la policy específica
SELECT * FROM pg_policies WHERE tablename = 'nombre_tabla';

-- Ajustar qual o with_check
ALTER POLICY "nombre_policy" ON nombre_tabla
USING (condición_correcta);
```

### Problema: Usuario puede ver datos de otros usuarios

**Causa**: Policy no filtra por user_id  
**Solución**:
```sql
-- Asegurar que la policy use auth.uid()
ALTER POLICY "Usuarios pueden ver sus proyectos" ON erp_proyectos
USING (user_id = auth.uid());
```

### Problema: No se pueden insertar datos

**Causa**: Policy WITH CHECK demasiado restrictiva  
**Solución**:
```sql
-- Asegurar que WITH CHECK permita inserción
ALTER POLICY "Usuarios pueden insertar proyectos" ON erp_proyectos
WITH CHECK (user_id = auth.uid());
```

---

## Scripts de Verificación Automatizada

### Script completo de verificación:

```sql
-- Verificar RLS en todas las tablas
DO $$
DECLARE
  table_record RECORD;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename LIKE 'erp_%'
  LOOP
    -- Verificar RLS habilitado
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = table_record.tablename;
    
    -- Contar políticas
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = table_record.tablename;
    
    -- Reportar
    IF rls_enabled AND policy_count > 0 THEN
      RAISE NOTICE '✅ %s: RLS enabled, %d policies', 
        table_record.tablename, policy_count;
    ELSIF rls_enabled THEN
      RAISE NOTICE '⚠️  %s: RLS enabled but NO policies', 
        table_record.tablename;
    ELSE
      RAISE NOTICE '❌ %s: RLS NOT enabled', 
        table_record.tablename;
    END IF;
  END LOOP;
END $$;
```

Ejecutar este script en SQL Editor para verificar todas las tablas de una vez.

---

## Recomendaciones de Seguridad

### Best Practices:
1. ✅ Siempre usar RLS en tablas con datos de usuario
2. ✅ Usar `auth.uid()` para identificar usuario actual
3. ✅ Usar funciones de verificación de admin para tablas de configuración
4. ✅ Probar políticas con diferentes roles de usuario
5. ✅ Revisar logs de errores de permisos regularmente

### Monitoreo:
```sql
-- Verificar errores de permisos recientes
SELECT *
FROM pg_stat_statements
WHERE query LIKE '%permission denied%'
ORDER BY calls DESC
LIMIT 10;
```

---

**Última actualización**: 2026-07-19
**Total tablas con RLS**: ~60 tablas `erp_*`
**Estado**: Todas las tablas deben tener RLS habilitado
