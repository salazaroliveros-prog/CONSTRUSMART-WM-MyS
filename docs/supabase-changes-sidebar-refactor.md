# Cambios en Supabase para Refactorización del Sidebar (40 → 30 módulos)

## Objetivo
Alinear la base de datos con la nueva estructura del sidebar sin eliminar datos históricos.

---

## Fase 1: Análisis de impacto (sin cambios aún)

### Tablas NO afectadas (permanecen igual)
| Tabla | Uso actual | Nuevo acceso | Acción |
|-------|-----------|--------------|--------|
| `erp_bitacora` | Accesible desde pantalla Bitacora.tsx | Ahora se accede desde Seguimiento.tsx (pestaña bitácora) | **NINGUNA** |
| `erp_presupuestos` | Accesible desde Presupuestos.tsx | Exportación desde ExportacionInteligente.tsx | **NINGUNA** |
| `erp_avances` | Accesible desde CurvasS.tsx y Seguimiento.tsx | Solo desde Seguimiento.tsx | **NINGUNA** |
| `erp_audit_log` | Accesible desde Auditoria.tsx | Se accede desde Administracion.tsx | **NINGUNA** |
| `erp_analisis_costos` (si existe) | Accesible desde AnalisisCostosDashboard.tsx | Ahora en Dashboard.tsx (sección colapsable) | **NINGUNA** |

### Vistas/Roles afectados
| Vista/Rol | Actual | Nuevo | Acción |
|-----------|--------|-------|--------|
| `getViewsByRole()` en `src/lib/security.ts` | Incluía `bitacora`, `curvas`, `analisis-costos`, `auditoria`, `reportes` | Eliminadas del array ALL | ✅ YA ACTUALIZADO |
| Políticas RLS por tabla | Basadas en rol de usuario | Sin cambios (mismas tablas, mismas políticas) | **NINGUNA** |

---

## Fase 2: Cambios requeridos en Supabase

### 2.1 Verificar vistas de Supabase (Views)
Si existen vistas SQL en Supabase que expongan las tablas eliminadas, **NO ELIMINARLAS** (los datos históricos permanecen). Solo cambiar references desde el frontend.

**Vistas a revisar** (ejecutar en Supabase SQL Editor):
```sql
-- Verificar vistas existentes
SELECT table_name FROM information_schema.views WHERE table_schema = 'public';
```

Si existen vistas como:
- `vw_bitacora`
- `vw_analisis_costos`
- `vw_curvas_s`
- `vw_auditoria`

**NO ELIMINARLAS**. Solo dejarlas como obsoletas (renombrar con prefijo `obs_`).

#### Script para renombrar vistas obsoletas (opcional):
```sql
-- Renombrar vistas obsoletas (si existen)
ALTER VIEW IF EXISTS public.vw_bitacora RENAME TO obs_vw_bitacora_2026;
ALTER VIEW IF EXISTS public.vw_analisis_costos RENAME TO obs_vw_analisis_costos_2026;
ALTER VIEW IF EXISTS public.vw_curvas_s RENAME TO obs_vw_curvas_s_2026;
ALTER VIEW IF EXISTS public.vw_auditoria RENAME TO obs_vw_auditoria_2026;
```

---

### 2.2 Verificar Stored Procedures/Functions
Verificar si hay funciones RPC que dependan de las pantallas eliminadas.

**Funciones a revisar:**
```sql
-- Listar funciones personalizadas
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
```

Posibles funciones afectadas:
- `verificar_rol_usuario` → **NO AFECTADA** (solo lee rol, no vistas)
- `append_comentario_muro` → **NO AFECTADA**
- `increment_likes_muro` → **NO AFECTADA**
- Otras funciones específicas de bitácora/auditoría → **REVISAR**

Si existen funciones específicas de módulos eliminados, **NO ELIMINARLAS** (solo marcarlas como obsoletas).

