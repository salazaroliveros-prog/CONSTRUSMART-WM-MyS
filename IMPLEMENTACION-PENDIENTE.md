# 📋 Guía de Implementación Pendiente — ERP CONSTRUSMART

> **Fecha:** 8 de junio 2026  
> **Estado:** Store saneado, arranque validado en 8080, notificaciones sincronizadas, realtime corregido.  
> **Objetivo:** Completar al 100% la funcionalidad de la ERP.

---

## ✅ LO QUE YA FUNCIONA (Verificado en el codebase)

| # | Módulo / Corrección | Archivo | Estado |
|---|---|---|:---:|
| 1 | Color primario con conversión hex→HSL funcional | themes.ts | ✅ |
| 2 | Tokens Antd v5 inválidos eliminados | antd-config.tsx | ✅ |
| 3 | CSS duplicado (prefers-reduced-motion + scrollbar) eliminado | responsive.css | ✅ |
| 4 | `--primary-hue` con efecto visual real | themes.css | ✅ |
| 5 | 18 casts `as any` eliminados en Proyectos.tsx | Proyectos.tsx | ✅ |
| 6 | Zod schema alineado con interfaz Submittal | GestionDocumental.tsx | ✅ |
| 7 | 12 animaciones vanguardistas + 10 keyframes | index.css | ✅ |
| 8 | Login: spinner animado + auto-focus + toggle contraseña | Login.tsx | ✅ |
| 9 | Sync message + error toast + cola periódica 30s | store.tsx | ✅ |
| 10 | Persistencia Supabase: Proyectos, Presupuestos, Movimientos, Empleados, Materiales, OC, Proveedores, Eventos, Bitácora | store.tsx | ✅ |
| 11 | Persistencia Supabase: Licitaciones, AvancesObra, ValesSalida, SeguimientoEVM | store.tsx | ✅ |
| 12 | Persistencia Supabase: CuentasCobrar | store.tsx | ✅ |
| 13 | Persistencia Supabase: CuentasPagar | store.tsx | ✅ |
| 14 | Persistencia Supabase: OrdenesCambio | store.tsx | ✅ |
| 15 | Persistencia Supabase: Hitos | store.tsx | ✅ |
| 16 | Persistencia Supabase: Riesgos | store.tsx | ✅ |
| 17 | Carga inicial `fetchInitialData` con mappers + `simpleMap` / `mapFromSnakeCase` | store.tsx | ✅ |
| 18 | Helpers `safeFrom` / `setSnakeCaseStates` para hidratar el store desde Supabase | store.tsx | ✅ |
| 19 | `marcarTodasLeidas` implementada y exportada en store | store.tsx | ✅ |

---

## 🟠 PENDIENTE — Migración SQL + Validación de columnas

### 1. Migración SQL en Supabase

Falta ejecutar el SQL de las tablas nuevas capturado en la sección inferior del documento.

### 2. `fetchInitialData` — Validar columnas reales

Las columnas (`fecha_adquisicion`, `fecha_solicitud`, `fecha_subida`, `fecha_envio`, `fecha_muestra`, `fecha_deteccion`) deben coincidir exactamente con las definidas en Supabase antes de dar por cerrada la carga inicial.

### 3. Limpieza de caché en producción

Al hacer deploy en Vite/Azure, recordar limpiar `.vite` y reinstalar dependencias para evitar el síndrome de `port 8081` y módulos cacheados.

No ejecutes esto todavía. Queda como etapa posterior a la corrección del store y la validación del back:

