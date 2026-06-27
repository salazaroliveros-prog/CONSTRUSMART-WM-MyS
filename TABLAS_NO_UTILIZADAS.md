# Tablas de Supabase No Utilizadas en la Aplicación

## Análisis

### Tablas No Integradas en el Store

#### 1. erp_solicitudes
- **Estado**: Tabla existe en migración 070 pero NO está integrada en el store
- **Migración**: `000000000070_create_erp_solicitudes.sql`
- **Uso actual**: Ninguno
- **Recomendación**: Eliminar o implementar módulo de solicitudes
- **Prioridad**: BAJA - No es crítica para el funcionamiento actual

#### 2. erp_archivos_tipo
- **Estado**: Tabla existe en migración 071 pero NO está integrada en el store
- **Migración**: `000000000071_create_erp_archivos_tipo.sql`
- **Uso actual**: Ninguno
- **Recomendación**: Eliminar o implementar gestión de tipos de archivos
- **Prioridad**: BAJA - No es crítica para el funcionamiento actual

### Tablas de Motor de Cálculo (Intencionalmente No Integradas)

Estas tablas contienen datos de referencia estáticos y no necesitan sincronización bidireccional con el store:

- erp_departamentos_gt
- erp_municipios_gt
- erp_subtipologias
- erp_dosificaciones_concreto
- erp_referencias_acero
- erp_precios_acero
- erp_parametros_movimiento_tierra
- erp_parametros_climaticos
- erp_parametros_pavimentos
- erp_parametros_redes_infraestructura
- erp_parametros_muros_contencion
- erp_calculos_proyecto
- erp_comparaciones_calculos
- erp_snapshots_estado_calculo
- erp_reglas_factores
- erp_historial_aplicacion_reglas
- erp_estacionalidad
- erp_ajustes_estacionales_actividad
- erp_escalas_produccion
- erp_aplicacion_escalas
- erp_normativa_departamental
- erp_cumplimiento_normativo
- erp_normativas_departamentales

**Estado**: Estas tablas son parte del motor de cálculo y no necesitan integración en el store de frontend
**Prioridad**: NINGUNA - Funcionan como datos de referencia backend

## Recomendaciones

### Opción 1: Eliminar Tablas No Utilizadas
```sql
-- Solo en entorno de desarrollo con backup previo
DROP TABLE IF EXISTS public.erp_solicitudes CASCADE;
DROP TABLE IF EXISTS public.erp_archivos_tipo CASCADE;
```

### Opción 2: Implementar Funcionalidad
- **erp_solicitudes**: Implementar módulo de solicitudes de materiales/servicios
- **erp_archivos_tipo**: Implementar gestión de tipos de archivos para GestionDocumental

### Opción 3: Dejar Tablas (Mantener Status Quo)
- Mantener las tablas por si se necesitan en el futuro
- No afectan el funcionamiento actual
- Espacio en base de datos mínimo

## Decisión Recomendada

**DEJAR TABLAS** por las siguientes razones:
1. No afectan el funcionamiento actual
2. Pueden ser útiles en desarrollos futuros
3. Costo de almacenamiento mínimo
4. Migraciones pueden deshacerse si es necesario

Si en el futuro se requiere la funcionalidad, las tablas ya están listas con su schema definido.
