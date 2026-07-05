# Notas de Deployment - CONSTRUSMART ERP

## Prerequisitos
- Node.js 18+
- Supabase project configurado
- Migraciones DB ejecutadas (047-053+)

## Build
```bash
npm run build
npm run typecheck
npm test
```

## Migraciones DB
Ejecutar en orden:
1. `supabase/migrations/000000000047_fix_nullable_columns.sql`
2. `supabase/migrations/000000000048_add_missing_indexes.sql`
3. `supabase/migrations/000000000049_add_foreign_keys.sql`
4. `supabase/migrations/000000000053_error_logging_table.sql`

## Variables de Entorno
```
VITE_SUPABASE_URL=<url>
VITE_SUPABASE_ANON_KEY=<key>
VITE_SUPABASE_SERVICE_ROLE_KEY=<service_key>
VITE_ADMIN_EMAIL=<admin@email.com>
```

## Post-Deployment
1. Verificar que la app carga correctamente
2. Revisar consola del navegador por errores
3. Verificar que la sincronización Supabase funciona
4. Probar navegación a todas las pantallas nuevas:
   - `/error-log` — Log de Errores
   - `/auditoria` — Auditoría de Cambios
5. Verificar Dashboard: cards de Integridad y Performance
6. Monitorear logs de errores en Supabase
