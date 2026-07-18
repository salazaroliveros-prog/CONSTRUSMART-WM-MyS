# CONSTRUSMART ERP — Functional Test Plan

**Version:** 1.0  
**Date:** 2026-07-18  
**Scope:** Full application functional testing — screens, buttons, forms, navigation, RBAC, exports, offline-first behavior, and accessibility.  
**Test Framework:** Vitest + React Testing Library (unit/integration), Playwright (E2E/visual).  

---

## 1. Test Strategy

| Layer | Tool | Purpose |
|---|---|---|
| Unit / Integration | Vitest + RTL | Store actions, schemas, calculations, utilities |
| Component | Vitest + RTL | Screen render, button clicks, form submission, modals |
| E2E | Playwright | Full user flows across screens, navigation, auth |
| Visual | Playwright + snapshots | UI regressions, themes, responsive breakpoints |
| Accessibility | vitest-axe + jest-axe | ARIA, contrast, keyboard navigation |
| Offline / Sync | Vitest + mocked network | mutation queue, localStorage, forceSync |

**Test data:**  
- Factory helpers in `src/__tests__/erp-validacion-funcional.test.tsx`  
- Store reset in `src/erp/__tests__/e2e-proyecto.test.ts`  
- Seed script: `npm run seed:supabase`  

**Environments:**  
- `development` — local Vite dev server  
- `production` — Vercel build preview  

---

## 2. Navigation & RBAC

### 2.1 Sidebar Navigation
- [ ] Sidebar renders all 42 allowed items for Administrador
- [ ] Sidebar filters items according to `getViewsByRole(user.rol)`
- [ ] Group headers collapse/expand correctly
- [ ] Active screen is highlighted in sidebar
- [ ] Clicking a sidebar item calls `setView(item.id)` and renders the correct screen
- [ ] Keyboard navigation: Tab through items, Enter/Space activates
- [ ] `aria-label` present on icon-only buttons
- [ ] `aria-hidden` on decorative icons inside labeled buttons

### 2.2 Role-Based Access Control
- [ ] Administrador sees all views
- [ ] Gerente sees all views
- [ ] Residente sees only: dashboard, proyectos, seguimiento, muro, hitos, ordenes-cambio, rendimiento-campo, documentos, bodega, calidad-cumplimiento
- [ ] Compras sees only: dashboard, cotizaciones, proveedor-analytics, bodega
- [ ] Bodeguero sees only: dashboard, bodega
- [ ] `conflicts` is accessible to Administrador and Gerente
- [ ] Unauthorized view redirects to dashboard or nearest allowed screen
- [ ] RBAC reacts to `user.rol` changes without full page reload

---

## 3. Screen-by-Screen Test Cases

### 3.1 Login
| ID | Test Case | Expected Result |
|---|---|---|
| 3.1.1 | Page renders branding, logo, and Google login button | Visible |
| 3.1.2 | Click "Iniciar sesión con Google" | Calls `signInWithGoogle()`, redirects to dashboard on success |
| 3.1.3 | Network/auth error during login | Error message displayed, button re-enabled |
| 3.1.4 | Already authenticated | Redirects to dashboard automatically |
| 3.1.5 | Keyboard navigation on login button | Enter/Space triggers login |

### 3.2 Dashboard
| ID | Test Case | Expected Result |
|---|---|---|
| 3.2.1 | KPI cards render with totals | Proyectos, presupuesto, monto ejecutado, empleados visible |
| 3.2.2 | Charts render with data | Bar/line charts show project status distribution |
| 3.2.3 | Proyecto selector filters dashboard data | Selecting a project updates KPIs |
| 3.2.4 | Empty state when no data | Friendly empty message shown |
| 3.2.5 | Skeleton loading on mount | Skeleton shown before data resolves |

### 3.3 Proyectos
| ID | Test Case | Expected Result |
|---|---|---|
| 3.3.1 | "Nuevo Proyecto" button opens form modal | Modal visible with form fields |
| 3.3.2 | Form validation: empty nombre | Error message shown |
| 3.3.3 | Create proyecto with valid data | `addProyecto` called, toast success, list refreshes |
| 3.3.4 | Edit proyecto | Pre-filled form, `updateProyecto` called |
| 3.3.5 | Delete proyecto with confirmation | `deleteProyecto` called, confirmation dialog shown |
| 3.3.6 | Search filters proyectos by nombre | List updates reactively |
| 3.3.7 | Filter by estado | Only matching estados shown |
| 3.3.8 | Filter by tipologia | Only matching tipologias shown |
| 3.3.9 | Sort by nombre/fecha/presupuesto | Order changes correctly |
| 3.3.10 | Toggle vista lista/grid | Layout switches |
| 3.3.11 | Template selector opens | Plantilla cards visible, searchable |
| 3.3.12 | usar plantilla creates proyecto from template | `crearProyectoDesdePlantilla` called |
| 3.3.13 | Pausar proyecto | `pauseModal` opens, reason required |
| 3.3.14 | Reanudar proyecto | Estado returns to ejecucion |
| 3.3.15 | Detalles modal opens on row click | `ProyectoDetailModal` shows full data |
| 3.3.16 | Resource conflicts computed | `criticalConflicts` updates when data changes |
| 3.3.17 | KPIs update after CRUD | kpis memo recomputes |
| 3.3.18 | Clonar proyecto | New proyecto with copied fields created |

