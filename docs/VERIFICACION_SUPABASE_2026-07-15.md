# REPORTE DE VERIFICACIÓN SUPABASE — CONSTRUSMART ERP

**Fecha**: 2026-07-15 00:06 (actualizado 00:13)
**Proyecto**: neygzluxugodiwcuctbj
**URL**: https://neygzluxugodiwcuctbj.supabase.co

---

## 1. ANÁLISIS ARQUITECTÓNICO: LOCAL vs DB

### 1.1 Entidades Solo Locales (memoria + localStorage, sin tabla DB)
Estas entidades operan completamente en memoria/cliente. No necesitan tabla en Supabase:

| Entidad | Tipo | Justificación |
|---------|------|---------------|
| `mutationQueue` | Infraestructura | Cola de operaciones offline, solo cliente |
| `syncMessage`, `syncCooldown`, `syncStatus`, `lastSyncedAt`, `syncError` | Infraestructura | Estado de sincronización, solo cliente |
| `isOnline` | Infraestructura | Estado de conectividad, solo cliente |
| `currentProjectId` | Contexto | Proyecto activo en sesión, solo cliente |
| `appSettings` | Configuración | Preferencias de usuario, localStorage |
| `userRol` | Auth | Rol del usuario en sesión, derivado de auth |
| `projectProfitabilities`, `clientProfitabilities`, `resourceEfficiencies`, `profitabilityTrends` | Cálculos | Datos derivados/computados, no persistentes en DB |
| `auditLog` | Auditoría | Log de auditoría local (últimos 200), backup opcional |

### 1.2 Entidades con Tabla DB (deben sincronizar)
Estas entidades TIENEN tabla en Supabase y deben pasar por forceSync:

| Entidad | Tabla DB | Estado DB Remota |
|---------|----------|-----------------|
| `proyectos` | `erp_proyectos` | ✅ 50 columnas |
| `movimientos` | `erp_movimientos` | ✅ 21 columnas |
| `empleados` | `erp_empleados` | ✅ Existe |
| `materiales` | `erp_materiales` | ✅ 17 columnas |
| `ordenes` | `erp_ordenes_compra` | ✅ 15 columnas |
| `proveedores` | `erp_proveedores` | ✅ Existe |
| `eventos` | `erp_eventos_calendario` | ✅ Existe |
| `bitacora` | `erp_bitacora` | ✅ Existe |
| `presupuestos` | `erp_presupuestos` | ✅ 16 columnas |
| `licitaciones` | `erp_licitaciones` | ❌ **NO EXISTE** |
| `cotizacionesNegocio` | `erp_cotizaciones_negocio` | ✅ Existe |
| `ventasPaquetes` | `erp_ventas_paquetes` | ✅ Existe |
| `avances` | `erp_avances` | ✅ Existe |
| `cuentasCobrar` | `erp_cuentas_cobrar` | ✅ Existe |
| `cuentasPagar` | `erp_cuentas_pagar` | ✅ Existe |
| `ordenesCambio` | `erp_ordenes_cambio` | ✅ Existe |
| `hitos` | `erp_hitos` | ✅ 13 columnas |
| `riesgos` | `erp_riesgos` | ✅ Existe |
| `planos` | `erp_planos` | ✅ Existe |
| `rfis` | `erp_rfis` | ✅ Existe |
| `submittals` | `erp_submittals` | ✅ Existe |
| `activos` | `erp_activos` | ⚠️ **403 Forbidden** (GRANT faltante) |
| `cuadros` | `erp_cuadros` | ✅ Existe |
| `pagosProveedor` | `erp_pagos_proveedor` | ✅ Existe |
| `incidentes` | `erp_incidentes` | ✅ Existe |
| `destajos` | `erp_destajos` | ✅ Existe |
| `insumosBase` | `erp_insumos_base` | ✅ Existe |
| `calculosProyecto` | `erp_calculos_proyecto` | ✅ Existe |
| `recepciones` | `erp_recepciones` | ✅ Existe |
| `valesSalida` | `erp_vales_salida` | ✅ Existe |
| `publicacionesMuro` | `erp_muro` → `erp_publicaciones_muro` | ⚠️ **MISMATCH** (código usa `erp_muro`, DB tiene `erp_publicaciones_muro`) |
| `pruebas` | `erp_pruebas_laboratorio` | ✅ Existe |
| `ncs` | `erp_no_conformidades` | ✅ Existe |
| `liberaciones` | `erp_liberaciones_partida` | ✅ Existe |
| `notificaciones` | `erp_notificaciones` | ✅ 10 columnas |
| `seguimientoEVM` | `erp_seguimiento` | ✅ Existe |
| `plantillas` | `erp_plantillas_proyectos` | ✅ Existe |
| `errorLogs` | `erp_error_log` | ✅ Existe |
| `centrosCosto` | `erp_centros_costo` | ✅ Existe |
| `reglasFactores` | `erp_reglas_factores` | ✅ Existe |
| `normativasDepartamentales` | `erp_normativa_departamental` | ✅ Existe |
| `escalasProduccion` | `erp_escalas_produccion` | ✅ Existe |
| `estacionalidad` | `erp_estacionalidad` | ✅ Existe |
| `historialReglas` | `erp_historial_aplicacion_reglas` | ✅ Existe |
| `ajustesEstacionalesActividad` | `erp_ajustes_estacionales_actividad` | ✅ Existe |
| `aplicacionEscalas` | `erp_aplicacion_escalas` | ✅ Existe |
| `cumplimientoNormativo` | `erp_cumplimiento_normativo` | ✅ Existe |
| `proyectoWeather` | `erp_proyecto_weather` | ✅ Existe |

