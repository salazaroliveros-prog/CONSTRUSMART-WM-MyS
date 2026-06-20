// Script para insertar seed data opcional en erp_reglas_factores
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjA4OTIsImV4cCI6MjA5NTgzNjg5Mn0.IfCMtFbZYL0GDgV_3zwqBmqjCNf3PZfYS-SvbRGXhY0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertarSeedData() {
  console.log('Insertando seed data en erp_reglas_factores...\n');

  const reglas = [
    {
      nombre: 'Factor Zona Guatemala',
      descripcion: 'Factor base para zona metropolitana Guatemala',
      tipo_factor: 'zona',
      prioridad: 10,
      condicion: { departamento: 'Guatemala' },
      factor_aplicacion: 1.0,
      operador: 'multiplicar',
      ambito: 'departamento'
    },
    {
      nombre: 'Factor Zona Quetzaltenango',
      descripcion: 'Factor para altitudes mayores de 2000msnm',
      tipo_factor: 'zona',
      prioridad: 10,
      condicion: { departamento: 'Quetzaltenango', altitud: { operador: 'mayor', valor: '2000' } },
      factor_aplicacion: 1.12,
      operador: 'multiplicar',
      ambito: 'departamento'
    },
    {
      nombre: 'Factor Zona Escuintla',
      descripcion: 'Factor para zona industrial y caliente',
      tipo_factor: 'zona',
      prioridad: 10,
      condicion: { departamento: 'Escuintla' },
      factor_aplicacion: 1.08,
      operador: 'multiplicar',
      ambito: 'departamento'
    },
    {
      nombre: 'Factor Tipología Residencial',
      descripcion: 'Factor base para proyectos residenciales',
      tipo_factor: 'tipologia',
      prioridad: 20,
      condicion: { tipologia: 'residencial' },
      factor_aplicacion: 1.0,
      operador: 'multiplicar',
      ambito: 'global'
    },
    {
      nombre: 'Factor Tipología Comercial',
      descripcion: 'Factor para proyectos comerciales',
      tipo_factor: 'tipologia',
      prioridad: 20,
      condicion: { tipologia: 'comercial' },
      factor_aplicacion: 1.15,
      operador: 'multiplicar',
      ambito: 'global'
    },
    {
      nombre: 'Factor Tipología Industrial',
      descripcion: 'Factor para proyectos industriales complejos',
      tipo_factor: 'tipologia',
      prioridad: 20,
      condicion: { tipologia: 'industrial' },
      factor_aplicacion: 1.35,
      operador: 'multiplicar',
      ambito: 'global'
    },
    {
      nombre: 'Sobrecosto Estandar',
      descripcion: 'Factor de sobrecosto estandar (32%)',
      tipo_factor: 'sobrecosto',
      prioridad: 30,
      condicion: {},
      factor_aplicacion: 1.32,
      operador: 'multiplicar',
      ambito: 'global'
    },
    {
      nombre: 'Factor Clima Frío',
      descripcion: 'Ajuste por clima frío (>2000msnm)',
      tipo_factor: 'climatico',
      prioridad: 15,
      condicion: { altitud: { operador: 'mayor', valor: '2000' } },
      factor_aplicacion: 1.05,
      operador: 'multiplicar',
      ambito: 'departamento'
    },
    {
      nombre: 'Factor Clima Caliente',
      descripcion: 'Ajuste por clima caliente (<500msnm)',
      tipo_factor: 'climatico',
      prioridad: 15,
      condicion: { altitud: { operador: 'menor', valor: '500' } },
      factor_aplicacion: 1.03,
      operador: 'multiplicar',
      ambito: 'departamento'
    }
  ];

  let insertadas = 0;
  let existentes = 0;

  for (const regla of reglas) {
    try {
      // Verificar si ya existe
      const { data: existente } = await supabase
        .from('erp_reglas_factores')
        .select('id')
        .eq('nombre', regla.nombre)
        .single();

      if (existente) {
        console.log(`⚠️  ${regla.nombre}: ya existe`);
        existentes++;
      } else {
        // Insertar nueva regla
        const { error } = await supabase
          .from('erp_reglas_factores')
          .insert(regla);

        if (error) {
          console.log(`❌ ${regla.nombre}: ${error.message}`);
        } else {
          console.log(`✅ ${regla.nombre}: insertada`);
          insertadas++;
        }
      }
    } catch (error) {
      console.log(`❌ ${regla.nombre}: ${error.message}`);
    }
  }

  console.log('\n=== Resumen ===');
  console.log(`Reglas insertadas: ${insertadas}/${reglas.length}`);
  console.log(`Reglas ya existentes: ${existentes}/${reglas.length}`);

  if (insertadas > 0 || existentes > 0) {
    console.log('\n✅ Seed data completado');
  } else {
    console.log('\n❌ No se pudo insertar ningún seed data');
  }

  // Verificar cantidad total
  const { count } = await supabase
    .from('erp_reglas_factores')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal de reglas en base de datos: ${count}`);

  return insertadas + existentes === reglas.length;
}

insertarSeedData()
  .then(result => process.exit(result ? 0 : 1))
  .catch(error => {
    console.error('Error en seed data:', error);
    process.exit(1);
  });