# Checklist de Implementación — CONSTRUSMART ERP

> Incrementos progresivos para optimizar rendimiento en campo y oficina.

---

## FASE 1 — En Campo (Móvil)

### 1.1 PWA Offline-First Mejorada
- [ ] Cachear todas las rutas y datos maestros (proyectos, renglones, empleados, materiales) en IndexedDB
- [ ] Service Worker con estrategia "Network First, fallback to cache" para mutaciones
- [ ] Cola de sincronización offline (ya existe mutationQueue en store.tsx — ampliarla)
- [ ] Indicador visual de "desconectado" / "sincronizando" / "pendiente X cambios"
- [ ] Forzar recarga de datos al reconectar

### 1.2 Bitácora de Obra Móvil
- [ ] Pantalla "Nueva entrada de bitácora" con:
  - [ ] Fecha, clima (soleado, nublado, lluvia)
  - [ ] Personal presente (checkbox desde lista de empleados)
  - [ ] Maquinaria/equipo utilizado
  - [ ] Tareas realizadas (texto libre + selección desde renglones)
  - [ ] Observaciones
  - [ ] Adjuntar fotos desde cámara / galería
- [ ] Vista de líneas de tiempo (feed cronológico por proyecto)
- [ ] Editar entrada existente
- [ ] Firmar entrada digitalmente (canvas de firma)

### 1.3 Avance de Obra en Sitio
- [ ] Pantalla "Registrar avance" por proyecto:
  - [ ] Seleccionar renglón/presupuesto
  - [ ] Ingresar % avance físico y cantidad ejecutada
  - [ ] Foto del avance (geolocalizada)
  - [ ] Calcular automáticamente avance financiero
- [ ] Dashboard de avance por renglón (barra de progreso + foto asociada)
- [ ] Comparativa programado vs real (desde datos existentes)

### 1.4 Control de Materiales en Campo
- [ ] Escaneo de código QR / código de barras en:
  - [ ] Recepción de materiales (validar contra orden de compra)
  - [ ] Vale de salida de bodega (asignar a proyecto/renglón)
  - [ ] Conteo cíclico de inventario
- [ ] Kits de materiales por renglón (cantidad teórica vs real)
- [ ] Alertas de stock crítico con notificación push

### 1.5 Checkpoints de Calidad
- [ ] Checklist por actividad/renglón (configurable por administrador)
- [ ] Checklist de seguridad diario (SSO)
- [ ] Resultado: Aprobado / Rechazado / Pendiente
- [ ] Evidencia fotográfica obligatoria si rechazado
- [ ] Firma del supervisor y del residente

### 1.6 Firma Electrónica
- [ ] Componente de firma en canvas (touch / mouse)
- [ ] Almacenar como base64 en `eventos_calendario` o nueva tabla `firmas`
- [ ] Usar en: recepción de materiales, vale de salida, checklists, bitácora

### 1.7 Sincronización y Offline
- [ ] Hook `useSyncQueue` que procesa mutationQueue al reconectar
- [ ] Conflicto: last-write-wins con timestamp
- [ ] Notificación toast "X cambios sincronizados"
- [ ] Badge en sidebar con contador de pendientes

---

## FASE 2 — Ingeniería y Cálculo

### 2.1 APU Avanzado (Análisis de Precios Unitarios)
- [ ] Tabla `erp_insumos_base` con precios de referencia por rubro (INSIVUMEH / MOP)
- [ ] Tabla `erp_rendimientos` por actividad y cuadrilla tipo
- [ ] Factor de sobrecosto configurable por proyecto (indirectos, utilidad, imprevistos)
- [ ] Cálculo automático: `CD = materiales + MO + equipo`, `PV = CD * factor_sobrecosto`
- [ ] Histórico de precios por insumo con gráfica de tendencia

### 2.2 Cubicación Automática
- [ ] Formulario por tipo de elemento:
  - [ ] **Concreto**: m³ = largo × ancho × alto (con desperdicio %)
  - [ ] **Acero**: kg = ∅ × cantidad × longitud × peso unitario
  - [ ] **Mampostería**: m² = área × factor de piezas/m²
  - [ ] **Encofrado**: m² = área de contacto
  - [ ] **Excavación**: m³ = volumen geométrico × factor de expansión
