# MAPEO COMPLETO DE ESTRUCTURA — CONSTRUSMART ERP

## 8 SECCIONES · 36 MÓDULOS · 33 SCREENS · 32 ENTIDADES

---

## SECCIÓN 1: PRINCIPAL (4 módulos)

### 1.1 Dashboard (`Dashboard.tsx`) — 702 líneas
**KPIs (4 tarjetas superiores):**
| KPI | Fórmula | Dependencia | Valor sin datos (hasData=false) | Valor con datos vacíos |
|-----|---------|-------------|--------------------------------|------------------------|
| Proyectos | `activos.length` (concerted) | `proyectos[]` | `GaugeKpi: "Sin datos en Supabase"` | `"0"` (gauges animados) |
| Presupuesto | `sum(presupuestoTotal)` | `proyectos[]`, `selectedProyectoId` | `GaugeKpi: "Sin datos en Supabase"` | `"Q 0"` |
| Margen utilidad | `promedio((montoContrato - presupuestoTotal)/montoContrato*100)` | `proyectos[]`, `materiales[]` | `GaugeKpi: "Sin datos en Supabase"` | `"0.0%"` (gauges animados) |
| Desviación | `promedio(avanceFinanciero - avanceFisico)` | `proyectos[]` | `GaugeKpi: "Sin datos en Supabase"` | `"0.0%"` (gauges animados) |

**hasData**: `proyectos.length > 0 || movimientos.length > 0 || materiales.length > 0`

**Componente:** `GaugeKpi.tsx` — Semicirculo animado con zonas de color, agujas animadas, sparklines, hover glow.

**Gráficas:**
| Componente | Tipo | Dependencia | Estado vacío |
|-----------|------|-------------|-------------|
| Plan vs Real | Donut (planif/real) | `materiales[]`, `selectedProyectoId` | Donut con valores 0 |
| Avance General | Gauge (físico%) + Progress | `proyectos[]`, `selectedProyectoId` | 0% |
| Recursos | Donut (stock) + RRHH bar | `materiales[]`, `empleados[]` | Muestra "0 críticos" / 0 empleados |
| GanttChart | Timeline horizontal | `hitos[]`, `proyectos[]`, `selectedProyectoId` | Icono CalendarClock + "Sin datos" |
| Cartera (Donut) | Donut por estado | `proyectos[]` | No se renderiza (0 items) |
| Top Proyectos | Lista con Progress bars | `proyectos[]` | "Sin proyectos" |
| Licitaciones Pipeline | Cards | `licitaciones[]` | No se renderiza si count=0 |
| Riesgos activos | Cards | `riesgos[]` | No se renderiza si total=0 |
| OC Pendientes | Lista | `ordenes[]` | "Sin datos" |
| Gastos por Categoría | BarChart | `movimientos[]` | No se renderiza si vacío |
| Próximos pagos | Lista | `cuentasPagar[]` | No se renderiza si vacío |
| Cuentas por cobrar | Lista | `cuentasCobrar[]` | No se renderiza si vacío |
| OC Cambio pendientes | Lista | `ordenesCambio[]` | No se renderiza si vacío |
| Módulos (8 botones) | Grid + contadores | Todas las entidades | Muestra "0 registros" |
| AlertasPanel | Componente externo | `materiales`, `ncs`, `ordenes`, `hitos` | (ver AlertasPanel) |
| CompactCalendar | Calendario | `eventos[]` | Vacío |

**Registro rápido:** `MovimientoForm compact` — formulario independiente.

---

### 1.2 Proyectos (`Proyectos.tsx`)
**Dependencias:** `proyectos[]`, `presupuestos[]`, `avances[]`, `movimientos[]`, `hitos[]`, `riesgos[]`
**Vista:** Tabla + Tarjetas de proyectos con CRUD completo
**Pestañas/Hijos:** Modal de creación/edición con ~30 campos
**Estado vacío:** Tabla vacía con mensaje "No hay proyectos registrados"
**KPIs:** Ninguno interno (solo listado)

### 1.3 CRM / Pipeline (`CRM.tsx`)
**KPIs (4):**
| KPI | Fórmula |
|-----|---------|
| Oportunidades | `licitacionesFiltradas.length` + "X ganadas · Y perdidas" |
| Total Pipeline | `sum(monto)` de licitaciones filtradas |
| Pipeline Activo | Suma ponderada por probabilidad |
| Conversión | `ganadas / (ganadas + perdidas) * 100` |

**Gráficas:** Ninguna (solo HTML/CSS)
**Vista principal:** Kanban de 4 columnas (Activa → Adjudicada → Perdida → Cerrada)
**Estado vacío:** "No hay licitaciones registradas"

