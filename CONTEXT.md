# CONTEXT.md: ERP CONSTRUSMART

## Propósito
ERP integral para gestión de proyectos de construcción.

## Stack Tecnológico
- **Frontend:** React + TypeScript + Vite.
- **UI:** Shadcn UI.
- **Backend/BaaS:** Supabase (PostgreSQL).
- **Herramientas Clave:** Zod (validación), D3.js (gráficos), Web-IFC (visor BIM).

## Estructura de Módulos
- `/src/erp`: Lógica de negocio, componentes específicos del ERP, almacenamiento local, estados.
- `/src/components/ui`: Componentes compartidos basados en Shadcn.
- `/supabase/migrations`: Definición de la base de datos y políticas de seguridad (RLS).
- `/src/functions`: Lógica de servidor serverless (Edge Functions).
