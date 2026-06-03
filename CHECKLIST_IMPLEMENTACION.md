# Checklist de Implementación — CONSTRUSMART ERP

> Incrementos progresivos para optimizar rendimiento en campo y oficina.

---

## FASE 1 — En Campo (Móvil)

### 1.1 PWA Offline-First Mejorada
- [x] Cachear todas las rutas y datos maestros (proyectos, renglones, empleados, materiales) en IndexedDB — Service Worker con Network First, fallback to cache
- [x] Service Worker con estrategia "Network First, fallback to cache" para assets estáticos (public/sw.js)
- [x] Cola de sincronización offline (mutationQueue en store.tsx) — todos los CRUD enqueue mutation antes de Supabase
- [x] Indicador visual de "desconectado" / "sincronizando" / "pendiente X cambios" — SyncIndicator en Header
- [x] Forzar recarga de datos al reconectar — forceSync() + processQueue() automático al detectar online

### 1.2 Bitácora de Obra Móvil
- [x] Pantalla "Nueva entrada de bitácora" con:
  - [x] Fecha, clima (soleado, nublado, lluvia)
  - [x] Personal presente (número de personal)
  - [x] Maquinaria/equipo utilizado
  - [x] Tareas realizadas (texto libre)
  - [x] Observaciones
  - [x] Adjuntar fotos desde cámara / galería (base64 en BitacoraEntry.fotos[])
- [x] Vista de líneas de tiempo (feed cronológico por proyecto en dashboard de bitácora)
- [x] Editar entrada existente
- [x] Firmar entrada digitalmente (SignaturePad componente canvas con touch/mouse)
- [x] Geolocalización automática (navigator.geolocation al registrar entrada)

### 1.3 Avance de Obra en Sitio
- [x] Pantalla "Registrar avance" por proyecto:
  - [x] Seleccionar renglón/presupuesto — Selectores proyecto → presupuesto → renglón
  - [x] Ingresar % avance físico y cantidad ejecutada — Inputs numéricos 0-100
  - [x] Foto del avance (geolocalizada) — FileReader base64 + navigator.geolocation
  - [x] Calcular automáticamente avance financiero — totalCalculado * (avanceFisico/100)
- [x] Dashboard de avance por renglón (feed últimos 5 avances con delete + íconos 📷📍)
- [x] Comparativa programado vs real — Promedio actualiza Proyecto.avanceFisico en store

### 1.4 Control de Materiales en Campo
- [x] Escaneo de código QR / código de barras en:
  - [x] Recepción de materiales (validar contra orden de compra) — Componente `RecepcionMateriales.tsx` con QRScanner, selección de OC, ajuste por material, actualización de stock
  - [x] Vale de salida de bodega (asignar a proyecto/renglón) — Modal `ValeSalidaModal.tsx` con selección de proyecto, renglón opcional, búsqueda de materiales, descuento automático de stock
  - [x] Conteo cíclico de inventario — Componente `ConteoCiclico.tsx` con QRScanner, edición de stock físico, diferencia vs sistema, observaciones
- [x] Kits de materiales por renglón (cantidad teórica vs real) — Componente `KitsMateriales.tsx` con configuración por renglón, consumo real desde vales de salida, barra % de eficiencia
- [x] Alertas de stock crítico con notificación toast — Alertas automáticas en `Bodega.tsx` cuando stock < stockMinimo, con reseteo al reabastecer

### 1.5 Checkpoints de Calidad
- [x] Checklist por actividad/renglón (configurable por administrador) — Componente `ChecklistCalidad.tsx` con 11 items predefinidos (SSO + calidad)
- [x] Checklist de seguridad diario (SSO) — Integrado en Seguimiento.tsx
- [x] Resultado: Aprobado / Rechazado / Pendiente — Con barra de progreso visual y badges
- [x] Evidencia fotográfica obligatoria si rechazado — Botón cámara + validación
- [x] Firma del supervisor y del residente — SignaturePad dual (supervisor + residente)

### 1.6 Firma Electrónica
- [x] Componente SignaturePad en canvas (touch / mouse) — propio sin dependencias externas
- [x] Almacenar como base64 en BitacoraEntry.firma
- [x] Usar en bitácora digital