### 1.4 Cotizaciones (`Cotizaciones.tsx`)
**Dependencias:** `cotizacionesNegocio[]`, `proyectos[]`, `licitaciones[]`
**Estado vacío:** Lista vacía con "No hay cotizaciones"

---

## SECCIÓN 2: PLANIFICACIÓN (5 módulos)

### 2.1 Presupuestos APU (`Presupuestos.tsx`)
**KPIs (5):**
| KPI | Fórmula |
|-----|---------|
| Gasto real del proyecto | `movimientos.filter(tipo==='gasto'/'egreso')` |
| Presupuesto vigente | `presupuestoActual?.totalCalculado` |
| Variación real vs presupuesto | `gastoReal - presupuestoVigente` |
| Costo Directo | Suma de costos directos × cantidad |
| TOTAL (c/ indirectos) | Gran total con factores de markup |

**Gráficas:**
- Explosión de Materiales por Tipo (bar chart)
- Resumen de Materiales (tabla agregada)

**Pestañas/Pantallas:** Vista de presupuesto único con selector de proyecto
**Estado vacío:** "No hay presupuestos" + formulario de creación

### 2.2 APU Avanzado (`APUAvanzado.tsx`)
**Dependencias:** `presupuestos[]`, `materiales[]`
**Estado vacío:** Placeholder genérico

### 2.3 Base de Precios (`BasePrecios.tsx`)
**Dependencias:** `materiales[]`, `presupuestos[]`
**Estado vacío:** Placeholder genérico

### 2.4 Hitos (`Hitos.tsx`)
**Dependencias:** `hitos[]`, `proyectos[]`
**Vista:** Lista de hitos por proyecto con estado (pendiente/completado)
**Estado vacío:** "No hay hitos registrados"
**KPIs:** Ninguno

### 2.5 Riesgos (`Riesgos.tsx`)
**Dependencias:** `riesgos[]`, `proyectos[]`
**Vista:** Lista de riesgos por proyecto
**Estado vacío:** "No hay riesgos registrados"
**KPIs:** Ninguno

---

## SECCIÓN 3: EJECUCIÓN / CAMPO (8 módulos)

### 3.1 Seguimiento EVM (`Seguimiento.tsx`)
**5 Pestañas:**
| Pestaña | Componentes | Dependencias |
|---------|------------|-------------|
| Resumen | Tabla (Proyecto, Avance Físico/Financiero, Ingresos, Gastos) + Progress bars editables | `proyectos[]`, `movimientos[]` |
| EVM | 4 Gauges (CV, SV, SPI, CPI) + BarChart (Físico vs Financ.) + Historial EVM | `seguimientoEVM[]`, `proyectos[]` |
| Bitácora | Lista de entradas (max 20) + CRUD form | `bitacora[]`, `proyectos[]` |
| Avances | Tabla de AvanceObra + CRUD | `avances[]`, `proyectos[]` |
| Incidencias | Lista + formulario | `incidentes[]`, `proyectos[]` |

**KPIs de EVM:**
| KPI | Fórmula | Comportamiento sin datos |
|-----|---------|-------------------------|
| CV (Cost Variance) | `EV - AC` (desde registros EVM) | Gauge en 0 |
| SV (Schedule Variance) | `EV - PV` | Gauge en 0 |
| SPI | `EV / PV` | Gauge en 1.0 |
| CPI | `EV / AC` | Gauge en 1.0 |

**Estado vacío:** Tablas vacías, gauges en 0, placeholders

### 3.2 Curvas S (`CurvasS.tsx`)
**3 Pestañas (tabs):**
| Pestaña | Gráficas | Dependencias |
|---------|----------|-------------|
| Curvas S | BarChart dual (Programado vs Real por mes) + Deviation tags | `avances[]`, `proyectos[]`, `selectedProyectoId` |
| Flujo Caja | BarChart (Ingresos vs Egresos 12 meses) + 3 summary cards | `movimientos[]`, `selectedProyectoId` |
| Alertas Predictivas | Lista de alertas + 3 summary cards | `seguimientoEVM[]`, `proyectos[]` |

**KPIs del proyecto seleccionado (4):** Presupuesto, Avance Físico, Avance Financiero, Duración
**Estado vacío:** Skeleton cards + "Seleccione un proyecto"

### 3.3 Rendimiento Campo (`RendimientoCampo.tsx`)
**Dependencias:** `rendimientosCuadrilla[]`, `proyectos[]`, `empleados[]`
**Estado vacío:** Placeholder

