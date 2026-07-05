# CONSTRUSMART ERP - Lista de Tareas Pendientes

Esta lista contiene tareas pendientes identificadas durante las sesiones de desarrollo. Las tareas están organizadas por prioridad y módulo.

## 📋 Sesión Actual: Weather & Environmental Conditions Dashboard

### ✅ Completado en Esta Sesión

**Weather Dashboard Module:**
- ✅ Accessibility (WCAG AA compliant): aria-labels, roles, keyboard navigation
- ✅ Error handling with caching and retry mechanisms
- ✅ Skeleton loading component (SkeletonWeather)
- ✅ Supabase persistence (erp_proyecto_weather table)
- ✅ Dashboard integration (WeatherWidget component)
- ✅ Dark mode color consistency
- ✅ PDF/Excel export functionality
- ✅ SQL migration executed and verified
- ✅ Migration scripts and documentation created

**Commits:**
- ✅ feat: enhance Weather Dashboard with accessibility, error handling, and export functionality
- ✅ fix: improve SQL migration for erp_proyecto_weather table
- ✅ feat: add Supabase persistence and Dashboard integration for Weather module
- ✅ feat: add migration scripts and guide for erp_proyecto_weather table

---

## 🚧 Tareas Pendientes

### 🔴 Alta Prioridad

#### 1. Testing del Módulo Weather en Producción
**Estado:** Pendiente de prueba manual
**Descripción:** Probar el módulo Weather en la aplicación real con datos de Supabase
**Tareas:**
- [ ] Iniciar aplicación: `npm run dev`
- [ ] Navegar a pantalla Weather
- [ ] Seleccionar proyecto con coordenadas configuradas
- [ ] Click en Refresh para obtener datos climáticos
- [ ] Verificar que los datos se guardan en Supabase
- [ ] Verificar que los datos se cargan desde Supabase al montar
- [ ] Probar autorefresh automático (60 minutos)
- [ ] Probar exportación PDF
- [ ] Probar exportación Excel
- [ ] Verificar widget en Dashboard principal
- [ ] Probar cambio de proyecto y carga de datos correspondientes

**Dependencias:** Ninguna (la migración ya está ejecutada)

#### 2. Configuración de Service Role Key para Scripts
**Estado:** Credenciales no disponibles en .env.local
**Descripción:** Configurar VITE_SUPABASE_SERVICE_ROLE_KEY en .env.local para permitir ejecución de scripts de migración/verificación
**Tareas:**
- [ ] Obtener service role key desde Supabase Dashboard → Settings → API
- [ ] Agregar VITE_SUPABASE_SERVICE_ROLE_KEY a .env.local
- [ ] Probar ejecución de `npm run migrate:weather` con credenciales
- [ ] Probar ejecución de `npm run verify:weather` con credenciales
- [ ] Documentar el proceso en AGENTS.md

**Dependencias:** Acceso a Supabase Dashboard

---

### 🟡 Media Prioridad

#### 3. Mejoras en el Módulo Weather
**Estado:** Funcionalidad básica completa
**Descripción:** Mejoras opcionales para enriquecer el módulo Weather
**Tareas:**
- [ ] Agregar gráficos históricos de clima (temperatura, precipitación)
- [ ] Agregar alertas push para condiciones climáticas críticas
- [ ] Agregar configuración de umbrales personalizados por proyecto
- [ ] Agregar historial de datos climáticos guardados
- [ ] Agregar comparación de clima entre múltiples proyectos
- [ ] Agregar integración con calendario de hitos para mostrar impacto en fechas específicas
- [ ] Agregar métricas de eficiencia basadas en clima (días trabajables vs días perdidos por clima)

**Dependencias:** Testing del módulo básico completado