### 3.4 Presupuestos
| ID | Test Case | Expected Result |
|---|---|---|
| 3.4.1 | List renders presupuestos filtered by proyecto | Correct rows shown |
| 3.4.2 | "Nuevo Presupuesto" opens form | Form visible |
| 3.4.3 | Form validation: nombre required | Error shown if empty |
| 3.4.4 | Form validation: proyecto required | Error shown if empty |
| 3.4.5 | Create presupuesto | `addPresupuesto` called, toast shown |
| 3.4.6 | Edit presupuesto | Form pre-filled, `updatePresupuesto` called |
| 3.4.7 | Delete presupuesto | Confirmation, then `deletePresupuesto` |
| 3.4.8 | Select row to view renglones | `renglonesDelPresupuesto` computed from `selectedPresupuesto.renglones` |
| 3.4.9 | Estado badge colors | borrador=amber, aprobado=emerald, rechazado=red |
| 3.4.10 | Total format | `fmtQ()` applied |
| 3.4.11 | Empty state | Empty state message when no presupuestos |

### 3.5 APU Avanzado
| ID | Test Case | Expected Result |
|---|---|---|
| 3.5.1 | Render insumos base list | Items visible with rubro/unidad/precio |
| 3.5.2 | Search filters by nombre | Reactive filter |
| 3.5.3 | Filter by rubro | Dropdown filters list |
| 3.5.4 | Filter by categoria | Dropdown filters list |
| 3.5.5 | Conversion tool | Calculates resultado and factor |
| 3.5.6 | Export CSV | Downloads file |
| 3.5.7 | Import CSV | Parses and imports insumos |

### 3.6 Hitos
| ID | Test Case | Expected Result |
|---|---|---|
| 3.6.1 | List hitos by proyecto filter | Correct hitos shown |
| 3.6.2 | Create hito | Form validates nombre/fecha, `addHito` called |
| 3.6.3 | Edit hito | Updates nombre/estado/fecha |
| 3.6.4 | Delete hito | Confirmation + `deleteHito` |
| 3.6.5 | Toggle completado | Checkbox updates estado |

### 3.7 Plantillas Proyectos
| ID | Test Case | Expected Result |
|---|---|---|
| 3.7.1 | Dashboard view renders | Cards, metrics, charts visible |
| 3.7.2 | Toggle grid/lista | Layout switches |
| 3.7.3 | Favorito toggle | Star icon toggles, list updates |
| 3.7.4 | Search by nombre/descripcion | Filters plantillas |
| 3.7.5 | Filter by categoria | Category chips filter |
| 3.7.6 | Filter by cliente | Client dropdown filters |
| 3.7.7 | New plantilla form | Validates nombre/categoria |
| 3.7.8 | Edit plantilla | `PlantillaEditorModal` opens with full structure |
| 3.7.9 | Clonar plantilla | Creates copy with new nombre |
| 3.7.10 | Exportar plantilla | JSON export |
| 3.7.11 | Importar plantilla | JSON import + validation |
| 3.7.12 | Crear proyecto desde plantilla | New proyecto created from template data |
| 3.7.13 | Nueva version | Version bump, snapshot stored |
| 3.7.14 | Restaurar version | Reverts to previous version |
| 3.7.15 | Version diff | Visual diff between versions |
| 3.7.16 | Bulk delete/export | Multi-select + actions |
| 3.7.17 | Validar integridad | Checks references before use |
| 3.7.18 | Analytics view | Charts render |

### 3.8 Base Precios
| ID | Test Case | Expected Result |
|---|---|---|
| 3.8.1 | List insumos with rubro/unidad/categoria | Table/grid renders |
| 3.8.2 | Search by nombre | Filters list |
| 3.8.3 | Filter by rubro | Dropdown filter |
| 3.8.4 | Filter by categoria | Dropdown filter |
| 3.8.5 | Add insumo | Form validates, `addInsumoBase` called |
| 3.8.6 | Edit insumo | Updates fields |
| 3.8.7 | Delete insumo | Confirmation + `deleteInsumoBase` |
| 3.8.8 | Conversion calculator | Converts between unidades |
| 3.8.9 | Zona factor applies | Prices adjust by zona |
| 3.8.10 | Export CSV | Downloads base-precios-{zona}.csv |

