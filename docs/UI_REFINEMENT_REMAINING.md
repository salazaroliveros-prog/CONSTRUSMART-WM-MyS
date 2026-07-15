# Pantallas pendientes de refinar — UI/UX tipografía y renderizado

## Resumen del estado global

Ya aplicados a nivel global:
- Protección contra overflow en celdas Ant Design (`text-overflow: ellipsis` en `antd-global.css`).
- Headings fluidos con `clamp()` y `text-wrap: balance` en `index.css`.
- Altura de inputs dinámica vía `--density-input-height`.
- Eliminación de animaciones duplicadas.

Pendientes por pantalla:
- Aplicar `truncate-1` / `truncate-2` en grids, cards y contenedores de texto fuera de tablas AntD.
- Revisar botones icon-only < 36px en mobile.
- Validar anchuras arbitrarias críticas (`w-[Npx]`).

## Avance real

### Correcciones ya aplicadas
- `GestionDocumental.tsx` — títulos/descripciones con `truncate`, `line-clamp-3` y `title`.
- `Riesgos.tsx` — títulos/descripciones con `truncate` y `line-clamp-3`.
- `PlanillaDestajos.tsx` — celdas de tabla con `truncate` y `title`.

### Pendiente de refinar (contenedores NO tabla AntD)

Estas pantallas tienen grids/flex/cards con texto largo y NO usan `truncate`, `overflow-hidden` ni `text-ellipsis`:

- `LogisticaCompras.tsx`
- `ComercialFinanzas.tsx`
- `Activos.tsx`
- `Impuestos.tsx`
- `Cuadros.tsx`
- `EntradasAlmacenOC.tsx`
- `CuentasCobrar.tsx`
- `CuentasPagar.tsx`
- `ExportacionInteligente.tsx`
- `Seguimiento.tsx`
- `MuroObra.tsx`
- `Dashboard.tsx`
- `Financiero.tsx`
- `Auditoria.tsx`
- `RendimientoCampo.tsx`
- `Notificaciones.tsx`
- `Proyectos.tsx`
- `CalidadCumplimiento.tsx`
- `APUAvanzado.tsx`
- `BasePrecios.tsx`
- `PlantillasProyectos.tsx`
- `SSOCalidad.tsx`
- `ProveedorAnalytics.tsx`
- `ProfitabilityAnalytics.tsx`
- `ResourceConflicts.tsx`
- `Administracion.tsx`
- `Weather.tsx`
- `Cotizaciones.tsx`
- `Bodega.tsx`
- `OrdenesCambio.tsx`
- `VisorBIM.tsx`
- `RRHH.tsx`
- `CRM.tsx`
- `Presupuestos.tsx`
- `RendimientoCampo.tsx`
- `Hitos.tsx`
- `ErrorLog.tsx`
- `PlantillasProyectos.tsx`
- `OrdenesCambio.tsx`
- `DashboardPredictivo.tsx`
- `Hitos.tsx`
- `Ajustes.tsx`
- `Login.tsx`

### Iconos pequeños en botones (< 36px)

Pantallas con botones icon-only usando `h-7/w-7` o `h-8/w-8`:

- `ProfitabilityAnalytics.tsx` — 4 botones
- `ResourceConflicts.tsx` — 4 botones
- `Cotizaciones.tsx` — 3 botones
- `Bodega.tsx` — 1 botón
- `Dashboard.tsx` — 1 botón
- `Financiero.tsx` — 1 botón
- `Seguimiento.tsx` — 1 botón

### Anchuras arbitrarias fijas (`w-[Npx]`)

Estas pantallas usan anchos fijos que pueden causar overflow horizontal en mobile si el ancho supera el viewport. Deben evaluarse caso a caso:

- `ProfitabilityAnalytics.tsx`, `BasePrecios.tsx`, `SSOCalidad.tsx`, `Bodega.tsx`, `GestionDocumental.tsx`
- `Riesgos.tsx`, `Administracion.tsx`, `PlanillaDestajos.tsx`, `ProveedorAnalytics.tsx`, `ProfitabilityAnalytics.tsx`
- `LogisticaCompras.tsx`, `ComercialFinanzas.tsx`, `Activos.tsx`, `Impuestos.tsx`, `ResourceConflicts.tsx`
- `Cuadros.tsx`, `EntradasAlmacenOC.tsx`, `Weather.tsx`, `Cotizaciones.tsx`, `CuentasCobrar.tsx`
- `CuentasPagar.tsx`, `DashboardPredictivo.tsx`, `ExportacionInteligente.tsx`, `Seguimiento.tsx`, `MuroObra.tsx`
- `VisorBIM.tsx`, `OrdenesCambio.tsx`, `RRHH.tsx`, `CRM.tsx`, `Presupuestos.tsx`, `RendimientoCampo.tsx`, `Hitos.tsx`, `Proyectos.tsx`, `APUAvanzado.tsx`

### Pantallas ya saneadas

- `Ajustes.tsx` — score 0.0, sin problemas tipográficos.
- `ErrorLog.tsx` — usa truncate correctamente.
- `PlantillasProyectos.tsx` — usa truncate.
- `OrdenesCambio.tsx` — usa truncate.
- `DashboardPredictivo.tsx` — usa truncate.
- `Hitos.tsx` — usa truncate.

## Criterios unificados por aplicar

- Títulos de cards: `truncate-2 + title`.
- Celdas custom fuera de AntD: `truncate-1 + title`.
- Botones icon-only small: añadir `min-w-[44px]` en mobile.
- Anchuras fijas: reemplazar por expresiones fluidas si superan viewport mobile.

## Documentación de apoyo

- `docs/AUDITORIA_UI_TYPOGRAPHY.md`
- `scripts/audit-ui-screens.cjs`