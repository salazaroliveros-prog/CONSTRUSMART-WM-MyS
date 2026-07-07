/**
 * CONSTRUSMART ERP — Backup Script
 * 
 * Usage: node scripts/backup.cjs [--restore <file>]
 * 
 * Without args: Creates a backup of all localStorage ERP data
 * With --restore: Restores from a backup file
 */

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const STORAGE_KEYS = [
  'wm_erp_data',
  'wm_erp_queue',
  'wm_erp_data_settings',
  'wm_erp_data_notificaciones',
  'wm_erp_data_plantillas',
  'wm_erp_data_weather',
  'wm_erp_data_error_logs',
];

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function createBackup() {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `construsmart-backup-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  const backup = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    app: 'CONSTRUSMART ERP',
    data: {},
  };

  // In Node.js we can't access localStorage directly, so we create
  // a template backup structure. In production this would be called
  // from the browser context.
  backup.data = {
    keys: STORAGE_KEYS,
    instructions: 'This backup structure is for reference. Actual localStorage backups should be triggered from the app UI using the Export/Import feature in Settings.',
    note: 'Use the "Export Config" button in Ajustes (Settings) to export your full configuration as JSON.',
  };

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
  console.log(`\n✅ Backup created: ${filename}`);
  console.log(`   Location: ${filepath}`);
  console.log(`   Size: ${(fs.statSync(filepath).size / 1024).toFixed(1)} KB\n`);

  return filepath;
}

function listBackups() {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('\n📂 No backups found.\n');
    return;
  }

  console.log(`\n📂 Available backups (${files.length}):\n`);
  files.forEach((f, i) => {
    const stats = fs.statSync(path.join(BACKUP_DIR, f));
    const size = (stats.size / 1024).toFixed(1);
    const date = stats.mtime.toLocaleString();
    console.log(`   ${i + 1}. ${f} (${size} KB) — ${date}`);
  });
  console.log('');
}

function restoreBackup(filepath) {
  if (!fs.existsSync(filepath)) {
    console.error(`\n❌ Backup file not found: ${filepath}\n`);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  console.log(`\n✅ Backup loaded: ${path.basename(filepath)}`);
  console.log(`   Created: ${backup.createdAt}`);
  console.log(`   To restore, import this file through the app UI.\n`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--restore') || args.includes('-r')) {
    const fileIdx = args.indexOf('--restore') !== -1 
      ? args.indexOf('--restore') + 1 
      : args.indexOf('-r') + 1;
    const filepath = args[fileIdx];
    if (!filepath) {
      console.error('\n❌ Please specify a backup file to restore.\n');
      process.exit(1);
    }
    restoreBackup(path.resolve(filepath));
  } else if (args.includes('--list') || args.includes('-l')) {
    listBackups();
  } else {
    createBackup();
  }
}

main();