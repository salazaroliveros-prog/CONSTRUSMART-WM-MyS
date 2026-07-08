# Checklist de Deployment — CONSTRUSMART ERP

**Producción:** https://construsmart-wm2026.vercel.app/
**Repositorio:** https://github.com/salazaroliveros-prog/CONSTRUSMART-WM-MyS.git
**Base de Datos:** Supabase (proyecto `neygzluxugodiwcuctbj`)

---

## Pre-Deployment

### Variables de Entorno
- [ ] `.env.local` tiene `VITE_SUPABASE_URL` correcta
- [ ] `.env.local` tiene `VITE_SUPABASE_KEY` (anon key) correcta
- [ ] `.env.local` tiene `VITE_SUPABASE_SERVICE_ROLE_KEY` (service role) correcta
- [ ] `.env.local` tiene `VITE_ADMIN_EMAIL` configurado
- [ ] VERCEL tiene las mismas variables configuradas en Environment

### Supabase
- [ ] Migraciones aplicadas hasta `000000000087`
- [ ] RLS habilitado en todas las tablas operacionales
- [ ] Realtime habilitado en tablas críticas
- [ ] Auth providers configurados (Google OAuth)
- [ ] Service role key generada y almacenada segura
- [ ] Database-access function desplegada

### Código
- [ ] Rama `main` actualizada en GitHub
- [ ] Build local exitoso: `npm run build`
- [ ] Typecheck exitoso: `npm run typecheck`
- [ ] Tests pasando: `npm run test`

---

## Deployment

### Vercel
- [ ] Conectar repositorio GitHub a Vercel
- [ ] Configurar dominio personalizado `construsmart-wm2026.vercel.app`
- [ ] Configurar environment variables en Vercel dashboard
- [ ] Deploy automático en push a main activado
- [ ] Verificar headers de seguridad en `vercel.json`

### Supabase
- [ ] Verificar que todas las tablas existen en Table Editor
- [ ] Verificar RLS policies en tablas sensibles
- [ ] Verificar realtime subscriptions
- [ ] Probar auth flow (login/logout)
- [ ] Probar inserción de datos de prueba

---

## Post-Deployment

### Verificación
- [ ] App carga correctamente en https://construsmart-wm2026.vercel.app/
- [ ] Login con Google funciona
- [ ] CRUD de proyectos funciona
- [ ] Sincronización con Supabase funciona
- [ ] Realtime updates funcionan
- [ ] Offline mode funciona (localStorage)
- [ ] Todas las pantallas cargan sin errores

### Monitoreo
- [ ] Vercel Analytics habilitado
- [ ] Supabase Dashboard monitoreando queries
- [ ] Error logging activo (tabla `erp_error_log`)
- [ ] Backup automático configurado

---

## Rollback

Si algo falla:
1. Vercel: ir a Deployments → Previous → Promote
2. Supabase: usar migraciones en `supabase/rollbacks/`
3. Git: `git revert <commit>` + push

---

**Última actualización:** 2026-07-07
**Commit:** `643be73`