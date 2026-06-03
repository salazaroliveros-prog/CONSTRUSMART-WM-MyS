# ERP CONSTRUSMART - Status Report

## ✅ ARQUITECTURA Y TIPO
| # | Item | Estado | Acción Requerida |
|---|------|--------|------------------|
| 1 | Framework React 18 + Vite + TypeScript + Tailwind + shadcn/ui | ✅ OK | Ninguna |
| 2 | SPA con React Router DOM v6 | ✅ OK | Ninguna |
| 3 | Estado: Context API + localStorage (prefijo wm_) | ✅ OK | Integrado con Supabase para persistencia |
| 4 | Backend: Supabase (BaaS) | ✅ OK | Ninguna |
| 5 | Estructura de carpetas: src/erp/ con screens/components/store/types/utils | ✅ OK | Ninguna |

## ✅ MÓDULOS FUNCIONALES
| # | Módulo | Ruta | Estado |
|---|--------|------|--------|
| 6 | Dashboard (KPIs + Curva S + Alertas Críticas + Módulos) | src/erp/screens/Dashboard.tsx | ✅ Completo |
| 7 | Proyectos (CRUD + mapa calor + avances + vinculación presupuesto) | src/erp/screens/Proyectos.tsx | ✅ Completo |
| 8 | Presupuestos (motor APU 45 renglones, FSR + vinculación proyecto) | src/erp/screens/Presupuestos.tsx | ✅ Completo |
| 9 | Financiero (Cash Flow Real/Proyectado, alertas déficit, centros costo) | src/erp/screens/Financiero.tsx | ✅ Completo |
| 10 | RRHH (empleados, FSR, asignación proyectos) | src/erp/screens/RRHH.tsx | ✅ Completo |
| 11 | Bodega (Pareto 80/20, OC por rol, alertas stock, filtros) | src/erp/screens/Bodega.tsx | ✅ Completo |
| 12 | Seguimiento (EVM + Gantt interactivo + bitácora) | src/erp/screens/Seguimiento.tsx | ✅ Completo |
| 13 | CRM / Pipeline Kanban (5 columnas, KPIs, seed data) | src/erp/screens/CRM.tsx | ✅ Completo |
| 14 | Login/Registro + RBAC | src/erp/screens/Login.tsx | ✅ Completo |
| 15 | Layout (Header + Sidebar responsive con CRM) | src/components/AppLayout.tsx | ✅ Completo |
| 16 | GanttChart (cronograma interactivo semanas/meses) | src/erp/components/GanttChart.tsx | ✅ Completo |
| 17 | CriticalRenglonAlert (alertas top 8 desviaciones) | src/erp/components/CriticalRenglonAlert.tsx | ✅ Completo |
| 18 | PresupuestoCard (tarjeta vinculada en Proyectos) | src/erp/components/PresupuestoCard.tsx | ✅ Completo |
| 19 | LogísticaCompras (Activos + Cuadros + Pagos) | src/erp/screens/LogisticaCompras.tsx | ✅ Completo |
| 20 | RendimientoCampo (Destajos + Capturas + Plantillas + Vales) | src/erp/screens/RendimientoCampo.tsx | ✅ Completo |
| 21 | ComercialFinanzas (Ventas + Anticipos + Cajas Chicas) | src/erp/screens/ComercialFinanzas.tsx | ✅ Completo |
| 22 | Administracion (Centros Costo + Logs + Validación Precios) | src/erp/screens/Administracion.tsx | ✅ Completo |

## ✅ VULNERABILIDADES CRÍTICAS (Seguridad)
| # | Item | Prioridad | Acción | Estado |
|---|------|-----------|--------|--------|
| 15 | API Key Supabase hardcodeada | 🔴 CRÍTICA | Mover a .env exclusivamente | ✅ CORREGIDO |
| 16 | RLS permisivo en database.sql | 🔴 CRÍTICA | Implementar políticas RLS por rol | ✅ CORREGIDO |
| 17 | CORS abierto en crm-dispatcher | 🔴 CRÍTICA | External (DatabasePad) | ⚠️ External |
| 18 | Datos solo en localStorage | 🔴 CRÍTICA | Implementar sincronización Supabase | ✅ Mejorado — mutation queue + hook offline/online + persistencia dual |

