# 🔐 Configuración de Google OAuth en Supabase

## ⚠️ Problema Actual
El login con Google regresaba al login después de OAuth redirect. **Causa encontrada:** El `Site URL` en Supabase Dashboard está configurado como `http://localhost:5173` pero la app corre en **`http://localhost:8080`** (según `vite.config.ts`). Cuando Supabase redirige después del OAuth, como el puerto no coincide, la sesión nunca se recupera.

### Fix aplicado en código:
- ✅ `src/lib/supabase.ts`: Se agregó `auth: { flowType: 'pkce' }` explícito
- ✅ `src/erp/store.tsx`: Se agregó `exchangeCodeForSession()` explícito para manejo OAuth PKCE

### Pendiente (dashboard):
- [ ] Actualizar `Site URL` en Supabase Dashboard → Authentication → URL Configuration

---

## ✅ Checklist de Configuración

### 1. **Acceder a la consola de Supabase**
```
https://app.supabase.com/
```
- Selecciona el proyecto: `neygzluxugodiwcuctbj`

### 2. **Configurar Google OAuth en Supabase**

#### Ruta:
```
Authentication → Providers → Google
```

#### Verificar que esté habilitado ✅
- [ ] Toggle de "Google" está **ON**
- [ ] `Client ID` está configurado (obtenido de Google Cloud Console)
- [ ] `Client Secret` está configurado

### 3. **Configurar Redirect URLs** ⚠️ CRÍTICO

En Supabase → Authentication → URL Configuration:

```
Site URL: http://localhost:8080  (NO 5173 — la app corre en 8080)
Redirect URLs:
  - http://localhost:8080
  - http://localhost:8080/**
  - https://erp-construsmart-wm-app-01.vercel.app  (producción)
  - https://erp-construsmart-wm-app-01.vercel.app/**
```

El `redirectTo` en el código usa `window.location.origin` (resuelve a `http://localhost:8080` en dev).

### 4. **Obtener Google OAuth Credentials**

#### A. Ir a Google Cloud Console
```
https://console.cloud.google.com/
```

#### B. Crear OAuth 2.0 Client ID (si no lo tienes)
1. Ir a: **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
2. Seleccionar tipo: **Web application**
3. Authorized JavaScript origins:
   ```
   http://localhost:8080
   http://localhost
   https://erp-construsmart-wm-app-01.vercel.app
   ```
4. Authorized redirect URIs:
   ```
   https://neygzluxugodiwcuctbj.supabase.co/auth/v1/callback?provider=google
   ```

#### C. Copiar las credenciales
- **Client ID**: copiar
- **Client Secret**: copiar

#### D. Pegar en Supabase
```
Supabase → Authentication → Providers → Google
  - Client ID: <pegar aquí>
  - Client Secret: <pegar aquí>
  - [✓] Save
```

---

## 🧪 Pruebas

### Test 1: Login Local
```bash
npm run dev
```

1. Abre http://localhost:8080
2. Haz clic en "Continuar con Google"
3. Selecciona la cuenta de Gmail
4. Verifica que redirige a **Dashboard**, no al Login

### Test 2: Verificar sesión en navegador
Abre DevTools Console (F12) y busca estos logs:
- `"OAuth PKCE code detected, exchanging..."` — detectó el código
- `"Code exchange successful for: ..."` — intercambio exitoso
- `"Supabase Auth Event: SIGNED_IN ..."` — sesión establecida

### Test 3: Verificar perfiles en BD
En Supabase → SQL Editor:
```sql
SELECT id, email, rol FROM public.profiles LIMIT 5;
```

---

## 🔧 Troubleshooting

### ❌ "Error: Callback URL mismatch"
**Solución:** El Redirect URI en Google Cloud Console NO coincide con Supabase.
- En Google Cloud: `https://neygzluxugodiwcuctbj.supabase.co/auth/v1/callback?provider=google`
- En Supabase: Redirect URLs deben incluir `http://localhost:8080/**`

### ❌ Sigue redirigiendo al login
Verifica en Supabase Dashboard:
1. **Auth → URL Configuration → Site URL** = `http://localhost:8080`
2. **Auth → URL Configuration → Redirect URLs** incluye `http://localhost:8080/**`
3. Mira la consola del navegador para ver los logs de auth

### ❌ "Cannot read property 'signInWithOAuth' of Object"
**Solución:** Variables de entorno no están cargadas.
```bash
# Verifica que .env tiene:
VITE_SUPABASE_URL=https://neygzluxugodiwcuctbj.supabase.co
VITE_SUPABASE_KEY=eyJhbGc...  (sin el @ al inicio)
```

---

## 📝 Variables de Entorno Actuales

```env
VITE_SUPABASE_URL=https://neygzluxugodiwcuctbj.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjA4OTIsImV4cCI6MjA5NTgzNjg5Mn0.IfCMtFbZYL0GDgV_3zwqBmqjCNf3PZfYS-SvbRGXhY0
```

---

## ✨ Estado Final Esperado

Después de completar esta configuración:

✅ Email/Password login funciona  
✅ Google OAuth login funciona  
✅ Usuario ve Dashboard después del login  
✅ Rol se asigna correctamente  
✅ Sesión persiste al recargar la página  
✅ Logout limpia la sesión  
✅ Perfil se crea automáticamente en `public.profiles`  

---

## 📚 Referencias Oficiales

- [Supabase Auth Providers](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Configuration](https://app.supabase.com/)

