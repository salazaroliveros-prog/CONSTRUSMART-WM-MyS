# TODO_CHECKLIST.md — ✅ 19/19 + PWA COMPLETADO

## Deuda Técnica
- [x] Eliminar `src/erp/screens/_tmp_presupuestos_patch.txt`
- [x] Refactorizar migraciones: Consolidar `fix_...` en una única migración
- [x] Limpiar `/src/functions/crm-dispatcher`: Eliminar bundles versionados
- [x] Fix ArrowUpDown import en BasePrecios.tsx
- [x] Agregar fechaActualizacion a interface InsumoBase

## Seguridad y Auditoría
- [x] Auditoría políticas RLS vs requerimientos de roles
- [x] Verificar credenciales expuestas en código fuente
- [x] RPC `verificar_rol_usuario` — EJECUTADO EN SUPABASE

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
- [x] Tabla `erp_avances` + RLS
- [x] Tabla `erp_licitaciones` + RLS

## ✅ REFUERZO GENERAL — 19/19 COMPLETADO
- [x] **CRIT-01**: Sanitización XSS en export.ts (PDF/HTML + CSP + sanitizarTexto)
- [x] **CRIT-02**: Path traversal protection en storage.ts (whitelist + extensiones)
- [x] **CRIT-03**: Cifrado AES-GCM en ChecklistCalidad + fotos/firmas a Supabase Storage
- [x] **CRIT-04**: Verificación anon key (solo anon, no service_role)
- [x] **CRIT-05**: RPC `verificar_rol_usuario` ejecutado en Supabase
- [x] **CODE-01**: Variables muertas limpiadas (_addDays, _peso, _total, _materialSeleccionado)
- [x] **CODE-02**: Import React innecesario eliminado (AppContext.tsx)
- [x] **REND-01**: Listener leaks revisados (Header clock OK, Gantt OK, store OK)
- [x] **REND-02**: React.memo agregado en Charts.tsx (6 componentes)
- [x] **CONF-01**: Dependencias actualizadas (jsdom, vitest) + tsconfig ignoreDeprecations
- [x] **CONF-02**: Script typecheck agregado
- [x] **CONF-03**: Engines configurado (node>=18, npm>=9)
- [x] **DEPLOY-01**: Migraciones RLS ejecutadas
- [x] **DEPLOY-02**: Secrets GitHub configurados (VITE_SUPABASE_URL, VITE_SUPABASE_KEY, VERCEL_TOKEN)
- [x] **DEPLOY-03**: Push a GitHub (10 commits)

## 🔧 ERRORES ADICIONALES CORREGIDOS
- [x] RLS recursion → Error 500 en todas las tablas → Función helper `get_current_user_role()` SECURITY DEFINER
- [x] React error #426 (too many re-renders) → `materialesRef` en vez de state en `verificarStockCritico`
- [x] PKCE code exchange → sessionStorage guard + limpiar URL después del intercambio
- [x] Transiciones suaves → Componente `FadeView` con fade-in de 200ms
- [x] Charts.tsx syntax error → React.memo con `});` correcto (6 componentes)

## 📱 PWA — INSTALABLE, OFFLINE Y REAL-TIME
- [x] **index.html**: `<link rel="manifest">` + meta tags mobile (apple-mobile-web-app, viewport)
- [x] **manifest.json**: Iconos 192/512 maskable, scope, categories, shortcuts
- [x] **sw.js**: Cache First para assets Vite, Network First para HTML, offline fallback
- [x] **offline.html**: Página de fallback con funcionalidades offline disponibles
- [x] **Real-time sync**: Mutation queue en store.tsx + polling RPC cada 30s

### Commits de la sesión:
```
9f3b443 - fix: React #426 render loop - materialesRef
0ab304f - feat: PWA completa - manifest, sw.js offline, offline.html, meta tags
62c6445 - fix: PKCE, React #426 initial, FadeView transitions
e1f3738 - fix: RLS recursion error 500
b88d2e0 - fix: React.memo syntax in Charts.tsx
cb7f5b5 - docs: TODO_CHECKLIST.md 19/19 completado
e1c0501 - fix: CODE-01 + DEPLOY-02 secrets
1acc98e - fix: REND-02 React.memo + CODE-02 + CONF-01
bb3165e - fix: CRIT-03 cifrado AES-GCM
9b5d86f - fix: SQL fixes migraciones
95807ce - fix: CRIT-01 XSS + CRIT-02 path traversal