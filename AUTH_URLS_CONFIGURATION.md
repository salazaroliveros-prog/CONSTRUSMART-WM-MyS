# 🔐 Configuración de URLs para Google Auth y Supabase

**Fecha:** 2026-07-10  
**Proyecto:** CONSTRUSMART ERP  
**Método de Autenticación:** Supabase Auth con Google OAuth

---

## 📋 Resumen de URLs del Proyecto

### URLs de Desarrollo
- **Local:** `http://localhost:8080`
- **Local (puerto alternativo):** `http://localhost:5173` (Vite default)

### URLs de Producción (Vercel)
- **Principal:** `https://construsmart-wm2026.vercel.app`
- **Proyectoswm:** `https://construsmart-wm2026-proyectoswm.vercel.app`
- **Personal:** `https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app`

---

## 🌐 Google Cloud Console (Google Auth)

Las siguientes URLs deben estar configuradas en tu proyecto de Google Cloud Console:

### 1. OAuth 2.0 Client IDs

**Configuración en:** Google Cloud Console → APIs & Services → Credentials

#### Authorized JavaScript Origins
```
http://localhost:8080
http://localhost:5173
https://construsmart-wm2026.vercel.app
https://construsmart-wm2026-proyectoswm.vercel.app
https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app
```

#### Authorized Redirect URIs
```
http://localhost:8080
http://localhost:5173
https://construsmart-wm2026.vercel.app
https://construsmart-wm2026-proyectoswm.vercel.app
https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app
```

### 2. Google OAuth Consent Screen

**Configuración en:** Google Cloud Console → APIs & Services → OAuth consent screen

- **Application Type:** Internal (para uso empresarial) o External (para público)
- **App Name:** CONSTRUSMART ERP
- **User Support Email:** salazaroliveros@gmail.com
- **Developer Contact:** salazaroliveros@gmail.com

### 3. Scopes Requeridos

Los scopes necesarios para la autenticación:
- `openid`
- `email`
- `profile`

---

## 🔷 Supabase Authentication

Las siguientes URLs deben estar configuradas en tu proyecto de Supabase:

### 1. Site URL

**Configuración en:** Supabase Dashboard → Project Settings → Authentication → Site URL

```
https://construsmart-wm2026.vercel.app
```

### 2. Redirect URLs

**Configuración en:** Supabase Dashboard → Project Settings → Authentication → Redirect URLs

```
http://localhost:8080
http://localhost:5173
https://construsmart-wm2026.vercel.app
https://construsmart-wm2026-proyectoswm.vercel.app
https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app
```

### 3. Google OAuth Provider

**Configuración en:** Supabase Dashboard → Authentication → Providers → Google

#### Configuración Requerida:
- **Enabled:** ON
- **Client ID:** (Obtenido de Google Cloud Console)
- **Client Secret:** (Obtenido de Google Cloud Console)
- **Redirect URL:** (Generado automáticamente por Supabase)

#### URL de Callback de Supabase (Generada automáticamente):
```
https://neygzluxugodiwcuctbj.supabase.co/auth/v1/callback
```

---

## 🔄 Flujo de Autenticación

### 1. Usuario hace clic en "Sign in with Google"
```
Usuario → Supabase Auth → Google OAuth → Google Consent Screen
```

### 2. Usuario autoriza la aplicación
```
Google → Supabase Callback → Tu Aplicación (Site URL)
```

### 3. Redirección final
```
Supabase → window.location.origin → Dashboard de la aplicación
```

---

## 📝 Notas Importantes

### Para Desarrollo Local
1. **Google Cloud Console:** Agregar `http://localhost:8080` y `http://localhost:5173`
2. **Supabase:** Agregar las mismas URLs de localhost
3. **Aplicación:** Usar `window.location.origin` como redirect URL

### Para Producción
1. **Google Cloud Console:** Agregar todas las URLs de Vercel
2. **Supabase:** Configurar Site URL a la URL principal de Vercel
3. **Supabase:** Agregar todas las URLs de Vercel como Redirect URLs

### Security Considerations
- **Solo HTTPS en producción:** Google requiere HTTPS para URLs de producción
- **Wildcards no permitidos:** Google no acepta wildcards como `*.vercel.app`
- **URLs exactas:** Cada dominio debe ser agregado individualmente

---

## 🛠️ Troubleshooting

### Error: "redirect_uri_mismatch"
**Causa:** La URL de redirección no está configurada en Google Cloud Console  
**Solución:** Agregar la URL exacta en Authorized Redirect URIs

### Error: "unauthorized_client"
**Causa:** El Client ID de Google no está configurado en Supabase  
**Solución:** Configurar el Client ID y Secret en Supabase → Providers → Google

### Error: "Invalid redirect_uri"
**Causa:** La URL no está en la lista de Redirect URLs de Supabase  
**Solución:** Agregar la URL en Supabase → Authentication → Redirect URLs

---

## 📋 Checklist de Configuración

### Google Cloud Console
- [ ] Crear proyecto OAuth 2.0
- [ ] Configurar OAuth Consent Screen
- [ ] Crear OAuth 2.0 Client ID
- [ ] Agregar Authorized JavaScript Origins (todas las URLs)
- [ ] Agregar Authorized Redirect URIs (todas las URLs)
- [ ] Copiar Client ID y Client Secret

### Supabase
- [ ] Configurar Site URL (URL principal de producción)
- [ ] Agregar Redirect URLs (todas las URLs)
- [ ] Habilitar Google Provider
- [ ] Configurar Client ID (de Google Cloud Console)
- [ ] Configurar Client Secret (de Google Cloud Console)
- [ ] Verificar que el callback URL sea correcto

### Aplicación
- [ ] Verificar que `VITE_SUPABASE_URL` esté configurado
- [ ] Verificar que `VITE_SUPABASE_KEY` esté configurado
- [ ] Verificar que `signInWithGoogle` use `window.location.origin`
- [ ] Probar autenticación en desarrollo local
- [ ] Probar autenticación en producción

---

## 🔗 Referencias

- **Google Cloud Console:** https://console.cloud.google.com
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Documentación Supabase Auth:** https://supabase.com/docs/guides/auth/social-login/auth-google
- **Documentación Google OAuth:** https://developers.google.com/identity/protocols/oauth2

---

**Última actualización:** 2026-07-10  
**Estado:** Configuración requerida para Google Auth + Supabase OAuth
