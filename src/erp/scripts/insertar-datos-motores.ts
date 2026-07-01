import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_KEY en el entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertarDatos() {
  console.log('🔍 Insertando datos de motores en Supabase remoto...\n');

  // 1. Insertar Departamentos
  console.log('📍 Insertando departamentos de Guatemala...');
  const departamentos = [
    { codigo: 'GT-01', nombre: 'Guatemala', region: 'central', capital: 'Ciudad de Guatemala' },
    { codigo: 'GT-02', nombre: 'Escuintla', region: 'sur', capital: 'Escuintla' },
    { codigo: 'GT-03', nombre: 'Izabal', region: 'nororiente', capital: 'Puerto Barrios' },
    { codigo: 'GT-04', nombre: 'Chiquimula', region: 'oriente', capital: 'Chiquimula' },
    { codigo: 'GT-05', nombre: 'Santa Rosa', region: 'sur', capital: 'Cuilapa' },
    { codigo: 'GT-06', nombre: 'Sololá', region: 'altiplano', capital: 'Sololá' },
    { codigo: 'GT-07', nombre: 'Totonicapán', region: 'altiplano', capital: 'Totonicapán' },
    { codigo: 'GT-08', nombre: 'Quetzaltenango', region: 'altiplano', capital: 'Quetzaltenango' },
    { codigo: 'GT-09', nombre: 'Suchitepéquez', region: 'sur', capital: 'Mazatenango' },
    { codigo: 'GT-10', nombre: 'Retalhuleu', region: 'sur', capital: 'Retalhuleu' },
    { codigo: 'GT-11', nombre: 'San Marcos', region: 'occidente', capital: 'San Marcos' },
    { codigo: 'GT-12', nombre: 'Huehuetenango', region: 'occidente', capital: 'Huehuetenango' },
    { codigo: 'GT-13', nombre: 'El Progreso', region: 'oriente', capital: 'Guastatoya' },
    { codigo: 'GT-14', nombre: 'Baja Verapaz', region: 'verapaz', capital: 'Salamá' },
    { codigo: 'GT-15', nombre: 'Alta Verapaz', region: 'verapaz', capital: 'Cobán' },
    { codigo: 'GT-16', nombre: 'Petén', region: 'norte', capital: 'Flores' },
    { codigo: 'GT-17', nombre: 'Izabal', region: 'nororiente', capital: 'Puerto Barrios' },
    { codigo: 'GT-18', nombre: 'Quiché', region: 'altiplano', capital: 'Santa Cruz del Quiché' },
    { codigo: 'GT-19', nombre: 'Chimaltenango', region: 'central', capital: 'Chimaltenango' },
    { codigo: 'GT-20', nombre: 'Sacatepéquez', region: 'central', capital: 'Antigua Guatemala' },
    { codigo: 'GT-21', nombre: 'Jutiapa', region: 'oriente', capital: 'Jutiapa' },
    { codigo: 'GT-22', nombre: 'Jalapa', region: 'oriente', capital: 'Jalapa' },
  ];

  for (const depto of departamentos) {
    const { error } = await supabase.from('erp_departamentos_gt').insert(depto);
    if (error) {
      console.log(`❌ Error insertando ${depto.nombre}: ${error.message}`);
    } else {
      console.log(`✅ ${depto.nombre} insertado`);
    }
  }

  // 2. Insertar Municipios (sample de 54 para no exceder tiempo)
  console.log('\n📍 Insertando municipios (sample)...');
  const municipiosSample = [
    { codigo: '0101', nombre: 'Guatemala', departamento_codigo: 'GT-01' },
    { codigo: '0102', nombre: 'Santa Catarina Pinula', departamento_codigo: 'GT-01' },
    { codigo: '0103', nombre: 'San José Pinula', departamento_codigo: 'GT-01' },
    { codigo: '0104', nombre: 'San José del Golfo', departamento_codigo: 'GT-01' },
    { codigo: '0105', nombre: 'Palín', departamento_codigo: 'GT-01' },
    { codigo: '0106', nombre: 'San Miguel Petapa', departamento_codigo: 'GT-01' },
    { codigo: '0201', nombre: 'Escuintla', departamento_codigo: 'GT-02' },
    { codigo: '0202', nombre: 'Santa Lucía Cotzumalguapa', departamento_codigo: 'GT-02' },
    { codigo: '0203', nombre: 'La Democracia', departamento_codigo: 'GT-02' },
    { codigo: '0204', nombre: 'Masagua', departamento_codigo: 'GT-02' },
    { codigo: '0205', nombre: 'Siquinalá', departamento_codigo: 'GT-02' },
    { codigo: '0206', nombre: 'Tiquisate', departamento_codigo: 'GT-02' },
    { codigo: '0301', nombre: 'Puerto Barrios', departamento_codigo: 'GT-03' },
    { codigo: '0302', nombre: 'Livingston', departamento_codigo: 'GT-03' },
    { codigo: '0303', nombre: 'El Estor', departamento_codigo: 'GT-03' },
    { codigo: '0304', nombre: 'Morales', departamento_codigo: 'GT-03' },
    { codigo: '0305', nombre: 'Los Amates', departamento_codigo: 'GT-03' },
  ];

  for (const muni of municipiosSample) {
    const { error } = await supabase.from('erp_municipios_gt').insert(muni);
    if (error) {
      console.log(`❌ Error insertando ${muni.nombre}: ${error.message}`);
    } else {
      console.log(`✅ ${muni.nombre} insertado`);
    }
  }

  console.log('\n✅ Datos de geografía insertados');
}

insertarDatos().catch(console.error);