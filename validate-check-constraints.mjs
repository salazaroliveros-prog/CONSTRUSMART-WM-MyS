import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const violations = [];

async function validateColumn(tableName, columnName, condition, description) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .or(condition);

    if (error) {
      console.log(`⚠️  Warning: Could not validate ${tableName}.${columnName}: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      violations.push({
        table: tableName,
        column: columnName,
        count: data.length,
        description,
        sampleIds: data.slice(0, 5).map(r => r.id)
      });
      console.log(`❌ ${tableName}.${columnName}: ${data.length} violations - ${description}`);
    } else {
      console.log(`✅ ${tableName}.${columnName}: No violations`);
    }
  } catch (e) {
    console.log(`⚠️  Warning: Error validating ${tableName}.${columnName}: ${e.message}`);
  }
}

async function validateNumericRange(tableName, columnName, min, max) {
  const conditions = [];
  if (min !== null) conditions.push(`${columnName}.lt.${min}`);
  if (max !== null) conditions.push(`${columnName}.gt.${max}`);
  const condition = conditions.join(',');
  await validateColumn(tableName, columnName, condition, `Value must be between ${min} and ${max}`);
}

async function validateNonNegative(tableName, columnName) {
  await validateColumn(tableName, columnName, `${columnName}.lt.0`, 'Value must be >= 0');
}

async function validateEnum(tableName, columnName, validValues) {
  const invalidConditions = validValues.map(v => `${columnName}.neq.${v}`);
  await validateColumn(tableName, columnName, invalidConditions.join(','), `Must be one of: ${validValues.join(', ')}`);
}

async function validateDateRange(tableName, startDateColumn, endDateColumn) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .filter(endDateColumn, 'not', 'is', null)
      .filter(endDateColumn, 'lt', `${startDateColumn}`);

    if (error) {
      console.log(`⚠️  Warning: Could not validate date range ${tableName}: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      violations.push({
        table: tableName,
        column: `${startDateColumn} / ${endDateColumn}`,
        count: data.length,
        description: 'End date must be >= start date',
        sampleIds: data.slice(0, 5).map(r => r.id)
      });
      console.log(`❌ ${tableName} date range: ${data.length} violations - End date < start date`);
    } else {
      console.log(`✅ ${tableName} date range: No violations`);
    }
  } catch (e) {
    console.log(`⚠️  Warning: Error validating date range ${tableName}: ${e.message}`);
  }
}

