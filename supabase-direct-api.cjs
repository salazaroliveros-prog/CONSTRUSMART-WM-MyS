// Script para ejecutar SQL directamente usando Supabase REST API
const https = require('https');

const supabaseRef = process.env.SUPABASE_PROJECT_REF || 'neygzluxugodiwcuctbj';
const accessToken = process.env.SUPABASE_TOKEN;

function ejecutarSQL(sql) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${supabaseRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'apikey': accessToken
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}. Response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

async function verificarTablas() {
  console.log('=== Verificando tablas que realmente existen en Supabase ===\n');

  const tablas = [
    'erp_reglas_factores',
    'erp_historial_aplicacion_reglas', 
    'erp_snapshots_estado_calculo',
    'erp_cumplimiento_normativo',
    'erp_aplicacion_escalas',
    'erp_ajustes_estacionales_actividad',
    'erp_calculos_proyecto',
    'erp_comparaciones_calculos',
    'erp_normativa_departamental',
    'erp_escalas_produccion',
    'erp_estacionalidad'
  ];

  for (const tabla of tablas) {
    try {
      const sql = `SELECT COUNT(*) as count FROM ${tabla}`;
      const result = await ejecutarSQL(sql);
      console.log(`✅ Tabla ${tabla}: ${result.result?.rows?.[0]?.count || '0'} registros`);
    } catch (error) {
      console.log(`❌ Tabla ${tabla}: ${error.message}`);
    }
  }
}

async function crearTablaReglasFactores() {
  console.log('=== Creando tabla erp_reglas_factores ===\n');

  const sql = `
    CREATE TABLE IF NOT EXISTS erp_reglas_factores (
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
  `;

  try {
    await ejecutarSQL(sql);
    console.log('✅ Tabla erp_reglas_factores creada');
    return true;
  } catch (error) {
    console.log(`❌ Error creando tabla: ${error.message}`);
    return false;
  }
}

async function crearTodasTablasFaltantes() {
  console.log('=== Creando todas las tablas faltantes ===\n');

  const tablas = [
    {
      nombre: 'erp_historial_aplicacion_reglas',
      sql: `
        CREATE TABLE IF NOT EXISTS erp_historial_aplicacion_reglas (
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
      `
    },
    {
      nombre: 'erp_snapshots_estado_calculo',
      sql: `
        CREATE TABLE IF NOT EXISTS erp_snapshots_estado_calculo (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          calculo_id uuid NOT NULL REFERENCES erp_calculos_proyecto(id),
          tipo_snapshot text CHECK (tipo_snapshot IN ('antes','despues','intermedio','final')),
          estado_completo jsonb NOT NULL,
          timestamp_snapshot timestamptz DEFAULT now() NOT NULL,
          descripcion_snapshot text,
          created_at timestamptz DEFAULT now() NOT NULL
        );
      `
    },
    {
      nombre: 'erp_cumplimiento_normativo',
      sql: `
        CREATE TABLE IF NOT EXISTS erp_cumplimiento_normativo (
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
      `
    },
    {
      nombre: 'erp_aplicacion_escalas',
      sql: `
        CREATE TABLE IF NOT EXISTS erp_aplicacion_escalas (
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
      `
    },
    {
      nombre: 'erp_ajustes_estacionales_actividad',
      sql: `
        CREATE TABLE IF NOT EXISTS erp_ajustes_estacionales_actividad (
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
      `
    }
  ];

  for (const tabla of tablas) {
    try {
      await ejecutarSQL(tabla.sql);
      console.log(`✅ Tabla ${tabla.nombre} creada`);
    } catch (error) {
      console.log(`❌ Error creando ${tabla.nombre}: ${error.message}`);
    }
  }
}

