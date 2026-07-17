# CONSTRUSMART ERP - Análisis Funcional Completo

**Fecha:** 2025  
**Versión del Sistema:** v1.0  
**Stack:** React 18.3 + TypeScript 5.5 + Vite 5.4 + Supabase

---

## 1. Servicios de Negocio y Motores de Cálculo

### 1.1 Motor de Cálculo (`motorCalculo.ts`)

**Archivo:** `src/erp/services/motorCalculo.ts`

**Responsabilidades:**
- Dosificación de concreto con factores de ajuste
- Geografía y localización (departamentos, municipios)
- Parámetros climáticos
- Movimiento de tierra
- Subtipologías de proyectos
- Cálculo de pavimentos
- Cálculo de redes de infraestructura
- Cálculo de muros de contención
- Registro de cálculos y snapshots

#### Servicio de Dosificación de Concreto

**Función: `calcularDosificacion`**

```typescript
static async calcularDosificacion(
  dosificacion: DosificacionConcreto,
  volumen: number,
  departamento?: string,
  altitud?: number
): Promise<ResultadoDosificacion>
```

**Flujo de cálculo:**

1. **Obtener dosificación base** desde Supabase
   ```typescript
   const { data: dosificacionBase } = await supabase
     .from('erp_dosificaciones_concreto')
     .select('*')
     .eq('resistencia', dosificacion.resistencia)
     .eq('tipo', dosificacion.tipo)
     .eq('tamaño_agregado', dosificacion.tamañoAgregado)
     .eq('aditivos', dosificacion.aditivos)
     .eq('curado', dosificacion.curado)
     .eq('activo', true)
     .single();
   ```

2. **Calcular factores de ajuste**
   ```typescript
   const factorAltitud = this.calcularFactorAltitud(altitud || 1500);
   const factorTemperatura = await this.calcularFactorTemperatura(departamento);
   const factorCurado = this.calcularFactorCurado(dosificacion.curado);
   const factorAjuste = factorAltitud * factorTemperatura * factorCurado;
   ```

3. **Factores por altitud**
   ```typescript
   private static calcularFactorAltitud(altitud: number): number {
     if (altitud > 2000) return 1.05; // Alta: más cemento
     if (altitud > 1000) return 1.0;  // Media: referencia
     return 0.98;                      // Baja: menos cemento por calor
   }
   ```

4. **Factores por temperatura (departamento)**
   ```typescript
   private static async calcularFactorTemperatura(departamento?: string): Promise<number> {
     const factoresTemperatura: Record<string, number> = {
       'GT-01': 1.0,  // Guatemala
       'GT-02': 0.95, // Escuintla (calor)
       'GT-03': 0.95, // Izabal (calor)
       'GT-08': 1.4,  // Quetzaltenango (frío)
       'GT-12': 1.5,  // Huehuetenango (muy frío)
       'GT-15': 1.2,  // Alta Verapaz (húmedo)
     };
     return factoresTemperatura[departamento] || 1.0;
   }
   ```

5. **Factores por tipo de curado**
   ```typescript
   private static calcularFactorCurado(curado: string): number {
     if (curado === 'acelerado') return 1.2;
     if (curado === 'prolongado') return 1.3;
     return 1.0;
   }
   ```

6. **Calcular cantidades ajustadas**
   ```typescript
   const cementoSacos = dosificacionBase.cemento_sacos_m3 * volumen * factorAltitud * factorCurado;
   const arenaM3 = dosificacionBase.arena_m3_m3 * volumen * factorAltitud;
   const piedraM3 = dosificacionBase.piedra_m3_m3 * volumen * factorAltitud;
   const aguaLt = dosificacionBase.agua_lt_m3 * volumen * factorTemperatura;
   ```

7. **Calcular desglose de costos**
   ```typescript
   const PRECIOS_REFERENCIALES = {
     cementoSaco: 92,  // Q/saco
     arenaM3: 145,     // Q/m³
     piedraM3: 195,    // Q/m³
   };
   
   const costoCemento = cementoSacos * PRECIOS_REFERENCIALES.cementoSaco;
   const costoArena = arenaM3 * PRECIOS_REFERENCIALES.arenaM3;
   const costoPiedra = piedraM3 * PRECIOS_REFERENCIALES.piedraM3;
   const costoTotal = costoCemento + costoArena + costoPiedra;
   ```

**Resultado:**
```typescript
{
  cementoSacos: 65,
  arenaM3: 4.5,
  piedraM3: 8.5,
  aguaLt: 1800,
  factorAjuste: 1.0,
  costoTotal: 8289,
  desgloseCostos: {
    cemento: 5980,
    arena: 652.50,
    piedra: 1657.50
  }
}
```

#### Servicio de Geografía

**Funciones disponibles:**

```typescript
// Obtener todos los departamentos
static obtenerDepartamentos(): DepartamentoGT[]

// Obtener municipios por departamento
static obtenerMunicipiosPorDepartamento(departamentoCodigo: string): MunicipioGT[]

// Obtener municipio por código
static obtenerMunicipio(codigo: string): MunicipioGT | null

// Obtener departamento por código
static obtenerDepartamento(codigo: string): DepartamentoGT | null

// Obtener factor de costo para municipio
static obtenerFactorCostoMunicipio(codigoMunicipio: string): number

// Obtener factor de rendimiento para municipio
static obtenerFactorRendimientoMunicipio(codigoMunicipio: string): number
```

**Lógica de factor de costo:**
```typescript
static obtenerFactorCostoMunicipio(codigoMunicipio: string): number {
  const municipio = this.obtenerMunicipio(codigoMunicipio);
  return municipio?.altitudMsnm 
    ? 1.0 + (municipio.altitudMsnm / 1000) * 0.1 
    : 1.0;
}
```

**Lógica de factor de rendimiento:**
```typescript
static obtenerFactorRendimientoMunicipio(codigoMunicipio: string): number {
  const municipio = this.obtenerMunicipio(codigoMunicipio);
  return municipio?.altitudMsnm 
    ? 1.0 - (municipio.altitudMsnm / 2000) * 0.15 
    : 1.0;
}
```

#### Servicio de Parámetros Climáticos

**Funciones RPC:**

```typescript
// Obtener parámetros climáticos extendidos
static async obtenerParametrosClimaticos(departamentoCodigo: string): Promise<ParametrosClimaticosExtendido | null>

// Obtener factor climático (con mes opcional)
static async obtenerFactorClimatico(departamentoCodigo: string, mes?: string): Promise<FactorClimatico>

// Obtener factor temperatura por departamento
static async obtenerFactorTemperaturaDepartamento(departamentoCodigo: string): Promise<number>

// Obtener factor humedad por departamento
static async obtenerFactorHumedadDepartamento(departamentoCodigo: string): Promise<number>
```

