# TODO_CHECKLIST.md — ✅ COMPLETADO

## Deuda Técnica
- [x] Eliminar `src/erp/screens/_tmp_presupuestos_patch.txt` y asegurar que la lógica esté integrada correctamente.
- [x] Refactorizar migraciones: Consolidar los archivos `fix_...` en una única migración limpia para evitar conflictos futuros.
- [x] Limpiar `/src/functions/crm-dispatcher`: Eliminar bundles versionados y establecer un proceso de build automatizado en el CI/CD.
- [x] Fix ArrowUpDown import en BasePrecios.tsx (error crítico)
- [x] Agregar fechaActualizacion a interface InsumoBase

## Seguridad y Auditoría
- [x] Realizar una auditoría de las políticas RLS actuales contra los requerimientos de acceso de roles definidos en `rpc_verificar_rol_usuario.sql`.
- [x] Verificar que no existan credenciales o llaves API expuestas en el código fuente.
- [x] RPC `verificar_rol_usuario` — ✅ EJECUTADO Y FUNCIONAL

## Calidad y Pruebas
- [x] Ampliar la cobertura de pruebas unitarias en `src/erp/__tests__` para cubrir cálculos críticos de presupuestos y movimientos de inventario.

## Alineación Esquema Base de Datos vs Aplicación — ✅ 100% COMPLETADO
- [x] Corregir `erp_empleados` (soportar `proyecto_ids` array).
- [x] Agregar `proyecto_ids` a `erp_materiales`.
- [x] Agregar `factura` a `erp_movimientos`.
- [x] Agregar `participantes` a `erp_eventos_calendario`.
- [x] Agregar `fotos` y `firma` a `erp_bitacora`.
- [x] Agregar `factor_sobrecosto` (jsonb) a `erp_proyectos`.
- [x] Agregar `activo` a `erp_empleados`
- [x] Agregar `categoria` a `erp_materiales`
- [x] Crear tabla `erp_avances` + RLS policies
- [x] Crear tabla `erp_licitaciones` + RLS policies

## ✅ REFUERZO GENERAL DE SEGURIDAD Y CALIDAD
- [x] **CRIT-01**: Sanitización XSS en export.ts (PDF/HTML generation)
- [x] **CRIT-02**: Protección path traversal en storage.ts (whitelist buckets + extensiones)
- [x] **CRIT-04**: Verificación anon key (solo anon, no service_role)
- [x] **CODE-01**: Limpieza de variables muertas
- [x] **CODE-02**: Eliminar import React innecesario (AppContext.tsx)
- [x] **CONF-02**: Agregar script `typecheck` en package.json
- [x] **CONF-03**: Agregar `engines` en package.json
- [x] **DEPLOY-03**: Push a GitHub (`git push origin main`)

## 🔧 ERRORES MIGRACIONES CORREGIDOS — ✅ TODOS RESUELTOS
- [x] Error: `erp_auditoria_select` already exists → DROP POLICY IF EXISTS
- [x] Error: `logs_sistema_insert` already exists → Schema `public.` explícito
- [x] Error: `fn_force_administrator_unique` dependencia → DROP ... CASCADE
- [x] Error: `proyecto_id` no existe en erp_empleados → Cambiar a `proyecto_ids` array
- [x] RPC `verificar_rol_usuario` ejecutado en Supabase
- [x] Función `fn_force_administrator_unique` + trigger ejecutados
- [x] Seed data de empleados corregido con `proyecto_ids`

## 🎯 PENDIENTES — MEJORA CONTINUA (no críticos)
- [ ] **CRIT-03**: Cifrar datos sensibles en localStorage (ChecklistCalidad)
- [ ] **REND-01**: Revisar listener leaks en componentes (useEffect cleanup)
- [ ] **REND-02**: Agregar useMemo/React.memo en Charts, AvanceObraModal, CubicacionAutomatica
- [ ] **CODE-03**: Agregar validación Zod en datos entrantes de componentes críticos
- [ ] **CONF-01**: Actualizar dependencias desactualizadas (jsdom, vitest, react-signature-canvas, web-ifc)
- [ ] **DEPLOY-01**: Ejecutar migraciones RLS restantes en Supabase (si aplica)
- [ ] **DEPLOY-02**: Configurar secrets en GitHub (VITE_SUPABASE_URL, VITE_SUPABASE_KEY, VERCEL_TOKEN)