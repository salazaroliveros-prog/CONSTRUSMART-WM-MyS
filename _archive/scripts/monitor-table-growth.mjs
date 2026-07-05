/**
 * Phase 6.1: Monitor Table Growth
 * 
 * This script monitors table sizes and growth patterns in the Supabase database.
 * It alerts when tables exceed 100,000 rows and provides recommendations for partitioning.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ROW_THRESHOLD = 100000;
const SIZE_THRESHOLD_MB = 100;

async function monitorTableGrowth() {
  console.log('=== Table Growth Monitor ===\n');
  console.log(`Row threshold: ${ROW_THRESHOLD.toLocaleString()}`);
  console.log(`Size threshold: ${SIZE_THRESHOLD_MB} MB\n`);

  try {
    // Get table sizes
    const { data: tableSizes, error: sizeError } = await supabase.rpc('get_table_sizes');
    
    if (sizeError) {
      console.error('Error fetching table sizes:', sizeError);
      return;
    }

    if (!tableSizes || tableSizes.length === 0) {
      console.log('No table size data available');
      return;
    }

    console.log('Table Sizes:');
    console.log('─'.repeat(80));
    console.log('Table'.padEnd(40) + 'Rows'.padEnd(15) + 'Size (MB)'.padEnd(15) + 'Status');
    console.log('─'.repeat(80));

    let largeTables = [];
    let growingTables = [];

    for (const table of tableSizes) {
      const rowCount = parseInt(table.row_count || 0);
      const sizeMB = parseFloat(table.size_mb || 0);
      const status = rowCount > ROW_THRESHOLD || sizeMB > SIZE_THRESHOLD_MB ? '⚠️ ALERT' : '✅ OK';

      console.log(
        table.table_name.padEnd(40) +
        rowCount.toLocaleString().padEnd(15) +
        sizeMB.toFixed(2).padEnd(15) +
        status
      );

      if (rowCount > ROW_THRESHOLD) {
        largeTables.push({ ...table, reason: 'row_count' });
      }
      if (sizeMB > SIZE_THRESHOLD_MB) {
        growingTables.push({ ...table, reason: 'size' });
      }
    }

    console.log('\n' + '═'.repeat(80));

    // Alerts
    if (largeTables.length > 0) {
      console.log('\n⚠️  ALERT: Tables exceeding row threshold:');
      largeTables.forEach(table => {
        console.log(`  - ${table.table_name}: ${parseInt(table.row_count).toLocaleString()} rows`);
      });
    }

    if (growingTables.length > 0) {
      console.log('\n⚠️  ALERT: Tables exceeding size threshold:');
      growingTables.forEach(table => {
        console.log(`  - ${table.table_name}: ${parseFloat(table.size_mb).toFixed(2)} MB`);
      });
    }

    // Recommendations
    if (largeTables.length > 0 || growingTables.length > 0) {
      console.log('\n📋 Recommendations:');
      console.log('  1. Consider partitioning large tables by date or project_id');
      console.log('  2. Archive old data to separate tables');
      console.log('  3. Review and optimize indexes');
      console.log('  4. Implement data retention policies');
    } else {
      console.log('\n✅ All tables are within acceptable limits');
    }

    // Get row count trends (if available)
    console.log('\n' + '═'.repeat(80));
    console.log('Row Count Trends (Top 10 tables by size):');
    console.log('─'.repeat(80));

    const topTables = tableSizes
      .sort((a, b) => parseFloat(b.size_mb || 0) - parseFloat(a.size_mb || 0))
      .slice(0, 10);

    for (const table of topTables) {
      console.log(`  ${table.table_name}: ${parseInt(table.row_count || 0).toLocaleString()} rows`);
    }

  } catch (error) {
    console.error('Error monitoring table growth:', error);
  }
}

// Run the monitor
monitorTableGrowth()
  .then(() => {
    console.log('\n✅ Table growth monitoring complete');
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