## ✅ INCONSISTENCIAS FUNCIONALES
| # | Item | Prioridad | Acción | Estado |
|---|------|-----------|--------|--------|
| 19 | AppContext vacío sidebarOpen | 🟠 Alta | Consolidar estado del sidebar | ✅ CORREGIDO |
| 20 | Sidebar ignora AppContext | 🟠 Alta | Conectar sidebar a contexto | ✅ CORREGIDO |
| 21 | database.sql no alineado | 🟠 Alta | Crear tablas ERP en Supabase | ✅ CORREGIDO |
| 22 | database.sql CRM triggers | 🟠 Alta | Decidir: integrar CRM o eliminar | ✅ ELIMINADO |
| 23 | MovimientoForm tipo casting | 🟠 Alta | Corregir tipado Zod/form | ✅ CORREGIDO |
| 24 | Seed data no sincronizada | 🟠 Media | Definir si seed va a Supabase | ✅ CORREGIDO — migración SQL seed creada (000000000004_seed_data.sql), pendiente ejecutar en Supabase |
| 25 | package.json nombre | 🟠 Media | Renombrar package | ✅ CORREGIDO |

## ✅ FORTALEZAS A MANTENER
| # | Fortaleza | Estado |
|---|-----------|--------|
| 26 | Motor APU completo con 45 renglones y fórmulas FSR | ✅ Mantenido |
| 27 | EVM (Earned Value Management) implementado | ✅ Mantenido |
| 28 | Gráficos SVG propios sin dependencias pesadas | ✅ Mantenido |
| 29 | Seed data realista para construcción guatemalteca | ✅ Mantenido |
| 30 | RBAC con 5 roles definidos | ✅ Mantenido |
| 31 | Responsive design completo | ✅ Mantenido |
| 32 | Exportaciones CSV/PDF en presupuestos | ✅ Mantenido |
| 33 | Geolocalización de proyectos | ✅ Mantenido |
| 34 | Bitácora digital de campo | ✅ Mantenido |

## ✅ NUEVAS FUNCIONALIDADES (Ronda 2)
| # | Item | Prioridad | Estado |
|---|------|-----------|--------|
| 35 | Migración SQL — 9 tablas nuevas (logs, destajos, cajas, activos, cuadros, anticipos, pagos, ventas, centros costo) | 🔴 Alta | ✅ Implementado |
| 36 | Logs auditoría imborrables (tabla + trigger genérico fn_log_audit) | 🟠 Media | ✅ Implementado |
| 37 | Trigger recálculo insumos (fn_recalcular_presupuestos_por_insumo) | 🟠 Media | ✅ Implementado |
| 38 | Módulo Destajos / Rendimiento Real (captura diaria vs APU) | 🟠 Alta | ✅ Implementado |
| 39 | Cuadro Comparativo Proveedores (cotizaciones, adjudicación) | 🟠 Alta | ✅ Implementado |
| 40 | Control Activos/Herramientas (asignación operador/cuadrilla) | 🟠 Media | ✅ Implementado |
| 41 | Ventas/Paquetes (preventa unidades, reservaciones) | 🟠 Media | ✅ Implementado |
| 42 | Anticipos + Amortizaciones (descuento proporcional) | 🟠 Alta | ✅ Implementado |
| 43 | Cajas Chicas de Obra (facturas campo con aprobación) | 🟠 Alta | ✅ Implementado |
| 44 | Pagos Proveedores (programación vencimientos, alertas) | 🟠 Alta | ✅ Implementado |
| 45 | Centros de Costo (estructura por proyecto) | 🟠 Alta | ✅ Implementado |
| 46 | Plantillas sub-renglones (precargar materiales por renglón) | 🟡 Media | ✅ Implementado |
| 47 | Vales Salida por Renglón (insumo imputado a código renglón) | 🟠 Media | ✅ Implementado |
| 48 | Validación precios sub-renglones (negativos, cero, excesivos) | 🟡 Media | ✅ Implementado |

## 📋 PENDIENTES CONOCIDOS
| # | Item | Tipo | Estado |
|---|------|------|--------|
| 1 | Ejecutar migración seed data en Supabase (000000000004_seed_data.sql) | 🔧 Operación | Pendiente — SQL listo |
| 2 | Overlay de planos vs modelo en Visor BIM | 🏗️ Feature | Pendiente — requiere desarrollo |
| 3 | CORS crm-dispatcher (DatabasePad external) | 🔒 External | ⚠️ No controlado por nosotros |
| 4 | Actualizar Site URL en Supabase Dashboard (5173 → 8080) | ⚙️ Config | Pendiente — Google OAuth |
| 5 | Ejecutar migración 000000000006 (tabla erp_vales_salida + constraints) | 🔧 Operación | Pendiente — SQL creado |
| 6 | Tablas en DB sin sync Supabase (erp_seguimiento, erp_renglones, erp_insumos, erp_sub_renglones) | 🏗️ Feature | ⚠️ Gestionadas localmente/JSONB |

---
**Última actualización:** 2026-06-02
**Deploy:** https://erp-construsmart-wm-app-01.vercel.app/