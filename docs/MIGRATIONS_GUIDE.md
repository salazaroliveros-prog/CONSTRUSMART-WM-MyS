# Guía de Migraciones de Base de Datos - CONSTRUSMART ERP

## Overview

El proyecto tiene **104 migraciones SQL** que deben aplicarse para crear la estructura completa de la base de datos.

## Método 1: Aplicar Migraciones vía Supabase CLI (Recomendado)

### Prerrequisitos:
1. Instalar Supabase CLI:
```bash
npm install -g supabase
# o
brew install supabase/tap/supabase
```

2. Autenticar con Supabase:
```bash
supabase login
```

### Pasos:

1. **Conectar al proyecto**:
```bash
cd "C:\Users\wilso\Documents\APPS\ERP EMPRESARIAL CONSTRUSMART -WM FAMOUS\CONSTRUSMART"
supabase link --project-ref neygzluxugodiwcuctbj
```

2. **Aplicar todas las migraciones**:
```bash
supabase db push
```

Esto aplicará todas las migraciones en orden cronológico desde `supabase/migrations/`.

3. **Verificar estado**:
```bash
supabase migration list
```

Deberías ver todas las migraciones marcadas como `applied`.

---

## Método 2: Aplicar Migraciones Manualmente vía SQL Editor

### Prerrequisitos:
- Service Role Key (ver guía de variables de entorno)
- Supabase Dashboard access

### Pasos:

1. **Ir a Supabase Dashboard**:
   - Proyecto: `neygzluxugodiwcuctbj`
   - Section: SQL Editor

2. **Aplicar migraciones en orden**:
   - Abrir cada archivo en `supabase/migrations/`
   - Copiar el contenido SQL
   - Pegar en SQL Editor
   - Ejecutar (Run)
   - Repetir para cada migración

**Orden recomendado** (por grupos):
1. **Base Schema (001-010)**: Tablas base y políticas iniciales
2. **RLS Fixes (011-024)**: Correcciones de políticas de seguridad
3. **Motor Cálculo Fase 1 (025-030)**: Geografía, dosificaciones, subtipologías
4. **Motor Cálculo Fase 2 (031-039)**: Acero, movimiento tierra, climáticos
5. **Motor Cálculo Fase 3 (032-034)**: Pavimentos, redes, muros
6. **Motor Cálculo Fase 4 (036-043)**: Normativa, escalas, estacionalidad
7. **Motor Cálculo Fase 5 (035, 039)**: Historial, reglas factores
8. **Security Fixes (045-052)**: Correcciones de seguridad
9. **Monitoring (053-055)**: Error logging, funciones de monitoreo
10. **Audit Triggers (050-062)**: Triggers de auditoría
11. **Schema Alignment (063-065)**: Alineación schema código-BD
12. **Production Phase 3 (067-069)**: Configuración producción
13. **Tablas Adicionales (070-079)**: Solicitudes, archivos, weather
14. **Integrity & Performance (075-098)**: Checks, índices, monitoreo
15. **Tier 1-3 (0100-0102)**: Migraciones TIER completas
16. **Cleanup (20260706-20260713)**: Limpieza de tablas legacy
17. **Geographic Data (20260719)**: ⚠️ **NUEVA** - Departamentos y municipios

---

## Método 3: Aplicar Migraciones vía psql (CLI PostgreSQL)

### Prerrequisitos:
- PostgreSQL client instalado
- Connection string de BD

### Pasos:

1. **Conectar a la BD**:
```bash
psql "postgresql://postgres:[password]@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres"
```

2. **Aplicar migración individual**:
```sql
\i supabase/migrations/000000000001_full_schema_base_and_policies.sql
```

3. **O aplicar todas en batch**:
```bash
for file in supabase/migrations/*.sql; do
  psql "postgresql://postgres:[password]@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres" -f "$file"
done
```

---

## Seed Data (Datos Iniciales)

Después de aplicar las migraciones, aplicar los datos iniciales:

### 1. Departamentos de Guatemala:
```bash
# En SQL Editor de Supabase
\i supabase/seed_data/departamentos_gt.sql
```

### 2. Municipios de Guatemala:
```bash
# En SQL Editor de Supabase
\i supabase/seed_data/municipios_gt.sql
```

---

## Verificación

### Verificar que todas las tablas existen:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver ~60 tablas con prefijo `erp_`.

### Verificar que RLS está habilitado:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'erp_%';
```

Todas deben mostrar `rowssecurity = true`.

### Verificar que realtime está habilitado:
```sql
SELECT * 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

Deberías ver las tablas críticas listadas.

---

## Troubleshooting

### Error: "relation already exists"
**Causa**: La migración ya fue aplicada  
**Solución**: Verificar con `supabase migration list` y saltar las ya aplicadas

### Error: "permission denied"
**Causa**: No tienes service role key  
**Solución**: Usar service role key en lugar de anon key

### Error: "foreign key violation"
**Causa**: Orden incorrecto de migraciones  
**Solución**: Aplicar en orden cronológico (usar Método 1)

### Error: "function does not exist"
**Causa**: La función RPC no fue creada en migración previa  
**Solución**: Verificar que la migración que crea la función se aplicó primero

---

## Rollback

Si algo sale mal, puedes hacer rollback:

### Via Supabase CLI:
```bash
supabase migration revert
```

### Manual:
1. Ir a SQL Editor
2. Ejecutar `DROP TABLE` para tablas creadas
3. Replicar desde migración anterior

---

## Verificación Post-Migración

### Ejecutar script de verificación:
```sql
-- Verificar tablas críticas
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'erp_%';
-- Esperado: ~60 tablas

-- Verificar departamentos
SELECT COUNT(*) as dept_count 
FROM erp_departamentos_gt;
-- Esperado: 22 departamentos

-- Verificar municipios
SELECT COUNT(*) as muni_count 
FROM erp_municipios_gt;
-- Esperado: ~100 municipios (seed initial)
```

---

## Checklist Post-Migración

- [ ] Todas las 104 migraciones aplicadas
- [ ] ~60 tablas `erp_*` creadas
- [ ] RLS habilitado en todas las tablas
- [ ] Realtime habilitado en tablas críticas
- [ ] 22 departamentos insertados
- [ ] ~100 municipios insertados
- [ ] No errores en SQL Editor logs
- [ ] App local conecta a BD correctamente

---

**Última actualización**: 2026-07-19
**Total migraciones**: 104
**Nueva migración**: 20260719_add_geographic_data.sql
