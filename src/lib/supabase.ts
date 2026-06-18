import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env?.VITE_SUPABASE_URL ?? '') as string;
const rawKey = (import.meta.env?.VITE_SUPABASE_KEY ?? '') as string;

const supabaseUrl = rawUrl.trim();
const supabaseKey = rawKey.trim();

export const hasSupabase = Boolean(supabaseUrl && supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_KEY is not configured. Runtime Supabase calls will fail until these env vars are set.');
}

// Create the Supabase client in a way that is safe for SSR builds
// and that explicitly uses browser localStorage when available so
// the PKCE code verifier is persisted across redirects.
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

export function assertSupabase(): SupabaseClient {
  if (!hasSupabase || !supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase is not configured. Define VITE_SUPABASE_URL and VITE_SUPABASE_KEY.'
    );
  }
  return supabase;
}
