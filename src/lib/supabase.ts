import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

export const hasSupabase = Boolean(supabaseUrl && supabaseKey);

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
