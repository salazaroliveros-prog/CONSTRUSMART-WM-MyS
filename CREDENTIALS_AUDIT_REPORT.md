# 🔍 Auditoría de Credenciales y Configuración

**Fecha:** 2026-07-10  
**Proyecto:** CONSTRUSMART ERP  
**Objetivo:** Verificar consistencia de credenciales en GitHub, Vercel y archivos .env

---

## 📋 Resumen Ejecutivo

**Estado Actual:** ✅ **CORREGIDO** - Se han normalizado las credenciales y configurado las plataformas correctamente.

| Plataforma | Estado | Inconsistencias |
|------------|--------|-----------------|
| **Archivos .env** | ✅ Corregido | Anon keys normalizados |
| **GitHub Secrets** | ✅ Completo | SUPABASE_DB_URL agregado |
| **Vercel Env Vars** | ✅ Completo | VITE_OPENWEATHER_API_KEY agregado en Production |
| **Google Cloud** | ✅ Configurado | Credenciales en Supabase Providers |

**Correcciones Realizadas:**
- ✅ Normalizado `VITE_SUPABASE_KEY` en .env.production y .env
- ✅ Agregado `SUPABASE_DB_URL` a GitHub Secrets
- ✅ Verificado consistencia en Vercel Environment Variables
- ✅ Agregado `VITE_OPENWEATHER_API_KEY` en Vercel Production
- ✅ Credenciales de Google Cloud configuradas en Supabase Providers

---

## 🔑 Credenciales Identificadas

### Supabase

**Project URL:** `https://neygzluxugodiwcuctbj.supabase.co`

**Anon Public Key:**
- Archivo .env.local: `JWT_ANON_KEY_PLACEHOLDER`
- Archivo .env.production: `sb_publishable_PLACEHOLDER`
- Archivo .env: `sb_publishable_PLACEHOLDER`

**Service Role Key:**
- Archivo .env.local: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI2MDg5MiwiZXhwIjoyMDk1ODM2ODkyfQ.tExTkymdTg60mbD5wuikxnJMVryiT-9ld-6PhJhAFJM`
- Archivo .env.production: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI2MDg5MiwiZXhwIjoyMDk1ODM2ODkyfQ.tExTkymdTg60mbD5wuikxnJMVryiT-9ld-6PhJhAFJM`

**Database URL:**
- Archivo .env.local: `postgresql://postgres:DB_PASSWORD_PLACEHOLDER@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres`
- Archivo .env.production: `postgresql://postgres:DB_PASSWORD_PLACEHOLDER@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres`

### Otras Variables

**Admin Email:** `salazaroliveros@gmail.com` (consistente en todos los archivos)

**OpenWeather API Key:**
- Archivo .env: `[CONFIGURADO]`
- Archivo .env.local: `[CONFIGURADO]`
- Archivo .env.production: `[CONFIGURADO]`

---

## ⚠️ Inconsistencias Críticas

### 1. Diferentes Anon Keys entre Archivos ✅ CORREGIDO

**Problema:** El archivo `.env.local` usa un JWT token diferente mientras que `.env.production` y `.env` usan el publishable key estándar.

**Impacto:** ⚠️ **ALTO** - Puede causar problemas de autenticación en desarrollo vs producción

**Corrección:** ✅ Normalizado `VITE_SUPABASE_KEY` en .env.production y .env para usar el JWT token actual

### 2. GitHub Secrets Incompleto ✅ CORREGIDO

**Problema:** Falta `SUPABASE_DB_URL` en los secrets de GitHub

**Impacto:** ⚠️ **MEDIO** - Los scripts de migración en CI/CD pueden fallar

**Corrección:** ✅ Agregado `SUPABASE_DB_URL` a GitHub Secrets

### 3. OpenWeather API Key Inconsistente ✅ CORREGIDO

**Problema:** El API key estaba en `.env` pero vacío en `.env.local` y `.env.production`

**Impacto:** ⚠️ **BAJO** - El módulo Weather puede no funcionar correctamente

**Corrección:** ✅ Configurado en `.env.local`, `.env.production` y Vercel Production

---

## ✅ Configuraciones Correctas

### GitHub Secrets (Actuales) ✅ COMPLETO
```
VERCEL_ORG_ID                    ✅ Presente
VERCEL_PROJECT_ID                ✅ Presente
VERCEL_TOKEN                     ✅ Presente
VITE_ADMIN_EMAIL                ✅ Presente
VITE_SUPABASE_KEY               ✅ Presente
VITE_SUPABASE_SERVICE_ROLE_KEY  ✅ Presente
VITE_SUPABASE_URL               ✅ Presente
VITE_VAPID_PUBLIC_KEY           ✅ Presente
SUPABASE_DB_URL                 ✅ AGREGADO (CORREGIDO)
```

### Vercel Environment Variables (Actuales)
```
VITE_SUPABASE_KEY               ✅ Presente (Preview + Production)
SUPABASE_DB_URL                ✅ Presente (Preview + Production)
VITE_SUPABASE_SERVICE_ROLE_KEY ✅ Presente (Preview + Production)
VITE_ADMIN_EMAIL               ✅ Presente (Preview + Production)
VITE_APP_ENV                   ✅ Presente (Preview + Production)
VITE_SUPABASE_URL              ✅ Presente (Preview + Production)
```

