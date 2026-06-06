# 📋 CHECKLIST DEPLOY AUTOMÁTICO — APP LISTA

**Fecha:** 2026-06-07  
**Objetivo:** Deploy automático a producción  

---

## ✅ PASO 1: CONFIRMAR REALTIME 100% (2 min)

```
☐ Ejecuté script 011 en Supabase SQL Editor
☐ Vi "Query executed successfully" ✅
☐ Espéré 2 minutos
☐ Recargué Dashboard (F5)
☐ Database → Tables
☐ Todas las 32 tablas muestran "ENABLED" (verde) ✅
```

---

## ✅ PASO 2: BUILD (3 min)

```bash
npm run build
```

**Resultado esperado:**
```
✅ built successfully

dist/ 12 files, 450kb
```

**Si ves ERROR:**
- Detén y revisa el error
- NO continúes

---

## ✅ PASO 3: TESTS (2 min)

```bash
npm run test
```

**Resultado esperado:**
```
✅ 76 passed

Test Files  1 passed
Tests      76 passed
```

**Si ves FAILED:**
- Detén y revisa qué test falló
- NO continúes

---

## ✅ PASO 4: GIT PUSH (1 min)

```bash
git add .
git commit -m "Deploy: Realtime 100% (32/32 tablas), app lista 2026-06-07"
git push origin main
```

**Resultado esperado:**
```
✅ master -> main
   Total 15 (delta 8)
```

---

## ✅ PASO 5: VERCEL DEPLOY (5 min)

**Vercel se activa automáticamente:**
```
1. Detecta el push a main
2. Inicia build automático
3. Ejecuta tests
4. Deploy a producción
```

**Ver estado en:** https://vercel.com/dashboard

```
Proyecto: erp-construsmart-wm
Status: ⏳ Deploying...
→ [████████░░] 80%
→ ✅ Deployment Success (5 min)
```

---

## ✅ PASO 6: VERIFICACIÓN FINAL (2 min)

```
1. Abre: https://erp-construsmart-wm.vercel.app/
2. Login con tus credenciales
3. Dashboard carga ✅
4. Navega entre módulos ✅
5. Abre 2 navegadores:
   - Navegador 1: Crea un proyecto
   - Navegador 2: ¿Lo ves aparecer en tiempo real?
   ✅ SÍ → Realtime funciona en producción
```

---

## 📊 ESTADOS ESPERADOS

### Build Status
```
✅ 0 errors
✅ 0 warnings
✅ dist/ creado
```

### Test Status
```
✅ 76/76 passed
✅ 0 failed
✅ 0 skipped
```

### Git Status
```
✅ Commits: 15 (delta 8)
✅ Push exitoso a main
✅ GitHub show últimos cambios
```

### Vercel Status
```
✅ Deployment: Success
✅ Duration: ~5 minutos
✅ URL: https://erp-construsmart-wm.vercel.app/
✅ Last Commit: Deploy: Realtime 100%...
```

---

## ❌ SI ALGO FALLA

### Build falla
```
❌ Error en build

Solución:
1. Lee el error completo
2. Revisa qué línea del código
3. Corrige el error
4. npm run build de nuevo
5. No hagas git push hasta que build OK
```

### Test falla
```
❌ Test X failed

Solución:
1. Lee qué test falló
2. npm run test -- --reporter=verbose
3. Lee el error detallado
4. Corrige el código
5. npm run test de nuevo
6. No hagas git push hasta que tests OK
```

### Git push falla
```
❌ Error en git push

Solución:
1. git pull origin main
2. Resuelve conflictos (si hay)
3. git push origin main de nuevo
4. Si persiste, contacta soporte
```

### Vercel deploy falla
```
❌ Deployment Failed

Ver logs:
1. Abre: https://vercel.com/dashboard
2. Selecciona proyecto
3. Click en último deployment
4. Abre "Build Logs"
5. Lee el error
6. Corrige y haz git push de nuevo
```

---

## 🎯 CONFIRMACIÓN DE ÉXITO

### Cuando todo OK, deberías ver:

```
┌─────────────────────────────────────────────────┐
│ ✅ Build: Success                              │
│ ✅ Tests: 76/76 passed                         │
│ ✅ Deploy: Success                             │
│ ✅ URL: UP and running                         │
│ ✅ Realtime: 32/32 tablas activas              │
│                                                 │
│ 🎉 APP EN PRODUCCIÓN                           │
└─────────────────────────────────────────────────┘
```

---

## 📞 DOCUMENTACIÓN GENERADA

Para referencia durante el deploy:

```
sql/011_crear_tablas_faltantes_y_activar_realtime.sql
  → Script que crea 10 tablas + Realtime en 32

sql/INSTRUCCIONES_SCRIPT_011.md
  → Instrucciones paso a paso

.amazonq/rules/REALTIME_FINAL_STATUS.md
  → Status actual detallado
```

---

## 🚀 ACCIÓN INMEDIATA

```
1️⃣  Ejecuta script 011 en Supabase
2️⃣  Espera 2 minutos + F5
3️⃣  Verifica todas en ✅ FULL
4️⃣  npm run build
5️⃣  npm run test
6️⃣  git push origin main
7️⃣  Espera Vercel (5 min)
8️⃣  Verifica producción
```

**TOTAL: ~20 minutos**

---

*Checklist: 2026-06-07*  
**Status: 🚀 LISTO PARA DEPLOY**
