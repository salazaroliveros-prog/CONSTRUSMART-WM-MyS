#!/usr/bin/env node

/**
 * Script principal para ejecutar automatización de configuración de plataformas
 * 
 * USO:
 * npx tsx scripts/automation/run-automation.ts
 * 
 * Este script ejecutará los tests de Playwright en orden:
 * 1. Google Cloud Console OAuth Configuration
 * 2. Supabase Authentication Configuration
 * 3. Vercel Environment Variables Configuration
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando automatización de configuración de plataformas...\n');

const scripts = [
  {
    name: 'Google Cloud Console OAuth',
    file: 'google-cloud-oauth.spec.ts',
    description: 'Configurar Authorized Origins y Redirect URIs'
  },
  {
    name: 'Supabase Authentication',
    file: 'supabase-auth.spec.ts',
    description: 'Configurar Site URL, Redirect URLs y Google Provider'
  },
  {
    name: 'Vercel Environment Variables',
    file: 'vercel-env.spec.ts',
    description: 'Configurar VITE_OPENWEATHER_API_KEY en Preview'
  }
];

async function runScript(script) {
  console.log(`\n📋 ${script.name}`);
  console.log(`📝 ${script.description}`);
  console.log(`📁 Archivo: ${script.file}`);
  console.log('─'.repeat(60));
  
  try {
    const configPath = path.join(__dirname, 'playwright.config.automation.ts');
    const scriptPath = path.join(__dirname, script.file);
    
    // Cambiar al directorio de scripts/automation y ejecutar desde ahí
    const command = `npx playwright test ${script.file} --config=playwright.config.automation.ts --project=chromium`;
    
    console.log(`\n⚠️ IMPORTANTE: El navegador se abrirá en modo NO headless`);
    console.log(`⚠️ Deberás iniciar sesión manualmente en cada plataforma`);
    console.log(`⚠️ El script esperará 60 segundos para que completes el login\n`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: __dirname,
      shell: true
    });
    
    console.log(`\n✅ ${script.name} completado exitosamente`);
    return true;
    
  } catch (error) {
    console.error(`\n❌ ${script.name} falló:`, error.message);
    return false;
  }
}

async function main() {
  console.log('⚠️ PREPARACIÓN:');
  console.log('1. Asegúrate de tener tus credenciales de Google Cloud listas');
  console.log('2. Asegúrate de tener tus credenciales de Supabase listas');
  console.log('3. Asegúrate de tener tus credenciales de Vercel listas');
  console.log('4. El navegador se abrirá en modo visible (NO headless)');
  console.log('5. Deberás hacer login manualmente en cada plataforma\n');
  
  console.log('🎯 Scripts a ejecutar:');
  scripts.forEach((script, index) => {
    console.log(`${index + 1}. ${script.name}: ${script.description}`);
  });
  
  console.log('\n⏱️  Tiempo estimado total: 5-10 minutos\n');
  
  const answer = process.argv[2];
  
  if (answer !== '--yes') {
    console.log('❓ ¿Deseas continuar? ( Usa --yes para saltar esta pregunta )');
    console.log('   Ejecuta: node scripts/automation/run-automation.ts --yes\n');
    process.exit(0);
  }
  
  const results = [];
  
  for (const script of scripts) {
    const success = await runScript(script);
    results.push({ name: script.name, success });
    
    if (!success) {
      console.log(`\n⚠️ ${script.name} falló. ¿Deseas continuar con el siguiente script?`);
      console.log('   Presiona Ctrl+C para detener o espera 5 segundos para continuar...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Esperar entre scripts
    console.log('\n⏱️  Esperando 3 segundos antes del siguiente script...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE EJECUCIÓN');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 Resultado: ${successCount}/${totalCount} scripts completados exitosamente`);
  console.log('='.repeat(60));
  
  if (successCount === totalCount) {
    console.log('\n🎉 ¡Todos los scripts de automatización completados exitosamente!');
    console.log('✅ Configuración de plataformas completada');
  } else {
    console.log('\n⚠️ Algunos scripts fallaron. Revisa los logs arriba para más detalles.');
    console.log('💡 Puedes re-ejecutar scripts individuales si es necesario.');
  }
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