### 3.9 CRM
| ID | Test Case | Expected Result |
|---|---|---|
| 3.9.1 | List licitaciones | Table renders |
| 3.9.2 | Create licitacion | Form validates, `addLicitacion` called |
| 3.9.3 | Edit licitacion | Updates nombre/cliente/monto/probabilidad |
| 3.9.4 | Delete licitacion | Confirmation + `deleteLicitacion` |
| 3.9.5 | Estado badge | Visual estado indicator |

### 3.10 Cotizaciones
| ID | Test Case | Expected Result |
|---|---|---|
| 3.10.1 | List cotizaciones sorted by createdAt | Newest first |
| 3.10.2 | KPIs: total/enviadas/aprobadas/montoAprobado | Calculated correctly |
| 3.10.3 | New cotizacion form | Validates clienteNombre, tipo, renglones |
| 3.10.4 | Tipo selector | 5 tipos available with icons |
| 3.10.5 | Estado transitions | borrador → enviada → aprobada/rechazada/vencida |
| 3.10.6 | Calculadora pavimentos | Opens, calculates quantities |
| 3.10.7 | Calculadora redes infraestructura | Opens, calculates |
| 3.10.8 | Calculadora muros contencion | Opens, calculates |
| 3.10.9 | Edit cotizacion | Pre-filled form |
| 3.10.10 | Delete cotizacion | Confirmation + `deleteCotizacion` |
| 3.10.11 | Export PDF | Downloads cotizacion PDF |
| 3.10.12 | Copy cotizacion | Duplicates with new numero |

### 3.11 Seguimiento
| ID | Test Case | Expected Result |
|---|---|---|
| 3.11.1 | ProyectoSelector sticky top | Lists proyectos |
| 3.11.2 | StatusBar shows avance financiero/fisico | Percentages visible |
| 3.11.3 | Analysis tab | EVM metrics render |
| 3.11.4 | Bitacora tab | Entries filtered by proyecto |
| 3.11.5 | Cronograma tab | Gantt-like view |
| 3.11.6 | Riesgos tab | Riesgos list for proyecto |
| 3.11.7 | Weather impact panel | Shows clima/retraso |
| 3.11.8 | Tab switching | Content updates without navigation |

### 3.12 Curvas S
| ID | Test Case | Expected Result |
|---|---|---|
| 3.12.1 | Curva S chart renders | Time vs avance fisico/financiero |
| 3.12.2 | Proyecto selector filters curve | Updates chart |
| 3.12.3 | Ideal vs actual line | Both series visible |
| 3.12.4 | Hover tooltip | Shows fecha/avance values |

### 3.13 Ordenes de Cambio
| ID | Test Case | Expected Result |
|---|---|---|
| 3.13.1 | List ordenes filtered by proyecto | Correct rows |
| 3.13.2 | New orden form | Validates titulo/proyecto |
| 3.13.3 | Create orden | `addOrdenCambio` called, estado='solicitud' |
| 3.13.4 | Aprobar orden | Estado → aprobado, fechaAprobacion set |
| 3.13.5 | Rechazar orden | Estado → rechazado |
| 3.13.6 | Expand/collapse details | Chevron toggles content |
| 3.13.7 | Impacto costo/plazo displayed | Shows deltas |

### 3.14 Rendimiento Campo
| ID | Test Case | Expected Result |
|---|---|---|
| 3.14.1 | Dashboard renders | KPIs and charts visible |
| 3.14.2 | Proyecto filter | Updates metrics |
| 3.14.3 | Avance por renglon | Table with pctAvance |
| 3.14.4 | Desviacion calculations | Positive/negative indicators |

### 3.15 Muro Obra
| ID | Test Case | Expected Result |
|---|---|---|
| 3.15.1 | Feed loads publicaciones | `(publicacionesMuro || []).filter(...)` works |
| 3.15.2 | Tipo filter: avance/calidad/seguridad/general | Filters correctly |
| 3.15.3 | Proyecto filter | Filters by proyectoId |
| 3.15.4 | New publicacion | Validates texto (1-500 chars), `addPublicacionMuro` |
| 3.15.5 | Comentar publicacion | `addComentarioMuro` adds comment |
| 3.15.6 | Like publicacion | `likePublicacionMuro` increments likes |
| 3.15.7 | Empty state | "Sin publicaciones aún" shown |
| 3.15.8 | Sorted by createdAt desc | Newest first |

