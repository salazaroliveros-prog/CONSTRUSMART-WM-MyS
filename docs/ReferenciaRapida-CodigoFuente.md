# 🗂️ REFERENCIA RÁPIDA — CONSTRUSMART ERP
## Última actualización: 2026-06-09 | Hora: 17:15

---

## 1. Módulos y rutas de navegación (Sidebar)
- `dashboard` → Tablero
- `proyectos` → Proyectos
- `crm` → CRM / Pipeline
- `cotizaciones` → Cotizaciones
- `presupuestos` → Presupuestos APU
- `apu` → APU Avanzado
- `baseprecios` → Base de Precios
- `hitos` → Hitos
- `riesgos` → Riesgos
- `seguimiento` → Seguimiento EVM
- `curvas` → Curvas S
- `rendimiento-campo` → Rendimiento Campo
- `sso-calidad` → SSO & Calidad
- `muro` → Muro de Obra
- `ordenes-cambio` → Órdenes de Cambio
- `documentos` → Documentos
- `visor-bim` → Visor BIM
- `bodega` → Bodega
- `logistica` → Logística/Compras
- `entradas-almacen` → Entradas Almacén
- `rrhh` → RRHH
- `planilla-destajos` → Planilla Destajos
- `financiero` → Financiero
- `comercial-fin` → Comercial/Finanzas
- `cuentas-cobrar` → Cuentas x Cobrar
- `cuentas-pagar` → Cuentas x Pagar
- `impuestos` → Impuestos
- `predictivo` → Dashboard BI
- `exportacion` → Exportación
- `reportes` → Reportes Técnicos
- `notificaciones` → Notificaciones
- `admin-sistema` → Administración
- `ajustes` → Ajustes

---

## 2. Acciones del Store (erpState) — punto de inserción/modificación

