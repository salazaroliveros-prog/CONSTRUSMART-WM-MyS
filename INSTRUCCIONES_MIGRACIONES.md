# Instrucciones para Ejecutar Migraciones Pendientes en Supabase

## Estado Actual
- **Proyecto**: neygzluxugodiwcuctbj.supabase.co
- **Tablas existentes**: 5/11
- **Tablas faltantes**: 6/11
- **Funciones RPC**: 11/11 ✅ (todas ya existen)

## Archivo SQL
El archivo SQL corregido está en:
```
supabase-migrations-pendientes.sql
```

## Instrucciones Paso a Paso

### Opción 1: SQL Editor de Supabase (Recomendada)

1. **Acceder a Supabase**
   - Ve a https://app.supabase.com
   - Inicia sesión
   - Selecciona tu proyecto: `construsmart-wm2026`

2. **Abrir SQL Editor**
   - Navega a **SQL Editor** en el menú lateral izquierdo
   - Haz clic en **"New query"**

3. **Ejecutar migraciones**
   - Copia todo el contenido del archivo `supabase-migrations-pendientes.sql`
   - Pega en el SQL Editor
   - Haz clic en **"Run"** (o presiona Ctrl+Enter)

4. **Verificar resultados**
   - Revisa que no haya errores en la consola
   - Deberías ver mensajes de "SUCCESS" para cada CREATE TABLE

### Opción 2: Ejecutar script de verificación

Después de ejecutar las migraciones, puedes verificar que todo esté correcto:

```bash
node verify-post-migration.cjs
```

Este script te mostrará:
- ✅ Tablas creadas correctamente
- ❌ Tablas con problemas (si las hay)

## Tablas que se Crearán

1. **erp_reglas_factores** - Sistema de reglas de factores jerárquico
2. **erp_historial_aplicacion_reglas** - Historial de aplicación de reglas
3. **erp_snapshots_estado_calculo** - Snapshots de estado de cálculos
4. **erp_cumplimiento_normativo** - Cumplimiento de normativa departamental
5. **erp_aplicacion_escalas** - Aplicación de escalas de producción
6. **erp_ajustes_estacionales_actividad** - Ajustes estacionales por actividad

## Elementos Adicionales Incluidos

- ✅ Índices para optimización
- ✅ Triggers para actualizar `updated_at`
- ✅ RLS policies para seguridad
- ✅ Seed data inicial (opcional, para erp_reglas_factores)

## Solución de Problemas

### Error: "relation does not exist"
- Solución: Ejecuta el SQL en el orden correcto (tal como está en el archivo)

### Error: "column does not exist"
- Solución: Verifica que las tablas externas existan antes de crear las tablas con referencias

### Error: "policy already exists"
- Solución: El SQL ya incluye DROP POLICY IF EXISTS para evitar este error

### Error: "duplicate key value violates unique constraint"
- Solución: El seed data incluye WHERE NOT EXISTS para evitar duplicados

## Próximos Pasos

Después de ejecutar las migraciones exitosamente:

1. ✅ Ejecutar `node verify-post-migration.cjs` para verificar
2. ✅ Probar la aplicación localmente
3. ✅ Verificar que los nuevos servicios funcionen correctamente
4. ✅ Commit de los archivos temporales (opcional)

## Archivos Temporales Pueden Eliminarse

Después de completar las migraciones, puedes eliminar:
- `verify-supabase.cjs`
- `generate-sql-supabase.cjs`
- `verify-post-migration.cjs`
- `supabase-migrations-pendientes.sql` (después de ejecutar)

## Soporte

Si encuentras errores durante la migración:
1. Copia el mensaje de error completo
2. Revisa el SQL correspondiente en el archivo
3. Verifica que las tablas externas existan
4. Ejecuta las migraciones en bloques más pequeños si es necesario