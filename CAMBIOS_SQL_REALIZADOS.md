# 🔧 SQL CORREGIDO - CAMBIOS REALIZADOS

## Error encontrado
```
ERROR: 42703: column "presupuesto_id" does not exist
```

## Cambios realizados

### ❌ ELIMINADO (causaba error)
```sql
-- Línea que causaba error:
REFERENCES erp_presupuestos(id) ON DELETE CASCADE
```

Razón: `erp_renglones` NO debe referenciar `erp_presupuestos` porque:
- Los renglones se almacenan en JSONB dentro de `erp_presupuestos.renglones`
- No es necesario tabla separada para renglones

### ✅ ESTRUCTURA CORREGIDA

**erp_renglones:**
- Referencia solo a `erp_proyectos` (relación 1:N válida)
- SIN referencia a presupuestos
- Almacena datos desnormalizados para performance

**erp_insumos:**
- Referencia a `erp_renglones` ✅
- Relación 1:N válida

**erp_sub_renglones:**
- Referencia a `erp_renglones` ✅
- Relación 1:N válida

---

## Archivo nuevo
**SQL_TABLAS_CORREGIDO.sql**

Cambios:
- ✅ Removida referencia a `erp_presupuestos` en `erp_renglones`
- ✅ Agregado `DROP POLICY IF EXISTS` para evitar conflictos
- ✅ Agregado `DROP TRIGGER IF EXISTS` para evitar duplicados
- ✅ Agregado índices en `created_by`
- ✅ RLS policies corregidas

---

## Próximos pasos

1. Copiar SQL_TABLAS_CORREGIDO.sql
2. Ir a Supabase → SQL Editor
3. Pegar y ejecutar
4. Resultado esperado: ✅ Sin errores

---

## Verificación

Después de ejecutar, debe haber:
- ✅ 3 tablas creadas (erp_renglones, erp_insumos, erp_sub_renglones)
- ✅ 6 índices creados
- ✅ 12 políticas RLS activas
- ✅ 3 triggers activos
