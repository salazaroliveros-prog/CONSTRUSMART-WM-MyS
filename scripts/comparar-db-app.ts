import * as fs from 'fs';
import * as path from 'path';

// 1. TABLE_MAP keys — están SIN comillas, ej: erp_proyectos:'proyectos'
const tableMapPath = path.join(process.cwd(), 'src', 'erp', 'constants', 'table-mappings.ts');
const content = fs.readFileSync(tableMapPath, 'utf-8');
const appTables: string[] = [];
const regex = /\b(erp_[a-z_]+)\s*:/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  appTables.push(match[1]);
}
const uniqueAppTables = [...new Set(appTables)].sort();
console.log(`=== TABLAS EN APP (TABLE_MAP) ===`);
console.log(`Found ${uniqueAppTables.length} table references:\n`);
uniqueAppTables.forEach(t => console.log(`  ${t}`));

// 2. Migrations
const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

const dbTables = new Set<string>();
const dbViews = new Set<string>();
for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  // CREATE TABLE
  let m;
  const tableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(erp_[a-z_]+)/gi;
  while ((m = tableRe.exec(sql)) !== null) dbTables.add(m[1]);
  // CREATE VIEW
  const viewRe = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(erp_[a-z_]+)/gi;
  while ((m = viewRe.exec(sql)) !== null) dbViews.add(m[1]);
  // ALTER TABLE ... RENAME TO
  const renameRe = /RENAME\s+TO\s+(erp_[a-z_]+)/gi;
  while ((m = renameRe.exec(sql)) !== null) dbTables.add(m[1]);
}

const dbAll = [...new Set([...dbTables, ...dbViews])].sort();
console.log(`\n=== TABLAS EN MIGRATIONS (${dbTables.size} tables + ${dbViews.size} views) ===\n`);
dbAll.forEach(t => console.log(`  ${t}${dbViews.has(t) ? ' (VIEW)' : ''}`));

// 3. Diff
const appSet = new Set(uniqueAppTables);
const dbSet = new Set(dbAll);

const missingInDB = uniqueAppTables.filter(t => !dbSet.has(t));
const missingInApp = dbAll.filter(t => !appSet.has(t));

console.log('\n========== DISCREPANCIAS ==========');
if (missingInDB.length === 0 && missingInApp.length === 0) {
  console.log('✅ ALINEACIÓN TOTAL');
} else {
  if (missingInDB.length > 0) {
    console.log(`\n🔴 TABLAS EN APP QUE NO EXISTEN EN MIGRATIONS (${missingInDB.length}):`);
    missingInDB.forEach(t => console.log(`  - ${t}`));
  }
  if (missingInApp.length > 0) {
    console.log(`\n🟡 TABLAS EN MIGRATIONS NO REFERENCIADAS EN APP (${missingInApp.length}):`);
    missingInApp.forEach(t => console.log(`  - ${t}`));
  }
}

// 4. Columnas críticas
console.log('\n=== COLUMNAS TABLAS CRITICAS ===');
const criticalTables = ['erp_proyectos', 'erp_presupuestos', 'erp_ordenes_compra', 'erp_movimientos'];
for (const tbl of criticalTables) {
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const lines = sql.split('\n');
    let inTable = false;
    let cols: string[] = [];
    for (const line of lines) {
      if (new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${tbl}\\b`, 'i').test(line)) { inTable = true; continue; }
      if (inTable) {
        if (/^\s*\);/.test(line.trim()) || /^\s*\);$/.test(line)) break;
        const col = line.match(/^\s+(\w+)\s+/);
        if (col && !line.trim().startsWith('--') && !line.trim().startsWith('/*') && !line.trim().startsWith(')')) {
          cols.push(col[1]);
        }
      }
    }
    if (cols.length > 0) {
      console.log(`\n  ${tbl} (${cols.length} cols):`);
      cols.forEach(c => console.log(`    ${c}`));
      break;
    }
  }
}

// 5. Estado y schema de Proyecto vs DB
console.log('\n=== ESTADO Y ETAPA en DB vs APP ===');
const estadoCol = fs.readFileSync(path.join(migrationsDir, files.find(f => {
  const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf-8');
  return sql.includes('erp_proyectos') && (sql.includes('CHECK') || sql.includes("'planeacion'"));
}) || files[0]), 'utf-8');
const estadoMatch = estadoCol.match(/estado\s+[^,]+/i);
if (estadoMatch) console.log(`  DB: ${estadoMatch[0]}`);
const etapaMatch = estadoCol.match(/etapa\s+[^,]+/i);
if (etapaMatch) console.log(`  DB: ${etapaMatch[0]}`);

console.log('\n  APP (types.ts):');
const typesContent = fs.readFileSync(path.join(process.cwd(), 'src', 'erp', 'types.ts'), 'utf-8');
const estadoApp = typesContent.match(/estado:\s*'[^']*'(\s*\|\s*'[^']*')*/);
if (estadoApp) console.log(`    estado: ${estadoApp[0].trim()}`);
const etapaApp = typesContent.match(/etapa:\s*EtapaObra/);
if (etapaApp) console.log(`    etapa: EtapaObra`);
const tipologiaApp = typesContent.match(/tipologia:\s*'[^']*'(\s*\|\s*'[^']*')*/);
if (tipologiaApp) console.log(`    tipologia: ${tipologiaApp[0].trim()}`);

console.log('\n--- FIN ---');