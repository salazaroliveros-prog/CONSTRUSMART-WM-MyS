# Pantallas pendientes de refinar — UI/UX tipografía y renderizado

## Resumen del estado global

Ya aplicados a nivel global:
- Protección contra overflow en celdas Ant Design (`text-overflow: ellipsis` en `antd-global.css`).
- Headings fluidos con `clamp()` y `text-wrap: balance` en `index.css`.
- Altura de inputs dinámica vía `--density-input-height`.
- Eliminación de animaciones duplicadas.

Pendientes a nivel de componente/screen:
- Aplicar `truncate-1` / `truncate-2` en grids, cards y contenedores de texto fuera de tablas AntD.
- Revisar botones icon-only < 36px en mobile.
- Validar jerarquía visual dentro de cada módulo.

## Lista maestra de pantallas por tipo de deuda técnica

### Overflow sin protección (contenedores NO tabla AntD)

Estas pantallas tienen grids/flex/cards con texto largo y NO usan `truncate`, `overflow-hidden` ni `text-ellipsis`:

- `GestionDocumental.tsx` — lists/grids de documentos con títulos largos
- `Riesgos.tsx` — pipeline/kanban con descripciones largas
- `PlanillaDestajos.tsx` — tablas custom + cards de resumen
- `LogisticaCompras.tsx` — órdenes/materiales con códigos largos
- `ComercialFinanzas.tsx` — métricas con texto variable
- `Activos.tsx` — inventario con identificadores largos
- `Impuestos.tsx` — tablas de claims con texto fiscal
- `Cuadros.tsx` — curvas/estadísticas con etiquetas
- `EntradasAlmacenOC.tsx` — items OC con descripción variable
- `CuentasCobrar.tsx` / `CuentasPagar.tsx` — facturas con nombres largos
- `ExportacionInteligente.tsx` — filtros con nombres largos
- `Seguimiento.tsx` — timeline con notas extensas
- `MuroObra.tsx` — publicaciones con comentarios largos
- `Dashboard.tsx` — tarjetas KPI con valores dinámicos
- `Financiero.tsx` — movimientos con conceptos largos
- `Auditoria.tsx` — logs con mensajes variables
- `RendimientoCampo.tsx` — bitácoras con texto libre
- `Notificaciones.tsx` — alerts con mensajes largos
- `Proyectos.tsx` — tarjetas de proyecto con descripción
- `CalidadCumplimiento.tsx` / `APUAvanzado.tsx` — renglones con texto técnico
- `BasePrecios.tsx` / `PlantillasProyectos.tsx` / `SSOCalidad.tsx` / `ProveedorAnalytics.tsx` / `ProfitabilityAnalytics.tsx` / `ResourceConflicts.tsx` / `Administracion.tsx` / `Weather.tsx` / `Cotizaciones.tsx` / `Bodega.tsx` / `OrdenesCambio.tsx` — grids internos o cards auxiliares sin ellipsis

### Iconos pequeños en botones (< 36px)

Pantallas con botones icon-only usando `h-7/w-7` o `h-8/w-8`:

- `ProfitabilityAnalytics.tsx` — 4 botones
- `ResourceConflicts.tsx` — 4 botones
- `Cotizaciones.tsx` — 3 botones
- `Bodega.tsx` — 1 botón
- `Dashboard.tsx` — 1 botón
- `Financiero.tsx` — 1 botón
- `Seguimiento.tsx` — 1 botón

### Arbitrary widths fijos (`w-[Npx]`)

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

## Plan de ejecución recomendado

| Lote | Pantallas | Enfoque |
|------|-----------|---------|
| 1 | GestionDocumental, Riesgos, PlanillaDestajos, LogisticaCompras | Añadir `truncate-2` o `truncate-3` en cards/listas; ajustar icon buttons |
| 2 | ComercialFinanzas, Activos, Impuestos, Cuadros, EntradasAlmacenOC | Idem; priorizar contenedores con texto fiscal/técnico |
| 3 | CuentasCobrar, CuentasPagar, ExportacionInteligente, Seguimiento, MuroObra | Idem |
| 4 | Dashboard, Financiero, Auditoria, RendimientoCampo, Notificaciones, Proyectos | Idem |
| 5 | CalidadCumplimiento, APUAvanzado, BasePrecios, SSOCalidad, ProveedorAnalytics, ProfitabilityAnalytics, ResourceConflicts, Administracion, Weather, Cotizaciones, Bodega, OrdenesCambio, VisorBIM, RRHH, CRM, Presupuestos, RendimientoCampo, Hitos | Idem |

Criterio común para todas:
- Títulos de cards: `truncate-2 + title`.
- Celdas custom fuera de AntD: `truncate-1 + title`.
- Botones icon-only small: añadir `min-w-[44px]` en mobile.
- Anchuras arbitrarias: reemplazar por expresiones fluidas si superan viewport mobile.

## Acciones realizadas hasta ahora

- Audit documentado en `docs/AUDITORIA_UI_TYPOGRAPHY.md`.
- Script reproducible: `scripts/audit-ui-screens.cjs`.
- Protección global de tablas AntD en `src/antd-global.css`.
- Refuerzo headings en `src/index.css` con `clamp()`.