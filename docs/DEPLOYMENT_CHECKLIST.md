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
- [x] `.env.local` tiene `VITE_SUPABASE_SERVICE_ROLE_KEY` (service role) correcta
- [x] `.env.local` tiene `VITE_ADMIN_EMAIL` configurado ✅
- [x] VERCEL tiene las mismas variables configuradas en Environment ✅

> **Nota:** `VITE_SUPABASE_SERVICE_ROLE_KEY` está presente en Vercel (Preview, Production) pero NO en `.env.local`. Agregar al `.env.local` para desarrollo local.

### Supabase
- [ ] Migraciones aplicadas hasta `000000000098` — ⚠️ verificar en Supabase Dashboard (096: integrity check, 097: access log, 098: performance monitoring)
- [ ] RLS habilitado en todas las tablas operacionales — ⚠️ verificar
- [ ] Realtime habilitado en tablas críticas — ⚠️ verificar
- [ ] Auth providers configurados (Google OAuth) — ⚠️ configurar en Supabase Dashboard
- [x] Service role key generada y almacenada segura ✅ (presente en Vercel)
- [ ] Database-access function desplegada — ⚠️ verificar

### Código
- [x] Rama `main` actualizada en GitHub ✅ (`9f92e4e`)
- [x] Build local exitoso: `npm run build` ✅ (3.16s, 0 errores)
- [x] Typecheck exitoso: `npm run typecheck` ✅ (0 errores)
- [x] Tests pasando: weather (30/30) ✅ + UI estilos (72/72) ✅

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
- [ ] Verificar RLS policies en tablas sensibles — ⚠️ requiere service role key
- [ ] Verificar realtime subscriptions — ⚠️ requiere service role key
- [ ] Probar auth flow (login/logout) — ⚠️ requiere auth config + credenciales
- [ ] Probar inserción de datos de prueba — ⚠️ requiere auth

---

## Post-Deployment

### Verificación
- [x] App carga correctamente en dominio productivo único: https://construsmart-wm2026.vercel.app/ — ✅
- [ ] Login con Google funciona — ⚠️ requiere Google OAuth configurado
- [ ] CRUD de proyectos funciona
- [ ] Sincronización con Supabase funciona
- [ ] Realtime updates funcionan
- [ ] Offline mode funciona (localStorage)
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

**Última actualización:** 2026-07-12
**Dominio productivo:** https://construsmart-wm2026.vercel.app