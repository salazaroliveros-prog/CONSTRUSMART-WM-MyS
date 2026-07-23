# Handoff: Auditoría de Tema / Responsividad / Optimización Visual

## Estado actual (Sesión 1 - completada)

### Metodología aplicada
- Revisar pantalla por pantalla buscando: colores hardcode sin variante `dark:*`, layouts no responsive, padding excesivo en móvil, faltas de aria/focus, superposición de elementos
- Corrección: reemplazar colores fijos por semánticos con `dark:*`, grids responsive con `sm:` y `lg:`, compactación de espaciado

### Archivos modificados (16 screens)
**Pasada inicial (primera mitad del commit 9551def):**
- APUAvanzado, Activos, Administracion, Auditoria, BasePrecios, CRM, CalidadCumplimiento, ComercialFinanzas, Cotizaciones, Cuadros, CuentasCobrar, CuentasPagar, Dashboard, DashboardPredictivo, EntradasAlmacenOC, GestionDocumental, Hitos, Impuestos, LogisticaCompras, MuroObra, OrdenesCambio, PlanillaDestajos, PlantillasProyectos, ProfitabilityAnalytics, RRHH, RendimientoCampo, ResourceConflicts, Riesgos, SSOCalidad, Weather

**Pasada adicional (segunda mitad):**
- ProyectosKPI.tsx - helpers visuales dark mode
- Ajustes.tsx - badge dark mode
- Presupuestos.tsx - KPI cards + badges dark mode
- Notificaciones.tsx - iconos dark mode
- ProyectoCardSimple.tsx - colores financieros dark mode

### Screens pendientes para próxima sesión (~27)
Proyectos, PlantillasProyectos (si no se terminó), Seguimiento, Weather, Dashboard, DashboardPredictivo, Financiero, CuentasCobrar, CuentasPagar, CurvasS, BasePrecios, Bodega, CalidadCumplimiento, ComercialFinanzas, CRM, EntradasAlmacenOC, ExportacionInteligente, Impuestos, Login, ProfitabilityAnalytics, ProveedorAnalytics, RendimientoCampo, RRHH, SSOCalidad, VisorBIM, Activos, APUAvanzado, ResourceConflicts, Hitos, MuroObra, OrdenesCambio, PlanillaDestajos, GestionDocumental, ErrorLog, Cuadros, Cotizaciones

### Patrones a aplicar en screens pendientes
1. **Colores de KPI cards**: bg-{color}-50 dark:bg-{color}-950/40 + text-{color}-600/700 dark:text-{color}-400/300 + border semántico
2. **Badges estado**: bg-{color}-100 text-{color}-700 dark:bg-{color}-900/30 dark:text-{color}-300
3. **Iconos**: text-{color}-500 dark:text-{color}-400
4. **Grids responsive**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
5. **Botones activos**: bg-foreground text-background (mejor que colores hardcode)
6. **Padding en móvil**: `p-4 sm:p-6` en contenedores principales
7. **Evitar colores success/warning/danger/info como clases Tailwind directas** si no tienen varianza dark definida en tailwind.config

### Build y verificación
- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors, 1 warning conocido (Financiero.tsx:115 pickColor)
- `npm run build` → 0 errors
- Push a GitHub + CI/CD workflow avanzando sin errores
- Deploy Vercel: https://cosmic-mochi-7432b3c5a777bf750b35048a4a3a4cad.construsmart-wm2026.vercel.app