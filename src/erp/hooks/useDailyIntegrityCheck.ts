import { useEffect } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';
import { safeLogger } from '@/lib/safeLogger';

const STORAGE_KEY = 'construsmart_last_integrity_check';
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

export function useDailyIntegrityCheck(isAdmin: boolean) {
  useEffect(() => {
    if (!isAdmin || !hasSupabase) return;

    const lastRun = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - lastRun < INTERVAL_MS) return;

    const run = async () => {
      try {
        const { data, error } = await supabase.rpc('fn_daily_integrity_check');
        if (error) { safeLogger.warn('[IntegrityCheck] RPC error:', error.message); return; }
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        if (data?.issues_count > 0) {
          safeLogger.warn('[IntegrityCheck] Issues found:', data);
        } else {
          safeLogger.log('[IntegrityCheck] All checks passed');
        }
      } catch (e) {
        safeLogger.warn('[IntegrityCheck] Unexpected error:', e);
      }
    };

    // Delay 10s after mount to avoid blocking initial load
    const timer = setTimeout(run, 10_000);
    return () => clearTimeout(timer);
  }, [isAdmin]);
}
