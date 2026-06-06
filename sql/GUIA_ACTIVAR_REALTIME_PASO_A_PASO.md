# ⚡ GUÍA PASO A PASO: ACTIVAR REALTIME EN TODAS LAS TABLAS

**Tiempo estimado:** 5 minutos  
**Dificultad:** Muy fácil  
**Riesgo:** Ninguno (solo activa Realtime, no modifica datos)

---

## 📋 ÍNDICE RÁPIDO

1. [Acceder a Supabase](#acceder-a-supabase)
2. [Abrir SQL Editor](#abrir-sql-editor)
3. [Copiar y ejecutar script](#copiar-y-ejecutar-script)
4. [Verificar resultado](#verificar-resultado)
5. [Confirmar en Dashboard](#confirmar-en-dashboard)

---

## 🔗 PASO 1: ACCEDER A SUPABASE

```
1. Abre: https://app.supabase.com/
2. Login con tu cuenta
3. Selecciona proyecto: erp-construsmart (o tu proyecto)
```

**Pantalla esperada:** Dashboard del proyecto con opciones a la izquierda

---

## 📝 PASO 2: ABRIR SQL EDITOR

```
En el panel izquierdo:
  ├─ Project Settings
  ├─ Databases ✓
  │   └─ Tables
  ├─ Authentication
  ├─ Storage
  ├─ SQL Editor ✓  ← CLICK AQUÍ
  ├─ Extensions
  └─ Logs
```

**Click en:** SQL Editor (lado izquierdo)

---

## 📋 PASO 3: COPIAR Y EJECUTAR SCRIPT

### 3.1 Copiar el script

```
Archivo: sql/010_activar_realtime_todas_tablas.sql

Copiar TODA la sección:
─────────────────────────────────────────────────────
-- ============================================================
-- 1. HABILITAR REPLICA IDENTITY FULL EN TABLAS CRÍTICAS
-- ============================================================

ALTER TABLE erp_proyectos REPLICA IDENTITY FULL;
ALTER TABLE erp_movimientos REPLICA IDENTITY FULL;
... (todas las líneas)
... (hasta la última ALTER TABLE)
─────────────────────────────────────────────────────
```

### 3.2 Pegar en SQL Editor

```
En Supabase SQL Editor:
  1. Click en el área de texto (editor)
  2. Ctrl+A (seleccionar todo si había algo)
  3. Ctrl+V (pegar el script)
```

**Pantalla esperada:**
```
┌─────────────────────────────────────────────────────────┐
│ SQL Editor                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ALTER TABLE erp_proyectos REPLICA IDENTITY FULL;      │
│ ALTER TABLE erp_movimientos REPLICA IDENTITY FULL;    │
│ ALTER TABLE erp_empleados REPLICA IDENTITY FULL;      │
│ ... (muchas más líneas) ...                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
[Run] [Format] [Save]
```

### 3.3 Ejecutar

```
Opción A (Recomendado):
  ├─ Click en botón [RUN] (esquina superior derecha)

Opción B (Teclado):
  ├─ Ctrl+Enter
```

**Tiempo de ejecución:** 3-5 segundos

---

## ✅ PASO 4: VERIFICAR RESULTADO

### 4.1 Confirmar que no hay errores

**Resultado esperado:**

```
✅ Query executed successfully

Execution time: 2.34s
```

**Si ves error:** 
```
❌ Error: relation "erp_xyz" does not exist
```
→ Significa que falta crear esa tabla (no bloquea, continúa)

### 4.2 Ejecutar consulta de verificación

```
En el MISMO SQL Editor, borra el script anterior y copia ESTO:

SELECT 
  COUNT(*) as total_tablas,
  SUM(CASE WHEN replicaidentity = 'f' THEN 1 ELSE 0 END) as realtime_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'erp_%';
```

**Click [RUN]**

**Resultado esperado:**

```
Results
total_tablas | realtime_enabled
      32     |        32
```

✅ Esto significa: 32 tablas = 32 con Realtime activado

---

## 🎯 PASO 5: CONFIRMAR EN DASHBOARD

### 5.1 Ir a Database → Tables

```
En el panel izquierdo:
  SQL Editor
  Database ✓ ← CLICK AQUÍ
    └─ Tables ✓ ← CLICK AQUÍ
```

### 5.2 Seleccionar una tabla

```
Lista de tablas:
  • erp_proyectos ✓ ← CLICK
  • erp_movimientos
  • erp_empleados
  • ... etc
```

### 5.3 Verificar Realtime

```
Información de tabla:
┌──────────────────────────────────────────────────┐
│ erp_proyectos                                    │
├──────────────────────────────────────────────────┤
│                                                  │
│ Realtime:  🟢 ENABLED                           │
│            (si está en ROJO = DISABLED)          │
│                                                  │
│ Columns:                                         │
│  ├─ id (uuid) PK                                │
│  ├─ nombre (text)                               │
│  ├─ cliente (text)                              │
│  └─ ... más columnas                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

✅ **Si ves "ENABLED" en VERDE:** Realtime activo en esa tabla

### 5.4 Verificar las 12 tablas críticas

```
Tablas que DEBEN mostrar "ENABLED" (verde):

✓ erp_proyectos         → Realtime: ENABLED
✓ erp_presupuestos      → Realtime: ENABLED
✓ erp_movimientos       → Realtime: ENABLED
✓ erp_vales_salida      → Realtime: ENABLED
✓ erp_avances           → Realtime: ENABLED
✓ erp_ordenes_compra    → Realtime: ENABLED
✓ erp_materiales        → Realtime: ENABLED
✓ erp_empleados         → Realtime: ENABLED
✓ erp_seguimiento       → Realtime: ENABLED
✓ erp_renglones         → Realtime: ENABLED
✓ erp_insumos           → Realtime: ENABLED
✓ erp_sub_renglones     → Realtime: ENABLED
```

---

## ⏱️ TIMELINE COMPLETO

```
Minuto 0:  Acceder a Supabase Dashboard
Minuto 1:  Abrir SQL Editor
Minuto 2:  Pegar script 010
Minuto 3:  Ejecutar [RUN]
Minuto 4:  Esperar resultado ✅
Minuto 5:  Ir a Database → Tables
Minuto 6:  Verificar 1-2 tablas mostren ENABLED
Minuto 7:  Listo ✅
```

---

## 🎯 CHECKLIST FINAL

```
☐ Accedí a Supabase Dashboard
☐ Abrí SQL Editor
☐ Copié script 010_activar_realtime_todas_tablas.sql
☐ Pegué en SQL Editor
☐ Hice click [RUN]
☐ Vi "Query executed successfully"
☐ Ejecuté consulta de verificación
☐ Vi resultado: 32 | 32 ✅
☐ Fui a Database → Tables
☐ Verifiqué que las 12 tablas muestren "ENABLED" (verde)
☐ Realtime está ACTIVADO EN TODAS LAS TABLAS ✅
```

---

## 🚀 PRÓXIMO PASO

Una vez confirmado que Realtime está activo en todas las tablas:

```
1. Vuelve a tu IDE (VS Code / WebStorm)
2. Ejecuta: npm run build
3. Ejecuta: npm run test
4. Si todo OK: git push origin main
5. Vercel despliega automáticamente
```

---

## ❓ PREGUNTAS FRECUENTES

### ¿Qué pasa si veo DISABLED en rojo?

```
❌ Realtime: DISABLED (rojo)

Causas posibles:
1. Script no se ejecutó completamente
2. Hay error en la ejecución
3. Supabase no actualizó el Dashboard (espera 2 min + F5)

Solución:
1. Espera 2 minutos
2. Recarga el Dashboard (F5)
3. Si persiste, ejecuta el script de nuevo
```

### ¿Es seguro ejecutar el script?

```
✅ SÍ, es 100% seguro

¿Por qué?
• Solo ACTIVA Realtime
• NO modifica datos
• NO borra tablas
• NO cambia columnas
• Puede ejecutarse múltiples veces sin problema
```

### ¿Qué hace REPLICA IDENTITY FULL?

```
Permite a Supabase enviar el registro COMPLETO 
en eventos INSERT/UPDATE/DELETE

Sin REPLICA IDENTITY FULL:
  → Solo envía la PK (ineficiente)

Con REPLICA IDENTITY FULL:
  → Envía toda la fila (lo que necesita la app)
```

### ¿Cuánto tarda en funcionar?

```
Generalmente: Inmediato

Pero a veces:
  → 1-2 minutos (Supabase actualiza internamente)

Si no funciona después de 5 min:
  1. Recarga el Dashboard (F5)
  2. Recarga la app (F5 en localhost:8080)
  3. Abre DevTools → Console
  4. Verifica que useSupabaseRealtime se conecta
```

---

## 📞 SOPORTE

Si algo falla:

1. **Verifica que ejecutaste el script completo**
   - No es "solo copiar una línea"
   - Son ~35 líneas de ALTER TABLE

2. **Ejecuta la consulta de verificación**
   ```sql
   SELECT COUNT(*) as total_tablas,
     SUM(CASE WHEN replicaidentity = 'f' THEN 1 ELSE 0 END) as realtime_enabled
   FROM pg_tables
   WHERE schemaname = 'public' AND tablename LIKE 'erp_%';
   ```
   
3. **Si ves 32 | 32 → Realtime OK**

4. **Si ves 32 | 0 → Realtime DESHABILITADO**
   - Ejecuta el script nuevamente

5. **Si ves error → Falta crear tabla**
   - Ejecuta script 009 primero
   - Luego el 010

---

*Guía creada: 2026-06-07*  
*Última actualización: 2026-06-07*
