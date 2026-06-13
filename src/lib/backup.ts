import { safeLogger } from '@/lib/safeLogger';

const BACKUP_KEY = 'wm_erp_backup_last_run';
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface BackupData {
  timestamp: string;
  version: string;
  entities: Record<string, unknown>;
  settings: unknown;
}

export function shouldRunBackup(): boolean {
  const last = localStorage.getItem(BACKUP_KEY);
  if (!last) return true;
  return Date.now() - parseInt(last, 10) > BACKUP_INTERVAL_MS;
}

export function markBackupRun(): void {
  localStorage.setItem(BACKUP_KEY, String(Date.now()));
}

export function collectBackupData(
  entityData: Record<string, unknown[]>,
  settings?: unknown
): BackupData {
  return {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    entities: entityData,
    settings: settings || null,
  };
}

export function downloadBackup(data: BackupData): void {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `construsmart-backup-${data.timestamp.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    markBackupRun();
    safeLogger.log(`[Backup] Backup descargado: ${data.timestamp}`);
  } catch (err) {
    safeLogger.warn('[Backup] Error al descargar:', err);
  }
}

export function restoreFromBackup(json: string): BackupData | null {
  try {
    const data = JSON.parse(json) as BackupData;
    if (!data.timestamp || !data.entities) {
      safeLogger.warn('[Backup] Formato de backup inválido');
      return null;
    }
    return data;
  } catch {
    safeLogger.warn('[Backup] Error al parsear backup');
    return null;
  }
}

export function exportToCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string
): void {
  const BOM = '\ufeff';
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => {
      const str = String(cell ?? '');
      return str.includes(';') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(';'))
  ].join('\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}