import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjA4OTIsImV4cCI6MjA5NTgzNjg5Mn0.IfCMtFbZYL0GDgV_3zwqBmqjCNf3PZfYS-SvbRGXhY0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEsquema() {
  console.log('🔍 Verificando esquema de tablas...\n');

  const tablas = ['erp_departamentos_gt', 'erp_dosificaciones_concreto', 'erp_referencias_acero'];

  for (const tabla of tablas) {
    try {
      const { data, error } = await supabase
        .from(tabla as any)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`❌ ${tabla}: ${error.message}`);
      } else {
        console.log(`✅ ${tabla}: Esquema OK`);
        
        // Mostrar columnas
        if (data && data.length > 0) {
          const columnas = Object.keys(data[0]);
          console.log(`   Columnas: ${columnas.join(', ')}`);
        }
      }
    } catch (error: any) {
      console.log(`❌ ${tabla}: ${error.message}`);
    }
  }
}

verificarEsquema().catch(console.error);