**Resultado de parámetros climáticos:**
```typescript
{
  departamentoCodigo: 'GT-01',
  zonaClimatica: 'subtropical',
  altitudMinMsnm: 1200,
  altitudMaxMsnm: 1800,
  temperaturaMinC: 18,
  temperaturaMaxC: 28,
  humedadRelativaPromedioPct: 75,
  precipitacionPromedioMmMes: 120,
  vientoPromedioKmh: 15,
  factorCuradoConcreto: 1.0,
  factorRendimientoMO: 0.95,
  factorProteccionEncofrados: 1.1,
  estacionCritica: 'lluviosa',
  mesesCriticos: [5, 6, 7, 8, 9, 10]
}
```

#### Servicio de Movimiento de Tierra

**Función: `calcularMovimientoTierra`**

```typescript
static async calcularMovimientoTierra(mt: MovimientoTierra): Promise<ResultadoMovimientoTierra>
```

**Parámetros de entrada:**
```typescript
{
  tipo: 'excavacion' | 'relleno' | 'corte' | 'nivelacion',
  suelo: 'tierra_negra' | 'arcilla' | 'roca_blanda' | 'roca_dura',
  profundidad: 2.5,
  acceso: 'facil' | 'dificil' | 'muy_dificil',
  drenaje: 'bueno' | 'regular' | 'malo',
  volumen: 500
}
```

**Resultado:**
```typescript
{
  costoUnitario: 45.50,
  costoTotal: 22750,
  tiempoEstimadoDias: 8,
  equipoRequerido: 'Excavadora CAT 320 + Camión volquete',
  factorAjusteTotal: 1.15
}
```

#### Servicio de Pavimentos

**Función: `calcularPavimento`**

```typescript
static async calcularPavimento(pavimento: Pavimento): Promise<ResultadoPavimento>
```

**Parámetros de entrada:**
```typescript
{
  uso: 'peatonal' | 'vehicular' | 'industrial',
  tipo: 'concreto' | 'asfalto' | 'adoquinado',
  tipoBase: 'cemento' | 'grava' | 'suelo_cemento',
  tipoSello: 'ninguno' | 'curado' | 'impermeabilizante',
  areaM2: 1000
}
```

**Resultado:**
```typescript
{
  espesorCm: 15,
  costoSuperficieM2: 85.50,
  costoBaseM3: 120.00,
  costoSelloM2: 12.00,
  costoTotalM2: 97.50,
  costoTotal: 97500,
  volumenBaseM3: 150,
  referenciaNorma: 'COGUANOR NTG 41011'
}
```

#### Servicio de Redes de Infraestructura

**Función: `calcularRedInfraestructura`**

```typescript
static async calcularRedInfraestructura(red: RedInfraestructura): Promise<ResultadoRedInfraestructura>
```

**Parámetros de entrada:**
```typescript
{
  tipo: 'agua_potable' | 'alcantarillado' | 'electricidad' | 'gas',
  diametroPulgadas: 4,
  material: 'PVC' | 'HDPE' | 'Hierro',
  presion: 150,
  longitudMl: 500
}
```

**Resultado:**
```typescript
{
  costoUnitarioMl: 125.00,
  costoTotal: 62500,
  factorAjusteMaterial: 1.1,
  referenciaNorma: 'COPANOR 6204'
}
```

#### Servicio de Muros de Contención

**Función: `calcularMuroContencion`**

```typescript
static async calcularMuroContencion(muro: MuroContencion): Promise<ResultadoMuroContencion>
```

**Parámetros de entrada:**
```typescript
{
  alturaM: 3.5,
  tipo: 'gravedad' | 'cantilever' | 'anclado',
  tipoCimentacion: 'zapata' | 'losa' | 'pilotes',
  tipoSuelo: 'roca' | 'arcilla' | 'arena',
  tipoDrenaje: 'filtrante' | 'impermeable',
  longitudM: 50
}
```

**Resultado:**
```typescript
{
  costoUnitarioM2: 450.00,
  costoTotal: 78750,
  factorAjusteTotal: 1.2,
  volumenConcretoM3: 87.5,
  referenciaNorma: 'ACI 318-19'
}
```

#### Registro de Cálculos

**Función: `registrarCalculo`**

```typescript
static async registrarCalculo(
  proyectoId: string,
  tipoCalcululo: string,
  parametrosEntrada: Record<string, any>,
  resultadoCalculado: Record<string, any>,
  opciones?: {
    renglonId?: string;
    costoTotal?: number;
    costoUnitario?: number;
    usuarioId?: string;
    observaciones?: string;
  }
): Promise<string>
```

**Snapshot de estado:**

```typescript
static async crearSnapshotEstado(
  calculoId: string,
  tipoSnapshot: 'antes' | 'despues' | 'intermedio' | 'final',
  estadoCompleto: Record<string, any>,
  descripcion?: string
)
```

---

### 1.2 Motor de Reglas de Factores (`reglasFactores.ts`)

**Archivo:** `src/erp/services/reglasFactores.ts`

**Responsabilidades:**
- Gestión de reglas de factores dinámicos
- Evaluación de condiciones
- Aplicación de factores a valores
- Historial de aplicación de reglas

#### Interfaz de Regla Factor

```typescript
export interface ReglaFactor {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo_factor: 'zona' | 'tipologia' | 'escalas' | 'estacional' | 'climatico' | 'normativa' | 'sobrecosto';
  prioridad: number;
  condicion: Record<string, unknown>;
  factor_aplicacion: number;
  operador: 'multiplicar' | 'sumar' | 'restar' | 'porcentaje';
  ambito: 'global' | 'departamento' | 'municipio' | 'proyecto' | 'renglon';
  departamento_id?: string;
  municipio_id?: string;
  tipologia?: string;
  activo: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  created_at: string;
  updated_at: string;
}
```

#### Obtener Reglas Activas

```typescript
async obtenerReglasActivas(
  tipoFactor?: ReglaFactor['tipo_factor'],
  ambito?: ReglaFactor['ambito']
): Promise<ReglaFactor[]>
```

**Ejemplo:**
```typescript
const reglas = await motorReglasFactores.obtenerReglasActivas('zona', 'departamento');
// → Retorna todas las reglas activas de tipo 'zona' con ámbito 'departamento'
```

#### Evaluar Condición

