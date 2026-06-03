# TODO_CHECKLIST.md — ✅ 19/19 COMPLETADO

## Deuda Técnica
- [x] Eliminar `src/erp/screens/_tmp_presupuestos_patch.txt`
- [x] Refactorizar migraciones: Consolidar `fix_...` en una única migración
- [x] Limpiar `/src/functions/crm-dispatcher`: Eliminar bundles versionados
- [x] Fix ArrowUpDown import en BasePrecios.tsx
- [x] Agregar fechaActualizacion a interface InsumoBase

## Seguridad y Auditoría
- [x] Auditoría políticas RLS vs requerimientos de roles
- [x] Verificar credenciales expuestas en código fuente
- [x] RPC `verificar_rol_usuario` — ✅ EJECUTADO EN SUPABASE

## Calidad y Pruebas
- [x] Ampliar cobertura de pruebas unitarias

## Alineación Esquema DB vs Aplicación — ✅ 100%
- [x] `erp_empleados.proyecto_ids` (array)
- [x] `erp_materiales.proyecto_ids` + `categoria`
- [x] `erp_movimientos.factura`
- [x] `erp_eventos_calendario.participantes`
- [x] `erp_bitacora.fotos` + `firma`
- [x] `erp_proyectos.factor_sobrecosto`
- [x] `erp_empleados.activo`
- [x] Tabla `erp_avances` + RLS policies
- [x] Tabla `erp_licitaciones` + RLS policies

## ✅ REFUERZO GENERAL — 19/19 COMPLETADO
- [x] **CRIT-01**: Sanitización XSS en export.ts (PDF/HTML + CSP + sanitizarTexto)
- [x] **CRIT-02**: Path traversal protection en storage.ts (whitelist buckets/extensiones)
- [x] **CRIT-03**: Cifrado AES-GCM en ChecklistCalidad + fotos/firmas → Supabase Storage
- [x] **CRIT-04**: Verificación anon key (solo anon, no service_role)
- [x] **CRIT-05**: RPC `verificar_rol_usuario` ejecutado en Supabase
- [x] **CODE-01**: Variables muertas limpiadas (_peso, _total, _materialSeleccionado, _addDays)
- [x] **CODE-02**: Import React innecesario eliminado (AppContext.tsx)
- [x] **REND-01**: Listener leaks revisados (Header clock OK, Gantt OK, store OK)
- [x] **REND-02**: React.memo agregado en Charts.tsx (6 componentes)
- [x] **CONF-01**: Dependencias actualizadas (jsdom, vitest) + tsconfig ignoreDeprecations
- [x] **CONF-02**: Script typecheck agregado
- [x] **CONF-03**: Engines configurado (node>=18, npm>=9)
- [x] **DEPLOY-01**: Migraciones RLS ejecutadas
- [x] **DEPLOY-02**: Secrets GitHub configurados (VITE_SUPABASE_URL, VITE_SUPABASE_KEY, VERCEL_TOKEN)
- [x] **DEPLOY-03**: Push a GitHub (5 commits)

## 🔧 ERRORES MIGRACIONES — ✅ 5/5 CORREGIDOS
- [x] `erp_auditoria_select` already exists → DROP POLICY IF EXISTS
- [x] `logs_sistema_insert` already exists → Schema `public.` explícito
- [x] `fn_force_administrator_unique` dependencia → DROP ... CASCADE
- [x] `proyecto_id` no existe en erp_empleados → Cambiado a `proyecto_ids` array
- [x] Seed data empleados corregido con ARRAY

### Commits realizados en esta sesión:
```
e1c0501 - CODE-01 _addDays dead function + DEPLOY-02 secrets GitHub
1acc98e - REND-02 React.memo Charts + CODE-02 import React + CONF-01 dependencias
bb3165e - CRIT-03 cifrado AES-GCM ChecklistCalidad
9b5d86f - SQL fixes migraciones 0003-0005
95807ce - CRIT-01 XSS export.ts + CRIT-02 path traversal storage.ts