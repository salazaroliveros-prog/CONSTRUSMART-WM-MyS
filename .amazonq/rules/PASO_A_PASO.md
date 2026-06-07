# ✅ PASO A PASO — DEPLOY EN 40 MINUTOS

**Duración total:** 40 minutos  
**Riesgo:** BAJO  
**Complejidad:** SIMPLE

---

## 📋 CHECKLIST MAESTRO

```
PRE-DEPLOY (30 min):
☐ 1. Verificar build
☐ 2. Verificar tests
☐ 3. Testing manual (3 cascadas)
☐ 4. Migraciones SQL

DEPLOY (10 min):
☐ 5. git push origin main
☐ 6. Esperar Vercel
☐ 7. Verificar en producción
```

---

## ⏱️ PASO 1: VERIFICAR BUILD (5 min)

```bash
npm run build
```

**Resultado esperado:**
```
✓ 0 errores
✓ 0 warnings críticos
✓ Archivos compilados en dist/
```

**Si falla:**
- Revisar línea roja en output
- Buscar error TypeScript
- Corregir y repetir `npm run build`

**✅ MARCAR COMPLETADO**

---

## ⏱️ PASO 2: VERIFICAR TESTS (5 min)

```bash
npm run test
```

**Resultado esperado:**
```
✓ 76/76 tests pasando
✓ 0 tests fallando
✓ 100% cobertura crítica
```

**Si fallan tests:**
- Revisar test con ✗
- Buscar qué rompió
- Corregir código
- Repetir `npm run test`

**✅ MARCAR COMPLETADO**

---

## ⏱️ PASO 3: TESTING MANUAL (15 min)

Tres pruebas en la interfaz del navegador:

### Test 3.1: Validación Stock (P1) — 5 min

**Objetivo:** Verificar que no se puede crear vale sin stock

1. Abre app en `http://localhost:8080` (o Vercel)
2. Ve a **Bodega** → **Vales de Salida** → **+ Nuevo Vale**
3. Selecciona un material (ej: "Acero")
4. Verifica stock actual (ej: 5)
5. Intenta agregar cantidad = 10
6. Click **Guardar**

**✅ Esperado:** Error bloqueante
```
"Stock insuficiente: Acero (disponible: 5, requerido: 10)"
```

**❌ Si no da error:** DETENER, revisar store.tsx línea 2067

---

### Test 3.2: Cascada OC → Stock (P2) — 5 min

**Objetivo:** Verificar que OC recibida suma stock automáticamente

1. Ve a **Bodega** → **Órdenes de Compra** → **+ Nueva OC**
2. Completa:
   - Proveedor: Cualquiera
   - Material: "Concreto"
   - Cantidad: 50
   - Estado: "pendiente"
3. Nota el stock actual de Concreto (ej: 10)
4. Click **Guardar**
5. Marca OC como **"Aprobada"** o **"Recibida"**
6. Ve a **Bodega** → **Materiales** → Busca "Concreto"

**✅ Esperado:** Stock de Concreto = 10 + 50 = 60

**❌ Si no cambia:** DETENER, revisar store.tsx línea 1993

---

### Test 3.3: AuthGuard Bloqueante (P4) — 5 min

**Objetivo:** Verificar que rol no permitido es bloqueado

1. Abre **DevTools** (F12)
2. Console tab
3. Simula usuario Bodeguero:
   ```javascript
   localStorage.setItem('wm_erp_data_user', JSON.stringify({id:'test', nombre:'Test', rol:'Bodeguero'}))
   ```
4. Recarga página (F5)
5. Intenta ir a **Financiero**

**✅ Esperado:** Redirige automáticamente a **Login**

6. Ahora intenta **Bodega**

**✅ Esperado:** Carga sin redirigir

**❌ Si accede a Financiero:** DETENER, revisar AppLayout.tsx línea 117

---

## ⏱️ PASO 4: MIGRACIONES SQL (5 min)

En **Supabase SQL Editor**, ejecutar EN ORDEN:

### 4.1: Migración 1 (Esquema Base)

```
Supabase Dashboard
→ Tu proyecto
→ SQL Editor (lado izquierdo)
```

1. Copiar contenido de: `supabase/migrations/000000000001_full_schema_base_and_policies.sql`
2. Pegar en SQL Editor
3. Click **[RUN]** o Ctrl+Enter
4. Esperar ✅ **"Query executed successfully"**

**✅ MARCAR COMPLETADO**

### 4.2: Migración 2 (Realtime + Tablas Complementarias)

1. Copiar contenido de: `supabase/migrations/000000000002_complementary_tables_and_realtime.sql`
2. Pegar en SQL Editor (nuevo)
3. Click **[RUN]**
4. Esperar ✅ **"Query executed successfully"**

**✅ MARCAR COMPLETADO**

---

## ⏱️ PASO 5: GIT PUSH (2 min)

