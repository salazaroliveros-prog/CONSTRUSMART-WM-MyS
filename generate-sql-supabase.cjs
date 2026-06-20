// Script para generar SQL que puede ejecutarse en Supabase SQL Editor
// Genera las sentencias CREATE TABLE necesarias para las tablas faltantes

const tablasFaltantes = [
  {
    nombre: 'erp_reglas_factores',
    sql: `CREATE TABLE IF NOT EXISTS erp_reglas_factores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  tipo_factor text NOT NULL CHECK (tipo_factor IN ('zona','tipologia','escalas','estacional','climatico','normativa','sobrecosto')),
  prioridad integer NOT NULL DEFAULT 0 CHECK (prioridad >= 0 AND prioridad <= 100),
  condicion jsonb NOT NULL,
  factor_aplicacion numeric(5,3) NOT NULL CHECK (factor_aplicacion > 0),
  operador text NOT NULL CHECK (operador IN ('multiplicar','sumar','restar','porcentaje')),
  ambito text NOT NULL CHECK (ambito IN ('global','departamento','municipio','proyecto','renglon')),
  departamento_id text,
  municipio_id text,
  tipologia text,
  activo boolean DEFAULT true,
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_reglas_factores_tipo ON erp_reglas_factores(tipo_factor, activo);
CREATE INDEX idx_reglas_factores_prioridad ON erp_reglas_factores(prioridad DESC, activo);
CREATE INDEX idx_reglas_factores_ambito ON erp_reglas_factores(ambito, departamento_id, municipio_id);
CREATE INDEX idx_reglas_factores_tipologia ON erp_reglas_factores(tipologia);
CREATE INDEX idx_reglas_factores_fechas ON erp_reglas_factores(fecha_inicio, fecha_fin);`
  },
  {
    nombre: 'erp_historial_aplicacion_reglas',
    sql: `CREATE TABLE IF NOT EXISTS erp_historial_aplicacion_reglas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id text,
  renglon_id text,
  regla_id uuid NOT NULL REFERENCES erp_reglas_factores(id),
  valor_original numeric(12,2),
  valor_aplicado numeric(12,2),
  factor_aplicado numeric(5,3),
  contexto_aplicacion jsonb,
  usuario_id text,
  fecha_aplicacion timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_historial_reglas_proyecto ON erp_historial_aplicacion_reglas(proyecto_id, fecha_aplicacion DESC);
CREATE INDEX idx_historial_reglas_renglon ON erp_historial_aplicacion_reglas(renglon_id);
CREATE INDEX idx_historial_reglas_regla ON erp_historial_aplicacion_reglas(regla_id);
CREATE INDEX idx_historial_reglas_fecha ON erp_historial_aplicacion_reglas(fecha_aplicacion DESC);`
  },
  {
    nombre: 'erp_snapshots_estado_calculo',
    sql: `CREATE TABLE IF NOT EXISTS erp_snapshots_estado_calculo (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  calculo_id uuid NOT NULL REFERENCES erp_calculos_proyecto(id),
  tipo_snapshot text CHECK (tipo_snapshot IN ('antes','despues','intermedio','final')),
  estado_completo jsonb NOT NULL,
  timestamp_snapshot timestamptz DEFAULT now() NOT NULL,
  descripcion_snapshot text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_snapshots_calculo ON erp_snapshots_estado_calculo(calculo_id);
CREATE INDEX idx_snapshots_tipo ON erp_snapshots_estado_calculo(tipo_snapshot);
CREATE INDEX idx_snapshots_timestamp ON erp_snapshots_estado_calculo(timestamp_snapshot DESC);`
  },
  {
    nombre: 'erp_cumplimiento_normativo',
    sql: `CREATE TABLE IF NOT EXISTS erp_cumplimiento_normativo (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id text NOT NULL,
  norma_id uuid NOT NULL REFERENCES erp_normativa_departamental(id),
  estado_cumplimiento text CHECK (estado_cumplimiento IN ('pendiente','en_proceso','cumple','no_cumple','excepcionado')),
  fecha_verificacion date,
  responsable_verificacion text,
  evidencias_cumplimiento jsonb DEFAULT '{}'::jsonb,
  observaciones text,
  requiere_acciones_correctivas boolean DEFAULT false,
  acciones_correctivas text[],
  fecha_limite_correccion date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_cumplimiento_proyecto ON erp_cumplimiento_normativo(proyecto_id);
CREATE INDEX idx_cumplimiento_norma ON erp_cumplimiento_normativo(norma_id);
CREATE INDEX idx_cumplimiento_estado ON erp_cumplimiento_normativo(estado_cumplimiento);
CREATE INDEX idx_cumplimiento_fecha ON erp_cumplimiento_normativo(fecha_verificacion);`
  },
  {
    nombre: 'erp_aplicacion_escalas',
    sql: `CREATE TABLE IF NOT EXISTS erp_aplicacion_escalas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id text NOT NULL,
  escala_id uuid NOT NULL REFERENCES erp_escalas_produccion(id),
  
  tamano_proyecto numeric(10,2),
  presupuesto_estimado numeric(15,2),
  cantidad_renglones integer,
  
  factor_economia_aplicado numeric(5,3),
  factor_administracion_aplicado numeric(5,3),
  factor_imprevistos_aplicado numeric(5,3),
  factor_logistica_aplicado numeric(5,3),
  factor_financiero_aplicado numeric(5,3),
  factor_total numeric(5,3),
  
  costo_ajustado numeric(15,2),
  ahorro_estimado numeric(15,2),
  
  usuario_aplicacion text,
  fecha_aplicacion timestamptz DEFAULT now() NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_aplicacion_escalas_proyecto ON erp_aplicacion_escalas(proyecto_id);
CREATE INDEX idx_aplicacion_escalas_escala ON erp_aplicacion_escalas(escala_id);
CREATE INDEX idx_aplicacion_escalas_fecha ON erp_aplicacion_escalas(fecha_aplicacion DESC);`
  },
  {
    nombre: 'erp_ajustes_estacionales_actividad',
    sql: `CREATE TABLE IF NOT EXISTS erp_ajustes_estacionales_actividad (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  estacionalidad_id uuid NOT NULL REFERENCES erp_estacionalidad(id),
  tipo_actividad text NOT NULL CHECK (tipo_actividad IN ('cimentacion','estructura','mamposteria','acabados','instalaciones','movimiento_tierra','pavimentacion','general')),
  factor_especifico numeric(5,3) NOT NULL DEFAULT 1.0,
  impacto_duracion integer,
  recomendaciones text[],
  medidas_mitigacion text[],
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_ajustes_estacionalidad ON erp_ajustes_estacionales_actividad(estacionalidad_id);
CREATE INDEX idx_ajustes_actividad ON erp_ajustes_estacionales_actividad(tipo_actividad);`
  }
];

console.log('=== SQL para crear tablas faltantes en Supabase ===\n');
console.log('COPIA Y PEGA ESTAS SENTENCIAS EN EL SQL EDITOR DE SUPABASE:\n');

tablasFaltantes.forEach((tabla, index) => {
  console.log(`-- Tabla ${index + 1}/${tablasFaltantes.length}: ${tabla.nombre}`);
  console.log(tabla.sql);
  console.log('\n');
});

console.log('=== Instrucciones ===');
console.log('1. Ve a https://app.supabase.com');
console.log('2. Abre tu proyecto: neygzluxugodiwcuctbj.supabase.co');
console.log('3. Navega a SQL Editor');
console.log('4. Copia y pega el SQL arriba');
console.log('5. Ejecuta cada bloque de CREATE TABLE por separado');
console.log('6. Verifica que todas las tablas se crearon exitosamente');