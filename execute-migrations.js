// execute-migrations.js
// Script para ejecutar migraciones en Supabase local

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuración Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // Key local
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  try {
    console.log('📚 ConstruSmart - Ejecutor de Migraciones');
    console.log('═'.repeat(50));
    console.log(`🔗 Conectando a: ${supabaseUrl}`);
    
    // Leer archivo de migración
    const migrationPath = path.join(__dirname, 'supabase/migrations/0100_tier1_critical_fixes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log(`📄 Migración cargada: 320 líneas`);
    console.log('');
    
    // Dividir por sentencias y ejecutar
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    console.log(`⚙️  Sentencias SQL detectadas: ${statements.length}`);
    console.log('');
    
    let executed = 0;
    let errors = [];
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';
      
      try {
        const { data, error } = await supabase.rpc('sql', { query: stmt });
        
        if (error) {
          errors.push(`Stmt ${i}: ${error.message}`);
          console.log(`❌ [${i+1}/${statements.length}] ${preview}`);
        } else {
          executed++;
          console.log(`✅ [${i+1}/${statements.length}] ${preview}`);
        }
      } catch (e) {
        errors.push(`Stmt ${i}: ${e.message}`);
        console.log(`❌ [${i+1}/${statements.length}] ${preview}`);
      }
      
      // Pequeña pausa entre ejecuciones
      await new Promise(r => setTimeout(r, 50));
    }
    
    console.log('');
    console.log('═'.repeat(50));
    console.log(`📊 Resultado: ${executed}/${statements.length} sentencias ejecutadas`);
    
    if (errors.length > 0) {
      console.log(`⚠️  Errores encontrados: ${errors.length}`);
      errors.forEach((e, i) => console.log(`   ${i+1}. ${e}`));
    } else {
      console.log('✅ Todas las migraciones ejecutadas correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

executeMigration();
