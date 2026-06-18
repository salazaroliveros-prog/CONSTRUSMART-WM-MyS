import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env' });

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_KEY!;

const supabase = createClient(url, key);

async function main() {
  const report: string[] = [];
  report.push(`Supabase project: ${url}`);
  report.push(`Time: ${new Date().toISOString()}`);
  report.push('');

  const { data: tablesData, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_schema, table_name')
    .in('table_schema', ['public'])
    .order('table_name');

  if (tablesError) {
    report.push(`ERROR listing tables: ${tablesError.message}`);
    fs.writeFileSync('supabase-schema-audit.txt', report.join('\n'));
    process.exit(1);
  }

  const tables = (tablesData || []) as Array<{ table_schema: string; table_name: string }>;
  report.push(`TABLES IN PUBLIC SCHEMA (${tables.length}):`);
  tables.forEach(t => report.push(`  - ${t.table_name}`));
  report.push('');

  const erpTables = tables.filter(t => t.table_name.startsWith('erp_') || t.table_name === 'recepciones_almacen');

  for (const table of erpTables.slice(0, 30)) {
    const { data: colsData, error: colsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', table.table_name)
      .order('ordinal_position');

    if (colsError) {
      report.push(`TABLE ${table.table_name}: ERROR getting columns - ${colsError.message}`);
      continue;
    }

    const cols = (colsData || []) as Array<{ column_name: string; data_type: string; is_nullable: string }>;
    report.push(`TABLE ${table.table_name} (${cols.length} cols):`);
    cols.forEach(c => report.push(`  [${c.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'}] ${c.column_name} :: ${c.data_type}`));
    report.push('');
  }

  fs.writeFileSync('supabase-schema-audit.txt', report.join('\n'));
  console.log('Schema audit written to supabase-schema-audit.txt');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