```typescript
async evaluarCondicion(
  condicion: Record<string, unknown>,
  contexto: ContextoAplicacion
): Promise<boolean>
```

**Operadores soportados:**
- `igual` - Igualdad exacta
- `mayor` - Mayor que
- `menor` - Menor que
- `contiene` - Contiene substring
- `en` - Está en lista separada por comas

**Ejemplo de condición:**
```typescript
{
  departamento: { operador: 'igual', valor: 'GT-01' },
  altitud: { operador: 'mayor', valor: 1500 },
  tipologia: { operador: 'en', valor: 'residencial,comercial' }
}
```

#### Aplicar Reglas

```typescript
async aplicarReglas(
  valor: number,
  tipoFactor: ReglaFactor['tipo_factor'],
  contexto: ContextoAplicacion = {}
): Promise<ResultadoAplicacionReglas>
```

**Proceso:**

1. Obtener reglas activas del tipo especificado
2. Iterar reglas ordenadas por prioridad (descendente)
3. Evaluar condición de cada regla contra el contexto
4. Si condición se cumple, aplicar factor según operador
5. Registrar aplicación en historial

**Operadores de aplicación:**
```typescript
switch (regla.operador) {
  case 'multiplicar':
    valorActual = valorActual * regla.factor_aplicacion;
    factorAcumulado *= regla.factor_aplicacion;
    break;
  case 'sumar':
    valorActual = valorActual + regla.factor_aplicacion;
    break;
  case 'restar':
    valorActual = valorActual - regla.factor_aplicacion;
    break;
  case 'porcentaje':
    valorActual = valorActual * (1 + regla.factor_aplicacion / 100);
    factorAcumulado *= (1 + regla.factor_aplicacion / 100);
    break;
}
```

**Resultado:**
```typescript
{
  valor_final: 1150,
  reglas_aplicadas: [
    {
      regla_id: 'regla-123',
      nombre: 'Factor Altitud GT-01',
      factor: 1.15,
      operador: 'multiplicar',
      prioridad: 10
    }
  ],
  factor_total: 1.15
}
```

#### Aplicar Reglas via RPC

```typescript
async aplicarReglasViaRPC(
  valor: number,
  tipoFactor: ReglaFactor['tipo_factor'],
  contexto: ContextoAplicacion = {}
): Promise<ResultadoAplicacionReglas>
```

**Diferencia con `aplicarReglas`:**
- Ejecuta lógica en Postgres vía RPC
- Más eficiente para múltiples reglas
- Utiliza funciones nativas de SQL

#### CRUD de Reglas

```typescript
async crearRegla(regla: Partial<ReglaFactor>): Promise<ReglaFactor>
async actualizarRegla(id: string, regla: Partial<ReglaFactor>): Promise<ReglaFactor>
async eliminarRegla(id: string): Promise<void>
async obtenerReglaPorId(id: string): Promise<ReglaFactor | null>
```

---

### 1.3 Normativa Departamental (`normativaDepartamental.ts`)

**Archivo:** `src/erp/services/normativaDepartamental.ts`

**Responsabilidades:**
- Gestión de normativas por departamento
- Validación de cumplimiento normativo
- Registro de verificaciones

#### Interfaz de Normativa

```typescript
export interface NormativaDepartamental {
  id: string;
  departamento_codigo: string;
  tipo_norma: string;
  codigo_norma: string;
  nombre_norma: string;
  descripcion: string;
  ano_ultima_revision: number;
  organismo_emisor: string;
  requisitos_especificos: Record<string, unknown>;
  aplicacion: string;
  activo: boolean;
}
```

#### Obtener Normativas

```typescript
async obtenerNormativasDepartamento(
  departamentoCodigo: string,
  tipoNorma?: string
): Promise<NormativaDepartamental[]>

async obtenerTodasNormativas(): Promise<NormativaDepartamental[]>

async obtenerNormativaPorId(id: string): Promise<NormativaDepartamental | null>

async obtenerNormativasPorTipo(tipoNorma: string): Promise<NormativaDepartamental[]>
```

#### Validar Cumplimiento Normativo

```typescript
async validarCumplimientoNormativo(
  proyectoId: string,
  departamentoCodigo: string,
  tipoCalculo: string,
  parametrosCalculo: Record<string, any>
): Promise<ResultadoValidacionNormativa[]>
```

**Resultado:**
```typescript
[{
  norma_id: 'norma-123',
  codigo_norma: 'COGUANOR NTG 41011',
  estado_cumplimiento: 'cumple',
  alertas: [
    {
      tipo: 'info',
      mensaje: 'Normativa cumplida correctamente',
      codigo_norma: 'COGUANOR NTG 41011',
      valor_actual: 15,
      valor_requerido: 15
    }
  ]
}]
```

#### Registrar Cumplimiento

```typescript
async registrarCumplimiento(
  proyectoId: string,
  normaId: string,
  estado: CumplimientoNormativo['estado_cumplimiento'],
  opciones?: {
    fechaVerificacion?: string;
    responsableVerificacion?: string;
    evidencias?: Record<string, any>;
    observaciones?: string;
  }
): Promise<CumplimientoNormativo>
```

#### CRUD de Normativas

```typescript
async crearNormativa(normativa: Partial<NormativaDepartamental>): Promise<NormativaDepartamental>
async actualizarNormativa(id: string, normativa: Partial<NormativaDepartamental>): Promise<NormativaDepartamental>
async eliminarNormativa(id: string): Promise<void>
```

---

### 1.4 Escalas de Producción (`escalasProduccion.ts`)

**Archivo:** `src/erp/services/escalasProduccion.ts`

**Responsabilidades:**
- Gestión de escalas de producción por tamaño de proyecto
- Aplicación de factores de economía, administración, imprevistos
- Cálculo de ahorro por escala

#### Interfaz de Escala

```typescript
export interface EscalaProduccion {
  id: string;
  tipo_proyecto: string;
  rango_tamano: 'pequeno' | 'mediano' | 'grande' | 'muy_grande' | 'mega';
  tamano_minimo: number;
  tamano_maximo: number;
  factor_economia: number;
  factor_administracion: number;
  factor_imprevistos: number;
  factor_logistica: number;
  factor_financiero: number;
  factor_total: number;
  descripcion: string;
  activo: boolean;
}
```

#### Obtener Escalas

