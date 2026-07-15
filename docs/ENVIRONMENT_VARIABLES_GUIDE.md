# Guía de Variables de Entorno - CONSTRUSMART ERP

## Variables Obligatorias

### 1. VITE_SUPABASE_URL
**Descripción**: URL del proyecto Supabase  
**Formato**: `https://[project-id].supabase.co`  
**Cómo obtener**: 
- Ir a Supabase Dashboard → Settings → API
- Copiar "Project URL"

**Ejemplo**: `https://neygzluxugodiwcuctbj.supabase.co`

---

### 2. VITE_SUPABASE_KEY (Anon Key)
**Descripción**: Key pública para acceso desde el frontend  
**Formato**: String JWT  
**Cómo obtener**:
- Ir a Supabase Dashboard → Settings → API
- Copiar "anon public" key

**Ejemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### 3. VITE_SUPABASE_SERVICE_ROLE_KEY
**Descripción**: Key con privilegios de servicio (solo para backend/migraciones)  
**Formato**: String JWT  
**Cómo obtener**:
- Ir a Supabase Dashboard → Settings → API
- Copiar "service_role" key (secret)
- ⚠️ **NO COMPARTIR ESTA KEY** - tiene acceso total a la BD

**Ejemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### 4. SUPABASE_DB_URL
**Descripción**: Connection string PostgreSQL para migraciones directas  
**Formato**: `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`  
**Cómo obtener**:
- Ir a Supabase Dashboard → Settings → Database
- Copiar "Connection string" → "URI"
- Reemplazar `[YOUR-PASSWORD]` con tu password de BD

**Ejemplo**: `postgresql://postgres:AbCd1234@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres`

---

## Variables Opcionales

### 5. VITE_ADMIN_EMAIL
**Descripción**: Email del administrador principal  
**Formato**: Email válido  
**Default**: `salazaroliveros@gmail.com`  
**Uso**: Control de acceso administrativo

**Ejemplo**: `admin@construsmart.com`

---

### 6. VITE_APP_ENV
**Descripción**: Entorno de ejecución  
**Valores**: `development` | `production`  
**Default**: `development`

**Ejemplo**: `production`

---

### 7. VITE_OPENWEATHER_API_KEY
**Descripción**: API key de OpenWeather para datos climáticos  
**Cómo obtener**:
- Registrar en https://openweathermap.org/api
- Obtener API key gratuita

**Ejemplo**: `a1b2c3d4e5f6g7h8i9j0`

---

### 8. VITE_SENTRY_DSN
**Descripción**: DSN de Sentry para error tracking  
**Cómo obtener**:
- Crear proyecto en https://sentry.io
- Copiar DSN del proyecto

**Ejemplo**: `https://abc123@sentry.io/456`

---

## Configuración en Vercel

### Pasos para configurar variables en Vercel:

1. Ir a Vercel Dashboard → Proyecto `construsmart`
2. Settings → Environment Variables
3. Agregar cada variable:
   - **Name**: Nombre de la variable (ej: `VITE_SUPABASE_URL`)
   - **Value**: Valor real
   - **Environments**: Seleccionar `Production`, `Preview`, `Development`

### Variables mínimas requeridas en Vercel:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_KEY`
- ✅ `VITE_SUPABASE_SERVICE_ROLE_KEY`
- ✅ `VITE_ADMIN_EMAIL`

---

## Configuración Local (.env.local)

Crear archivo `.env.local` en la raíz del proyecto:

```bash
# Obligatorias
VITE_SUPABASE_URL=https://neygzluxugodiwcuctbj.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:AbCd1234@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres

# Opcionales
VITE_ADMIN_EMAIL=salazaroliveros@gmail.com
VITE_APP_ENV=development
VITE_OPENWEATHER_API_KEY=tu-api-key
VITE_SENTRY_DSN=https://tu-dsn@sentry.io/project-id
```

⚠️ **IMPORTANTE**: 
- El archivo `.env.local` debe estar en `.gitignore`
- Nunca commitar `.env.local` con keys reales
- Usar `.env.example` como template (sin valores reales)

---

## Verificación

### Verificar configuración local:
```bash
# Verificar que las variables están cargadas
npm run dev
# Debería ver "Supabase connected" en consola si las variables son correctas
```

### Verificar configuración Vercel:
```bash
# Ver deploy logs en Vercel Dashboard
# Buscar errores de "missing environment variable"
```

---

## Troubleshooting

### Error: "SUPABASE_URL is not defined"
**Causa**: Variable `VITE_SUPABASE_URL` no está configurada  
**Solución**: Agregar la variable en `.env.local` o Vercel

### Error: "Invalid API key"
**Causa**: `VITE_SUPABASE_KEY` es incorrecta o expiró  
**Solución**: Regenerar la key en Supabase Dashboard

### Error: "Permission denied"
**Causa**: `VITE_SUPABASE_SERVICE_ROLE_KEY` no tiene permisos  
**Solución**: Verificar que la key sea del tipo "service_role"

### Error: "Connection refused"
**Causa**: `SUPABASE_DB_URL` es incorrecta  
**Solución**: Verificar el connection string en Supabase Dashboard

---

## Seguridad

### Best Practices:
1. ✅ Nunca commitar `.env.local` con keys reales
2. ✅ Usar diferentes keys para desarrollo y producción
3. ✅ Rotar keys periódicamente
4. ✅ Limitar permisos de service role key solo a backend
5. ✅ Monitorear uso de keys en Supabase Dashboard

### Rotación de Keys:
1. Supabase Dashboard → Settings → API
2. "Rolling key" para generar nueva key
3. Actualizar variables en `.env.local` y Vercel
4. Deploy a producción
5. Verificar que todo funciona
6. Deshabilitar key anterior

---

**Última actualización**: 2026-07-19