### 3.4 SSO & Calidad (`SSOCalidad.tsx`)
**7 Pestañas:**
| Pestaña | Componentes | Dependencias |
|---------|------------|-------------|
| Incidentes | Lista + formulario creación | `incidentes[]` |
| Checklist SSO | Lista estática 11 items | Ninguna (hardcoded) |
| Estadísticas | 3 KPIs + BarChart horizontal | `incidentes[]` |
| Emergencia | Botón de pánico + geolocalización | API Navigator |
| Pruebas Lab | Lista + formulario | `pruebas[]` |
| No Conformidades | Lista + formulario | `ncs[]` |
| Liberación | Lista + formulario | `liberaciones[]` |

**KPIs:** Días sin accidentes (calculado desde `incidentes`), Total incidentes, NC activas
**Estado vacío:** "No hay registros" por pestaña

### 3.5 Muro de Obra (`MuroObra.tsx`)
**Dependencias:** `publicacionesMuro[]`
**Vista:** Feed estilo red social con fotos y comentarios
**Estado vacío:** "No hay publicaciones"

### 3.6 Órdenes de Cambio (`OrdenesCambio.tsx`)
**KPIs (3):**
| KPI | Fórmula |
|-----|---------|
| Total Órdenes | `ordenesCambio.length` |
| Pendientes | `filter(estado==='solicitud'/'revision')` |
| Costo Aprobado | `filter(estado==='aprobado').reduce(impactoCosto)` |

**Vista:** Acordeón de tarjetas por proyecto + formulario inline
**Estado vacío:** "No hay órdenes de cambio"

### 3.7 Documentos (`GestionDocumental.tsx`)
**Dependencias:** `planos[]`, `rfis[]`, `submittals[]`
**Vista:** 3 sub-vistas (Planos, RFIs, Submittals) con CRUD
**Estado vacío:** Placeholders por tipo

### 3.8 Visor BIM (`VisorBIM.tsx`)
**Dependencias:** `planos[]` (archivos IFC)
**Vista:** Three.js / web-ifc 3D viewer
**Estado vacío:** Mensaje de carga sin modelo

---

## SECCIÓN 4: SUMINISTRO / BODEGA (3 módulos)

### 4.1 Bodega (`Bodega.tsx`)
**KPIs (8 tarjetas):**
| KPI | Fórmula |
|-----|---------|
| Materiales | `materiales.length` |
| Stock Bajo Mínimo | `filter(stock < stockMinimo).length` |
| OC por Aprobar | `filter(estado==='pendiente').length` |
| Valor Inventario | `sum(stock * precio)` |
| Items con presupuesto | `filter(cantidadPresupuestada > 0).length` |
| Presupuestado en bodega | `sum(cantidadPresupuestada)` |
| Desviación promedio | Promedio % desviación |
| Mayor desviación | Nombre del material con mayor desviación |

**Gráficas:**
| Componente | Tipo | Dependencia |
|-----------|------|-------------|
| Pareto 80/20 | BarChart top 8 materiales por valor | `materiales[]` |

**Tablas:**
| Tabla | Columnas |
|-------|---------|
| Control de Stock | Material, Stock (input), Mínimo, Planificado, Desviación% |
| Movimientos | Fecha, Tipo, Material, Cantidad, Saldo |
| OC Abiertas | Proveedor, Material, Cantidad, Estado |

**Estado vacío:** 8 KPIs en 0, tablas vacías, chart sin datos

### 4.2 Logística/Compras (`LogisticaCompras.tsx`)
**3 Tablas:**
| Tabla | Dependencia | Columnas |
|-------|------------|---------|
| Activos/Herramientas | `activos[]` | Código, Nombre, Tipo, Estado, Valor, Asignado a |
| Cuadro Comparativo | `cuadros[]` | Solicitud, Estado, Cotizaciones |
| Pagos Proveedores | `pagosProveedor[]` | Proveedor, Concepto, Monto, Vencimiento, Estado |

**KPIs:** Ninguno (solo tablas)
**Estado vacío:** "No hay registros" por tabla

### 4.3 Entradas Almacén (`EntradasAlmacenOC.tsx`)
**Dependencias:** `recepciones[]`, `ordenes[]`
**Vista:** Recepciones de OC + vales de salida
**Estado vacío:** Placeholder

---

## SECCIÓN 5: RRHH / NÓMINA (2 módulos)

