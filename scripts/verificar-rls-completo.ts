import * as fs from 'fs';
import * as path from 'path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

// 1. Extraer todas las políticas RLS definidas en migrations
const rlsPolicies = new Map<string, Array<{ action: string; name: string }>>();
for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  const policyRegex = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+(\w+)\s+FOR\s+(SELECT|INSERT|UPDATE|DELETE)/gi;
  let m;
  while ((m = policyRegex.exec(sql)) !== null) {
    const [, name, table, action] = m;
    if (!rlsPolicies.has(table)) rlsPolicies.set(table, []);
    rlsPolicies.get(table)!.push({ action: action.toLowerCase(), name });
  }
}

console.log(`=== POLÍTICAS RLS EN MIGRATIONS ===`);
console.log(`${rlsPolicies.size} tablas con políticas RLS definidas:\n`);
rlsPolicies.forEach((pols, tbl) => {
  console.log(`\n${tbl}:`);
  pols.forEach(p => console.log(`  - ${p.action}: ${p.name}`));
});

// 2. Verificar qué tablas erp_* están en migrations pero sin política RLS
const dbTables = new Set<string>();
for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  const tableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(erp_[a-z_]+)/gi;
  let m;
  while ((m = tableRe.exec(sql)) !== null) dbTables.add(m[1]);
}

console.log('\n=== TABLAS SIN POLÍTICA RLS ===');
const sinRLS = [...dbTables].filter(t => !rlsPolicies.has(t));
if (sinRLS.length === 0) {
  console.log('✅ TODAS las tablas erp_* tienen políticas RLS en migrations');
} else {
  console.log(`⚠️ ${sinRLS.length} tablas sin RLS en migrations:`);
  sinRLS.forEach(t => console.log(`  - ${t}`));
}

// 3. Columnas esperadas por tabla críticas según app
const expectedColumns: Record<string, string[]> = {
  erp_proyectos: [
    'id', 'nombre', 'cliente', 'ubicacion', 'tipologia', 'estado',
    'presupuesto_total', 'monto_contrato', 'avance_fisico', 'avance_financiero',
    'lat', 'lng', 'fecha_inicio', 'fecha_fin', 'created_by', 'created_at', 'updated_at',
    'presupuesto_actual_id', 'factor_sobrecosto', 'descripcion', 'subtipo', 'tipo_obra',
    'cliente_nit', 'cliente_telefono', 'cliente_email', 'direccion', 'ciudad',
    'departamento', 'pais', 'codigo_postal', 'area_construccion', 'num_pisos',
    'plazo_semanas', 'ingeniero_residente', 'supervisor', 'arquitecto',
    'numero_expediente', 'numero_licencia', 'margen_utilidad_objetivo', 'moneda',
    'etapa', 'fecha_inicio_real', 'fecha_fin_estimada', 'version', 'motivo_pausa',
    'pausado_por', 'fecha_pausa', 'fecha_reanudacion_estimada'
  ],
  erp_notificaciones: [
    'id', 'tipo', 'titulo', 'mensaje', 'proyecto_id', 'referencia_id', 'leido',
    'created_at', 'created_by', 'updated_at'
  ],
  erp_presupuestos: [
    'id', 'proyecto_id', 'tipologia', 'renglones', 'total_calculado',
    'costo_directo_total', 'estado', 'notas', 'version_presupuesto',
    'fecha_creacion', 'fecha_actualizacion', 'created_by', 'updated_by'
  ],
  erp_ordenes_compra: [
    'id', 'proveedor', 'material', 'cantidad', 'monto', 'items', 'estado',
    'fecha', 'created_by', 'created_at', 'updated_at'
  ],
  erp_movimientos: [
    'id', 'tipo', 'proyecto_id', 'descripcion', 'cantidad', 'unidad',
    'categoria', 'costo_unitario', 'costo_total', 'fecha', 'created_by',
    'created_at', 'updated_at'
  ]
};

console.log('\n=== COLUMNAS ESPERADAS vs MIGRATIONS ===');
for (const [table, expected] of Object.entries(expectedColumns)) {
  let tableSql = '';
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const lines = sql.split('\n');
    let inTable = false;
    const cols: string[] = [];
    for (const line of lines) {
      if (new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${table}\\b`, 'i').test(line)) {
        inTable = true;
        continue;
      }
      if (inTable) {
        if (/^\s*\);/.test(line.trim())) break;
        const col = line.match(/^\s+(\w+)\s+/);
        if (col && !line.trim().startsWith('--') && !line.trim().startsWith('/*') && !line.trim().startsWith(')')) {
          cols.push(col[1]);
        }
      }
    }
    if (cols.length > 0) {
      tableSql = cols.join(', ');
      break;
    }
  }
  const missing = expected.filter(c => !tableSql.includes(c));
  if (missing.length === 0) {
    console.log(`\n✅ ${table}: ${expected.length}/${expected.length} columnas OK`);
  } else {
    console.log(`\n❌ ${table}: faltan ${missing.length} columnas en migrations:`);
    missing.forEach(c => console.log(`  - ${c}`));
  }
}

console.log('\n=== FIN DE VERIFICACIÓN ===');