```typescript
async obtenerEscalasProduccion(
  tipoProyecto?: string,
  subtipoProyecto?: string
): Promise<EscalaProduccion[]>

async determinarEscalaProyecto(
  tipoProyecto: string,
  tamanoProyecto: number,
  subtipoProyecto?: string
): Promise<EscalaProduccion | null>

async obtenerEscalaPorId(id: string): Promise<EscalaProduccion | null>

async obtenerEscalasPorRango(rango: string): Promise<EscalaProduccion[]>
```

#### Aplicar Factores de Escala

```typescript
async aplicarFactoresEscala(
  costoBase: number,
  tipoProyecto: string,
  tamanoProyecto: number,
  opciones?: {
    subtipoProyecto?: string;
    presupuestoEstimado?: number;
  }
): Promise<ResultadoAplicacionEscala>
```

**Resultado:**
```typescript
{
  costo_ajustado: 85000,
  factor_economia: 0.95,
  factor_administracion: 0.90,
  factor_imprevistos: 0.85,
  factor_logistica: 0.92,
  factor_financiero: 0.88,
  factor_total: 0.85,
  ahorro_estimado: 15000,
  rango_tamano: 'grande'
}
```

#### Calcular Ahorro de Escala

```typescript
async calcularAhorroEscala(
  costoBase: number,
  tipoProyecto: string,
  tamanoProyecto: number,
  subtipoProyecto?: string
): Promise<{
  costoBase: number;
  costoAjustado: number;
  ahorro: number;
  porcentajeAhorro: number;
  rango: string;
}>
```

**Resultado:**
```typescript
{
  costoBase: 100000,
  costoAjustado: 85000,
  ahorro: 15000,
  porcentajeAhorro: 15,
  rango: 'grande'
}
```

#### CRUD de Escalas

```typescript
async crearEscala(escala: Partial<EscalaProduccion>): Promise<EscalaProduccion>
async actualizarEscala(id: string, escala: Partial<EscalaProduccion>): Promise<EscalaProduccion>
async eliminarEscala(id: string): Promise<void>
```

---

### 1.5 Estacionalidad (`estacionalidad.ts`)

**Archivo:** `src/erp/services/estacionalidad.ts`

**Responsabilidades:**
- Gestión de factores estacionales por departamento y mes
- Aplicación de ajustes estacionales a costos
- Análisis de mejor mes para actividades

#### Interfaz de Estacionalidad

```typescript
export interface Estacionalidad {
  id: string;
  departamento_codigo: string;
  mes: number;
  temporada: 'seca' | 'lluviosa' | 'transicion_seca' | 'transicion_lluviosa';
  factor_disponibilidad: number;
  factor_costo: number;
  factor_productividad: number;
  factor_especifico: number;
  condiciones_especiales: string;
  restricciones_especiales: string[];
  riesgos_estacionales: string[];
  activo: boolean;
}
```

#### Obtener Factores Estacionales

```typescript
async obtenerFactoresEstacionales(
  departamentoCodigo: string,
  mes: number,
  tipoActividad?: string
): Promise<FactoresEstacionales | null>
```

**Resultado:**
```typescript
{
  departamentoCodigo: 'GT-01',
  mes: 6,
  temporada: 'lluviosa',
  factor_disponibilidad: 0.85,
  factor_costo: 1.15,
  factor_productividad: 0.90,
  factor_especifico: 1.05,
  condiciones_climaticas: 'Alta precipitación, humedad elevada',
  restricciones_especiales: ['evitar curado al aire libre'],
  riesgos_estacionales: ['dilución de concreto', 'retrasos por lluvia']
}
```

#### Aplicar Factores Estacionales

```typescript
async aplicarFactoresEstacionales(
  costoBase: number,
  departamentoCodigo: string,
  mes: number,
  tipoActividad?: string
): Promise<ResultadoAplicacionEstacional>
```

**Resultado:**
```typescript
{
  costo_ajustado: 11250,
  factor_disponibilidad: 0.85,
  factor_costo: 1.15,
  factor_productividad: 0.90,
  factor_especifico: 1.05,
  factor_total: 1.125,
  diferencia_costo: 1250,
  porcentaje_ajuste: 12.5,
  temporada: 'lluviosa',
  condiciones_climaticas: 'Alta precipitación'
}
```

#### Calcular Impacto Estacional

```typescript
async calcularImpactoEstacional(
  costoBase: number,
  departamentoCodigo: string,
  mesInicio: number,
  mesFin: number,
  tipoActividad?: string
): Promise<{
  costoTotal: number;
  costoAjustado: number;
  impactoTotal: number;
  porcentajeImpacto: number;
  desgloseMes: Array<{ mes: number; costo: number; factor: number }>
}>
```

#### Obtener Mejor Mes para Actividad

```typescript
async obtenerMejorMesParaActividad(
  departamentoCodigo: string,
  tipoActividad: string,
  costoBase: number
): Promise<{
  mejorMes: number;
  peorMes: number;
  costoMejor: number;
  costoPeor: number;
  ahorroMejor: number
}>
```

**Resultado:**
```typescript
{
  mejorMes: 2,    // Febrero (época seca)
  peorMes: 9,     // Septiembre (época lluviosa)
  costoMejor: 9500,
  costoPeor: 11500,
  ahorroMejor: 2000
}
```

#### CRUD de Estacionalidad

```typescript
async crearEstacionalidad(estacionalidad: Partial<Estacionalidad>): Promise<Estacionalidad>
async actualizarEstacionalidad(id: string, estacionalidad: Partial<Estacionalidad>): Promise<Estacionalidad>
async eliminarEstacionalidad(id: string): Promise<void>
```

---

### 1.6 Validación de Cálculos (`validacionCalculos.ts`)

**Archivo:** `src/erp/services/validacionCalculos.ts`

**Responsabilidades:**
- Validación de consistencia de cálculos
- Validaciones específicas por tipo de cálculo
- Validaciones cruzadas entre motores
- Generación de alertas y recomendaciones

#### Validar Consistencia de Cálculo

```typescript
async validarConsistenciaCalculo(calculoId: string): Promise<ResultadoValidacion>
```

**Proceso:**

1. Obtener datos del cálculo
2. Ejecutar validaciones específicas según tipo
3. Ejecutar validaciones cruzadas
4. Calcular score de consistencia
5. Generar recomendaciones
6. Guardar alertas en el cálculo