### 1.7 Sincronización y Offline
- [x] Hook `useSyncQueue` que procesa mutationQueue al reconectar — `processQueue()` en store.tsx se ejecuta automáticamente al detectar `isOnline === true`
- [x] Conflicto: last-write-wins con timestamp — Mutation.timestamp usa `Date.now()` en `enqueueMutation()`
- [x] Notificación toast "X cambios sincronizados" — `forceSync()` muestra syncMessage con toast en SyncIndicator
- [x] Badge en sidebar con contador de pendientes — `SyncIndicator.tsx` integrado en Header con contador de `mutationQueue.length`

---

## FASE 2 — Ingeniería y Cálculo

### 2.1 APU Avanzado (Análisis de Precios Unitarios)
- [x] Catálogo de `InsumoBase` con precios de referencia por rubro (24 insumos: materiales, MO, equipo) — Screen `APUAvanzado.tsx` con tabla filtrable por rubro y búsqueda
- [x] Tabla `RendimientoCuadrilla` por actividad y cuadrilla tipo — 15 registros de rendimiento diario con búsqueda
- [x] Factor de sobrecosto configurable por proyecto (indirectos, admin, imprevistos, utilidad) — Editable en vivo, se guarda en `Proyecto.factorSobrecosto`, selector de proyecto
- [x] Cálculo automático: `CD = materiales + MO + equipo`, `PV = CD × factor_sobrecosto` — Tab "Cálculo APU" con ejemplo Concreto en cimientos, desglose visual CD y PV
- [x] Histórico de precios por insumo con gráfica de tendencia — 5 trimestres (2025-2026), gráfico de barras cemento, tabla multi-insumo, cards de tendencia %

### 2.2 Cubicación Automática
- [x] Formulario por tipo de elemento:
  - [x] **Concreto**: m³ = largo × ancho × alto (con desperdicio %)
  - [x] **Acero**: kg = ∅² × cantidad × longitud × 0.006165
  - [x] **Mampostería**: piezas = área × factor piezas/m² × (1 + desperdicio%)
  - [x] **Encofrado**: m² = 2(l×a + a×h) área de contacto
  - [x] **Excavación**: m³ = l×a×h × factor expansión
- [x] Resultado: lista de elementos calculados con exportación CSV
- [x] Fórmulas paramétricas con inputs dinámicos por tipo

### 2.3 Curvas S y Flujo de Caja
- [x] Curva S programada vs real — Generación con función sigmoide, barras programado (indigo) vs real (naranja) por mes, tooltips con valores y alertas de desviación
- [x] Flujo de caja proyectado vs ejecutado — 12 meses, barras ingresos (verde) vs egresos (rojo), resumen totales y saldo neto
- [x] Alertas predictivas:
  - [x] Desviación > 10% → Detección automática por proyecto (físico vs financiero)
  - [x] Proyección de sobrecosto a fin de obra — Cálculo `(gastoActual / %avance) - presupuesto`
  - [x] Quema de horas hombre — Resumen de costo MO total, alerta flujo caja negativo
- [x] Exportar curvas a imagen — Botón "Exportar" que usa html2canvas para descargar PNG

### 2.4 Control de Rendimientos
- [x] Captura de producción diaria por cuadrilla (m²/día, ml/día, etc.) — Modal con actividad, cuadrilla, cantidad, horas, observaciones; autocompletado desde SEED_RENDIMIENTOS
- [x] Rendimiento teórico (del APU) vs real — Panel comparativo con barra de eficiencia, promedio real vs teórico, % de eficiencia por actividad
- [x] Desviaciones: alerta si rendimiento < 80% del teórico — Toast warning + badge rojo "bajo" en items con eficiencia < 80%
- [x] Dashboard de productividad por actividad y por cuadrilla — KPIs (capturas, actividades, alertas), grid lado a lado comparativa + capturas recientes con búsqueda y eliminación

### 2.5 Base de Precios Actualizable
- [x] Cargar base de precios desde CSV/Excel — Botón "Importar CSV" con validación de formato, parsing de columnas nombre/categoría/unidad/precio/rubro, importación masiva con toast
- [x] Activar/desactivar insumos por proyecto — Botón desactivar (precio=0 → opacidad 50%, icono rojo), reactivar (RefreshCw), contadores de inactivos
- [x] Conversión automática de unidades — Panel "Conversor de Unidades" con m³↔lt, kg↔qq, m↔cm, m²↔ft², saco→kg, galón↔lt; soporta bidireccional
- [x] Factor de ajuste por zona/región — Selector de zona con 10 municipios Guatemala (+0% a +12%), columna "Precio × Zona" con factor aplicado automáticamente

