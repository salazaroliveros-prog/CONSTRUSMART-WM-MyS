# 🔐 Configuración de Google OAuth en Supabase

## ⚠️ Problema Actual
El login con Google regresaba al login después de OAuth redirect. **SOLUCIONADO** con el fix en `src/erp/store.tsx`.

Sin embargo, para que Google OAuth funcione completamente, necesita estar configurado en Supabase con los Redirect URLs correctos.

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

### 3. **Configurar Redirect URLs**

En Supabase → Authentication → URL Configuration:

```
Site URL: http://localhost:5173  (para desarrollo local)
Redirect URLs: 
  - http://localhost:5173
  - http://localhost:5173/
  - https://tu-dominio.com  (producción)
  - https://tu-dominio.com/
```

**Importante:** El `redirectTo` en el código React debe coincidir exactamente:
```typescript
redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
```

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
   http://localhost:5173
   http://localhost
   https://tu-dominio.com
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

1. Abre http://localhost:5173
2. Haz clic en "Continuar con Google"
3. Selecciona la cuenta de Gmail
4. Verifica que redirige a **Dashboard**, no al Login

### Test 2: Verificar sesión en navegador
```javascript
// Abre DevTools Console y ejecuta:
import { supabase } from './src/lib/supabase.ts'
const { data: { session } } = await supabase.auth.getSession()
console.log(session)
```

Deberías ver:
- ✅ `user.id` (UUID del usuario)
- ✅ `user.email` (email del usuario)
- ✅ `user.user_metadata.nombre` (tu nombre si lo configuraste)
- ✅ `user.user_metadata.rol` (tu rol: Administrador, Gerente, etc.)

### Test 3: Verificar Base de Datos
En Supabase → SQL Editor, ejecuta:
```sql
SELECT id, email, user_metadata FROM auth.users LIMIT 5;
```

Deberías ver tus usuarios de Google creados.

---

## 🔧 Troubleshooting

### ❌ "Error: Callback URL mismatch"
**Solución:** El Redirect URI en Google Cloud Console NO coincide con Supabase.
- En Google Cloud: `https://neygzluxugodiwcuctbj.supabase.co/auth/v1/callback?provider=google`
- En Supabase: Redirect URLs deben incluir `http://localhost:5173`

### ❌ "Cannot read property 'signInWithOAuth' of Object"
**Solución:** Variables de entorno no están cargadas.
```bash
# Verifica que .env tiene:
VITE_SUPABASE_URL=https://neygzluxugodiwcuctbj.supabase.co
VITE_SUPABASE_KEY=eyJhbGc...  (sin el @ al inicio)
```

### ❌ "User created but not logged in"
**Solución:** El listener de auth no se ejecutó. Verificado con el fix en `store.tsx`.

---

## 📝 Variables de Entorno Actuales

```env
VITE_SUPABASE_URL=https://neygzluxugodiwcuctbj.supabase.co
VITE_SUPABASE_KEY=JWT_ANON_KEY_PLACEHOLDER
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

---

## 📚 Referencias Oficiales

- [Supabase Auth Providers](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Configuration](https://app.supabase.com/)

