# 🤖 Automatización de Configuración de Plataformas

**Fecha:** 2026-07-10  
**Objetivo:** Documentar procedimientos automáticos y manuales para configuración de plataformas

---

## ✅ Configuraciones Automatizadas (Completadas)

### 1. Archivos .env Locales ✅ COMPLETADO

**Ejecutado:** Normalización de credenciales en archivos locales

**Archivos actualizados:**
- ✅ `.env.production` - Anon key normalizado
- ✅ `.env` - Anon key y URL normalizados
- ✅ `.env.local` - OpenWeather API key agregado

**Script equivalente:**
```bash
# Normalizar anon keys
sed -i 's/sb_publishable_PLACEHOLDER/JWT_ANON_KEY_PLACEHOLDER/g' .env.production
sed -i 's/sb_publishable_PLACEHOLDER/JWT_ANON_KEY_PLACEHOLDER/g' .env
sed -i 's/https:\/\/tu-proyecto.supabase.co/https:\/\/neygzluxugodiwcuctbj.supabase.co/g' .env

# Agregar OpenWeather API key
echo "VITE_OPENWEATHER_API_KEY=[CONFIGURADO]" >> .env.local
echo "VITE_OPENWEATHER_API_KEY=[CONFIGURADO]" >> .env.production
```

### 2. GitHub Secrets ✅ COMPLETADO

**Ejecutado:** Agregado SUPABASE_DB_URL a GitHub Secrets

**Comando ejecutado:**
```bash
echo "postgresql://postgres:DB_PASSWORD_PLACEHOLDER@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres" | gh secret set SUPABASE_DB_URL
```

**Resultado:** ✅ Secret agregado exitosamente

---

## ⚠️ Configuraciones Requieren Intervención Manual

### 1. Vercel Environment Variables

**Estado:** ⚠️ **REQUIERE INTERVENCIÓN MANUAL EN WEB**

**Razón:** La CLI de Vercel requiere interacción interactiva para agregar variables de entorno con valores específicos.

**Procedimiento Manual:**

1. **Ir a Vercel Dashboard:**
   - URL: https://vercel.com/proyectoswm/construsmart-wm2026/settings/environment-variables
   - Navegar a Settings → Environment Variables

2. **Agregar Variable:**
   - Click en "Add New"
   - Name: `VITE_OPENWEATHER_API_KEY`
   - Value: `[CONFIGURADO]`
   - Environments: `Preview` y `Production`
   - Click "Save"

3. **Variables Actuales (ya configuradas):**
   - ✅ VITE_SUPABASE_KEY
   - ✅ SUPABASE_DB_URL
   - ✅ VITE_SUPABASE_SERVICE_ROLE_KEY
   - ✅ VITE_ADMIN_EMAIL
   - ✅ VITE_APP_ENV
   - ✅ VITE_SUPABASE_URL

### 2. Google Cloud Console (Google Auth)

**Estado:** ⚠️ **REQUIERE INTERVENCIÓN MANUAL EN WEB**

**Razón:** Google OAuth no tiene API para configuración automatizada de authorized origins/redirects.

**Procedimiento Manual:**

1. **Ir a Google Cloud Console:**
   - URL: https://console.cloud.google.com/apis/credentials
   - Seleccionar proyecto OAuth 2.0

2. **Configurar Authorized JavaScript Origins:**
   - Editar OAuth 2.0 Client ID
   - Agregar: `http://localhost:8080`
   - Agregar: `http://localhost:5173`
   - Agregar: `https://construsmart-wm2026.vercel.app`
   - Agregar: `https://construsmart-wm2026-proyectoswm.vercel.app`
   - Agregar: `https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app`

3. **Configurar Authorized Redirect URIs:**
   - Agregar las mismas URLs que en Authorized JavaScript Origins

### 3. Supabase Authentication

**Estado:** ⚠️ **REQUIERE INTERVENCIÓN MANUAL EN WEB**

**Razón:** Supabase no tiene API para configuración automatizada de autenticación.

**Procedimiento Manual:**

1. **Ir a Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/auth/providers

2. **Configurar Site URL:**
   - Settings → Authentication → Site URL
   - Value: `https://construsmart-wm2026.vercel.app`

