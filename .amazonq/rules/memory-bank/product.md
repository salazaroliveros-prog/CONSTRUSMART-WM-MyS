# CONSTRUSMART ERP — Product Overview

## Purpose & Value Proposition

CONSTRUSMART is a comprehensive web-based ERP (Enterprise Resource Planning) system designed specifically for the construction industry. It centralizes project management, cost estimation, financial control, HR, warehouse/inventory, field tracking, CRM, and supply chain into a single platform. It supports both online (Supabase-backed) and offline-first operation via IndexedDB.

**Live deployment:** https://construsmart-wm2026.vercel.app/

---

## Key Features & Capabilities

### Project & Budget Management
- Full CRUD for construction projects with status tracking (activo, pausado, finalizado, etc.)
- APU (Análisis de Precios Unitarios) budget engine with 45+ line items (renglones)
- Sub-renglones for material breakdown per budget line
- Budget versioning and comparison between versions
- 1:N relationship: one project → many budgets; one active budget per project
- Automatic volume calculation (cubicación) for concrete, steel, masonry, formwork, excavation

### Financial Control
- Real vs projected cash flow (12 months)
- Deficit alerts and predictive cost projection
- Petty cash (cajas chicas) with invoice upload and approval
- Advance payment management and amortization
- Sales pipeline (available/reserved/sold/delivered)
- ISR (25%) and IVA (12%) automation

### Field & Operations
- Digital field log (bitácora): weather, personnel, machinery, tasks, photos, e-signature, geolocation
- Physical progress tracking per budget line with financial auto-update
- Quality checklists, lab tests (concrete, soil, steel), non-conformities lifecycle
- Safety (SSO): daily checklist, incident reporting, days-without-accident counter, emergency geolocation button
- Piece-rate payroll (destajos), weekly volume-based payment

### Warehouse & Supply Chain
- Material stock management with Pareto 80/20 analysis
- Purchase Orders (OC) with role-based approval workflow
- OC → Stock automatic cascade on "received" status
- Exit vouchers (vales de salida) with blocking stock validation
- Supplier comparison table (cuadro comparativo) with multiple quotes
- Asset and tool tracking per operator/crew

### HR & RRHH
- Employee CRUD with project assignment
- Social welfare factor (FSR) calculation
- Role-based access control (5 roles)

### Monitoring & Analytics
- EVM (Earned Value Management): CV, SV, CPI, SPI
- S-Curve: programmed vs actual (sigmoid function)
- Dashboard with KPIs, critical alerts, and predictive BI
- Gantt chart (interactive) and PERT chart
- Change order management with cost/schedule impact tracking

### CRM & Commercial
- Kanban pipeline with 5 columns and KPI tracking
- Lead and opportunity management

### BIM & Documentation
- IFC viewer (Three.js + web-ifc): orbit, zoom, section clipping, auto-rotate
- Link BIM elements to budget line items
- Document management: plans by discipline/version, RFI, Submittals

### Collaboration
- "Muro de obra" (project wall): feed with text, photos, documents, comments, @mentions
- Real-time notifications (in-app + Web Notification API)
- Badge system and notification panel in header

### Offline & PWA
- Service worker (sw.js) for offline support
- IndexedDB for local data persistence
- Mutation queue with automatic sync on reconnect

---

## Target Users & Roles

| Role | Access Scope |
|---|---|
| Administrador | Full system access + audit logs |
| Gerente | Dashboard, projects, finances, reports |
| Residente | Field, bitácora, progress, quality |
| Compras | Warehouse, purchase orders, suppliers |
| Bodeguero | Inventory, exit vouchers, receptions |

---

## Business Domain

Construction project management in Latin America (Guatemala context: GTQ currency, ISR/IVA Guatemalan rates). Supports multi-project companies managing budgets, field teams, suppliers, and clients.
