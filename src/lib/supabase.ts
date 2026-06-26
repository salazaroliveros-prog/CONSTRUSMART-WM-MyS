import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env?.VITE_SUPABASE_URL ?? '') as string;
const rawKey = (import.meta.env?.VITE_SUPABASE_KEY ?? '') as string;
const rawServiceKey = (import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY ?? '') as string;

const supabaseUrl = rawUrl.trim();
const supabaseKey = rawKey.trim();
const supabaseServiceKey = rawServiceKey.trim();

export const hasSupabase = Boolean(supabaseUrl && supabaseKey);
export const hasServiceRole = Boolean(supabaseUrl && supabaseServiceKey);

if (!supabaseUrl || !supabaseKey) {
  if (typeof window !== 'undefined') {
    console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_KEY not configured. Offline mode.');
  }
}

// Create the primary Supabase client with anon key (RLS-enforced, session-based)
let _supabase: SupabaseClient;
if (typeof window !== 'undefined') {
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

// Service-role client (bypasses RLS — for sync operations only, never exposed to user UI)
let _serviceClient: SupabaseClient | null = null;
if (hasServiceRole) {
  _serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getServiceClient(): SupabaseClient {
  if (!_serviceClient) throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY not configured');
  return _serviceClient;
}

export function assertSupabase(): SupabaseClient {
  if (!hasSupabase || !supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase is not configured. Define VITE_SUPABASE_URL and VITE_SUPABASE_KEY.'
    );
  }
  return supabase;
}