#### Script para marcar funciones obsoletas (opcional):
```sql
-- Comentar funciones obsoletas (si existen)
COMMENT ON FUNCTION public.fn_bitacora_crud() IS 'OBSOLETA: 2026-01-07 - Usar Seguimiento.tsx en su lugar';
COMMENT ON FUNCTION public.fn_auditoria_filter() IS 'OBSOLETA: 2026-01-07 - Usar Administracion.tsx en su lugar';
```

---

### 2.3 Verificar Triggers
Verificar triggers en tablas que siguen activas.

**Triggers a revisar:**
```sql
SELECT tgname, tgrelid::regclass AS table_name FROM pg_trigger WHERE NOT tgisinternal;
```

Posibles triggers:
- `erp_bitacora_trigger` → **NO ELIMINAR** (sigue usándose desde Seguimiento)
- `erp_audit_log_trigger` → **NO ELIMINAR** (sigue usándose desde Administracion)

**Acción:** Ninguna. Los triggers permanecen.

---

### 2.4 Verificar Row Level Security (RLS)
**NO CAMBIAR** las políticas RLS. Las tablas siguen teniendo los mismos datos, solo cambia la interfaz de acceso.

Verificar políticas actuales:
```sql
-- Ver todas las políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies WHERE schemaname = 'public';
```

**Acción:** Ninguna. Las políticas permanecen igual.

---

### 2.5 Verificar índices
**NO CAMBIAR** índices. Todas las tablas mantienen sus estructuras.

---

## Fase 3: Actualización de datos (opcional)

### 3.1 Migrar registros de bitácora (si aplica)
Si los usuarios tenían bitácoras creadas desde la pantalla antigua, **NO ELIMINARLAS**. Los datos en `erp_bitacora` permanecen intactos y serán accesibles desde la nueva pestaña en Seguimiento.

**Acción:** Ninguna. Los datos se preservan.

### 3.2 Migrar reportes programados (si aplica)
Si existían reportes programados en `reportes` (si había una tabla/colección específica), considerar migrarlos a la nueva estructura de ExportacionInteligente.

**Acción:** Si existe colección `wm_erp_data_reportes_programados`, migrar a `wm_erp_data_exportacion` o eliminar si no hay datos históricos.

```sql
-- Verificar si existe colección de reportes programados
SELECT key FROM localStorage WHERE key LIKE '%reportes%';
```

---

## Resumen de cambios en Supabase

| Componente | Acción | justificación |
|------------|--------|---------------|
| Tablas | **NINGUNA** | No se eliminan tablas, solo pantallas |
| Vistas SQL | Renombrar a `obs_*_2026` (opcional) | Limpiar namespace sin perder definiciones |
| Funciones RPC | Marcar como obsoletas (opcional) | Documentar cambio de interfaz |
| Triggers | **NINGUNA** | Siguen funcionando sobre las mismas tablas |
| Políticas RLS | **NINGUNA** | Mismas tablas, mismos permisos |
| Índices | **NINGUNA** | Mismas estructuras de datos |
| Datos | **NINGUNA** | Se preservan históricos |

---

## Checklist de verificación post-refactor

- [ ] Verificar que `erp_bitacora` sea accesible desde Seguimiento.tsx
- [ ] Verificar que `erp_audit_log` sea accesible desde Administracion.tsx
- [ ] Verificar que exportación a PDF/CSV/XLSX funcione desde ExportacionInteligente.tsx
- [ ] Verificar que no hay referencias a módulos eliminados en el código
- [ ] Ejecutar `npm run lint`, `npm run typecheck`, `npm run build:dev`
- [ ] Probar en Supabase Dashboard que las tablas siguen teniendo datos
- [ ] Verificar que las políticas RLS siguen aplicando correctamente

---

## Nota importante

Este refactor es **solo cambios en UI/frontend**. La base de datos permanece intacta. Si en el futuro se decide eliminar tablas obsoletas, se deberá:

1. Hacer backup de datos
2. Crear migración SQL con `DROP TABLE`
3. Actualizar store.tsx para remover carga desde localStorage
4. Actualizar realtime subscriptions en AppLayout.tsx
5. Documentar en changelog

**Por ahora, NO eliminar ninguna tabla.**