| Módulo | Estado | Acción (store) | Target/side effect |
| --- | --- | --- | --- |
| Bodega | `ordenes` | `updateOrden(id, estado)` | Cambia estado de OC (`aprobado`/`rechazado`). No hay `addOrden` expuesto en contexto por handler ausente. |
| Bodega | `proveedores` | `addProveedor` | Alta de proveedor |
| Bodega | `proveedores` | `updateProveedor` | Edición de proveedor |
| Bodega | `proveedores` | `deleteProveedor` | Baja de proveedor |
| Bodega | `materiales` | `updateMaterial` | Edita campos como `stock` (no hay `addMaterial` expuesto) |
| Muro de Obra | `publicacionesMuro` | `addPublicacionMuro` | Crea publicación |
| Muro de Obra | `publicacionesMuro` | `addComentarioMuro` | Crea comentario |
| Muro de Obra | `publicacionesMuro` | `likePublicacionMuro` | Like |
| Documentos | `planos` | `addPlano` | Crea plano |
| Documentos | `planos` | `updatePlano` | Edita plano |
| Documentos | `planos` | `deletePlano` | Elimina plano |
| Documentos | `rfis` | `addRfi` | Crea RFI |
| Documentos | `rfis` | `updateRfi` | Edita RFI |
| Documentos | `rfis` | `deleteRfi` | Elimina RFI |
| Documentos | `submittals` | `addSubmittal` | Crea submittal |
| Documentos | `submittals` | `updateSubmittal` | Edita submittal |
| Documentos | `submittals` | `deleteSubmittal` | Elimina submittal |
| Comercial/Finanzas | `ventasPaquetes` | No expuesto `addVentaPaquete` en contexto (declarado en interface pero no asignado en value). |
| Finanzas | `cuentasCobrar` | `addCuentaCobrar` | Crea cuenta por cobrar |
| Finanzas | `cuentasCobrar` | `updateCuentaCobrar` | Edita |
| Finanzas | `cuentasCobrar` | `deleteCuentaCobrar` | Elimina |
| Finanzas | `cuentasPagar` | `addCuentaPagar` | Crea cuenta por pagar |
| Finanzas | `cuentasPagar` | `updateCuentaPagar` | Edita |
| Finanzas | `cuentasPagar` | `deleteCuentaPagar` | Elimina |
| Finanzas | `movimientos` | `addMovimiento` | Crea movimiento (ingreso/gasto) |
| Finanzas | `movimientos` | `updateMovimiento` | Edita movimiento |
| Finanzas | `movimientos` | `deleteMovimiento` | Elimina movimiento |
| Seguimiento | `seguimientoEVM` | `addSeguimiento` | Crea seguimiento EVM |
| Seguimiento | `seguimientoEVM` | `updateSeguimiento` | Edita |
| Seguimiento | `seguimientoEVM` | `deleteSeguimiento` | Elimina |
| Hitos | `hitos` | `addHito` | Crea hito |
| Hitos | `hitos` | `updateHito` | Edita hito |
| Hitos | `hitos` | `deleteHito` | Elimina hito |
| Riesgos | `riesgos` | `addRiesgo` | Crea riesgo |
| Riesgos | `riesgos` | `updateRiesgo` | Edita riesgo |
| Riesgos | `riesgos` | `deleteRiesgo` | Elimina riesgo |
| Proyectos | `proyectos` | `addProyecto` | Crea proyecto |
| Proyectos | `proyectos` | `updateProyecto` | Edita proyecto |
| Proyectos | `proyectos` | `deleteProyecto` | Elimina |
| Presupuestos | `presupuestos` | `addPresupuesto` | Crea presupuesto |
| Presupuestos | `presupuestos` | `updatePresupuesto` | Edita |
| Presupuestos | `presupuestos` | `deletePresupuesto` | Elimina |
| Empleados | `empleados` | `addEmpleado` | Crea empleado |
| Empleados | `empleados` | `updateEmpleado` | Edita |
| Empleados | `empleados` | `deleteEmpleado` | Elimina |
| Bitácora | `bitacora` | `addBitacora` | Crea entrada |
| Bitácora | `bitacora` | `updateBitacora` | Edita |
| Bitácora | `bitacora` | `deleteBitacora` | Elimina |
| Licitaciones | `licitaciones` | `addLicitacion` | Crea licitación |
| Licitaciones | `licitaciones` | `updateLicitacion` | Edita |
| Licitaciones | `licitaciones` | `deleteLicitacion` | Elimina |
| Cotizaciones | `cotizacionesNegocio` | `addCotizacion` | Crea cotización |
| Cotizaciones | `cotizacionesNegocio` | `updateCotizacion` | Edita |
| Cotizaciones | `cotizacionesNegocio` | `deleteCotizacion` | Elimina |
| Rendimiento | `avances` | `addAvance` | Crea avance |
| Rendimiento | `avances` | `deleteAvance` | Elimina avance |
| Órdenes de Cambio | `ordenesCambio` | `addOrdenCambio` | Crea OC |
| Órdenes de Cambio | `ordenesCambio` | `updateOrdenCambio` | Edita |
| Órdenes de Cambio | `ordenesCambio` | `deleteOrdenCambio` | Elimina |
| Calidad | `liberaciones` | `addLiberacion` | Crea liberación |
| Calidad | `liberaciones` | `updateLiberacion` | Edita |
| Calidad | `liberaciones` | `deleteLiberacion` | Elimina |
| Calidad | `pruebas` | `addPrueba` | Crea prueba |
| Calidad | `pruebas` | `updatePrueba` | Edita |
| Calidad | `ncs` | `addNC` | Crea no conformidad |
| Calidad | `ncs` | `updateNC` | Edita NC |
| Calidad | `ncs` | `deleteNC` | Elimina NC |
| SSO/Calidad | `incidentes` | `addIncidente` | Crea incidente |
| SSO/Calidad | `incidentes` | `updateIncidente` | Edita incidente |
| Activos | `activos` | `addActivo` | Crea activo/herramienta |
| Activos | `activos` | `updateActivo` | Edita |
| Activos | `activos` | `deleteActivo` | Elimina |
| Cuadros | `cuadros` | `addCuadro` | Crea cuadro comparativo |
| Cuadros | `cuadros` | `updateCuadro` | Edita |
| Pagos | `pagosProveedor` | `addPagoProveedor` | Crea pago a proveedor |
| Pagos | `pagosProveedor` | `updatePagoProveedor` | Edita |
| Notificaciones | `notificaciones` | `addNotificacion` | Crea notificación |
| Notificaciones | `notificaciones` | `markNotificacionLeida` | Marca leída |
| Notificaciones | `notificaciones` | `marcarTodasLeidas` | Marca todas leídas |
| Configuración | `appSettings` | `updateAppSettings` | Persiste ajustes globales del store |
| Valés | `valessalida` | `addValeSalida` | Crea vale de salida |
| Valés | `valessalida` | `deleteValeSalida` | Elimina vale de salida |