**Resultado:**
```typescript
{
  valido: true,
  alertas: [
    {
      id: 'val-123',
      tipo: 'media',
      categoria: 'tecnica',
      mensaje: 'Proporción de arena fuera de rango',
      descripcion: 'Arena 0.60 m³/m³ fuera de rango típico (0.35-0.55 m³/m³)',
      origen: 'validacion_dosificacion',
      sugerencia_correccion: 'Ajustar proporción de arena a rango típico',
      contexto: { arena: 0.60 },
      fecha_deteccion: '2025-01-15T10:30:00Z',
      estado: 'pendiente'
    }
  ],
  score_consistencia: 92,
  recomendaciones: [
    'Cálculo validado exitosamente sin inconsistencias críticas',
    'Revisar proporción de arena para optimizar'
  ]
}
```

#### Validación de Dosificación de Concreto

```typescript
private async validarDosificacionConcreto(
  parametros: Record<string, unknown>,
  resultado: Record<string, unknown>
): Promise<AlertaInconsistencia[]>
```

**Validaciones:**

1. **Resistencia vs tipo de uso**
   - Cimentación: debe ser 2500-3000 psi
   - Estructura: debe ser 4000-4500 psi

2. **Proporciones cemento:arena:piedra**
   - Cemento: 5-9 sacos/m³
   - Arena: 0.35-0.55 m³/m³
   - Piedra: 0.75-1.10 m³/m³

#### Validación de Desglose de Acero

```typescript
private async validarDesgloseAcero(
  parametros: Record<string, unknown>,
  resultado: Record<string, unknown>
): Promise<AlertaInconsistencia[]>
```

**Validaciones:**

1. **Grado según elemento**
   - Columnas: debe ser grado 60

2. **Cantidad total de acero**
   - Rango típico: 50-300 kg/m³

#### Validación de Movimiento de Tierra

```typescript
private async validarMovimientoTierra(
  parametros: Record<string, unknown>,
  resultado: Record<string, unknown>
): Promise<AlertaInconsistencia[]>
```

**Validaciones:**

1. **Tipo de suelo vs método**
   - Roca dura requiere excavación especializada

2. **Costo vs tipo de suelo**
   - Relleno no debe exceder Q 100/m³

#### Validaciones Cruzadas

```typescript
private async validacionesCruzadas(
  calculo: Record<string, unknown>
): Promise<AlertaInconsistencia[]>
```

**Validaciones:**

1. **Costo total vs suma de componentes**
   - Diferencia < 5% es aceptable

2. **Variación vs cálculo anterior**
   - Variación > 30% genera alerta

#### Calcular Score de Consistencia

```typescript
private calcularScoreConsistencia(alertas: AlertaInconsistencia[]): number
```

**Penalizaciones:**
- Crítica: -25 puntos
- Alta: -15 puntos
- Media: -8 puntos
- Baja: -3 puntos

---

### 1.7 Analytics de Rentabilidad (`profitabilityAnalytics.ts`)

**Archivo:** `src/erp/services/profitabilityAnalytics.ts`

**Responsabilidades:**
- Cálculo de rentabilidad por proyecto
- Cálculo de rentabilidad por cliente
- Proyecciones de rentabilidad
- Análisis de eficiencia de recursos
- Optimización de precios

#### Calcular Rentabilidad de Proyecto

```typescript
export function calculateProjectProfitability(
  proyecto: Proyecto,
  movimientos: Movimiento[],
  empleados: Empleado[],
  materiales: Material[],
  ordenes: OrdenCompra[]
): ProjectProfitability
```

**Métricas calculadas:**

```typescript
{
  costoReal: 85000,
  ingresoReal: 100000,
  utilidadBruta: 15000,
  margenBruto: 15,
  variacionPresupuesto: -15,
  estadoRentabilidad: 'bueno',
  eficienciaLabor: 92,
  desperdicioMateriales: 8,
  utilizacionEquipo: 88,
  scoreEficiencia: 91
}
```

**Determinación de estado:**
```typescript
function determineProfitabilityStatus(margen: number, variacion: number): string {
  if (margen >= 20 && variacion <= 5) return 'excelente';
  if (margen >= 15 && variacion <= 10) return 'bueno';
  if (margen >= 10 && variacion <= 15) return 'aceptable';
  if (margen >= 5 && variacion <= 20) return 'riesgoso';
  return 'critico';
}
```

#### Calcular Rentabilidad de Cliente

```typescript
export function calculateClientProfitability(
  cliente: string,
  clienteNit: string,
  proyectos: Proyecto[],
  movimientos: Movimiento[]
): ClientProfitability
```

**Métricas calculadas:**

```typescript
{
  proyectosCount: 5,
  valorTotalContratos: 500000,
  costoTotalReal: 425000,
  utilidadTotal: 75000,
  margenPromedio: 15,
  proyectoMasRentable: 'Proyecto A',
  proyectoMenosRentable: 'Proyecto C',
  valorVidaCliente: 90000,
  probabilidadRetencion: 85,
  segmento: 'premium'
}
```

#### Generar Proyección de Rentabilidad

```typescript
export function generateProfitabilityForecast(
  params: ForecastParameters,
  historicalData: ProjectProfitability[],
  currentProyecto: Proyecto
): ProfitabilityForecast
```

**Resultado:**
```typescript
{
  valorActual: 15000,
  valorProyectado: 16500,
  confianza: 85,
  factoresRiesgo: ['Tendencia estable', 'Proyecto en ejecución'],
  factoresOportunidad: ['Tendencia positiva en rentabilidad'],
  escenarioOptimista: 19800,
  escenarioBase: 16500,
  escenarioPesimista: 13200
}
```

#### Calcular Eficiencia de Recursos

```typescript
export function calculateResourceEfficiency(
  proyectoId: string,
  tipoRecurso: 'mano_obra' | 'materiales' | 'equipo' | 'subcontratos',
  movimientos: Movimiento[],
  presupuestoTotal: number
): ResourceEfficiency
```

**Ratios objetivo:**
- Mano de obra: 35%
- Materiales: 45%
- Equipo: 10%
- Subcontratos: 10%

#### Analizar Tendencias de Rentabilidad

```typescript
export function analyzeProfitabilityTrends(
  proyectos: Proyecto[],
  profitabilityData: ProjectProfitability[],
  tipoAnalisis: 'rentabilidad_global' | 'por_tipologia' | 'por_cliente' | 'por_temporada'
): ProfitabilityTrend
```

#### Optimizar Precios

```typescript
export function optimizePricing(
  tipologia: 'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica',
  subtipo: string | undefined,
  historicalData: ProjectProfitability[],
  proyectos: Proyecto[]
): PricingOptimization
```

**Factores considerados:**
- Margen histórico promedio
- Factor de riesgo por tipología
- Factor de complejidad
- Ajuste estacional
- Ajuste de demanda

---

### 1.8 Detección de Conflictos (`conflictDetection.ts`)