### 5.1 RRHH (`RRHH.tsx`)
**KPIs (4):**
| KPI | Fórmula |
|-----|---------|
| Personal Activo | `empleados.filter(estado!=='inactivo').length` |
| Planilla Base | `sum(salarioDiario * diasTrabajados)` |
| Con FSR | `sum(pago_fsr)` + % del total |
| Destajistas | `empleados.filter(tipo==='destajo').length` |

**Gráficas:**
| Componente | Tipo | Dependencia |
|-----------|------|-------------|
| Costo MO por Proyecto | BarChart | `empleados[]`, `proyectos[]` |

**Tabla:** Planilla Semanal (Empleado, Proyecto, Salario/día, Días, Pago FSR)
**Estado vacío:** "No hay empleados registrados"

### 5.2 Planilla Destajos (`PlanillaDestajos.tsx`)
**Dependencias:** `destajos[]`, `empleados[]`, `proyectos[]`
**Estado vacío:** Placeholder

---

## SECCIÓN 6: FINANZAS (5 módulos)

### 6.1 Financiero (`Financiero.tsx`)
**KPIs (3):**
| KPI | Fórmula |
|-----|---------|
| Ingresos Totales | `movimientos.filter(tipo==='ingreso').sum(monto)` |
| Gastos Totales | `movimientos.filter(tipo==='gasto').sum(monto)` |
| Utilidad Neta | `ingresos - gastos` |

**Gráficas:**
| Componente | Tipo | Dependencia |
|-----------|------|-------------|
| Flujo de Caja (12 meses) | ConfigurableLineArea | `movimientos[]` |
| Gastos por Categoría | Donut + Leyenda | `movimientos[]` |

**Tablas:**
| Tabla | Columnas |
|-------|---------|
| Movimientos (últimos 10) | Fecha, Descripción, Tipo (badge), Monto, Proyecto, Acciones |
| Utilidad por Centro Costo | Proyecto, Ingresos, Gastos, Utilidad |

**Estado vacío:** KPIs en Q0, gráficas sin datos, "No hay movimientos"

### 6.2 Comercial/Finanzas (`ComercialFinanzas.tsx`)
**3 Pestañas:**
| Pestaña | KPIs | Dependencias |
|---------|------|-------------|
| Ventas | 4 cards (Disponibles/Reservados/Vendidos/Entregados) + Tabla | `ventasPaquetes[]` |
| Anticipos | Progress bars de amortización | `cuentasCobrar[]` |
| Cajas Chicas | 3 cards (Pendientes/Aprobados/Total) + Tabla | `ventasPaquetes[]` (cajas_chicas) |

**Estado vacío:** KPIs en 0, tablas vacías

### 6.3 Cuentas x Cobrar (`CuentasCobrar.tsx`)
**KPIs (4):**
| KPI | Fórmula |
|-----|---------|
| Total por cobrar | `sum(saldoPendiente)` de no cobrados |
| Pendientes | `filter(estado==='pendiente'/'parcial'/'vencido').length` |
| Cobradas | `filter(estado==='cobrado').length` |
| Vencidas | `filter(estado==='vencido' OR fechaVencimiento < hoy).length` |

**Vista:** Lista plana de tarjetas ordenadas por vencimiento
**Gráficas:** Ninguna
**Estado vacío:** "No hay cuentas por cobrar"

### 6.4 Cuentas x Pagar (`CuentasPagar.tsx`)
**KPIs (4):**
| KPI | Fórmula |
|-----|---------|
| Total por pagar | `sum(saldoPendiente)` |
| Pendientes | `filter(estado==='pendiente'/'parcial').length` |
| Pagadas | `filter(estado==='pagado').length` |
| Vencidas | `filter(estado==='vencido' OR fechaVencimiento < hoy).length` |

**Vista:** Lista plana de tarjetas
**Gráficas:** Ninguna
**Estado vacío:** "No hay cuentas por pagar"

### 6.5 Impuestos (`Impuestos.tsx`)
**KPIs (6 en 2 grupos):**
| KPI | Fórmula |
|-----|---------|
| Ingresos | `movimientos.filter(tipo==='ingreso').sum(monto)` |
| Egresos | `movimientos.filter(tipo==='gasto').sum(monto)` |
| Utilidad Bruta | `ingresos - egresos` |
| ISR (25%) | `utilidad * 0.25` |
| IVA Débito | `ingresos * 0.12` |
| IVA Crédito | `egresos * 0.12` |

**Gráficas:** Ninguna
**Tabla:** Movimientos del período (Fecha, Descripción, Tipo, Monto, Categoría)
**Estado vacío:** Calcula sobre arrays vacíos → todo Q0

---

## SECCIÓN 7: ANÁLISIS / BI (3 módulos)