---

## 3. Rutas de seed válidas en Supabase
- `erp_publicaciones_muro` -> tipos válidos: `avance`, `calidad`, `seguridad`, `general`
- `erp_planos` -> columnas: `proyecto_id`, `nombre`, `tipo`, `archivo_url`, `version`, `estado`, `disciplina`, `observaciones`
- `erp_rfis` -> columnas: `proyecto_id`, `numero`, `titulo`, `descripcion`, `remitente`, `destinatario`, `estado`, `prioridad`
- `erp_submittals` -> columnas: `proyecto_id`, `numero`, `titulo`, `descripcion`, `estado`
- `ventas_paquetes` -> columnas: `proyecto_id`, `tipo`, `identificador`, `precio_venta`, `precio_contrato`, `estado`, `cliente`
- `erp_muro` -> constraint tipo: `avance`, `calidad`, `seguridad`, `general` (minúsculas)
- `erp_proyectos` -> UUIDs conocidos: `ca3e2de7...`, `0a293315...`, `5ae0710e...`, `a1b2c3d4...`, `97744a14...`, `6e25587b...`, `d3966f9b...`

---

## 4. Handlers expuestos en el contexto (store)
- `addProyecto`, `updateProyecto`, `deleteProyecto`
- `addMovimiento`, `updateMovimiento`, `deleteMovimiento`
- `addEmpleado`, `updateEmpleado`, `deleteEmpleado`
- `updateMaterial`
- `updateOrden`, `addOrden`
- `addProveedor`, `updateProveedor`, `deleteProveedor`
- `addEvento`, `updateEvento`, `deleteEvento`
- `addBitacora`, `updateBitacora`, `deleteBitacora`
- `addPresupuesto`, `updatePresupuesto`, `deletePresupuesto`
- `addLicitacion`, `updateLicitacion`, `deleteLicitacion`
- `addCotizacion`, `updateCotizacion`, `deleteCotizacion`
- `ventasPaquetes`
- `addAvance`, `deleteAvance`
- `addSeguimiento`, `updateSeguimiento`, `deleteSeguimiento`
- `addValeSalida`, `deleteValeSalida`
- `addCuentaCobrar`, `updateCuentaCobrar`, `deleteCuentaCobrar`
- `addCuentaPagar`, `updateCuentaPagar`, `deleteCuentaPagar`
- `addOrdenCambio`, `updateOrdenCambio`, `deleteOrdenCambio`
- `addHito`, `updateHito`, `deleteHito`
- `addRiesgo`, `updateRiesgo`, `deleteRiesgo`
- `addPlano`, `updatePlano`, `deletePlano`
- `addRfi`, `updateRfi`, `deleteRfi`
- `addSubmittal`, `updateSubmittal`, `deleteSubmittal`
- `addPublicacionMuro`, `addComentarioMuro`, `likePublicacionMuro`
- `addNotificacion`, `markNotificacionLeida`, `marcarTodasLeidas`
- `forceSync`, `enqueueMutation`

