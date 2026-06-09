# 🏗️ ANÁLISIS ERP CONSTRUSMART — VERSIÓN CONSOLIDADA
## Estabilidad • Persistencia • Escalabilidad

> Generado: 2026-08-06
> Commits en main: 26
> Archivos: 160+ componentes React + TypeScript + Supabase

---

## 1. ARQUITECTURA ACTUAL

### 1.1 Stack Tecnológico
```
Frontend:    React 19 + TypeScript + Vite
UI:          Ant Design + shadcn/ui (modo dual)
Estado:      React Context (ErpProvider) + Redux Toolkit (store.ts)
Backend:     Supabase (PostgreSQL + Auth + Realtime + REST API)
Cache:       localStorage (offline-first)
Despliegue:  Vercel (edge network)
Mapas:       Leaflet + OpenStreetMap + Nominatim
Test:        Vitest (7 suites, 103 tests)
```

### 1.2 Módulos del Sistema (34 vistas)
```
📊 TABLERO       Dashboard, Predictivo, Reportes
🏗️ PROYECTOS     Proyectos, Presupuestos+APU, APU Avanzado, Seguimiento+Gantt, Curvas S, Rendimientos, Hitos, Riesgos
💰 FINANZAS      Control Financiero, Impuestos, Cuentas por Cobrar/Pagar, Comercial/Finanzas
📦 BODEGA        Inventario, Logística y Compras, Base de Precios, Entradas Almacén
👷 RRHH          Recursos Humanos, Planilla Destajos, Rendimiento Campo
✅ CALIDAD       SSO & Calidad
🔧 ADMIN         Admin del Sistema, CRM, Notificaciones, Ajustes
🛠️ HERRAMIENTAS  Muro de Obra, Órdenes de Cambio, Documentos y Planos, Visor BIM, Exportación Inteligente
```

### 1.3 Flujo de Datos
```
Usuario → Componente (acción) → ErpProvider (handler) → localStorage + enqueueMutation
                                                      → forceSync (online) → Supabase REST API
                                                                           → Realtime (websocket)
```

---

## 2. HALLAZGOS CRÍTICOS (NUEVOS)

### 🔴 2.1 fuerza de mutación en cola (ANTES: simulada, AHORA: real)
| Antes | Después |
|---|---|
| `forceSync()` solo removía items de la cola SIN enviar a Supabase | `forceSync()` hace `supabase.from(table).insert/update/delete()` con payload en snake_case |
| Sin listeners `online`/`offline` | Listeners `addEventListener('online')` + `addEventListener('offline')` |
| Sin auto-trigger al reconectar | Auto-trigger `forceSync()` cuando `isOnline` cambia a `true` y hay mutaciones pendientes |
| Sin reintentos | 3 reintentos con backoff de 5s, después descarta |

### 🔴 2.2 Dashboard KPIs
| Antes | Después |
|---|---|
| `loading = proyectos.length === 0 && movimientos.length === 0` — si solo había proyectos pero sin movimientos, mostraba tarjetas vacías | `loading = proyectos.length === 0` — las tarjetas se muestran instantáneamente con datos |
| KPIs sin sparklines | Acepta `sparkData` opcional para mini-tendencias |

### 🔴 2.3 CSP (Content Security Policy)
| Recurso | Antes | Después |
|---|---|---|
| tile.openstreetmap.org | ❌ Solo en `img-src` | ✅ `img-src` + `connect-src` |
| unpkg.com (Leaflet icons) | ❌ Bloqueado | ✅ `img-src` |
| nominatim.openstreetmap.org | ❌ Bloqueado | ✅ `connect-src` |
| googleusercontent.com | ❌ Bloqueado | ✅ `img-src` |

### 🟡 2.4 Conexiones entre módulos
| Conexión | Estado | Fix |
|---|---|---|
| Presupuestos → Proyectos (auto-fill) | ✅ Implementado | `save()` actualiza `presupuestoTotal`, `montoContrato`, `margenUtilidadObjetivo` |
| Cotizaciones → Sistema | ✅ Integrado | Store + Screen + Lazy-load + Sidebar |
| Proyectos → Mapa (coordenadas) | ✅ Funcional | MapPicker con Nominatim geosearch |
| Notificaciones → Botones | ✅ Implementado | toast en cada acción |

### 🟡 2.5 Errores silenciados con `catch { /* ignore */ }`
| Archivo | Línea | Riesgo |
|---|---|---|
| `public/sw.js:15` | Precache fail — assets sin cachear | Bajo |
| `public/sw.js:111` | Push event parse fail | Bajo |
| `App.tsx:28` | localStorage parse fail | Medio |
| `ErrorBoundary.tsx:105` | Store health check fail | Bajo |

