import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { safeLogger } from './safeLogger';

const rawUrl = (import.meta.env?.VITE_SUPABASE_URL ?? '') as string;
const rawKey = (import.meta.env?.VITE_SUPABASE_KEY ?? '') as string;

const supabaseUrl = rawUrl.trim();
const supabaseKey = rawKey.trim();

export const hasSupabase = Boolean(supabaseUrl && supabaseKey);
export const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : 'local';

if (!supabaseUrl || !supabaseKey) {
  if (typeof window !== 'undefined') {
    try {
      safeLogger.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_KEY not configured. Offline mode.');
    } catch (e) {
      console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_KEY not configured. Offline mode.');
    }
  }
}

let _supabase: SupabaseClient;
if (!supabaseUrl) {
  try {
    safeLogger.warn('[supabase] VITE_SUPABASE_URL not configured. Offline mode (no client).');
  } catch (e) {
    console.warn('[supabase] VITE_SUPABASE_URL not configured. Offline mode (no client).');
  }
} else if (typeof window !== 'undefined') {
  _supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage satisfies Storage,
    },
  });
} else {
  _supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { flowType: 'pkce', autoRefreshToken: true },
  });
}

export const supabase: SupabaseClient = _supabase;

export function assertSupabase(): SupabaseClient {
  if (!hasSupabase || !supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase is not configured. Define VITE_SUPABASE_URL and VITE_SUPABASE_KEY.'
    );
  }
  return supabase;
}

export async function getEffectiveClient(): Promise<SupabaseClient> {
  if (hasSupabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return supabase;
  }
  return assertSupabase();
}
