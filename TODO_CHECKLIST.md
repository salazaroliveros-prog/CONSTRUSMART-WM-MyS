# TODO_CHECKLIST.md — ✅ COMPLETADO

## Deuda Técnica
- [x] Eliminar `src/erp/screens/_tmp_presupuestos_patch.txt`
- [x] Refactorizar migraciones: Consolidar los archivos `fix_...` en una única migración
- [x] Limpiar `/src/functions/crm-dispatcher`: Eliminar bundles versionados
- [x] Fix ArrowUpDown import en BasePrecios.tsx
- [x] Agregar fechaActualizacion a interface InsumoBase

## Seguridad y Auditoría
- [x] Auditoría políticas RLS vs requerimientos de roles
- [x] Verificar credenciales expuestas en código fuente
- [x] RPC `verificar_rol_usuario` — ✅ EJECUTADO Y FUNCIONAL

## Calidad y Pruebas
- [x] Ampliar cobertura de pruebas unitarias

## Alineación Esquema DB vs Aplicación — ✅ 100%
- [x] `erp_empleados.proyecto_ids`
- [x] `erp_materiales.proyecto_ids` + `categoria`
- [x] `erp_movimientos.factura`
- [x] `erp_eventos_calendario.participantes`
- [x] `erp_bitacora.fotos` + `firma`
- [x] `erp_proyectos.factor_sobrecosto`
- [x] `erp_empleados.activo`
- [x] Tabla `erp_avances` + RLS
- [x] Tabla `erp_licitaciones` + RLS

## ✅ REFUERZO GENERAL (13 items completados)
- [x] **CRIT-01**: Sanitización XSS en export.ts
- [x] **CRIT-02**: Path traversal protection en storage.ts
- [x] **CRIT-03**: Cifrado AES-GCM en ChecklistCalidad + fotos/firmas a Supabase Storage
- [x] **CRIT-04**: Verificación anon key (solo anon, no service_role)
- [x] **CRIT-05**: RPC verificar_rol_usuario ejecutado en Supabase
- [x] **CODE-01**: Limpieza de variables muertas
- [x] **CODE-02**: Import React innecesario eliminado
- [x] **CONF-02**: Script typecheck agregado
- [x] **CONF-03**: Engines configurado
- [x] **DEPLOY-03**: Push a GitHub (commit `bb3165e`)
- [x] **DB-01/02**: Alineación types ↔ DB completada

## 🔧 ERRORES MIGRACIONES CORREGIDOS — ✅ TODOS
- [x] `erp_auditoria_select` already exists → DROP IF EXISTS
- [x] `logs_sistema_insert` already exists → Schema `public.` explícito
- [x] `fn_force_administrator_unique` → DROP ... CASCADE
- [x] `proyecto_id` no existe → cambiado a `proyecto_ids` array
- [x] Seed data empleados corregido con ARRAY

## 🎯 MEJORA CONTINUA (no críticos)
- [ ] **REND-01**: Listener leaks (useEffect cleanup)
- [ ] **REND-02**: useMemo/React.memo en Charts, AvanceObraModal, CubicacionAutomatica
- [ ] **CODE-03**: Validación Zod en componentes críticos
- [ ] **CONF-01**: Actualizar dependencias (jsdom, vitest, react-signature-canvas)
- [ ] **DEPLOY-02**: Configurar secrets GitHub