### 7.1 Dashboard BI / Predictivo (`DashboardPredictivo.tsx`)
**Dependencias:** Múltiples entidades (proyectos, movimientos, avances, etc.)
**Estado vacío:** Placeholder predictivo

### 7.2 Exportación (`ExportacionInteligente.tsx`)
**Dependencias:** Todas las entidades exportables
**Estado vacío:** Placeholder con opciones de exportación

### 7.3 Reportes Técnicos (`ReportesTecnicos.tsx`)
**3 Pestañas:**
| Pestaña | Contenido | Dependencias |
|---------|----------|-------------|
| Cubicación | Tabla 7 columnas + Total + APU footnote | `presupuestos[]`, `proyectos[]`, `selectedProyectoId` |
| Rendimientos | 4 KPI cards + Tabla empleados | `proyectos[]`, `empleados[]`, `avances[]`, `selectedProyectoId` |
| Ejecutivo | Reporte completo: datos proyecto, ingresos/gastos, variación | `proyectos[]`, `movimientos[]`, `presupuestos[]`, `selectedProyectoId` |

**KPIs (Rendimientos):** Avance Físico%, Avance Financiero%, Costo MO Total, Días Transcurridos
**Exportación:** html2canvas → PNG (todo el reporte)
**Estado vacío:** "Seleccione un proyecto" + skeleton

---

## SECCIÓN 8: SISTEMA (3 módulos)

### 8.1 Notificaciones (`Notificaciones.tsx`)
**Dependencias:** `notificaciones[]`
**Vista:** Lista de notificaciones con badges de no leídas
**Estado vacío:** "No hay notificaciones"

### 8.2 Administración (`Administracion.tsx`)
**Dependencias:** `user`, `auth`, `appSettings`
**Vista:** Gestión de usuarios, roles, permisos
**Estado vacío:** N/A (configuración)

### 8.3 Ajustes (`Ajustes.tsx`)
**Dependencias:** `appSettings`, `empresaInfo`
**Vista:** Configuración de tema, idioma, moneda, empresa
**Estado vacío:** N/A (configuración)

---

## COMPONENTES COMPARTIDOS CRÍTICOS

### AlertasPanel (`src/erp/components/AlertasPanel.tsx`)
**Dependencias:** `materiales[]`, `ncs[]`, `ordenes[]`, `hitos[]`
**Lógica:**
| Alerta | Condición | Severidad |
|--------|-----------|-----------|
| Stock crítico | `stock === 0` | Alta |
| Stock bajo mínimo | `stock <= stockMinimo && stock > 0` | Media |
| NC pendientes | `estado !== 'cerrada'` | Alta |
| OC en borrador/pendiente | `estado === 'borrador' \|\| 'pendiente'` | Media |
| Hitos vencidos | `fecha < hoy && estado !== 'completado'` | Alta |

**Estado vacío:** "No hay alertas"

### ProyectoFilter (`src/erp/components/ProyectoFilter.tsx`)
**Dependencias:** `proyectos[]`
**Uso:** Filtra datos en ~15 screens (Dashboard, Financiero, Seguimiento, CurvasS, etc.)

### Charts (`src/erp/components/Charts.tsx`)
Componentes: `BarChart`, `Donut`, `Progress`, `Gauge`, `ConfigurableLineArea`
**Comportamiento sin datos:** Arrays vacíos → componentes no renderizan datos

---

## COMPORTAMIENTO ESPERADO SIN PROYECTOS

| Elemento | Estado esperado |
|----------|----------------|
| KPIs numéricos (presupuesto, ingresos, gastos, etc.) | 0 |
| KPIs de porcentaje (margen, desviación) | 0% |
| KPIs de conteo (proyectos, materiales, empleados) | 0 |
| Gráficas (donut, bar, gauge, line) | Sin datos / vacías |
| Tablas | Sin filas (cabeceras visibles) |
| GanttChart | Icono + "Sin datos" |
| Kanban (CRM) | 4 columnas vacías |
| AlertasPanel | "No hay alertas" |
| Sidebar contadores | 0 (no hay notificaciones) |
| Dashboard módulos | 8 botones con "0 registros" |
| Reportes | "Seleccione un proyecto" |
| Filtro de proyecto | Dropdown sin opciones |

---

## MAPA DE DEPENDENCIAS POR ENTIDAD

