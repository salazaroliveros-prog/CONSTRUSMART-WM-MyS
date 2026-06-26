#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnvFile();

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const match = url.match(/https:\/\/(.+)\.supabase\.co/);
if (!match) {
  console.error('Could not parse project ref from URL');
  process.exit(1);
}

const projectRef = match[1];
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `backup-${projectRef}-${timestamp}.sql`;
const outPath = path.join(process.cwd(), 'backups', filename);

fs.mkdirSync(path.join(process.cwd(), 'backups'), { recursive: true });

console.log(`Creating backup: ${filename}`);
console.log('Use Supabase CLI to download the backup:');
console.log(`  supabase projects list`);
console.log(`  supabase db dump --linked -f "${outPath}"`);
console.log('');
console.log('Or download from Supabase Dashboard:');
console.log(`  https://supabase.com/dashboard/project/${projectRef}/database/backups`);