#### 4. Optimización de Performance
**Estado:** No iniciado
**Descripción:** Optimizar performance del módulo Weather
**Tareas:**
- [ ] Implementar cache de pronóstico de 7 días (reduce llamadas a API)
- [ ] Implementar debounce en autorefresh
- [ ] Optimizar tamaño de datos almacenados en Supabase (comprimir JSONB)
- [ ] Agregar paginación o lazy loading para historial de datos
- [ ] Implementar Web Workers para cálculos de impacto climático pesados

**Dependencias:** Mejoras en el módulo Weather

---

### 🟢 Baja Prioridad

#### 5. Documentación Técnica
**Estado:** Parcialmente completada
**Descripción:** Completar documentación técnica del módulo Weather
**Tareas:**
- [ ] Agregar diagrama de arquitectura del módulo Weather
- [ ] Documentar API de weatherService.ts
- [ ] Documentar schema Zod de weather
- [ ] Agregar ejemplos de uso en AGENTS.md
- [ ] Crear guía de troubleshooting para problemas comunes de clima
- [ ] Documentar políticas RLS y seguridad

**Dependencias:** Ninguna

#### 6. Internacionalización Completa
**Estado:** Parcialmente completada
**Descripción:** Completar traducciones del módulo Weather
**Tareas:**
- [ ] Verificar que todas las strings del módulo Weather estén en i18n
- [ ] Agregar traducciones faltantes en en.json
- [ ] Agregar traducciones faltantes en es.json
- [ ] Revisar consistencia de términos (impact level, factors, etc.)
- [ ] Agregar traducciones para nuevos componentes (WeatherWidget)

**Dependencias:** Ninguna

---

## 📊 Otros Módulos - Tareas Pendientes Generales

### Módulo de Reportes Técnicos
- [ ] Mejorar exportación de reportes con más formatos
- [ ] Agregar plantillas personalizables de reportes
- [ ] Integrar datos de clima en reportes técnicos

### Módulo de Dashboard Predictivo
- [ ] Integrar datos de clima en predicciones de工期
- [ ] Agregar análisis de correlación clima vs retrasos
- [ ] Implementar modelos de ML para predicción de impacto climático

### Módulo de Seguimiento
- [ ] Mostrar impacto climático en la curva S
- [ ] Agregar indicadores de días perdidos por clima
- [ ] Integrar ventanas de scheduling en cronograma

### Módulo de Riesgos
- [ ] Agregar riesgos climáticos automáticos basados en pronóstico
- [ ] Calcular probabilidad de retraso por clima
- [ ] Generar recomendaciones de mitigación climática

---

## 🔧 Mantenimiento y DevOps

### Base de Datos
- [ ] Programar backup automático de tabla erp_proyecto_weather
- [ ] Configurar retención de datos históricos de clima
- [ ] Monitorear crecimiento de tabla erp_proyecto_weather
- [ ] Optimizar índices si la tabla crece significativamente

### CI/CD
- [ ] Agregar tests de integración para módulo Weather
- [ ] Agregar verificación de migraciones en pipeline
- [ ] Configurar despliegue automático de migraciones

### Seguridad
- [ ] Revisar políticas RLS de erp_proyecto_webher
- [ ] Implementar rate limiting para llamadas a API de clima
- [ ] Rotar service role key si fue expuesta
- [ ] Agregar auditoría de accesos a datos climáticos

---

## 📝 Notas

- La migración de erp_proyecto_weather ya está ejecutada en Supabase
- Los scripts de migración/verificación están listos pero requieren service role key
- El módulo Weather está 100% implementado a nivel de código
- Falta testing manual en producción para validar integración completa

## 🎯 Próxima Sesión Recomendada

**Prioridad:** Testing del Módulo Weather en Producción

1. Iniciar aplicación y probar módulo Weather
2. Verificar persistencia en Supabase
3. Probar todas las funcionalidades (refresh, export, widget)
4. Documentar cualquier issue encontrado
5. Configurar service role key si es necesario para scripts automatizados

---

**Última actualización:** 2026-07-01
**Sesión:** Weather & Environmental Conditions Dashboard
**Estado:** Migración completada, pendiente testing en producción