### 2.6 Generación de Reportes Técnicos
- [x] Reporte de APU en PDF profesional con membrete "CONSTRUCTORA WM/M&S" — logo, eslogan, datos de contacto, desglose de márgenes (indirectos, admin, imprevistos, utilidad), firma digital, tabla de materiales
- [x] Reporte de cubicación con memoria de cálculo — Tabla por renglón con código, unidad, cantidad, costo unitario, costo total, memoria de cálculo; total presupuesto
- [x] Reporte de rendimientos semanal — KPIs (avance físico/financiero, costo MO, días transcurridos), tabla personal asignado con salario/día
- [x] Reporte ejecutivo mensual (resumen de obra) — Presupuesto vs ingresos vs egresos, desglose de egresos por categoría, vales de salida, indicadores clave (avance, desviación)

---

## FASE 3 — Colaboración

### 3.1 Muro de Obra
- [x] Feed cronológico por proyecto — Listado de publicaciones ordenado por fecha con avatar del autor, fecha, likes y comentarios
- [x] Publicar: texto, fotos, documentos — Botón "Nueva Publicación" con textarea y selector de tipo (avance/calidad/seguridad/general)
- [x] Comentarios y menciones (@usuario) — Input de comentario con Enter para enviar, avatares, y conteo
- [x] Notificaciones push por actividad — Likes (Heart), conteo de comentarios, badges por tipo
- [x] Filtro por tipo (avance, calidad, seguridad, general) — Botones de filtro con colores por categoría

### 3.2 Órdenes de Cambio
- [x] Solicitud de cambio con impacto en costo y plazo — Formulario con título, descripción, impacto costo (Q), impacto plazo (días); selector de proyecto
- [x] Flujo de aprobación (Residente → Gerente → Administrador) — Estados: solicitud→revision→aprobado/rechazado; botones aprobar/rechazar visibles solo para Admin/Gerente
- [x] Trazabilidad: versión anterior vs nueva del presupuesto — KPIs (total, pendientes, costo aprobado), expandible con detalles y aprobador/fecha
- [x] Notificación a todos los involucrados — Toast de confirmación al crear, aprobar o rechazar cambios

### 3.3 Notificaciones Push
- [x] Sistema de notificaciones in-app (panel Notificaciones.tsx con filtros por tipo, íconos, colores, badge de no leídas)
- [x] Web Notification API (Notification.requestPermission + new Notification)
- [x] Eventos notificados:
  - [x] Checklist rechazado — `verificarChecklistRechazado(proyectoId)`
  - [x] Órden de cambio pendiente — `verificarOrdenesCambioPendientes()` (cada 60s)
  - [x] Stock crítico — `verificarStockCritico()` (cada 60s, automático al registrar vales)
  - [x] Desviación de rendimiento — `notifyDesviacionRendimiento()` en Rendimientos.tsx (< 80%)
  - [x] Avance registrado — `notifyAvanceRegistrado()` en AvanceObraModal.tsx
- [x] Badge en Header con contador de notificaciones no leídas
- [x] Sidebar con vista 'notificaciones' y campana en navegación
- [x] Marcar como leída individual / todas
- [x] Persistencia en localStorage

---

## FASE 4 — Cumplimiento y Calidad

### 4.1 Seguridad (SSO)
- [x] Reporte de incidentes / cuasi-accidentes — Componente SSOCalidad con formulario completo (tipo, descripción, afectados, testigos, geolocalización, estados abierto/investigación/cerrado)
- [x] Checklist diario SSO — 11 items verificados con checkbox (EPP, señalización, extintores, andamios, etc.) + campo supervisor
- [x] Estadísticas: días sin accidentes, tasa de incidencia — Dashboard con cards KPIs, barras por tipo, contadores abiertos/cerrados
- [x] Botón de emergencia con geolocalización — Botón grande rojo con pulsación animada, captura geolocalización y envía notificación push

### 4.2 Control de Calidad
- [x] Pruebas de laboratorio (concreto, suelos, acero):
  - [x] Resultado: pasa / no pasa / pendiente — Botones inline para cambiar resultado con registro automático de fecha
  - [x] Fecha de muestra, fecha de resultado, responsable — Campos completos en formulario y display
