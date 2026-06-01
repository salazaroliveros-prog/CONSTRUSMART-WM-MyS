✅ CHECKLIST DE FACTORIZACIÓN Y COMPLETADO — ERP CONSTRUSMART
ARQUITECTURA Y TIPO
#	Item	Estado	Acción Requerida
1	Framework React 18 + Vite + TypeScript + Tailwind + shadcn/ui	✅ OK	Ninguna
2	SPA con React Router DOM v6	✅ OK	Ninguna
3	Estado: Context API + localStorage (prefijo wm_)	⚠️ INCONSISTENCIA	Sincronizar con Supabase o definir estrategia de persistencia
4	Backend: Supabase (BaaS)	✅ OK	Ninguna
5	Estructura de carpetas: src/erp/ con screens/components/store/types/utils	✅ OK	Ninguna
MÓDULOS FUNCIONALES
#	Módulo	Ruta	Estado
6	Dashboard	src/erp/screens/Dashboard.tsx	✅ Completo
7	Proyectos (CRUD + mapa calor + avances)	src/erp/screens/Proyectos.tsx	✅ Completo
8	Presupuestos (motor APU 45 renglones, FSR)	src/erp/screens/Presupuestos.tsx	✅ Completo
9	Financiero (ingresos/gastos, flujo caja)	src/erp/screens/Financiero.tsx	✅ Completo
10	RRHH (empleados, FSR, asignación proyectos)	src/erp/screens/RRHH.tsx	✅ Completo
11	Bodega (inventario, órdenes, proveedores)	src/erp/screens/Bodega.tsx	✅ Completo
12	Seguimiento (EVM, bitácora digital)	src/erp/screens/Seguimiento.tsx	✅ Completo
13	Login/Registro + RBAC	src/erp/screens/Login.tsx	✅ Completo
14	Layout (Header + Sidebar responsive)	src/components/AppLayout.tsx	✅ Completo
🔴 VULNERABILIDADES CRÍTICAS (Seguridad)
#	Item	Prioridad	Acción
15	API Key Supabase hardcodeada en src/lib/supabase.ts:4	🔴 CRÍTICA	Mover a .env exclusivamente, eliminar fallback hardcodeado
16	RLS permisivo en database.sql — USING (true) en todas las tablas	🔴 CRÍTICA	Implementar políticas RLS reales por rol
17	CORS abierto en src/functions/crm-dispatcher/*	🔴 CRÍTICA	Restringir a dominios específicos
18	Datos solo en localStorage — sin persistencia real en BD	🔴 CRÍTICA	Implementar sincronización Supabase o definir capa de datos
🟠 INCONSISTENCIAS FUNCIONALES
#	Item	Prioridad	Acción
19	AppContext vacío — define sidebarOpen pero no se usa; el Sidebar tiene su propio estado	🟠 Alta	Consolidar estado del sidebar en AppContext
20	Sidebar ignora AppContext — AppContext.tsx no se consume en Sidebar.tsx	🟠 Alta	Conectar sidebar a contexto o eliminar estado duplicado
21	Database.sql no alineado — Schema es para CRM, no tiene tablas ERP (proyectos, empleados, etc.)	🟠 Alta	Crear tablas ERP en Supabase o eliminar schema CRM
22	database.sql tiene triggers CRM (crm_contacts, crm_campaigns) pero el ERP no los usa	🟠 Alta	Decidir: integrar CRM o eliminar tablas CRM
23	MovimientoForm tipo casting incorrecto — costoUnitario: '' as unknown as number	🟠 Alta	Corregir tipado Zod/form
24	Seed data no sincronizada — datos iniciales en src/erp/data.ts vs localStorage	🟠 Media	Definir si seed va a Supabase o solo localStorage
25	package.json nombre incorrecto — vite_react_shadcn_ts vs nombre real del proyecto	🟠 Media	Renombrar package
🟡 FORTALEZAS A MANTENER
#	Fortaleza
26	Motor APU completo con 45 renglones y fórmulas FSR (43.17%)
27	EVM (Earned Value Management) implementado en seguimiento
28	Gráficos SVG propios sin dependencias pesadas
29	Seed data realista para construcción guatemalteca
30	RBAC con 5 roles definidos
31	Responsive design completo
32	Exportaciones CSV/PDF en presupuestos
33	Geolocalización de proyectos
34	Bitácora digital de campo
🟡 COSMÉTICOS Y MEJORAS
#	Item	Prioridad	Acción
35	Documentación README mínima	🟡 Baja	Expandir README con setup, features, arquitectura
36	Sin tests unitarios/integración	🟡 Baja	Agregar Vitest + tests básicos
37	Sin Error Boundaries	🟡 Media	Implementar ErrorBoundary global
38	Sin loading states consistentes	🟡 Media	Agregar Skeletons/Spinners
39	Estilos inline duplicados en varios componentes	🟡 Baja	Refactorizar a clases Tailwind reutilizables
40	Sin manejo de offline/PWA	🟡 Baja	Evaluar necesidad