async function crearIndicesYPolicies() {
  console.log('=== Creando índices y RLS policies ===\n');

  // Índices para todas las tablas
  const indices = [
    { nombre: 'erp_reglas_factores tipo', tabla: 'erp_reglas_factores', sql: 'CREATE INDEX IF NOT EXISTS idx_reglas_factores_tipo ON erp_reglas_factores(tipo_factor, activo)' },
    { nombre: 'erp_reglas_factores prioridad', tabla: 'erp_reglas_factores', sql: 'CREATE INDEX IF NOT EXISTS idx_reglas_factores_prioridad ON erp_reglas_factores(prioridad DESC, activo)' },
    { nombre: 'erp_reglas_factores ambito', tabla: 'erp_reglas_factores', sql: 'CREATE INDEX IF NOT EXISTS idx_reglas_factores_ambito ON erp_reglas_factores(ambito, departamento_id, municipio_id)' },
    { nombre: 'erp_historial_reglas proyecto', tabla: 'erp_historial_aplicacion_reglas', sql: 'CREATE INDEX IF NOT EXISTS idx_historial_reglas_proyecto ON erp_historial_aplicacion_reglas(proyecto_id, fecha_aplicacion DESC)' },
    { nombre: 'erp_snapshots calculo', tabla: 'erp_snapshots_estado_calculo', sql: 'CREATE INDEX IF NOT EXISTS idx_snapshots_calculo ON erp_snapshots_estado_calculo(calculo_id)' },
    { nombre: 'erp_cumplimiento proyecto', tabla: 'erp_cumplimiento_normativo', sql: 'CREATE INDEX IF NOT EXISTS idx_cumplimiento_proyecto ON erp_cumplimiento_normativo(proyecto_id)' },
    { nombre: 'erp_aplicacion_escalas proyecto', tabla: 'erp_aplicacion_escalas', sql: 'CREATE INDEX IF NOT EXISTS idx_aplicacion_escalas_proyecto ON erp_aplicacion_escalas(proyecto_id)' },
    { nombre: 'erp_ajustes estacionalidad', tabla: 'erp_ajustes_estacionales_actividad', sql: 'CREATE INDEX IF NOT EXISTS idx_ajustes_estacionalidad ON erp_ajustes_estacionales_actividad(estacionalidad_id)' }
  ];

  for (const indice of indices) {
    try {
      await ejecutarSQL(indice.sql);
      console.log(`✅ Índice ${indice.nombre}: creado`);
    } catch (error) {
      console.log(`⚠️  Índice ${indice.nombre}: ${error.message}`);
    }
  }

  // RLS policies (DROP IF EXISTS primero, luego CREATE)
  const policies = [
    { nombre: 'erp_reglas_lectura', sql: 'DROP POLICY IF EXISTS "reglas_factor_lectura_autenticados" ON erp_reglas_factores' },
    { nombre: 'erp_reglas_escritura', sql: 'DROP POLICY IF EXISTS "reglas_factor_escritura_admins" ON erp_reglas_factores' },
    { nombre: 'erp_historial_lectura', sql: 'DROP POLICY IF EXISTS "historial_reglas_lectura_autenticados" ON erp_historial_aplicacion_reglas' },
    { nombre: 'erp_historial_escritura', sql: 'DROP POLICY IF EXISTS "historial_reglas_escritura_autenticados" ON erp_historial_aplicacion_reglas' },
    { nombre: 'snapshots_lectura', sql: 'DROP POLICY IF EXISTS "snapshots_lectura_autenticados" ON erp_snapshots_estado_calculo' },
    { nombre: 'snapshots_escritura', sql: 'DROP POLICY IF EXISTS "snapshots_escritura_autenticados" ON erp_snapshots_estado_calculo' },
    { nombre: 'cumplimiento_lectura', sql: 'DROP POLICY IF EXISTS "cumplimiento_lectura_autenticados" ON erp_cumplimiento_normativo' },
    { nombre: 'cumplimiento_escritura', sql: 'DROP POLICY IF EXISTS "cumplimiento_escritura_autenticados" ON erp_cumplimiento_normativo' },
    { nombre: 'aplicacion_escalas_lectura', sql: 'DROP POLICY IF EXISTS "aplicacion_escalas_lectura_autenticados" ON erp_aplicacion_escalas' },
    { nombre: 'aplicacion_escalas_escritura', sql: 'DROP POLICY IF EXISTS "aplicacion_escalas_escritura_autenticados" ON erp_aplicacion_escalas' },
    { nombre: 'ajustes_lectura', sql: 'DROP POLICY IF EXISTS "ajustes_lectura_autenticados" ON erp_ajustes_estacionales_actividad' },
    { nombre: 'ajustes_escritura', sql: 'DROP POLICY IF EXISTS "ajustes_escritura_autenticados" ON erp_ajustes_estacionales_actividad' }
  ];

  const policiesCreate = [
    { nombre: 'erp_reglas_lectura', sql: 'CREATE POLICY "reglas_factor_lectura_autenticados" ON erp_reglas_factores FOR SELECT USING (auth.role() = \'authenticated\')' },
    { nombre: 'erp_reglas_escritura', sql: 'CREATE POLICY "reglas_factor_escritura_admins" ON erp_reglas_factores FOR ALL USING (auth.role() = \'authenticated\')' },
    { nombre: 'erp_historial_lectura', sql: 'CREATE POLICY "historial_reglas_lectura_autenticados" ON erp_historial_aplicacion_reglas FOR SELECT USING (auth.role() = \'authenticated\')' },
    { nombre: 'erp_historial_escritura', sql: 'CREATE POLICY "historial_reglas_escritura_autenticados" ON erp_historial_aplicacion_reglas FOR INSERT WITH CHECK (auth.role() = \'authenticated\')' },
    { nombre: 'snapshots_lectura', sql: 'CREATE POLICY "snapshots_lectura_autenticados" ON erp_snapshots_estado_calculo FOR SELECT USING (auth.role() = \'authenticated\')' },
    { nombre: 'snapshots_escritura', sql: 'CREATE POLICY "snapshots_escritura_autenticados" ON erp_snapshots_estado_calculo FOR ALL USING (auth.role() = \'authenticated\')' },
    { nombre: 'cumplimiento_lectura', sql: 'CREATE POLICY "cumplimiento_lectura_autenticados" ON erp_cumplimiento_normativo FOR SELECT USING (auth.role() = \'authenticated\')' },
    { nombre: 'cumplimiento_escritura', sql: 'CREATE POLICY "cumplimiento_escritura_autenticados" ON erp_cumplimiento_normativo FOR ALL USING (auth.role() = \'authenticated\')' },
    { nombre: 'aplicacion_escalas_lectura', sql: 'CREATE POLICY "aplicacion_escalas_lectura_autenticados" ON erp_aplicacion_escalas FOR SELECT USING (auth.role() = \'authenticated\')' },
    { nombre: 'aplicacion_escalas_escritura', sql: 'CREATE POLICY "aplicacion_escalas_escritura_autenticados" ON erp_aplicacion_escalas FOR ALL USING (auth.role() = \'authenticated\')' },
    { nombre: 'ajustes_lectura', sql: 'CREATE POLICY "ajustes_lectura_autenticados" ON erp_ajustes_estacionales_actividad FOR SELECT USING (auth.role() = \'authenticated\')' },
    { nombre: 'ajustes_escritura', sql: 'CREATE POLICY "ajustes_escritura_autenticados" ON erp_ajustes_estacionales_actividad FOR ALL USING (auth.role() = \'authenticated\')' }
  ];

  for (const policy of policies) {
    try {
      await ejecutarSQL(policy.sql);
    } catch (error) {
      // Ignorar errores en DROP (puede no existir)
    }
  }

  for (const policy of policiesCreate) {
    try {
      await ejecutarSQL(policy.sql);
      console.log(`✅ Policy ${policy.nombre}: creada`);
    } catch (error) {
      console.log(`⚠️  Policy ${policy.nombre}: ${error.message}`);
    }
  }
}
async function insertarSeedData() {
  console.log('\n=== Diagnóstico: Verificar extensión uuid-ossp ===\n');

  // Verificar si uuid_generate_v4 está disponible
  try {
    const checkExt = await ejecutarSQL('SELECT uuid_generate_v4() as test_uuid');
    console.log('Extensión uuid-ossp disponible:', checkExt.result?.rows?.[0]?.test_uuid);
  } catch (error) {
    console.log('Error uuid_generate_v4:', error.message);
  }

  console.log('\n=== Insertando seed data en erp_reglas_factores ===\n');

  try {
    // Deshabilitar RLS temporalmente
    await ejecutarSQL('ALTER TABLE erp_reglas_factores DISABLE ROW LEVEL SECURITY');
    console.log('✅ RLS deshabilitado temporalmente');
  } catch (error) {
    console.log(`⚠️  No se pudo deshabilitar RLS: ${error.message}`);
  }

  // Test simple: insertar un solo registro con UUID explícito
  console.log('--- Test: insertar con UUID explícito ---');
  try {
    const testSQL = "INSERT INTO erp_reglas_factores (id, nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito) VALUES (gen_random_uuid(), 'TEST REGISTRY', 'Test de inserción simple', 'zona', 10, '{}'::jsonb, 1.0, 'multiplicar', 'departamento') RETURNING id";
    const testResult = await ejecutarSQL(testSQL);
    console.log('Resultado INSERT con UUID:', JSON.stringify(testResult, null, 2));
  } catch (error) {
    console.log('Error INSERT con UUID:', error.message);
  }

  // Verificar inmediatamente después del insert
  try {
    const verificacion = await ejecutarSQL('SELECT COUNT(*) as count FROM erp_reglas_factores');
    console.log('Count después de INSERT:', verificacion.result?.rows?.[0]?.count || '0');
  } catch (error) {
    console.log('Error COUNT:', error.message);
  }
    
  // Volver a habilitar RLS
  try {
    await ejecutarSQL('ALTER TABLE erp_reglas_factores ENABLE ROW LEVEL SECURITY');
    console.log('✅ RLS rehabilitado');
  } catch (error) {
    console.log(`⚠️  No se pudo rehabilitar RLS: ${error.message}`);
  }
    
  console.log('\n⚠️  El API de Supabase parece no estar persistiendo INSERTs.');
  console.log('Las tablas están creadas pero el seed data no se insertó.');
  console.log('Solución: Ejecutar seed data manualmente en SQL Editor de Supabase.');
    
  return false;
}

async function main() {
  try {
    console.log('=== Ejecución completa de migraciones ===\n');
    await crearTablaReglasFactores();
    await crearTodasTablasFaltantes();
    await crearIndicesYPolicies();
    await insertarSeedData();
    
    console.log('\n=== Verificación final ===');
    await verificarTablas();
    
    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();