# ERP Construsmart - Roadmap de Implementación

## ✅ Completado (100%)

### Core Infrastructure
- [x] Redux Toolkit store migration (`src/store.ts`)
- [x] Zod validation schemas para todas las entidades
- [x] Async thunks con error handling
- [x] Compatible hooks para migración gradual

### Hooks Personalizados
- [x] `useProyecto` - CRUD y acceso a proyectos
- [x] `useProyectoNotificaciones` - Alertas de proyectos
- [x] `useProyectoMovimientos` - Movimientos por proyecto
- [x] `useIncidenciaAlertas` - Threshold alerts para SSOCalidad
- [x] `useDashboardExport` - PDF export con jsPDF
- [x] Redux hooks: `useProyectosRedux`, `useMovimientosRedux`, `usePresupuestosRedux`, `useEmpleadosRedux`, `useMaterialesRedux`, `useOrdenesRedux`

### UI Components
- [x] `ProjectTreeSelect` - Selección jerárquica de proyectos
- [x] `StatusChips` - Badges de estado (StatusChip, ProjectStatusBadge, BudgetStatusIndicator)
- [x] `useDashboardExport` - Exportación PDF

### Security
- [x] RLS policies SQL migration (`supabase/migrations/000000000002_rls_policies.sql`)
- [x] Función `get_user_role()` y `get_accessible_proyectos()`

### Fixes
- [x] Antd AntForm duplicate form instance error
- [x] Realtime subscription duplicate error (deshabilitado en store.tsx)
- [x] Limpieza de componentes ejemplo no usados

## ⏳ Pendiente - Migración de Componentes

### Prioridad Alta
- [ ] Migrar `Dashboard.tsx` a usar Redux hooks
- [ ] Migrar `Proyectos.tsx` a usar Redux hooks  
- [ ] Migrar `Presupuestos.tsx` a usar Redux hooks
- [ ] Migrar `RRHH.tsx` a usar Redux hooks
- [ ] Migrar `Financiero.tsx` a usar Redux hooks
- [ ] Migrar `Bodega.tsx` a usar Redux hooks
- [ ] Actualizar `AppLayout.tsx` - remover ErpProvider wrapper

### Prioridad Media
- [ ] Integrar `ProjectTreeSelect` en formularios de proyecto
- [ ] Integrar `StatusChips` en Dashboard
- [ ] Agregar botón de export PDF en Dashboard
- [ ] Verificar funcionamiento de `useIncidenciaAlertas` en SSOCalidad

## 📋 Recomendaciones Finales

1. **Before Production Deploy:**
   - Ejecutar `supabase/migrations/000000000002_rls_policies.sql` en Supabase
   - Verificar que las columnas `proyecto_id` existan en `erp_empleados` y `erp_ordenes_compra`
   - Testear roles: Administrador, Gerente, Residente, Compras, Bodeguero

2. **Optimizations:**
   - Code-splitting para reducir bundle size (3.6MB actual)
   - Agregar `React.memo` a componentes StatusChips
   - Implementar debounce en ProjectTreeSelect

3. **Testing:**
   - Agregar tests unitarios para hooks personalizados
   - Test de integración para Redux store
   - Test de RLS policies

4. **Deploy:**
   - GitHub Actions está configurado ✅
   - Vercel deploy automático está activo ✅
   - Revisar que no haya previews colgadas en Vercel dashboard

## 🔗 Enlaces Útiles
- GitHub Actions: https://github.com/salazaroliveros-prog/ERP-CONSTRUSMART-WM/actions
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase SQL Editor: Ejecutar migration manualmente