### 1.3 Tablas DB sin Referencia en Store (solo TABLE_MAP)
| Tabla | Propósito |
|-------|-----------|
| `erp_auditoria` | Auditoría DB (no cargada en store, consulta directa) |
| `erp_departamentos_gt` | Datos de referencia (cargados via React Query/SWR) |
| `erp_municipios_gt` | Datos de referencia (cargados via React Query/SWR) |
| `erp_archivos_tipo` | Tabla auxiliar (no referenciada en store) |

---

## 2. TABLAS ERP (48/50 verificadas)

### ✅ Existentes (48)
erp_proyectos, erp_movimientos, erp_empleados, erp_materiales,
erp_ordenes_compra, erp_proveedores, erp_cuentas_cobrar, erp_cuentas_pagar,
erp_hitos, erp_riesgos, erp_cotizaciones_negocio, erp_vales_salida,
erp_no_conformidades, erp_incidentes, erp_planos, erp_rfis, erp_submittals,
erp_cuadros, erp_pagos_proveedor, erp_destajos, erp_recepciones,
erp_centros_costo, erp_seguimiento, erp_bitacora, erp_plantillas_proyectos,
erp_notificaciones, erp_presupuestos, erp_avances, erp_eventos_calendario,
erp_ventas_paquetes, erp_ordenes_cambio, erp_pruebas_laboratorio,
erp_liberaciones_partida, erp_error_log, erp_proyecto_weather, erp_auditoria,
erp_insumos_base, erp_departamentos_gt, erp_municipios_gt, erp_reglas_factores,
erp_normativa_departamental, erp_escalas_produccion, erp_estacionalidad,
erp_historial_aplicacion_reglas, erp_ajustes_estacionales_actividad,
erp_calculos_proyecto, erp_cumplimiento_normativo, erp_archivos_tipo,
erp_publicaciones_muro, erp_aplicacion_escalas

### ❌ Issues Detectados

#### ISSUE 1: `erp_licitaciones` — NO EXISTE (CRÍTICO)
- **Código**: `MUTATION_TABLE_MAP` en store.tsx línea 137 mapea `addLicitacion/updateLicitacion/deleteLicitacion` a `erp_licitaciones`
- **TABLE_MAP**: `erp_licitaciones:'licitaciones'` en table-mappings.ts línea 5
- **DB Remota**: 404 NOT FOUND
- **Causa**: La migración 004 creó la tabla, pero migraciones posteriores la eliminaron
- **Impacto**: `forceSync` falla silenciosamente para licitaciones. Solo funcionan en local.
- **Solución**: Crear tabla `erp_licitaciones` con columnas: id, proyecto_id, cliente, monto, estado, probabilidad, created_at, updated_at

#### ISSUE 2: `erp_activos` — service_role sin SELECT (ALTO)
- **Código**: `MUTATION_TABLE_MAP` mapea `addActivo/updateActivo/deleteActivo` a `erp_activos`
- **DB Remota**: 403 Forbidden — `permission denied for table erp_activos`
- **Causa**: Migración `20260713_fix_erp_activos_rls.sql` creó RLS para `authenticated` pero no `GRANT SELECT TO service_role`
- **Impacto**: `fetchInitialData` no carga activos. forceSync falla.
- **Solución**: `GRANT SELECT ON public.erp_activos TO service_role;`

#### ISSUE 3: `erp_muro` vs `erp_publicaciones_muro` (MEDIO)
- **Código**: `TABLE_MAP` mapea `erp_muro:'publicacionesMuro'` y `MUTATION_TABLE_MAP` usa `erp_muro`
- **DB Remota**: `erp_muro` no existe (404). `erp_publicaciones_muro` existe (200, vacía)
- **Causa**: Migración 090 creó `erp_publicaciones_muro` como tabla independiente
- **Impacto**: Publicaciones del muro nunca sincronizan a Supabase
- **Solución**: Cambiar `erp_muro` → `erp_publicaciones_muro` en MUTATION_TABLE_MAP (store.tsx líneas 158-162) y TABLE_MAP (table-mappings.ts línea 8)

---

## 3. COLUMNAS DE TABLAS CRÍTICAS