---

## 5. Acciones NO expuestas en el contexto (declaradas en interface pero sin handler)
- `addVentaPaquete` — declarada en `ErpState`, no mapeada en `value`
- `addMaterial` — no hay `addMaterial` en contexto, solo `updateMaterial`
- `addOrden` — sí existe handler `addOrden` en store pero se usa directamente en `Bodega.tsx` mediante `ctx.addOrden`

---

## 6. Flujo offline/online (store)
- Persistencia local por entidad en `localStorage` con claves versionadas
- Cola de mutaciones con retry 3 intentos + backoff
- Reconexión: `window.addEventListener('online', ...)` dispara `forceSync`
- `fetchInitialData` sincroniza tablas base desde Supabase al primer login

---

## 7. Tests
- 427/427 tests pasan
- Suite: Vitest
- Módulos: src/__tests__ + src/erp/__tests__ + src/lib/__tests__

---

## 8. Build
- Build de producción: `npm run build`
- Último build exitoso: 17-18s
- Chunk más grande: `web-ifc` (~3.6MB)

---

## 9. Notas técnicas
- React 18.3 + TypeScript 5.5 + Vite 5.4
- Ant Design 5.29.3, React Query, Three.js/web-ifc
- Supabase backend + offline-first mutation queue
- Zod schemas canónicos en `src/erp/store/schemas/`
- Context store (ErpProvider) con persistencia localStorage + forceSync
- Sin comentarios en código (convención del proyecto)
- Roles: Administrador, Gerente, Residente, Compras, Bodeguero

---

## 10. Estado actual de validación E2E (2026-06-09 17:15)

### ✅ Módulos validados (con datos o funcionales)
- **Tablero** - Dashboard con KPIs
- **Proyectos** - Portafolio cargado
- **Bodega** - Stock, proveedores, OC
- **Muro de Obra** - 4 publicaciones sembradas
- **Documentos** - 3 planos, RFIs, Submittals
- **Comercial/Finanzas** - 4 paquetes VR-2026-01/02/03/04
- **RRHH** - 6 empleados, planilla FSR
- **Planilla Destajos** - Vista vacía (correcto, datos se crean en Rendimiento)
- **Financiero** - Ingresos/gastos/flujo de caja
- **Cuentas x Cobrar** - Q75M pendientes, 3 registros
- **Cuentas x Pagar** - Q36M pendientes, 3 registros
- **Impuestos** - ISR/IVA visibles
- **Exportación** - Excel/JSON/CSV/PDF
- **Reportes Técnicos** - Cubicación/Rendimientos/Ejecutivo

### ⏳ Módulos pendientes de validar
- **Dashboard BI** - Navegó pero sin datos (esperado, requiere proyecto seleccionado)
- **Notificaciones** - Sin alertas (esperado, se generan por eventos del sistema)
- **Administración** - Visto pero no validado en esta sesión
- **Ajustes** - Visto pero no validado en esta sesión

### 🔧 Fixes aplicados en esta sesión
- `AntLayout.tsx` - Sidebar mobile colapsado a 0; ahora abre/cierre controlado por estado local
- `store.tsx` - Agregadas 5 tablas a `fetchInitialData`: `erp_publicaciones_muro`, `erp_planos`, `erp_rfis`, `erp_submittals`, `ventas_paquetes`
- `store.tsx` - Agregado `ventasPaquetes` al contexto del store
- `ComercialFinanzas.tsx` - Conectado a `ventasPaquetes` del store
- Supabase - Políticas RLS corregidas para `erp_cuentas_cobrar`, `erp_cotizaciones_negocio`, `erp_empleados`, `erp_proyectos`