**Archivo:** `src/erp/services/conflictDetection.ts`

**Responsabilidades:**
- Detección de conflictos de empleados
- Detección de conflictos de materiales
- Detección de conflictos de activos
- Detección de conflictos de timeline
- Cálculo de asignación de recursos

#### Detectar Conflictos de Empleados

```typescript
detectEmployeeConflicts(
  empleados: Empleado[] | null | undefined,
  proyectos: Proyecto[]
): ResourceConflict[]
```

**Lógica:**

1. Filtrar empleados activos con >1 proyecto
2. Buscar proyectos superpuestos en tiempo
3. Calcular severidad según:
   - Número de proyectos superpuestos
   - Impacto de costo (salario diario * 30)
   - Impacto de plazo (proyectos * 3 días)

**Resultado:**
```typescript
[{
  id: 'conf-123',
  tipo: 'empleado',
  severidad: 'alto',
  estado: 'detectado',
  titulo: 'Empleado asignado a múltiples proyectos simultáneamente',
  descripcion: 'Juan Pérez está asignado a 3 proyectos con fechas superpuestas',
  recursoId: 'emp-456',
  recursoNombre: 'Juan Pérez',
  proyectos: [
    { proyectoId: 'proj-1', porcentajeUso: 33, prioridad: 8 },
    { proyectoId: 'proj-2', porcentajeUso: 33, prioridad: 6 },
    { proyectoId: 'proj-3', porcentajeUso: 33, priority: 4 }
  ],
  impactoCosto: 4500,
  impactoPlazo: 9
}]
```

#### Detectar Conflictos de Materiales

```typescript
detectMaterialConflicts(
  materiales: Material[] | null | undefined,
  proyectos: Proyecto[],
  ordenes: any[]
): ResourceConflict[]
```

**Lógica:**

1. Calcular uso por proyecto
2. Comparar con stock disponible
3. Generar alerta si demanda > stock

#### Detectar Conflictos de Activos

```typescript
detectAssetConflicts(
  activos: ActivoHerramienta[] | null | undefined,
  proyectos: Proyecto[]
): ResourceConflict[]
```

**Lógica similar a empleados**

#### Detectar Conflictos de Timeline

```typescript
detectTimelineConflicts(
  proyectos: Proyecto[],
  hitos: any[]
): ResourceConflict[]
```

**Lógica:**

1. Filtrar hitos retrasados (fecha < hoy y no completado)
2. Calcular severidad según días de retraso
3. Generar alerta con impacto de costo y plazo

#### Calcular Asignación de Recursos

```typescript
calculateResourceAllocation(
  empleados: Empleado[] | null | undefined,
  materiales: Material[] | null | undefined,
  activos: ActivoHerramienta[] | null | undefined,
  proyectos: Proyecto[]
): ResourceAllocation[]
```

**Resultado:**
```typescript
[{
  recursoId: 'emp-456',
  recursoNombre: 'Juan Pérez',
  tipo: 'empleado',
  proyectosAsignados: 3,
  capacidadTotal: 1,
  capacidadUsada: 1,
  porcentajeUtilizacion: 100,
  conflictosActivos: 1
}]
```

---

## 2. Hooks Personalizados

### 2.1 useAccessLog

**Archivo:** `src/erp/hooks/useAccessLog.ts`

**Función:** Registrar eventos de acceso en Supabase

**Eventos registrados:**
- `sign_in` - Inicio de sesión
- `sign_out` - Cierre de sesión
- `session_refresh` - Refresco de token
- `sign_in_failed` - Fallo de inicio de sesión

**Implementación:**
```typescript
export function useAccessLog() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id;
      const email = session?.user?.email;
      const provider = (session?.user as any)?.app_metadata?.provider;

      if (event === 'SIGNED_IN')          logAccess('sign_in', userId, email, provider);
      else if (event === 'SIGNED_OUT')    logAccess('sign_out', userId, email);
      else if (event === 'TOKEN_REFRESHED') logAccess('session_refresh', userId, email);
    });

    return () => subscription.unsubscribe();
  }, []);
}
```

### 2.2 useDailyIntegrityCheck

**Archivo:** `src/erp/hooks/useDailyIntegrityCheck.ts`

**Función:** Ejecutar check de integridad diaria para administradores

**Lógica:**
- Solo se ejecuta si usuario es administrador
- Verifica última ejecución en localStorage
- Ejecuta RPC `fn_daily_integrity_check` en Supabase
- Ejecuta con delay de 10s para no bloquear carga inicial

**Implementación:**
```typescript
export function useDailyIntegrityCheck(isAdmin: boolean) {
  useEffect(() => {
    if (!isAdmin || !hasSupabase) return;

    const lastRun = Number(localStorage.getItem('construsmart_last_integrity_check') ?? 0);
    if (Date.now() - lastRun < 24 * 60 * 60 * 1000) return;

    const run = async () => {
      const { data, error } = await supabase.rpc('fn_daily_integrity_check');
      if (error) { safeLogger.warn('[IntegrityCheck] RPC error:', error.message); return; }
      
      localStorage.setItem('construsmart_last_integrity_check', String(Date.now()));
      
      if (data?.issues_count > 0) {
        safeLogger.warn('[IntegrityCheck] Issues found:', data);
      } else {
        safeLogger.log('[IntegrityCheck] All checks passed');
      }
    };

    const timer = setTimeout(run, 10_000);
    return () => clearTimeout(timer);
  }, [isAdmin]);
}
```

### 2.3 useApuWorker

**Archivo:** `src/erp/hooks/useApuWorker.ts`

**Función:** Cálculo de APU en Web Worker para no bloquear UI

**Implementación:**
```typescript
export function useApuWorker(): UseApuWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('@/workers/apu-calc.worker.ts', import.meta.url),
      { type: 'module' }
    );
    return () => { workerRef.current?.terminate(); };
  }, []);

  const calculate = useCallback((req: ApuCalcRequest): Promise<ApuCalcResponse> => {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        // Fallback síncrono si worker no disponible
        const results = req.renglones.map(r => {
          const factor = r.factorSobrecosto ?? req.factorGlobal ?? 1.35;
          const subtotal = r.cantidad * r.precioUnitario;
          const totalMateriales = (r.subRenglones ?? []).reduce(
            (acc, s) => acc + s.cantidadUnitaria * r.cantidad * s.precioUnitario, 0
          );
          const costoDirecto = subtotal + totalMateriales;
          return { id: r.id, subtotal, costoDirecto, precioVenta: costoDirecto * factor, totalMateriales };
        });
        resolve({ renglones: results, totalGeneral: results.reduce((a, r) => a + r.precioVenta, 0) });
        return;
      }

      setIsCalculating(true);
      const handler = (e: MessageEvent) => {
        worker.removeEventListener('message', handler);
        setIsCalculating(false);
        if (e.data.success && e.data.result) resolve(e.data.result);
        else reject(new Error(e.data.error ?? 'APU worker error'));
      };
      worker.addEventListener('message', handler);
      worker.postMessage(req);
    });
  }, []);

  return { calculate, isCalculating };
}
```