### 3.16 Documentos / Gestión Documental
| ID | Test Case | Expected Result |
|---|---|---|
| 3.16.1 | Tabs: Planos / RFIs / Submittals | Each tab renders correct list |
| 3.16.2 | Create plano | Form validates nombre/disciplina/version, `addPlano` |
| 3.16.3 | Edit plano | Updates estado/nombre |
| 3.16.4 | Delete plano | Confirmation + `updatePlano` (soft delete/estado) |
| 3.16.5 | Create RFI | `addRfi` called |
| 3.16.6 | Resolve RFI | Estado → respondido/cerrado |
| 3.16.7 | Create submittal | `addSubmittal` called |
| 3.16.8 | Approve submittal | Estado → aprobado |

### 3.17 Bodega
| ID | Test Case | Expected Result |
|---|---|---|
| 3.17.1 | Materiales list with dedup | Duplicates removed by nombre |
| 3.17.2 | KPIs: criticos/pendientes/conPlan | Calculated from filtered arrays |
| 3.17.3 | Stock bajo alert | `criticos` shows materiales with stock < stockMinimo |
| 3.17.4 | Valor inventario | Sum of stock * precio |
| 3.17.5 | Coverage/avgDesv | Calculated from conPlan |
| 3.17.6 | New proveedor form | `addProveedor` called |
| 3.17.7 | Edit proveedor | `updateProveedor` called |
| 3.17.8 | Delete proveedor | `deleteProveedor` with confirmation |
| 3.17.9 | New orden form | `addOrden` called |
| 3.17.10 | Edit orden | `updateOrden` called |
| 3.17.11 | Export stock PDF | Downloads PDF |

### 3.18 Logística / Compras
| ID | Test Case | Expected Result |
|---|---|---|
| 3.18.1 | Proveedores list | Renders with categoria/calificacion |
| 3.18.2 | Proveedor metrics | Puntajes calculados |
| 3.18.3 | Ordenes list | Filters by estado |
| 3.18.4 | Create proveedor | Form validates nombre/contacto |
| 3.18.5 | Edit proveedor | Updates fields |
| 3.18.6 | Delete proveedor | Confirmation |
| 3.18.7 | Categoria filter | Filters proveedores |
| 3.18.8 | Proveedor detail panel | Shows ordenes history |

### 3.19 Entradas Almacén OC
| ID | Test Case | Expected Result |
|---|---|---|
| 3.19.1 | List OC filtered by proyecto | Correct ordenes |
| 3.19.2 | Recepciones por OC | `recsPorOC` computed |
| 3.19.3 | Create recepcion | `addRecepcion` called |
| 3.19.4 | Cantidad recibida vs OC | Diferencia calculated |
| 3.19.5 | Estado updates | OC → recibida |

### 3.20 Activos
| ID | Test Case | Expected Result |
|---|---|---|
| 3.20.1 | List activos | Renders nombre/tipo/estado |
| 3.20.2 | Filter by estado | disponible/asignado/mantenimiento |
| 3.20.3 | Create activo | Form validates, `setActivos` adds |
| 3.20.4 | Edit activo | Updates estado/valor |
| 3.20.5 | Delete activo | Removes from array |
| 3.20.6 | KPIs: disponibles/asignados | Counts correct |

### 3.21 Planilla Destajos
| ID | Test Case | Expected Result |
|---|---|---|
| 3.21.1 | List destajos by semana | `destajosSemana` computed |
| 3.21.2 | Grupo por cuadrilla | `grupos` Map aggregates |
| 3.21.3 | Create destajo | Validates cuadrilla/cantidad/unidad |
| 3.21.4 | Delete destajo | Confirmation + `deleteDestajo` |
| 3.21.5 | Rendimiento real vs teorico | Desviacion shown |

### 3.22 Proveedor Analytics
| ID | Test Case | Expected Result |
|---|---|---|
| 3.22.1 | Metrics table renders | Puntaje general + sub-scores |
| 3.22.2 | Filter by categoria | Updates metricsFiltradas |
| 3.22.3 | Filter by proyecto | Filters ordenes |
| 3.22.4 | Top supplier highlight | First in sorted list |
| 3.22.5 | Avg score calculation | Mean of puntajeGeneral |
| 3.22.6 | Category distribution chart | Donut/bar chart |
| 3.22.7 | Recommendations list | `getSupplierRecommendations` output |
| 3.22.8 | Risk alerts | `identifySupplierRisks` output |
| 3.22.9 | Export XLSX | Downloads analytics file |

