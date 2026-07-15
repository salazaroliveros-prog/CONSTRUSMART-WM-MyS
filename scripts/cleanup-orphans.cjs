/**
 * Limpieza controlada de archivos obsoletos/huérfanos.
 * No elimina migraciones sin antes alinear la lista exacta consumida por la app.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const deleteIfExists = (rel) => {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return false;
  fs.rmSync(p, { recursive: true, force: true });
  console.log('🗑 deleted:', rel);
  return true;
};

const maybeDelete = (rel) => {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return;
  console.log('🧩 candidate delete:', rel);
};

const deleted = [];

// Solo candidatos claramente obsoletos fuera de migraciones por ahora.
const candidates = [
  'APPLY_SECURITY_FIX.sql',
  'audit_report.json',
  'audit_supabase_schema.md',
  'AUTH_URLS_CONFIGURATION.md',
  'AUTOMATED_VS_MANUAL.md',
  'CONCLUSION.md',
  'CONTRIBUTING.md',
  'CREDENTIALS_AUDIT_REPORT.md',
  'EJECUCION_COMPLETADA.md',
  'EJECUTAR_MIGRACIONES_MANUAL.md',
  'ENTREGA_COMPLETA.md',
  'FULL_FUNCTIONALITY_TEST_REPORT.md',
  'GAP_ANALYSIS_COMPLETO.md',
  'INICIO.md',
  'MAPEO_ANALISIS_COMPLETO.md',
  'MOBILE_OPTIMIZATION_GUIDE.md',
  'PENDING_WORK_SESSION_2.md',
  'PLATFORM_CONFIGURATION_FINAL_REPORT.md',
  'PROYECTO_COMPLETADO.md',
  'q-dev-chat-2026-07-12.md',
  'RESUMEN_EJECUTIVO.md',
  'RESUMEN_FINAL_PRODUCCION.md',
  'SCHEMA_ALIGNMENT_REPORT.md',
  'SESSION_TODO_LIST.md',
  'TIER2_COMPLETADA.md',
  'TIER3_COMPLETADA.md',
  'TODO_PENDIENTE.md',
  'UX_UI_ANALISIS_COMPLETO.md',
  'VERCEL_DEPLOYMENT_REPORT.md',
  'WEATHER_MIGRATION_GUIDE.md',
  'screenshot-home.png',
  'screenshot-login.png',
  'session-ses_0b41.md',
  'session-ses_0bbb.md',
  'session-ses_0cd1.md',
  'SUPABASE_DB_VERIFICATION_REPORT.md',
  'tsconfig.app.tsbuildinfo',
  'tsconfig.node.tsbuildinfo'
];

// Scripts legacy claramente reemplazados/duplicados
const legacyScripts = [
  'execute-migrations.js',
  'execute_migration.bat',
  'run_migrations.sh',
  'run_production_audit.cjs',
  'run_remote_migrations.bat'
];

for (const c of candidates) {
  if (deleteIfExists(c)) deleted.push(c);
}
for (const c of legacyScripts) {
  if (deleteIfExists(c)) deleted.push(c);
}

if (!deleted.length) {
  console.log('No se eliminaron archivos.');
} else {
  console.log(`Eliminados: ${deleted.length}`);
}