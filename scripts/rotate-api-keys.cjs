/**
 * CONSTRUSMART ERP — API Key Rotation Script
 * 
 * Usage: node scripts/rotate-api-keys.cjs
 * 
 * Reads .env, generates new API keys, creates backup of old keys,
 * and updates .env with new values.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE_PATH = path.join(__dirname, '..', '.env.example');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'keys');

function generateKey(prefix = 'wm', length = 32) {
  const random = crypto.randomBytes(length).toString('hex');
  return `${prefix}_${random}`;
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function backupOldKeys(envContent) {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `api-keys-backup-${timestamp}.env`;
  const filepath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filepath, envContent);
  console.log(`  Backup saved: ${filename}`);
  return filepath;
}

function rotateKeys() {
  console.log('\n🔄 CONSTRUSMART ERP — API Key Rotation\n');

  if (!fs.existsSync(ENV_PATH)) {
    console.log('  No .env file found. Creating from .env.example...');
    if (fs.existsSync(ENV_EXAMPLE_PATH)) {
      fs.copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
      console.log('  .env created from .env.example');
    } else {
      console.error('  No .env or .env.example found. Creating minimal .env...');
      fs.writeFileSync(ENV_PATH, '# CONSTRUSMART ERP Environment Variables\n');
    }
  }

  let envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  const oldContent = envContent;

  // Backup old keys
  console.log('  Backing up current keys...');
  backupOldKeys(oldContent);

  // Rotate keys
  const keyPatterns = [
    { search: /^VITE_SUPABASE_ANON_KEY=.*/m, replace: `VITE_SUPABASE_ANON_KEY=${generateKey('supabase_anon')}` },
    { search: /^SUPABASE_SERVICE_ROLE_KEY=.*/m, replace: `SUPABASE_SERVICE_ROLE_KEY=${generateKey('supabase_service')}` },
    { search: /^VITE_ADMIN_EMAIL=.*/m, replace: `VITE_ADMIN_EMAIL=admin@construsmart.gt` },
    { search: /^VITE_WEATHER_API_KEY=.*/m, replace: `VITE_WEATHER_API_KEY=${generateKey('weather', 16)}` },
  ];

  let changes = 0;
  for (const pattern of keyPatterns) {
    if (pattern.search.test(envContent)) {
      envContent = envContent.replace(pattern.search, pattern.replace);
      changes++;
    } else {
      // Key doesn't exist, append it
      envContent += `\n${pattern.replace}`;
      changes++;
    }
  }

  fs.writeFileSync(ENV_PATH, envContent);
  console.log(`  Rotated ${changes} keys`);
  console.log('\n✅ Key rotation complete!');
  console.log('  Old keys backed up to: backups/keys/\n');
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('\nUsage: node scripts/rotate-api-keys.cjs');
    console.log('  Rotates API keys in .env file with backups\n');
    return;
  }

  if (args.includes('--restore') || args.includes('-r')) {
    const fileIdx = args.indexOf('--restore') !== -1 
      ? args.indexOf('--restore') + 1 
      : args.indexOf('-r') + 1;
    const filepath = args[fileIdx];
    if (!filepath) {
      console.error('\n❌ Please specify a backup file to restore.\n');
      process.exit(1);
    }
    const fullPath = path.resolve(filepath);
    if (!fs.existsSync(fullPath)) {
      console.error(`\n❌ Backup file not found: ${fullPath}\n`);
      process.exit(1);
    }
    const backupContent = fs.readFileSync(fullPath, 'utf-8');
    fs.writeFileSync(ENV_PATH, backupContent);
    console.log(`\n✅ Keys restored from: ${path.basename(filepath)}\n`);
    return;
  }

  rotateKeys();
}

main();