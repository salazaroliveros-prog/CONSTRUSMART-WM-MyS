# Variables de Entorno — Configuración por Plataforma

## 1) GitHub Secrets
Se usan solo para el deploy automático a Vercel (no necesitas secretos de Supabase aquí).
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`
- [ ] `VERCEL_TOKEN`

Ruta: GitHub repo → Settings → Secrets and variables → Actions → New repository secret.

## 2) Vercel
Se usan en build como `import.meta.env.VITE_*` (Vite).
Variables requeridas para producción:
- `VITE_SUPABASE_URL` = `https://<project-ref>.supabase.co`
- `VITE_SUPABASE_KEY` = anon/public key (`eyJhbGciOi...`)
- `VITE_ADMIN_EMAIL` = `salazaroliveros@gmail.com`
- `VITE_OPENWEATHER_API_KEY` = API key de OpenWeather
- `VITE_SENTRY_DSN` = DSN de Sentry (si aplica; puede estar vacío)
- `VITE_VAPID_PUBLIC_KEY` = clave pública VAPID (push notifications)

Ruta: Vercel dashboard → Project Settings → Environment Variables → Production.

Notas:
- `.env.vercel` local ya incluye estas variables.
- Prefijo `VITE_` obligatorio para exponerlas al cliente en Vite.
- `VERCEL_*` son internas del workflow y no se deben tocar.

## 3) Supabase
Configuración esperada por la app:
- URL del proyecto: `https://<project-ref>.supabase.co`
- Anon key: la clave pública del proyecto (`anon` role)
- Service role key: solo para endpoints server-side / Edge Functions

Consumer en código: `src/lib/supabase.ts`
- Lee `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY` desde `import.meta.env`.
- Construye el cliente con `flowType: 'pkce'` y sesión persistida en `localStorage`.
- `hasSupabase` se calcula desde la presencia del URL y la anon key.

## 4) Reglas de seguridad
- [ ] No commitear `.env`, `.env.local`, `.env.vercel`.
- [ ] Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en código frontend.
- [ ] RLS habilitado en tablas operativas; anon revocado donde aplica.
- [ ] GitHub Actions no requiere secrets de Supabase cuando solo hace build + deploy.