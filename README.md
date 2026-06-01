# ERP CONSTRUSMART

ERP web para gestión constructora (proyectos, presupuestos APU, finanzas, RRHH, bodega y seguimiento EVM). Frontend React + TypeScript + Vite, capa de datos local con sincronización opcional a Supabase.

## Stack
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui
- React Router v6
- Supabase cliente (autenticación/base de datos)
- Zod + react-hook-form

## Módulos
- Dashboard, Proyectos, Presupuestos, Financiero, RRHH, Bodega, Seguimiento
- Login/registro con RBAC: Administrador, Gerente, Residente, Compras, Bodeguero
- Motor de APU y métricas de Valor Ganado (EVM)
- Google OAuth integrado

## Configuración
1) Copia `.env.example` a `.env` y define `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY`.
2) Ejecuta las migraciones de `supabase/migrations` si usarás Supabase.
3) Instala dependencias y levanta el proyecto:
   npm install
   npm run dev

## Scripts
- npm run dev
- npm run build
- npm run lint

## Nota de seguridad
No se usan claves o tokens hardcodeados. El modo sin Supabase queda soportado para flujo offline/local.