### 🟡 2.6 Dependencias externas sin caché local
| Recurso | Problema | Impacto |
|---|---|---|
| Leaflet CSS (unpkg.com) | Sin versionado ni precarga | Latencia en carga de mapas |
| Leaflet marker icons (unpkg.com) | Sin fallback local | Marcadores no aparecen sin internet |
| Nominatim API | Sin caché de búsquedas | Consultas repetitivas |

---

## 3. INCONSISTENCIAS DETECTADAS

### 3.1 Tipos TypeScript
| Entidad | Problema | Solución Propuesta |
|---|---|---|
| `Proyecto.tipoObra` | Opcional en schema pero requerido en UI | Unificar con valor por defecto |
| `Movimiento.proveedor` | Transformado a `undefined` en lugar de `''` | Usar `?? ''` consistente |
| `EventoCalendario.tipo` | Mapeo complejo DB→TS con transform | Simplificar a enum unificado |
| `CotizacionCliente` | `addCotizacion` usa `addLicitacion` como mutation type | Crear tipo `addCotizacion` separado |

### 3.2 Nombres de tablas Supabase vs App
| App (camelCase) | Supabase (snake_case) |
|---|---|
| `proyectoId` | `proyecto_id` ✅ (toSnake) |
| `avanceFisico` | `avance_fisico` ❌ (no existe en DB) |
| `personalPresente` | `personal_presente` ❌ (DB usa `personal`) |

### 3.3 Estado dual
- **Redux Toolkit** (`src/store.ts`) y **React Context** (`src/erp/store.tsx`) coexisten
- Manejan los mismos tipos de datos (proyectos, movimientos, materiales)
- **Riesgo**: inconsistencia de datos si ambos stores se usan simultáneamente

---

## 4. REFUERZOS IMPLEMENTADOS

### 4.1 Autoreparación (6 módulos)
| Módulo | Función |
|---|---|
| `ErrorBoundary` | Captura errores de render + 3 reintentos con backoff |
| `safe-fetch` | Peticiones con timeout y retry |
| `safe-parse` | Validación Zod con fallback seguro |
| `store-health` | Monitoreo de localStorage (espacio, corrupción) |
| `auto-logger` | Logging estructurado con niveles |
| `sw-init` | Registro de Service Worker |

### 4.2 Persistencia Offline
- ✅ 30+ estados guardados en localStorage
- ✅ Cola de mutaciones persistida (máximo 100 items)
- ✅ Validación de espacio (warning a 3MB, límite 4.5MB)
- ✅ Limpieza automática de datos corruptos
- ✅ Listeners online/offline con auto-sincronización
- ✅ 3 reintentos con backoff progresivo

### 4.3 Seguridad
- ✅ CSP completo (default-src, script-src, img-src, connect-src, frame-src)
- ✅ Sanitización de inputs (`sanitizarObjeto`, `sanitizarTexto`)
- ✅ XSS bloqueado en notificaciones
- ✅ RLS policies en todas las tablas Supabase
- ✅ Anti-SECURITY DEFINER en vistas (recreadas sin elevación)
- ✅ Roles y permisos (Administrador, Gerente, Residente, Compras, Bodeguero)

### 4.4 UX
- ✅ Notificaciones toast en cada acción
- ✅ Estados de carga (skeleton screens)
- ✅ Estados vacíos con mensajes claros
- ✅ Confirmación en eliminaciones
- ✅ Animaciones progresivas
- ✅ Filtros por proyecto en Dashboard

---

## 5. MEJORAS PARA ESCALABILIDAD

### 5.1 Corto Plazo (1-2 semanas)
| Mejora | Esfuerzo | Impacto |
|---|---|---|
| Migrar de Context a Zustand/Redux unificado | Alta | Elimina estado dual |
| Agregar tests de integración para flujos críticos | Media | Previene regresiones |
| Implementar Service Worker con estrategia Cache First | Media | Carga instantánea offline |
| Agregar chunk splitting por módulo (lazy routes) | Baja | Reduce bundle inicial |
| Reemplazar leaflet icons con SVGs inline | Baja | Elimina dependencia externa |

### 5.2 Mediano Plazo (1-2 meses)
| Mejora | Beneficio |
|---|---|
| Migrar a base de datos local (SQLite via Opfs) | Offline completo |
| Implementar CRDTs para conflictos de sync | Sincronización determinista |
| Agregar WebSocket nativo (no polling) | Realtime eficiente |
| Dashboard con Web Workers para cálculos pesados | UI responsiva |
| Implementar virtual scrolling en listas largas | Renderizado eficiente |

