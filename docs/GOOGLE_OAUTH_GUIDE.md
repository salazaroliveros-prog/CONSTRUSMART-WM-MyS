# Guía de Configuración Google OAuth - CONSTRUSMART ERP

## Overview

La ERP usa **Google OAuth** como único proveedor de autenticación. Esta guía cubre la configuración completa en Google Cloud Console y Supabase.

---

## Paso 1: Configurar Google Cloud Console

### 1.1 Crear Proyecto en Google Cloud

1. Ir a https://console.cloud.google.com/
2. Click en "Select a project" → "NEW PROJECT"
3. Nombre del proyecto: `CONSTRUSMART-ERP`
4. Click "CREATE"
5. Esperar a que se cree el proyecto (2-3 minutos)

### 1.2 Habilitar Google+ API

1. En el proyecto creado, ir a "APIs & Services" → "Library"
2. Buscar "Google+ API"
3. Click en "Google+ API"
4. Click "ENABLE"

### 1.3 Crear OAuth 2.0 Credentials

1. Ir a "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. **Configurar consent screen** (si es la primera vez):
   - Click "CONFIGURE CONSENT SCREEN"
   - Seleccionar "External" → "Create"
   - **App information**:
     - App name: `CONSTRUSMART ERP`
     - User support email: `salazaroliveros@gmail.com`
     - Developer contact: `salazaroliveros@gmail.com`
   - Click "SAVE AND CONTINUE"
   - Skip "Scopes" (no agregar scopes) → "SAVE AND CONTINUE"
   - Skip "Test users" → "SAVE AND CONTINUE"
   - Click "BACK TO DASHBOARD"

4. **Crear OAuth Client ID**:
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `CONSTRUSMART ERP Web`
   - **Authorized redirect URIs** (agregar estas):
     ```
     https://neygzluxugodiwcuctbj.supabase.co/auth/v1/callback
     https://construsmart-wm2026.vercel.app/auth/callback
     http://localhost:5173/auth/callback
     ```
   - Click "CREATE"

5. **Guardar credenciales**:
   - Copiar **Client ID** (guárdalo para Supabase)
   - Copiar **Client Secret** (guárdalo para Supabase)
   - Click "OK"

---

## Paso 2: Configurar Supabase

### 2.1 Habilitar Google Auth en Supabase

1. Ir a Supabase Dashboard → Proyecto `neygzluxugodiwcuctbj`
2. Ir a "Authentication" → "Providers"
3. Habilitar "Google":
   - Click en "Google"
   - Toggle "Enable Sign in with Google" → ON
4. **Configurar credenciales**:
   - **Client ID**: Pegar el Client ID de Google Cloud Console
   - **Client Secret**: Pegar el Client Secret de Google Cloud Console
   - **Redirect URL**: `https://construsmart-wm2026.vercel.app/auth/callback`
5. Click "Save"

### 2.2 Configurar Site URL

1. En Supabase Dashboard → "Authentication" → "URL Configuration"
2. **Site URL**: `https://construsmart-wm2026.vercel.app`
3. **Redirect URLs** (agregar):
   ```
   https://construsmart-wm2026.vercel.app/auth/callback
   http://localhost:5173/auth/callback
   ```
4. Click "Save"

---

## Paso 3: Configurar Dominio en Google Cloud (Opcional pero Recomendado)

### 3.1 Verificar Dominio

1. En Google Cloud Console → "APIs & Services" → "Credentials"
2. Click en el OAuth Client ID creado
3. **Authorized domains** (agregar):
   ```
   construsmart-wm2026.vercel.app
   neygzluxugodiwcuctbj.supabase.co
   localhost
   ```
4. Click "Save"

---

## Paso 4: Verificar Configuración

### 4.1 Verificar en Supabase

1. Ir a Supabase Dashboard → "Authentication" → "Providers"
2. Verificar que Google esté habilitado (toggle ON)
3. Verificar que Client ID y Client Secret estén configurados

### 4.2 Verificar en App Local

1. Iniciar app local:
```bash
npm run dev
```

2. Navegar a `http://localhost:5173`
3. Click en "Login with Google"
4. **Esperado**:
   - Redirige a Google OAuth
   - Muestra pantalla de consentimiento de Google
   - Redirige de vuelta a la app
   - Usuario autenticado correctamente

### 4.3 Verificar en Producción

1. Deploy a Vercel:
```bash
git add .
git commit -m "Configure Google OAuth"
git push origin main
```

2. Navegar a `https://construsmart-wm2026.vercel.app`
3. Click en "Login with Google"
4. **Esperado**: Mismo flujo que en local

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Causa**: Redirect URL no está configurada en Google Cloud Console  
**Solución**: 
- Agregar la URL correcta en "Authorized redirect URIs"
- Verificar que coincida exactamente (sin trailing slash)

### Error: "unauthorized_client"
**Causa**: Client ID incorrecto o no autorizado  
**Solución**:
- Verificar que el Client ID en Supabase coincida con Google Cloud Console
- Regenerar credenciales si es necesario

### Error: "access_denied"
**Causa**: Usuario denegó acceso o app no verificada  
**Solución**:
- En desarrollo: Agregar email como "Test user" en Google Cloud Console
- En producción: Verificar app en Google Cloud Console

### Error: "400 bad_request"
**Causa**: Error en configuración de OAuth  
**Solución**:
- Verificar todas las URLs configuradas
- Verificar que no haya espacios extra
- Regenerar credenciales

---

## Checklist de Configuración

### Google Cloud Console:
- [ ] Proyecto creado
- [ ] Google+ API habilitada
- [ ] OAuth Client ID creado
- [ ] Redirect URIs configuradas
- [ ] Client ID y Secret guardados

### Supabase:
- [ ] Google provider habilitado
- [ ] Client ID configurado
- [ ] Client Secret configurado
- [ ] Redirect URL configurada
- [ ] Site URL configurada

### Verificación:
- [ ] Login funciona en local
- [ ] Login funciona en producción
- [ ] Usuario se autentica correctamente
- [ ] Session persiste al refresh

---

## Notas de Seguridad

### Best Practices:
1. ✅ Nunca compartir Client Secret públicamente
2. ✅ Usar HTTPS en producción (obligatorio)
3. ✅ Rotar credenciales periódicamente
4. ✅ Monitorear logs de autenticación en Supabase
5. ✅ Limitar acceso a emails específicos si es necesario

### Rotación de Credenciales:
1. Google Cloud Console → Credentials
2. Crear nuevo OAuth Client ID
3. Actualizar credenciales en Supabase
4. Deploy a producción
5. Verificar que login funciona
6. Eliminar credenciales antiguas

---

## Configuración Adicional: Restringir Acceso por Email

Para restringir acceso solo a emails específicos:

### 1. En Supabase:

```sql
-- En SQL Editor
CREATE POLICY "Solo emails permitidos pueden insertar usuarios"
ON auth.users
FOR INSERT
WITH CHECK (
  email IN (
    'salazaroliveros@gmail.com',
    'otro-email@construsmart.com'
  )
);
```

### 2. En Código (src/erp/store.tsx):

```typescript
// En signInWithGoogle
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
});

// Verificar email después de login
if (data.user?.email) {
  const allowedEmails = ['salazaroliveros@gmail.com'];
  if (!allowedEmails.includes(data.user.email)) {
    await supabase.auth.signOut();
    throw new Error('Email no autorizado');
  }
}
```

---

**Última actualización**: 2026-07-19
**Proveedor**: Google OAuth 2.0
**Redirect URL**: https://construsmart-wm2026.vercel.app/auth/callback
