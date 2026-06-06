# ✅ CHECKLIST DE DEPLOY — ERP CONSTRUSMART

**Última actualización:** 2026-06-07  
**Status:** 🟢 LISTO PARA DEPLOY  
**Estimado:** 40-50 min total

---

## 🔧 PRE-DEPLOY CHECKLIST (30 min)

### 1️⃣ Verificar Build (5 min)
```bash
cd c:\Users\wilso\Documents\APPS\ERP EMPRESARIAL CONSTRUSMART -WM FAMOUS\CONSTRUSMART
npm run build
```

**Verificar resultado:**
- [ ] ✅ 0 errores de compilación
- [ ] ✅ 0 errores críticos
- [ ] ✅ Advertencias normales solo de `use client` (antd)
- [ ] ✅ Archivos compilados en `dist/`

**Si hay errores:** STOP — no continuar

---

### 2️⃣ Ejecutar Tests (5 min)
```bash
npm run test
```

**Verificar resultado:**
- [ ] ✅ 76/76 tests pasando
- [ ] ✅ 0 tests fallando
- [ ] ✅ Sin timeouts

**Si tests fallan:** STOP — revisar errores

---

### 3️⃣ Testing Manual - Cascada P1: Validación Stock (5 min)

**Escenario:** Intenta crear vale sin stock suficiente

1. Abre app en http://localhost:8080
2. Ve a **Bodega** → **Vales de Salida** → **+ Nuevo Vale**
3. Selecciona material (ej: "Acero") con stock actual = 5
4. Intenta agregar cantidad = 10
5. Click **Guardar**

**Resultado esperado:**
- [ ] ✅ Error bloqueante: "Stock insuficiente: Acero..."
- [ ] ✅ Vale NO se crea
- [ ] ✅ Mensaje de error visible

**Si no hay error:** STOP — revisar store.tsx:2067

---

### 4️⃣ Testing Manual - Cascada P2: OC → Stock (5 min)

**Escenario:** Marcar OC como recibida incrementa stock

1. Ve a **Bodega** → **Órdenes de Compra** → **+ Nueva OC**
2. Crear OC: Material "Concreto" × 50 unidades
3. Nota stock actual de Concreto (ej: 10)
4. Marca OC como **"Aprobada"** o **"Recibida"**
5. Ve a **Bodega** → **Materiales** → Busca "Concreto"

**Resultado esperado:**
- [ ] ✅ Stock de Concreto = 10 + 50 = 60
- [ ] ✅ Cambio fue automático (no manual)
- [ ] ✅ OC solo suma una vez

**Si stock no cambió:** STOP — revisar store.tsx:1993

---

### 5️⃣ Testing Manual - AuthGuard: Bloquear Acceso (5 min)

**Escenario:** Usuario Bodeguero NO puede acceder a Financiero

1. Abre DevTools (F12) → Console
2. Simula Bodeguero: `localStorage.setItem('wm_erp_data_user', JSON.stringify({..., rol: 'Bodeguero'}))`
3. Recarga página
4. Intenta ir a **Financiero**

**Resultado esperado:**
- [ ] ✅ Redirige automáticamente a Login
- [ ] ✅ NO muestra pantalla de Financiero
- [ ] ✅ Mensaje "Sin permisos" o similar

**Si accede a Financiero:** STOP — revisar AppLayout.tsx:117

---

### 6️⃣ Testing Manual - AuthGuard: Permitir Acceso (3 min)

**Escenario:** Usuario Bodeguero SÍ puede acceder a Bodega

1. Simula Bodeguero (mismo paso anterior)
2. Intenta ir a **Bodega**

**Resultado esperado:**
- [ ] ✅ Se carga pantalla de Bodega
- [ ] ✅ NO redirige a Login
- [ ] ✅ Funciona normalmente

**Si redirige:** STOP — revisar AppLayout.tsx:128

---

## 🗄️ OPERACIÓN SUPABASE (5 min)

### 7️⃣ Ejecutar Migraciones SQL

**Ubicación:** Supabase Dashboard → SQL Editor

1. Login en https://app.supabase.com/
2. Ve a tu proyecto `erp-construsmart`
3. **SQL Editor** (lado izquierdo)
4. En orden, ejecuta cada migración:

#### Migración 1: seed_data.sql
```sql
-- Copiar contenido de supabase/migrations/000000000004_seed_data.sql
-- Pegar en SQL Editor → Ejecutar (Ctrl+Enter)
```
- [ ] ✅ Sin errores
- [ ] ✅ Mensaje "Success"

#### Migración 2: vales_salida.sql
```sql
-- Copiar contenido de supabase/migrations/000000000006_add_vales_salida_and_fixes.sql
-- Pegar en SQL Editor → Ejecutar
```
- [ ] ✅ Sin errores

#### Migración 3: avatar_roles.sql
```sql
-- Copiar contenido de supabase/migrations/000000000007_add_avatar_and_fix_roles.sql
-- Pegar en SQL Editor → Ejecutar
```
- [ ] ✅ Sin errores

#### Migración 4: pausado_status.sql
```sql
-- Copiar contenido de supabase/migrations/000000000008_add_pausado_status.sql
-- Pegar en SQL Editor → Ejecutar
```
- [ ] ✅ Sin errores

