# 🗺️ Roadmap de Desarrollo: ERP Integral Constructora WM
> **Instrucciones para el Agente de IA:** Sigue este checklist secuencialmente. Cada módulo cuenta con sus reglas de negocio y validaciones técnicas. Marca con `[x]` al completar y verificar el funcionamiento de cada feature.


BLOQUE 0: PANTALLAS DEL DASHBOARD (INTERFAZ VISUAL Y CONTROL)

### 0.1 Dashboard Gerencial / Ejecutivo (Vista Multi-Proyecto)
* [x] **KPIs de Rendimiento Global:** Cuadros numéricos de alto impacto en la cabecera: *Margen de Utilidad Promedio, Total de Proyectos Activos, Presupuesto Total en Ejecución, Desviación Global de Costos*.
* [x] **Gráfica de Curva S Consolidada:** Gráfico de líneas interactivas que compare el Avance Programado vs. Avance Real de todas las obras activas.
* [x] **Mapa de Calor de Proyectos (Geolocalización):** Implementado con SVG animado en Proyectos.tsx mostrando pines interactivos con colores de alerta (Verde: En tiempo/costo, Amarillo: Riesgo, Rojo: Desviado) usando coordenadas lat/lng.
* [x] **Tabla de Estado de Licitaciones:** Widget `LicitacionesDashboard.tsx` implementado e integrado en Dashboard.tsx con KPIs de pipeline comercial, lista compacta de oportunidades activas, y enlace al módulo CRM completo.

### 0.2 Dashboard de Control de Proyecto Individual (Vista del Residente)
* [x] **Métricas del Valor Ganado (EVM):** Implementado en Seguimiento.tsx con indicadores de Variación de Costo y Tiempo.
* [x] **Widget de Avance Físico vs. Financiero:** Implementado en Proyectos.tsx con barras de progreso para cada proyecto.
* [x] **Feed de Bitácora y Fotos Recientes:** Implementado en Seguimiento.tsx con entradas cronológicas de bitácora.
* [x] **Alerta de Renglones Críticos:** Componente `CriticalRenglonAlert.tsx` implementado y integrado en Dashboard.tsx.

### 0.3 Dashboard de Compras, Logística e Inventarios
* [x] **Gráfica de Pareto (Regla 80/20) de Materiales:** Implementado en Bodega.tsx.
* [x] **Panel de Órdenes de Compra por Aprobar:** Implementado con flujo de aprobación por rol.
* [x] **Widget de Alertas de Stock de Bodega:** Implementado con filtros y notificaciones toast.

### 0.4 Dashboard Financiero y Control de Caja
* [x] **Gráfica de Flujo de Caja Proyectado (Cash Flow):** Implementado en Financiero.tsx con toggle Real/Proyectado, alertas de déficit, tarjetas mensuales detalladas.
* [x] **Widget de Cajas Chicas por Validar:** Componente `CajasChicasWidget.tsx` implementado e integrado en Dashboard.tsx con lista de facturas recientes, estado pendiente/aprobada, montos totales y botón de validación.
* [x] **Resumen de Utilidad Neta por Centro de Costo:** Implementado en Dashboard.tsx y Financiero.tsx.

---

## 🏗️ BLOQUE 1: INGENIERÍA Y CONTROL DE PROYECTOS (EL NÚCLEO)

### 1.1 Módulo de Presupuestos y APUs (Motor de Cálculo)
* [x] **Desglose Matricial de APU:** Implementado con interfaces completas.
* [x] **Cálculo Automático de FSR (Factor de Salario Real):** Implementado en utils.ts.
* [x] **Rendimientos Inversos:** Implementado con función `duracionPorRendimiento()`.
* [x] **Porcentaje de Herramienta Menor:** Configurable en utils.ts.
* [x] **Motor de Recálculo en Cascada (Precios Dinámicos):** Implementado en Presupuestos.tsx via `useMemo`.
* [x] **Vinculación Proyecto-Presupuesto (1:N):** Implementado con tabla `erp_presupuestos`, FK a proyectos, CRUD completo, historial de versiones.
* [x] **Trigger de recálculo global desde catálogo de insumos:** Implementado en migración v1.1.0 (`fn_recalcular_presupuestos_por_insumo` trigger en `erp_insumos`).

### 1.2 Módulo de Planificación (Cronograma Dinámico)
* [x] **Generación de Duración por Rendimiento:** Implementado.
* [x] **Diagrama de Gantt Interactivo (Reactivo):** Componente `GanttChart.tsx` implementado.
* [x] **Vínculo Cantidad-Tiempo:** Implementado.

