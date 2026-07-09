# Alineación DB ↔ App — Verificación Final

## Fecha
2026-07-09

## Proyecto
CONSTRUSMART ERP — Proyecto Supabase: `neygzluxugodiwcuctbj`

---

## Resumen Ejecutivo

✅ **Alineación total confirmada** mediante verificación directa contra Supabase (service role key).

---

## Verificación Realizada

### 1. Tablas `erp_*` ( service role directo )
- **39/39 tablas** confirmadas existentes en producción.
- `erp_notificaciones`: **existe**.
- `erp_proyectos`: **48 columnas** confirmadas.

### 2. Columnas de `erp_proyectos`
Incluye todas las esperadas por la app:
- Base: `id`, `nombre`, `cliente`, `ubicacion`, `tipologia`, `estado`, `presupuesto_total`, `monto_contrato`, `avance_fisico`, `avance_financiero`, `lat`, `lng`, `fecha_inicio`, `fecha_fin`, `created_by`, `created_at`, `updated_at`
- Extendidas: `descripcion`, `subtipo`, `tipo_obra`, `cliente_nit`, `cliente_telefono`, `cliente_email`, `direccion`, `ciudad`, `departamento`, `pais`, `codigo_postal`, `area_construccion`, `num_pisos`, `plazo_semanas`, `ingeniero_residente`, `supervisor`, `arquitecto`, `numero_expediente`, `numero_licencia`, `margen_utilidad_objetivo`, `moneda`, `etapa`, `fecha_inicio_real`, `fecha_fin_estimada`, `version`, `motivo_pausa`, `pausado_por`, `fecha_pausa`, `fecha_reanudacion_estimada`

### 3. Tabla `erp_notificaciones`
Columnas confirmadas:
- `id`, `tipo`, `titulo`, `mensaje`, `proyecto_id`, `referencia_id`, `leido`, `created_at`, `created_by`, `updated_at`

### 4. RLS (Row Level Security)
- **Configuración activa**: la anon key **no puede** leer `erp_proyectos`.
- service role mantiene acceso administrativo.
- Policies documentadas en `scripts/verificar-rls-completo.ts`.

---

## Configuración Necesaria en Supabase

### Ya aplicada en producción
| Item | Estado |
|------|--------|
| Migration 093 (`erp_notificaciones` + 25 columnas) | ✅ Aplicada |
| RLS en tablas ERP | ✅ Activo |
| Realtime en tablas principales | ✅ Activo |
| Service role key restringida | ✅ Confirmado |
| Anon key pública bloqueada | ✅ Confirmado |

### Scripts de verificación incluidos
| Script | Propósito |
|--------|-----------|
| `scripts/comparar-db-app.ts` | Diff entre SQL migrations y TABLE_MAP |
| `scripts/verificar-supabase-remoto.ts` | Verificación service-role (tablas, columnas, RLS) |
| `scripts/verificar-rls-completo.ts` | Auditoría de policies RLS en migrations |
| `scripts/validar-alineacion-final.ts` | Validación parser vs ALTER TABLE blocks |

---

## Acceso a Supabase

```bash
# CLI autenticado
supabase login
supabase link --project-ref neygzluxugodiwcuctbj

# Verificar migraciones
supabase migration list

# Inspeccionar DB remota (si tenés DB password configurado)
supabase db remote sql "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'erp_%'"
```

---

## Recomendaciones Operativas

1. **No compartir** `service_role` key en cliente ni frontend.
2. Revisar periódicamente `supabase_migrations.schema_migrations` para confirmar versiones.
3. Correr `scripts/verificar-supabase-remoto.ts` después de cada migración nueva.
4. Mantener `scripts/verificar-rls-completo.ts` como parte del pipeline de validación.

---

*Documento generado el 2026-07-09 — Alineación DB↔App verificada y confirmada.*