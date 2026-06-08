/**
 * Script para aplicar correcciones SQL a Supabase via Management API
 * Ejecutar con: TOKEN=<tu-token> node scripts/apply-supabase-fixes.js
 */
const API = 'https://api.supabase.com/v1/projects/neygzluxugodiwcuctbj/database/query';
const TOKEN = process.env.TOKEN || '';

if (!TOKEN) {
  console.error('Error: TOKEN environment variable is required');
  process.exit(1);
}