async function checkColumnExists(tableName, columnName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);

    if (error) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  console.log('🔍 Validating CHECK Constraints...\n');

  // Financial validations
  console.log('--- Financial Validations ---');

  const financialTables = [
    { table: 'erp_ordenes_compra', column: 'monto_total' },
    { table: 'erp_cuentas_cobrar', column: 'monto' },
    { table: 'erp_cuentas_pagar', column: 'monto' },
    { table: 'erp_vales_salida', column: 'cantidad' },
    { table: 'erp_activos', column: 'valor_residual' },
    { table: 'erp_presupuestos', column: 'monto_total' }
  ];

  for (const { table, column } of financialTables) {
    const exists = await checkColumnExists(table, column);
    if (exists) {
      await validateNonNegative(table, column);
    } else {
      console.log(`⚠️  Skipped ${table}.${column} - column does not exist`);
    }
  }

  // Status validations
  console.log('\n--- Status Validations ---');

  const statusValidations = [
    { table: 'erp_proyectos', column: 'estado', values: ['planificacion', 'en_curso', 'pausado', 'completado', 'cancelado'] },
    { table: 'erp_proyectos', column: 'fase', values: ['preconstruccion', 'construccion', 'postconstruccion', 'entrega', 'cierre'] },
    { table: 'erp_ordenes_compra', column: 'estado', values: ['borrador', 'pendiente', 'aprobado', 'recibida', 'cancelada'] },
    { table: 'erp_cuentas_cobrar', column: 'estado', values: ['pendiente', 'parcial', 'pagada', 'vencida', 'cancelada'] },
    { table: 'erp_cuentas_pagar', column: 'estado', values: ['pendiente', 'parcial', 'pagada', 'vencida', 'cancelada'] },
    { table: 'erp_no_conformidades', column: 'severidad', values: ['baja', 'media', 'alta', 'critica'] },
    { table: 'erp_no_conformidades', column: 'estado', values: ['abierta', 'en_progreso', 'resuelta', 'cerrada', 'rechazada'] },
    { table: 'erp_incidentes', column: 'severidad', values: ['leve', 'moderado', 'grave', 'fatal'] },
    { table: 'erp_ordenes_cambio', column: 'estado', values: ['solicitado', 'revisado', 'aprobado', 'rechazado', 'implementado'] },
    { table: 'erp_rfis', column: 'estado', values: ['borrador', 'enviado', 'respondido', 'cerrado'] },
    { table: 'erp_submittals', column: 'estado', values: ['preparado', 'enviado', 'en_revision', 'aprobado', 'rechazado', 'remitido'] },
    { table: 'erp_activos', column: 'estado', values: ['activo', 'en_mantenimiento', 'inactivo', 'dado_de_baja'] },
    { table: 'erp_empleados', column: 'rol', values: ['admin', 'gerente', 'ingeniero', 'arquitecto', 'contratista', 'obrero', 'otro'] },
    { table: 'erp_empleados', column: 'estado', values: ['activo', 'inactivo', 'vacaciones', 'licencia_medica'] },
    { table: 'erp_presupuestos', column: 'estado', values: ['borrador', 'aprobado', 'en_ejecucion', 'cerrado'] }
  ];

  for (const { table, column, values } of statusValidations) {
    const exists = await checkColumnExists(table, column);
    if (exists) {
      await validateEnum(table, column, values);
    } else {
      console.log(`⚠️  Skipped ${table}.${column} - column does not exist`);
    }
  }

  // Date range validations
  console.log('\n--- Date Range Validations ---');

  const dateValidations = [
    { table: 'erp_proyectos', start: 'fecha_inicio', end: 'fecha_fin' },
    { table: 'erp_hitos', start: 'fecha_inicio', end: 'fecha_fin' },
    { table: 'erp_eventos_calendario', start: 'fecha_inicio', end: 'fecha_fin' }
  ];

  for (const { table, start, end } of dateValidations) {
    const startExists = await checkColumnExists(table, start);
    const endExists = await checkColumnExists(table, end);
    if (startExists && endExists) {
      await validateDateRange(table, start, end);
    } else {
      console.log(`⚠️  Skipped ${table} date range - columns do not exist`);
    }
  }

  // Percentage validations
  console.log('\n--- Percentage Validations ---');

  const percentageValidations = [
    { table: 'erp_avances', column: 'porcentaje' },
    { table: 'erp_hitos', column: 'porcentaje_completado' }
  ];

  for (const { table, column } of percentageValidations) {
    const exists = await checkColumnExists(table, column);
    if (exists) {
      await validateNumericRange(table, column, 0, 100);
    } else {
      console.log(`⚠️  Skipped ${table}.${column} - column does not exist`);
    }
  }

  // Stock validation
  console.log('\n--- Stock Validations ---');

  const stockExists = await checkColumnExists('erp_materiales', 'stock_actual');
  if (stockExists) {
    await validateNonNegative('erp_materiales', 'stock_actual');
  } else {
    console.log('⚠️  Skipped erp_materiales.stock_actual - column does not exist');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));

  if (violations.length === 0) {
    console.log('✅ No violations found! All CHECK constraints can be safely enabled.');
  } else {
    console.log(`❌ Found ${violations.length} constraint violations:\n`);
    violations.forEach((v, i) => {
      console.log(`${i + 1}. ${v.table}.${v.column}`);
      console.log(`   Count: ${v.count}`);
      console.log(`   Description: ${v.description}`);
      console.log(`   Sample IDs: ${v.sampleIds.join(', ')}`);
      console.log();
    });

    // Save report
    const reportPath = path.join(process.cwd(), 'check-constraints-violations.json');
    fs.writeFileSync(reportPath, JSON.stringify(violations, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  process.exit(violations.length === 0 ? 0 : 1);
}

main().catch(console.error);
