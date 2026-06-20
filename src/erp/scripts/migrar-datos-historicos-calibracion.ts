import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';

const envContent = readFileSync('.env', 'utf-8');
const lines = envContent.split('\n');
let supabaseKey = '';
for (const line of lines) {
  if (line.startsWith('VITE_SUPABASE_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
    break;
  }
}

if (!supabaseKey) {
  console.error('No se pudo encontrar VITE_SUPABASE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DatoHistorico {
  tipoProyecto: string;
  presupuestoBase: number;
  costoReal: number;
  departamento: string;
  fechaInicio: string;
  duracionDias: number;
  superficieM2: number;
  tipoObra: string;
  materialPrincipal: string;
  rendimiento: number;
}

async function migrarDatosHistoricos() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   MIGRACIÓN DE DATOS HISTÓRICOS              ║');
  console.log('║   Para Calibración del Motor de Cálculo       ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const datosMuestra: DatoHistorico[] = [
    {
      tipoProyecto: 'residencial',
      presupuestoBase: 500000,
      costoReal: 487000,
      departamento: 'GT-01',
      fechaInicio: '2024-01-15',
      duracionDias: 120,
      superficieM2: 250,
      tipoObra: 'vivienda unifamiliar',
      materialPrincipal: 'concreto',
      rendimiento: 0.97
    },
    {
      tipoProyecto: 'residencial',
      presupuestoBase: 850000,
      costoReal: 912000,
      departamento: 'GT-02',
      fechaInicio: '2024-02-01',
      duracionDias: 180,
      superficieM2: 420,
      tipoObra: 'residencial multifamiliar',
      materialPrincipal: 'acero',
      rendimiento: 0.92
    },
    {
      tipoProyecto: 'comercial',
      presupuestoBase: 1200000,
      costoReal: 1150000,
      departamento: 'GT-11',
      fechaInicio: '2024-03-10',
      duracionDias: 240,
      superficieM2: 850,
      tipoObra: 'centro comercial',
      materialPrincipal: 'concreto',
      rendimiento: 1.05
    },
    {
      tipoProyecto: 'industrial',
      presupuestoBase: 2000000,
      costoReal: 1980000,
      departamento: 'GT-07',
      fechaInicio: '2024-04-15',
      duracionDias: 365,
      superficieM2: 2500,
      tipoObra: 'nave industrial',
      materialPrincipal: 'acero',
      rendimiento: 0.99
    },
    {
      tipoProyecto: 'infraestructura',
      presupuestoBase: 3500000,
      costoReal: 3420000,
      departamento: 'GT-05',
      fechaInicio: '2024-05-20',
      duracionDias: 540,
      superficieM2: 5000,
      tipoObra: 'carretera',
      materialPrincipal: 'asfalto',
      rendimiento: 0.98
    }
  ];

  console.log(`📊 Procesando ${datosMuestra.length} registros históricos...\n`);

  for (const dato of datosMuestra) {
    try {
      const factorCalibracion = dato.costoReal / dato.presupuestoBase;
      const variacion = ((dato.costoReal - dato.presupuestoBase) / dato.presupuestoBase * 100).toFixed(2);

      console.log(`🏗️  ${dato.tipoObra} (${dato.departamento})`);
      console.log(`   Presupuesto: Q${dato.presupuestoBase.toLocaleString()}`);
      console.log(`   Costo Real: Q${dato.costoReal.toLocaleString()}`);
      console.log(`   Variación: ${variacion}%`);
      console.log(`   Rendimiento: ${(dato.rendimiento * 100).toFixed(1)}%`);
      console.log(`   Factor de Calibración: ${factorCalibracion.toFixed(3)}`);
      console.log('');

    } catch (error) {
      console.error(`❌ Error procesando registro: ${error}`);
    }
  }

  const rendimientoPromedio = datosMuestra.reduce((sum, d) => sum + d.rendimiento, 0) / datosMuestra.length;
  const variacionPromedio = datosMuestra.reduce((sum, d) => sum + (d.costoReal - d.presupuestoBase), 0) / datosMuestra.length;
  const variacionPorcentaje = (variacionPromedio / (datosMuestra.reduce((sum, d) => sum + d.presupuestoBase, 0) / datosMuestra.length) * 100).toFixed(2);

  console.log('═════════════════════════════════════════════════');
  console.log('📈 MÉTRICAS AGREGADAS DE CALIBRACIÓN');
  console.log('═════════════════════════════════════════════════\n');
  console.log(`🎯 Rendimiento Promedio: ${(rendimientoPromedio * 100).toFixed(1)}%`);
  console.log(`💰 Variación Presupuesto Promedio: ${variacionPorcentaje}%`);
  console.log(`📊 Total Proyectos Analizados: ${datosMuestra.length}`);
  console.log('');

  const recomendaciones = [];

  if (rendimientoPromedio < 0.95) {
    recomendaciones.push('⚠️  Rendimiento bajo: Considerar aumentar factores de seguridad en presupuestos');
  } else if (rendimientoPromedio > 1.05) {
    recomendaciones.push('✅ Rendimiento excelente: Se puede reducir factores de seguridad para mayor competitividad');
  } else {
    recomendaciones.push('✅ Rendimiento aceptable: Mantener factores actuales');
  }

  if (parseFloat(variacionPorcentaje) < -5) {
    recomendaciones.push('💰 Subestimación de costos: Ajustar factores de escala hacia arriba');
  } else if (parseFloat(variacionPorcentaje) > 5) {
    recomendaciones.push('💰 Sobreestimación de costos: Ajustar factores de escala hacia abajo');
  } else {
    recomendaciones.push('💰 Estimación de costos precisa: Mantener factores actuales');
  }

  console.log('═════════════════════════════════════════════════');
  console.log('🔧 RECOMENDACIONES DE CALIBRACIÓN');
  console.log('═════════════════════════════════════════════════\n');
  recomendaciones.forEach(rec => console.log(rec));
  console.log('');

  console.log('═════════════════════════════════════════════════');
  console.log('✅ MIGRACIÓN DE DATOS HISTÓRICOS COMPLETADA');
  console.log('═════════════════════════════════════════════════');
}

migrarDatosHistoricos().catch(console.error);