- [ ] Resultado: lista de insumos calculados lista para exportar a presupuesto
- [ ] Biblioteca de fórmulas paramétricas guardables

### 2.3 Curvas S y Flujo de Caja
- [ ] Curva S programada vs real (ya hay datos — mejorar visualización)
- [ ] Flujo de caja proyectado vs ejecutado
- [ ] Alertas predictivas:
  - [ ] Desviación > 10% → notificación automática
  - [ ] Proyección de sobrecosto a fin de obra
  - [ ] Quema de horas hombre vs productividad esperada
- [ ] Exportar curvas a imagen / PDF

### 2.4 Control de Rendimientos
- [ ] Captura de producción diaria por cuadrilla (m²/día, ml/día, etc.)
- [ ] Rendimiento teórico (del APU) vs real
- [ ] Desviaciones: alerta si rendimiento < 80% del teórico
- [ ] Dashboard de productividad por actividad y por cuadrilla

### 2.5 Base de Precios Actualizable
- [ ] Cargar base de precios desde CSV/Excel
- [ ] Activar/desactivar insumos por proyecto
- [ ] Conversión automática de unidades
- [ ] Factor de ajuste por zona/región

### 2.6 Generación de Reportes Técnicos
- [ ] Reporte de APU en PDF (con firma digital)
- [ ] Reporte de cubicación con memoria de cálculo
- [ ] Reporte de rendimientos semanal
- [ ] Reporte ejecutivo mensual (resumen de obra)

---

## FASE 3 — Colaboración

### 3.1 Muro de Obra
- [ ] Feed cronológico por proyecto
- [ ] Publicar: texto, fotos, documentos
- [ ] Comentarios y menciones (@usuario)
- [ ] Notificaciones push por actividad
- [ ] Filtro por tipo (avance, calidad, seguridad, general)

### 3.2 Órdenes de Cambio
- [ ] Solicitud de cambio con impacto en costo y plazo
- [ ] Flujo de aprobación (Residente → Gerente → Administrador)
- [ ] Trazabilidad: versión anterior vs nueva del presupuesto
- [ ] Notificación a todos los involucrados

### 3.3 Notificaciones Push
- [ ] Configurar Supabase Realtime + WebPush
- [ ] Eventos a notificar:
  - [ ] Checklist rechazado
  - [ ] Órden de cambio pendiente de aprobación
  - [ ] Stock crítico
  - [ ] Desviación de rendimiento
  - [ ] Avance registrado

---

## FASE 4 — Cumplimiento y Calidad

### 4.1 Seguridad (SSO)
- [ ] Reporte de incidentes / cuasi-accidentes
- [ ] Checklist diario SSO
- [ ] Estadísticas: días sin accidentes, tasa de incidencia
- [ ] Botón de emergencia con geolocalización

### 4.2 Control de Calidad
- [ ] Pruebas de laboratorio (concreto, suelos, acero):
  - [ ] Resultado: pasa / no pasa / pendiente
  - [ ] Fecha de muestra, fecha de resultado, responsable
- [ ] No conformidades (NC):
  - [ ] NC detectada → plan de acción → cierre
- [ ] Liberación de partidas previa a la siguiente actividad

### 4.3 Gestión Documental
- [ ] Subir planos por disciplina y versión
- [ ] RFI (Request for Information): enviar, responder, cerrar
- [ ] Submittals: lista de materiales/equipos a aprobar
- [ ] Control de versiones con historial

---

## FASE 5 — Integración BIM

### 5.1 Visor IFC en Navegador
- [ ] Three.js + web-ifc para cargar modelos IFC
- [ ] Overlay de planos vs modelo
- [ ] Navegación: orbitar, zoom, seccionar

### 5.2 Vincular BIM con ERP
- [ ] Seleccionar elemento del modelo → asignar renglón de presupuesto
- [ ] Avance físico desde modelo vs desde campo
- [ ] Extraer cubicación desde modelo IFC

---

## FASE 6 — Analítica y Predicción

### 6.1 Dashboard Predictivo
- [ ] Proyección de costo final vs presupuesto
- [ ] Estimación de fecha de finalización basada en rendimiento actual
- [ ] Riesgos: identificar actividades con mayor desviación histórica

### 6.2 Exportación Inteligente
- [ ] Reportes automáticos semanales por correo
- [ ] Exportar todo: PDF, Excel, CSV, JSON (API)

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