### 📋 Próximos pasos
1. Validar **Notificaciones**, **Administración** y **Ajustes** por navegación directa
2. Insertar datos de prueba en **Notificaciones** para confirmar el flujo
3. Validar **Rendimiento Campo** con datos de destajos
4. Prueba offline/online explícita: crear OC en Bodega, simular offline, reconectar y verificar sincronización

### 🚨 Puntos de atención
- `addVentaPaquete` NO está expuesto en el contexto del store
- `addMaterial` NO está expuesto en el contexto del store
- Muro de Obra usa constraint de tipo en minúsculas: `avance`, `calidad`, `seguridad`, `general`
- Notificaciones se autogeneran por eventos del store (stock_critico, orden_cambio_pendiente, etc.)

---

## 11. SQL scripts utilizados en esta sesión

### Seed Muro de Obra
```sql
INSERT INTO public.erp_muro
  (id, proyecto_id, autor, autor_avatar, contenido, tipo, fotos, documento, likes, comentarios, created_by, created_at, updated_at)
VALUES
  (gen_random_uuid(), '97744a14-e447-4f5d-9090-c0978430169c', 'Ing. Roberto Díaz', '', 'Inicio de cimentación en zona norte.', 'avance', ARRAY[]::text[], '{}'::jsonb, 0, '[]'::jsonb, NULL, now(), now()),
  (gen_random_uuid(), '0a293315-1d4c-4064-bbe5-ce43ea606531', 'Arq. Laura Méndez', '', 'Inspección OK en losa nivel 12.', 'calidad', ARRAY[]::text[], '{}'::jsonb, 0, '[]'::jsonb, NULL, now(), now()),
  (gen_random_uuid(), '5ae0710e-73b1-4ef7-9a09-b3864476ebda', 'Tec. Andrés López', '', 'Charlas de seguridad para personal nuevo.', 'seguridad', ARRAY[]::text[], '{}'::jsonb, 0, '[]'::jsonb, NULL, now(), now()),
  (gen_random_uuid(), 'a1b2c3d4-1111-4111-8111-111111111111', 'Ing. Carlos Ruiz', '', 'Montaje de columnas en nivel 8.', 'general', ARRAY[]::text[], '{}'::jsonb, 0, '[]'::jsonb, NULL, now(), now());
```

### Seed Documentos
```sql
-- Planos
INSERT INTO public.erp_planos (id, proyecto_id, nombre, tipo, archivo_url, version, estado, disciplina, observaciones, created_at)
VALUES (gen_random_uuid(), 'ca3e2de7-1cd9-4fdd-a154-daf1cb4c613e', 'Planta arquitectónica nivel 1', 'Arquitectura', '/planos/vista-hermosa-planta-n1.pdf', 1, 'vigente', 'Arquitectura', '', now()),
       (gen_random_uuid(), '0a293315-1d4c-4064-bbe5-ce43ea606531', 'Detalle estructura losa 15', 'Estructura', '/planos/torre-centro-detalle-s03.pdf', 3, 'vigente', 'Estructura', '', now()),
       (gen_random_uuid(), '97744a14-e447-4f5d-9090-c0978430169c', 'Corte transversal puente', 'Puentes', '/planos/puente-corte-c02.pdf', 2, 'vigente', 'Puentes', '', now());

-- RFIs
INSERT INTO public.erp_rfis (id, proyecto_id, numero, titulo, descripcion, remitente, destinatario, estado, prioridad, created_at)
VALUES (gen_random_uuid(), '0a293315-1d4c-4064-bbe5-ce43ea606531', 'RFI-TC-001', 'Cambio en dimensiones de ventana', 'Solicita ajuste por proveedor', 'Proveedor', 'Oficina Técnica', 'abierto', 'alta', now()),
       (gen_random_uuid(), '5ae0710e-73b1-4ef7-9a09-b3864476ebda', 'RFI-RM-003', 'Espesor de losa distinto a plano', 'Verificar resistencia', 'Calidad', 'Estructura', 'en_revision', 'media', now());

-- Submittals
INSERT INTO public.erp_submittals (id, proyecto_id, numero, titulo, descripcion, estado, created_at)
VALUES (gen_random_uuid(), 'a1b2c3d4-1111-4111-8111-111111111111', 'SUB-TO-001', 'Muestras de acero estructural', 'Para aprobación en estructura', 'pendiente', now()),
       (gen_random_uuid(), '97744a14-e447-4f5d-9090-c0978430169c', 'SUB-PV-002', 'Plan de sells hidrófugos', 'Sellos y garantías', 'aprobado', now());
```

