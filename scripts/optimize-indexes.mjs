/**
 * MEDIUM-6: Script de Optimización de Índices
 * 
 * This script analyzes index usage in the Supabase database:
 * - Unused indexes (idx_scan = 0)
 * - Duplicate or redundant indexes
 * - Suggested missing indexes based on query patterns
 * 
 * Generates an HTML report with recommendations for optimization.
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
  unusedIndexes: [],
  duplicateIndexes: [],
  suggestedIndexes: [],
  indexStats: [],
  summary: {
    totalIndexes: 0,
    unusedCount: 0,
    duplicateCount: 0,
    suggestedCount: 0,
    potentialSavings: 0
  }
};

async function analyzeUnusedIndexes() {
  console.log('Analyzing unused indexes...');
  
  const query = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND idx_scan = 0
      AND indexname NOT LIKE '%_pkey'
    ORDER BY pg_relation_size(indexrelid) DESC;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { p_query: query });
    
    if (error) {
      console.error('Error executing query:', error);
      return;
    }
    
    if (data && data.length > 0) {
      results.unusedIndexes = data;
      results.summary.unusedCount = data.length;
      
      // Calculate potential space savings
      let totalSize = 0;
      for (const idx of data) {
        const sizeMatch = idx.index_size.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)/i);
        if (sizeMatch) {
          const value = parseFloat(sizeMatch[1]);
          const unit = sizeMatch[2].toUpperCase();
          if (unit === 'KB') totalSize += value / 1024;
          else if (unit === 'MB') totalSize += value;
          else if (unit === 'GB') totalSize += value * 1024;
        }
      }
      results.summary.potentialSavings = totalSize;
    }
  } catch (error) {
    console.error('Error analyzing unused indexes:', error);
  }
}

async function analyzeDuplicateIndexes() {
  console.log('Analyzing duplicate indexes...');
  
  const query = `
    WITH index_columns AS (
      SELECT 
        i.tablename,
        i.indexname,
        array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary
      FROM pg_index ix
      JOIN pg_class t ON ix.indrelid = t.oid
      JOIN pg_class i ON ix.indexrelid = i.oid
      JOIN pg_namespace n ON i.relnamespace = n.oid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE n.nspname = 'public'
        AND t.relname LIKE 'erp_%'
      GROUP BY i.tablename, i.indexname, ix.indisunique, ix.indisprimary
    ),
    index_groups AS (
      SELECT 
        tablename,
        columns,
        is_unique,
        array_agg(indexname) as index_names,
        count(*) as count
      FROM index_columns
      WHERE NOT is_primary
      GROUP BY tablename, columns, is_unique
      HAVING count(*) > 1
    )
    SELECT 
      ig.tablename,
      ig.columns,
      ig.is_unique,
      ig.index_names,
      ig.count,
      pg_size_pretty(pg_relation_size(
        (SELECT oid FROM pg_class WHERE relname = ig.index_names[0])
      )) as total_size
    FROM index_groups ig
    ORDER BY ig.count DESC, ig.tablename;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { p_query: query });
    
    if (error) {
      console.error('Error executing query:', error);
      return;
    }
    
    if (data && data.length > 0) {
      results.duplicateIndexes = data;
      results.summary.duplicateCount = data.length;
    }
  } catch (error) {
    console.error('Error analyzing duplicate indexes:', error);
  }
}

async function analyzeIndexStats() {
  console.log('Analyzing index statistics...');
  
  const query = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
      round((idx_tup_read::float / NULLIF(idx_scan, 0))::numeric, 2) as avg_tuples_per_scan
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND tablename LIKE 'erp_%'
    ORDER BY idx_scan DESC;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { p_query: query });
    
    if (error) {
      console.error('Error executing query:', error);
      return;
    }
    
    if (data) {
      results.indexStats = data;
      results.summary.totalIndexes = data.length;
    }
  } catch (error) {
    console.error('Error analyzing index stats:', error);
  }
}

async function suggestMissingIndexes() {
  console.log('Suggesting missing indexes...');
  
  // Check for foreign key columns without indexes
  const fkQuery = `
    SELECT 
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name LIKE 'erp_%'
    EXCEPT
    SELECT 
      schemaname AS table_name,
      attname AS column_name,
      NULL AS foreign_table_name,
      NULL AS foreign_column_name
    FROM pg_index ix
    JOIN pg_class t ON ix.indrelid = t.oid
    JOIN pg_class i ON ix.indexrelid = i.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE n.nspname = 'public'
      AND t.relname LIKE 'erp_%'
      AND ix.indisunique = false;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { p_query: fkQuery });
    
    if (error) {
      console.error('Error executing FK query:', error);
      return;
    }
    
    if (data && data.length > 0) {
      results.suggestedIndexes = data.map(row => ({
        table: row.table_name,
        column: row.column_name,
        reason: 'Foreign key column without index',
        priority: 'high'
      }));
      results.summary.suggestedCount = data.length;
    }
  } catch (error) {
    console.error('Error suggesting missing indexes:', error);
  }
  
  // Check for commonly queried columns without indexes
  const commonQuery = `
    SELECT 
      schemaname,
      tablename,
      attname as column_name
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname LIKE 'erp_%'
      AND a.attname IN ('proyecto_id', 'created_by', 'estado', 'fecha_inicio', 'fecha_fin')
      AND a.attnum > 0
      AND NOT a.attisdropped
    EXCEPT
    SELECT 
      schemaname,
      tablename,
      attname as column_name
    FROM pg_index ix
    JOIN pg_class t ON ix.indrelid = t.oid
    JOIN pg_class i ON ix.indexrelid = i.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE n.nspname = 'public'
      AND t.relname LIKE 'erp_%';
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { p_query: commonQuery });
    
    if (error) {
      console.error('Error executing common query:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const commonSuggestions = data.map(row => ({
        table: row.tablename,
        column: row.column_name,
        reason: 'Commonly queried column without index',
        priority: 'medium'
      }));
      results.suggestedIndexes.push(...commonSuggestions);
      results.summary.suggestedCount += commonSuggestions.length;
    }
  } catch (error) {
    console.error('Error suggesting common indexes:', error);
  }
}

function generateHTMLReport() {
  const timestamp = new Date().toISOString();
  
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Index Optimization Report - CONSTRUSMART ERP</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1400px;
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
    .summary-card.unused {
      background: #dc3545;
      color: white;
    }
    .summary-card.duplicate {
      background: #ffc107;
      color: #333;
    }
    .summary-card.suggested {
      background: #17a2b8;
      color: white;
    }
    .summary-card.savings {
      background: #28a745;
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
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 13px;
    }
    .data-table th,
    .data-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .data-table th {
      background: #f8f9fa;
      font-weight: 600;
      position: sticky;
      top: 0;
    }
    .data-table tr:hover {
      background: #f5f5f5;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge.high {
      background: #dc3545;
      color: white;
    }
    .badge.medium {
      background: #ffc107;
      color: #333;
    }
    .badge.low {
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
    .recommendation {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .recommendation h4 {
      margin: 0 0 5px 0;
      color: #856404;
    }
    .recommendation p {
      margin: 0;
      color: #856404;
      font-size: 13px;
    }
    .sql-code {
      background: #f4f4f4;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow-x: auto;
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Index Optimization Report</h1>
    <p class="timestamp">Generated: ${timestamp}</p>
    
    <div class="summary">
      <div class="summary-card total">
        <h3>${results.summary.totalIndexes}</h3>
        <p>Total Indexes</p>
      </div>
      <div class="summary-card unused">
        <h3>${results.summary.unusedCount}</h3>
        <p>Unused Indexes</p>
      </div>
      <div class="summary-card duplicate">
        <h3>${results.summary.duplicateCount}</h3>
        <p>Duplicate Groups</p>
      </div>
      <div class="summary-card suggested">
        <h3>${results.summary.suggestedCount}</h3>
        <p>Suggested Indexes</p>
      </div>
      <div class="summary-card savings">
        <h3>${results.summary.potentialSavings.toFixed(2)} MB</h3>
        <p>Potential Savings</p>
      </div>
    </div>`;

  if (results.summary.unusedCount === 0 && 
      results.summary.duplicateCount === 0 && 
      results.summary.suggestedCount === 0) {
    html += `
    <div class="no-issues">
      <h2>✅ No Optimization Needed</h2>
      <p>All indexes are properly utilized. No unused, duplicate, or missing indexes detected.</p>
    </div>`;
  } else {
    if (results.unusedIndexes.length > 0) {
      html += `
    <div class="section">
      <h2>Unused Indexes (${results.unusedIndexes.length})</h2>
      <div class="recommendation">
        <h4>Recommendation</h4>
        <p>Consider dropping unused indexes to save storage and improve write performance. Review each index to ensure it's not needed for future queries.</p>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Index Name</th>
            <th>Size</th>
            <th>Scans</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>`;
      
      for (const idx of results.unusedIndexes) {
        html += `
          <tr>
            <td>${idx.tablename}</td>
            <td><code>${idx.indexname}</code></td>
            <td>${idx.index_size}</td>
            <td>${idx.idx_scan}</td>
            <td><div class="sql-code">DROP INDEX ${idx.indexname};</div></td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    if (results.duplicateIndexes.length > 0) {
      html += `
    <div class="section">
      <h2>Duplicate Indexes (${results.duplicateIndexes.length})</h2>
      <div class="recommendation">
        <h4>Recommendation</h4>
        <p>Duplicate indexes serve the same purpose on the same columns. Keep only one index per group to avoid redundancy.</p>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Columns</th>
            <th>Index Names</th>
            <th>Count</th>
            <th>Total Size</th>
          </tr>
        </thead>
        <tbody>`;
      
      for (const dup of results.duplicateIndexes) {
        html += `
          <tr>
            <td>${dup.tablename}</td>
            <td><code>${dup.columns.join(', ')}</code></td>
            <td>${dup.index_names.join(', ')}</td>
            <td>${dup.count}</td>
            <td>${dup.total_size}</td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    if (results.suggestedIndexes.length > 0) {
      html += `
    <div class="section">
      <h2>Suggested Indexes (${results.suggestedIndexes.length})</h2>
      <div class="recommendation">
        <h4>Recommendation</h4>
        <p>Consider adding indexes to improve query performance for commonly filtered columns and foreign keys.</p>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Column</th>
            <th>Reason</th>
            <th>Priority</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>`;
      
      for (const suggestion of results.suggestedIndexes) {
        html += `
          <tr>
            <td>${suggestion.table}</td>
            <td><code>${suggestion.column}</code></td>
            <td>${suggestion.reason}</td>
            <td><span class="badge ${suggestion.priority}">${suggestion.priority}</span></td>
            <td><div class="sql-code">CREATE INDEX idx_${suggestion.table}_${suggestion.column} ON ${suggestion.table}(${suggestion.column});</div></td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    if (results.indexStats.length > 0) {
      html += `
    <div class="section">
      <h2>Index Statistics (${results.indexStats.length})</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Index Name</th>
            <th>Scans</th>
            <th>Tuples Read</th>
            <th>Tuples Fetched</th>
            <th>Avg Tuples/Scan</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>`;
      
      for (const stat of results.indexStats) {
        html += `
          <tr>
            <td>${stat.tablename}</td>
            <td><code>${stat.indexname}</code></td>
            <td>${stat.idx_scan}</td>
            <td>${stat.idx_tup_read}</td>
            <td>${stat.idx_tup_fetch}</td>
            <td>${stat.avg_tuples_per_scan || 'N/A'}</td>
            <td>${stat.index_size}</td>
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
  const reportPath = join(__dirname, '..', 'index-optimization-report.html');
  
  writeFileSync(reportPath, html, 'utf8');
  console.log(`✅ Report generated: ${reportPath}`);
}

async function main() {
  console.log('=== Index Optimization Analysis ===\n');
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    await analyzeIndexStats();
    await analyzeUnusedIndexes();
    await analyzeDuplicateIndexes();
    await suggestMissingIndexes();
    
    console.log('\n=== Summary ===');
    console.log(`Total Indexes: ${results.summary.totalIndexes}`);
    console.log(`Unused Indexes: ${results.summary.unusedCount}`);
    console.log(`Duplicate Groups: ${results.summary.duplicateCount}`);
    console.log(`Suggested Indexes: ${results.summary.suggestedCount}`);
    console.log(`Potential Savings: ${results.summary.potentialSavings.toFixed(2)} MB`);
    
    await generateReport();
    
    console.log('\n✅ Index optimization analysis complete');
    
    if (results.summary.unusedCount > 0 || 
        results.summary.duplicateCount > 0 || 
        results.summary.suggestedCount > 0) {
      console.log(`⚠️  Found optimization opportunities - review the HTML report`);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
