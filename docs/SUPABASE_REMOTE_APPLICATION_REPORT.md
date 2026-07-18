# Reporte de Aplicación Remota Supabase

## Fecha
17/7/2026, 12:32 p.m.

## Commit GitHub
- Hash: `7096dad`
- Rama: `main`
- CI/CD: éxito

## Vercel
- URL producción: https://construsmart-wm2026.vercel.app
- Estado: Ready
- Variables de entorno: 6 configuradas correctamente

## Supabase
- Proyecto: `neygzluxugodiwcuctbj`
- URL configuración: `https://neygzluxugodiwcuctbj.supabase.co`
- IPv4 resuelta: `172.64.149.246`

## Migration Creada
`supabase/migrations/000000000121_fix_missing_columns_and_rls.sql`

### Correcciones incluidas
1. Columnas faltantes en `erp_proyectos` (29 columnas)
2. Columnas faltantes en `erp_notificaciones` (3 columnas)
3. RLS faltante en `erp_cotizaciones_negocio`, `erp_backup_config`, `erp_monitoring_config`
4. Limpieza de políticas RLS duplicadas (corregida referencia `user_id` → `id`)

## Error de Conexión
Comando: `npx supabase db remote changes --db-url postgresql://...`

Error: `dial tcp 172.64.149.246:5432: i/o timeout`

### Causa
Timeout de conexión IPv4. La IP del proyecto está actualmente bloqueada o no accesible.

## Acción Requerida
Aplicar la migration manualmente desde Supabase Dashboard → SQL Editor.

### Pasos
1. Ir a https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/editor
2. Abrir SQL Editor
3. Ejecutar contenido de `supabase/migrations/000000000121_fix_missing_columns_and_rls.sql`
4. Verificar con `SELECT * FROM pg_policies WHERE tablename IN ('erp_cotizaciones_negocio', 'erp_backup_config', 'erp_monitoring_config');`

## Estado
Migración lista, conexión remota bloqueada por timeout IPv4.