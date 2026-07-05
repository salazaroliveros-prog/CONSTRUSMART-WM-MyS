# Weather Table Migration Guide

Este documento guía la ejecución de la migración de la tabla `erp_proyecto_weather` en Supabase.

## 📋 Prerrequisitos

- Node.js 24.x (ya instalado)
- npm 9.x (ya instalado)
- Acceso al proyecto Supabase de CONSTRUSMART

## 🔑 Obtener Credenciales de Supabase

1. Ingresa a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto CONSTRUSMART
3. Ve a **Settings → API**
4. Copia las siguientes credenciales:

### Anon Key (pública)
- **Project URL**: `https://[project-id].supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Service Role Key (privada)
- En la misma sección **Settings → API**
- Copia el **service_role secret key** (comienza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- ⚠️ **IMPORTANTE**: Esta key es privada y debe manejarse con cuidado

### PostgreSQL Connection String
1. Ve a **Settings → Database**
2. Busca **Connection String**
3. Selecciona **URI**
4. Copia el string con formato: `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`

## 📝 Crear Archivo .env.local

Crea un archivo `.env.local` en la raíz del proyecto con las credenciales:

```bash
# Copia el archivo de ejemplo
cp .env.example .env.local
```

Edita `.env.local` con las credenciales reales:

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_KEY=[anon-public-key]
VITE_SUPABASE_SERVICE_ROLE_KEY=[service-role-secret-key]
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
VITE_ADMIN_EMAIL=admin@construsmart.com
VITE_APP_ENV=development
```

## 🚀 Ejecutar la Migración

### Opción 1: Usar el Script de Migración (Recomendado)

```bash
# Ejecutar la migración
npm run migrate:weather
```

El script:
- Se conecta a Supabase usando las credenciales
- Lee el archivo `supabase/migrations/000000000072_create_erp_proyecto_weather.sql`
- Ejecuta todos los comandos SQL
- Verifica que la tabla fue creada correctamente

### Opción 2: Ejecutar Manualmente en Supabase Dashboard

1. Ve a **SQL Editor** en Supabase Dashboard
2. Crea un nuevo query
3. Copia el contenido de `supabase/migrations/000000000072_create_erp_proyecto_weather.sql`
4. Pégalo en el editor
5. Click en **Run**

## ✅ Verificar la Migración

Después de ejecutar la migración, verifica que todo esté correcto:

```bash
npm run verify:weather
```

El script de verificación revisa:
- ✅ La tabla existe
- ✅ Todas las columnas están presentes
- ✅ Los constraints están configurados
- ✅ Los índices están creados
- ✅ Las políticas RLS están activas
- ✅ Los triggers están configurados
- ✅ Realtime está habilitado
- ✅ El foreign key a `erp_proyectos` existe

## 📊 Salida Esperada de Verificación

```
✅ Connected to Supabase PostgreSQL

📋 VERIFICATION REPORT: erp_proyecto_weather table

✅ Table erp_proyecto_weather exists

📊 Columns:
  - id: uuid (nullable: NO)
  - proyecto_id: uuid (nullable: NO)
  - weather_data: jsonb (nullable: NO)
  - impact: jsonb (nullable: NO)
  - construction_metrics: jsonb (nullable: NO)
  - scheduling_windows: jsonb (nullable: NO)
  - historical_impact: jsonb (nullable: NO)
  - last_updated: timestamp with time zone (nullable: NO)
  - created_at: timestamp with time zone (nullable: NO)
  - updated_at: timestamp with time zone (nullable: NO)
✅ All expected columns present

🔒 Constraints:
  - erp_proyecto_weather_pkey: PRIMARY KEY
  - unique_proyecto_weather: UNIQUE
  - erp_proyecto_weather_proyecto_id_fkey: FOREIGN KEY

📇 Indexes:
  - erp_proyecto_weather_pkey
  - idx_proyecto_weather_proyecto_id
  - idx_proyecto_weather_last_updated

🛡️  RLS Policies:
  - weather_read_by_project: SELECT ({authenticated})
  - weather_insert_by_project: INSERT ({authenticated})
  - weather_update_by_project: UPDATE ({authenticated})
  - weather_delete_admin: DELETE ({authenticated})
✅ RLS policies configured

⚡ Triggers:
  - trigger_update_proyecto_weather_updated_at: UPDATE (BEFORE)
  - trigger_audit_proyecto_weather: INSERT/UPDATE/DELETE (AFTER)

📡 Realtime:
✅ Table in supabase_realtime publication

🔗 Foreign Keys:
  - erp_proyecto_weather_proyecto_id_fkey: proyecto_id → erp_proyectos.id
✅ Foreign key to erp_proyectos configured

📈 Row count: 0

✅ VERIFICATION COMPLETE
```

## 🧪 Probar en la Aplicación

Después de una migración exitosa:

1. Inicia la aplicación: `npm run dev`
2. Navega a la pantalla **Weather** (Clima)
3. Selecciona un proyecto con coordenadas configuradas
4. Click en el botón **Refresh** para obtener datos climáticos
5. Verifica que los datos se guardan correctamente en Supabase

## 🔧 Solución de Problemas

### Error: "password authentication failed"
- Verifica que la connection string PostgreSQL tenga el password correcto
- El password debe estar URL-encoded si contiene caracteres especiales

### Error: "permission denied for table erp_proyectos"
- Verifica que estás usando el service_role key (no el anon key)
- El service_role key tiene permisos para crear/alterar tablas

### Error: "relation already exists"
- La tabla ya existe en la base de datos
- Ejecuta `npm run verify:weather` para verificar el estado actual
- Si necesitas recrear la tabla, ejecuta manualmente: `DROP TABLE IF EXISTS erp_proyecto_weather CASCADE;` antes de la migración

### Error: "function audit_trigger_func() does not exist"
- La función `audit_trigger_func()` debe existir en tu base de datos
- Verifica que la migración `000000000050_add_audit_triggers.sql` se ejecutó anteriormente
- Si no existe, ejecuta esa migración primero

## 📚 Referencias

- [Supabase SQL Editor](https://supabase.com/docs/guides/database/sql-editor)
- [Supabase Migrations](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

## ✅ Checklist de Completitud

- [ ] Credenciales de Supabase obtenidas
- [ ] Archivo `.env.local` creado con credenciales
- [ ] Migración ejecutada (`npm run migrate:weather`)
- [ ] Verificación exitosa (`npm run verify:weather`)
- [ ] Aplicación probada en pantalla Weather
- [ ] Datos climáticos persistiendo en Supabase
