import pg from 'pg';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  platform: string;
  status: 'pass' | 'fail' | 'warning';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: string;
  }>;
  timestamp: string;
}

const results: ValidationResult[] = [];

function addResult(platform: string, status: 'pass' | 'fail' | 'warning', checks: ValidationResult['checks']) {
  results.push({
    platform,
    status,
    checks,
    timestamp: new Date().toISOString()
  });
}

function runCommand(cmd: string, cwd?: string): { stdout: string; stderr: string; code: number } {
  try {
    const output = execSync(cmd, { 
      cwd: cwd || process.cwd(),
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 60000
    });
    return { stdout: output, stderr: '', code: 0 };
  } catch (err: any) {
    return { 
      stdout: err.stdout || '', 
      stderr: err.stderr || err.message, 
      code: err.status || 1 
    };
  }
}

async function validateGitHub() {
  console.log('\n🔍 Validating GitHub Repository...');
  const checks = [];

  // Check git status
  const gitStatus = runCommand('git status --porcelain');
  if (gitStatus.code === 0) {
    const uncommitted = gitStatus.stdout.trim().split('\n').filter(l => l).length;
    if (uncommitted === 0) {
      checks.push({ name: 'Clean Working Tree', status: 'pass', message: 'No uncommitted changes' });
    } else {
      checks.push({ name: 'Clean Working Tree', status: 'warning', message: `${uncommitted} uncommitted files`, details: gitStatus.stdout });
    }
  }

  // Check current branch
  const branch = runCommand('git branch --show-current');
  if (branch.code === 0) {
    checks.push({ name: 'Current Branch', status: 'pass', message: `On branch: ${branch.stdout.trim()}` });
  }

  // Check remote
  const remote = runCommand('git remote -v');
  if (remote.code === 0 && remote.stdout.includes('github.com')) {
    checks.push({ name: 'GitHub Remote', status: 'pass', message: 'GitHub remote configured' });
  }

  // Check workflow files
  const workflows = runCommand('ls -la .github/workflows/');
  if (workflows.code === 0) {
    const wfCount = workflows.stdout.split('\n').filter(l => l.includes('.yml') || l.includes('.yaml')).length;
    checks.push({ name: 'GitHub Actions Workflows', status: 'pass', message: `${wfCount} workflow files found` });
  }

  // Check last commit
  const lastCommit = runCommand('git log -1 --oneline');
  if (lastCommit.code === 0) {
    checks.push({ name: 'Latest Commit', status: 'pass', message: lastCommit.stdout.trim() });
  }

  const hasFailures = checks.some(c => c.status === 'fail');
  addResult('GitHub', hasFailures ? 'fail' : 'pass', checks);
}

async function validateSupabase() {
  console.log('\n🔍 Validating Supabase...');
  const checks = [];

  // Remote Supabase connectivity via REST API
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY || '';

  if (supabaseUrl && supabaseKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const healthUrl = supabaseUrl.replace(/\/$/, '') + '/rest/v1/';
      const res = await fetch(healthUrl, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      checks.push({ name: 'Supabase REST API', status: res.ok ? 'pass' : 'fail', message: res.ok ? 'API reachable' : `HTTP ${res.status}` });
    } catch (err: any) {
      checks.push({ name: 'Supabase REST API', status: 'warning', message: 'Remote check skipped or failed', details: err.message });
    }
  } else {
    checks.push({ name: 'Supabase REST API', status: 'warning', message: 'Missing VITE_SUPABASE_URL / key for remote validation' });
  }

  // Check migrations
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    checks.push({ name: 'Migrations', status: 'pass', message: `${files.length} migration files`, details: files.slice(-5).join(', ') });
  }

  addResult('Supabase', checks.some(c => c.status === 'fail') ? 'fail' : 'pass', checks);
}

async function validateVercel() {
  console.log('\n🔍 Validating Vercel...');
  const checks = [];

  const vercelToken = process.env.VERCEL_TOKEN || process.env.VERCEL_OIDC_TOKEN || '';

  if (!vercelToken) {
    checks.push({ name: 'Vercel Token', status: 'warning', message: 'No VERCEL_TOKEN / OIDC token in environment' });
  } else {
    checks.push({ name: 'Vercel Token', status: 'pass', message: 'Token present' });
  }

  const vercelConfig = path.join(process.cwd(), '.vercel', 'project.json');
  if (fs.existsSync(vercelConfig)) {
    const config = JSON.parse(fs.readFileSync(vercelConfig, 'utf-8'));
    checks.push({ name: 'Project Config', status: 'pass', message: config.projectName || 'unknown', details: `ID: ${config.projectId || '-'}` });
  } else {
    checks.push({ name: 'Project Config', status: 'warning', message: 'Missing .vercel/project.json' });
  }

  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    checks.push({ name: 'Build Output (dist/)', status: 'pass', message: `${files.length} files` });
  } else {
    checks.push({ name: 'Build Output (dist/)', status: 'warning', message: 'Missing dist/ - run build first' });
  }

  addResult('Vercel', checks.some(c => c.status === 'fail') ? 'fail' : 'pass', checks);
}

