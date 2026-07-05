# Motor de Cálculo Avanzado APU - Guía de Usuario

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Visión General](#visión-general)
3. [Motores de Cálculo](#motores-de-cálculo)
4. [Optimización Avanzada](#optimización-avanzada)
5. [Auditoría y Validación](#auditoría-y-validación)
6. [Integración con Módulos](#integración-con-módulos)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Troubleshooting](#troubleshooting)

## 🎯 Introducción

El Motor de Cálculo Avanzado APU es un sistema paramétrico completo diseñado para la construcción en Guatemala. Proporciona cálculos técnicos precisos basados en normativa guatemalteca, factores geográficos y parámetros de producción escalables.

### Características Principales

- **8 Motores Especializados**: Dosificación de concreto, geografía, acero, movimiento de tierra, climáticos, pavimentos, redes de infraestructura, muros de contención
- **Normativa Departamental**: 21 normativas técnicas para 10 departamentos
- **Factores de Escala**: 35 configuraciones por tamaño de proyecto
- **Estacionalidad**: 72 factores climáticos mensuales por departamento
- **Auditoría Completa**: Historial de cálculos con versiones y comparaciones
- **Validación Automática**: Detección de inconsistencias en tiempo real

## 📊 Visión General

### Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                 Capa de Presentación                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ APUAvanzado │ │ Cotizaciones│ │   Dashboard │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Capa de Servicios                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ MotorCalculo │ │ Normativa   │ │ Validación  │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Capa de Datos (Supabase)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Tablas      │ │ RPC Functions│ │  RLS        │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Trabajo Típico

1. **Selección del Motor**: El usuario selecciona el tipo de cálculo (pavimentos, redes, muros)
2. **Configuración Geográfica**: Departamento y municipio para aplicar normativa
3. **Parámetros Técnicos**: Dimensiones, materiales, resistencia, tipo de suelo
4. **Optimización Automática**: Aplicación de escala, estacionalidad y normativa
5. **Validación**: Verificación de consistencia y cumplimiento normativo
6. **Registro**: Guardado en historial con versión y comparaciones

## 🏗️ Motores de Cálculo

### MCA-01: Dosificación de Concreto

Calcula la mezcla óptima de concreto según resistencia requerida, tipo de cemento y agregados disponibles.

**Parámetros de Entrada:**
- Resistencia de diseño (fc)
- Tipo de cemento (I, II, III)
- Tamaño máximo de agregado
- Consistencia (slump)
- Condiciones de exposición

**Salida:**
- Proporción cemento:arena:grava:agua
- Densidad del concreto
- Volumen de materiales por m³
- Costo estimado

**Ejemplo de Uso:**
```typescript
const resultado = await calcularDosificacionConcreto({
  resistencia: 280,
  tipoCemento: 'I',
  tamañoAgregado: 20,
  slump: 75
});
```

### MCA-06: Pavimentos

Calcula espesor, costo total y volumen de base según uso, tipo de pavimento y superficie.

**Tipos de Pavimento:**
- Rígido (concreto)
- Flexible (asfalto)
- Estabilizado (base triturada)
- Adoquín

**Parámetros de Entrada:**
- Superficie (m²)
- Tipo de uso (liviano, medio, pesado)
- Tipo de pavimento
- Carga de diseño

### MCA-07: Redes de Infraestructura

Calcula costo por metro lineal según tipo, diámetro, material y presión de trabajo.

**Tipos de Red:**
- Agua potable
- Alcantarillado sanitario
- Alcantarillado pluvial
- Gas natural

### MCA-08: Muros de Contención

Calcula costo por m² según altura, tipo, sistema de drenaje y tipo de suelo.

**Tipos de Muro:**
- Gravedad (concreto)
- Mampostería reforzada
- Tierra armada
- Gaviones

## 🎛️ Optimización Avanzada

### Normativa Departamental

Sistema que aplica automáticamente la normativa técnica específica de cada departamento de Guatemala.

**Departamentos Soportados:**
- GT-01: Guatemala
- GT-02: El Progreso
- GT-03: Sacatepéquez
- GT-04: Chimaltenango
- GT-05: Petén
- GT-06: Alta Verapaz
- GT-07: Escuintla
- GT-11: Quetzaltenango

**Tipos de Normativa:**
- Estructural (ACI, AISC)
- Urbanística (municipal)
- Ambiental (MARN)
- Sísmica (AGIES)
- Eléctrica (CNE)
- Sanitaria (acueductos)

### Escalas de Producción

Ajusta automáticamente los factores económicos y administrativos según el tamaño del proyecto.

**Rangos de Tamaño:**
- Pequeño: < Q500,000
- Mediano: Q500,000 - Q2,000,000
- Grande: Q2,000,000 - Q5,000,000
- Megaproyecto: > Q5,000,000

**Tipos de Proyecto:**
- Residencial
- Comercial
- Industrial
- Infraestructura
- Gubernamental
- Educativo
- Salud

### Estacionalidad

Ajusta cronogramas y presupuestos según condiciones climáticas y disponibilidad de mano de obra.

**Patrones Climáticos:**
- Temporada seca (Noviembre - Abril): Alta productividad
- Temporada lluviosa (Mayo - Octubre): Baja productividad

**Factores Ajustados:**
- Disponibilidad de mano de obra
- Costo de materiales (escasez estacional)
- Productividad (condiciones climáticas)

## 🔍 Auditoría y Validación

### Historial de Cálculos

Sistema completo de trazabilidad que registra todos los cálculos con versiones y comparaciones.

**Funciones Disponibles:**
- `registrarCalculo`: Guarda un cálculo en el historial
- `obtenerHistorialCalculos`: Consulta el historial por proyecto
- `compararCalculos`: Compara dos versiones de cálculo
- `validarCalculo`: Verifica consistencia técnica

**Tabla: erp_calculos_proyecto**
```sql
- id: UUID
- proyecto_id: UUID
- tipo_calculo: text
- fecha_calculo: timestamptz
- version_calculo: integer
- parametros: jsonb
- resultados: jsonb
- validado: boolean
```

### Validación de Consistencia

Sistema que detecta automáticamente inconsistencias en cálculos.

**Reglas de Validación:**
- Valores físicos positivos (superficie, volumen, costo)
- Proporciones racionales (cemento:agua, arena:grava)
- Consistencia entre cálculos relacionados
- Cumplimiento de rangos de normativa

**Alertas Generadas:**
- ⚠️  Valor fuera de rango permitido
- ⚠️  Proporción inusual
- ⚠️  Inconsistencia con cálculo anterior
- ✅  Validación exitosa

## 🔗 Integración con Módulos

### Cotizaciones

El motor de cálculo se integra directamente con el módulo de cotizaciones para generar presupuestos precisos.

**Flujo de Integración:**
1. Crear cotización tipo "construcción"
2. Click en "Usar Motor de Cálculo"
3. Seleccionar motor (pavimentos, redes, muros)
4. Ejecutar cálculo con parámetros
5. Agregar resultado a renglones de cotización
6. Ajustar factores de escala y estacionalidad
7. Generar PDF con cálculos detallados

### Presupuestos

Los resultados del motor se pueden agregar directamente a presupuestos existentes.

**Beneficios:**
- Precisión técnica basada en ingeniería
- Cumplimiento normativo automático
- Comparación con costos históricos
- Validación de consistencia integrada

## ✅ Mejores Prácticas

### Uso Recomendado del Motor

1. **Siempre configurar parámetros geográficos** antes de calcular
2. **Validar resultados** antes de aprobar presupuestos
3. **Comparar con cálculos anteriores** para detectar errores
4. **Usar el wizard guiado** para cálculos complejos
5. **Revisar recomendaciones de estacionalidad** antes de planificar

### Calibración de Factores

El sistema incluye un script de migración de datos históricos para calibrar factores.

**Comando:**
```bash
npx tsx src/erp/scripts/migrar-datos-historicos-calibracion.ts
```

**Resultado:**
- Análisis de rendimiento histórico
- Variación de costos promedio
- Recomendaciones de ajuste de factores
- Factor de calibración calculado

### Gestión del Historial

**Limpieza del Historial:**
- Mantener mínimo 10 versiones por proyecto
- Archivar cálculos > 6 meses
- Mantener versión más reciente siempre accesible

**Comparación de Versiones:**
- Comparar siempre versión actual con versión anterior
- Documentar cambios significativos
- Revisar variaciones > 5%

## 🔧 Troubleshooting

### Problemas Comunes

**Error: "Normativa no disponible para el departamento"**
- Solución: Verificar que el departamento sea uno de los soportados (GT-01 a GT-22)
- Solución: Usar departamento más cercano si no existe normativa específica

**Error: "Factor de escala fuera de rango"**
- Solución: Verificar que el presupuesto esté en el rango esperado
- Solución: Ajustar presupuesto o usar escala manual

**Error: "Validación de consistencia falló"**
- Solución: Revisar valores de entrada
- Solución: Verificar proporciones de materiales
- Solución: Comparar con cálculos anteriores

### Diagnóstico

**Script de Diagnóstico Completo:**
```bash
npx tsx src/erp/scripts/diagnostico-completo-supabase.ts
```

**Verificación de Migraciones:**
```bash
npx tsx src/erp/scripts/validar-migraciones.ts
```

### Soporte

Para asistencia adicional:
1. Revisar el Dashboard de Análisis de Costos
2. Consultar el historial de cálculos
3. Usar el wizard de cálculo guiado
4. Contactar al equipo técnico

## 📚 Recursos Adicionales

### Scripts de Utilidad

- `migrar-datos-historicos-calibracion.ts`: Calibración de factores
- `diagnostico-completo-supabase.ts`: Diagnóstico del sistema
- `validar-migraciones.ts`: Verificación de migraciones SQL
- `verificar-fase3-supabase.ts`: Verificación de motores Fase 3

### Documentación Técnica

- Diagrama de arquitectura: Ver DIAGNOSTICO_MOTOR_CALCULO_APU.md
- Especificaciones de motores: Ver documentación SQL en supabase/migrations/
- API de servicios: Ver src/erp/services/

### Capacitación

**Wizard de Cálculo Guiado:**
Disponible en `src/erp/components/CalculoGuiadoWizard.tsx`

**Dashboard de Análisis:**
Disponible en `src/erp/screens/AnalisisCostosDashboard.tsx`

**Videos Tutoriales:**
(Videos pendientes de producción)

---

**Versión:** 1.0  
**Fecha:** 20 de junio de 2026  
**Estado:** Para revisión y aprobación  
**Autor:** Ingeniero Civil Especialista en Optimización de Interfaces de Productividad para la Construcción