### 3.23 Financiero
| ID | Test Case | Expected Result |
|---|---|---|
| 3.23.1 | Movimientos list with filters | proyecto/fecha/tipo filters work |
| 3.23.2 | Ingresos vs gastos chart | Pie/bar chart renders |
| 3.23.3 | Profitability data by proyecto | `profitabilityData` computed |
| 3.23.4 | Aging cuentas cobrar | 0-30, 31-60, 61-90, 90+ buckets |
| 3.23.5 | Vencimientos cuentas pagar | Proximos 7/30 dias + vencidas |
| 3.23.6 | Balance calculation | Ingresos - Gastos = Utilidad |
| 3.23.7 | Export Excel | Downloads file |

### 3.24 Cuentas Cobrar
| ID | Test Case | Expected Result |
|---|---|---|
| 3.24.1 | List cuentas with safe fallback | `(cuentasCobrar || []).filter(...)` |
| 3.24.2 | Stats: pendientes/cobradas/vencidas/montoCobrado | Computed from filtered |
| 3.24.3 | Filter by estado | pendiente/cobrada/vencida |
| 3.24.4 | Create cuenta | Form validates, `addCuentaCobrar` |
| 3.24.5 | Edit cuenta | `updateCuentaCobrar` |
| 3.24.6 | Delete cuenta | `deleteCuentaCobrar` + confirmation |
| 3.24.7 | Vencimiento alert | Overdue accounts highlighted |

### 3.25 Cuentas Pagar
| ID | Test Case | Expected Result |
|---|---|---|
| 3.25.1 | List cuentas with safe fallback | `(cuentasPagar || []).filter(...)` |
| 3.25.2 | Stats: pendientes/pagadas/vencidas/montoPagado | Computed |
| 3.25.3 | Filter by estado | pendiente/pagada/vencida |
| 3.25.4 | Create cuenta | Form validates, `addCuentaPagar` |
| 3.25.5 | Edit cuenta | `updateCuentaPagar` |
| 3.25.6 | Delete cuenta | `deleteCuentaPagar` + confirmation |

### 3.26 Profitability Analytics
| ID | Test Case | Expected Result |
|---|---|---|
| 3.26.1 | List proyectos with profit metrics | `filteredProjects` computed |
| 3.26.2 | Forecast slider (30/60/90 dias) | `selectedForecastPeriod` updates |
| 3.26.3 | Forecast chart | EVM-based projection |
| 3.26.4 | Resource efficiency data | `resourceEfficiencyData` computed |
| 3.26.5 | Profitability alerts | Projects marked riesgoso/critico/excelente |
| 3.26.6 | KPI cards | Total proyectos, rentables, criticos |

### 3.27 Impuestos
| ID | Test Case | Expected Result |
|---|---|---|
| 3.27.1 | Movimientos filtered by proyecto/tipo | Correct rows |
| 3.27.2 | ISR/IVA calculations | Tax estimates computed |
| 3.27.3 | Deducciones list | Allowable expenses shown |
| 3.27.4 | Export tax report | Downloads file |

### 3.28 Exportación Inteligente
| ID | Test Case | Expected Result |
|---|---|---|
| 3.28.1 | Module selector | Tabs for each module |
| 3.28.2 | Date range filter | Filters movimientos/presupuestos |
| 3.28.3 | Proyecto filter | Filters data |
| 3.28.4 | Generate report | Compiles data |
| 3.28.5 | Export PDF/XLSX/CSV | Downloads correct format |

### 3.29 Comercial Finanzas
| ID | Test Case | Expected Result |
|---|---|---|
| 3.29.1 | Ventas paquetes list | Renders |
| 3.29.2 | Create venta paquete | Form validates |
| 3.29.3 | Edit venta paquete | Updates monto/cliente |
| 3.29.4 | KPIs: ventas totales/promedio | Calculated |

### 3.30 Cuadros Comparativos
| ID | Test Case | Expected Result |
|---|---|---|
| 3.30.1 | List cuadros with safe fallback | `(cuadros || []).filter(...)` |
| 3.30.2 | Stats: abiertos/cerrados/adjudicados/montoTotal | Computed |
| 3.30.3 | Search by solicitud | Filters list |
| 3.30.4 | Filter by estado | abierto/cerrado/adjudicado |
| 3.30.5 | Filter by proyecto | currentProjectId filter |
| 3.30.6 | Create cuadro | Form validates solicitud/proyectoId/fecha |
| 3.30.7 | Edit cuadro | Updates estado/adjudicadoA |
| 3.30.8 | Delete cuadro | Confirmation + `deleteCuadro` |
| 3.30.9 | Cotizaciones linked | Shows `cotizacionesNegocio` for adjudicado |