3. **Configurar Redirect URLs:**
   - Settings → Authentication → Redirect URLs
   - Agregar: `http://localhost:8080`
   - Agregar: `http://localhost:5173`
   - Agregar: `https://construsmart-wm2026.vercel.app`
   - Agregar: `https://construsmart-wm2026-proyectoswm.vercel.app`
   - Agregar: `https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app`

4. **Configurar Google Provider:**
   - Authentication → Providers → Google
   - Enabled: ON
   - Client ID: (obtenido de Google Cloud Console)
   - Client Secret: (obtenido de Google Cloud Console)

---

## 📊 Resumen de Automatización

| Plataforma | Método | Estado | Variables |
|------------|--------|--------|-----------|
| **Archivos .env** | Script bash | ✅ Automatizado | 3 archivos corregidos |
| **GitHub Secrets** | GitHub CLI | ✅ Automatizado | 1 variable agregada |
| **Vercel Env Vars** | Web UI | ⚠️ Manual | 1 variable pendiente |
| **Google Auth** | Web UI | ⚠️ Manual | 5 URLs pendientes |
| **Supabase Auth** | Web UI | ⚠️ Manual | 6 URLs pendientes |

---

## 🔧 Script de Verificación

**Script para verificar configuraciones:**
```bash
#!/bin/bash

echo "🔍 Verificando configuraciones..."

# Verificar archivos .env
echo "📁 Archivos .env:"
if grep -q "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .env.production; then
    echo "✅ .env.production: Anon key normalizado"
else
    echo "❌ .env.production: Anon key no normalizado"
fi

if grep -q "VITE_OPENWEATHER_API_KEY" .env.local; then
    echo "✅ .env.local: OpenWeather API key configurado"
else
    echo "❌ .env.local: OpenWeather API key no configurado"
fi

# Verificar GitHub Secrets
echo "🔐 GitHub Secrets:"
if gh secret list | grep -q "SUPABASE_DB_URL"; then
    echo "✅ SUPABASE_DB_URL: Configurado"
else
    echo "❌ SUPABASE_DB_URL: No configurado"
fi

# Verificar Vercel Env Vars
echo "🌐 Vercel Environment Variables:"
if npx vercel env ls | grep -q "VITE_OPENWEATHER_API_KEY"; then
    echo "✅ VITE_OPENWEATHER_API_KEY: Configurado"
else
    echo "❌ VITE_OPENWEATHER_API_KEY: No configurado"
fi

echo "📊 Verificación completada"
```

---

## 🎯 Checklist Final

### Automatizado ✅
- [x] Normalizar anon keys en archivos .env
- [x] Agregar OpenWeather API key a archivos locales
- [x] Agregar SUPABASE_DB_URL a GitHub Secrets

### Manual ⏳
- [ ] Agregar VITE_OPENWEATHER_API_KEY en Vercel Dashboard
- [ ] Configurar Authorized Origins en Google Cloud Console
- [ ] Configurar Redirect URIs en Google Cloud Console
- [ ] Configurar Site URL en Supabase Dashboard
- [ ] Configurar Redirect URLs en Supabase Dashboard
- [ ] Configurar Google Provider en Supabase Dashboard

---

## 📝 Notas Técnicas

### Limitaciones de Automatización

**Vercel CLI:**
- El comando `vercel env add` requiere interacción interactiva
- No hay opción `--non-interactive` para agregar variables con valores específicos
- Solución alternativa: Usar Vercel Dashboard web

**Google Cloud Console:**
- No hay API pública para configuración de OAuth 2.0 Client IDs
- La configuración requiere navegación manual en la consola web
- Solución alternativa: Usar Google Cloud Console web

**Supabase Dashboard:**
- No hay API para configuración de autenticación
- La configuración requiere navegación manual en el dashboard
- Solución alternativa: Usar Supabase Dashboard web

### Futuras Mejoras

1. **Vercel API:**
   - Usar Vercel REST API para configuración de variables
   - Requiere VERCEL_TOKEN con permisos de escritura

2. **Google Cloud SDK:**
   - Usar gcloud CLI para configuración de OAuth
   - Requiere autenticación y permisos de IAM

3. **Supabase CLI:**
   - Usar Supabase CLI para configuración de auth
   - Requiere SERVICE_ROLE_KEY con permisos de admin

---

**Última actualización:** 2026-07-10  
**Estado:** 3/6 configuraciones automatizadas, 3/6 requieren intervención manual  
**Próxima acción:** Completar configuraciones manuales en Vercel, Google y Supabase