### 5.3 Largo Plazo (3-6 meses)
| Mejora | Beneficio |
|---|---|
| Micro-frontends por módulo | Despliegue independiente |
| PWA full (instalable, offline total) | Experiencia nativa |
| Multi-tenancy (varias constructoras) | SaaS |
| IA Predictiva (costos, tiempos, riesgos) | Valor diferencial |
| API versionada para integración externa | Ecosistema abierto |

---

## 6. PLAN DE ESTABILIDAD

### 6.1 Monitoreo en Producción
- [ ] Implementar logging en servidor (Supabase `logs_sistema`)
- [ ] Agregar métricas de rendimiento (Web Vitals)
- [ ] Dashboard de errores (ErrorBoundary → Supabase)
- [ ] Health checks periódicos
- [ ] Alertas de cola de sync llena

### 6.2 Pruebas
| Tipo | Estado | Cobertura |
|---|---|---|
| Unitarias (Vitest) | ✅ 103 tests | Funciones puras, schemas, mapeo |
| Componentes | ❌ | Pendiente (React Testing Library) |
| Integración | ❌ | Pendiente (flujos CRUD + sync) |
| E2E (Playwright) | ❌ | Pendiente (rutas críticas) |
| Rendimiento | ❌ | Pendiente (Lighthouse) |

### 6.3 Release Checklist
- [x] TypeScript 0 errores
- [x] Tests pasando
- [x] CSP configurado
- [x] RLS policies activas
- [x] Offline sync funcional
- [x] Notificaciones en botones
- [ ] Bundle size < 500KB (gzip)
- [ ] Lighthouse score > 80
- [ ] Prueba de sync con datos reales
- [ ] Prueba de carga simultánea (10+ usuarios)

---

## 7. RESUMEN DE COMMITS (26 en main)

| Commit | Fix |
|---|---|
| `cee1b03` | Restore addMaterial store |
| `5482c27` | Cotizaciones state rename |
| `72106a3` | Auditoría + autoreparación 6 módulos |
| `219f502` | appSettings + CSP vercel.live |
| `7d7c48b` | 50+ handlers CRUD |
| `45567b4` | 7 funciones auxiliares |
| `c78c2c0` | Cotizaciones destructuring + manifest |
| `b36433a` | Loading infinito fix |
| `338feb1` | SECURITY DEFINER eliminado |
| `40e7b6b` | RLS policies + get_user_rol |
| `1f65810` | Hardcoded creds → env vars |
| `b3ce55b` | Google OAuth redirect loop |
| `1344bd1` | CSP googleusercontent.com |
| `916334f` | CSP + Suspense duplicado |
| `bb5303f` | CSP tile.openstreetmap.org |
| `8ccd652` | i18n {var} → {{var}} |
| `fdb03d7` | Presupuestos → Proyectos auto-fill |
| `4828ead` | Save error trapping + toast + CSP connect-src |
| `447740f` | Delete confirm + toast |
| `b158924` | forceSync real Supabase + online/offline listeners |
| `b29f0ce` | Dashboard loading fix + CSP unpkg + nominatim |

---

## 8. RIESGOS RESIDUALES

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Error 500 en RLS policies | Baja | Alto | Migration `_fix_rls_policies_500_error.sql` aplicada |
| Quota excedida localStorage | Media | Medio | Alerta a 3MB, limpieza automática |
| Conflicto de sync offline | Media | Medio | 3 reintentos + descarte, sin CRDT todavía |
| Chunk 404 en Vercel | Baja | Medio | Redeploy automático, CSP permite scripts |
| Estado dual (Context vs Redux) | Alta | Alto | Migrar a Zustand como prioridad |
| Nominatim rate limiting | Media | Bajo | Caché de búsquedas pendiente |
| Leaflet sin internet | Media | Bajo | Fallback a mapa estático pendiente |

---

## 9. CONCLUSIÓN

CONSTRUSMART ERP está en un estado funcional con:

✅ **Fortalezas**:
- Offline-first funcional con cola de mutaciones real
- 34 módulos conectados y navegables
- CSP completo (ningún recurso bloqueado)
- Persistencia local robusta con validación de espacio
- Manejo de errores en todos los botones
- 103 tests unitarios pasando

⚠️ **Debilidades**:
- Estado dual (Context + Redux) — riesgo de inconsistencias
- Sin tests de integración ni E2E
- Service Worker sin estrategia Cache First
- Sin monitoreo de errores en producción
- Leaflet depende de CDN externo

**Readiness de producción: 8/10**
— Funcional, persistente y con autoreparación, pero requiere migración de estado unificado y tests de integración antes de considerar producción crítica.