### erp_proyectos — ✅ 50 columnas (completo)
Todas las columnas clave existen: id, nombre, cliente, estado, tipologia, presupuesto_total, monto_contrato, avance_fisico, avance_financiero, version, motivo_pausa, etapa, etc.

### erp_notificaciones — ✅ 10 columnas
id, tipo, titulo, mensaje, proyecto_id, referencia_id, leido, created_at, created_by, updated_at

### erp_hitos — ✅ 13 columnas (incluye depende_de como jsonb)
id, proyecto_id, nombre, descripcion, fecha, tipo, estado, responsable, depende_de, completado_en, created_by, created_at, updated_at

### erp_ordenes_compra — ✅ 15 columnas
Incluye version, stock_actualizado, proveedor_id, items

### erp_presupuestos — ✅ 16 columnas
Incluye version, version_presupuesto, renglones

### erp_movimientos — ✅ 21 columnas
Incluye retencion_isr, retencion_iva, factura, proveedor

### erp_materiales — ✅ 17 columnas
Incluye version, proyecto_ids, cantidad_presupuestada, costo_presupuestado

---

## 4. AUTENTICACIÓN — Solo por Correo Electrónico (Google OAuth)
- **Método único**: Google OAuth (`signInWithGoogle`) — NO hay login anónimo
- **Configuración**: `auth.enable_signup = false`, `auth.email.enable_signup = false`
- **Sesión**: Manejo de session vía `supabase.auth.onAuthStateChange`
- **Rol de usuario**: Obtenido desde tabla `profiles` (no `erp_usuarios`) en DB
- **Validación de acceso**: Solo correos autorizados pueden acceder (`solo_admin_puede_acceder`)

### RLS (Row Level Security) — ✅ ACTIVO
- Anon key bloqueada (status 401) — correcto, no se usa auth anónima
- Service role tiene acceso administrativo (excepto `erp_activos`)
- Políticas RLS configuradas para usuarios autenticados vía email
- Flujo: Google Auth → Sesión Supabase → Consulta `profiles.rol` → Acceso a tablas via RLS

---

## 5. AUTH — ⚠️ exec_sql RESTRINGIDO
- `exec_sql` RPC no disponible (restringido a postgres owner) — correcto desde migración 066

---

## 6. MIGRACIONES LOCALES — ⚠️ 5 archivos con formato fecha
Archivos en `supabase/migrations/` con formato YYYYMMDD (no ejecutables por `supabase migration up`):
- `20260706_cleanup_legacy_tables.sql` (deshabilitado)
- `20260713_fix_erp_activos_rls.sql`
- `20260713_security_advisor_fixes.sql`
- `20260719_add_geographic_data.sql`
- `20261227_add_strategic_indexes.sql`

---

## 7. TABLAS ADICIONALES VERIFICADAS
- `erp_publicaciones_muro` — ✅ Existe (200, vacía)
- `erp_aplicacion_escalas` — ✅ Existe
- `erp_muro_likes` — ❌ No existe (legacy)
- `erp_audit_log` — ❌ No existe (reemplazada por `erp_auditoria`)
- `erp_rendimientos_cuadrilla` — ❌ No existe (legacy)

---

## RESUMEN DE ACCIONES REQUERIDAS

| Prioridad | Acción | Archivo/DB |
|-----------|--------|------------|
| 🔴 CRÍTICO | Crear tabla `erp_licitaciones` en DB remota | SQL migration |
| 🔴 ALTO | `GRANT SELECT ON erp_activos TO service_role` | SQL migration |
| 🟡 ALTO | Cambiar `erp_muro` → `erp_publicaciones_muro` en MUTATION_TABLE_MAP | `src/erp/store.tsx` líneas 158-162 |
| 🟡 ALTO | Cambiar `erp_muro` → `erp_publicaciones_muro` en TABLE_MAP | `src/erp/constants/table-mappings.ts` línea 8 |
| ⚪ MEDIO | Aplicar migraciones con formato fecha si no están en remoto | SQL manual |
| ⚪ BAJO | Verificar que `erp_auditoria`, `erp_departamentos_gt`, `erp_municipios_gt` se carguen correctamente | store.tsx fetchInitialData |

---

## NOTAS ARQUITECTÓNICAS

### Entidades que NO necesitan DB (solo memoria/localStorage):
- `mutationQueue`, `syncStatus`, `isOnline`, `currentProjectId`, `appSettings`, `userRol`
- `projectProfitabilities`, `clientProfitabilities`, `resourceEfficiencies`, `profitabilityTrends`
- `auditLog` (local, backup opcional)

### Entidades que SÍ necesitan DB pero tienen issues:
- `licitaciones` → tabla faltante en DB
- `activos` → sin permisos service_role
- `publicacionesMuro` → nombre de tabla incorrecto en código

### Entidades de referencia (cargadas con React Query/SWR, no forceSync):
- `departamentos`, `municipios` → datos estáticos GT
- `auditoria` → consulta directa, no store

---

*Generado por script de verificación automática — 2026-07-15*