### 2.4 useRefDataQueries

**Archivo:** `src/erp/hooks/useRefDataQueries.ts`

**Función:** Acceso a datos de referencia desde memoria local (offline-first)

**Estrategia:**
- Usar directamente el store Zustand
- No hacer llamadas directas a Supabase
- Los datos se sincronizan automáticamente cuando hay conexión
- Funciona completamente offline

**Implementación:**
```typescript
export function useInsumosBase() {
  const { insumosBase } = useErp();
  return insumosBase;
}

export function useMateriales() {
  const { materiales } = useErp();
  return materiales;
}

export function useProveedores() {
  const { proveedores } = useErp();
  return proveedores;
}
```

---

## 3. Flujos de Negocio End-to-End

### 3.1 Flujo de Mutación Offline-First

**Ciclo completo:**

1. **Usuario realiza acción**
   ```typescript
   const proyecto = { nombre: 'Proyecto A', cliente: 'Cliente X', ... };
   useErpStore.getState().addProyecto(proyecto);
   ```

2. **Validación de datos**
   ```typescript
   const parsed = proyectoSchema.safeParse(proyecto);
   if (!parsed.success) throw new Error('Datos inválidos');
   ```

3. **Validación de foreign keys**
   ```typescript
   const fkValidation = validateForeignKey(proyecto, 'proyecto', proyectos, proveedores);
   if (!fkValidation.valid) throw new Error(fkValidation.error);
   ```

4. **Encolar mutación**
   ```typescript
   enqueueMutation('addProyecto', proyecto);
   ```

5. **Actualización inmediata del estado local**
   ```typescript
   setProyectos(prev => [...prev, { id: generatedId, ...proyecto }]);
   ```

6. **Persistencia en localStorage**
   ```typescript
   const compressed = compressData(proyectos);
   safeSetItem(BASE_STORAGE_KEY + '_proyectos', compressed);
   ```

7. **Sincronización cuando hay conexión**
   ```typescript
   if (isOnline && checkTokenBucket()) {
     await forceSync();
   }
   ```

8. **Procesamiento en batch**
   ```typescript
   const BATCH_SIZE = 50;
   for (const chunk of chunkArray(ops.INSERT, BATCH_SIZE)) {
     await client.from('erp_proyectos').insert(chunk).onConflict('id').ignore();
   }
   ```

9. **Manejo de errores específicos**
   - FK 23503: reintentar hasta 3 veces
   - Duplicate 23505: marcar como procesado
   - PGRST116: descartar silenciosamente

### 3.2 Flujo de Cálculo Completo

**Ejemplo: Dosificación de concreto con factores de ajuste**

1. **Usuario define parámetros**
   ```typescript
   const dosificacion = {
     resistencia: '3000psi',
     tipo: 'cimentacion',
     tamañoAgregado: '3/4"',
     aditivos: 'plastificante',
     curado: 'normal'
   };
   const volumen = 10; // m³
   ```

2. **Motor de cálculo ejecuta**
   ```typescript
   const resultado = await ServicioMotorCalculo.calcularDosificacion(
     dosificacion,
     volumen,
     departamento: 'GT-01',
     altitud: 1500
   );
   ```

3. **Factores de ajuste aplicados**
   ```typescript
   const factorAltitud = 1.0; // altitud media
   const factorTemperatura = 1.0; // Guatemala
   const factorCurado = 1.0; // curado normal
   const factorAjuste = 1.0;
   ```

4. **Aplicación de reglas adicionales**
   ```typescript
   const reglasResultado = await motorReglasFactores.aplicarReglas(
     resultado.costoTotal,
     'zona',
     { departamento: 'GT-01', tipologia: 'residencial' }
   );
   // → costo ajustado: 8289 * 1.15 = 9532.35
   ```

5. **Validación de resultados**
   ```typescript
   const alertas = await ValidacionCalculos.validarDosificacionConcreto(
     parametros,
     resultado
   );
   // → Verifica rango típico de proporciones
   ```

6. **Registro en historial**
   ```typescript
   await registrarCalculo(proyectoId, 'dosificacion_concreto', parametros, resultado);
   ```

7. **Snapshot de estado**
   ```typescript
   await crearSnapshotEstado(calculoId, 'final', resultado, 'Cálculo completado');
   ```

### 3.3 Flujo de Detección de Conflictos

**Ciclo de detección:**

1. **Obtener todos los recursos**
   ```typescript
   const empleados = useErpStore.getState().empleados;
   const proyectos = useErpStore.getState().proyectos;
   ```

2. **Detectar conflictos de empleados**
   ```typescript
   const conflicts = conflictDetectionService.detectEmployeeConflicts(empleados, proyectos);
   ```

3. **Proceso de detección**
   ```typescript
   empleados.forEach(empleado => {
     if (empleado.proyectoIds.length > 1) {
       const proyectosEmp = empleado.proyectoIds
         .map(id => proyectos.find(p => p.id === id))
         .filter(p => p.estado === 'ejecucion');
       
       const overlappingProjects = findOverlappingProjects(proyectosEmp);
       
       if (overlappingProjects.length > 1) {
         // Generar conflicto con severidad calculada
       }
     }
   });
   ```

4. **Calcular asignación de recursos**
   ```typescript
   const allocations = conflictDetectionService.calculateResourceAllocation(
     empleados,
     materiales,
     activos,
     proyectos
   );
   ```

5. **Notificar al usuario**
   ```typescript
   if (conflicts.length > 0) {
     addNotificacion('warning', 'Conflictos detectados', `${conflicts.length} conflictos de recursos`);
   }
   ```

### 3.4 Flujo de Análisis de Rentabilidad

**Ciclo de análisis:**

1. **Obtener datos del proyecto**
   ```typescript
   const proyecto = useErpStore.getState().proyectos.find(p => p.id === proyectoId);
   const movimientos = useErpStore.getState().movimientos.filter(m => m.proyectoId === proyectoId);
   ```