```bash
# En tu terminal/IDE
git add .
git commit -m "Deploy: Auditoría 2026-06-07, app 100% lista"
git push origin main
```

**Resultado esperado:**
```
✓ Push exitoso
✓ Vercel recibe el push
✓ Build automático inicia
```

**✅ MARCAR COMPLETADO**

---

## ⏱️ PASO 6: ESPERAR VERCEL (5 min)

```
→ Ir a: https://vercel.com/dashboard
→ Seleccionar proyecto: erp-construsmart
→ Esperar a que build termina (línea verde)
```

**Resultado esperado:**
```
✓ Build completado sin errores
✓ URL de deploy: https://erp-construsmart-wm.vercel.app/
```

**❌ Si build falla:**
- Click en build fallido
- Ver logs de error
- Corregir en local
- Repetir `git push origin main`

**✅ MARCAR COMPLETADO**

---

## ⏱️ PASO 7: VERIFICAR PRODUCCIÓN (3 min)

1. Abre en navegador incógnito (nueva ventana privada):
   ```
   https://erp-construsmart-wm.vercel.app/
   ```

2. Verificar:
   ```
   ☐ Página carga (no error 404)
   ☐ Puedo ver Login
   ☐ Puedo hacer login (con credenciales de test)
   ☐ Dashboard carga
   ☐ Sidebar visible
   ☐ DevTools (F12) → Console: SIN errores rojos
   ```

**✅ MARCAR COMPLETADO**

---

## 🎉 RESULTADO FINAL

Si todos los pasos se completaron ✅:

```
╔═════════════════════════════════════════════════════╗
║                                                     ║
║         🚀 DEPLOY EXITOSO 🚀                       ║
║                                                     ║
║  App está en PRODUCCIÓN:                           ║
║  https://erp-construsmart-wm.vercel.app/           ║
║                                                     ║
║  Status: ✅ ONLINE                                  ║
║  Build: ✅ Sin errores                             ║
║  Tests: ✅ 76/76 pasando                           ║
║  Usuarios pueden: ✅ Acceder y usar app            ║
║                                                     ║
║  Tiempo total: ~40 minutos                         ║
║  Riesgo: ✅ BAJO (sin breaking changes)            ║
║                                                     ║
╚═════════════════════════════════════════════════════╝
```

---

## 🚨 TROUBLESHOOTING

### ❌ Build falla en paso 1
```
→ npm run build
→ Buscar línea roja (error TypeScript)
→ Revisar imports / sintaxis
→ Corregir
→ Repetir npm run build
```

### ❌ Tests fallan en paso 2
```
→ npm run test
→ Buscar test con ✗
→ Revisar qué cambió
→ Corregir código
→ Repetir npm run test
```

### ❌ Stock no valida en paso 3
```
→ STOP — Hay bug
→ Revisar: src/erp/store.tsx línea 2067-2078
→ Verificar validación de stock
→ Corregir
→ Repetir paso 1-2
```

### ❌ OC no suma stock en paso 3
```
→ STOP — Hay bug
→ Revisar: src/erp/store.tsx línea 1993-2008
→ Verificar que incrementa material.stock
→ Corregir
→ Repetir paso 1-2
```

### ❌ AuthGuard no bloquea en paso 3
```
→ STOP — Hay bug
→ Revisar: src/components/AppLayout.tsx línea 117-121
→ Verificar que retorna <Login />
→ Corregir
→ Repetir paso 1-2
```

### ❌ SQL falla en paso 4
```
→ Error en línea X del script SQL
→ Revisar sintaxis SQL
→ Ejecutar línea por línea para encontrar culpable
→ Fijar script
→ Repetir paso 4
```

### ❌ Vercel build falla en paso 6
```
→ Click en build fallido
→ Ver logs (Build Output)
→ Buscar error
→ Corregir en local
→ git push de nuevo
```

---

## 📞 RESUMEN DE TIEMPOS

| Paso | Actividad | Tiempo | Total |
|------|-----------|--------|-------|
| 1 | Build | 5 min | 5 min |
| 2 | Tests | 5 min | 10 min |
| 3.1 | Stock test | 5 min | 15 min |
| 3.2 | OC test | 5 min | 20 min |
| 3.3 | AuthGuard test | 5 min | 25 min |
| 4 | SQL | 5 min | 30 min |
| 5 | Push | 2 min | 32 min |
| 6 | Vercel | 5 min | 37 min |
| 7 | Verificar | 3 min | 40 min |

**TOTAL: 40 MINUTOS**

---

## ✅ FIRMA FINAL

Cuando completes TODO:

```
Completado por: _____________________
Fecha: 2026-06-07
Hora de inicio: ___________
Hora de fin: ___________
Status: ✅ PRODUCCIÓN

Observaciones:
_____________________________________
_____________________________________
```

---

**Documento:** Paso a Paso Deploy  
**Versión:** Oficial 2026-06-07  
**Status:** 🚀 LISTA PARA EJECUTAR