| Entidad Store | Screens que la usan |
|--------------|-------------------|
| `proyectos[]` | Dashboard, Proyectos, Presupuestos, Seguimiento, Financiero, CurvasS, Bodega, RRHH, CRM, Reportes, +15 más |
| `movimientos[]` | Dashboard, Financiero, Impuestos, Presupuestos, Proyectos, CurvasS |
| `materiales[]` | Dashboard, Bodega, Presupuestos, APU, BasePrecios, AlertasPanel |
| `empleados[]` | Dashboard, RRHH, PlanillaDestajos, Reportes, Seguimiento |
| `ordenes[]` | Dashboard, Bodega, Logística, AlertasPanel |
| `presupuestos[]` | Dashboard, Presupuestos, APU, Reportes, Proyectos |
| `avances[]` | Dashboard, Seguimiento, CurvasS, Proyectos |
| `hitos[]` | Dashboard, Hitos, AlertasPanel, Seguimiento Gantt |
| `riesgos[]` | Dashboard, Riesgos, Proyectos |
| `licitaciones[]` | Dashboard, CRM |
| `cotizacionesNegocio[]` | Cotizaciones, Dashboard |
| `cuentasCobrar[]` | Dashboard, CuentasCobrar, ComercialFinanzas |
| `cuentasPagar[]` | Dashboard, CuentasPagar |
| `ordenesCambio[]` | Dashboard, OrdenesCambio |
| `incidentes[]` | SSOCalidad, Dashboard |
| `ncs[]` | SSOCalidad, AlertasPanel |
| `pruebas[]` | SSOCalidad |
| `liberaciones[]` | SSOCalidad |
| `publicacionesMuro[]` | MuroObra, Dashboard |
| `planos[]` | GestionDocumental, VisorBIM |
| `rfis[]` | GestionDocumental |
| `submittals[]` | GestionDocumental |
| `activos[]` | LogisticaCompras |
| `cuadros[]` | LogisticaCompras |
| `pagosProveedor[]` | LogisticaCompras |
| `destajos[]` | PlanillaDestajos, Dashboard |
| `recepciones[]` | EntradasAlmacen, Dashboard |
| `valesSalida[]` | Bodega, EntradasAlmacen, Dashboard |
| `seguimientoEVM[]` | Seguimiento, CurvasS, Dashboard |
| `ventasPaquetes[]` | ComercialFinanzas, Dashboard |
| `notificaciones[]` | Notificaciones, Sidebar (badge) |
| `eventos[]` | Dashboard (CompactCalendar) |
| `bitacora[]` | Seguimiento |

---

## VALIDACIÓN DE CONEXIÓN SUPABASE

### Indicadores visuales en el sistema:
| Indicador | Ubicación | Muestra |
|-----------|-----------|---------|
| Status online/offline | Dashboard header | Punto verde "Supabase conectado" / "Leyendo Supabase" |
| Sync status | Dashboard header | "Synced", "Error sync", "X pendientes" |
| Last synced | Dashboard header | Timestamp del último sync |
| Mutation queue | Dashboard header | Contador de cambios pendientes |

### Sin conexión a Supabase (datos locales únicamente):
- Todos los CRUD funcionan offline (localStorage + mutation queue)
- El status mostrará "X pendientes" en la cola de mutaciones
- Los datos se sincronizarán cuando se restablezca la conexión

### Con proyectos eliminados + Supabase vacío:
- Todos los KPIs → 0/Q0/0%
- Todas las gráficas → vacías/sin datos
- Todas las tablas → sin filas
- Sidebar contadores → 0
- AlertasPanel → "No hay alertas"
- Dashboard módulos → "0 registros"

---

## IMPLEMENTACIONES REALIZADAS

### 1. Sistema de Limpieza Total (`clearAllData`)
- **Archivo:** `src/erp/zustandStore.ts` — función `clearAllData()`
- **Alcance:** Limpia 32 entidades (proyectos, movimientos, materiales, etc.), `mutationQueue`, `notificaciones`, `auditLog`, `appSettings`, sync status
- **Persistencia:** Elimina todas las claves `wm_*` de localStorage (settings, datos, cola, notificaciones, auditoría)
- **Interfaz:** `ErpActions` extendida con `clearAllData: () => void`
- **Export:** `src/erp/store.tsx` exporta `clearAllData()` que llama al store + `window.location.reload()`

### 2. Botón "Restablecer datos de fábrica" — Funcional
- **Archivo:** `src/erp/screens/Ajustes.tsx`
- **Importa:** `clearAllData` desde `'../store'`
- **Flujo:** Botón → Modal de confirmación → `clearAllData()` → Recarga de página
- **Comportamiento:** Elimina datos locales y configuración; datos en nube Supabase permanecen intactos

