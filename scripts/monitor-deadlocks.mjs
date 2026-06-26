/**
 * MEDIUM-7: Script de Monitoreo de Deadlocks
 * 
 * This script monitors deadlock events in the Supabase database:
 * - Queries erp_audit_log for deadlock events
 * - Generates a report of deadlocks in the last period (7 days)
 * - Identifies patterns of deadlock (tables, operations, frequency)
 * - Provides recommendations for prevention
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
  deadlockEvents: [],
  patterns: {
    byTable: {},
    byOperation: {},
    byHour: {},
    byDay: {}
  },
  summary: {
    totalDeadlocks: 0,
    last7Days: 0,
    last24Hours: 0,
    mostAffectedTable: null,
    mostFrequentOperation: null,
    peakHour: null
  }
};

async function queryDeadlockEvents(days = 7) {
  console.log(`Querying deadlock events from last ${days} days...`);
  
  const query = `
    SELECT 
      id,
      table_name,
      operation,
      old_data,
      new_data,
      changed_by,
      changed_at
    FROM erp_audit_log
    WHERE table_name = 'deadlock_events'
      OR (new_data::text LIKE '%deadlock%' OR old_data::text LIKE '%deadlock%')
      OR operation = 'DEADLOCK'
      AND changed_at >= NOW() - INTERVAL '${days} days'
    ORDER BY changed_at DESC;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { p_query: query });
    
    if (error) {
      console.error('Error executing query:', error);
      return;
    }
    
    if (data && data.length > 0) {
      results.deadlockEvents = data;
      results.summary.totalDeadlocks = data.length;
    } else {
      // Try alternative query using log_deadlock_event function
      console.log('No deadlock events found with primary query, trying alternative...');
      await queryDeadlockEventsAlternative(days);
    }
  } catch (error) {
    console.error('Error querying deadlock events:', error);
  }
}

async function queryDeadlockEventsAlternative(days = 7) {
  // Query the log_deadlock_event function usage
  const query = `
    SELECT 
      al.id,
      al.table_name,
      al.operation,
      al.old_data,
      al.new_data,
      al.changed_by,
      al.changed_at
    FROM erp_audit_log al
    WHERE al.changed_at >= NOW() - INTERVAL '${days} days'
      AND (
        al.table_name IN (
          SELECT DISTINCT table_name 
          FROM erp_audit_log 
          WHERE new_data::text ILIKE '%deadlock%'
             OR old_data::text ILIKE '%deadlock%'
        )
        OR al.operation = 'ERROR'
        OR al.operation = 'ROLLBACK'
      )
    ORDER BY al.changed_at DESC
    LIMIT 1000;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { p_query: query });
    
    if (error) {
      console.error('Error executing alternative query:', error);
      return;
    }
    
    if (data && data.length > 0) {
      results.deadlockEvents = data;
      results.summary.totalDeadlocks = data.length;
    }
  } catch (error) {
    console.error('Error querying alternative deadlock events:', error);
  }
}

async function analyzePatterns() {
  console.log('Analyzing deadlock patterns...');
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  for (const event of results.deadlockEvents) {
    const eventDate = new Date(event.changed_at);
    
    // Count by time period
    if (eventDate >= sevenDaysAgo) {
      results.summary.last7Days++;
    }
    if (eventDate >= twentyFourHoursAgo) {
      results.summary.last24Hours++;
    }
    
    // Count by table
    const tableName = event.table_name || 'unknown';
    results.patterns.byTable[tableName] = (results.patterns.byTable[tableName] || 0) + 1;
    
    // Count by operation
    const operation = event.operation || 'unknown';
    results.patterns.byOperation[operation] = (results.patterns.byOperation[operation] || 0) + 1;
    
    // Count by hour
    const hour = eventDate.getHours();
    results.patterns.byHour[hour] = (results.patterns.byHour[hour] || 0) + 1;
    
    // Count by day
    const day = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
    results.patterns.byDay[day] = (results.patterns.byDay[day] || 0) + 1;
  }
  
  // Find most affected table
  let maxTableCount = 0;
  for (const [table, count] of Object.entries(results.patterns.byTable)) {
    if (count > maxTableCount) {
      maxTableCount = count;
      results.summary.mostAffectedTable = table;
    }
  }
  
  // Find most frequent operation
  let maxOpCount = 0;
  for (const [op, count] of Object.entries(results.patterns.byOperation)) {
    if (count > maxOpCount) {
      maxOpCount = count;
      results.summary.mostFrequentOperation = op;
    }
  }
  
  // Find peak hour
  let maxHourCount = 0;
  for (const [hour, count] of Object.entries(results.patterns.byHour)) {
    if (count > maxHourCount) {
      maxHourCount = count;
      results.summary.peakHour = hour;
    }
  }
}

async function logCriticalDeadlocks() {
  console.log('Logging critical deadlocks to database...');
  
  if (results.summary.last24Hours > 5) {
    const errorMessage = `High deadlock rate detected: ${results.summary.last24Hours} deadlocks in last 24 hours`;
    const context = JSON.stringify({
      summary: results.summary,
      patterns: results.patterns
    });

    try {
      const { error } = await supabase.rpc('log_error', {
        p_error_message: errorMessage,
        p_error_code: 'HIGH_DEADLOCK_RATE',
        p_error_type: 'database',
        p_severity: 'critical',
        p_component: 'monitor-deadlocks',
        p_function_name: 'main',
        p_context: context
      });

      if (error) {
        console.error('Error logging to database:', error);
      } else {
        console.log('✅ Critical deadlock rate logged to database');
      }
    } catch (error) {
      console.error('Error logging to database:', error);
    }
  }
}

function generateHTMLReport() {
  const timestamp = new Date().toISOString();
  
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deadlock Monitoring Report - CONSTRUSMART ERP</title>
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
    .summary-card.last7days {
      background: #17a2b8;
      color: white;
    }
    .summary-card.last24hours {
      background: #ffc107;
      color: #333;
    }
    .summary-card.table {
      background: #28a745;
      color: white;
    }
    .summary-card.operation {
      background: #6f42c1;
      color: white;
    }
    .summary-card.peak {
      background: #fd7e14;
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
    .chart-bar {
      background: #007bff;
      height: 20px;
      border-radius: 3px;
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Deadlock Monitoring Report</h1>
    <p class="timestamp">Generated: ${timestamp}</p>
    
    <div class="summary">
      <div class="summary-card total">
        <h3>${results.summary.totalDeadlocks}</h3>
        <p>Total Deadlocks</p>
      </div>
      <div class="summary-card.last7days">
        <h3>${results.summary.last7Days}</h3>
        <p>Last 7 Days</p>
      </div>
      <div class="summary-card.last24hours">
        <h3>${results.summary.last24Hours}</h3>
        <p>Last 24 Hours</p>
      </div>
      <div class="summary-card.table">
        <h3>${results.summary.mostAffectedTable || 'N/A'}</h3>
        <p>Most Affected Table</p>
      </div>
      <div class="summary-card.operation">
        <h3>${results.summary.mostFrequentOperation || 'N/A'}</h3>
        <p>Most Frequent Operation</p>
      </div>
      <div class="summary-card.peak">
        <h3>${results.summary.peakHour ? results.summary.peakHour + ':00' : 'N/A'}</h3>
        <p>Peak Hour</p>
      </div>
    </div>`;

  if (results.summary.totalDeadlocks === 0) {
    html += `
    <div class="no-issues">
      <h2>✅ No Deadlocks Detected</h2>
      <p>No deadlock events found in the audit log. The database is operating normally.</p>
    </div>`;
  } else {
    if (results.summary.last24Hours > 5) {
      html += `
    <div class="recommendation">
      <h4>⚠️ Critical Alert</h4>
      <p>High deadlock rate detected: ${results.summary.last24Hours} deadlocks in the last 24 hours. Consider reviewing transaction isolation levels and advisory lock usage.</p>
    </div>`;
    }

    if (Object.keys(results.patterns.byTable).length > 0) {
      html += `
    <div class="section">
      <h2>Deadlocks by Table</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>`;
      
      const sortedTables = Object.entries(results.patterns.byTable).sort((a, b) => b[1] - a[1]);
      for (const [table, count] of sortedTables) {
        const percentage = ((count / results.summary.totalDeadlocks) * 100).toFixed(1);
        html += `
          <tr>
            <td><code>${table}</code></td>
            <td>${count}</td>
            <td>
              <div class="chart-bar" style="width: ${percentage}%"></div>
              ${percentage}%
            </td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    if (Object.keys(results.patterns.byOperation).length > 0) {
      html += `
    <div class="section">
      <h2>Deadlocks by Operation</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Operation</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>`;
      
      const sortedOps = Object.entries(results.patterns.byOperation).sort((a, b) => b[1] - a[1]);
      for (const [op, count] of sortedOps) {
        const percentage = ((count / results.summary.totalDeadlocks) * 100).toFixed(1);
        html += `
          <tr>
            <td><code>${op}</code></td>
            <td>${count}</td>
            <td>
              <div class="chart-bar" style="width: ${percentage}%"></div>
              ${percentage}%
            </td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    if (Object.keys(results.patterns.byHour).length > 0) {
      html += `
    <div class="section">
      <h2>Deadlocks by Hour of Day</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Hour</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>`;
      
      const sortedHours = Object.entries(results.patterns.byHour).sort((a, b) => b[1] - a[1]);
      for (const [hour, count] of sortedHours) {
        const percentage = ((count / results.summary.totalDeadlocks) * 100).toFixed(1);
        html += `
          <tr>
            <td>${hour}:00</td>
            <td>${count}</td>
            <td>
              <div class="chart-bar" style="width: ${percentage}%"></div>
              ${percentage}%
            </td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    if (Object.keys(results.patterns.byDay).length > 0) {
      html += `
    <div class="section">
      <h2>Deadlocks by Day of Week</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>`;
      
      const sortedDays = Object.entries(results.patterns.byDay).sort((a, b) => b[1] - a[1]);
      for (const [day, count] of sortedDays) {
        const percentage = ((count / results.summary.totalDeadlocks) * 100).toFixed(1);
        html += `
          <tr>
            <td>${day}</td>
            <td>${count}</td>
            <td>
              <div class="chart-bar" style="width: ${percentage}%"></div>
              ${percentage}%
            </td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    if (results.deadlockEvents.length > 0) {
      html += `
    <div class="section">
      <h2>Recent Deadlock Events (Last 20)</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Table</th>
            <th>Operation</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody>`;
      
      for (const event of results.deadlockEvents.slice(0, 20)) {
        html += `
          <tr>
            <td>${new Date(event.changed_at).toLocaleString()}</td>
            <td><code>${event.table_name || 'N/A'}</code></td>
            <td>${event.operation || 'N/A'}</td>
            <td>${event.changed_by || 'N/A'}</td>
          </tr>`;
      }
      
      html += `
        </tbody>
      </table>
    </div>`;
    }

    html += `
    <div class="section">
      <h2>Recommendations</h2>
      <div class="recommendation">
        <h4>Transaction Isolation Levels</h4>
        <p>Review transaction isolation levels. Consider using READ COMMITTED instead of SERIALIZABLE when appropriate.</p>
      </div>
      <div class="recommendation">
        <h4>Advisory Locks</h4>
        <p>Use advisory locks for critical operations. The withAdvisoryLock() function in src/lib/transaction-retry.ts can help prevent deadlocks.</p>
      </div>
      <div class="recommendation">
        <h4>Transaction Order</h4>
        <p>Ensure transactions access tables in a consistent order to reduce deadlock likelihood.</p>
      </div>
      <div class="recommendation">
        <h4>Keep Transactions Short</h4>
        <p>Minimize the duration of transactions to reduce the window for deadlocks.</p>
      </div>
      <div class="recommendation">
        <h4>Retry Logic</h4>
        <p>The transaction-retry.ts module already implements exponential backoff with jitter for deadlock recovery. Ensure it's being used for all critical operations.</p>
      </div>
    </div>`;
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
  const reportPath = join(__dirname, '..', 'deadlock-monitoring-report.html');
  
  writeFileSync(reportPath, html, 'utf8');
  console.log(`✅ Report generated: ${reportPath}`);
}

async function main() {
  console.log('=== Deadlock Monitoring ===\n');
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    await queryDeadlockEvents(7);
    await analyzePatterns();
    
    console.log('\n=== Summary ===');
    console.log(`Total Deadlocks: ${results.summary.totalDeadlocks}`);
    console.log(`Last 7 Days: ${results.summary.last7Days}`);
    console.log(`Last 24 Hours: ${results.summary.last24Hours}`);
    console.log(`Most Affected Table: ${results.summary.mostAffectedTable || 'N/A'}`);
    console.log(`Most Frequent Operation: ${results.summary.mostFrequentOperation || 'N/A'}`);
    console.log(`Peak Hour: ${results.summary.peakHour ? results.summary.peakHour + ':00' : 'N/A'}`);
    
    await logCriticalDeadlocks();
    await generateReport();
    
    console.log('\n✅ Deadlock monitoring complete');
    
    if (results.summary.last24Hours > 5) {
      console.log(`⚠️  High deadlock rate detected - review the HTML report`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
