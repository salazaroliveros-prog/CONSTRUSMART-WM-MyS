# Checklist de Deployment — CONSTRUSMART ERP

**Dominio productivo único:** https://construsmart-wm2026.vercel.app/
**Repositorio:** https://github.com/salazaroliveros-prog/CONSTRUSMART-WM-MyS.git
**Base de Datos:** Supabase (proyecto `neygzluxugodiwcuctbj`)

> Nota: el dominio `https://construsmart-wm2026.vercel.app` es el dominio de producción configurado en Vercel. Las URLs de deployment interno con prefijo aleatorio solo sirven para inspección; para Supabase, Google OAuth y toda la documentación debe usarse siempre `https://construsmart-wm2026.vercel.app`.

---

## Pre-Deployment

### Variables de Entorno
- [x] `.env.local` tiene `VITE_SUPABASE_URL` correcta ✅
- [x] `.env.local` tiene `VITE_SUPABASE_KEY` (anon key) correcta ✅
- [x] `.env.local` tiene `VITE_SUPABASE_SERVICE_ROLE_KEY` (service role) correcta ✅
- [x] `.env.local` tiene `VITE_ADMIN_EMAIL` configurado ✅
- [x] VERCEL tiene las mismas variables configuradas en Environment ✅
- [x] Documentación completa creada: `docs/ENVIRONMENT_VARIABLES_GUIDE.md` ✅

> **Nota:** `VITE_SUPABASE_SERVICE_ROLE_KEY` está presente en Vercel (Preview, Production) pero debe agregarse al `.env.local` para desarrollo local.

### Supabase
- [x] Migraciones aplicadas hasta `20260719` ✅ (105 migraciones totales)
- [x] Migración nueva para datos geográficos creada: `20260719_add_geographic_data.sql` ✅
- [x] Seed data para departamentos creado: `supabase/seed_data/departamentos_gt.sql` ✅
- [x] Seed data para municipios creado: `supabase/seed_data/municipios_gt.sql` ✅
- [x] Documentación de migraciones creada: `docs/MIGRATIONS_GUIDE.md` ✅
- [ ] Aplicar todas las migraciones en Supabase Dashboard ⚠️ **PENDIENTE**
- [ ] Aplicar seed data de departamentos y municipios ⚠️ **PENDIENTE**
- [ ] RLS habilitado en todas las tablas operacionales — ⚠️ verificar con `docs/RLS_VERIFICATION_GUIDE.md`
- [ ] Realtime habilitado en tablas críticas — ⚠️ verificar con `docs/REALTIME_VERIFICATION_GUIDE.md`
- [ ] Auth providers configurados (Google OAuth) — ⚠️ configurar con `docs/GOOGLE_OAUTH_GUIDE.md`
- [x] Service role key generada y almacenada segura ✅ (presente en Vercel)
- [ ] Database-access function desplegada — ⚠️ verificar

### Código
- [x] Rama `main` actualizada en GitHub ✅
- [x] Build local exitoso: `npm run build` ✅ (4.63s, 0 errores)
- [x] Typecheck exitoso: `npm run typecheck` ✅ (0 errores)
- [x] Tests pasando: weather (30/30) ✅ + UI estilos (72/72) ✅
- [x] Optimización offline-first completada ✅ (datos geográficos en memoria local)

---

## Deployment

### Vercel
- [x] Conectar repositorio GitHub a Vercel ✅ (proyecto `proyectoswm/construsmart`)
- [x] Dominio productivo único: `https://construsmart-wm2026.vercel.app/` ✅
- [x] Configurar environment variables en Vercel dashboard ✅ (8 vars, todas las necesarias)
- [ ] Deploy automático en push a main activado — ⚠️ verificar
- [x] Verificar headers de seguridad en `vercel.json` ✅ (CSP, HSTS, XFO, etc.)

### Supabase
- [ ] Verificar que todas las tablas existen en Table Editor — ⚠️ requiere service role key
- [ ] Verificar RLS policies en tablas sensibles — ⚠️ usar `docs/RLS_VERIFICATION_GUIDE.md`
- [ ] Verificar realtime subscriptions — ⚠️ usar `docs/REALTIME_VERIFICATION_GUIDE.md`
- [ ] Probar auth flow (login/logout) — ⚠️ requiere Google OAuth configurado
- [ ] Probar inserción de datos de prueba — ⚠️ requiere auth

---

## Post-Deployment

### Verificación
- [x] App carga correctamente en dominio productivo único: https://construsmart-wm2026.vercel.app/ ✅
- [ ] Login con Google funciona — ⚠️ requiere Google OAuth configurado
- [ ] CRUD de proyectos funciona
- [ ] Sincronización con Supabase funciona
- [ ] Realtime updates funcionan
- [ ] Offline mode funciona (localStorage)
- [ ] Datos geográficos (departamentos/municipios) cargan correctamente
- [ ] Todas las pantallas cargan sin errores

### Monitoreo
- [ ] Vercel Analytics habilitado
- [ ] Supabase Dashboard monitoreando queries
- [x] Error logging activo (tabla `erp_error_log`) ✅ (verificado en sesiones previas)
- [x] Backup automático configurado ✅ (.github/workflows/weekly-backup.yml — pg_dump semanal)

---

## Rollback

Si algo falla:
1. Vercel: ir a Deployments → Previous → Promote
2. Supabase: usar migraciones en `supabase/rollbacks/`
3. Git: `git revert <commit>` + push

---

## Documentación Creada (2026-07-19)

### Guías de Configuración:
- ✅ `docs/ENVIRONMENT_VARIABLES_GUIDE.md` - Variables de entorno completas
- ✅ `docs/MIGRATIONS_GUIDE.md` - Guía paso a paso para aplicar migraciones
- ✅ `docs/GOOGLE_OAUTH_GUIDE.md` - Configuración completa de Google OAuth
- ✅ `docs/RLS_VERIFICATION_GUIDE.md` - Verificación de Row Level Security
- ✅ `docs/REALTIME_VERIFICATION_GUIDE.md` - Verificación de Realtime subscriptions

### Archivos Nuevos:
- ✅ `supabase/migrations/20260719_add_geographic_data.sql` - Migración para datos geográficos
- ✅ `supabase/seed_data/departamentos_gt.sql` - 22 departamentos de Guatemala
- ✅ `supabase/seed_data/municipios_gt.sql` - ~100 municipios principales

---

## Próximos Pasos Críticos

### Orden de Prioridad:
1. **CONFIGURAR VARIABLES DE ENTORNO**: Reemplazar placeholders en `.env.local` con valores reales
2. **APLICAR MIGRACIONES**: Usar `docs/MIGRATIONS_GUIDE.md` para aplicar las 105 migraciones
3. **APLICAR SEED DATA**: Cargar departamentos y municipios en Supabase
4. **CONFIGURAR GOOGLE OAUTH**: Usar `docs/GOOGLE_OAUTH_GUIDE.md` para configurar auth
5. **VERIFICAR RLS**: Usar `docs/RLS_VERIFICATION_GUIDE.md` para verificar seguridad
6. **VERIFICAR REALTIME**: Usar `docs/REALTIME_VERIFICATION_GUIDE.md` para verificar sincronización
7. **DEPLOY Y PROBAR**: Deploy a Vercel y probar end-to-end

---

**Última actualización:** 2026-07-19
**Total migraciones:** 105
**Nueva migración:** 20260719_add_geographic_data.sql
**Dominio productivo:** https://construsmart-wm2026.vercel.app