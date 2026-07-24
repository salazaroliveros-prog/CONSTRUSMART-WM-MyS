# Supabase Setup

## Puertos
- API local: `54321`
- DB local: `54322`
- Vite dev: `8080`

## Variables .env.local
- `VITE_SUPABASE_URL=http://127.0.0.1:54321`
- `VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## Scripts
- `scripts/verify-empty-tables.ts`
- `scripts/clean-all-data.ts`

> Nota: `supabase/seed.sql` está vacío para empezar sin datos simulados.