### 3.31 SSO Calidad
| ID | Test Case | Expected Result |
|---|---|---|
| 3.31.1 | Incidentes list | Renders |
| 3.31.2 | Create incidente | Form validates tipo/descripcion |
| 3.31.3 | Edit incidente | Updates estado |
| 3.31.4 | Pruebas laboratorio list | Renders |
| 3.31.5 | Create prueba | `addPrueba` called |
| 3.31.6 | Resultado prueba | Sets resultado |
| 3.31.7 | NCs list | Renders |
| 3.31.8 | Create NC | `addNC` called |
| 3.31.9 | Liberaciones list | Renders |
| 3.31.10 | Create liberacion | `addLiberacion` called |
| 3.31.11 | Checklist aprobado | Toggle updates estado |

### 3.32 Calidad Cumplimiento
| ID | Test Case | Expected Result |
|---|---|---|
| 3.32.1 | Metrics dashboard | KPI cards render |
| 3.32.2 | Incidentes por tipo | Chart renders |
| 3.32.3 | Pruebas pendientes | Count correct |
| 3.32.4 | NCs abiertas | Count correct |
| 3.32.5 | Compliance percentage | Calculated |

### 3.33 RRHH
| ID | Test Case | Expected Result |
|---|---|---|
| 3.33.1 | Empleados list | Renders nombre/puesto/salario |
| 3.33.2 | Filter by proyecto | `porProyecto` computed |
| 3.33.3 | Create empleado | Form validates, `addEmpleado` |
| 3.33.4 | Edit empleado | `updateEmpleado` |
| 3.33.5 | Delete empleado | `deleteEmpleado` + confirmation |
| 3.33.6 | Activo/inactivo toggle | Updates estado |
| 3.33.7 | Nomina calculation | Sum of salarioDiario * diasTrabajados |

### 3.34 Resource Conflicts
| ID | Test Case | Expected Result |
|---|---|---|
| 3.34.1 | Conflicts list renders | `resourceConflicts` computed |
| 3.34.2 | Stats by severidad | bajo/medio/alto/critico counts |
| 3.34.3 | Stats by tipo | empleado/material/activo/equipo/timeline |
| 3.34.4 | Filter by severidad | Severity filter works |
| 3.34.5 | Filter by tipo | Type filter works |
| 3.34.6 | Filter by estado | Status filter works |
| 3.34.7 | Critical conflicts highlighted | critico/alto severity styled |
| 3.34.8 | Suggestion panel | `showSuggestions && selectedConflict` renders |
| 3.34.9 | RBAC visibility | Administrador and Gerente can access |

### 3.35 Administración
| ID | Test Case | Expected Result |
|---|---|---|
| 3.35.1 | Tabs: Centros Costo / Usuarios / Roles | Each tab renders |
| 3.35.2 | Centros costo list | Renders |
| 3.35.3 | Create centro costo | Form validates |
| 3.35.4 | Edit centro costo | Updates nombre/presupuesto |
| 3.35.5 | Delete centro costo | Confirmation |
| 3.35.6 | Usuarios list | Renders from store |
| 3.35.7 | Roles configuration | RBAC matrix visible |

### 3.36 Ajustes
| ID | Test Case | Expected Result |
|---|---|---|
| 3.36.1 | Tab: Apariencia | Theme/appearance settings |
| 3.36.2 | Tab: Generales | Language, date format, currency |
| 3.36.3 | Tab: Notificaciones | Toggle push/email/sound |
| 3.36.4 | Tab: Datos | Backup/restore, clear cache |
| 3.36.5 | Export backup | Downloads JSON with wm_ keys |
| 3.36.6 | Import backup | File picker, validates JSON, imports |
| 3.36.7 | Tab: Cuenta | User profile display |
| 3.36.8 | Tab: Acerca | Version, credits |
| 3.36.9 | Theme switcher | Updates appTheme in store |
| 3.36.10 | Primary color picker | Updates primaryColor |
| 3.36.11 | Sidebar collapse toggle | Updates sidebarCollapsed |
| 3.36.12 | Font size selector | Updates fontSize |
| 3.36.13 | Compact mode toggle | Updates compactMode |

### 3.37 Error Log
| ID | Test Case | Expected Result |
|---|---|---|
| 3.37.1 | List error logs with safe fallback | Renders |
| 3.37.2 | Stats: open/resolved/critical | Computed |
| 3.37.3 | Filter by severity | critical/error/warning/info/debug |
| 3.37.4 | Filter by status | open/resolved |
| 3.37.5 | Filter by proyecto | currentProjectId filter |
| 3.37.6 | Search by message/component | Text search works |
| 3.37.7 | Date range filter | From/to dates |
| 3.37.8 | Sort by createdAt/severity | Sorted table |
| 3.37.9 | Pagination | 20 items per page |
| 3.37.10 | Row selection | Checkbox selects row |
| 3.37.11 | Resolve selected | `resolveError` with notes |
| 3.37.12 | Delete selected | `deleteError` with confirmation |
| 3.37.13 | Detail modal | Shows full error context/stack |
| 3.37.14 | Resolve single from modal | `handleResolve` called |
| 3.37.15 | Cleanup old errors | `cleanupOldErrors` called |

