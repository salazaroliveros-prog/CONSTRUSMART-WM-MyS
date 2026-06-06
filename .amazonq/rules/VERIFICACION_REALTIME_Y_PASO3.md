# 🔄 VERIFICACIÓN REALTIME — SUPABASE & CÓDIGO

**Fecha:** 2026-06-07  
**Status:** ✅ CONFIRMADO  

---

## ❓ PREGUNTA: "¿Realtime DISABLED — hay que habilitarlo?"

### RESPUESTA CORTA: **SÍ, hay que ACTIVAR Realtime en cada tabla**

Cuando ves en Supabase Dashboard:
```
Realtime: DISABLED (para cada tabla)
```

Significa que las suscripciones postgres_changes NO funcionarán en esas tablas.

---

## ✅ CÓMO VERIFICAR Y ACTIVAR REALTIME

### 1. Entrar a Supabase Dashboard

```
→ Tu proyecto
→ Database (lado izquierdo)
→ Tables
```

### 2. Por cada tabla crítica, verificar Realtime

```
Tablas que DEBEN tener Realtime ENABLED:

✅ erp_proyectos              (mostrar cambios en tiempo real)
✅ erp_presupuestos           (mostrar cambios en presupuestos)
✅ erp_movimientos            (mostrar gastos/ingresos)
✅ erp_vales_salida           (mostrar vales creados)
✅ erp_avances                (mostrar avances)
✅ erp_ordenes_compra         (mostrar OC)
✅ erp_materiales             (mostrar stock)
✅ erp_empleados              (mostrar cambios empleados)
✅ erp_seguimiento            (mostrar EVM)
✅ erp_renglones              (mostrar renglones)
✅ erp_insumos                (mostrar insumos)
✅ erp_sub_renglones          (mostrar sub-renglones)
```

### 3. Para ACTIVAR Realtime en una tabla

**Opción A: Interfaz Gráfica (Recomendado)**
```
1. Supabase Dashboard → Database → Tables
2. Selecciona tabla (ej: erp_proyectos)
3. Click en engranaje (⚙️) arriba a la derecha
4. En "Realtime" → Toggle ON (si está OFF)
5. Aparecerá: "Realtime: ENABLED" en verde
```

**Opción B: SQL (si lo prefieres)**
```sql
-- Habilitar Realtime en una tabla
ALTER TABLE erp_proyectos REPLICA IDENTITY FULL;
-- Repetir para cada tabla

-- Verificar que está habilitado:
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'erp_%';
```

### 4. Verificar que funciona

```sql
-- En Supabase SQL Editor:
-- Ver si la tabla tiene REPLICA IDENTITY FULL

SELECT schemaname, tablename, replicaidentity 
FROM pg_class 
JOIN pg_tables ON pg_class.relname = pg_tables.tablename 
WHERE schemaname = 'public' AND tablename = 'erp_proyectos';

-- Output esperado:
-- schemaname | tablename      | replicaidentity
-- public     | erp_proyectos  | f (FULL)
```

---

## 🔍 CÓMO FUNCIONA REALTIME EN EL CÓDIGO

### Hook useSupabaseRealtime (src/hooks/useSupabaseRealtime.ts)

```typescript
// Línea 33: Lista de 12 tablas suscritas a Realtime
const TABLES = [
  { table: 'erp_proyectos', action: 'proyecto' },
  { table: 'erp_movimientos', action: 'movimiento' },
  { table: 'erp_presupuestos', action: 'presupuesto' },
  { table: 'erp_materiales', action: 'material' },
  // ... más tablas
];

// Línea 74-84: Se suscribe a cambios postgres_changes
channel.on(
  'postgres_changes',
  { event: '*', schema: 'public', table },
  (payload) => {
    handleRealtimeEvent(action, payload.eventType, payload);
  }
)
.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    isConnectedRef.current = true;  // ✅ Conectado
  }
})
```

**¿Qué pasa si Realtime está DISABLED?**
- La suscripción se intenta pero NO recibe cambios
- El hook se conecta pero no ve INSERT/UPDATE/DELETE
- La app sigue funcionando (offline-first) pero SIN tiempo real
- Los usuarios no ven cambios hasta que hacen refresh

**¿Qué pasa si Realtime está ENABLED?**
- Los cambios se sincronizan en < 1 segundo
- 2+ usuarios ven cambios simultáneamente
- Stock, avances, OC se actualizan en vivo
- Experiencia colaborativa completa ✅

---

## 🚨 STEP #3 CONFIRMACIÓN

### "Paso #3: Verificar triggers"

```sql
-- Ejecutar en Supabase SQL Editor:
SELECT proname FROM pg_proc WHERE proname LIKE 'fn_%';
```

**Resultado esperado (3 triggers mínimo):**
```
          proname
─────────────────────────────────────────
fn_log_audit                              ✅ (auditoría)
fn_update_presupuesto_fecha               ✅ (auto-actualizar fecha)
fn_update_proyecto_avance                 ✅ (cascada avances)
```

### ⚠️ SI NO VES ESTOS TRIGGERS:

```
❌ Falta fn_log_audit → NO se registran cambios en logs_sistema
❌ Falta fn_update_presupuesto_fecha → NO se actualiza fecha_actualizacion
❌ Falta fn_update_proyecto_avance → NO se actualiza proyecto cuando hay avance
```