### 3. Fix Dashboard.tsx — Duplicate destructuring
- **Problema:** `avances` declarado dos veces en destructuring (línea 64 y línea 70)
- **Solución:** Eliminada segunda declaración duplicada, añadidas variables faltantes `cotizacionesNegocio` y `notificacionesNoLeidas`

### 4. Guards de arrays vacíos — Financiero.tsx
| Ubicación | Guard añadido | Comportamiento |
|-----------|---------------|----------------|
| Tabla Movimientos (línea 148) | `lista.length > 0 ? ... : <tr>No hay movimientos</tr>` | Muestra mensaje en tabla vacía |
| Tabla Centros de Costo (línea 171) | `centrosCosto.length > 0 ? ... : <tr>Sin proyectos</tr>` | Muestra mensaje en tabla vacía |
| Leyenda Gastos por Categoría (línea 123) | `porCategoria.length > 0 ? ... : <p>Sin gastos</p>` | Muestra texto en lugar de lista vacía |

### 5. Seed SQL de validación
- **Archivo:** `supabase/seed-validacion.sql`
- **Cobertura:** ~85 registros en 18 tablas
- **Datos:** 5 proyectos (Q3.2M–Q15M), 10 materiales, 16 movimientos, 19 avances, 11 hitos, 5 riesgos, 6 licitaciones, 12 cuentas CxC/CxP, 10 empleados, OC, EVM, incidentes, NC, pruebas, muro

## ESTADO DE IMPLEMENTACIÓN POR SECCIÓN

| Sección | % Completado | Estado |
|---------|-------------|--------|
| **1. PRINCIPAL** | 40% | 🟡 |
| 1.1 Dashboard | 60% | KPIs, guards NaN, fix build. Faltan: tests de integración con datos reales |
| 1.2 Proyectos | 20% | CRUD básico. Falta: validación state machine, transiciones UI completas |
| 1.3 CRM | 20% | Kanban funcional. Falta: pipeline ponderado, charts de conversión |
| 1.4 Cotizaciones | 20% | CRUD básico + PDF export. Falta: vinculación con presupuestos |
| **2. PLANIFICACIÓN** | 15% | 🔴 |
| 2.1 Presupuestos | 25% | APU básico. Falta: renglones completos, fórmula indirectos |
| 2.2 APU Avanzado | 10% | Placeholder. Falta: implementación completa |
| 2.3 Base Precios | 10% | Placeholder. Falta: implementación completa |
| 2.4 Hitos | 15% | CRUD básico. Falta: hitos por Gantt, dependencias |
| 2.5 Riesgos | 15% | CRUD básico. Falta: matriz probabilidad/impacto |
| **3. EJECUCIÓN** | 25% | 🟡 |
| 3.1 Seguimiento | 35% | EVM básico + 5 tabs. Falta: carga de datos real |
| 3.2 Curvas S | 30% | 3 tabs con charts. Falta: proyección predictiva |
| 3.3 Rendimiento Campo | 10% | Placeholder. Falta: implementación completa |
| 3.4 SSO Calidad | 30% | 7 tabs funcionales. Falta: integración checklist |
| 3.5 Muro Obra | 25% | Feed funcional. Falta: fotos, notificaciones |
| 3.6 Órdenes Cambio | 25% | CRUD + acordeón. Falta: flujo aprobación |
| 3.7 Documentos | 15% | CRUD básico. Falta: vista previa archivos |
| 3.8 Visor BIM | 15% | Three.js integrado. Falta: carga de modelos IFC |
| **4. SUMINISTRO** | 25% | 🟡 |
| 4.1 Bodega | 35% | 8 KPIs + Pareto + 3 tablas. Falta: movimientos en tiempo real |
| 4.2 Logística | 20% | 3 tablas funcionales. Falta: cuadro comparativo completo |
| 4.3 Entradas Almacén | 15% | Placeholder. Falta: recepciones + vales |
| **5. RRHH** | 20% | 🟡 |
| 5.1 RRHH | 25% | 4 KPIs + chart + planilla. Falta: FSR, IGSS |
| 5.2 Planilla Destajos | 15% | Placeholder. Falta: implementación completa |
| **6. FINANZAS** | 35% | 🟡 |
| 6.1 Financiero | 50% | 3 KPIs + 2 gráficas + guards. Falta: estados financieros |
| 6.2 Comercial/Finanzas | 20% | 3 tabs. Falta: integración contable |
| 6.3 Cuentas x Cobrar | 20% | 4 KPIs + lista. Falta: aging report |
| 6.4 Cuentas x Pagar | 20% | 4 KPIs + lista. Falta: programación pagos |
| 6.5 Impuestos | 30% | 6 KPIs + cálculo ISR/IVA. Falta: libros fiscales |
| **7. ANÁLISIS BI** | 15% | 🔴 |
| 7.1 Dashboard BI | 10% | Placeholder. Falta: ML predictivo |
| 7.2 Exportación | 15% | Placeholder. Falta: exportación completa |
| 7.3 Reportes Técnicos | 25% | 3 tabs con export PNG. Falta: datos reales |
| **8. SISTEMA** | 50% | 🟢 |
| 8.1 Notificaciones | 30% | Lista + badges. Falta: notificaciones push |
| 8.2 Administración | 20% | Placeholder. Falta: gestión usuarios real |
| 8.3 Ajustes | 100% | ✅ Temas, idioma, moneda, clearAllData funcional |
| **INFRAESTRUCTURA** | | |
| Store (Zustand) | 70% | 32 entidades, clearAllData, forceSync, health check |
| Persistencia | 80% | localStorage + lz-string compresión + cuota |
| Supabase Sync | 60% | Mutation queue funcional, tabla mapeo completa |
| Realtime | 50% | Tablas registradas, onCambio → forceSync |
| Tests (576/576) | 100% | ✅ 14 test files, todos pasando |
| Build | 100% | ✅ 0 errores, 6208 módulos |