### 3.38 Auditoria
| ID | Test Case | Expected Result |
|---|---|---|
| 3.38.1 | List audit log with filters | Filters by entidad/accion/usuario/proyecto/fecha |
| 3.38.2 | Stats: creaciones/actualizaciones/eliminaciones | Computed |
| 3.38.3 | Search | Text search on entidad/valores |
| 3.38.4 | Detail modal | Shows valoresAnteriores/valoresNuevos |
| 3.38.5 | Export CSV | Downloads audit log |
| 3.38.6 | Entidad filter | Dropdown with unique entidades |
| 3.38.7 | Accion filter | Dropdown with unique acciones |
| 3.38.8 | Usuario filter | Dropdown with unique usuarios |

### 3.39 Dashboard Predictivo
| ID | Test Case | Expected Result |
|---|---|---|
| 3.39.1 | Proyecto selector | Filters dashboard |
| 3.39.2 | EAC/BAC/CPI calculations | Computed from presupuesto + movimientos |
| 3.39.3 | Fecha estimada fin | Calculated from ritmo actual |
| 3.39.4 | Riesgos altos/medios/saludables | `renglonesConAvance` classification |
| 3.39.5 | Costo MO por dia | Sum of salarioDiario for active employees |
| 3.39.6 | Weather impact panel | `weatherImpactData` rendered |
| 3.39.7 | Workable/lost days | From weather history |

### 3.40 Weather
| ID | Test Case | Expected Result |
|---|---|---|
| 3.40.1 | Fetch weather data | Calls weather service |
| 3.40.2 | Impact calculation | `calculateWeatherImpact` returns level/score |
| 3.40.3 | History chart | `WeatherHistoryChart` renders |
| 3.40.4 | Workable days count | `recent.filter(...low/medium...)` |
| 3.40.5 | Lost days count | `recent.filter(...high/critical...)` |
| 3.40.6 | Avg temp/precip | Computed from recent |
| 3.40.7 | Refresh button | Reloads data |
| 3.40.8 | Impact color coding | green/yellow/orange/red |

### 3.41 Visor BIM
| ID | Test Case | Expected Result |
|---|---|---|
| 3.41.1 | Model loads | Three.js/web-ifc renders |
| 3.41.2 | Proyecto selector | Filters linked models |
| 3.41.3 | Elementos vinculados | `elementosModelo.filter(el => vinculaciones[el.id])` |
| 3.41.4 | Zoom/pan/rotate | Orbit controls work |
| 3.41.5 | Properties panel | Shows element metadata |

### 3.42 Notificaciones
| ID | Test Case | Expected Result |
|---|---|---|
| 3.42.1 | List notificaciones | Renders with tipo/titulo/mensaje |
| 3.42.2 | Unread count badge | `notificacionesNoLeidas` count |
| 3.42.3 | Mark as leida | `markNotificacionLeida` called |
| 3.42.4 | Marcar todas leidas | `marcarTodasLeidas` called |
| 3.42.5 | Filter by tipo | TIPO_TOGGLE_MAP filters `appSettings.notificaciones` |
| 3.42.6 | Empty state | "Sin notificaciones" message |

---

## 4. Cross-Cutting Concerns

### 4.1 Forms & Validation
- [ ] All required fields show validation errors on empty submit
- [ ] Zod schemas validate on submit
- [ ] Error messages display near fields
- [ ] Forms reset after successful submit
- [ ] Cancel button closes modal without submitting
- [ ] Keyboard submit: Enter in last field triggers submit

### 4.2 CRUD Operations
- [ ] Every `add*` action appends to array
- [ ] Every `update*` action patches by id
- [ ] Every `delete*` action removes by id
- [ ] Mutation queue enqueues operation
- [ ] Toast success shown after mutation
- [ ] Optimistic UI update before sync

### 4.3 Search & Filters
- [ ] Search is case-insensitive
- [ ] Filters combine with AND logic
- [ ] Empty search shows all items
- [ ] Filters persist while navigating within screen
- [ ] Filters reset on screen re-mount

### 4.4 Sorting
- [ ] Sort by fecha uses localeCompare or Date
- [ ] Sort by nombre is alphabetical
- [ ] Sort by monto is numeric
- [ ] Ascending/descending toggle works

### 4.5 Pagination / Virtualization
- [ ] Tables with >50 rows use virtual scrolling (react-window)
- [ ] Page controls work where applicable
- [ ] Skeleton shown during load