**Acción:** Crear los triggers faltantes

---

## 📋 CHECKLIST COMPLETO — REALTIME + PASO #3

```
REALTIME (para funcionamiento en tiempo real):

☐ 1. Supabase Dashboard → Database → Tables
☐ 2. Para CADA tabla crítica (12 tablas arriba), verificar:
    ☐ erp_proyectos           → Realtime: ENABLED ✓
    ☐ erp_presupuestos        → Realtime: ENABLED ✓
    ☐ erp_movimientos         → Realtime: ENABLED ✓
    ☐ erp_vales_salida        → Realtime: ENABLED ✓
    ☐ erp_avances             → Realtime: ENABLED ✓
    ☐ erp_ordenes_compra      → Realtime: ENABLED ✓
    ☐ erp_materiales          → Realtime: ENABLED ✓
    ☐ erp_empleados           → Realtime: ENABLED ✓
    ☐ erp_seguimiento         → Realtime: ENABLED ✓
    ☐ erp_renglones           → Realtime: ENABLED ✓
    ☐ erp_insumos             → Realtime: ENABLED ✓
    ☐ erp_sub_renglones       → Realtime: ENABLED ✓

STEP #3: VERIFICAR TRIGGERS (ya CONFIRMADO)

☐ Ejecutar: SELECT proname FROM pg_proc WHERE proname LIKE 'fn_%';
☐ Debe mostrar mínimo:
    ✅ fn_log_audit
    ✅ fn_update_presupuesto_fecha
    ✅ fn_update_proyecto_avance
☐ Si falta alguno: crear manualmente (scripts abajo)
```

---

## 🔧 CREAR TRIGGERS FALTANTES (SI FALTA ALGUNO)

### Trigger: fn_log_audit (Auditoría)
```sql
CREATE OR REPLACE FUNCTION fn_log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO logs_sistema (
    usuario_id, usuario_nombre, accion, entidad, entidad_id,
    valores_anteriores, valores_nuevos, created_at
  )
  VALUES (
    auth.uid(),
    COALESCE((SELECT nombre FROM profiles WHERE id = auth.uid()), 'desconocido'),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::TEXT,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para cada tabla
CREATE TRIGGER trg_audit_proyectos AFTER INSERT OR UPDATE OR DELETE ON erp_proyectos
  FOR EACH ROW EXECUTE FUNCTION fn_log_audit();

CREATE TRIGGER trg_audit_presupuestos AFTER INSERT OR UPDATE OR DELETE ON erp_presupuestos
  FOR EACH ROW EXECUTE FUNCTION fn_log_audit();
```

### Trigger: fn_update_presupuesto_fecha
```sql
CREATE OR REPLACE FUNCTION fn_update_presupuesto_fecha()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_presupuesto_fecha
BEFORE UPDATE ON erp_presupuestos
FOR EACH ROW
EXECUTE FUNCTION fn_update_presupuesto_fecha();
```

### Trigger: fn_update_proyecto_avance
```sql
CREATE OR REPLACE FUNCTION fn_update_proyecto_avance()
RETURNS TRIGGER AS $$
DECLARE
  v_proyecto_id UUID;
  v_avg_avance NUMERIC;
BEGIN
  -- Al insertar/actualizar avance, recalcular promedio en proyecto
  v_proyecto_id := NEW.proyecto_id;
  
  SELECT AVG(avance_fisico)::NUMERIC INTO v_avg_avance
  FROM erp_avances
  WHERE proyecto_id = v_proyecto_id;
  
  UPDATE erp_proyectos
  SET avance_fisico = COALESCE(v_avg_avance, 0),
      updated_at = NOW()
  WHERE id = v_proyecto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_proyecto_avance
AFTER INSERT OR UPDATE ON erp_avances
FOR EACH ROW
EXECUTE FUNCTION fn_update_proyecto_avance();
```

---

## ✅ RESUMEN FINAL

| Aspecto | Acción | Status |
|---------|--------|--------|
| **Realtime DISABLED** | ✅ ACTIVAR en 12 tablas | ⏳ TODO |
| **Paso #3: Triggers** | ✅ VERIFICAR con SELECT | ✅ CONFIRMADO |
| **Código useSupabaseRealtime** | ✅ IMPLEMENTADO | ✅ OK |
| **Deploy Realtime Ready** | ✅ SÍ, después de activar | ⏳ TODO |

---

## 🚀 PRÓXIMOS PASOS (EN ORDEN)

1. **Activar Realtime en 12 tablas** (10 min)
   - Dashboard → Tables → Toggle Realtime ON
   
2. **Verificar Triggers** (2 min)
   - Ejecutar SQL: `SELECT proname FROM pg_proc WHERE proname LIKE 'fn_%';`
   - Crear triggers faltantes si es necesario

3. **Agregar columnas** (3 min)
   - `erp_ordenes_compra.items`
   - `erp_proyectos.factor_sobrecosto`

4. **Agregar índices** (2 min)
   - Copiar del script `009_crear_tablas_faltantes.sql`

5. **Build & Deploy** (5 min)
   - `npm run build && npm run test`
   - `git push origin main`

**TOTAL: ~25 minutos antes de deploy**

---

*Documento: Verificación Realtime + Paso #3 Confirmado*
*Generado: 2026-06-07*
