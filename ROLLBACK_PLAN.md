# Plan de Rollback - CONSTRUSMART ERP

## Rollback de Código
```bash
git revert <commit-hash>
git push origin main
```

## Rollback de Migraciones DB
```sql
-- Migration 047: Revertir NOT NULL
ALTER TABLE erp_activos_herramienta ALTER COLUMN id DROP NOT NULL;
-- (repetir para cada tabla afectada)

-- Migration 048: Eliminar índices
DROP INDEX IF EXISTS idx_erp_movimientos_proyecto_id;
-- (repetir para cada índice)

-- Migration 049: Eliminar FKs
ALTER TABLE erp_movimientos DROP CONSTRAINT IF EXISTS fk_movimientos_proyecto;
-- (repetir para cada FK)

-- Migration 053: Eliminar tabla de error logging
DROP TABLE IF EXISTS erp_error_log CASCADE;
DROP FUNCTION IF EXISTS log_error CASCADE;
DROP FUNCTION IF EXISTS resolve_error CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_error_logs CASCADE;
```

## Rollback de UI
1. Remover `auditoria` de View type en store.tsx
2. Remover lazy import de Auditoria en AppLayout.tsx
3. Remover entrada de sidebar para auditoría
4. Remover cards de Integridad/Performance de Dashboard.tsx
5. Revertir cambios en ErrorLog.tsx al estado anterior

## Verificación Post-Rollback
1. Build exitoso (npm run build)
2. Tests pasan (npm test)
3. Navegación funciona sin errores
4. Sincronización Supabase operativa