2. **Calcular métricas financieras**
   ```typescript
   const costoReal = movimientos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0);
   const ingresoReal = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
   const utilidadBruta = ingresoReal - costoReal;
   const margenBruto = (utilidadBruta / ingresoReal) * 100;
   ```

3. **Determinar estado de rentabilidad**
   ```typescript
   const estadoRentabilidad = determineProfitabilityStatus(margenBruto, variacionPresupuesto);
   ```

4. **Calcular eficiencia de recursos**
   ```typescript
   const eficienciaLabor = calculateLaborEfficiency(proyectoId, empleados, movimientos);
   const desperdicioMateriales = calculateMaterialWaste(proyectoId, materiales, movimientos);
   const utilizacionEquipo = calculateEquipmentUtilization(proyectoId, ordenes, movimientos);
   const scoreEficiencia = (eficienciaLabor + (100 - desperdicioMateriales) + utilizacionEquipo) / 3;
   ```

5. **Generar forecast**
   ```typescript
   const forecast = generateProfitabilityForecast({
     proyectoId,
     tipoProyeccion: 'rentabilidad',
     fechaBase: todayISO(),
     diasProyeccion: 30
   }, historicalData, proyecto);
   ```

6. **Analizar tendencias**
   ```typescript
   const trends = analyzeProfitabilityTrends(proyectos, profitabilityData, 'por_tipologia');
   ```

---

## 4. Schemas de Validación

### 4.1 Schemas Zod Canónicos

**Ubicación:** `src/erp/store/schemas/`

**Schema de cálculo de proyecto:**
```typescript
export const calculoProyectoSchema = z.object({
  id: z.string(),
  proyectoId: z.string().min(1),
  tipoCalcululo: z.enum(['apu', 'dosificacion', 'acero', 'movimiento_tierra', 'pavimento', 'red_infraestructura', 'muro_contencion', 'climaticos'] as const),
  fechaCalcululo: z.string().optional(),
  usuarioId: z.string().optional(),
  parametros: z.record(z.unknown()).default({}),
  resultados: z.record(z.unknown()).default({}),
  versionCalculculo: z.number().optional(),
  origenCalcululo: z.enum(['manual', 'automatico', 'importado'] as const).optional(),
  observaciones: z.string().optional(),
  validado: z.boolean().optional(),
  validadoPor: z.string().optional(),
  fechaValidacion: z.string().optional(),
  notasValidacion: z.string().optional(),
});
```

**Schema de regla factor:**
```typescript
export const reglaFactorSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string().optional(),
  tipo_factor: z.enum(['zona', 'tipologia', 'escalas', 'estacional', 'climatico', 'normativa', 'sobrecosto'] as const),
  prioridad: z.number(),
  condicion: z.record(z.unknown()).default({}),
  factor_aplicacion: z.number(),
  operador: z.enum(['multiplicar', 'sumar', 'restar', 'porcentaje'] as const),
  ambito: z.enum(['global', 'departamento', 'municipio', 'proyecto', 'renglon'] as const),
  departamento_id: z.string().optional(),
  municipio_id: z.string().optional(),
  tipologia: z.string().optional(),
  activo: z.boolean().default(true),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
```

---

## 5. Utilidades Funcionales

### 5.1 Safe Parse Array

**Archivo:** `src/erp/utils.ts`

```typescript
export const safeParseArray = <T>(
  value: unknown,
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T } }
): T[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => schema.safeParse(item))
    .filter((result): result is { success: true; data: T } => result.success === true)
    .map(result => result.data as T);
};
```

### 5.2 Validación de Foreign Keys

**Archivo:** `src/erp/zustandStore.ts`

```typescript
function validateForeignKey<T extends { proyectoId?: string; proveedorId?: string }>(
  entity: T,
  entityName: string,
  proyectos: Proyecto[],
  proveedores?: Proveedor[]
): { valid: boolean; error?: string } {
  if (entity.proyectoId) {
    const proyecto = proyectos.find(p => p.id === entity.proyectoId);
    if (!proyecto) {
      return {
        valid: false,
        error: `${entityName}: proyectoId ${entity.proyectoId} no existe`
      };
    }
  }
  if (entity.proveedorId && proveedores) {
    const proveedor = proveedores.find(p => p.id === entity.proveedorId);
    if (!proveedor) {
      return {
        valid: false,
        error: `${entityName}: proveedorId ${entity.proveedorId} no existe`
      };
    }
  }
  return { valid: true };
}
```

---

## 6. Conclusión

Este análisis funcional demuestra que CONSTRUSMART ERP tiene una implementación funcional robusta con:

- **Motor de cálculo completo** - Dosificación de concreto, movimiento de tierra, pavimentos, redes, muros con factores de ajuste
- **Sistema de reglas dinámicas** - Motor de reglas de factores con evaluación de condiciones y múltiples operadores
- **Normativa departamental** - Gestión de normativas con validación de cumplimiento
- **Escalas de producción** - Aplicación de factores de economía, administración, imprevistos por tamaño de proyecto
- **Estacionalidad** - Factores estacionales por departamento y mes con análisis de mejor mes
- **Validación de cálculos** - Validación multicapa con score de consistencia y recomendaciones
- **Analytics de rentabilidad** - Cálculo de rentabilidad por proyecto/cliente, proyecciones, eficiencia de recursos
- **Detección de conflictos** - Detección proactiva de conflictos de empleados, materiales, activos y timeline
- **Hooks personalizados** - 11 hooks para funcionalidades específicas (access log, integrity check, APU worker, etc.)
- **Flujos de negocio end-to-end** - Mutación offline-first, cálculo completo, detección de conflictos, análisis de rentabilidad
- **Schemas de validación Zod canónicos** - 18 schemas para todas las entidades
- **Utilidades funcionales** - safeParseArray, validación FK
- **Edge Functions** - Cálculos intensivos en servidor (Deno) para dosificación, movimiento tierra, pavimentos, rentabilidad
- **API Pública** - Integraciones externas con API keys seguras y RPC functions
- **Partitioning** - Tablas grandes particionadas por fecha mensual para escala masiva
- **BigDecimal** - Precisión financiera con decimal.js (28 dígitos, redondeo bancario)
- **Virtual Scrolling** - Tablas grandes con react-window para performance
- **Context Menu Unificado** - Sistema de menú contextual consistente en todas las tablas
- **Tests E2E** - 7 flujos de integración end-to-end completos

La funcionalidad está diseñada para soportar cálculos de ingeniería precisos, gestión de recursos eficiente, y análisis de rentabilidad completo para proyectos de construcción.