### 4.6 Exports
- [ ] PDF export uses jspdf + html2canvas
- [ ] XLSX export uses xlsx library
- [ ] CSV export generates correct headers/rows
- [ ] Filename includes module + date
- [ ] Export fails gracefully with toast error

### 4.7 Offline-First
- [ ] App loads from localStorage when offline
- [ ] Mutation queue stores operations
- [ ] forceSync sends queued mutations when online
- [ ] Network status indicator updates
- [ ] Retry with exponential backoff on failure
- [ ] FK 23503 logged and skipped with continue

### 4.8 i18n
- [ ] All labels use `t('key')`
- [ ] No hardcoded Spanish strings in UI
- [ ] Fallback to `es.json` when key missing in `en.json`
- [ ] RTL not required (ES/EN only)

### 4.9 Accessibility
- [ ] All icon-only buttons have `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Tables have `role="table"` + `scope="col"` on headers
- [ ] Clickable rows have `tabIndex={0}` + `onKeyDown`
- [ ] Modals have `role="dialog"` + `aria-modal`
- [ ] Focus visible styles present
- [ ] Contrast ratios meet WCAG AA

### 4.10 Performance
- [ ] Screens lazy-loaded via React.lazy()
- [ ] `useMemo` used for expensive derivations
- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Bundle chunks < 500KB per route

---

## 5. Test Data Factories

```ts
// src/test/factories.ts
export const createProyecto = (overrides = {}): Proyecto => ({
  id: crypto.randomUUID(),
  nombre: 'Proyecto Test',
  cliente: 'Cliente Test',
  ubicacion: 'Zona 10',
  tipologia: 'residencial',
  estado: 'planeacion',
  presupuestoTotal: 500000,
  montoContrato: 550000,
  avanceFisico: 0,
  avanceFinanciero: 0,
  fechaInicio: '2026-01-01',
  fechaFin: '2026-12-31',
  ...overrides,
});

export const createPresupuesto = (proyectoId: string, overrides = {}): Presupuesto => ({
  id: crypto.randomUUID(),
  proyectoId,
  tipologia: 'residencial',
  renglones: [],
  estado: 'borrador',
  totalCalculado: 0,
  costoDirectoTotal: 0,
  fechaCreacion: new Date().toISOString(),
  ...overrides,
});
```

---

## 6. Execution Checklist

| Phase | Command | Coverage Target |
|---|---|---|
| Unit / Integration | `npm test` | >90% store, schemas, utils |
| Component | `npm test -- --run src/erp/__tests__` | All screens render |
| E2E | `npm run test:e2e` | Critical flows: login → proyecto → presupuesto → seguimiento |
| Visual | `npm run test:visual` | All themes + breakpoints |
| Accessibility | `npx vitest run src/__tests__/accessibility.test.tsx` | axe violations = 0 |
| Security | `npm run security:audit` | No high vulnerabilities |
| Typecheck | `npm run typecheck` | Zero errors |
| Lint | `npm run lint` | Zero errors |

---

## 7. Bug Reporting Template

```
**Screen:** [e.g. Presupuestos]
**Element:** [e.g. renglonesDelPresupuesto]
**Steps:**
1. Navigate to Presupuestos
2. Click a presupuesto row
3. Observe detail panel

**Expected:** Renglones list renders
**Actual:** TypeError: Cannot read properties of undefined (reading 'filter')
**Severity:** HIGH
**Browser/OS:** Chrome 137 / Windows 11
```

---

## 8. Traceability Matrix (Screens → Test File)

| Screen | Test File | Unit | Integration | E2E |
|---|---|---|---|---|
| Login | `login.test.tsx` | ✓ | ✓ | ✓ |
| Dashboard | `erp-kpis-data-integrity.test.tsx` | ✓ | ✓ | ✓ |
| Proyectos | `e2e-proyecto.test.ts` | ✓ | ✓ | ✓ |
| Presupuestos | `store.presupuestos.test.ts` | ✓ | ✓ | ✓ |
| Seguimiento | `erp-comprehensive-system.test.tsx` | ✓ | ✓ | ✓ |
| Financiero | `financiero.test.ts` | ✓ | ✓ | ✓ |
| Bodega | `erp-store-operations-full.test.tsx` | ✓ | ✓ | ✓ |
| ErrorLog | `ErrorLog.test.tsx` | ✓ | ✓ | ✓ |
| Auditoria | `erp-comprehensive-system.test.tsx` | ✓ | ✓ | ✓ |
| Plantillas | `erp-validacion-funcional.test.tsx` | ✓ | ✓ | ✓ |
| Ajustes | `themes.test.tsx` | ✓ | ✓ | ✓ |
| All screens | `erp-estilos-ui.test.tsx` | ✓ | ✓ | — |
| i18n | `i18n-screens.test.ts` | ✓ | — | — |
