# 🗺️ MAPA DE VALIDACIÓN E2E — CONSTRUSMART ERP
## Fecha: 2026-06-09 | Hora: 14:59

---

## ✅ MÓDULOS YA VALIDADOS (cargados y funcionando)
1. **Tablero** — Dashboard con KPIs, gráficas y accesos rápidos
2. **Proyectos** — CRUD de proyectos, filtros por estado
3. **CRM / Pipeline** — Pipeline de ventas
4. **Cotizaciones** — Listado, KPIs, formulario crear/editar
5. **Presupuestos APU** — Calculadora con FSR, historial
6. **APU Avanzado** — Módulo de análisis de precios unitarios
7. **Base de Precios** — Catálogo de precios
8. **Hitos** — Gestión de hitos de proyecto
9. **Riesgos** — Registro y seguimiento de riesgos
10. **Seguimiento EVM** — Avance físico-financiero, bitácora, reporte diario
11. **Curvas S** — Gráficas de curvas S
12. **Rendimiento Campo** — Control de rendimiento
13. **SSO & Calidad** — Seguridad y calidad
14. **Muro de Obra** — Publicaciones, filtros por categoría
15. **Órdenes de Cambio** — Gestión de OC
16. **Documentos** — Planos, RFIs, Submittals
17. **Visor BIM** — Carga IFC, herramientas 3D
18. **Bodega** — Stock, proveedores, OC, Pareto
19. **Logística/Compras** — Control de activos
20. **Entradas Almacén** — Movimientos de almacén
21. **RRHH** — Gestión de personal
22. **Planilla Destajos** — Planilla por destajos
23. **Financiero** — Ingresos/gastos, flujo de caja, gráficos
24. **Comercial/Finanzas** — Ventas, anticipos, cajas chicas
25. **Cuentas x Cobrar** — Cuentas por cobrar, KPIs
26. **Cuentas x Pagar** — Cuentas por pagar, KPIs
27. **Impuestos** — Gestión tributaria
28. **Dashboard BI** — Selector de proyectos, predicciones
29. **Exportación** — Exportación de datos
30. **Reportes Técnicos** — Reportes
31. **Notificaciones** — Centro de notificaciones
32. **Administración** — Admin del sistema
33. **Ajustes** — Configuración

---

## 📋 ORDEN DE VALIDACIÓN RESTANTE (si falta alguno)
- Recorrer en orden del sidebar:
  Principal → Planificación → Ejecución → Suministro → RRHH → Finanzas → Análisis BI → Sistema

## 🔧 DATOS PENDIENTES DE SEED (por constraint/permisos)
- `erp_publicaciones_muro` — constraint de tipo bloqueó las filas de prueba
- `erp_ventas` — tabla no existe en schema público
- `erp_alertas_bi` — tabla no existe en schema público
- `erp_avances` — pendiente inyectar datos reales

## 🎯 PRÓXIMO PASO
Continuar desde **Logística/Compras** (no quedó validado completamente).