### 1.3 Módulo de Control de Campo y Bitácora Digital
* [x] **Reporte Diario Móvil (UI PWA/Responsiva):** Implementado en Seguimiento.tsx.
* [x] **Módulo de Destajos / Rendimiento Real:** Implementado en `RendimientoCampo.tsx` con captura diaria por cuadrilla, cálculo automático de eficiencia vs teórico.
* [x] **Carga de Evidencia Fotográfica:** Implementado — Supabase Storage buckets creados (`erp_fotos_avances`, `erp_documentos`, `erp_facturas`) + helper `storage.ts` con upload, base64-to-storage, delete, políticas RLS.

---

## 🛒 BLOQUE 2: CADENA DE SUMINISTRO Y LOGÍSTICA

### 2.1 Módulo de Gestión de Compras
* [x] **Vinculación con Explosión de Materiales:** Implementado en `useNuevosModulos.ts` con `verificarExplosionMateriales()`.
* [x] **Cuadro Comparativo de Proveedores:** Implementado en `LogisticaCompras.tsx` con cotizaciones, adjudicación, selección.
* [x] **Flujo de Aprobación de OC:** Implementado con validación por rol.
* [x] **Creación de Ordenes de Compra:** Implementado en `Bodega.tsx` con formulario de creación, validación y sincronización con Supabase.

### 2.2 Módulo de Inventarios y Bodegas
* [x] **Entradas de Almacén vs OC:** Implementado en `EntradasAlmacenOC.tsx` con validación cantidades recibidas vs OC, alertas de excedente, histonal de recepciones, descuento automático de stock.
* [x] **Vales de Salida Destinados a Renglón:** Implementado en `RendimientoCampo.tsx` (tab Vales x Renglón) con imputación a código de renglón.
* [x] **Alertas de Stock Mínimo:** Notificaciones automáticas cuando materiales críticos bajen del umbral (verificarStockCritico en store.tsx).
* [x] **Control de Activos y Herramientas:** Implementado en `LogisticaCompras.tsx` (tab Activos) con asignación por operador/cuadrilla.

---

## 💼 BLOQUE 3: ADMINISTRACIÓN, FINANZAS Y COMERCIAL

### 3.1 Módulo Comercial y CRM Inmobiliario
* [x] **Pipeline de Licitaciones (Kanban):** Módulo CRM completo implementado con 5 columnas, KPIs, seed data, persistencia offline.
* [x] **Control de Ventas y Paquetes:** Implementado en `ComercialFinanzas.tsx` (tab Ventas) con preventa, reservaciones, estados disponible/reservado/vendido/entregado, pipeline visual y KPIs.

### 3.2 Módulo de Tesorería y Flujo de Caja
* [x] **Gestión y Amortización de Anticipos:** Implementado en `ComercialFinanzas.tsx` (tab Anticipos) con amortización, saldo pendiente, historial, barra de progreso.
* [x] **Cajas Chicas de Obra:** Implementado en `ComercialFinanzas.tsx` (tab Cajas Chicas) con carga de gastos, aprobación/rechazo, KPIs por estado.
* [x] **Programación de Pagos a Proveedores:** Implementado en `LogisticaCompras.tsx` (tab Pagos) con vista consolidada, alertas de vencidos, botón pagar.

### 3.3 Módulo de Contabilidad, Impuestos y Planillas
* [x] **Estructura por Centros de Costo:** Implementado en `Administracion.tsx` (tab Centros Costo) con proyecto como centro de costo, presupuesto asignado, gasto actual, % ejecución, alertas.
* [x] **Planilla de Destajos:** Implementado en `PlanillaDestajos.tsx` con pago semanal basado en volumen ejecutado, tasas configurables por cuadrilla, export CSV, KPIs.
* [x] **Automatización de Impuestos:** Implementado en `Impuestos.tsx` con cálculo ISR (25% s/utilidad) e IVA débito/crédito (12%), filtro por período y proyecto, detalle de base imponible.

---

## 📊 BLOQUE 4: INTELIGENCIA DE NEGOCIOS Y SEGURIDAD

### 4.1 Módulo de Inteligencia de Negocios (BI)
* [x] **Cálculo de Métricas EVM:** Implementado en Seguimiento.tsx.
* [x] **Dashboard de Curva S:** Implementado en Dashboard.tsx.
* [x] **Diagrama de Pareto de Insumos:** Implementado en Bodega.tsx.

### 4.2 Módulo de Seguridad y Auditoría (RBAC)
* [x] **Control de Acceso Basado en Roles (RBAC):** Implementado en store.tsx con matriz `ALLOWED`.
* [x] **Logs de Auditoría Imborrables:** Implementado en migración v1.1.0 (`logs_sistema` tabla + `fn_log_audit` trigger genérico) y `Administracion.tsx` (tab Auditoría).