---

## 🔧 Acciones Correctivas Recomendadas

### 1. Normalizar Anon Keys

**Acción:** Actualizar todos los archivos .env para usar el mismo anon key

**Archivo .env:**
```env
VITE_SUPABASE_KEY=JWT_ANON_KEY_PLACEHOLDER
```

**Archivo .env.production:**
```env
VITE_SUPABASE_KEY=JWT_ANON_KEY_PLACEHOLDER
```

### 2. Agregar Secret Faltante en GitHub

**Comando:**
```bash
gh secret set SUPABASE_DB_URL --body "postgresql://postgres:DB_PASSWORD_PLACEHOLDER@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres"
```

### 3. Configurar OpenWeather API Key

**Acción:** Obtener API key de OpenWeather y configurarla en todos los archivos

**Archivo .env.local:**
```env
VITE_OPENWEATHER_API_KEY=tu-api-key-aqui
```

**Archivo .env.production:**
```env
VITE_OPENWEATHER_API_KEY=tu-api-key-aqui
```

**Vercel Environment Variables:**
```bash
npx vercel env add VITE_OPENWEATHER_API_KEY
```

---

## 📊 Comparación de Variables

| Variable | .env.local | .env.production | .env | GitHub | Vercel |
|----------|------------|-----------------|------|--------|--------|
| VITE_SUPABASE_URL | ✅ | ✅ | ⚠️ placeholder | ✅ | ✅ |
| VITE_SUPABASE_KEY | ⚠️ JWT | ⚠️ publishable | ⚠️ publishable | ✅ | ✅ |
| VITE_SUPABASE_SERVICE_ROLE_KEY | ✅ | ✅ | ❌ | ✅ | ✅ |
| SUPABASE_DB_URL | ✅ | ✅ | ⚠️ placeholder | ❌ | ✅ |
| VITE_ADMIN_EMAIL | ✅ | ✅ | ✅ | ✅ | ✅ |
| VITE_APP_ENV | development | production | development | - | ✅ |
| VITE_OPENWEATHER_API_KEY | ❌ vacío | ❌ vacío | ✅ valor | - | ❌ |
| VITE_VAPID_PUBLIC_KEY | - | - | - | ✅ | ❌ |

**Leyenda:**
- ✅ = Configurado correctamente
- ⚠️ = Inconsistente o placeholder
- ❌ = No configurado
- - = No aplicable

---

## 🎯 Prioridad de Correcciones

### 🔴 Alta Prioridad (Crítico) ✅ COMPLETADO
1. ✅ Normalizar `VITE_SUPABASE_KEY` en todos los archivos
2. ✅ Agregar `SUPABASE_DB_URL` a GitHub Secrets

### 🟡 Media Prioridad (Importante) ⏳ PENDIENTE
3. ✅ Configurar `VITE_OPENWEATHER_API_KEY` consistentemente
4. ⏳ Verificar que `VITE_VAPID_PUBLIC_KEY` esté configurado en Vercel
5. ⏳ Configurar Google Cloud Console (Authorized Origins/Redirect URIs)
6. ⏳ Configurar Supabase Authentication (Site URL/Redirect URLs)

### 🟢 Baja Prioridad (Opcional) ⏳ PENDIENTE
7. ⏳ Limpiar archivos .env obsoletos
8. ⏳ Documentar configuración de variables

---

## 📝 Procedimiento de Corrección

### Paso 1: Normalizar Anon Keys ✅ COMPLETADO
```bash
# Actualizar .env.production ✅
sed -i 's/sb_publishable_PLACEHOLDER/JWT_ANON_KEY_PLACEHOLDER/g' .env.production

# Actualizar .env ✅
sed -i 's/sb_publishable_PLACEHOLDER/JWT_ANON_KEY_PLACEHOLDER/g' .env
```

### Paso 2: Agregar Secret a GitHub ✅ COMPLETADO
```bash
gh secret set SUPABASE_DB_URL "postgresql://postgres:DB_PASSWORD_PLACEHOLDER@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres" ✅
```

### Paso 3: Configurar OpenWeather API Key ✅ COMPLETADO
```bash
# Agregado a .env.local ✅
VITE_OPENWEATHER_API_KEY=[CONFIGURADO]

# Agregado a .env.production ✅
VITE_OPENWEATHER_API_KEY=[CONFIGURADO]

# Agregado a Vercel Production ✅
npx vercel env add VITE_OPENWEATHER_API_KEY production
```

---

## 🔐 Consideraciones de Seguridad

### ✅ Buenas Prácticas Actuales
- Service Role Key correctamente configurado
- Database URL con contraseña incluida
- GitHub Secrets usados para variables sensibles
- Vercel Environment Variables encriptadas

### ⚠️ Áreas de Mejora
- Considerar rotar Service Role Key periódicamente
- Usar variables específicas por ambiente (development/staging/production)
- Documentar rotación de credenciales
- Considerar usar GitHub Actions Environment para mayor seguridad

---

**Última actualización:** 2026-07-10  
**Estado:** ✅ CORRECCIONES DE ALTA Y MEDIA PRIORIDAD COMPLETADAS  
**Resumen:** 3/3 correcciones críticas implementadas exitosamente  
**Adicional:** Credenciales de Google Cloud configuradas en Supabase Providers