**Si alguna migración falla:** STOP — revisar SQL y sintaxis

---

## 🚀 DEPLOY (10 min)

### 8️⃣ Push a Vercel

```bash
cd c:\Users\wilso\Documents\APPS\ERP EMPRESARIAL CONSTRUSMART -WM FAMOUS\CONSTRUSMART
git add .
git commit -m "Deploy: auditoría exhaustiva completada, app lista 2026-06-07"
git push origin main
```

**Verificar:**
- [ ] ✅ Push exitoso (sin errores de conflicto)
- [ ] ✅ Vercel inicia build automáticamente

---

### 9️⃣ Esperar Deploy de Vercel (5-10 min)

1. Ve a https://vercel.com/dashboard
2. Selecciona proyecto `erp-construsmart`
3. Espera a que termina el build (verde = success)

**Verificar:**
- [ ] ✅ Build completado sin errores
- [ ] ✅ URL de deploy: https://erp-construsmart-wm.vercel.app/

**Si build falla:** Revisar logs en Vercel → corregir → push de nuevo

---

### 🔟 Verificar Deploy en Producción (5 min)

1. Abre https://erp-construsmart-wm.vercel.app/ en navegador incógnito
2. Login con credenciales de test

**Verificar:**
- [ ] ✅ App carga correctamente
- [ ] ✅ Dashboard muestra KPIs
- [ ] ✅ Sidebar con todos los módulos
- [ ] ✅ Dark mode funciona (si está habilitado)
- [ ] ✅ No hay errores en Console (F12)

**Pruebas rápidas:**
- [ ] ✅ Navega a Bodega → carga datos
- [ ] ✅ Navega a Proyectos → carga proyectos
- [ ] ✅ Intenta crear proyecto (sin guardar) → form funciona
- [ ] ✅ Cierra sesión → redirige a Login

**Si algo falla:** Revisar logs de Vercel → corregir → deploy de nuevo

---

## 📋 POST-DEPLOY CHECKLIST (OPCIONAL)

Estos items NO bloquean el deploy, pueden hacerse después:

### 🔐 Google OAuth Domain Verification (10 min)

1. Ve a Google Cloud Console → OAuth 2.0 Client IDs
2. Agrega dominio a "Authorized JavaScript origins":
   - `https://erp-construsmart-wm.vercel.app`
3. Agrega "Authorized redirect URIs":
   - `https://neygzluxugodiwcuctbj.supabase.co/auth/v1/callback?provider=google`

- [ ] ✅ Dominios agregados sin errores
- [ ] ✅ OAuth login funciona en producción

### 🔄 Refresh Token Rotation (1 hora, OPCIONAL)

**Ubicación:** `src/lib/supabase.ts`

Implementar lógica para renovar tokens automáticamente cada 50 min

- [ ] ✅ Tokens se renuevan sin desloguear usuario

### ⚡ Virtual Scrolling (3 horas, OPCIONAL)

**Ubicación:** `src/erp/screens/Bodega.tsx`

Agregar windowing library para tablas con >1000 rows

- [ ] ✅ Performance mejora en tablas grandes

---

## 📊 RESULTADO FINAL

Cuando TODOS los items estén checkeados ✅ :

```
🎉 ¡DEPLOY EXITOSO!

App CONSTRUSMART está en PRODUCCIÓN:
👉 https://erp-construsmart-wm.vercel.app/

Status:
✅ Build: 0 errores
✅ Tests: 76/76 pasando
✅ Cascadas: 100% funcionales
✅ Seguridad: 100% implementada
✅ i18n: 672+ keys
✅ Usuarios: 5 roles con permisos
✅ Datos: Migraciones ejecutadas
```

---

## 🚨 TROUBLESHOOTING

### ❌ "Build falla con errores"
- Revisar `npm run build` output
- Buscar línea con rojo 🔴
- Corregir y `git push` de nuevo

### ❌ "Tests no pasan (76/76 → X/76)"
- Revisar `npm run test` output
- Corregir código
- Rerun: `npm run test`

### ❌ "Stock no suma en OC"
- Revisar store.tsx línea 1993
- Verificar que `updateOrden` se llama con `estado: 'aprobado'`
- Debug en Console: `localStorage.getItem('wm_erp_data_materiales')`

### ❌ "AuthGuard no bloquea"
- Revisar AppLayout.tsx línea 117
- Verificar que `user` existe en localStorage
- Revisar `allowedViews` tiene valores correctos

### ❌ "Vercel build falla pero npm run build funciona"
- Problema típico: variables de entorno `.env` no definidas
- Ve a Vercel → Project Settings → Environment Variables
- Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY`
- Retrigger deploy

---

## ✅ FIRMA FINAL

Cuando completes TODOS los items, firmar:

```
Completado por: _____________________
Fecha: 2026-06-07
Hora: ________
App Status: ✅ PRODUCCIÓN
```

---

**Documento:** Checklist Deploy ERP CONSTRUSMART
**Creado:** 2026-06-07
**Versión:** 1.0 (Auditoría exhaustiva)
**Próxima revisión:** Post-deploy (24h)
