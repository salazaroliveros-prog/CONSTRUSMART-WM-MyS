# Documentación: Tablas de Motor de Cálculo

## Resumen

Las tablas de motor de cálculo contienen datos de referencia estáticos utilizados por el sistema para calcular presupuestos, rendimientos y costos. No requieren sincronización bidireccional con el store de frontend.

## Tablas de Motor de Cálculo

### 1. Geografía y Tipología (Migraciones 025, 027)

#### erp_departamentos_gt
- **Propósito**: Catálogo de departamentos de Guatemala
- **Campos**: id, nombre, codigo
- **Migración**: 000000000025_motor_calculo_fase1_geografia.sql
- **Uso**: Selección de ubicación en proyectos

#### erp_municipios_gt
- **Propósito**: Catálogo de municipios de Guatemala
- **Campos**: id, nombre, departamento_id, codigo
- **Migración**: 000000000025_motor_calculo_fase1_geografia.sql
- **Uso**: Selección de ubicación detallada en proyectos

#### erp_subtipologias
- **Propósito**: Clasificación detallada de tipologías de construcción
- **Campos**: id, tipologia, subtipologia, factores_ajuste
- **Migración**: 000000000027_motor_calculo_fase1_subtipologias.sql
- **Uso**: Cálculo de factores de sobrecosto por subtipología

### 2. Materiales y Costos (Migraciones 026, 028)

#### erp_dosificaciones_concreto
- **Propósito**: Dosificaciones estándar de concreto por resistencia
- **Campos**: id, resistencia, tipo, materiales, proporciones
- **Migración**: 000000000026_motor_calculo_fase1_dosificaciones.sql
- **Uso**: Cálculo de volúmenes de materiales para concreto

#### erp_referencias_acero
- **Propósito**: Catálogo de acero de refuerzo por tipo y diámetro
- **Campos**: id, tipo, diametro, peso_unitario, resistencia
- **Migración**: 000000000028_motor_calculo_fase2_acero.sql
- **Uso**: Cálculo de cantidad y peso de acero

#### erp_precios_acero
- **Propósito**: Precios históricos de acero por tipo y fecha
- **Campos**: id, tipo_acero, precio, fecha_vigencia
- **Migración**: 000000000028_motor_calculo_fase2_acero.sql
- **Uso**: Proyección de costos de acero

### 3. Factores de Producción (Migraciones 029, 030)

#### erp_parametros_movimiento_tierra
- **Propósito**: Factores de rendimiento para movimiento de tierra
- **Campos**: id, tipo_suelo, profundidad, metodo, rendimiento_teorico
- **Migración**: 000000000029_motor_calculo_fase2_movimiento_tierra.sql
- **Uso**: Cálculo de tiempo y costo de movimiento de tierra

#### erp_parametros_climaticos
- **Propósito**: Factores de ajuste por condiciones climáticas
- **Campos**: id, region, estacion, factor_lluvia, factor_temperatura
- **Migración**: 000000000030_motor_calculo_fase2_climaticos.sql
- **Uso**: Ajuste de rendimientos por clima

### 4. Infraestructura y Pavimentos (Migraciones 032, 033, 034)

#### erp_parametros_pavimentos
- **Propósito**: Especificaciones de pavimentos por tipo
- **Campos**: id, tipo, espesor, materiales, capacidad_carga
- **Migración**: 000000000032_motor_calculo_fase3_pavimentos.sql
- **Uso**: Cálculo de materiales para pavimentos

#### erp_parametros_redes_infraestructura
- **Propósito**: Parámetros para redes de infraestructura
- **Campos**: id, tipo_red, material, diametro, costo_unitario
- **Migración**: 000000000033_motor_calculo_fase3_redes_infraestructura.sql
- **Uso**: Cálculo de costos de redes

#### erp_parametros_muros_contencion
- **Propósito**: Diseño de muros de contención
- **Campos**: id, tipo, altura, material, costo_unitario
- **Migración**: 000000000034_motor_calculo_fase3_muros_contencion.sql
- **Uso**: Cálculo de costos de muros

### 5. Normativa y Escalas (Migraciones 036-043)

#### erp_normativa_departamental / erp_normativas_departamentales
- **Propósito**: Requisitos normativos por departamento
- **Campos**: id, departamento, tipo_norma, requisitos, costo_cumplimiento
- **Migración**: 000000000036_motor_calculo_fase4_normativa.sql
- **Uso**: Cálculo de costos de cumplimiento normativo

#### erp_escalas_produccion
- **Propósito**: Curvas de aprendizaje por tipo de trabajo
- **Campos**: id, tipo_trabajo, escala, factor_mejora
- **Migración**: 000000000037_motor_calculo_fase4_escalas.sql
- **Uso**: Ajuste de rendimientos por curva de aprendizaje

#### erp_estacionalidad
- **Propósito**: Factores estacionales por mes y tipo de trabajo
- **Campos**: id, mes, tipo_trabajo, factor_estacional
- **Migración**: 000000000038_motor_calculo_fase4_estacionalidad.sql
- **Uso**: Ajuste de costos por estacionalidad

### 6. Reglas e Historial (Migraciones 039-040)

#### erp_reglas_factores
- **Propósito**: Reglas de negocio para cálculo de factores
- **Campos**: id, tipo_regla, condicion, factor_multiplicador
- **Migración**: 000000000039_motor_calculo_fase5_reglas_factores.sql
- **Uso**: Aplicación de reglas de cálculo

