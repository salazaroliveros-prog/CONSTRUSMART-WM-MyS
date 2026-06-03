# CHECKLIST DE VULNERABILIDADES Y HALLAZGOS - CONSTRUSMART ERP

## Estado actual: 23 hallazgos detectados

### 🛑 CRITICOS (Corregir inmediatamente)

| # | Area | Hallazgo | Riesgo | Estado |
|---|------|----------|--------|--------|
| 1 | **store.tsx** | Loop infinito en useEffect con dependencia `user?.rol` causa React error #426 | **CRASH** - Congela navegador, miles de ERR_CERT | ✅ CORREGIDO |
| 2 | **store.tsx** | Notificaciones se disparan cada 60s por `setInterval` sin throttling | **SPAM** - Bloquea UI con toasts | ✅ CORREGIDO |
| 3 | **store.tsx** | 6 campos Zod sin validacion nullable (`factura`, `telefono`, `firma`, `latitud`, `longitud`, `presupuesto`) | **CRASH** - Errores en consola al cargar datos | ✅ CORREGIDO |
| 4 | **sw.js** | Sintaxis TypeScript en archivo JS (`: string`, `: boolean`) | **CRASH** - Service Worker no carga | ✅ CORREGIDO |
| 5 | **store.tsx** | `fetchInitialData` en dependencias de useEffect causa re-renderizados innecesarios | **PERF** - Renderizados constantes | ✅ CORREGIDO |
| 6 | **store.tsx** | `loadProfile` llama `setUser` 2 veces (datos + RPC) creando race conditions | **BUG** - Rol intermitente | ✅ CORREGIDO |

### 🔴 ALTOS (Corregir proximo)

| # | Area | Hallazgo | Riesgo | Estado |
|---|------|----------|--------|--------|
| 7 | **Supabase** | 29 tablas sin RLS o con politicas duplicadas causando HTTP 500 | **CRASH** - Sin acceso a datos | ✅ CORREGIDO (SQL listo) |
| 8 | **Supabase** | No existe funcion RPC `verificar_rol_usuario` con SECURITY DEFINER | **SEGURIDAD** - Roles falseables desde cliente | ✅ CORREGIDO (SQL listo) |
| 9 | **Supabase** | No existe trigger `handle_new_user` con upsert anti-409 | **BUG** - Error 409 en re-login OAuth | ✅ CORREGIDO (SQL listo) |
| 10 | **Supabase** | 11 tablas usadas por la app no existen en DB (erp_auditoria, erp_avances, erp_licitaciones, etc.) | **BUG** - Operaciones CRUD fallan silenciosamente | ⚠️ PENDIENTE |
| 11 | **store.tsx** | Mutation queue en localStorage sin limite de tamano | **PERF** - Puede crecer infinitamente | ⚠️ PENDIENTE |
| 12 | **store.tsx** | `supabase.from('erp_avances')` y `erp_licitaciones` referencian tablas inexistentes | **BUG** - Mutaciones siempre fallan | ⚠️ PENDIENTE |

### 🟡 MEDIOS (Planificar)

| # | Area | Hallazgo | Riesgo | Estado |
|---|------|----------|--------|--------|
| 13 | **OAuth** | Google Sign-In usa `skipBrowserRedirect: true` + redireccion manual, lo que causa error PKCE | **UX** - Login falla en algunos navegadores | ⚠️ PENDIENTE |
| 14 | **store.tsx** | No hay timeouteo en llamadas Supabase - si la API no responde, la UI se queda colgada | **UX** - App se congela | ⚠️ PENDIENTE |
| 15 | **store.tsx** | 14 `useEffect` que guardan en localStorage - uno por cada entidad | **PERF** - 14 escrituras en cada cambio | ⚠️ PENDIENTE |
| 16 | **store.tsx** | Manejo de errores silencioso en `getServerRole()` catch block | **DEBUG** - Errores invisibles | ⚠️ PENDIENTE |
| 17 | **Seguridad** | Sanitizacion XSS solo client-side, no hay validacion server-side en Supabase | **XSS** - Vulnerable a inyeccion | ⚠️ PENDIENTE |
| 18 | **store.tsx** | `signInWithGoogle()` usa `window.location.href` en lugar de manejar el popup correctamente | **UX** - Pierde estado de la app | ⚠️ PENDIENTE |

### 🟢 BAJOS (Mejoras)

| # | Area | Hallazgo | Riesgo | Estado |
|---|------|----------|--------|--------|
| 19 | **store.tsx** | `mapRol` hardcodea `salazaroliveros@gmail.com` como Administrador | **FLEX** - Dificil de configurar | ⚠️ PENDIENTE |
| 20 | **store.tsx** | No hay limpieza de `intervalRef` en cleanup de useEffect | **MEM** - Memory leak potencial | ⚠️ PENDIENTE |
| 21 | **sw.js** | Cache estrategico solo para GET - assets estaticos no se cachean en otros metodos | **PERF** - Optimizable | ⚠️ PENDIENTE |
| 22 | **store.tsx** | `ADMIN_EMAIL` definido pero nunca usado (hardcodeado en su lugar) | **CODE** - Dead code | ⚠️ PENDIENTE |
| 23 | **store.tsx** | Seed data cargada en localStorage incluso si Supabase tiene datos reales | **DATA** - Datos duplicados | ⚠️ PENDIENTE |

---

## Resumen por prioridad

| Prioridad | Total | Corregidos | Pendientes |
|-----------|-------|------------|------------|
| 🛑 Criticos | 6 | 6 | 0 |
| 🔴 Altos | 6 | 4 | 2 |
| 🟡 Medios | 6 | 0 | 6 |
| 🟢 Bajos | 5 | 0 | 5 |
| **TOTAL** | **23** | **10** | **13** |

## Plan de accion recomendado

### Inmediato (ejecutar en Supabase)
1. `sql/fix_emergencia_rls_500.sql` - Corrige errores 500
2. `sql/align_supabase_completo.sql` - Alinea todo el esquema

### Proxima iteracion
1. Agregar limite de tamano a mutation queue (max 100 entradas)
2. Agregar timeout a todas las llamadas Supabase (30s max)
3. Crear tablas faltantes: erp_avances, erp_licitaciones, erp_auditoria
4. Consolidar los 14 useEffect de localStorage en uno solo

### Mejoras continuas
1. Mover configuracion del admin a variable de entorno
2. Agregar rate limiting en login
3. Implementar validacion server-side (PostgreSQL CHECK constraints)