# 🤖 Automatización de Configuración de Plataformas con Playwright

Este directorio contiene scripts de automatización usando Playwright para configurar las plataformas del proyecto CONSTRUSMART ERP.

## ⚠️ Importante - Limitaciones Detectadas

Los scripts de Playwright tienen una limitación técnica: **abren una instancia nueva del navegador sin las sesiones del usuario**. Esto significa que aunque ya estés logueado en Google, Supabase y Vercel en tu Chrome normal, Playwright abrirá una instancia nueva donde tendrás que hacer login nuevamente.

## 🎯 Solución Recomendada

**Usa la guía de configuración manual interactiva:** `manual-setup-guide.md`

Esta guía te permite:
- Usar tus sesiones existentes en Chrome
- Completar la configuración en 5-10 minutos
- Evitar problemas técnicos con automatización web

## 📋 Scripts Disponibles (Para Referencia)

### 1. `google-cloud-oauth.spec.ts`
**Propósito:** Configurar Google Cloud Console OAuth 2.0
- Configurar Authorized JavaScript Origins
- Configurar Authorized Redirect URIs
- Client ID: `173954740912-tn6iib9i3179ulv1mn81j3tmarh2ouf4.apps.googleusercontent.com`

### 2. `supabase-auth.spec.ts`
**Propósito:** Configurar Supabase Authentication
- Configurar Site URL
- Configurar Redirect URLs
- Verificar y habilitar Google Provider

### 3. `vercel-env.spec.ts`
**Propósito:** Configurar Vercel Environment Variables
- Configurar `VITE_OPENWEATHER_API_KEY` en ambiente Preview
- Verificar variables existentes

## 🚀 Cómo Usar la Guía Manual

### Paso 1: Abre la guía
```bash
# Abre el archivo de guía
scripts/automation/manual-setup-guide.md
```

### Paso 2: Sigue las instrucciones paso a paso
1. **Google Cloud Console:** Configurar OAuth 2.0
2. **Supabase Authentication:** Configurar Site URL y Redirect URLs
3. **Vercel Environment Variables:** Configurar API key

### Paso 3: Verifica la configuración
Usa los links de verificación en la guía para confirmar que todo está correcto

## 🔧 Si Aún Quieres Usar los Scripts de Playwright

```bash
# Ejecutar un script específico (requiere login manual en instancia nueva)
cd scripts/automation
npx playwright test google-cloud-oauth.spec.ts --headed

# Nota: El navegador se abrirá sin tus sesiones existentes
# Tendrás que hacer login manualmente en cada plataforma
```

## 🎯 URLs Configuradas

### Google Cloud Console
- **Authorized Origins:**
  - `http://localhost:8080`
  - `http://localhost:5173`
  - `https://construsmart-wm2026.vercel.app`

- **Authorized Redirect URIs:**
  - Mismas URLs que Authorized Origins

### Supabase Authentication
- **Site URL:** `https://construsmart-wm2026.vercel.app`
- **Redirect URLs:** Mismas URLs que Google Cloud

### Vercel Environment Variables
- **Variable:** `VITE_OPENWEATHER_API_KEY`
- **Valor:** `OPENWEATHER_API_KEY_PLACEHOLDER`
- **Ambientes:** Preview y Production

## 📊 Resumen de Configuración

| Plataforma | Método | Estado | Tiempo |
|------------|--------|--------|--------|
| Google Cloud Console | Manual (Recomendado) | ⏳ Pendiente | 3-5 min |
| Supabase Authentication | Manual (Recomendado) | ⏳ Pendiente | 2-3 min |
| Vercel Environment Variables | Manual (Recomendado) | ⏳ Pendiente | 1-2 min |
| Scripts Playwright | Automatizado | ✅ Creados | No recomendado |

## 🎉 Próximos Pasos

1. **Sigue la guía manual:** `scripts/automation/manual-setup-guide.md`
2. **Completa la configuración en 5-10 minutos**
3. **Verifica que todo funcione correctamente**
4. **Prueba la autenticación Google OAuth en tu aplicación**

---

**Última actualización:** 2026-07-10  
**Estado:** Guía manual creada (recomendada) + Scripts Playwright (referencia)  
**Tiempo estimado:** 5-10 minutos usando guía manual