#### erp_historial_aplicacion_reglas
- **Propósito**: Historial de aplicación de reglas
- **Campos**: id, regla_id, fecha_aplicacion, resultado
- **Migración**: 000000000039_motor_calculo_fase5_reglas_factores.sql
- **Uso**: Auditoría de cálculos

### 7. Cálculos y Snapshots (Migraciones 035, 040)

#### erp_calculos_proyecto
- **Propósito**: Resultados de cálculos por proyecto
- **Campos**: id, proyecto_id, tipo_calculo, resultado, fecha
- **Migración**: 000000000035_motor_calculo_fase5_historial.sql
- **Uso**: Almacenamiento de resultados de cálculos

#### erp_comparaciones_calculos
- **Propósito**: Comparación entre diferentes versiones de cálculo
- **Campos**: id, proyecto_id, version_a, version_b, diferencias
- **Migración**: 000000000040_motor_calculo_fase5_historial.sql
- **Uso**: Análisis de variaciones en cálculos

#### erp_snapshots_estado_calculo
- **Propósito**: Snapshots del estado de cálculo en un momento dado
- **Campos**: id, proyecto_id, fecha, estado_completo
- **Migración**: 000000000040_motor_calculo_fase5_historial.sql
- **Uso**: Recuperación de estados anteriores

### 8. Ajustes Estacionales (Migraciones 041-043)

#### erp_ajustes_estacionales_actividad
- **Propósito**: Ajustes específicos por actividad y estación
- **Campos**: id, actividad, estacion, factor_ajuste
- **Migración**: 000000000043_motor_calculo_fase4_estacionalidad.sql
- **Uso**: Ajuste fino de rendimientos

#### erp_aplicacion_escalas
- **Propósito**: Registro de aplicación de escalas de producción
- **Campos**: id, proyecto_id, escala_aplicada, resultado
- **Migración**: 000000000042_motor_calculo_fase4_escalas.sql
- **Uso**: Auditoría de uso de escalas

#### erp_cumplimiento_normativo
- **Propósito**: Registro de cumplimiento normativo
- **Campos**: id, proyecto_id, normativa, estado, costo
- **Migración**: 000000000041_motor_calculo_fase4_normativa.sql
- **Uso**: Seguimiento de cumplimiento

## Arquitectura del Motor de Cálculo

### Flujo de Cálculo

1. **Entrada**: Datos del proyecto (tipología, ubicación, tamaño)
2. **Referencia**: Consulta tablas de motor de cálculo
3. **Cálculo**: Aplica fórmulas con factores de referencia
4. **Salida**: Resultado almacenado en erp_calculos_proyecto
5. **Auditoría**: Historial en erp_historial_aplicacion_reglas

### Integración con Frontend

Las tablas de motor de cálculo **NO** están integradas en el store frontend porque:
- Son datos de referencia estáticos
- No requieren sincronización bidireccional
- Se consultan directamente desde Supabase vía RPC
- Se actualizan solo vía migraciones de base de datos

### Funciones RPC Recomendadas

```sql
-- Consultar factores por tipología
CREATE OR REPLACE FUNCTION obtener_factores_tipologia(tipologia text)
RETURNS TABLE(factor numeric);

-- Calcular presupuesto base
CREATE OR REPLACE FUNCTION calcular_presupuesto_base(proyecto_id uuid)
RETURNS TABLE(total numeric, desglose jsonb);

-- Aplicar factores climáticos
CREATE OR REPLACE FUNCTION aplicar_factor_climatico(
  base numeric, 
  region text, 
  estacion text
) RETURNS numeric;
```

## Mantenimiento

### Actualización de Datos

Los datos de estas tablas se actualizan mediante:
1. **Migraciones SQL**: Para cambios estructurales
2. **Scripts de seed**: Para carga inicial de datos
3. **RPC functions**: Para actualizaciones programáticas

### Validación

Para validar la integridad de los datos de motor de cálculo:

```sql
-- Verificar que no haya referencias rotas
SELECT COUNT(*) FROM erp_calculos_proyecto 
WHERE tipo_calculo NOT IN (
  SELECT DISTINCT nombre FROM (
    SELECT 'dosificaciones_concreto' as nombre FROM erp_dosificaciones_concreto
    UNION ALL
    SELECT 'parametros_movimiento_tierra' FROM erp_parametros_movimiento_tierra
    -- etc
  ) t
);
```

## Recomendaciones

1. **No eliminar estas tablas**: Son críticas para el motor de cálculo
2. **Documentar cambios**: Cada actualización debe ser migración SQL
3. **Versionar datos**: Usar snapshots para cambios importantes
4. **Validar referencias**: Before deployment, verificar integridad referencial
5. **Backup regular**: Estas tablas contienen datos críticos de referencia

## Migraciones Relacionadas

- 025: Geografía (departamentos, municipios)
- 026: Dosificaciones de concreto
- 027: Subtipologías
- 028: Acero (referencias, precios)
- 029: Movimiento de tierra
- 030: Parámetros climáticos
- 032: Pavimentos
- 033: Redes de infraestructura
- 034: Muros de contención
- 035: Historial de cálculos
- 036: Normativa departamental
- 037: Escalas de producción
- 038: Estacionalidad
- 039: Reglas de factores
- 040: Comparaciones y snapshots
- 041: Normativa (duplicado corregido)
- 042: Escalas (duplicado corregido)
- 043: Estacionalidad (duplicado corregido)
- 044: Fix de errores en motor de cálculo