### Seed Comercial/Finanzas
```sql
INSERT INTO public.ventas_paquetes
  (id, proyecto_id, tipo, identificador, precio_venta, precio_contrato, estado, cliente, created_at)
VALUES
  (gen_random_uuid(), 'ca3e2de7-1cd9-4fdd-a154-daf1cb4c613e', 'paquete', 'VR-2026-01', 1250000, 1250000, 'disponible', 'Inmobiliaria Vista Hermosa S.A.', now()),
  (gen_random_uuid(), '0a293315-1d4c-4064-bbe5-ce43ea606531', 'paquete', 'VR-2026-02', 2400000, 2300000, 'reservado', 'Grupo Inversor Torre Centro', now()),
  (gen_random_uuid(), 'c3d4e1f2-3333-4333-8333-333333333333', 'lote', 'VR-2026-03', 3850000, 3700000, 'vendido', 'Industrial beta S.A.', now()),
  (gen_random_uuid(), 'b2c3d4e1-2222-4222-8222-222222222222', 'paquete', 'VR-2026-04', 980000, 980000, 'entregado', 'Residencial Los Olivos', now());
```

### Políticas RLS corregidas
```sql
-- erp_proyectos
DROP POLICY IF EXISTS "proyectos_admin_all" ON public.erp_proyectos;
CREATE POLICY "proyectos_admin_all" ON public.erp_proyectos
  FOR ALL USING (
    public.get_user_role() IN ('Administrador', 'Gerente')
    OR
    id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- erp_cuentas_cobrar
DROP POLICY IF EXISTS "cuentas_cobrar_select" ON public.erp_cuentas_cobrar;
CREATE POLICY "cuentas_cobrar_select" ON public.erp_cuentas_cobrar
  FOR SELECT USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero')
    OR
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- erp_cotizaciones_negocio (SIN proyecto_id)
DROP POLICY IF EXISTS "cotizaciones_negocio_access" ON public.erp_cotizaciones_negocio;
CREATE POLICY "cotizaciones_negocio_access" ON public.erp_cotizaciones_negocio
  FOR ALL USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero')
    OR
    cliente_nombre IS NOT NULL
  );

-- erp_empleados (corregir recursión)
DROP POLICY IF EXISTS "Users can view employees of accessible projects" ON public.erp_empleados;
CREATE POLICY "Users can view employees of accessible projects"
ON public.erp_empleados
FOR SELECT
USING (
  public.get_user_role() IN ('Administrador', 'Gerente')
  OR
  proyecto_id IN (
    SELECT id FROM public.erp_proyectos
    WHERE id = ANY(ARRAY(SELECT * FROM public.get_accessible_proyectos()))
  )
);
```

---

## 12. Archivos de documentación creados
- `docs/ReferenciaRapida-CodigoFuente.md` - Este archivo (referencia completa)
- `docs/e2e/mapa-validacion.md` - Checklist de validación E2E
- `docs/e2e/2026-06-09-informe-produccion.md` - Informe de producción
- `SCRIPT-FIX-VITE.md` - Solución para problema de Vite
- `supabase/migrations/000000000014_fix_security_definer_views_and_rls.sql` - Migración de vistas

---

**FIN DEL DOCUMENTO**