```sql
-- Logística / Compras
CREATE TABLE IF NOT EXISTS erp_activos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  nombre TEXT NOT NULL,
  codigo_inventario TEXT,
  tipo TEXT,
  marca TEXT,
  modelo TEXT,
  valor_adquisicion NUMERIC DEFAULT 0,
  estado TEXT DEFAULT 'disponible',
  ubicacion TEXT,
  fecha_adquisicion DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_cuadros_comparativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  solicitud TEXT NOT NULL,
  fecha_solicitud DATE NOT NULL,
  estado TEXT DEFAULT 'abierto',
  adjudicado_a TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuadro_id UUID REFERENCES erp_cuadros_comparativos(id),
  proveedor_id UUID,
  proveedor_nombre TEXT,
  monto_total NUMERIC DEFAULT 0,
  plazo_entrega INTEGER,
  condiciones_pago TEXT,
  validez_oferta TEXT,
  seleccionada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_pagos_proveedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  proveedor_id UUID,
  proveedor_nombre TEXT NOT NULL,
  monto NUMERIC DEFAULT 0,
  concepto TEXT NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  estado TEXT DEFAULT 'pendiente',
  factura_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documentos
CREATE TABLE IF NOT EXISTS erp_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  nombre TEXT NOT NULL,
  disciplina TEXT,
  version TEXT,
  fecha_subida DATE NOT NULL,
  descripcion TEXT,
  estado TEXT DEFAULT 'vigente',
  subido_por TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  numero TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  solicitante TEXT,
  destino TEXT,
  estado TEXT DEFAULT 'abierto',
  fecha_solicitud DATE NOT NULL,
  respuesta TEXT,
  fecha_respuesta DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_submittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  proveedor TEXT,
  fecha_envio DATE NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSO / Calidad
CREATE TABLE IF NOT EXISTS erp_inspecciones_sso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  fecha DATE NOT NULL,
  inspector TEXT NOT NULL,
  tipo TEXT,
  hallazgos TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_checklists_calidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  nombre TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  estado TEXT DEFAULT 'pendiente',
  revisado_por TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_incidentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  tipo TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora TEXT,
  descripcion TEXT NOT NULL,
  afectados TEXT NOT NULL,
  testigos TEXT,
  acciones_inmediatas TEXT,
  reportado_por TEXT NOT NULL,
  latitud NUMERIC,
  longitud NUMERIC,
  fotos TEXT[] DEFAULT '{}',
  estado TEXT DEFAULT 'abierto',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_pruebas_laboratorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_muestra DATE NOT NULL,
  fecha_resultado DATE,
  resultado TEXT DEFAULT 'pendiente',
  responsable TEXT NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_no_conformidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  codigo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  categoria TEXT,
  fecha_deteccion DATE NOT NULL,
  detectado_por TEXT NOT NULL,
  plan_accion TEXT,
  responsable_cierre TEXT,
  fecha_cierre DATE,
  estado TEXT DEFAULT 'detectado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_liberaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  renglon_id UUID,
  renglon_nombre TEXT NOT NULL,
  fecha_solicitud DATE NOT NULL,
  fecha_liberacion DATE,
  solicitante TEXT NOT NULL,
  supervisor TEXT NOT NULL,
  checklist_aprobado BOOLEAN DEFAULT false,
  observaciones TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MuroObra
CREATE TABLE IF NOT EXISTS erp_muro_publicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id),
  autor TEXT NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT DEFAULT 'general',
  fotos TEXT[] DEFAULT '{}',
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_muro_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID REFERENCES erp_muro_publicaciones(id),
  autor TEXT NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificaciones multi-device
CREATE TABLE IF NOT EXISTS erp_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT,
  proyecto_id UUID,
  referencia_id UUID,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cotizaciones
CREATE TABLE IF NOT EXISTS erp_cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuadro_id UUID REFERENCES erp_cuadros_comparativos(id),
  proveedor_id UUID,
  proveedor_nombre TEXT,
  monto_total NUMERIC DEFAULT 0,
  plazo_entrega INTEGER,
  condiciones_pago TEXT,
  validez_oferta TEXT,
  seleccionada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 RESUMEN DE PROGRESO

| Categoría | Estado |
|---|---|
| Auditoría de código fuente | ✅ Completada |
| Correcciones de inconsistencias visuales | ✅ 9/9 aplicadas |
| Sistema de diseño (animaciones + tokens) | ✅ Implementado |
| Login UX mejorada | ✅ Implementado |
| Offline + Realtime mejorado | ✅ Implementado |
| Tipos, esquemas Zod, helpers de store | ✅ Avanzados |
| Persistencia Supabase (Fase 1 completa) | ✅ Completada |
| Carga inicial + mapeos snake_case | ✅ Avanzada |
| Helpers de sincronización (`safeFrom`, `setSnakeCaseStates`) | ✅ Avanzada |
| **Bug `handlePresupuestos` - mapper redundante** | ✅ Corregido |
| **Realtime: conversión snake_case→camelCase en renglones/insumos/subrenglones** | ✅ Corregido |
| **Consolidación `processQueue` para tablas nuevas** | 🟠 Pendiente |
| **Verificación columnas `fetchInitialData` contra Supabase** | 🟠 Pendiente |
| **Migración SQL a Supabase** | 🟡 Difiere del equipo (ejecutar en Supabase) |