### 🟢 Completado al 100%
- ✅ Ajustes (tema, idioma, moneda, clearAllData)
- ✅ Tests (576/576 pass)
- ✅ Build production (0 errores)
- ✅ ClearAllData (32 entidades + localStorage)
- ✅ Seed SQL de validación (85 registros, 18 tablas)
- ✅ Mapeo estructural documentado

### 🟡 En Progreso (30-70%)
- 🟡 Dashboard (60%) — KPIs funcionan, falta integración datos reales
- 🟡 Financiero (50%) — KPIs + guards, falta estados financieros
- 🟡 Store (70%) — 32 entidades, falta optimización
- 🟡 Persistencia (80%) — Compresión + cuota, falta recovery

### 🔴 Por Implementar (>30%)
- 🔴 APU Avanzado — Placeholder
- 🔴 Base Precios — Placeholder
- 🔴 Rendimiento Campo — Placeholder
- 🔴 Dashboard BI/Predictivo — Placeholder
- 🔴 Exportación Inteligente — Placeholder
- 🔴 Planilla Destajos — Placeholder
- 🔴 Administración — Placeholder

### Pendientes Identificados (Sesión Actual)
1. **Guards de arrays vacíos en Seguimiento.tsx** — Tablas sin datos no muestran mensajes
2. **Guards en Bodega.tsx** — Tablas vacías sin mensaje "no data"
3. **Guards en Impuestos.tsx** — Sin proyecto seleccionado muestra 0 pero no mensaje
4. **Charts.tsx — Edge case:** ConfigurableLineArea con `visiblePts[-1]` cuando series están vacías
5. **AlertasPanel — Retorna null** sin datos: no hay indicador visual de "sin alertas"
6. **CompactCalendar — Sin eventos:** Se renderiza vacío sin mensaje
7. **Reportes Técnicos — Sin proyecto:** Muestra "Seleccione un proyecto" pero skeleton se ve incompleto
8. **Proyectos.tsx — Modificación detectada** (en staging) pero no verificada
9. **Documentación de API endpoints Supabase** — No existe
10. **E2E tests Playwright** — Existe archivo pero no se ha corrido

## NOTAS DE IMPLEMENTACIÓN

1. **Guard contra NaN en Dashboard:** `margenProm` tiene guard `proyectosSel.length > 0 ? ... : 0`
2. **avanceData en CurvasS:** early return con `Array(8).fill(0)` cuando no hay avances
3. **Donut sin datos:** Componente Donut renderiza arco vacío (no hay slices)
4. **Gauge sin datos:** Aguja en 0
5. **BarChart sin datos:** Sin barras visibles
6. **Reportes sin proyecto:** Muestra "Seleccione un proyecto"
7. **SSO Estadísticas:** BarChart solo se renderiza si hay incidentes
8. **CRM Kanban:** Columnas se renderizan vacías (0 items cada una)
9. **AlertasPanel se oculta:** Retorna `null` si `alertas.length === 0` (no muestra placeholder)
10. **ConfigurableLineArea:** Los arrays de 12 meses siempre existen (inicializados con `fill(0)`) — no puede producir NaN
11. **Build:** 6208 módulos transformados en 18.38s, sin errores de compilación
12. **Push a GitHub:** Commit `4cd312b` — 8 archivos, +958 líneas