async function validateBuildAndTests() {
  console.log('\n🔍 Validating Build & Tests...');
  const checks = [];

  // TypeScript check
  const tsc = runCommand('npx tsc --noEmit');
  if (tsc.code === 0) {
    checks.push({ name: 'TypeScript Compilation', status: 'pass', message: 'No type errors' });
  } else {
    checks.push({ name: 'TypeScript Compilation', status: 'fail', message: 'Type errors found', details: tsc.stderr });
  }

  // Lint check
  const lint = runCommand('npm run lint 2>&1');
  if (lint.code === 0) {
    checks.push({ name: 'ESLint', status: 'pass', message: 'No linting errors' });
  } else {
    // Check if only warnings
    const hasErrors = lint.stderr.includes('error') || lint.stdout.includes('error');
    checks.push({ name: 'ESLint', status: hasErrors ? 'fail' : 'warning', message: hasErrors ? 'Errors found' : 'Warnings only', details: lint.stdout });
  }

  // Test suite
  const test = runCommand('npm test -- --run 2>&1');
  if (test.code === 0) {
    const passMatch = test.stdout.match(/(\d+)\s+pass/);
    const failMatch = test.stdout.match(/(\d+)\s+fail/);
    const passes = passMatch ? passMatch[1] : '?';
    const fails = failMatch ? failMatch[1] : '0';
    checks.push({ name: 'Test Suite', status: fails === '0' ? 'pass' : 'fail', message: `${passes} passed, ${fails} failed` });
  } else {
    checks.push({ name: 'Test Suite', status: 'fail', message: 'Tests failed', details: test.stdout.slice(-2000) });
  }

  // Build
  const build = runCommand('npm run build 2>&1');
  if (build.code === 0) {
    checks.push({ name: 'Production Build', status: 'pass', message: 'Build successful' });
  } else {
    checks.push({ name: 'Production Build', status: 'fail', message: 'Build failed', details: build.stderr.slice(-2000) });
  }

  addResult('Build & Tests', checks.some(c => c.status === 'fail') ? 'fail' : 'pass', checks);
}

async function validateMigrationIntegrity() {
  console.log('\n🔍 Validating Migration Integrity...');
  const checks = [];

  // Check for duplicate migration files
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    
    // Check for duplicate table creations
    const tableCreations = new Map<string, string[]>();
    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const matches = content.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/gi);
      if (matches) {
        for (const match of matches) {
          const table = match.replace(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?/i, '').trim().split(' ')[0];
          if (!tableCreations.has(table)) tableCreations.set(table, []);
          tableCreations.get(table)!.push(file);
        }
      }
    }

    let duplicateCount = 0;
    for (const [table, filesList] of tableCreations) {
      if (filesList.length > 1) {
        duplicateCount++;
        checks.push({ name: `Duplicate: ${table}`, status: 'warning', message: `Created in ${filesList.length} migrations`, details: filesList.join(', ') });
      }
    }

    if (duplicateCount === 0) {
      checks.push({ name: 'Migration Duplicates', status: 'pass', message: 'No duplicate table creations' });
    } else {
      checks.push({ name: 'Migration Duplicates', status: 'warning', message: `${duplicateCount} tables created in multiple migrations` });
    }

    checks.push({ name: 'Total Migrations', status: 'pass', message: `${files.length} migration files` });
  }

  addResult('Migrations', checks.some(c => c.status === 'fail') ? 'fail' : 'pass', checks);
}

async function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 DEPLOYMENT VALIDATION REPORT');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Repository: construsmart-wm2026`);
  console.log('');

  let allPass = true;
  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.platform}: ${result.status.toUpperCase()}`);
    for (const check of result.checks) {
      const checkIcon = check.status === 'pass' ? '  ✓' : check.status === 'fail' ? '  ✗' : '  ⚠';
      console.log(`${checkIcon} ${check.name}: ${check.message}`);
      if (check.details && check.status !== 'pass') {
        console.log(`    Details: ${check.details.slice(0, 200)}`);
      }
    }
    if (result.status === 'fail') allPass = false;
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`Overall: ${allPass ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);
  console.log('='.repeat(60));

  // Write JSON report
  const reportPath = path.join(process.cwd(), 'deployment-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), results, overall: allPass ? 'pass' : 'fail' }, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);

  return allPass;
}

async function main() {
  console.log('🚀 Starting Deployment Pipeline Validation');
  console.log('============================================');

  await validateGitHub();
  await validateSupabase();
  await validateVercel();
  await validateBuildAndTests();
  await validateMigrationIntegrity();

  const success = await generateReport();
  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});