/**
 * MEDIUM-5: Script de Validación de Integridad de Datos
 * 
 * This script validates data integrity in the Supabase database:
 * - Orphaned records (without valid foreign keys)
 * - NULL values in columns that should be NOT NULL
 * - Values out of range (percentages > 100, negative amounts)
 * - Inconsistent dates (end < start)
 * 
 * Generates an HTML report with findings and integrates with error logging.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const results = {
  orphanedRecords: [],
  nullValues: [],
  outOfRange: [],
  inconsistentDates: [],
  summary: {
    totalIssues: 0,
    critical: 0,
    warning: 0,
    info: 0
  }
};

async function validateOrphanedRecords() {
  console.log('Validating orphaned records...');
  
  const checks = [
    {
      table: 'erp_ordenes_compra',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_vales_salida',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_cuentas_cobrar',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_cuentas_pagar',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_avances',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_hitos',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_riesgos',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_planos',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_cuadros',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_bitacora',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_licitaciones',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    },
    {
      table: 'erp_muro',
      column: 'proyecto_id',
      refTable: 'erp_proyectos'
    }
  ];

  for (const check of checks) {
    try {
      // Get all records from the table
      const { data: records, error: recordsError } = await supabase
        .from(check.table)
        .select('id, ' + check.column)
        .not(check.column, 'is', null);
      
      if (recordsError) {
        console.error(`Error fetching ${check.table}:`, recordsError);
        continue;
      }

      if (!records || records.length === 0) {
        continue;
      }

      // Get all valid IDs from the reference table
      const { data: refRecords, error: refError } = await supabase
        .from(check.refTable)
        .select('id');
      
      if (refError) {
        console.error(`Error fetching ${check.refTable}:`, refError);
        continue;
      }

      const validIds = new Set(refRecords ? refRecords.map(r => r.id) : []);
      const orphaned = records.filter(r => !validIds.has(r[check.column]));

      if (orphaned.length > 0) {
        results.orphanedRecords.push({
          table: check.table,
          column: check.column,
          refTable: check.refTable,
          count: orphaned.length,
          records: orphaned.slice(0, 10)
        });
        results.summary.totalIssues += orphaned.length;
        results.summary.critical += orphaned.length;
      }
    } catch (error) {
      console.error(`Error checking ${check.table}.${check.column}:`, error);
    }
  }
}

async function validateNullValues() {
  console.log('Validating NULL values in critical columns...');
  
  const checks = [
    {
      table: 'erp_presupuestos',
      columns: ['monto_total', 'created_at', 'updated_at']
    },
    {
      table: 'erp_ordenes_compra',
      columns: ['estado', 'created_at', 'updated_at']
    },
    {
      table: 'erp_vales_salida',
      columns: ['cantidad', 'created_at', 'updated_at']
    },
    {
      table: 'erp_activos',
      columns: ['valor_residual', 'created_at', 'updated_at']
    },
    {
      table: 'erp_hitos',
      columns: ['fecha_inicio', 'fecha_fin', 'created_at', 'updated_at']
    },
    {
      table: 'erp_cuadros',
      columns: ['fecha', 'created_at', 'updated_at']
    }
  ];

  for (const check of checks) {
    try {
      const { data, error } = await supabase
        .from(check.table)
        .select('id')
        .or(check.columns.map(col => `${col}.is.null`).join(','));
      
      if (error) {
        console.error(`Error checking ${check.table}:`, error);
        continue;
      }

      if (data && data.length > 0) {
        results.nullValues.push({
          table: check.table,
          columns: check.columns,
          count: data.length,
          records: data.slice(0, 10)
        });
        results.summary.totalIssues += data.length;
        results.summary.critical += data.length;
      }
    } catch (error) {
      console.error(`Error checking ${check.table}:`, error);
    }
  }
}

async function validateOutOfRange() {
  console.log('Validating values out of range...');
  
  const checks = [
    {
      table: 'erp_presupuestos',
      column: 'monto_total',
      condition: 'lt.0',
      description: 'Negative amount'
    },
    {
      table: 'erp_ordenes_compra',
      column: 'monto_total',
      condition: 'lt.0',
      description: 'Negative amount'
    },
    {
      table: 'erp_cuentas_cobrar',
      column: 'monto',
      condition: 'lt.0',
      description: 'Negative amount'
    },
    {
      table: 'erp_cuentas_pagar',
      column: 'monto',
      condition: 'lt.0',
      description: 'Negative amount'
    },
    {
      table: 'erp_vales_salida',
      column: 'cantidad',
      condition: 'lte.0',
      description: 'Non-positive quantity'
    },
    {
      table: 'erp_activos',
      column: 'valor_residual',
      condition: 'lt.0',
      description: 'Negative residual value'
    },
    {
      table: 'erp_avances',
      column: 'porcentaje',
      condition: 'lt.0',
      description: 'Percentage < 0'
    },
    {
      table: 'erp_avances',
      column: 'porcentaje',
      condition: 'gt.100',
      description: 'Percentage > 100'
    },
    {
      table: 'erp_hitos',
      column: 'progreso',
      condition: 'lt.0',
      description: 'Progress < 0'
    },
    {
      table: 'erp_hitos',
      column: 'progreso',
      condition: 'gt.100',
      description: 'Progress > 100'
    }
  ];

  for (const check of checks) {
    try {
      const { data, error } = await supabase
        .from(check.table)
        .select('id, ' + check.column)
        .filter(check.column, check.condition);
      
      if (error) {
        console.error(`Error checking ${check.table}.${check.column}:`, error);
        continue;
      }

      if (data && data.length > 0) {
        results.outOfRange.push({
          table: check.table,
          column: check.column,
          condition: check.condition,
          description: check.description,
          count: data.length,
          records: data.slice(0, 10)
        });
        results.summary.totalIssues += data.length;
        results.summary.warning += data.length;
      }
    } catch (error) {
      console.error(`Error checking ${check.table}.${check.column}:`, error);
    }
  }
}

async function validateInconsistentDates() {
  console.log('Validating inconsistent dates...');
  
  const checks = [
    {
      table: 'erp_hitos',
      startDateColumn: 'fecha_inicio',
      endDateColumn: 'fecha_fin'
    },
    {
      table: 'erp_eventos_calendario',
      startDateColumn: 'fecha_inicio',
      endDateColumn: 'fecha_fin'
    },
    {
      table: 'erp_licitaciones',
      startDateColumn: 'fecha_apertura',
      endDateColumn: 'fecha_cierre'
    }
  ];

  for (const check of checks) {
    try {
      const { data, error } = await supabase
        .from(check.table)
        .select('id, ' + check.startDateColumn + ', ' + check.endDateColumn)
        .not(check.startDateColumn, 'is', null)
        .not(check.endDateColumn, 'is', null);
      
      if (error) {
        console.error(`Error checking ${check.table}:`, error);
        continue;
      }

      if (!data || data.length === 0) {
        continue;
      }

      const inconsistent = data.filter(record => {
        const startDate = new Date(record[check.startDateColumn]);
        const endDate = new Date(record[check.endDateColumn]);
        return endDate < startDate;
      });

      if (inconsistent.length > 0) {
        results.inconsistentDates.push({
          table: check.table,
          startDateColumn: check.startDateColumn,
          endDateColumn: check.endDateColumn,
          count: inconsistent.length,
          records: inconsistent.slice(0, 10)
        });
        results.summary.totalIssues += inconsistent.length;
        results.summary.warning += inconsistent.length;
      }
    } catch (error) {
      console.error(`Error checking ${check.table}:`, error);
    }
  }
}

async function logErrorsToDatabase() {
  console.log('Logging errors to database...');
  
  if (results.summary.totalIssues === 0) {
    console.log('No issues to log');
    return;
  }

  const errorMessage = `Data integrity validation found ${results.summary.totalIssues} issues`;
  const context = JSON.stringify(results);

  try {
    const { error } = await supabase.rpc('log_error', {
      p_error_message: errorMessage,
      p_error_code: 'DATA_INTEGRITY_VIOLATION',
      p_error_type: 'database',
      p_severity: results.summary.critical > 0 ? 'critical' : 'warning',
      p_component: 'validate-data-integrity',
      p_function_name: 'main',
      p_context: context
    });

    if (error) {
      console.error('Error logging to database:', error);
    } else {
      console.log('✅ Errors logged to database');
    }
  } catch (error) {
    console.error('Error logging to database:', error);
  }
}

function generateHTMLReport() {
  const timestamp = new Date().toISOString();
  
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Integrity Report - CONSTRUSMART ERP</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .summary-card {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card.total {
      background: #007bff;
      color: white;
    }
    .summary-card.critical {
      background: #dc3545;
      color: white;
    }
    .summary-card.warning {
      background: #ffc107;
      color: #333;
    }
    .summary-card.info {
      background: #17a2b8;
      color: white;
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 32px;
    }
    .summary-card p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: #333;
      border-left: 4px solid #007bff;
      padding-left: 10px;
    }
    .issue-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    .issue-table th,
    .issue-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .issue-table th {
      background: #f8f9fa;
      font-weight: 600;
    }
    .issue-table tr:hover {
      background: #f5f5f5;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge.critical {
      background: #dc3545;
      color: white;
    }
    .badge.warning {
      background: #ffc107;
      color: #333;
    }
    .badge.info {
      background: #17a2b8;
      color: white;
    }
    .timestamp {
      color: #666;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .no-issues {
      background: #d4edda;
      color: #155724;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Data Integrity Report</h1>
    <p class="timestamp">Generated: ${timestamp}</p>
    
    <div class="summary">
      <div class="summary-card total">
        <h3>${results.summary.totalIssues}</h3>
        <p>Total Issues</p>
      </div>
      <div class="summary-card critical">
        <h3>${results.summary.critical}</h3>
        <p>Critical</p>
      </div>
      <div class="summary-card warning">
        <h3>${results.summary.warning}</h3>
        <p>Warnings</p>
      </div>
      <div class="summary-card info">
        <h3>${results.summary.info}</h3>
        <p>Info</p>
      </div>
    </div>`;

  if (results.summary.totalIssues === 0) {
    html += `
    <div class="no-issues">
      <h2>✅ No Issues Found</h2>
      <p>All data integrity checks passed successfully.</p>
    </div>`;
  } else {
    if (results.orphanedRecords.length > 0) {
      html += `
    <div class="section">
      <h2>Orphaned Records</h2>
      <table class="issue-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Column</th>
            <th>Reference Table</th>
            <th>Count</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>`;
      
      for (const issue of results.orphanedRecords) {
        html += `
          <tr>
            <td>${issue.table}</td>
            <td>${issue.column}</td>
            <td>${issue.refTable}</td>
            <td>${issue.count}</td>
            <td><span class="badge critical">Critical</span></td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    if (results.nullValues.length > 0) {
      html += `
    <div class="section">
      <h2>NULL Values in Critical Columns</h2>
      <table class="issue-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Columns</th>
            <th>Count</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>`;
      
      for (const issue of results.nullValues) {
        html += `
          <tr>
            <td>${issue.table}</td>
            <td>${issue.columns.join(', ')}</td>
            <td>${issue.count}</td>
            <td><span class="badge critical">Critical</span></td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    if (results.outOfRange.length > 0) {
      html += `
    <div class="section">
      <h2>Values Out of Range</h2>
      <table class="issue-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Column</th>
            <th>Condition</th>
            <th>Description</th>
            <th>Count</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>`;
      
      for (const issue of results.outOfRange) {
        html += `
          <tr>
            <td>${issue.table}</td>
            <td>${issue.column}</td>
            <td>${issue.condition}</td>
            <td>${issue.description}</td>
            <td>${issue.count}</td>
            <td><span class="badge warning">Warning</span></td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    if (results.inconsistentDates.length > 0) {
      html += `
    <div class="section">
      <h2>Inconsistent Dates</h2>
      <table class="issue-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Count</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>`;
      
      for (const issue of results.inconsistentDates) {
        html += `
          <tr>
            <td>${issue.table}</td>
            <td>${issue.startDateColumn}</td>
            <td>${issue.endDateColumn}</td>
            <td>${issue.count}</td>
            <td><span class="badge warning">Warning</span></td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }
  }

  html += `
  </div>
</body>
</html>`;

  return html;
}

async function generateReport() {
  console.log('Generating HTML report...');
  
  const html = generateHTMLReport();
  const reportPath = join(__dirname, '..', 'data-integrity-report.html');
  
  writeFileSync(reportPath, html, 'utf8');
  console.log(`✅ Report generated: ${reportPath}`);
}

async function main() {
  console.log('=== Data Integrity Validation ===\n');
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    await validateOrphanedRecords();
    await validateNullValues();
    await validateOutOfRange();
    await validateInconsistentDates();
    
    console.log('\n=== Summary ===');
    console.log(`Total Issues: ${results.summary.totalIssues}`);
    console.log(`Critical: ${results.summary.critical}`);
    console.log(`Warnings: ${results.summary.warning}`);
    console.log(`Info: ${results.summary.info}`);
    
    await logErrorsToDatabase();
    await generateReport();
    
    console.log('\n✅ Data integrity validation complete');
    
    if (results.summary.totalIssues > 0) {
      console.log(`⚠️  Found ${results.summary.totalIssues} issues - review the HTML report`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