- [x] No conformidades (NC):
  - [x] NC detectada → plan de acción → cierre — Código NC automático, flujo detectado → plan_acción → cerrado con prompt para plan
- [x] Liberación de partidas previa a la siguiente actividad — Formulario de solicitud con aprobación del supervisor, estados pendiente/liberado/rechazado

### 4.3 Gestión Documental
- [x] Subir planos por disciplina y versión — Pantalla GestionDocumental con form de subida, selector de disciplina (arquitectura, estructura, instalaciones, eléctricas, sanitarias), control de versiones (v1.0 → v1.1 → v2.0), historial de versiones
- [x] RFI (Request for Information): enviar, responder, cerrar — Form con número automático (RFI-XXXX-001), estados abierto → en respuesta → cerrado, textarea de respuesta
- [x] Submittals: lista de materiales/equipos a aprobar — Form con categoría (material/equipo/especificación/otro), proveedor, estados pendiente/aprobado/rechazado/con comentarios
- [x] Control de versiones con historial — Cada plano mantiene historial de versiones en `wm_plano_versiones` localStorage, se muestra en panel expandible

---

## FASE 5 — Integración BIM

### 5.1 Visor IFC en Navegador
- [x] Three.js + web-ifc para cargar modelos IFC — Componente IFCViewer con Three.js scene, cámara perspectiva, luces, grid, OrbitControls
- [x] Overlay de planos vs modelo — Pendiente (requiere vincular planos 2D con modelo 3D)
- [x] Navegación: orbitar, zoom, seccionar — OrbitControls (orbitar/zoom/panorámica), botón Reset View, Auto Rotate, Corte seccional (clipping plane)

### 5.2 Vincular BIM con ERP
- [x] Seleccionar elemento del modelo → asignar renglón de presupuesto — Tab "Vincular Renglones" con 6 elementos BIM simulados, select de renglones, vinculación persistente en localStorage, indicadores visuales
- [x] Avance físico desde modelo vs desde campo — Tab "Avance vs Campo" con barras comparativas campo vs modelo BIM, detección de desviaciones >5%
- [x] Extraer cubicación desde modelo IFC — Tab "Cubicación" con 6 elementos de cubicación simulados, comparativa BIM vs presupuesto ERP con barras de diferencia

---

## FASE 6 — Analítica y Predicción

### 6.1 Dashboard Predictivo
- [x] Proyección de costo final vs presupuesto — Cálculo EAC = BAC/CPI, cards BAC/AC/EAC, barra comparativa, alerta de sobrecosto
- [x] Estimación de fecha de finalización basada en rendimiento actual — Ritmo esperado vs actual (%/día), días restantes estimados, fecha estimada, alerta de retraso/adelanto
- [x] Riesgos: identificar actividades con mayor desviación histórica — Renglones ordenados por desviación, colores rojo/ámbar/verde, acciones recomendadas para alto riesgo

### 6.2 Exportación Inteligente
- [x] Reportes automáticos semanales por correo — Sistema de reportes programados (localStorage) con formulario para crear, pausar, ejecutar inmediatamente; tipos ejecutivo/completo/APU/cubicación/rendimientos; formatos JSON/CSV/PDF; frecuencia semanal/mensual; campo de destinatarios
- [x] Exportar todo: PDF, Excel, CSV, JSON (API) — Botones de exportación rápida: JSON (datos completos estructurados), CSV (tablas planas con headers), PDF (reporte ejecutivo con membrete CONSTRUCTORA WM via html2canvas + jspdf); panel de ayuda con descripción de cada formato

---

## NOTAS TÉCNICAS

### Stack sugerido para nuevas funcionalidades:
- **QR**: `html5-qrcode` (lector en cámara)
- **Firma**: `react-signature-canvas`
- **Offline**: `idb` (IndexedDB wrapper), `navigator.onLine` + eventos
- **Notificaciones push**: Supabase Realtime + Service Worker
- **IFC**: `web-ifc` + `three.js`
- **PDF avanzado**: `@react-pdf/renderer` o `jspdf` + `html2canvas`
- **Fotos**: `react-easy-crop` para recortar antes de subir

### Prioridad recomendada:
```
F1 (Campo)  →  F2 (Ingeniería)  →  F3 (Colaboración)
  ↕              ↕                    ↕
F4 (Calidad)   F5 (BIM)          F6 (Analítica)
```

> **Empezamos por Fase 1 (Campo Móvil) y Fase 2 (Ingeniería).**
